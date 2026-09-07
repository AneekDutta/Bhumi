from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import TrustedIdentity, get_current_user_context
from app.core.database import get_db
from app.models.domain import Parcel, Project
from app.schemas.domain import ParcelRead, ProjectRead
from app.services.authorization import AuthorizationService
from app.services.sih26016_service import sih_service

router = APIRouter()

@router.get("/", response_model=list[dict[str, Any]])
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
    db_projs = result.scalars().all()
    if db_projs:
        return [
            {
                "id": str(p.id),
                "name": p.name,
                "total_length_km": p.total_length_km,
            }
            for p in db_projs
        ]
    return sih_service.get_projects()

@router.get("/{project_id}", response_model=dict[str, Any])
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: TrustedIdentity = Depends(get_current_user_context)
):
    try:
        uuid_obj = UUID(project_id)
        await AuthorizationService.verify_project_access(current_user, str(uuid_obj), db)
        result = await db.execute(select(Project).where(Project.id == uuid_obj))
        project = result.scalars().first()
        if project:
            return {
                "id": str(project.id),
                "name": project.name,
                "total_length_km": project.total_length_km,
            }
    except (ValueError, Exception):
        pass

    await AuthorizationService.verify_project_access(current_user, str(project_id), db)
    proj = sih_service.get_project_by_id(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return proj

@router.get("/{project_id}/parcels", response_model=list[dict[str, Any]])
async def get_project_parcels(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: TrustedIdentity = Depends(get_current_user_context)
):
    try:
        uuid_obj = UUID(project_id)
        await AuthorizationService.verify_project_access(current_user, str(uuid_obj), db)
        result = await db.execute(select(Parcel).where(Parcel.project_id == uuid_obj))
        parcels = result.scalars().all()
        if parcels:
            return [
                {
                    "id": str(p.id),
                    "project_id": str(p.project_id),
                    "village_id": str(p.village_id),
                    "survey_no": p.survey_no,
                    "area_hectares": p.area_hectares,
                    "classification": p.classification,
                    "possession_type": getattr(p, "possession_type", None),
                    "status": getattr(p, "status", "PENDING"),
                }
                for p in parcels
            ]
    except (ValueError, Exception):
        pass

    await AuthorizationService.verify_project_access(current_user, str(project_id), db)
    return sih_service.get_parcels(project_id)
