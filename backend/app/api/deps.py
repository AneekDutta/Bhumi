import os
from fastapi import HTTPException, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional

security = HTTPBearer(auto_error=False)

class TrustedIdentity(BaseModel):
    user_id: str
    role: str
    assigned_project_id: Optional[str] = None
    assigned_district_id: Optional[str] = None

def decode_and_verify_jwt(token: str) -> Optional[TrustedIdentity]:
    """
    Identity Provider Abstraction.
    In a fully configured production environment, this decodes the JWT
    and validates the signature against the IDP (e.g., Supabase JWKS).
    Fails closed here because the IDP is unconfigured in the prototype.
    """
    raise HTTPException(
        status_code=501,
        detail="Production IDP is not configured for JWT verification (Fail Closed)"
    )

def get_current_user_context(
    request: Request,
    auth: HTTPAuthorizationCredentials = Security(security)
) -> TrustedIdentity:
    auth_mode = os.getenv("AUTH_MODE", "mock")

    if auth_mode == "prod":
        # Any attempt to pass mock headers in prod is strictly ignored/rejected
        if request.headers.get("x-mock-role") or request.headers.get("x-mock-project-id") or request.headers.get("x-mock-district-id"):
            raise HTTPException(status_code=403, detail="Mock headers strictly forbidden in production")

        if not auth or not auth.credentials:
            raise HTTPException(status_code=401, detail="Missing authentication token")

        identity = decode_and_verify_jwt(auth.credentials)
        if not identity:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        return identity

    # --- MOCK MODE ONLY ---
    mock_role = request.headers.get("x-mock-role", "ADMIN")
    mock_pid = request.headers.get("x-mock-project-id")
    mock_did = request.headers.get("x-mock-district-id")

    if mock_role == "ADMIN" and not mock_pid and not mock_did:
        return TrustedIdentity(user_id="dev-admin-123", role=mock_role)

    return TrustedIdentity(
        user_id="dev-admin-123",
        role=mock_role,
        assigned_project_id=mock_pid,
        assigned_district_id=mock_did
    )
