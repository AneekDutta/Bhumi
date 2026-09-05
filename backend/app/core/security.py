import ipaddress
import threading
import typing
from datetime import datetime, timedelta, timezone

import httpx


# ---------------------------------------------------------
# BOT PROTECTION ABSTRACTION
# ---------------------------------------------------------
class BotProtectionProvider:
    async def verify(self, token: str) -> bool:
        raise NotImplementedError

class MockBotProvider(BotProtectionProvider):
    async def verify(self, token: str) -> bool:
        return token == "valid_mock_token"

class CloudflareTurnstileProvider(BotProtectionProvider):
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
        
    async def verify(self, token: str) -> bool:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={"secret": self.secret_key, "response": token}
            )
            return resp.json().get("success", False)

# ---------------------------------------------------------
# RATE LIMITING ABSTRACTION
# ---------------------------------------------------------
class RateLimiter:
    def __init__(self, max_keys=10000):
        # Configurable in-memory store with eviction.
        # Production requires Redis.
        self._store: dict[str, list[datetime]] = {}
        self._lock = threading.Lock()
        self.max_keys = max_keys

    def check_limit(self, key: str, max_requests: int, window_seconds: int) -> bool:
        now = datetime.now(timezone.utc)
        with self._lock:
            if key in self._store:
                self._store[key] = [t for t in self._store[key] if now - t < timedelta(seconds=window_seconds)]
            else:
                if len(self._store) >= self.max_keys:
                    self._store.clear()
                self._store[key] = []
            
            if len(self._store[key]) >= max_requests:
                return False
                
            self._store[key].append(now)
            return True

rate_limiter = RateLimiter()

# ---------------------------------------------------------
# QUOTA ABSTRACTION
# ---------------------------------------------------------
class QuotaManager:
    def __init__(self):
        self._store = {}
        self._lock = threading.Lock()
        self._limits = {
            "COMPUTE": 100,
            "SIMULATION": 100,
            "EXPORT": 50,
            "UPLOAD": 20
        }

    def check_quota(self, user_id: str, resource_type: str) -> bool:
        key = f"{user_id}:{resource_type}"
        limit = self._limits.get(resource_type, 0)
        
        with self._lock:
            current = self._store.get(key, 0)
            if current >= limit:
                return False
            self._store[key] = current + 1
            return True

quota_manager = QuotaManager()

# ---------------------------------------------------------
# SSRF PROTECTION
# ---------------------------------------------------------
class SafeFetcher:
    ALLOWED_HOSTS: typing.ClassVar[list[str]] = ["api.sandbox.local", "trusted-partner.com", "example.com"]
    
    @staticmethod
    def _is_private_ip(ip_str: str) -> bool:
        try:
            ip = ipaddress.ip_address(ip_str)
            # Blocks 127.x, 10.x, 172.16.x, 192.168.x, 169.254.x, and IPv6 equivalents
            return (
                ip.is_private or 
                ip.is_loopback or 
                ip.is_link_local or 
                ip.is_multicast or
                ip.is_reserved or
                ip.is_unspecified
            )
        except ValueError:
            return True

    @staticmethod
    async def fetch(url: str):
        import asyncio
        from urllib.parse import urlparse
        
        parsed = urlparse(url)
        # HTTPS is required by default, though HTTP may be used in test environments if strictly overriden
        if parsed.scheme not in ["https"] and parsed.hostname != "api.sandbox.local": # Mock exception
            raise ValueError("SSRF Prevention: HTTPS is required")
            
        domain = parsed.hostname
        if domain not in SafeFetcher.ALLOWED_HOSTS:
            raise ValueError("SSRF Prevention: Host not in allowlist")
            
        try:
            loop = asyncio.get_running_loop()
            addr_info = await loop.getaddrinfo(domain, parsed.port or 443)
            ip_address = addr_info[0][4][0]
        except Exception:
            raise ValueError("SSRF Prevention: DNS resolution failed")
            
        if SafeFetcher._is_private_ip(ip_address):
            raise ValueError(f"SSRF Prevention: Private IP address detected ({ip_address})")
            
        # Restrict redirects, timeouts
        async with httpx.AsyncClient(timeout=3.0, follow_redirects=False, max_redirects=0) as client:
            return await client.get(url)
