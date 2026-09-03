# Threat Model

**Methodology**: OWASP API Security Top 10 focus.

## 1. Malicious Authenticated User (IDOR / BOLA)
- **ATTACK**: User modifies `case_id` to transition a case outside their district.
- **ENTRY POINT**: `POST /api/v1/acquisition-cases/{id}/transition`
- **CONTROL**: Object-level authorization (verifying User's assigned project). Default DENY.
- **STATUS**: IMPLEMENTED.

## 2. API Abuse / Resource Exhaustion
- **ATTACK**: Attacker loops requests to `/intelligence` to burn CPU.
- **ENTRY POINT**: `GET /api/v1/projects/{id}/bottlenecks`
- **CONTROL**: Rate Limiting (Configurable Memory limits, e.g. COMPUTE class = 20 req/min).
- **STATUS**: IMPLEMENTED (Local in-memory). REQUIRES PRODUCTION INFRASTRUCTURE for distributed Redis limits.

## 3. Excessive Data Exposure
- **ATTACK**: API returns passwords/raw tokens inside nested JSON.
- **CONTROL**: Strict Pydantic Response Models filtering outgoing fields.
- **STATUS**: IMPLEMENTED.

## 4. Unrestricted Resource Consumption (Mass Assignment)
- **ATTACK**: Attacker uploads a 50MB payload to crash JSON parser.
- **CONTROL**: FastAPI Middleware limiting request body size (2MB max) with Streaming intercept.
- **STATUS**: IMPLEMENTED.

## 5. Server-Side Request Forgery (SSRF)
- **ATTACK**: Attacker provides internal metadata IP (169.254.169.254) to an external fetch route.
- **CONTROL**: `SafeFetcher` abstraction resolving DNS, blocking private/local IPs.
- **STATUS**: IMPLEMENTED.
