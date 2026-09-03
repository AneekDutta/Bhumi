from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.domain import Parcel, Project
from app.schemas.domain import ParcelRead, ProjectRead

router = APIRouter()

@router.get("/", response_model=list[ProjectRead])
async def get_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project))
    return result.scalars().all()

@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(project_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.get("/{project_id}/parcels", response_model=list[ParcelRead])
async def get_project_parcels(project_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Parcel).where(Parcel.project_id == project_id))
    return result.scalars().all()
