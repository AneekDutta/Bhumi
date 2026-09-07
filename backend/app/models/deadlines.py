"""
SQLAlchemy Domain Models for Statutory Deadline & Legal Clock Engine
Maps to statutory_deadline_rules and statutory_deadlines in PostgreSQL.
Hardened with clear decoupling of statutory legal effect from KOSH CPM simulation heuristics.
"""
from typing import Any, Optional
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.models.sih26016 import SIHBase


class SIHStatutoryDeadlineRule(SIHBase):
    __tablename__ = "statutory_deadline_rules"

    id = Column(Text, primary_key=True)
    legal_provision_id = Column(Text, ForeignKey("legal_provisions.id"), nullable=True)
    rule_name = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    jurisdiction = Column(Text, nullable=False, default="CENTRAL")
    applies_to_role = Column(Text, nullable=False, default="FIELD_OFFICER")
    trigger_event = Column(Text, nullable=False)
    clock_type = Column(Text, nullable=False)  # CALENDAR_DAYS | MONTHS | YEARS | FIXED_DATE | EVENT_DEPENDENT
    duration_value = Column(Integer, nullable=True)
    duration_unit = Column(Text, nullable=True)  # DAYS | WEEKS | MONTHS | YEARS | EVENT
    start_rule = Column(Text, nullable=False, default="DATE_OF_EVENT")
    end_rule = Column(Text, nullable=False, default="EXACT_DATE")
    responsible_role = Column(Text, nullable=False)
    required_action = Column(Text, nullable=False)
    consequence_if_overdue = Column(Text, nullable=False)
    is_mandatory_lapse = Column(Boolean, nullable=False, default=False)
    cpm_delay_weight_days = Column(Integer, nullable=False, default=0)

    # Hardened audit & statutory vs operational fields
    rule_type = Column(Text, nullable=False, default="PROCEDURAL_WINDOW")
    legal_effect = Column(Text, nullable=False, default="ACTION_REQUIRED")
    calculation_basis = Column(Text, nullable=True)
    statutory_vs_operational = Column(Text, nullable=False, default="STATUTORY")
    operational_delay_cpm_days = Column(Integer, nullable=False, default=0)
    operational_impact_notes = Column(Text, nullable=True)
    exception_type = Column(Text, nullable=True)
    verification_notes = Column(Text, nullable=True)
    verified_at = Column(DateTime(timezone=True), server_default=func.now())
    verified_by = Column(Text, nullable=True, default="BHUMI_LEGAL_AUDIT_RFCTLARR_2013")

    calculation_notes = Column(Text, nullable=True)
    exceptions = Column(JSONB, nullable=True, default=list)
    source_url = Column(Text, nullable=False)
    source_version = Column(Text, nullable=False)
    effective_from = Column(Date, nullable=True)
    effective_to = Column(Date, nullable=True)
    verification_status = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    deadlines = relationship("SIHStatutoryDeadline", back_populates="rule", cascade="all, delete-orphan")

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "legal_provision_id": self.legal_provision_id,
            "rule_name": self.rule_name,
            "description": self.description,
            "jurisdiction": self.jurisdiction,
            "applies_to_role": self.applies_to_role,
            "trigger_event": self.trigger_event,
            "clock_type": self.clock_type,
            "duration_value": self.duration_value,
            "duration_unit": self.duration_unit,
            "start_rule": self.start_rule,
            "end_rule": self.end_rule,
            "responsible_role": self.responsible_role,
            "required_action": self.required_action,
            "consequence_if_overdue": self.consequence_if_overdue,
            "is_mandatory_lapse": self.is_mandatory_lapse,
            "cpm_delay_weight_days": self.cpm_delay_weight_days,
            "rule_type": self.rule_type,
            "legal_effect": self.legal_effect,
            "calculation_basis": self.calculation_basis,
            "statutory_vs_operational": self.statutory_vs_operational,
            "operational_delay_cpm_days": self.operational_delay_cpm_days,
            "operational_impact_notes": self.operational_impact_notes,
            "exception_type": self.exception_type,
            "verification_notes": self.verification_notes,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None,
            "verified_by": self.verified_by,
            "calculation_notes": self.calculation_notes,
            "exceptions": self.exceptions or [],
            "source_url": self.source_url,
            "source_version": self.source_version,
            "effective_from": self.effective_from.isoformat() if self.effective_from else None,
            "effective_to": self.effective_to.isoformat() if self.effective_to else None,
            "verification_status": self.verification_status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class SIHStatutoryDeadline(SIHBase):
    __tablename__ = "statutory_deadlines"

    id = Column(Text, primary_key=True)
    rule_id = Column(Text, ForeignKey("statutory_deadline_rules.id"), nullable=False)
    acquisition_case_id = Column(Text, nullable=True)
    parcel_id = Column(Text, nullable=True)
    milestone_id = Column(Text, nullable=True)
    trigger_event = Column(Text, nullable=False)
    trigger_date = Column(Date, nullable=False)
    calculated_due_date = Column(Date, nullable=False)
    completed_date = Column(Date, nullable=True)
    status = Column(Text, nullable=False, default="UPCOMING")  # UPCOMING | DUE_SOON | OVERDUE | COMPLETED | WAIVED | SUPERSEDED | NOT_APPLICABLE
    responsible_role = Column(Text, nullable=False)
    source_snapshot = Column(JSONB, nullable=True, default=dict)
    calculation_trace = Column(JSONB, nullable=True, default=dict)
    extension_days = Column(Integer, nullable=False, default=0)
    extension_reason = Column(Text, nullable=True)
    is_blocking_cpm = Column(Boolean, nullable=False, default=False)

    # Judicial stay order & outcome fields
    order_specific_court_stay = Column(Boolean, nullable=False, default=False)
    court_order_reference = Column(Text, nullable=True)
    court_stay_order_verified = Column(Boolean, nullable=False, default=False)
    statutory_consequence_applied = Column(Text, nullable=True)
    operational_cpm_delay_applied = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    rule = relationship("SIHStatutoryDeadlineRule", back_populates="deadlines")

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "rule_id": self.rule_id,
            "acquisition_case_id": self.acquisition_case_id,
            "parcel_id": self.parcel_id,
            "milestone_id": self.milestone_id,
            "trigger_event": self.trigger_event,
            "trigger_date": self.trigger_date.isoformat() if self.trigger_date else None,
            "calculated_due_date": self.calculated_due_date.isoformat() if self.calculated_due_date else None,
            "completed_date": self.completed_date.isoformat() if self.completed_date else None,
            "status": self.status,
            "responsible_role": self.responsible_role,
            "source_snapshot": self.source_snapshot or {},
            "calculation_trace": self.calculation_trace or {},
            "extension_days": self.extension_days,
            "extension_reason": self.extension_reason,
            "is_blocking_cpm": self.is_blocking_cpm,
            "order_specific_court_stay": self.order_specific_court_stay,
            "court_order_reference": self.court_order_reference,
            "court_stay_order_verified": self.court_stay_order_verified,
            "statutory_consequence_applied": self.statutory_consequence_applied,
            "operational_cpm_delay_applied": self.operational_cpm_delay_applied,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
