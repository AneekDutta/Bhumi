from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import TrustedIdentity, get_current_user_context
from app.core.database import get_db
from app.models.domain import AcquisitionCase, Parcel
from app.schemas.domain import AcquisitionCaseRead, ParcelRead
from app.services.authorization import AuthorizationService

router = APIRouter()

async def _verify_parcel_access(parcel_id: UUID, db: AsyncSession, current_user: TrustedIdentity) -> Parcel:
    result = await db.execute(select(Parcel).where(Parcel.id == parcel_id))
    parcel = result.scalars().first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    await AuthorizationService.verify_project_access(current_user, str(parcel.project_id), db)
    return parcel

@router.get("/{parcel_id}", response_model=ParcelRead)
async def get_parcel(
    parcel_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TrustedIdentity = Depends(get_current_user_context)
):
    parcel = await _verify_parcel_access(parcel_id, db, current_user)
    return parcel

@router.get("/{parcel_id}/cases", response_model=list[AcquisitionCaseRead])
async def get_parcel_cases(
    parcel_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TrustedIdentity = Depends(get_current_user_context)
):
    await _verify_parcel_access(parcel_id, db, current_user)
    result = await db.execute(select(AcquisitionCase).where(AcquisitionCase.parcel_id == parcel_id))
    return result.scalars().all()
