"""
FastAPI Router for KOSH Explainable Acquisition Risk Engine
SIH26016 Land Acquisition Digital Twin Platform
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import TrustedIdentity, get_current_user_context
from app.core.database import get_db
from app.schemas.acquisition_risk import ParcelRiskDossier, ProjectRiskSummary
from app.services.acquisition_risk_engine import acquisition_risk_engine

router = APIRouter()


def require_officer_or_admin(identity: TrustedIdentity) -> str:
    role = (identity.role or "").upper()
    if role in ["LANDOWNER", "CITIZEN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Internal acquisition risk assessments and CPM bottleneck diagnostics are restricted to revenue officers."
        )
    return identity.user_id or "OFF-001"


@router.get("/parcel/{parcel_id}", response_model=ParcelRiskDossier)
async def get_parcel_risk_dossier(
    parcel_id: str,
    db: AsyncSession = Depends(get_db),
    identity: TrustedIdentity = Depends(get_current_user_context),
):
    """
    Returns 10-dimensional explainable risk evaluation answering 'WHY?'
    Includes statutory lapse proximity, missing evidence, and CPM float impacts.
    """
    require_officer_or_admin(identity)
    dossier = await acquisition_risk_engine.evaluate_parcel_risk(parcel_id=parcel_id, db=db)

    # Horizontal project boundary check
    if identity.assigned_project_id and dossier.project_id:
        if str(identity.assigned_project_id) != str(dossier.project_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Officer assigned to project '{identity.assigned_project_id}' cannot access risk dossier in project '{dossier.project_id}'"
            )

    return dossier


@router.get("/project/{project_id}/summary", response_model=ProjectRiskSummary)
async def get_project_risk_summary(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    identity: TrustedIdentity = Depends(get_current_user_context),
):
    """Returns project-level risk distribution, critical path count, and top corridor bottlenecks."""
    require_officer_or_admin(identity)
    if identity.assigned_project_id and str(identity.assigned_project_id) != str(project_id):
        if (identity.role or "").upper() != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Officer assigned to project '{identity.assigned_project_id}' cannot access summary of project '{project_id}'"
            )

    return await acquisition_risk_engine.get_project_risk_summary(project_id=project_id, db=db)
