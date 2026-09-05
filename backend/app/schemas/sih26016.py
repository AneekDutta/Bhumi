"""
Pydantic Schemas for SIH26016 Land Acquisition Digital Twin
Preserves and validates source_type provenance on all payloads.
"""
from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

SourceType = Literal["REAL_PUBLIC", "SYNTHETIC", "USER_ENTERED", "MODEL_DERIVED"]


class ProvenanceBase(BaseModel):
    source_type: SourceType = "SYNTHETIC"
    source: str | None = None
    source_url: str | None = None
    source_timestamp: datetime | None = None
    verification_status: str | None = None
    confidence: float | None = None


class SIHProjectSchema(ProvenanceBase):
    project_id: str
    name: str
    project_type: str
    state: str | None = None
    district: str | None = None
    estimated_cost: float | None = None
    start_date: date | None = None
    target_completion: date | None = None
    projected_completion: date | None = None
    status: str | None = None
    total_parcels: int | None = 0
    unresolved_parcels: int | None = 0
    project_delay_days: int | None = 0
    critical_path_blocked: bool | None = False


class SIHCompensationSchema(ProvenanceBase):
    compensation_id: str
    case_id: str | None = None
    market_value_base: float | None = 0.0
    multiplier_factor: float | None = 1.0
    asset_value: float | None = 0.0
    severance_damage: float | None = 0.0
    subtotal_before_solatium: float | None = 0.0
    solatium_amount: float | None = 0.0
    interest_12pct_amount: float | None = 0.0
    total_compensation: float | None = 0.0
    compensation_status: str | None = None


class SIHRRSchema(ProvenanceBase):
    rr_id: str
    case_id: str | None = None
    family_type: str | None = None
    housing_entitlement: float | None = 0.0
    subsistence_allowance: float | None = 0.0
    transport_allowance: float | None = 0.0
    resettlement_allowance: float | None = 0.0
    livelihood_option: str | None = None
    rr_status: str | None = None


class SIHLegalCaseSchema(ProvenanceBase):
    legal_case_id: str
    case_id: str | None = None
    case_name: str | None = None
    court: str | None = None
    filed_date: date | None = None
    legal_issue: str | None = None
    legal_status: str | None = None
    decision_notes: str | None = None
    is_reference_case: bool | None = False


class SIHDocumentSchema(ProvenanceBase):
    document_id: str
    case_id: str | None = None
    parcel_id: str | None = None
    document_type: str | None = None
    upload_date: date | None = None
    document_status: str | None = None
    file_ref: str | None = None


class SIHVerificationSchema(ProvenanceBase):
    verification_id: str
    document_id: str | None = None
    parcel_id: str | None = None
    verification_type: str | None = None
    status: str | None = None
    officer_id: str | None = None
    verified_at: datetime | None = None


class SIHParcelSummarySchema(ProvenanceBase):
    parcel_id: str
    project_id: str | None = None
    village_id: str | None = None
    village_name: str | None = None
    survey_number: str
    area_sqm: float | None = None
    area_hectares: float | None = None
    land_use: str | None = None
    acquisition_status: str | None = None
    owner_id: str | None = None
    owner_name: str | None = None
    ownership_conflict: bool | None = False
    conflict_type: str | None = None
    criticality_score: float | None = 0.0
    risk_score: float | None = 0.0
    is_hidden_critical: bool | None = False
    is_critical_path: bool | None = False
    recommended_action: str | None = None


class CriticalityBreakdown(BaseModel):
    w1_downstream_segments: float = 0.0
    w2_downstream_milestones: float = 0.0
    w3_single_point_failure: float = 0.0
    w4_progress_incomplete: float = 0.0
    total_score: float = 0.0


class SIHParcelDetailSchema(ProvenanceBase):
    parcel_id: str
    project_id: str | None = None
    project_name: str | None = None
    village_id: str | None = None
    village_name: str | None = None
    tehsil: str | None = None
    district: str | None = None
    state: str | None = None
    survey_number: str
    area_sqm: float | None = None
    area_hectares: float | None = None
    land_use: str | None = None
    acquisition_status: str | None = None
    owner: dict[str, Any] | None = None
    acquisition_case: dict[str, Any] | None = None
    compensation: SIHCompensationSchema | None = None
    rr: SIHRRSchema | None = None
    legal_cases: list[SIHLegalCaseSchema] = []
    documents: list[SIHDocumentSchema] = []
    verifications: list[SIHVerificationSchema] = []
    upstream_blockers: list[dict[str, Any]] = []
    downstream_dependencies: list[dict[str, Any]] = []
    criticality_score: float = 0.0
    criticality_breakdown: CriticalityBreakdown | None = None
    risk_score: float = 0.0
    recommended_action: str
    is_critical_path: bool = False


