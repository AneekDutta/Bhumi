"""
FastAPI Router for Statutory Deadline & Legal Clock Engine
SIH26016 Land Acquisition Digital Twin Platform

Deterministic case-specific statutory clocks linking Law -> Stage -> Event -> Deadline -> Milestone -> CPM.
"""
from datetime import date
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import TrustedIdentity, get_current_user_context
from app.core.database import get_db
from app.models.deadlines import SIHStatutoryDeadline
from app.schemas.deadlines import (
    CaseDeadlineRead,
    CompleteDeadlineRequest,
    CorridorDeadlineSummary,
    DeadlineCalculateRequest,
    DeadlineCalculateResponse,
    DeadlineRuleRead,
    GenerateParcelDeadlinesRequest,
)
from app.services.sih26016_service import sih_service
from app.services.statutory_deadline_engine import statutory_deadline_engine

router = APIRouter()


@router.get("/rules", response_model=list[DeadlineRuleRead])
async def list_deadline_rules(
    jurisdiction: Optional[str] = Query(None, description="Filter by jurisdiction: CENTRAL | RAJASTHAN"),
    role: Optional[str] = Query(None, description="Filter by role: LANDOWNER | FIELD_OFFICER | COLLECTOR"),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves authoritative statutory deadline rules under RFCTLARR Act 2013 and Rajasthan Rules 2016."""
    return await statutory_deadline_engine.get_all_rules(jurisdiction=jurisdiction, role=role, db=db)


@router.get("/rules/{rule_id}", response_model=DeadlineRuleRead)
async def get_deadline_rule(
    rule_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieves a specific statutory deadline rule by ID."""
    rule = statutory_deadline_engine.get_rule_definition(rule_id)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Deadline rule '{rule_id}' not found")
    return rule


@router.post("/calculate", response_model=DeadlineCalculateResponse)
async def calculate_statutory_deadline(payload: DeadlineCalculateRequest):
    """
    Deterministic in-memory statutory deadline calculator.
    Produces an explainable audit trace with citations, duration logic, and CPM impact.
    """
    rule = statutory_deadline_engine.get_rule_definition(payload.rule_id)
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Deadline rule '{payload.rule_id}' not found")

    try:
        res = statutory_deadline_engine.calculate_deadline(
            rule=rule,
            trigger_date=payload.trigger_date,
            extension_days=payload.extension_days,
            reference_date=payload.reference_date,
            court_order_reference=payload.court_order_reference,
            is_court_stay_verified=payload.is_court_stay_verified,
            unpaid_balance_amount=payload.unpaid_balance_amount,
            applicant_was_present=payload.applicant_was_present,
            award_date=payload.award_date,
            condonation_granted=payload.condonation_granted,
            condonation_days=payload.condonation_days,
            condonation_reason=payload.condonation_reason,
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/summary", response_model=CorridorDeadlineSummary)
async def get_corridor_deadline_summary(db: AsyncSession = Depends(get_db)):
    """Returns corridor-wide metrics of upcoming, due soon, overdue deadlines, and mandatory lapse risk alerts."""
    return await statutory_deadline_engine.get_corridor_summary(db=db)


@router.get("/parcels/{parcel_id}", response_model=list[CaseDeadlineRead])
async def get_parcel_deadlines(
    parcel_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves all statutory deadlines associated with a cadastral parcel.
    If not yet generated in the database, automatically derives from the parcel acquisition case dossier.
    """
    norm_pid = parcel_id.strip().upper()
    # Check DB
    try:
        stmt = select(SIHStatutoryDeadline).where(SIHStatutoryDeadline.parcel_id == norm_pid).order_by(SIHStatutoryDeadline.calculated_due_date)
        res = await db.execute(stmt)
        rows = res.scalars().all()
        if rows:
            return [r.to_dict() for r in rows]
    except Exception as e:
        print(f"[deadlines_router] Error querying DB: {e}")

    # Auto-derive from parcel dossier
    p_detail = sih_service.get_parcel_detail(norm_pid)
    if not p_detail:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Parcel '{norm_pid}' not found")

    case_info = p_detail.get("acquisition_case") or {}
    notif_str = case_info.get("notification_date")
    decl_str = case_info.get("declaration_date")
    award_str = case_info.get("award_date")
    poss_str = case_info.get("possession_date")

    notif_d = date.fromisoformat(notif_str) if notif_str else date(2025, 4, 1)
    decl_d = date.fromisoformat(decl_str) if decl_str else None
    award_d = date.fromisoformat(award_str) if award_str else None
    poss_d = date.fromisoformat(poss_str) if poss_str else None

    deadlines = await statutory_deadline_engine.generate_deadlines_for_case(
        case_id=case_info.get("case_id", f"CASE-{norm_pid}"),
        parcel_id=norm_pid,
        notification_date=notif_d,
        declaration_date=decl_d,
        award_date=award_d,
        possession_date=poss_d,
        db=db,
    )
    return deadlines


@router.post("/parcels/{parcel_id}/generate", response_model=list[CaseDeadlineRead])
async def generate_parcel_deadlines(
    parcel_id: str,
    payload: GenerateParcelDeadlinesRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Derives and persists case-specific statutory clocks for a parcel based on explicit event dates.
    """
    norm_pid = parcel_id.strip().upper()
    case_id = payload.case_id or f"CASE-{norm_pid}"
    notif_d = payload.notification_date or date(2025, 4, 1)

    deadlines = await statutory_deadline_engine.generate_deadlines_for_case(
        case_id=case_id,
        parcel_id=norm_pid,
        notification_date=notif_d,
        declaration_date=payload.declaration_date,
        award_date=payload.award_date,
        possession_date=payload.possession_date,
        db=db,
    )
    return deadlines


@router.post("/{deadline_id}/complete", response_model=CaseDeadlineRead)
async def complete_statutory_deadline(
    deadline_id: str,
    payload: CompleteDeadlineRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Marks a statutory deadline as COMPLETED with the official date of compliance and evidence.
    Deactivates any blocking CPM edge if applicable.
    """
    stmt = select(SIHStatutoryDeadline).where(SIHStatutoryDeadline.id == deadline_id)
    res = await db.execute(stmt)
    dl = res.scalars().first()
    if not dl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Deadline '{deadline_id}' not found")

    dl.status = "COMPLETED"
    dl.completed_date = payload.completed_date
    dl.is_blocking_cpm = False
    if dl.calculation_trace:
        trace = dict(dl.calculation_trace)
        trace["status"] = "COMPLETED"
        trace["completed_date"] = payload.completed_date.isoformat()
        dl.calculation_trace = trace

    await db.commit()
    await db.refresh(dl)
    return dl.to_dict()
