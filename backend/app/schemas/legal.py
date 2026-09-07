"""
Pydantic Schemas for Legal & Rights Knowledge Center
"""
from typing import Any, Optional
from pydantic import BaseModel, Field


class LegalProvisionRead(BaseModel):
    id: str
    act_name: str
    act_short_name: str
    section_number: str
    subsection: Optional[str] = None
    title: str
    category: str
    applies_to: str = "BOTH"
    acquisition_stage: Optional[str] = None
    plain_language_summary: str
    landowner_guidance: Optional[str] = None
    officer_guidance: Optional[str] = None
    required_documents: list[str] = []
    statutory_citations: list[str] = []
    deadline_days: Optional[int] = None
    deadline_trigger: Optional[str] = None
    deadline_rule_type: Optional[str] = None
    calendar_rule: Optional[str] = "CALENDAR_DAYS"
    consequence_if_overdue: Optional[str] = None
    source_url: str
    source_document: str
    source_version: str
    effective_from: Optional[str] = None
    effective_to: Optional[str] = None
    jurisdiction: str = "CENTRAL"
    central_or_state: str = "CENTRAL"
    verification_status: bool = True
    disclaimer: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class OfficerStageGuideItem(BaseModel):
    stage_number: int
    stage_key: str
    stage_name: str
    applicable_laws: list[str]
    officer_responsibility: str
    required_evidence: list[str]
    notified_parties: list[str]
    statutory_clock: str
    risk_if_overdue: str
    related_bhumi_entity: str
    related_milestone: str
    provisions: list[LegalProvisionRead] = []


class LandownerSectionGuideItem(BaseModel):
    section_key: str
    title: str
    subtitle: str
    questions: list[dict[str, Any]]
    provisions: list[LegalProvisionRead] = []


class ParcelLegalContext(BaseModel):
    parcel_id: str
    acquisition_status: str
    current_stage: str
    ownership_conflict: bool
    conflict_type: str
    applicable_provisions: list[LegalProvisionRead]
    disclaimer: str


class ComplaintLegalContext(BaseModel):
    complaint_id: str
    parcel_id: Optional[str] = None
    complaint_type: str
    conflict_type: str
    procedural_stage: str
    relevant_provisions: list[LegalProvisionRead]
    required_officer_action: str
    statutory_limitation: Optional[str] = None
    disclaimer: str
