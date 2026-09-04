from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import TrustedIdentity, get_current_user_context
from app.core.database import get_db
from app.models.domain import AcquisitionCase, AuditLog, StatutoryRule, Parcel
from app.schemas.domain import AcquisitionCaseRead, AuditLogRead, CaseTransitionRequest
from app.services.audit import log_transition
from app.services.clock import evaluate_deadline
from app.services.authorization import AuthorizationService

router = APIRouter()

async def _verify_case_access(case_id: UUID, db: AsyncSession, current_user: TrustedIdentity):
    result = await db.execute(select(AcquisitionCase).where(AcquisitionCase.id == case_id))
    case = result.scalars().first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    parcel_result = await db.execute(select(Parcel).where(Parcel.id == case.parcel_id))
    parcel = parcel_result.scalars().first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel for case not found")

    await AuthorizationService.verify_project_access(current_user, str(parcel.project_id), db)
    return case, parcel

@router.get("/{case_id}", response_model=AcquisitionCaseRead)
async def get_case(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TrustedIdentity = Depends(get_current_user_context)
):
    case, _ = await _verify_case_access(case_id, db, current_user)
    return case

@router.post("/{case_id}/transition", response_model=AcquisitionCaseRead)
async def transition_case(
    case_id: UUID,
    req: CaseTransitionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TrustedIdentity = Depends(get_current_user_context)
):
    case, parcel = await _verify_case_access(case_id, db, current_user)
    AuthorizationService.verify_mutation_access(current_user)

    old_stage = case.current_stage
    now = datetime.now(timezone.utc)

    if old_stage == req.new_stage.value:
        raise HTTPException(status_code=400, detail="Case is already in this stage")

    state_before = {"stage": old_stage, "stage_started_at": case.stage_started_at.isoformat() if case.stage_started_at else None}

    case.current_stage = req.new_stage.value
    case.stage_started_at = now
    case.computed_deadline = None

    rule_result = await db.execute(select(StatutoryRule).where(
        StatutoryRule.act_code == case.statutory_act,
        StatutoryRule.trigger_stage == req.new_stage.value
    ))
    rule = rule_result.scalars().first()
    if rule:
        from app.services.clock import compute_deadline
        case.computed_deadline = compute_deadline(now, rule)

    state_after = {"stage": case.current_stage, "stage_started_at": case.stage_started_at.isoformat()}

    await log_transition(
        db,
        entity_type="AcquisitionCase",
        entity_id=case.id,
        action="STAGE_TRANSITION",
        actor_id=current_user.user_id,
        actor_role=current_user.role,
        state_before=state_before,
        state_after=state_after
    )

    await db.commit()
    await db.refresh(case)
    return case

@router.get("/{case_id}/deadline")
async def get_case_deadline(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TrustedIdentity = Depends(get_current_user_context)
):
    case, _ = await _verify_case_access(case_id, db, current_user)

    rule_result = await db.execute(select(StatutoryRule).where(
        StatutoryRule.act_code == case.statutory_act,
        StatutoryRule.trigger_stage == case.current_stage
    ))
    rule = rule_result.scalars().first()
    if not rule:
        return {"status": "NO_RULE_APPLICABLE"}

    return evaluate_deadline(case, rule)

@router.get("/{case_id}/audit", response_model=list[AuditLogRead])
async def get_case_audit(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TrustedIdentity = Depends(get_current_user_context)
):
    await _verify_case_access(case_id, db, current_user)
    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.entity_id == case_id, AuditLog.entity_type == "AcquisitionCase")
        .order_by(AuditLog.created_at.desc())
    )
    return result.scalars().all()
