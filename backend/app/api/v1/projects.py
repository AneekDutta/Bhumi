from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import TrustedIdentity, get_current_user_context
from app.core.database import get_db
from app.models.domain import Parcel, Project
from app.schemas.domain import ParcelRead, ProjectRead
from app.services.authorization import AuthorizationService

router = APIRouter()

@router.get("/", response_model=list[ProjectRead])
async def get_projects(
    db: AsyncSession = Depends(get_db),
    current_user: TrustedIdentity = Depends(get_current_user_context)
):
    if current_user.role == "ADMIN":
        result = await db.execute(select(Project))
    else:
        if not current_user.assigned_project_id:
            return []
        result = await db.execute(select(Project).where(Project.id == current_user.assigned_project_id))
    return result.scalars().all()

@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TrustedIdentity = Depends(get_current_user_context)
):
    await AuthorizationService.verify_project_access(current_user, str(project_id), db)
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.get("/{project_id}/parcels", response_model=list[ParcelRead])
async def get_project_parcels(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TrustedIdentity = Depends(get_current_user_context)
):
    await AuthorizationService.verify_project_access(current_user, str(project_id), db)
    result = await db.execute(select(Parcel).where(Parcel.project_id == project_id))
    return result.scalars().all()
