"""
Pydantic Schemas for KOSH Acquisition Risk Engine
SIH26016 Land Acquisition Digital Twin Platform

Provides 10 independent, transparent risk dimensions answering 'WHY?'
Strictly avoids opaque, single-number black box AI scores.
"""
from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field


class RiskSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RiskDimensionType(str, Enum):
    STATUTORY_RISK = "STATUTORY_RISK"
    PROCEDURAL_RISK = "PROCEDURAL_RISK"
    DOCUMENT_RISK = "DOCUMENT_RISK"
    COMPENSATION_RISK = "COMPENSATION_RISK"
    TITLE_RISK = "TITLE_RISK"
    DISPUTE_RISK = "DISPUTE_RISK"
    POSSESSION_RISK = "POSSESSION_RISK"
    R_AND_R_RISK = "R_AND_R_RISK"
    PROJECT_EXECUTION_RISK = "PROJECT_EXECUTION_RISK"
    DATA_QUALITY_RISK = "DATA_QUALITY_RISK"


class RiskDimensionEvaluation(BaseModel):
    dimension: RiskDimensionType
    label: str
    severity: RiskSeverity
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    factors: list[str] = []
    evidence_sources: list[str] = []
    governing_legal_reference: str
    downstream_cpm_impact_days: int = 0
    recommended_officer_review: str


class ParcelRiskDossier(BaseModel):
    parcel_id: str
    case_id: str
    project_id: str
    district: str
    village: str
    evaluated_at: str
    overall_highest_severity: RiskSeverity
    primary_risk_dimension: str
    why_explanation_summary: str
    dimensions: list[RiskDimensionEvaluation] = []
    cpm_critical_path_bottleneck: bool = False
    total_float_days: int = 0
    source_type: str = "DETERMINISTIC_EXPLAINABLE_RULES"
    disclaimer: str = (
        "Advisory decision support generated deterministically from statutory rules, "
        "evidence records, and NetworkX CPM topology. Does not determine legal rights."
    )


class ProjectRiskSummary(BaseModel):
    project_id: str
    total_parcels_evaluated: int
    critical_risk_count: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    statutory_lapse_threat_count: int
    zero_float_critical_count: int
    top_risk_parcels: list[dict[str, Any]] = []
    evaluated_at: str
