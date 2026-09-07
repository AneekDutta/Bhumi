"""
Complaint Intelligence Service
SIH26016 Land Acquisition Digital Twin Platform

Provides automated assistance for citizen grievances:
- Classification (compensation dispute, boundary dispute, procedural defect, R&R, general)
- Entity extraction (parcel ID, survey numbers, village names)
- Duplicate detection across existing grievances
- Statutory legal reference suggestion & relevant limitation clock linkage

Strict Boundary:
AI proposes decision support. AI CANNOT decide legal validity, ownership, or entitlement.
"""
import re
from typing import Any, Optional
from pydantic import BaseModel, Field

from app.services.sih26016_service import sih_service


class ComplaintAnalysisResult(BaseModel):
    category: str  # COMPENSATION_DISPUTE | BOUNDARY_DISPUTE | PROCEDURAL_DEFECT | R_AND_R_NON_PAYMENT | GENERAL_INQUIRY
    extracted_parcel_id: Optional[str] = None
    extracted_survey_numbers: list[str] = []
    is_potential_duplicate: bool = False
    duplicate_of_id: Optional[str] = None
    similarity_reason: Optional[str] = None
    suggested_statutory_sections: list[str] = []
    suggested_statutory_rule_ids: list[str] = []
    summary: str
    missing_evidence_checklist: list[str] = []
    disclaimer: str = (
        "AI-assisted grievance decision support. This analysis does not determine legal validity, "
        "ownership entitlement, or judicial merits."
    )


class ComplaintIntelligenceService:
    def __init__(self):
        pass

    def analyze_complaint(self, text: str, complainant_name: Optional[str] = None, parcel_hint: Optional[str] = None) -> ComplaintAnalysisResult:
        """Analyzes citizen grievance text to classify, detect duplicates, and suggest legal provisions."""
        t = text.lower()

        # 1. Classification
        if any(w in t for w in ["compensation", "rate", "circle rate", "solatium", "multiplier", "money", "under protest"]):
            cat = "COMPENSATION_DISPUTE"
            sections = ["Section 64 (Reference to Authority)", "Section 26 (Market Value Determination)"]
            rule_ids = ["RULE-SEC-64-REFERENCE-PRESENT", "RULE-SEC-64-REFERENCE-ABSENT"]
            missing = ["Bank passbook copy", "Proof of compensation received under protest", "Objection petition"]
        elif any(w in t for w in ["boundary", "khasra", "measurement", "encroachment", "area", "dimension"]):
            cat = "BOUNDARY_DISPUTE"
            sections = ["Section 12 (Preliminary Survey)", "Rajasthan Land Revenue Act 1956"]
            rule_ids = []
            missing = ["Field survey report", "Cadastral map (Aks Shajra)", "Patwari demarcation memo"]
        elif any(w in t for w in ["r&r", "resettlement", "rehabilitation", "family", "house", "displacement"]):
            cat = "R_AND_R_NON_PAYMENT"
            sections = ["Section 31 (R&R Award)", "Section 38(1) (Monetary R&R 6 Months)"]
            rule_ids = ["RULE-SEC-38-RR-MONETARY"]
            missing = ["R&R entitlement card", "Family ration card", "BPL/SC/ST certificate if applicable"]
        elif any(w in t for w in ["hearing", "notice", "objection", "published", "newspaper"]):
            cat = "PROCEDURAL_DEFECT"
            sections = ["Section 15 (Hearing of Objections)", "Section 21 (Notice to Persons Interested)"]
            rule_ids = ["RULE-SEC-15-OBJECTION", "RULE-SEC-21-NOTICE"]
            missing = ["Copy of Section 21 notice", "Written objection filing receipt"]
        else:
            cat = "GENERAL_INQUIRY"
            sections = ["RFCTLARR Act, 2013 (Act No. 30 of 2013)"]
            rule_ids = []
            missing = ["Identity proof", "Land revenue document"]

        # 2. Extract parcel ID & survey numbers
        pid = parcel_hint
        p_match = re.search(r"\b(P\d{5})\b", text, re.IGNORECASE)
        if p_match:
            pid = p_match.group(1).upper()

        survey_matches = re.findall(
            r"\b(?:SY-?|survey\s*(?:no\.?|number)?\s*|khasra\s*(?:no\.?|number)?\s*)?(\d+(?:/\d+)?)\b",
            text,
            re.IGNORECASE
        )
        # Also match explicit prefixes
        explicit_matches = re.findall(
            r"\b(SY-?\d+(?:/\d+)?|khasra\s*(?:no\.?|number)?\s*\d+(?:/\d+)?|survey\s*(?:no\.?|number)?\s*\d+(?:/\d+)?)\b",
            text,
            re.IGNORECASE
        )
        survey_numbers = []
        for em in explicit_matches:
            # extract clean digits/number e.g. 402/1
            dig = re.search(r"(\d+(?:/\d+)?)", em)
            clean_val = dig.group(1) if dig else em
            if clean_val and clean_val not in survey_numbers:
                survey_numbers.append(clean_val)


        # 3. Duplicate detection across existing grievances
        complaints = sih_service._data_cache.get("complaints", []) if sih_service._data_cache else []
        is_dup = False
        dup_id = None
        sim_reason = None

        for existing in complaints:
            ex_desc = (existing.get("description") or "").lower()
            ex_pid = existing.get("parcel_id")
            if pid and ex_pid == pid and cat == existing.get("category"):
                is_dup = True
                dup_id = existing.get("complaint_id")
                sim_reason = f"Existing complaint {dup_id} already open for parcel {pid} under category {cat}"
                break
            elif any(s in ex_desc for s in survey_numbers if len(s) > 3):
                is_dup = True
                dup_id = existing.get("complaint_id")
                sim_reason = f"Grievance references survey number already covered in complaint {dup_id}"
                break

        summary = f"{cat.replace('_', ' ').title()} related to {pid or 'unspecified parcel'}. Complainant raises questions regarding {cat.lower().replace('_', ' ')}."

        return ComplaintAnalysisResult(
            category=cat,
            extracted_parcel_id=pid,
            extracted_survey_numbers=survey_numbers,
            is_potential_duplicate=is_dup,
            duplicate_of_id=dup_id,
            similarity_reason=sim_reason,
            suggested_statutory_sections=sections,
            suggested_statutory_rule_ids=rule_ids,
            summary=summary,
            missing_evidence_checklist=missing,
        )


complaint_intelligence_service = ComplaintIntelligenceService()
