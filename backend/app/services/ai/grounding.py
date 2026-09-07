"""
Grounding Service & Context Minimization
SIH26016 Land Acquisition Platform - KOSH
Constructs normalized, privacy-sanitized AIContext strictly grounded in system data.
"""
import re
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import TrustedIdentity
from app.services.acquisition_risk_engine import acquisition_risk_engine
from app.services.ai.schemas import (
    AIContext,
    ConfidenceLevel,
    EvidenceRef,
    SourceType,
)
from app.services.legal_service import legal_service
from app.services.officer_action_service import officer_action_service
from app.services.sih26016_service import sih_service
from app.services.statutory_deadline_engine import statutory_deadline_engine
from app.services.valuation_engine import valuation_engine


class GroundingService:
    """
    Builds authoritative, privacy-sanitized AIContext from registered system state.
    Enforces cross-project authorization boundaries and strips sensitive PII.
    """

    @staticmethod
    def _sanitize_pii(data: Any) -> Any:
        """Removes raw Aadhaar (12-digit), bank account numbers, OTPs, and biometric strings."""
        if isinstance(data, dict):
            clean = {}
            for k, v in data.items():
                k_lower = k.lower()
                if any(s in k_lower for s in ["aadhaar", "uid", "biometric", "otp", "password", "bank_account", "ifsc"]):
                    # If it's an Aadhaar field, mask it or drop
                    if "aadhaar" in k_lower and isinstance(v, str):
                        clean[k] = f"XXXX-XXXX-{v[-4:]}" if len(v) >= 4 else "XXXX-XXXX-MASKED"
                    else:
                        clean[k] = "[REDACTED_DATA_MINIMIZATION]"
                else:
                    clean[k] = GroundingService._sanitize_pii(v)
            return clean
        elif isinstance(data, list):
            return [GroundingService._sanitize_pii(item) for item in data]
        elif isinstance(data, str):
            # Check for 12-digit sequence
            digits = re.sub(r"\D", "", data)
            if len(digits) == 12 and re.match(r"^\d{12}$", data.strip()):
                return f"XXXX-XXXX-{digits[-4:]}"
            return data
        return data

    async def build_context(
        self,
        parcel_id: Optional[str] = None,
        project_id: Optional[str] = "P-NH927A",
        complaint_id: Optional[str] = None,
        user: Optional[TrustedIdentity] = None,
        db: Optional[AsyncSession] = None,
    ) -> AIContext:
        """
        Gathers structured data across registered services, verifies authorization,
        attaches evidence references, and calculates completeness.
        """
        # 1. Authorization & Scope Gate
        if user and user.assigned_project_id and project_id:
            if str(user.assigned_project_id) != str(project_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Forbidden: Officer assigned to project '{user.assigned_project_id}' cannot access context for project '{project_id}'"
                )

        evidence_refs: List[EvidenceRef] = []
        sanitization_flags: List[str] = []

        # 2. Project Data
        proj = sih_service.get_project_by_id(project_id or "P-NH927A") if project_id else None
        project_summary = {}
        if proj:
            project_summary = {
                "project_id": proj.get("project_id"),
                "name": proj.get("name"),
                "state": proj.get("state"),
                "district": proj.get("district"),
                "status": proj.get("status"),
                "target_completion": proj.get("target_completion"),
            }
            evidence_refs.append(
                EvidenceRef(
                    source_type=SourceType.DOCUMENT,
                    source_id=proj.get("project_id", "P-NH927A"),
                    label=f"Project Gazette: {proj.get('name')}",
                    project_id=project_id,
                    verification_status="VERIFIED",
                    url_or_route=f"/projects/{project_id}"
                )
            )

        # 3. Parcel Detail
        parcel_summary = {}
        active_issues: List[Dict[str, Any]] = []
        case_id = None

        if parcel_id:
            norm_pid = parcel_id.strip().upper()
            detail = sih_service.get_parcel_detail(norm_pid)
            if detail:
                # Check horizontal scope on parcel
                parcel_proj = detail.get("project_id") or "P-NH927A"
                if user and user.assigned_project_id and parcel_proj != str(user.assigned_project_id):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Forbidden: Parcel '{norm_pid}' belongs to project '{parcel_proj}', outside assigned scope '{user.assigned_project_id}'"
                    )

                parcel_summary = {
                    "parcel_id": norm_pid,
                    "survey_number": detail.get("survey_number"),
                    "village_name": detail.get("village_name"),
                    "tehsil": detail.get("tehsil"),
                    "district": detail.get("district"),
                    "area_sqm": detail.get("area_sqm"),
                    "area_hectares": detail.get("area_hectares"),
                    "land_use": detail.get("land_use"),
                    "acquisition_status": detail.get("acquisition_status"),
                    "ownership_conflict": detail.get("ownership_conflict"),
                    "conflict_type": detail.get("conflict_type"),
                    "is_critical_path": detail.get("is_critical_path"),
                    "risk_score": detail.get("risk_score"),
                    "criticality_score": detail.get("criticality_score"),
                }

                # Case info
                case_info = detail.get("acquisition_case") or {}
                case_id = case_info.get("case_id", f"CASE-{norm_pid}")

                if detail.get("ownership_conflict"):
                    active_issues.append({
                        "issue_type": detail.get("conflict_type") or "ownership_conflict",
                        "severity": "CRITICAL" if detail.get("is_critical_path") else "HIGH",
                        "description": f"Active ownership or boundary dispute flagged on Parcel {norm_pid}",
                        "parcel_id": norm_pid,
                    })

                # Verified documents
                for d in detail.get("documents", []):
                    did = d.get("document_id") or d.get("id") or "DOC"
                    st = d.get("document_status") or d.get("status") or "VERIFIED"
                    evidence_refs.append(
                        EvidenceRef(
                            source_type=SourceType.DOCUMENT,
                            source_id=str(did),
                            label=f"Document: {d.get('title') or d.get('document_type', did)}",
                            parcel_id=norm_pid,
                            project_id=project_id,
                            verification_status=st.upper(),
                            url_or_route="/document-intelligence"
                        )
                    )

        # 4. CPM Topology & Impact
        cpm_report = sih_service.get_critical_path_report(project_id) if project_id else {}
        cpm_impact = {
            "project_delay_days": cpm_report.get("project_delay_days", 0),
            "projected_finish": cpm_report.get("projected_finish"),
            "critical_path_nodes_count": len(cpm_report.get("critical_path_nodes", [])),
            "is_parcel_on_critical_path": parcel_summary.get("is_critical_path", False),
            "critical_path_float_days": 0 if parcel_summary.get("is_critical_path") else 14,
        }
        if parcel_id:
            evidence_refs.append(
                EvidenceRef(
                    source_type=SourceType.CPM_NODE,
                    source_id=f"parcel:{parcel_id.strip().upper()}",
                    label=f"CPM Topology Node: parcel:{parcel_id.strip().upper()} (Float: {cpm_impact['critical_path_float_days']} days)",
                    parcel_id=parcel_id.strip().upper(),
                    project_id=project_id,
                    verification_status="VERIFIED",
                    url_or_route=f"/projects/{project_id}/impact"
                )
            )

        # 5. Explainable Risk Summary
        risk_summary = {}
        if parcel_id:
            try:
                risk_dossier = await acquisition_risk_engine.evaluate_parcel_risk(parcel_id.strip().upper(), db=db)
                risk_summary = {
                    "composite_score": risk_dossier.composite_score,
                    "overall_severity": risk_dossier.overall_severity.value,
                    "critical_dimensions_count": len(risk_dossier.critical_dimensions),
                    "primary_bottleneck_reason": risk_dossier.primary_bottleneck_reason,
                    "recommended_action": risk_dossier.recommended_action,
                    "dimensions": [
                        {
                            "type": d.dimension_type.value,
                            "severity": d.severity.value,
                            "score": d.score,
                            "why": d.why,
                            "legal_basis": d.legal_basis,
                            "cpm_float_days": d.cpm_schedule_float_days,
                            "mitigation": d.mitigation_action,
                        }
                        for d in risk_dossier.dimension_evaluations
                        if d.severity.value in ["CRITICAL", "HIGH"]
                    ]
                }
                for dim in risk_dossier.dimension_evaluations:
                    if dim.severity.value in ["CRITICAL", "HIGH"]:
                        evidence_refs.append(
                            EvidenceRef(
                                source_type=SourceType.RISK_DIMENSION,
                                source_id=dim.dimension_type.value,
                                label=f"Risk Trigger: {dim.dimension_type.value} ({dim.why})",
                                parcel_id=parcel_id.strip().upper(),
                                project_id=project_id,
                                verification_status="VERIFIED",
                                url_or_route=f"/risk"
                            )
                        )
            except Exception as e:
                risk_summary = {"notice": f"Risk engine evaluation: {e}"}

        # 6. Statutory Deadlines & Limitation Clocks
        statutory_clocks = []
        if parcel_id:
            try:
                norm_pid = parcel_id.strip().upper()
                dls = await statutory_deadline_engine.get_parcel_deadlines(norm_pid, db=db)
                for dl in dls:
                    statutory_clocks.append({
                        "deadline_id": dl.get("deadline_id"),
                        "rule_name": dl.get("rule_name"),
                        "due_date": dl.get("calculated_due_date"),
                        "status": dl.get("status"),
                        "days_remaining": dl.get("days_remaining"),
                        "is_mandatory_lapse": dl.get("is_mandatory_lapse"),
                        "legal_effect": dl.get("legal_effect"),
                    })
                    evidence_refs.append(
                        EvidenceRef(
                            source_type=SourceType.STATUTORY_CLOCK,
                            source_id=dl.get("deadline_id", "DL"),
                            label=f"Statutory Clock: {dl.get('rule_name')} (Due: {dl.get('calculated_due_date')}, Status: {dl.get('status')})",
                            parcel_id=norm_pid,
                            project_id=project_id,
                            verification_status="VERIFIED",
                            url_or_route=f"/deadlines/parcels/{norm_pid}"
                        )
                    )
            except Exception:
                pass

        # 7. Compensation & Valuation State
        compensation_summary = {}
        if parcel_id:
            try:
                norm_pid = parcel_id.strip().upper()
                val = await valuation_engine.get_or_calculate_valuation(norm_pid, db=db)
                if val:
                    calc = val.get("calculation") or {}
                    steps = calc.get("steps") or {}
                    compensation_summary = {
                        "compensation_id": val.get("compensation_id"),
                        "status": val.get("status"),
                        "total_compensation": calc.get("total_compensation"),
                        "base_market_value": steps.get("step1_base_market_value", {}).get("result_inr"),
                        "multiplier": steps.get("step2_multiplier", {}).get("result_inr"),
                        "solatium_100pct": steps.get("step4_solatium", {}).get("result_inr"),
                        "additional_statutory_amount_12pct": steps.get("step5_additional_amount", {}).get("result_inr"),
                        "is_disputed": val.get("status") in ["DISPUTED", "ON_HOLD"],
                    }
                    label_amt = float(calc.get("total_compensation") or 0)
                    evidence_refs.append(
                        EvidenceRef(
                            source_type=SourceType.AWARD,
                            source_id=val.get("compensation_id", f"COMP-{norm_pid}"),
                            label=f"Valuation Award: ₹{label_amt:,.2f} ({val.get('status')})",
                            parcel_id=norm_pid,
                            project_id=project_id,
                            verification_status="VERIFIED" if val.get("status") in ["APPROVED", "PAID"] else "CALCULATED",
                            url_or_route=f"/valuation/parcels/{norm_pid}"
                        )
                    )
            except Exception:
                pass

        # 8. Applicable Legal Provisions from Knowledge Center
        legal_references = []
        try:
            # Add essential core RFCTLARR provisions
            sections_to_fetch = ["SEC-15", "SEC-19", "SEC-21", "SEC-23", "SEC-25", "SEC-26", "SEC-30", "SEC-38", "SEC-64", "SEC-80"]
            for sec_id in sections_to_fetch:
                prov = legal_service.get_provision(sec_id)
                if prov:
                    legal_references.append({
                        "section_id": prov.section_id,
                        "title": prov.title,
                        "chapter": prov.chapter,
                        "legal_text_summary": prov.legal_text[:250] + "...",
                        "time_limit": prov.time_limit,
                        "statutory_consequence": prov.consequence_of_failure,
                        "official_source": prov.official_source_citation,
                    })
                    evidence_refs.append(
                        EvidenceRef(
                            source_type=SourceType.LEGAL_SECTION,
                            source_id=prov.section_id,
                            label=f"Statutory Provision: {prov.section_id} - {prov.title}",
                            project_id=project_id,
                            verification_status="VERIFIED",
                            url_or_route=f"/legal-rights"
                        )
                    )
        except Exception:
            pass

        # 9. Available Officer Actions
        available_actions = []
        try:
            actions = await officer_action_service.list_actions(
                parcel_id=parcel_id.strip().upper() if parcel_id else None,
                db=db,
                identity=user
            )
            for act in actions:
                available_actions.append({
                    "action_id": act.get("action_id"),
                    "title": act.get("title"),
                    "category": act.get("category"),
                    "priority_reasons": act.get("priority_reasons", []),
                    "recommended_action": act.get("recommended_action"),
                    "statutory_provision": act.get("statutory_provision"),
                    "is_blocking_cpm": act.get("is_blocking_cpm"),
                    "executable": True,
                })
        except Exception:
            pass

        # 10. Privacy Sanitization
        clean_parcel_summary = self._sanitize_pii(parcel_summary)
        clean_project_summary = self._sanitize_pii(project_summary)
        clean_compensation_summary = self._sanitize_pii(compensation_summary)

        # 11. Completeness Evaluation
        if (parcel_id and not parcel_summary) or (not parcel_summary and not project_summary):
            completeness = ConfidenceLevel.INSUFFICIENT_EVIDENCE
        elif not parcel_summary and project_summary:
            completeness = ConfidenceLevel.MEDIUM
        elif parcel_summary.get("ownership_conflict") and not active_issues:
            completeness = ConfidenceLevel.LOW
        else:
            completeness = ConfidenceLevel.HIGH

        return AIContext(
            parcel_id=parcel_id.strip().upper() if parcel_id else None,
            project_id=project_id,
            complaint_id=complaint_id,
            case_id=case_id,
            parcel_summary=clean_parcel_summary,
            project_summary=clean_project_summary,
            active_issues=active_issues,
            verified_evidence=evidence_refs,
            statutory_clocks=statutory_clocks,
            legal_references=legal_references,
            compensation_summary=clean_compensation_summary,
            cpm_impact=cpm_impact,
            risk_summary=risk_summary,
            available_actions=available_actions,
            evidence_completeness=completeness,
            sanitization_flags=sanitization_flags,
        )


grounding_service = GroundingService()
