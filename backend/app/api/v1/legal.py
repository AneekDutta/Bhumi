"""
FastAPI Router for Land Acquisition Legal & Rights Knowledge Center
SIH26016 Land Acquisition Digital Twin Engine

Traceable to RFCTLARR Act 2013 and Rajasthan RFCTLARR Rules 2016.
Public reference endpoints are open for transparency; parcel/complaint context
respects system boundaries.
"""
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.legal import (
    ComplaintLegalContext,
    LandownerSectionGuideItem,
    LegalProvisionRead,
    OfficerStageGuideItem,
    ParcelLegalContext,
)
from app.services.legal_service import LEGAL_DISCLAIMER_TEXT, legal_service

router = APIRouter()


@router.get("/disclaimer", response_model=dict[str, str])
async def get_legal_disclaimer():
    """Returns the statutory disclaimer regarding decision-support legal information."""
    return {"disclaimer": LEGAL_DISCLAIMER_TEXT}


@router.get("/provisions", response_model=list[LegalProvisionRead])
async def list_legal_provisions(
    role: Optional[str] = Query(None, description="Filter by target user role: LANDOWNER | FIELD_OFFICER"),
    stage: Optional[str] = Query(None, description="Filter by acquisition stage (e.g. preliminary_notification, valuation)"),
    category: Optional[str] = Query(None, description="Filter by legal category (e.g. VALUATION, COMPENSATION, OBJECTION)"),
    jurisdiction: Optional[str] = Query(None, description="Filter by jurisdiction: CENTRAL | RAJASTHAN"),
    search: Optional[str] = Query(None, description="Full-text search query across titles, sections, and guidance"),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves authoritative, verified legal provisions with optional filtering.
    """
    provisions = await legal_service.get_all_provisions(
        role=role,
        stage=stage,
        category=category,
        jurisdiction=jurisdiction,
        search_query=search,
        db=db,
    )
    return provisions


@router.get("/provisions/{provision_id}", response_model=LegalProvisionRead)
async def get_legal_provision_detail(
    provision_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves the authoritative detail of a specific statutory provision by ID.
    """
    prov = await legal_service.get_provision_by_id(provision_id, db=db)
    if not prov:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Legal provision '{provision_id}' not found",
        )
    return prov


@router.get("/officer-guide", response_model=list[OfficerStageGuideItem])
async def get_officer_procedural_guide(
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the 17 sequential statutory stages for land acquisition officers,
    including duties, required evidence, clocks, and governing laws.
    """
    return await legal_service.get_officer_procedural_guide(db=db)


@router.get("/landowner-guide", response_model=list[LandownerSectionGuideItem])
async def get_landowner_rights_guide(
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the 6 practical question-and-answer sections for landowners:
    Before Acquisition, Compensation, Objections & Disputes, R&R, Possession, If You Disagree.
    """
    return await legal_service.get_landowner_guide(db=db)


@router.get("/parcels/{parcel_id}", response_model=ParcelLegalContext)
async def get_parcel_legal_context(
    parcel_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Maps a specific cadastral parcel's lifecycle state to applicable statutory provisions.
    """
    return await legal_service.get_parcel_legal_context(parcel_id, db=db)


@router.get("/complaints/{complaint_id_or_type}", response_model=ComplaintLegalContext)
async def get_complaint_legal_context(
    complaint_id_or_type: str,
    parcel_id: Optional[str] = Query(None, description="Associated parcel ID if known"),
    db: AsyncSession = Depends(get_db),
):
    """
    Maps a complaint or dispute type to governing statutory rights and required officer action.
    """
    return await legal_service.get_complaint_legal_context(
        complaint_type_or_id=complaint_id_or_type,
        parcel_id=parcel_id,
        db=db,
    )
