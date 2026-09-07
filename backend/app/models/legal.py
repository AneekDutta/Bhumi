"""
SQLAlchemy Domain Model for Legal & Rights Knowledge Center
Maps to table legal_provisions in PostgreSQL.
"""
from typing import Any
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Integer,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB

from app.models.sih26016 import SIHBase


class SIHLegalProvision(SIHBase):
    __tablename__ = "legal_provisions"

    id = Column(Text, primary_key=True)
    act_name = Column(Text, nullable=False)
    act_short_name = Column(Text, nullable=False)
    section_number = Column(Text, nullable=False)
    subsection = Column(Text, nullable=True)
    title = Column(Text, nullable=False)
    category = Column(Text, nullable=False)
    applies_to = Column(Text, nullable=False, default="BOTH")
    acquisition_stage = Column(Text, nullable=True)
    plain_language_summary = Column(Text, nullable=False)
    landowner_guidance = Column(Text, nullable=True)
    officer_guidance = Column(Text, nullable=True)
    required_documents = Column(JSONB, nullable=True, default=list)
    statutory_citations = Column(JSONB, nullable=True, default=list)
    deadline_days = Column(Integer, nullable=True)
    deadline_trigger = Column(Text, nullable=True)
    deadline_rule_type = Column(Text, nullable=True)
    calendar_rule = Column(Text, nullable=True, default="CALENDAR_DAYS")
    consequence_if_overdue = Column(Text, nullable=True)
    source_url = Column(Text, nullable=False)
    source_document = Column(Text, nullable=False)
    source_version = Column(Text, nullable=False)
    effective_from = Column(Date, nullable=True)
    effective_to = Column(Date, nullable=True)
    jurisdiction = Column(Text, nullable=False, default="CENTRAL")
    central_or_state = Column(Text, nullable=False, default="CENTRAL")
    verification_status = Column(Boolean, nullable=False, default=True)
    disclaimer = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "act_name": self.act_name,
            "act_short_name": self.act_short_name,
            "section_number": self.section_number,
            "subsection": self.subsection,
            "title": self.title,
            "category": self.category,
            "applies_to": self.applies_to,
            "acquisition_stage": self.acquisition_stage,
            "plain_language_summary": self.plain_language_summary,
            "landowner_guidance": self.landowner_guidance,
            "officer_guidance": self.officer_guidance,
            "required_documents": self.required_documents or [],
            "statutory_citations": self.statutory_citations or [],
            "deadline_days": self.deadline_days,
            "deadline_trigger": self.deadline_trigger,
            "deadline_rule_type": self.deadline_rule_type,
            "calendar_rule": self.calendar_rule,
            "consequence_if_overdue": self.consequence_if_overdue,
            "source_url": self.source_url,
            "source_document": self.source_document,
            "source_version": self.source_version,
            "effective_from": self.effective_from.isoformat() if self.effective_from else None,
            "effective_to": self.effective_to.isoformat() if self.effective_to else None,
            "jurisdiction": self.jurisdiction,
            "central_or_state": self.central_or_state,
            "verification_status": self.verification_status,
            "disclaimer": self.disclaimer,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
