import logging
import os
from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException, Request, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient, PyJWKClientError
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.domain import User

logger = logging.getLogger("security_audit")

security = HTTPBearer(auto_error=False)

class TrustedIdentity(BaseModel):
    user_id: str
    role: str
    assigned_project_id: str | None = None
    assigned_district_id: str | None = None

# Cache JWKS natively using PyJWKClient
def get_supabase_url() -> str:
    """Return the configured issuer origin; never substitute another project."""
    if not settings.SUPABASE_URL:
        raise HTTPException(status_code=503, detail="Authentication is not configured")
    return settings.SUPABASE_URL.rstrip("/")

@lru_cache(maxsize=1)
def get_jwks_client():
    """Cache the JWKS while allowing PyJWT to refresh its set as keys rotate."""
    jwks_url = f"{get_supabase_url()}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(jwks_url, cache_keys=True, cache_jwk_set=True, lifespan=3600)

def _get_signing_key(token: str):
    try:
        return get_jwks_client().get_signing_key_from_jwt(token)
    except PyJWKClientError:
        # A key may have rotated since the cached set was retrieved. One
        # forced refresh covers that case without accepting an unknown key.
        get_jwks_client.cache_clear()
        return get_jwks_client().get_signing_key_from_jwt(token)

def decode_and_verify_jwt(token: str) -> dict:
    supabase_url = get_supabase_url()
    expected_issuer = f"{supabase_url}/auth/v1"

    try:
        signing_key = _get_signing_key(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience=settings.SUPABASE_JWT_AUDIENCE,
            issuer=expected_issuer,
            # PyJWT verifies `nbf` when it is present. Supabase tokens are not
            # required to include it, so requiring the optional claim would
            # reject otherwise valid sessions.
            options={"require": ["exp", "sub"]}
        )
        return payload
    except PyJWKClientError:
        logger.warning({"event": "AUTH_FAILURE", "reason": "JWKS lookup failed"})
        raise HTTPException(status_code=401, detail="Authentication failed")
    except jwt.ExpiredSignatureError:
        logger.warning({"event": "AUTH_FAILURE", "reason": "Token expired"})
        raise HTTPException(status_code=401, detail="Authentication failed")
    except jwt.InvalidTokenError:
        logger.warning({"event": "AUTH_FAILURE", "reason": "Invalid JWT"})
        raise HTTPException(status_code=401, detail="Authentication failed")

async def get_current_user_context(
    request: Request,
    auth: HTTPAuthorizationCredentials = Security(security),
    db: AsyncSession = Depends(get_db)
) -> TrustedIdentity:
    auth_mode = os.getenv("AUTH_MODE", "mock")

    if auth_mode == "prod":
        if request.headers.get("x-mock-role") or request.headers.get("x-mock-project-id") or request.headers.get("x-mock-district-id"):
            logger.warning({"event": "AUTH_FAILURE", "reason": "Mock headers present in production"})
            raise HTTPException(status_code=403, detail="Mock headers strictly forbidden in production")

        if not auth or not auth.credentials:
            logger.warning({"event": "AUTH_FAILURE", "reason": "Missing token"})
            raise HTTPException(status_code=401, detail="Missing authentication token")

        payload = decode_and_verify_jwt(auth.credentials)
        user_id = payload.get("sub")
        if not user_id:
            logger.warning({"event": "AUTH_FAILURE", "reason": "Token missing sub claim"})
            raise HTTPException(status_code=401, detail="Authentication failed")

        # Supabase `sub` is the sole identity key. Email and client claims
        # are deliberately not considered for authorization.
        query = select(User).where(User.id == user_id).limit(1)
        result = await db.execute(query)
        user = result.scalars().first()

if not user:
            # Auto-create user mapping for newly registered users via Supabase Auth
            user_metadata = payload.get("user_metadata", {})
            assigned_role = user_metadata.get("role", "LANDOWNER")
            
            new_user = User(
                id=user_id,
                email=payload.get("email", ""),
                full_name=user_metadata.get("full_name", "Citizen Titleholder"),
                role=assigned_role
            )
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            user = new_user
            logger.info({"event": "AUTH_SYNC", "reason": "Auto-created BHUMI user mapping from valid JWT"})

        return TrustedIdentity(
            user_id=str(user.id),
            role=user.role,
            assigned_project_id=str(user.assigned_project_id) if user.assigned_project_id else None,
            assigned_district_id=str(user.assigned_district_id) if user.assigned_district_id else None
        )

    # --- MOCK MODE ONLY ---

    mock_role = request.headers.get("x-mock-role", "ADMIN")
    mock_pid = request.headers.get("x-mock-project-id")
    mock_did = request.headers.get("x-mock-district-id")
    mock_uid = request.headers.get("x-mock-user-id", "dev-admin-123")

    if mock_role == "ADMIN" and not mock_pid and not mock_did:
        return TrustedIdentity(user_id=mock_uid, role=mock_role)

    return TrustedIdentity(
        user_id=mock_uid,
        role=mock_role,
        assigned_project_id=mock_pid,
        assigned_district_id=mock_did
    )

