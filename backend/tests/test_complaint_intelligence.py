"""
Tests for Complaint Intelligence Service
SIH26016 Land Acquisition Platform - KOSH
Grievance Classification, Entity Extraction, Duplicate Detection & Statutory Clocks Linkage
"""
import pytest

from app.services.complaint_intelligence_service import (
    ComplaintIntelligenceService,
)


def test_complaint_compensation_dispute_classification():
    service = ComplaintIntelligenceService()
    text = "The compensation awarded for parcel P00003 is too low. Solatium was not calculated properly and circle rate is outdated."
    result = service.analyze_complaint(text=text, complainant_name="Ramesh Chandra")
    assert result.category == "COMPENSATION_DISPUTE"
    assert "Section 64 (Reference to Authority)" in result.suggested_statutory_sections
    assert "RULE-SEC-64-REFERENCE-PRESENT" in result.suggested_statutory_rule_ids
    assert result.extracted_parcel_id == "P00003"
    assert "Bank passbook copy" in result.missing_evidence_checklist
    assert "does not determine legal validity" in result.disclaimer.lower()


def test_complaint_boundary_dispute_classification():
    service = ComplaintIntelligenceService()
    text = "Survey khasra number 402/1 measurement is wrong. Road alignment encroaches on my unacquired land."
    result = service.analyze_complaint(text=text, parcel_hint="P00002")
    assert result.category == "BOUNDARY_DISPUTE"
    assert result.extracted_parcel_id == "P00002"
    assert len(result.extracted_survey_numbers) >= 1
    assert any("402" in s for s in result.extracted_survey_numbers)
    assert any("survey" in m.lower() for m in result.missing_evidence_checklist)


def test_complaint_r_and_r_classification():
    service = ComplaintIntelligenceService()
    text = "We have not received our resettlement allowance and monetary R&R entitlement after displacement."
    result = service.analyze_complaint(text=text)
    assert result.category == "R_AND_R_NON_PAYMENT"
    assert "RULE-SEC-38-RR-MONETARY" in result.suggested_statutory_rule_ids
    assert "Section 38(1)" in str(result.suggested_statutory_sections)
