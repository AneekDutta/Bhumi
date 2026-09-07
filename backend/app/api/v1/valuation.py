"""
FastAPI Router for RFCTLARR Act 2013 Statutory Valuation & Compensation Awards
SIH26016 Land Acquisition Digital Twin Engine
"""
from datetime import date
from decimal import Decimal
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import TrustedIdentity, get_current_user_context
from app.core.database import get_db
from app.services.valuation_engine import (
    ANNUAL_INTEREST_RATE,
    DEFAULT_CIRCLE_RATES_PER_SQM,
    MULTIPLIER_SLABS,
    RULE_BASIS,
    RULE_VERSION,
    SOLATIUM_PERCENTAGE,
    STATUTORY_DISCLAIMER,
    URBAN_MULTIPLIER,
    VALID_WORKFLOW_STATUSES,
    ValuationInput,
    valuation_engine,
)

router = APIRouter()


# -------------------------------------------------------------------------
# Request / Response Schemas
# -------------------------------------------------------------------------

class ValuationCalculateRequest(BaseModel):
    parcel_id: str
    area_sqm: float = Field(..., gt=0, description="Acquired parcel area in square meters")
    circle_rate_per_sqm: Optional[float] = Field(None, gt=0, description="Minimum circle rate per sqm")
    market_rate_per_sqm: Optional[float] = Field(None, ge=0, description="Average registered sale deed price per sqm")
    land_category: str = Field("agricultural_irrigated", description="Classification of land")
    distance_from_urban_km: Optional[float] = Field(None, ge=0, description="Distance from nearest urban boundary (km)")
    multiplier_factor: Optional[float] = Field(None, ge=1.0, le=2.0, description="Explicit multiplier factor override (1.00-2.00)")
    asset_value: float = Field(0.0, ge=0, description="Value of attached structures, wells, borewells (INR)")
    trees_crops_value: float = Field(0.0, ge=0, description="Value of standing trees and crops (INR)")
    severance_damage: float = Field(0.0, ge=0, description="Severance damages under Section 27/28 (INR)")
    other_damages: float = Field(0.0, ge=0, description="Injurious affection or relocation damages (INR)")
    notification_date: Optional[date] = Field(None, description="Section 11 Preliminary Notification date")
    award_date: Optional[date] = Field(None, description="Date of Collector award determination")
    case_id: Optional[str] = Field(None, description="Optional acquisition case identifier")


class ApproveAwardRequest(BaseModel):
    officer_id: Optional[str] = Field(None, description="Officer ID approving the award (defaults to authenticated identity)")
    notes: Optional[str] = Field(None, description="Approval notes or verification reference")


class UpdatePaymentStatusRequest(BaseModel):
    status: str = Field(..., description="Target status: CALCULATED | APPROVED | PAYMENT_PENDING | PAID | DISPUTED | ON_HOLD")
    notes: Optional[str] = Field(None, description="Reason or PFMS treasury transaction reference")


# -------------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------------

@router.get("/rules", response_model=dict[str, Any])
async def get_statutory_rules():
    """
    Returns the active statutory valuation parameters, configurable circle rates,
    distance multiplier slabs, and synthetic demo disclaimers.
    """
    slabs = [
        {"min_km": float(s[0]), "max_km": float(s[1]), "multiplier": float(s[2])}
        for s in MULTIPLIER_SLABS
    ]
    circle_rates = {k: float(v) for k, v in DEFAULT_CIRCLE_RATES_PER_SQM.items()}

    return {
        "rule_version": RULE_VERSION,
        "rule_basis": RULE_BASIS,
        "solatium_percentage": float(SOLATIUM_PERCENTAGE),
        "annual_interest_rate_pct": float(ANNUAL_INTEREST_RATE * 100),
        "urban_multiplier": float(URBAN_MULTIPLIER),
        "multiplier_slabs": slabs,
        "default_circle_rates": circle_rates,
        "allowed_workflow_statuses": sorted(list(VALID_WORKFLOW_STATUSES)),
        "disclaimer": STATUTORY_DISCLAIMER,
    }


