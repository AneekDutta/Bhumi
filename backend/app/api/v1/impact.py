from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import TrustedIdentity, get_current_user_context
from app.core.database import get_db
from app.core.security import quota_manager
from app.services.authorization import AuthorizationService
from app.services.impact_engine import ImpactEngine
from app.schemas.impact import ProjectImpactResponse, SimulationRequest, SimulationResult

router = APIRouter()

@router.get("/{project_id}", response_model=ProjectImpactResponse)
async def get_project_impact(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TrustedIdentity = Depends(get_current_user_context)
):
    await AuthorizationService.verify_project_access(current_user, str(project_id), db)

    if not quota_manager.check_quota(current_user.user_id, "COMPUTE"):
        raise HTTPException(status_code=429, detail="Compute quota exceeded")

    engine = ImpactEngine(db)
    await engine.load_project(project_id)
    return engine.analyze_impact()

@router.post("/{project_id}/simulate", response_model=SimulationResult)
async def simulate_intervention(
    project_id: UUID,
    req: SimulationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TrustedIdentity = Depends(get_current_user_context)
):
    await AuthorizationService.verify_project_access(current_user, str(project_id), db)

    if not quota_manager.check_quota(current_user.user_id, "SIMULATION"):
        raise HTTPException(status_code=429, detail="Simulation quota exceeded")

    engine = ImpactEngine(db)
    await engine.load_project(project_id)
    engine.analyze_impact() # Prime the current state

    try:
        return engine.simulate_intervention(req.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid simulation parameters")
