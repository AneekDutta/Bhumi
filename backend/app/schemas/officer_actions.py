"""
Pydantic Schemas for KOSH Officer Action Center
SIH26016 Land Acquisition Digital Twin Platform

Operational action representation derived from:
STATUTORY DEADLINE -> CASE/PARCEL -> CURRENT ACQUISITION STATE -> OFFICER ACTION -> MILESTONE -> DEPENDENCY -> CPM IMPACT
"""
from datetime import date
from typing import Any, Optional
from pydantic import BaseModel, Field


class ActionEvidenceInfo(BaseModel):
    document_id: Optional[str] = None
    document_type: str
    title: str
    status: str  # VERIFIED | PENDING_UPLOAD | MISSING | REJECTED
    verified_at: Optional[str] = None
    verified_by: Optional[str] = None
    document_url: Optional[str] = None
    notes: Optional[str] = None


class ActionCpmImpact(BaseModel):
    is_critical_path: bool
    milestone_id: Optional[str] = None
    milestone_name: Optional[str] = None
    operational_delay_cpm_days: int = 0
    downstream_blocked_entities_count: int = 0
    downstream_summary: str
    total_float_days: int = 0
    whatif_simulation_route: Optional[str] = None


class OfficerActionItem(BaseModel):
    id: str  # Unique action ID (e.g. ACT-P00003-SEC19)
    deadline_id: str
    case_id: str
    parcel_id: str
    survey_no: Optional[str] = None
    village_name: Optional[str] = None
    village_id: Optional[str] = None
    landowner_name: Optional[str] = None
    area_hectares: Optional[float] = None
    current_acquisition_status: str

    # 1. What Requires Attention
    action_title: str
    required_action: str
    responsible_role: str

    # 2. Why
    rule_type: str  # LIMITATION_PERIOD | PROCEDURAL_WINDOW | LAPSE_PROVISION | STATUTORY_PRECONDITION | INTEREST_ESCALATION_TRIGGER
    legal_effect: str  # PROCEEDINGS_LAPSE | RIGHT_BARRED | PENAL_INTEREST_ACCRUAL | ACTION_REQUIRED | BAR_ON_POSSESSION
    consequence_if_overdue: str
    is_mandatory_lapse: bool = False

    # 3. Governing Law
    legal_provision_id: Optional[str] = None
    statutory_section: str
    act_name: str
    legal_citation_text: str
    legal_provision_url: str

    # 4. Applicable Deadline
    trigger_event: str
    trigger_date: str
    calculated_due_date: str
    days_remaining: int
    deadline_status: str  # UPCOMING | DUE_SOON | OVERDUE | COMPLETED | LAPSED

    # 5. Supporting Evidence
    evidence_status: str  # VERIFIED | PENDING_UPLOAD | DEFICIENT
    required_evidence_type: str
    evidence_list: list[ActionEvidenceInfo] = []

    # 6. Downstream Project Impact
    cpm_impact: ActionCpmImpact

    # Prioritization & Categorization
    priority_category: str  # CRITICAL | DUE_SOON | BLOCKED | PROJECT_IMPACT | UPCOMING | COMPLETED
    priority_score: int
    priority_reasons: list[str] = []

    # Court Stay / Judicial Tracking
    order_specific_court_stay: bool = False
    court_order_reference: Optional[str] = None
    court_stay_verified: bool = False
    judicial_verification_status: str = "NOT_APPLICABLE"  # NOT_APPLICABLE | VERIFIED | PENDING_VERIFICATION
    stay_start_date: Optional[str] = None
    stay_end_date: Optional[str] = None
    stay_days: int = 0

    # Causal Chain Details
    case_notification_date: Optional[str] = None
    affected_milestone_id: Optional[str] = None
    affected_milestone_name: Optional[str] = None
    dependency_summary: Optional[str] = None
    project_id: Optional[str] = None
    district_id: Optional[str] = None

    # Completion / Resolution Info
    action_status: str = "OPEN"  # OPEN | VERIFICATION_RECORDED | COMPLETED
    statutory_fulfillment_status: str = "PENDING_EVIDENTIARY_RECORD"  # PENDING_EVIDENTIARY_RECORD | FULFILLED | NOT_APPLICABLE
    completed_date: Optional[str] = None
    evidence_document_id: Optional[str] = None
    officer_notes: Optional[str] = None
    resolved_by: Optional[str] = None
    statutory_deadline_completed: bool = False

    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class OfficerActionSummary(BaseModel):
    total_actions: int
    critical_count: int
    due_soon_count: int
    blocked_count: int
    project_impact_count: int
    upcoming_count: int
    completed_count: int
    mandatory_lapse_count: int
    critical_path_blocker_count: int
    disclaimer: str


class ResolveActionRequest(BaseModel):
    completed_date: date = Field(..., description="Official date of completed action or verification")
    evidence_document_id: Optional[str] = Field(None, description="Official proof document ID (e.g. Gazette notification or PFMS voucher). If omitted, statutory deadline remains open.")
    officer_notes: str = Field(..., min_length=3, description="Officer verification remarks and factual findings")
    mark_statutory_complete: bool = Field(True, description="Whether to verify and complete statutory deadline if evidence satisfies rule")


class RecordStayRequest(BaseModel):
    court_order_reference: str = Field(..., min_length=3, description="Court order number / writ petition citation")
    stay_order_date: date = Field(..., description="Date stay or interim injunction was granted by Court")
    stay_vacated_date: Optional[date] = Field(None, description="Date stay was vacated or dismissed, if applicable")
    stay_days: Optional[int] = Field(None, ge=1, le=730, description="Explicit days if specified in order; otherwise computed from dates")
    judicial_verification_status: str = Field("PENDING_VERIFICATION", description="VERIFIED | PENDING_VERIFICATION")
    court_name: Optional[str] = Field(None, description="Name of Court (e.g. High Court of Judicature for Rajasthan at Jaipur)")
    notes: Optional[str] = Field(None, description="Judicial scope, injunction terms, and counsel notes")
