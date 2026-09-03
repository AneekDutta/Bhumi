# Security Requirements

## 1. Authentication
- Must support OIDC/JWT in production.
- Must provide a deterministic mock in development.
- Must fail-closed if production environment is detected without a valid provider.

## 2. Authorization (RBAC + Object-Level)
- Roles: `ADMIN`, `DISTRICT_OFFICER`, `VIEWER`.
- Object-level: A `DISTRICT_OFFICER` can only mutate Cases in their assigned District/Project.

## 3. Rate Limiting & Quotas
- Every API endpoint must have a default rate limit.
- Classes: `READ` (high limit), `MUTATION` (medium), `COMPUTE` (low).
- Configurable backends (Memory for local, Redis for distributed).

## 4. Bot Protection
- Sensitive operations (login, public submissions) require CAPTCHA (Turnstile).
- Abstracted via `BotProtectionProvider`.

## 5. Resource Limits
- Max JSON payload: 2MB.
- Max pagination size: 100 items.

## 6. Security Headers
- Strict-Transport-Security (HSTS).
- X-Content-Type-Options: nosniff.
- Content-Security-Policy (CSP) mapping exact script requirements.

## 7. Audit Logging
- Distinct from standard app logs.
- Immutable log of state transitions (Implemented in Phase 1.5).
- Audit trails must include `actor_id` securely resolved from the token, not user input.
