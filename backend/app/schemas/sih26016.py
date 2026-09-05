"""
Pydantic Schemas for SIH26016 Land Acquisition Digital Twin
Preserves and validates source_type provenance on all payloads.
"""
from datetime import date, datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

SourceType = Literal["REAL_PUBLIC", "SYNTHETIC", "USER_ENTERED", "MODEL_DERIVED"]


class ProvenanceBase(BaseModel):
    source_type: SourceType = "SYNTHETIC"
    source: Optional[str] = None
    source_url: Optional[str] = None
    source_timestamp: Optional[datetime] = None
    verification_status: Optional[str] = None
    confidence: Optional[float] = None


class SIHProjectSchema(ProvenanceBase):
    project_id: str
    name: str
    project_type: str
    state: Optional[str] = None
    district: Optional[str] = None
    estimated_cost: Optional[float] = None
    start_date: Optional[date] = None
    target_completion: Optional[date] = None
    projected_completion: Optional[date] = None
    status: Optional[str] = None
    total_parcels: Optional[int] = 0
    unresolved_parcels: Optional[int] = 0
    project_delay_days: Optional[int] = 0
    critical_path_blocked: Optional[bool] = False


class SIHCompensationSchema(ProvenanceBase):
    compensation_id: str
    case_id: Optional[str] = None
    market_value_base: Optional[float] = 0.0
    multiplier_factor: Optional[float] = 1.0
    asset_value: Optional[float] = 0.0
    severance_damage: Optional[float] = 0.0
    subtotal_before_solatium: Optional[float] = 0.0
    solatium_amount: Optional[float] = 0.0
    interest_12pct_amount: Optional[float] = 0.0
    total_compensation: Optional[float] = 0.0
    compensation_status: Optional[str] = None


class SIHRRSchema(ProvenanceBase):
    rr_id: str
    case_id: Optional[str] = None
    family_type: Optional[str] = None
    housing_entitlement: Optional[float] = 0.0
    subsistence_allowance: Optional[float] = 0.0
    transport_allowance: Optional[float] = 0.0
    resettlement_allowance: Optional[float] = 0.0
    livelihood_option: Optional[str] = None
    rr_status: Optional[str] = None


class SIHLegalCaseSchema(ProvenanceBase):
    legal_case_id: str
    case_id: Optional[str] = None
    case_name: Optional[str] = None
    court: Optional[str] = None
    filed_date: Optional[date] = None
    legal_issue: Optional[str] = None
    legal_status: Optional[str] = None
    decision_notes: Optional[str] = None
    is_reference_case: Optional[bool] = False


class SIHDocumentSchema(ProvenanceBase):
    document_id: str
    case_id: Optional[str] = None
    parcel_id: Optional[str] = None
    document_type: Optional[str] = None
    upload_date: Optional[date] = None
    document_status: Optional[str] = None
    file_ref: Optional[str] = None


class SIHVerificationSchema(ProvenanceBase):
    verification_id: str
    document_id: Optional[str] = None
    parcel_id: Optional[str] = None
    verification_type: Optional[str] = None
    status: Optional[str] = None
    officer_id: Optional[str] = None
    verified_at: Optional[datetime] = None


class SIHParcelSummarySchema(ProvenanceBase):
    parcel_id: str
    project_id: Optional[str] = None
    village_id: Optional[str] = None
    village_name: Optional[str] = None
    survey_number: str
    area_sqm: Optional[float] = None
    area_hectares: Optional[float] = None
    land_use: Optional[str] = None
    acquisition_status: Optional[str] = None
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    ownership_conflict: Optional[bool] = False
    conflict_type: Optional[str] = None
    criticality_score: Optional[float] = 0.0
    risk_score: Optional[float] = 0.0
    is_hidden_critical: Optional[bool] = False
    is_critical_path: Optional[bool] = False
    recommended_action: Optional[str] = None


class CriticalityBreakdown(BaseModel):
    w1_downstream_segments: float = 0.0
    w2_downstream_milestones: float = 0.0
    w3_single_point_failure: float = 0.0
    w4_progress_incomplete: float = 0.0
    total_score: float = 0.0


class SIHParcelDetailSchema(ProvenanceBase):
    parcel_id: str
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    village_id: Optional[str] = None
    village_name: Optional[str] = None
    tehsil: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    survey_number: str
    area_sqm: Optional[float] = None
    area_hectares: Optional[float] = None
    land_use: Optional[str] = None
    acquisition_status: Optional[str] = None
    owner: Optional[Dict[str, Any]] = None
    acquisition_case: Optional[Dict[str, Any]] = None
    compensation: Optional[SIHCompensationSchema] = None
    rr: Optional[SIHRRSchema] = None
    legal_cases: List[SIHLegalCaseSchema] = []
    documents: List[SIHDocumentSchema] = []
    verifications: List[SIHVerificationSchema] = []
    upstream_blockers: List[Dict[str, Any]] = []
    downstream_dependencies: List[Dict[str, Any]] = []
    criticality_score: float = 0.0
    criticality_breakdown: Optional[CriticalityBreakdown] = None
    risk_score: float = 0.0
    recommended_action: str
    is_critical_path: bool = False


# CPM & Simulation Schemas
class ScheduleForecast(BaseModel):
    project_finish: str
    project_delay_days: int
    critical_path: List[str]
    total_duration_days: float


class BottleneckReport(BaseModel):
    parcel_id: str
    survey_number: str
    village_name: str
    delay_days: float
    urgency: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    is_critical_path: bool
    risk_score: float
    criticality_score: float
    active_blocker: str
    recommended_action: str
    causal_chain: List[str]


class CriticalPathResponse(BaseModel):
    project_id: str
    baseline_finish: str
    projected_finish: str
    project_delay_days: int
    critical_path_length_days: float
    critical_path_nodes: List[str]
    critical_path_parcels: List[str]
    bottlenecks: List[BottleneckReport]
    source_type: SourceType = "MODEL_DERIVED"


class SimulationRequest(BaseModel):
    intervention_type: Literal[
        "resolve_ownership_conflict",
        "process_compensation",
        "complete_field_verification",
        "resolve_legal_case",
        "deploy_additional_officers",
        "accelerate_approval",
        "process_rr",
        "RESOLVE_BLOCKER"
    ]
    input_entity_ids: List[str] = Field(..., description="Target parcel_id(s) or case_id(s)")
    acceleration_factor: Optional[float] = 1.0
    notes: Optional[str] = None


class SimulationResponse(BaseModel):
    intervention_type: str
    target_entities: List[str]
    preconditions_met: bool
    precondition_warnings: List[str] = []
    before: ScheduleForecast
    after: ScheduleForecast
    delay_reduction_days: int
    cost_estimate_units: Dict[str, Any]
    affected_entities: List[str]
    source_type: SourceType = "MODEL_DERIVED"