# CPM & Simulation Schemas
class ScheduleForecast(BaseModel):
    project_finish: str
    project_delay_days: int
    critical_path: list[str]
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
    causal_chain: list[str]


class CriticalPathResponse(BaseModel):
    project_id: str
    baseline_finish: str
    projected_finish: str
    project_delay_days: int
    critical_path_length_days: float
    critical_path_nodes: list[str]
    critical_path_parcels: list[str]
    bottlenecks: list[BottleneckReport]
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
    input_entity_ids: list[str] = Field(..., description="Target parcel_id(s) or case_id(s)")
    acceleration_factor: float | None = 1.0
    notes: str | None = None


class SimulationResponse(BaseModel):
    intervention_type: str
    target_entities: list[str]
    preconditions_met: bool
    precondition_warnings: list[str] = []
    before: ScheduleForecast
    after: ScheduleForecast
    delay_reduction_days: int
    cost_estimate_units: dict[str, Any]
    affected_entities: list[str]
    source_type: SourceType = "MODEL_DERIVED"


class FieldOfficerRead(ProvenanceBase):
    officer_id: str
    name: str
    designation: str | None = None
    department_id: str | None = None
    department_name: str | None = None
    assigned_villages: list[str] = []
    pending_tasks_count: int = 0


class FieldPhotoAttachment(BaseModel):
    id: str | None = None
    url: str | None = None
    caption: str | None = None
    category: str | None = "boundary"
    timestamp: str | None = None
    gps_lat: float | None = None
    gps_lng: float | None = None


class FieldVerificationSubmitRequest(BaseModel):
    parcel_id: str
    officer_id: str
    officer_name: str | None = "Field Officer"
    verification_type: str = "field"
    status: Literal["verified", "rejected", "disputed", "pending"] = "verified"
    gps_lat: float | None = None
    gps_lng: float | None = None
    gps_accuracy: float | None = None
    measured_area_sqm: float | None = None
    boundary_confirmed: bool = True
    possession_status: str | None = "cultivated"
    owner_present: bool = True
    owner_verified_name: str | None = None
    has_issue: bool = False
    issue_type: str | None = None
    issue_severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL_STOPPAGE"] | None = "MEDIUM"
    observations: str | None = None
    remarks: str | None = None
    photos: list[FieldPhotoAttachment] = []
    documents: list[dict[str, Any]] = []


class FieldVerificationSubmitResponse(BaseModel):
    success: bool
    verification_id: str
    parcel_id: str
    status: str
    has_issue: bool
    issue_type: str | None = None
    updated_risk_score: float
    updated_criticality_score: float
    is_critical_path: bool
    cpm_delay_days: int
    project_delay_delta_days: int
    projected_finish_date: str
    recommended_action: str
    audit_log_id: int | None = None
    notification: dict[str, Any]
    source_type: SourceType = "USER_ENTERED"


class FieldSyncBatchRequest(BaseModel):
    officer_id: str
    submissions: list[FieldVerificationSubmitRequest]


class FieldSyncBatchResponse(BaseModel):
    success: bool
    synced_count: int
    failed_count: int = 0
    results: list[FieldVerificationSubmitResponse]


class FieldIncidentConfirmRequest(BaseModel):
    officer_id: str = "OF001"
    officer_name: str | None = "Field Officer"
    confirmation_status: Literal["confirmed", "rejected", "updated"] = "confirmed"
    gps_lat: float | None = None
    gps_lng: float | None = None
    gps_latitude: float | None = None
    gps_longitude: float | None = None
    gps_accuracy: float | None = None
    observations: str | None = None
    observation_notes: str | None = None
    remarks: str | None = None
    photos: list[FieldPhotoAttachment] = []
    documents: list[dict[str, Any]] = []
    confirmed_severity: str | None = None


class AdminIncidentResolveRequest(BaseModel):
    admin_id: str = "CALA-ADMIN"
    admin_name: str | None = None
    resolution_status: str = "resolved"
    resolution_action: str | None = None
    admin_comments: str | None = None
    resolution_comment: str | None = None
    clear_cpm_blocker: bool = True