@router.post("/calculate", response_model=dict[str, Any])
async def calculate_statutory_award(
    req: ValuationCalculateRequest,
):
    """
    Calculates statutory compensation with full step-by-step mathematical derivation
    and legal citations. Operates in-memory (preview/simulation) without mutating database.
    """
    try:
        val_input = ValuationInput(
            parcel_id=req.parcel_id.strip().upper(),
            area_sqm=Decimal(str(req.area_sqm)),
            circle_rate_per_sqm=Decimal(str(req.circle_rate_per_sqm)) if req.circle_rate_per_sqm is not None else None,
            market_rate_per_sqm=Decimal(str(req.market_rate_per_sqm)) if req.market_rate_per_sqm is not None else None,
            land_category=req.land_category,
            distance_from_urban_km=Decimal(str(req.distance_from_urban_km)) if req.distance_from_urban_km is not None else None,
            multiplier_factor=Decimal(str(req.multiplier_factor)) if req.multiplier_factor is not None else None,
            asset_value=Decimal(str(req.asset_value)),
            trees_crops_value=Decimal(str(req.trees_crops_value)),
            severance_damage=Decimal(str(req.severance_damage)),
            other_damages=Decimal(str(req.other_damages)),
            notification_date=req.notification_date,
            award_date=req.award_date,
            case_id=req.case_id,
        )
        result = valuation_engine.calculate(val_input)
        return result.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/parcels/{parcel_id}", response_model=dict[str, Any])
async def get_parcel_valuation(
    parcel_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves the authoritative statutory valuation award for a parcel from PostgreSQL.
    If no compensation award exists yet, calculates a baseline award from parcel attributes.
    """
    try:
        award = await valuation_engine.get_or_calculate_valuation(parcel_id, db=db)
        return award
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Valuation retrieval failed: {e}")


@router.post("/parcels/{parcel_id}/calculate", response_model=dict[str, Any])
async def calculate_and_save_parcel_valuation(
    parcel_id: str,
    req: ValuationCalculateRequest,
    db: AsyncSession = Depends(get_db),
    user: TrustedIdentity = Depends(get_current_user_context),
):
    """
    Computes statutory award and persists it directly into PostgreSQL `compensation_records`
    and the live digital twin cache.
    """
    norm_pid = parcel_id.strip().upper()
    try:
        val_input = ValuationInput(
            parcel_id=norm_pid,
            area_sqm=Decimal(str(req.area_sqm)),
            circle_rate_per_sqm=Decimal(str(req.circle_rate_per_sqm)) if req.circle_rate_per_sqm is not None else None,
            market_rate_per_sqm=Decimal(str(req.market_rate_per_sqm)) if req.market_rate_per_sqm is not None else None,
            land_category=req.land_category,
            distance_from_urban_km=Decimal(str(req.distance_from_urban_km)) if req.distance_from_urban_km is not None else None,
            multiplier_factor=Decimal(str(req.multiplier_factor)) if req.multiplier_factor is not None else None,
            asset_value=Decimal(str(req.asset_value)),
            trees_crops_value=Decimal(str(req.trees_crops_value)),
            severance_damage=Decimal(str(req.severance_damage)),
            other_damages=Decimal(str(req.other_damages)),
            notification_date=req.notification_date,
            award_date=req.award_date,
            case_id=req.case_id,
        )
        result = valuation_engine.calculate(val_input)
        await valuation_engine.save_to_db(result, db=db)
        valuation_engine.sync_to_cache(result)
        return result.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Valuation persistence failed: {e}")


@router.post("/awards/{compensation_id}/approve", response_model=dict[str, Any])
async def approve_statutory_award(
    compensation_id: str,
    req: Optional[ApproveAwardRequest] = None,
    db: AsyncSession = Depends(get_db),
    user: TrustedIdentity = Depends(get_current_user_context),
):
    """
    Statutory Officer Approval: Transitions award state from CALCULATED -> APPROVED.
    Marks award legally verified and ready for treasury disbursement.
    """
    officer_id = (req and req.officer_id) or user.user_id or "OFFICER_AUTHORIZED"
    try:
        approval_res = await valuation_engine.approve_award(compensation_id, officer_id=officer_id, db=db)
        return approval_res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Award approval failed: {e}")


@router.post("/awards/{compensation_id}/payment-status", response_model=dict[str, Any])
async def update_award_payment_status(
    compensation_id: str,
    req: UpdatePaymentStatusRequest,
    db: AsyncSession = Depends(get_db),
    user: TrustedIdentity = Depends(get_current_user_context),
):
    """
    Updates payment workflow status (CALCULATED | APPROVED | PAYMENT_PENDING | PAID | DISPUTED | ON_HOLD).
    - DISPUTED / ON_HOLD dynamically triggers a blocking dependency edge in CPM.
    - PAID clears blocking edges, unblocking the parcel milestone and recalculating project float.
    """
    try:
        res = await valuation_engine.update_payment_status(
            compensation_id=compensation_id,
            new_status=req.status,
            notes=req.notes,
            actor_id=user.user_id or "OFFICER",
            db=db,
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Status update failed: {e}")
