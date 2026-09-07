from datetime import datetime
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import TrustedIdentity, get_current_user_context
from app.core.database import get_db
from app.core.security import quota_manager
from app.schemas.impact import (
    BottleneckEvidence,
    CausalHop,
    ProjectImpactResponse,
    ScheduleForecast,
    SimulationRequest,
    SimulationResult,
)
from app.services.authorization import AuthorizationService
from app.services.impact_engine import ImpactEngine
from app.services.sih26016_service import sih_service

router = APIRouter()

@router.get("/{project_id}", response_model=ProjectImpactResponse)
async def get_project_impact(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: TrustedIdentity = Depends(get_current_user_context)
):
    await AuthorizationService.verify_project_access(current_user, str(project_id), db)

    if not quota_manager.check_quota(current_user.user_id, "COMPUTE"):
        raise HTTPException(status_code=429, detail="Compute quota exceeded")

    try:
        uuid_obj = UUID(project_id)
        engine = ImpactEngine(db)
        await engine.load_project(uuid_obj)
        return engine.analyze_impact()
    except (ValueError, Exception):
        pass

    # Corridor digital twin resolution for string IDs like P-NH927A
    proj = sih_service.get_project_by_id(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    crit_data = sih_service.get_critical_path_report(project_id)
    crit_parcels = crit_data.get("bottlenecks", [])
    crit_ids = crit_data.get("critical_path_parcels", [])

    target_str = proj.get("target_completion") or "2028-03-31"
    projected_str = proj.get("projected_completion") or target_str
    try:
        baseline_finish = datetime.fromisoformat(target_str)
    except Exception:
        baseline_finish = datetime(2028, 3, 31)
    try:
        current_finish = datetime.fromisoformat(projected_str)
    except Exception:
        current_finish = baseline_finish

    delay_days = int(proj.get("project_delay_days") or 0)
    is_blocked = bool(proj.get("critical_path_blocked"))

    bottlenecks = []
    for b in crit_parcels:
        if isinstance(b, dict):
            p_id = str(b.get("parcel_id", ""))
            s_num = str(b.get("survey_number", p_id))
            b_delay = int(round(float(b.get("delay_days") or 0)))
            urg = str(b.get("urgency", "MEDIUM"))
            rec = str(b.get("recommended_action") or f"Parcel {s_num} on critical path")
            blk = str(b.get("active_blocker", "none"))
            is_cp = bool(b.get("is_critical_path", True))
            chains = b.get("causal_chain", ["Corridor Right-of-Way possession"])
        else:
            p_id = str(getattr(b, "parcel_id", ""))
            s_num = str(getattr(b, "survey_number", p_id))
            b_delay = int(round(float(getattr(b, "delay_days", 0))))
            urg = str(getattr(b, "urgency", "MEDIUM"))
            rec = str(getattr(b, "recommended_action", f"Parcel {s_num} on critical path"))
            blk = str(getattr(b, "active_blocker", "none"))
            is_cp = bool(getattr(b, "is_critical_path", True))
            chains = getattr(b, "causal_chain", ["Corridor Right-of-Way possession"])

        bottlenecks.append(BottleneckEvidence(
            parcel_id=p_id,
            delay_days=b_delay,
            urgency=urg,
            reason=rec,
            cases=[],
            blockers=[blk],
            is_critical_path=is_cp,
            project_delay_days=b_delay,
            causal_path=[
                CausalHop(
                    source_type="PARCEL",
                    source_id=p_id,
                    source_label=f"Survey {s_num}",
                    relationship="CONSTRAINS",
                    target_type="CORRIDOR",
                    target_id=project_id,
                    target_label=step
                ) for step in chains
            ]
        ))

    return ProjectImpactResponse(
        baseline=ScheduleForecast(
            project_finish=baseline_finish,
            critical_path=crit_ids,
            project_delay_days=0,
            impact_status="NO_BLOCKING_CONSTRAINT"
        ),
        current_forecast=ScheduleForecast(
            project_finish=current_finish,
            critical_path=crit_ids,
            project_delay_days=delay_days,
            impact_status="QUANTIFIED_IMPACT" if (is_blocked or delay_days > 0) else "NO_BLOCKING_CONSTRAINT"
        ),
        bottlenecks=bottlenecks
    )

@router.post("/{project_id}/simulate", response_model=SimulationResult)
async def simulate_intervention(
    project_id: str,
    req: SimulationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TrustedIdentity = Depends(get_current_user_context)
):
    await AuthorizationService.verify_project_access(current_user, str(project_id), db)

    if not quota_manager.check_quota(current_user.user_id, "SIMULATION"):
        raise HTTPException(status_code=429, detail="Simulation quota exceeded")

    try:
        uuid_obj = UUID(project_id)
        engine = ImpactEngine(db)
        await engine.load_project(uuid_obj)
        engine.analyze_impact()
        return engine.simulate_intervention(req.model_dump())
    except (ValueError, Exception):
        pass

    # Corridor digital twin simulation
    sim_res = sih_service.simulate(
        project_id=project_id,
        intervention_type=req.type,
        input_entity_ids=[req.parcel_id]
    )
    base_dt = datetime.fromisoformat(sim_res.get("baseline_completion", "2028-03-31"))
    post_dt = datetime.fromisoformat(sim_res.get("simulated_completion", "2028-03-31"))
    days_rec = int(sim_res.get("days_recovered") or 0)

    return SimulationResult(
        before=ScheduleForecast(
            project_finish=base_dt,
            critical_path=[],
            project_delay_days=days_rec,
            impact_status="QUANTIFIED_IMPACT" if days_rec > 0 else "NO_BLOCKING_CONSTRAINT"
        ),
        after=ScheduleForecast(
            project_finish=post_dt,
            critical_path=[],
            project_delay_days=0,
            impact_status="NO_BLOCKING_CONSTRAINT"
        ),
        days_recovered=days_rec
    )
