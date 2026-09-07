"""
FastAPI Router for Identity Verification
SIH26016 Land Acquisition Platform - KOSH
Strict Data Minimization & Statutory Disclaimer Enforced
"""
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import TrustedIdentity, get_current_user_context
from app.schemas.identity import (
    IdentityVerificationRequest,
    IdentityVerificationResponse,
)
from app.services.identity_service import identity_service

router = APIRouter()


@router.get("/disclaimer")
async def get_statutory_disclaimer() -> Dict[str, str]:
    """Returns statutory disclaimer that identity does not equal land ownership or title."""
    return identity_service.get_disclaimer()


@router.post("/verify", response_model=IdentityVerificationResponse)
async def verify_identity(
    request: IdentityVerificationRequest,
    identity: TrustedIdentity = Depends(get_current_user_context),
):
    """
    Verifies claimant identity against mock or configured provider.
    Enforces data minimization and statutory disclaimer.
    """
    officer_id = identity.user_id or "OFFICER"
    return await identity_service.verify_identity(request=request, officer_id=officer_id)


@router.get("/audit-trail", response_model=List[Dict[str, Any]])
async def get_verification_audit_trail(
    parcel_id: Optional[str] = Query(None),
    case_id: Optional[str] = Query(None),
    identity: TrustedIdentity = Depends(get_current_user_context),
):
    """
    Retrieves privacy-compliant identity verification audit trail.
    Restricted to authorized officers and administrators.
    """
    role = (identity.role or "").upper()
    if role in ["LANDOWNER", "CITIZEN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Identity verification audit trails are restricted to authorized revenue officers."
        )
    return identity_service.get_audit_trail(parcel_id=parcel_id, case_id=case_id)
