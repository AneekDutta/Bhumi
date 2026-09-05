import uuid
import time
import logging
import json
from datetime import datetime
from starlette.types import ASGIApp, Receive, Scope, Send, Message
from starlette.responses import JSONResponse
from app.core.config import settings
from app.core.security import rate_limiter

logger = logging.getLogger("security_audit")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(message)s'))
if not logger.handlers:
    logger.addHandler(handler)

class RequestIdMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
            
        request_id = str(uuid.uuid4())
        scope["request_id"] = request_id
        
        async def send_wrapper(message: Message):
            if message["type"] == "http.response.start":
                from starlette.datastructures import MutableHeaders
                headers = MutableHeaders(scope=message)
                headers.append("X-Request-ID", request_id)
            await send(message)
            
        await self.app(scope, receive, send_wrapper)


class GlobalSecurityMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        request_id = scope.get("request_id", str(uuid.uuid4()))
        client_ip = scope.get("client", ("0.0.0.0", 0))[0]
        method = scope.get("method", "GET")
        path = scope.get("path", "/")

        route_class = "READ"
        if method in ["POST", "PUT", "DELETE", "PATCH"]:
            if "/transition" in path:
                route_class = "MUTATION"
            elif "/upload" in path:
                route_class = "UPLOAD"
            elif "/auth" in path or "/login" in path:
                route_class = "AUTH"
            else:
                route_class = "MUTATION"
        else:
            if "/bottlenecks" in path or "/dependencies" in path:
                route_class = "COMPUTE"
            elif "/simulation" in path:
                route_class = "SIMULATION"
            elif "/export" in path:
                route_class = "EXPORT"
            else:
                route_class = "READ"

        limits = {
            "READ": settings.RL_READ,
            "MUTATION": settings.RL_MUTATION,
            "COMPUTE": settings.RL_COMPUTE,
            "SIMULATION": settings.RL_SIMULATION,
            "EXPORT": settings.RL_EXPORT,
            "AUTH": settings.RL_AUTH,
            "UPLOAD": 10
        }
        max_reqs = limits.get(route_class, 30)

        rl_key = f"{client_ip}:{route_class}"
        if not rate_limiter.check_limit(rl_key, max_reqs, window_seconds=60):
            self._log_security_event(request_id, path, method, 429, client_ip, "Rate limit exhausted")
            response = JSONResponse(
                status_code=429, 
                content={"detail": "Too Many Requests"},
                headers={"Retry-After": "60"}
            )
            await response(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        content_length_raw = headers.get(b"content-length")
        if content_length_raw:
            try:
                cl = int(content_length_raw)
                if cl > settings.MAX_REQUEST_BODY_SIZE:
                    self._log_security_event(request_id, path, method, 413, client_ip, "Payload too large via Content-Length")
                    response = JSONResponse(status_code=413, content={"detail": "Request body too large"})
                    await response(scope, receive, send)
                    return
            except ValueError:
                self._log_security_event(request_id, path, method, 400, client_ip, "Malformed Content-Length")
                response = JSONResponse(status_code=400, content={"detail": "Malformed Content-Length"})
                await response(scope, receive, send)
                return

        total_size = 0
        body_too_large = False

        async def receive_wrapper() -> Message:
            nonlocal total_size, body_too_large
            message = await receive()
            if message["type"] == "http.request":
                total_size += len(message.get("body", b""))
                if total_size > settings.MAX_REQUEST_BODY_SIZE:
                    body_too_large = True
                    return {"type": "http.request", "body": b"", "more_body": False}
            return message

        status_code = 500
        async def send_wrapper(message: Message):
            nonlocal status_code
            if body_too_large:
                return
            if message["type"] == "http.response.start":
                status_code = message["status"]
            await send(message)

        try:
            await self.app(scope, receive_wrapper, send_wrapper)
        except Exception as e:
            if not body_too_large:
                raise e

        if body_too_large:
            self._log_security_event(request_id, path, method, 413, client_ip, "Payload too large via ASGI stream")
            resp = JSONResponse(status_code=413, content={"detail": "Payload too large (Stream)"})
            await resp(scope, receive, send)
            return

        if status_code in [401, 403]:
            self._log_security_event(request_id, path, method, status_code, client_ip, "Authorization/Authentication Denied")

    def _log_security_event(self, req_id, route, method, status, ip, reason):
        log_payload = {
            "event": "SECURITY_EVENT",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "request_id": req_id,
            "route": route,
            "method": method,
            "status": status,
            "source_ip": ip,
            "reason": reason
        }
        logger.warning(json.dumps(log_payload))
