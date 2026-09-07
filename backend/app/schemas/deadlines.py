"""
Pydantic Schemas for Statutory Deadline & Legal Clock Engine
Hardened with clear decoupling of statutory legal effect from KOSH CPM simulation heuristics.
"""
from datetime import date
from typing import Any, Optional
from pydantic import BaseModel, Field


class DeadlineRuleRead(BaseModel):
    id: str
    legal_provision_id: Optional[str] = None
    rule_name: str
    description: str
    jurisdiction: str = "CENTRAL"
    applies_to_role: str = "FIELD_OFFICER"
    trigger_event: str
    clock_type: str
    duration_value: Optional[int] = None
    duration_unit: Optional[str] = None
    start_rule: str = "DATE_OF_EVENT"
    end_rule: str = "EXACT_DATE"
    responsible_role: str
    required_action: str
    consequence_if_overdue: str
    is_mandatory_lapse: bool = False
    cpm_delay_weight_days: int = 0

    # Hardened audit fields
    rule_type: str = "PROCEDURAL_WINDOW"
    legal_effect: str = "ACTION_REQUIRED"
    calculation_basis: Optional[str] = None
    statutory_vs_operational: str = "STATUTORY"
    operational_delay_cpm_days: int = 0
    operational_impact_notes: Optional[str] = None
    exception_type: Optional[str] = None
    verification_notes: Optional[str] = None
    verified_at: Optional[str] = None
    verified_by: Optional[str] = None

    calculation_notes: Optional[str] = None
    exceptions: list[str] = []
    source_url: str
    source_version: str
    effective_from: Optional[str] = None
    effective_to: Optional[str] = None
    verification_status: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class DeadlineCalculationTrace(BaseModel):
    rule_id: str
    rule_name: str
    statutory_citation: str
    trigger_event: str
    trigger_date: str
    clock_type: str
    duration_value: Optional[int] = None
    duration_unit: Optional[str] = None
    formula: str
    calendar_logic: str
    extension_applied_days: int = 0
    court_order_reference: Optional[str] = None
    court_stay_verified: bool = False
    calculated_due_date: str
    days_remaining: int
    status: str
    is_mandatory_lapse: bool = False

    # Strictly decoupled statutory consequence vs operational CPM impact
    rule_type: str = "PROCEDURAL_WINDOW"
    legal_effect: str = "ACTION_REQUIRED"
    consequence_if_overdue: str
    statutory_vs_operational: str = "STATUTORY"
    operational_delay_cpm_days: int = 0
    operational_impact_notes: Optional[str] = None

    # Section 80 interest specific fields
    penal_interest_rate_percent: Optional[float] = None
    penal_interest_estimated_amount: Optional[float] = None

    # Section 64 condonation fields (Section 64(2) Further Proviso)
    condonation_proviso_applied: Optional[bool] = None
    condonation_days: Optional[int] = 0
    condonation_reason: Optional[str] = None
    condonation_eligible: Optional[bool] = None
    condonation_window_expires: Optional[str] = None
    condonation_notes: Optional[str] = None
    statutory_proviso_citation: Optional[str] = None

    source_authority: str
    disclaimer: str


class DeadlineCalculateRequest(BaseModel):
    rule_id: str = Field(..., description="ID of the statutory deadline rule (e.g. RULE-SEC-19-DECLARATION)")
    trigger_date: date = Field(..., description="Date on which the statutory trigger event occurred")
    extension_days: int = Field(0, ge=0, description="Court stay or sanctioned extension days to add")
    reference_date: Optional[date] = Field(None, description="Reference date to evaluate status against (defaults to today)")
    court_order_reference: Optional[str] = Field(None, description="Official court order / writ petition citation for stay exclusion")
    is_court_stay_verified: bool = Field(False, description="Whether the stay order period has been judicially verified")
    unpaid_balance_amount: Optional[float] = Field(None, description="Unpaid compensation balance for Sec 80 interest calculation")
    applicant_was_present: Optional[bool] = Field(None, description="Whether applicant was present/represented for Sec 64 reference")
    award_date: Optional[date] = Field(None, description="Award date for Sec 64(2)(b) reference calculation")
    condonation_granted: bool = Field(False, description="Whether Collector has granted condonation of delay under Sec 64(2) proviso")
    condonation_days: Optional[int] = Field(None, ge=0, le=365, description="Number of days condoned by Collector (max 365 days / 1 year)")
    condonation_reason: Optional[str] = Field(None, description="Recorded sufficient cause justification for delay condonation")


class DeadlineCalculateResponse(BaseModel):
    rule_id: str
    trigger_event: str
    trigger_date: str
    calculated_due_date: str
    days_remaining: int
    status: str  # UPCOMING | DUE_SOON | OVERDUE | COMPLETED | LAPSED
    is_mandatory_lapse: bool
    legal_effect: str
    operational_delay_cpm_days: int
    calculation_trace: DeadlineCalculationTrace


class CaseDeadlineRead(BaseModel):
    id: str
    rule_id: str
    acquisition_case_id: Optional[str] = None
    parcel_id: Optional[str] = None
    milestone_id: Optional[str] = None
    trigger_event: str
    trigger_date: str
    calculated_due_date: str
    completed_date: Optional[str] = None
    status: str
    responsible_role: str
    source_snapshot: dict[str, Any] = {}
    calculation_trace: dict[str, Any] = {}
    extension_days: int = 0
    extension_reason: Optional[str] = None
    is_blocking_cpm: bool = False
    order_specific_court_stay: bool = False
    court_order_reference: Optional[str] = None
    court_stay_order_verified: bool = False
    statutory_consequence_applied: Optional[str] = None
    operational_cpm_delay_applied: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class CompleteDeadlineRequest(BaseModel):
    completed_date: date = Field(..., description="Date of completed statutory action")
    evidence_document_id: Optional[str] = Field(None, description="Uploaded proof / order document reference")
    notes: Optional[str] = Field(None, description="Officer notes regarding completion")


class GenerateParcelDeadlinesRequest(BaseModel):
    notification_date: Optional[date] = Field(None, description="Section 11 Preliminary Notification date")
    declaration_date: Optional[date] = Field(None, description="Section 19 Declaration date")
    award_date: Optional[date] = Field(None, description="Section 23/25 Award date")
    possession_date: Optional[date] = Field(None, description="Section 38 Physical possession date")
    case_id: Optional[str] = Field(None, description="Associated acquisition case identifier")


class CorridorDeadlineSummary(BaseModel):
    total_deadlines: int
    upcoming_count: int
    due_soon_count: int
    overdue_count: int
    completed_count: int
    mandatory_lapse_risks_count: int
    active_cpm_blockers_count: int
    critical_lapse_cases: list[dict[str, Any]] = []
    disclaimer: str
