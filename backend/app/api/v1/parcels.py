from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.domain import AcquisitionCase, Parcel
from app.schemas.domain import AcquisitionCaseRead, ParcelRead

router = APIRouter()

@router.get("/{parcel_id}", response_model=ParcelRead)
async def get_parcel(parcel_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Parcel).where(Parcel.id == parcel_id))
    parcel = result.scalars().first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    return parcel

@router.get("/{parcel_id}/cases", response_model=list[AcquisitionCaseRead])
async def get_parcel_cases(parcel_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AcquisitionCase).where(AcquisitionCase.parcel_id == parcel_id))
    return result.scalars().all()
