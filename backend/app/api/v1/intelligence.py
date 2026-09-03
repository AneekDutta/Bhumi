from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import TrustedIdentity, get_current_user_context
from app.core.database import get_db
from app.core.security import quota_manager
from app.models.domain import Project
from app.services.graph_engine import IntelligenceEngine
from app.services.authorization import AuthorizationService

router = APIRouter()

@router.get("/{project_id}/bottlenecks")
async def get_project_bottlenecks(
    project_id: UUID, 
    db: AsyncSession = Depends(get_db),
    current_user: TrustedIdentity = Depends(get_current_user_context)
):
    """
    Evaluates the dependency DAG for a project and highlights critical bottlenecks.
    Consumes the 'COMPUTE' quota.
    """
    AuthorizationService.verify_project_access(current_user, str(project_id))
    
    if not quota_manager.check_quota(current_user.user_id, "COMPUTE"):
        raise HTTPException(status_code=429, detail="Compute quota exceeded")

    result = await db.execute(select(Project).where(Project.id == project_id))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")

    engine = IntelligenceEngine(db)
    return await engine.analyze_project_bottlenecks(project_id)
