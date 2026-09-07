"""
Pydantic Schemas for AI Assistant, Dispute Summarization, Resolution & What-If
SIH26016 Land Acquisition Platform - KOSH
Strict Grounding & Provenance Contract Enforced
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SourceType(str, Enum):
    COMPLAINT = "COMPLAINT"
    DOCUMENT = "DOCUMENT"
    AWARD = "AWARD"
    LEGAL_SECTION = "LEGAL_SECTION"
    STATUTORY_CLOCK = "STATUTORY_CLOCK"
    CPM_NODE = "CPM_NODE"
    RISK_DIMENSION = "RISK_DIMENSION"
    FIELD_VERIFICATION = "FIELD_VERIFICATION"
    WHAT_IF_RESULT = "WHAT_IF_RESULT"


class ConfidenceLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"


class EvidenceRef(BaseModel):
    """Explicit source citation for any factual statement made by the assistant."""
    source_type: SourceType
    source_id: str = Field(..., description="ID of the referenced record (e.g. CMP-003, DOC-001, SEC-38)")
    label: str = Field(..., description="Human-readable citation label (e.g. 'Complaint CMP-003: Boundary Mismatch')")
    parcel_id: Optional[str] = None
    project_id: Optional[str] = None
    verification_status: Optional[str] = "VERIFIED"
    url_or_route: Optional[str] = None


class AIContext(BaseModel):
    """
    Normalized, privacy-sanitized grounding context.
    The AI assistant is strictly forbidden from answering with facts outside this context.
    """
    parcel_id: Optional[str] = None
    project_id: Optional[str] = None
    complaint_id: Optional[str] = None
    case_id: Optional[str] = None

    parcel_summary: Dict[str, Any] = Field(default_factory=dict)
    project_summary: Dict[str, Any] = Field(default_factory=dict)
    active_issues: List[Dict[str, Any]] = Field(default_factory=list)
    verified_evidence: List[EvidenceRef] = Field(default_factory=list)
    statutory_clocks: List[Dict[str, Any]] = Field(default_factory=list)
    legal_references: List[Dict[str, Any]] = Field(default_factory=list)
    compensation_summary: Dict[str, Any] = Field(default_factory=dict)
    cpm_impact: Dict[str, Any] = Field(default_factory=dict)
    risk_summary: Dict[str, Any] = Field(default_factory=dict)
    available_actions: List[Dict[str, Any]] = Field(default_factory=list)

    evidence_completeness: ConfidenceLevel = ConfidenceLevel.HIGH
    sanitization_flags: List[str] = Field(default_factory=list)


class RecommendedAction(BaseModel):
    """Action recommendation tied to an authenticated, executable system workflow."""
    action_type: str = Field(..., description="Action category (e.g. REQUEST_EVIDENCE, VERIFY_STAY, PROCESS_COMPENSATION)")
    title: str
    rationale: str
    legal_basis: str
    evidence_refs: List[EvidenceRef] = Field(default_factory=list)
    expected_effect: str = Field(..., description="Project float or deadline impact (e.g. 'Recovers 14 days of CPM float')")
    prerequisites: List[str] = Field(default_factory=list)
    risk_if_not_taken: str = Field(..., description="Statutory or operational exposure (e.g. 'Risk of Sec 19(7) lapse')")
    executable: bool = Field(..., description="True if the current user role and state permit execution")
    execution_route: Optional[str] = Field(None, description="UI route to execute the action (e.g. '/action-center')")


class ChronologyItem(BaseModel):
    date: str
    event: str
    evidence_ref: Optional[EvidenceRef] = None
    actor_or_authority: Optional[str] = None


class DisputeSummary(BaseModel):
    """Structured, evidence-grounded summary of an acquisition or title grievance."""
    dispute_id: str
    parcel_id: Optional[str] = None
    project_id: Optional[str] = None
    title: str
    parties_involved: List[str] = Field(default_factory=list)

    # Strictly separated epistemological sections
    facts: List[str] = Field(..., description="Authoritative, verified system facts")
    interpretations: List[str] = Field(default_factory=list, description="Claimant assertions or contested claims")
    recommendations: List[str] = Field(default_factory=list, description="Advisory next steps for officer")

    chronology: List[ChronologyItem] = Field(default_factory=list)
    compensation_status: str
    statutory_clock_status: str
    cpm_float_impact: str
    verified_documents: List[EvidenceRef] = Field(default_factory=list)
    missing_evidence_checklist: List[str] = Field(default_factory=list)
    applicable_legal_provisions: List[str] = Field(default_factory=list)
    next_action_recommendation: Optional[RecommendedAction] = None

    disclaimer: str = (
        "AI-Generated Advisory Dispute Summary. Facts are grounded in registered system records. "
        "Adjudication and statutory determinations remain the exclusive authority of the Competent Authority (LALR)."
    )


class NLWhatIfScenario(BaseModel):
    """Natural language translation into deterministic What-If simulator parameters."""
    raw_query: str
    is_supported: bool = True
    unsupported_reason: Optional[str] = None
    intervention_type: Optional[str] = None
    target_entity_ids: List[str] = Field(default_factory=list)
    acceleration_factor: float = 1.0
    parsed_intent: str


class NLWhatIfResult(BaseModel):
    """Deterministic What-If execution combined with plain-language explanation."""
    scenario: NLWhatIfScenario
    baseline_delay_days: int
    scenario_delay_days: int
    delay_reduction_days: int
    baseline_critical_path: List[str] = Field(default_factory=list)
    scenario_critical_path: List[str] = Field(default_factory=list)
    cost_estimate_units: Dict[str, Any] = Field(default_factory=dict)
    explanation: str
    provenance: str = "DETERMINISTIC_CPM_SIMULATOR"
    production_mutated: bool = False


class AIAnswer(BaseModel):
    """Comprehensive grounded response emitted by the assistant."""
    query: str
    answer: str
    confidence: ConfidenceLevel
    source_refs: List[EvidenceRef] = Field(default_factory=list)
    legal_refs: List[str] = Field(default_factory=list)
    evidence_refs: List[EvidenceRef] = Field(default_factory=list)
    recommended_actions: List[RecommendedAction] = Field(default_factory=list)
    whatif_preview: Optional[NLWhatIfResult] = None
    assumptions: List[str] = Field(default_factory=list)
    unanswered_questions: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    disclaimer: str = (
        "AI-Generated Advisory Output. Grounded in KOSH registered project state. "
        "Decisions remain subject to authorized officer review under RFCTLARR Act 2013."
    )


class AIAssistantQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=1000, description="Natural language question")
    parcel_id: Optional[str] = None
    project_id: Optional[str] = "P-NH927A"
    complaint_id: Optional[str] = None
    include_whatif: bool = False


class VoiceTranscriptionRequest(BaseModel):
    audio_base64: Optional[str] = None
    format: str = "webm"
    language: str = "en"
    parcel_context: Optional[str] = None


class VoiceTranscriptionResponse(BaseModel):
    transcription: str
    confidence: float
    language_detected: str
    sanitized: bool
    filtered_payloads_count: int = 0


class VoiceSynthesisRequest(BaseModel):
    text: str = Field(..., max_length=2000)
    voice: Optional[str] = "neutral"


class VoiceSynthesisResponse(BaseModel):
    audio_base64: str
    mime_type: str = "audio/wav"
    duration_seconds: float
