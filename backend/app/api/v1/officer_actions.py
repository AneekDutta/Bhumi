"""
FastAPI Router for KOSH Officer Action Center
SIH26016 Land Acquisition Digital Twin Platform

Operational action workspace providing answers to:
What requires attention, why, what law governs it, what deadline applies, what evidence supports it, and what downstream CPM impact exists.
"""
from datetime import date
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import TrustedIdentity, get_current_user_context
from app.core.database import get_db
from app.schemas.officer_actions import (
    OfficerActionItem,
    OfficerActionSummary,
    RecordStayRequest,
    ResolveActionRequest,
)
from app.services.officer_action_service import officer_action_service

router = APIRouter()


def require_officer_or_admin(identity: TrustedIdentity) -> str:
    """Strictly enforces officer/admin role isolation. Landowners and citizens are rejected."""
    role = (identity.role or "").upper()
    if role in ["LANDOWNER", "CITIZEN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Internal officer prioritization, action notes, and CPM project risk data are restricted to authorized revenue and acquisition officers."
        )
    return identity.user_id or "OFF-001"


async def _verify_action_access(action_id: str, identity: TrustedIdentity, db: AsyncSession) -> dict[str, Any]:
    """
    Enforces Object-Level Horizontal Authorization (IDOR protection):
    An officer assigned to Project A / District A cannot view or mutate an action in Project B / District B.
    """
    action = await officer_action_service.get_action_detail(action_id, db=db)
    if not action:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Action item '{action_id}' not found")

    if (identity.role or "").upper() == "ADMIN":
        return action

    # Horizontal project boundary check
    if identity.assigned_project_id:
        action_proj = str(action.get("project_id") or "P-NH927A")
        if action_proj != str(identity.assigned_project_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Officer assigned to project '{identity.assigned_project_id}' cannot access action in project '{action_proj}'"
            )

    # Horizontal district boundary check
    if identity.assigned_district_id:
        action_dist = str(action.get("district_id") or "D-SALUMBAR")
        if action_dist != str(identity.assigned_district_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Officer assigned to district '{identity.assigned_district_id}' cannot access action in district '{action_dist}'"
            )

    return action


@router.get("", response_model=list[OfficerActionItem])
async def list_officer_actions(
    category: Optional[str] = Query(None, description="Category: CRITICAL | DUE_SOON | BLOCKED | PROJECT_IMPACT | UPCOMING | COMPLETED"),
    parcel_id: Optional[str] = Query(None, description="Filter by parcel ID (e.g. P00003)"),
    role: Optional[str] = Query(None, description="Filter by responsible role: COLLECTOR | FIELD_OFFICER"),
    search: Optional[str] = Query(None, description="Search query across action title, survey number, village, or section"),
    db: AsyncSession = Depends(get_db),
    identity: TrustedIdentity = Depends(get_current_user_context),
):
    """
    Returns deterministically prioritized operational action items.
    Filters horizontally by assigned project and district for non-admin officers.
    """
    require_officer_or_admin(identity)
    is_admin = (identity.role or "").upper() == "ADMIN"
    proj_scope = None if is_admin else identity.assigned_project_id
    dist_scope = None if is_admin else identity.assigned_district_id

    return await officer_action_service.get_action_items(
        category=category,
        parcel_id=parcel_id,
        role=role,
        search=search,
        project_id=proj_scope,
        district_id=dist_scope,
        db=db,
    )


@router.get("/summary", response_model=OfficerActionSummary)
async def get_action_summary(
    db: AsyncSession = Depends(get_db),
    identity: TrustedIdentity = Depends(get_current_user_context),
):
    """Returns live counters for all 6 operational categories and critical path bottleneck metrics."""
    require_officer_or_admin(identity)
    return await officer_action_service.get_action_summary(db=db)


@router.get("/{action_id}", response_model=OfficerActionItem)
async def get_action_detail(
    action_id: str,
    db: AsyncSession = Depends(get_db),
    identity: TrustedIdentity = Depends(get_current_user_context),
):
    """Retrieves complete 6-dimensional operational dossier for a specific action item with IDOR verification."""
    require_officer_or_admin(identity)
    action = await _verify_action_access(action_id, identity, db)
    return action


@router.post("/{action_id}/resolve")
async def resolve_action(
    action_id: str,
    payload: ResolveActionRequest,
    db: AsyncSession = Depends(get_db),
    identity: TrustedIdentity = Depends(get_current_user_context),
):
    """
    Resolves an action item by providing verified evidence document references and officer remarks.
    Enforces horizontal authorization and validates server-side that the evidence document exists,
    belongs to this parcel/project, and is approved.
    """
    officer_user = require_officer_or_admin(identity)
    await _verify_action_access(action_id, identity, db)

    return await officer_action_service.resolve_action(
        action_id=action_id,
        completed_date=payload.completed_date,
        evidence_document_id=payload.evidence_document_id,
        officer_notes=payload.officer_notes,
        officer_user=officer_user,
        mark_statutory_complete=payload.mark_statutory_complete,
        db=db,
        identity=identity,
    )


@router.post("/{action_id}/record-stay")
async def record_action_court_stay(
    action_id: str,
    payload: RecordStayRequest,
    db: AsyncSession = Depends(get_db),
    identity: TrustedIdentity = Depends(get_current_user_context),
):
    """
    Records a judicial stay order with case citation and authorization guards.
    Ordinary officers can submit stay details, but they remain PENDING_VERIFICATION.
    Only authorized Legal Officers or Administrators can certify a stay as VERIFIED.
    """
    officer_user = require_officer_or_admin(identity)
    await _verify_action_access(action_id, identity, db)

    # Server-side authorization guard: only legal cell or admin can set status to VERIFIED
    req_status = (payload.judicial_verification_status or "").strip().upper()
    user_role = (identity.role or "").upper()
    if req_status == "VERIFIED" and user_role not in ["ADMIN", "LEGAL_OFFICER", "DISTRICT_LEGAL_OFFICER", "COLLECTOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only authorized Legal Officers, Collectors, or Administrators can certify a judicial stay order as VERIFIED. Officer submissions must be recorded as PENDING_VERIFICATION."
        )

    return await officer_action_service.record_court_stay(
        action_id=action_id,
        court_order_reference=payload.court_order_reference,
        stay_order_date=payload.stay_order_date,
        stay_vacated_date=payload.stay_vacated_date,
        stay_days=payload.stay_days,
        judicial_verification_status=payload.judicial_verification_status,
        court_name=payload.court_name,
        notes=payload.notes,
        officer_user=officer_user,
        db=db,
        identity=identity,
    )
