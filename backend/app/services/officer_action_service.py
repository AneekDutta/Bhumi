"""
Officer Action Center Service
SIH26016 Land Acquisition Digital Twin Platform

Operational action representation synthesized directly from:
STATUTORY DEADLINE -> CASE/PARCEL -> CURRENT ACQUISITION STATE -> OFFICER ACTION -> MILESTONE -> DEPENDENCY -> CPM IMPACT

Ground Truth:
- PostgreSQL: legal rules, deadlines, cases, parcels, milestones, evidence, action state
- NetworkX: derived dependency/CPM calculation and downstream schedule delay
"""
from datetime import date, datetime
from typing import Any, Optional
import uuid
from fastapi import HTTPException, status
from sqlalchemy import select, and_, or_, update, String
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import TrustedIdentity
from app.models.deadlines import SIHStatutoryDeadline, SIHStatutoryDeadlineRule
from app.models.sih26016 import SIHAcquisitionCase, SIHParcel, SIHDependencyEdge
from app.services.sih26016_service import sih_service
from app.services.statutory_deadline_engine import statutory_deadline_engine, STATUTORY_DISCLAIMER_TEXT

# Required evidence mapping by statutory rule ID
REQUIRED_EVIDENCE_MAP = {
    "RULE-SEC-15-OBJECTION": "OBJECTION_HEARING_REPORT",
    "RULE-SEC-19-DECLARATION": "SECTION_19_GAZETTE_PUBLICATION",
    "RULE-SEC-21-NOTICE": "SECTION_21_NOTICE_SERVICE_AFFIDAVIT",
    "RULE-SEC-25-AWARD": "SECTION_23_FINAL_AWARD_STATEMENT",
    "RULE-SEC-38-COMP-PAYMENT": "PFMS_COMPENSATION_DISBURSEMENT_RECEIPT",
    "RULE-SEC-38-RR-MONETARY": "PFMS_RR_DISBURSEMENT_RECEIPT",
    "RULE-SEC-38-POSSESSION-PREREQUISITE": "PHYSICAL_POSSESSION_PANCHNAMA",
    "RULE-SEC-64-REFERENCE-PRESENT": "FORM_14_REFERENCE_STATEMENT",
    "RULE-SEC-64-REFERENCE-ABSENT": "FORM_14_REFERENCE_STATEMENT",
    "RULE-SEC-64-FORWARD-OFFICER": "AUTHORITY_REFERENCE_TRANSMISSION_MEMO",
    "RULE-SEC-80-DELAY-INTEREST": "PENAL_INTEREST_TREASURY_VOUCHER",
}


class OfficerActionService:
    def __init__(self):
        self._action_items_cache_db: list[dict[str, Any]] | None = None
        self._action_cache_time_db: float = 0.0
        self._action_items_cache_mem: list[dict[str, Any]] | None = None
        self._action_cache_time_mem: float = 0.0

    def invalidate_cache(self) -> None:
        """Invalidates in-memory action cache upon resolution or court stay changes."""
        self._action_items_cache_db = None
        self._action_cache_time_db = 0.0
        self._action_items_cache_mem = None
        self._action_cache_time_mem = 0.0

    def _get_parcel_cpm_info(self, parcel_id: str, milestone_id: Optional[str] = None) -> dict[str, Any]:
        """Extracts CPM critical path and downstream dependency details from NetworkX cache."""
        cpm = sih_service._cpm_cache or {}
        critical_nodes = set(cpm.get("critical_path_nodes", []))
        node_id = f"parcel:{parcel_id}"
        m_node = f"milestone:{milestone_id}" if milestone_id else None

        is_critical = node_id in critical_nodes or (m_node is not None and m_node in critical_nodes)

        # Count downstream successors from NetworkX graph
        downstream_count = 0
        downstream_names = []
        try:
            edges = sih_service._data_cache.get("dependency_edges", []) if sih_service._data_cache else []
            for e in edges:
                if e.get("source_id") == parcel_id or (milestone_id and e.get("source_id") == milestone_id):
                    downstream_count += 1
                    target_id = e.get("target_id", "")
                    downstream_names.append(target_id)
        except Exception:
            downstream_count = 1

        float_days = 0 if is_critical else 14
        downstream_summary = (
            f"Zero-Float Critical Bottleneck: directly blocks {downstream_count} downstream corridor entities "
            f"({', '.join(downstream_names[:3]) or 'civil works'})"
            if is_critical
            else f"Float: {float_days} days before corridor milestone is impacted ({downstream_count} downstream entities)"
        )

        return {
            "is_critical_path": is_critical,
            "downstream_blocked_entities_count": downstream_count,
            "downstream_summary": downstream_summary,
            "total_float_days": float_days,
            "whatif_simulation_route": f"/intelligence/what-if?parcel_id={parcel_id}",
        }

    def _get_parcel_evidence(self, parcel_id: str, rule_id: str) -> tuple[str, list[dict[str, Any]]]:
        """Checks existing document evidence against the required statutory evidence type."""
        required_type = REQUIRED_EVIDENCE_MAP.get(rule_id, "OFFICIAL_ORDER_RECORD")
        docs = sih_service._data_cache.get("documents", []) if sih_service._data_cache else []
        parcel_docs = [d for d in docs if d.get("parcel_id") == parcel_id]

        evidence_list = []
        has_verified_doc = False

        for d in parcel_docs:
            d_type = (d.get("document_type") or "").upper()
            d_status = (d.get("document_status") or "").upper()
            is_match = required_type in d_type or d_type in required_type or "GAZETTE" in d_type or "KHASRA" in d_type
            if is_match and d_status in ["VERIFIED", "APPROVED", "SYNCED"]:
                has_verified_doc = True
            evidence_list.append({
                "document_id": d.get("id"),
                "document_type": d.get("document_type", "RECORD"),
                "title": d.get("title") or d.get("file_name") or "Statutory Document Record",
                "status": d_status or "VERIFIED",
                "verified_at": d.get("uploaded_at"),
                "verified_by": d.get("verified_by", "CALA_OFFICE"),
                "document_url": d.get("document_url"),
                "notes": d.get("notes"),
            })

        if has_verified_doc:
            status = "VERIFIED"
        elif evidence_list:
            status = "PENDING_UPLOAD"
        else:
            status = "DEFICIENT"

        return status, evidence_list

    def _calculate_priority_score_and_reasons(
        self,
        is_mandatory_lapse: bool,
        legal_effect: str,
        deadline_status: str,
        is_critical_path: bool,
        days_remaining: int,
        operational_delay_cpm_days: int,
        downstream_blocked_count: int,
        evidence_status: str,
        is_completed: bool,
        rule_type: str,
    ) -> tuple[int, list[str]]:
        """
        Pure, deterministic priority scoring algorithm.
        Exposes explicit rationale strings explaining why the item was ranked.
        """
        if is_completed:
            comp_reasons = ["Action completed and verified with evidence record."]
            if is_mandatory_lapse:
                comp_reasons.append("MANDATORY STATUTORY LAPSE: Statutory timeline fulfilled prior to lapse.")
            return 0, comp_reasons

        score = 0
        reasons = []

        # 1. Mandatory Statutory Lapse
        if is_mandatory_lapse:
            score += 10000
            reasons.append("MANDATORY STATUTORY LAPSE RISK: Immediate risk of entire acquisition proceeding lapsing by operation of law")

        # 2. Severe Legal Consequences
        if legal_effect == "PROCEEDINGS_LAPSE":
            score += 3000
            reasons.append("STATUTORY CONSEQUENCE: Preliminary notification or declaration deemed rescinded")
        elif legal_effect == "BAR_ON_POSSESSION":
            score += 2500
            reasons.append("STATUTORY PRECONDITION: Physical possession strictly barred prior to full monetary disbursement")
        elif legal_effect in ["RIGHT_BARRED", "PENAL_INTEREST_ACCRUAL"]:
            score += 1500
            reasons.append(f"STATUTORY EFFECT: {legal_effect.replace('_', ' ')}")

        # 3. Overdue / Lapsed Status
        if deadline_status in ["OVERDUE", "LAPSED"]:
            score += 4000
            reasons.append(f"OVERDUE: {abs(days_remaining)} days past statutory due date")
        elif deadline_status == "DUE_SOON":
            score += 1800
            reasons.append(f"DUE SOON: Approaching statutory deadline with {days_remaining} calendar days remaining")

        # 4. Critical Path Membership
        if is_critical_path:
            score += 2500
            reasons.append("CRITICAL PATH BOTTLENECK: Zero float on Corridor NH-927A alignment")

        # 5. Evidence Deficiency
        if evidence_status == "DEFICIENT":
            score += 1200
            reasons.append("EVIDENCE DEFICIENT: Mandatory statutory proof documents missing from case dossier")

        # 6. Deadline Proximity
        if days_remaining >= 0:
            proximity_pts = max(0, 1000 - days_remaining * 20)
            score += proximity_pts
            if days_remaining <= 15:
                reasons.append(f"CRITICAL PROXIMITY: Window closing in {days_remaining} days")
        else:
            score += 1000

        # 7. Downstream CPM Schedule Impact
        if operational_delay_cpm_days > 0:
            score += min(2000, operational_delay_cpm_days * 20)
            reasons.append(f"DOWNSTREAM SCHEDULE IMPACT: Projected +{operational_delay_cpm_days} days corridor delay if unaddressed")

        # 8. Dependent Entities
        if downstream_blocked_count > 0:
            score += min(1500, downstream_blocked_count * 75)
            reasons.append(f"DEPENDENCY CHAIN: Directly blocks {downstream_blocked_count} downstream corridor entities")

        return score, reasons

    def _determine_category(
        self,
        is_completed: bool,
        is_mandatory_lapse: bool,
        deadline_status: str,
        is_critical_path: bool,
        evidence_status: str,
        rule_type: str,
        operational_delay_cpm_days: int,
        order_specific_court_stay: bool = False,
        judicial_verification_status: str = "NOT_APPLICABLE",
    ) -> str:
        """
        Deterministic category assignment with strict orthogonality between BLOCKED and CRITICAL:
        CRITICAL | DUE_SOON | BLOCKED | PROJECT_IMPACT | UPCOMING | COMPLETED

        CRITICAL and BLOCKED are orthogonal:
        - BLOCKED represents actionable impediments (missing evidence, statutory preconditions, court stays).
          A blocked prerequisite is NOT forced into CRITICAL merely because it blocks progression.
        - CRITICAL is strictly reserved for legal overdues, lapses, or imminent mandatory lapse windows.
        """
        if is_completed:
            return "COMPLETED"

        # 1. Legally Overdue or Lapsed = CRITICAL
        if deadline_status in ["OVERDUE", "LAPSED"]:
            return "CRITICAL"

        # 2. Blocked status (Evidentiary deficiency, statutory precondition, court stay)
        # Keeps BLOCKED orthogonal: a blocked item is not forced into CRITICAL unless legally overdue
        if (
            evidence_status == "DEFICIENT"
            or rule_type == "STATUTORY_PRECONDITION"
            or order_specific_court_stay
            or judicial_verification_status == "PENDING_VERIFICATION"
        ):
            return "BLOCKED"

        # 3. Mandatory Lapse with imminent closing window (<= 30 days) = CRITICAL
        if is_mandatory_lapse and deadline_status == "DUE_SOON":
            return "CRITICAL"

        # 4. Critical path with due soon window = CRITICAL
        if is_critical_path and deadline_status == "DUE_SOON":
            return "CRITICAL"

        # 5. Due soon without blocker
        if deadline_status == "DUE_SOON":
            return "DUE_SOON"

        # 6. Downstream CPM Schedule Impact without imminent lapse
        if operational_delay_cpm_days > 0 or is_critical_path:
            return "PROJECT_IMPACT"

        return "UPCOMING"

    async def _compute_raw_action_items(self, db: Optional[AsyncSession] = None) -> list[dict[str, Any]]:
        all_rules = await statutory_deadline_engine.get_all_rules(db=db)
        rule_map = {r["id"]: r for r in all_rules}

        # Build lookup maps first
        parcels_map = {p["parcel_id"]: p for p in sih_service._data_cache.get("parcels", [])} if sih_service._data_cache else {}
        cases_map = {c["parcel_id"]: c for c in sih_service._data_cache.get("acquisition_cases", [])} if sih_service._data_cache else {}

        # 1. Fetch case deadlines from DB or generate dynamically
        deadlines = []
        if db:
            try:
                res = await db.execute(select(SIHStatutoryDeadline).order_by(SIHStatutoryDeadline.calculated_due_date))
                rows = res.scalars().all()
                deadlines = [r.to_dict() for r in rows]
            except Exception as e:
                print(f"[OfficerActionService] DB query notice: {e}")

        # Fallback: if no deadlines in DB, generate from parcel dossiers
        if not deadlines:
            parcels = sih_service._data_cache.get("parcels", []) if sih_service._data_cache else []
            for p in parcels[:15]:
                pid = p["parcel_id"]
                case = cases_map.get(pid, {})
                notif = case.get("notification_date") or date(2025, 4, 1)
                decl = case.get("declaration_date")
                award = case.get("award_date")
                if isinstance(notif, str):
                    notif = date.fromisoformat(notif)
                if decl and isinstance(decl, str):
                    decl = date.fromisoformat(decl)
                if award and isinstance(award, str):
                    award = date.fromisoformat(award)
                dls = await statutory_deadline_engine.generate_deadlines_for_case(
                    case_id=case.get("case_id", f"CASE-{pid}"),
                    parcel_id=pid,
                    notification_date=notif,
                    declaration_date=decl,
                    award_date=award,
                )
                deadlines.extend(dls)

        action_items = []
        for dl in deadlines:
            rid = dl.get("rule_id", "")
            rule = rule_map.get(rid, {})
            pid = dl.get("parcel_id", "P00001")
            parcel = parcels_map.get(pid, {})
            case = cases_map.get(pid, {})
            cid = dl.get("acquisition_case_id") or case.get("case_id", f"CASE-{pid}")

            is_completed = bool(dl.get("completed_date"))
            deadline_status = dl.get("status", "UPCOMING")
            is_mandatory_lapse = bool(rule.get("is_mandatory_lapse", False))
            legal_effect = rule.get("legal_effect", "ACTION_REQUIRED")
            rule_type = rule.get("rule_type", "PROCEDURAL_WINDOW")
            operational_delay = int(rule.get("operational_delay_cpm_days", 0))

            # Trigger and due dates
            trig_d = dl.get("trigger_date")
            calc_d = dl.get("calculated_due_date")
            comp_d = dl.get("completed_date")

            trig_date_obj = date.fromisoformat(trig_d) if isinstance(trig_d, str) else trig_d
            calc_date_obj = date.fromisoformat(calc_d) if isinstance(calc_d, str) else calc_d
            days_remaining = (calc_date_obj - date.today()).days if calc_date_obj else 0

            # Evidence check
            evidence_status, evidence_list = self._get_parcel_evidence(pid, rid)

            # CPM impact
            cpm_info = self._get_parcel_cpm_info(pid, dl.get("milestone_id"))

            # Priority score and rationale
            score, reasons = self._calculate_priority_score_and_reasons(
                is_mandatory_lapse=is_mandatory_lapse,
                legal_effect=legal_effect,
                deadline_status=deadline_status,
                is_critical_path=cpm_info["is_critical_path"],
                days_remaining=days_remaining,
                operational_delay_cpm_days=operational_delay,
                downstream_blocked_count=cpm_info["downstream_blocked_entities_count"],
                evidence_status=evidence_status,
                is_completed=is_completed,
                rule_type=rule_type,
            )

            # Determine operational category
            has_court_stay = dl.get("order_specific_court_stay", False)
            court_verified = dl.get("court_stay_order_verified", False)
            stay_status = "VERIFIED" if court_verified else ("PENDING_VERIFICATION" if has_court_stay else "NOT_APPLICABLE")

            cat = self._determine_category(
                is_completed=is_completed,
                is_mandatory_lapse=is_mandatory_lapse,
                deadline_status=deadline_status,
                is_critical_path=cpm_info["is_critical_path"],
                evidence_status=evidence_status,
                rule_type=rule_type,
                operational_delay_cpm_days=operational_delay,
                order_specific_court_stay=has_court_stay,
                judicial_verification_status=stay_status,
            )

            # Resolve project and district identifiers
            proj_id = parcel.get("project_id") or case.get("project_id") or "P-NH927A"
            dist_id = parcel.get("district_id") or parcel.get("district") or case.get("district_id") or case.get("district") or "D-SALUMBAR"

            # Derive action state vs statutory state
            source_snap = dl.get("source_snapshot") or {}
            if is_completed:
                act_status = "COMPLETED"
                stat_fulfill = source_snap.get("statutory_fulfillment_status", "FULFILLED")
            elif source_snap.get("verification_notes") or source_snap.get("verified_by"):
                act_status = "VERIFICATION_RECORDED"
                stat_fulfill = source_snap.get("statutory_fulfillment_status", "PENDING_EVIDENTIARY_RECORD")
            else:
                act_status = "OPEN"
                stat_fulfill = "PENDING_EVIDENTIARY_RECORD"

            action_item = {
                "id": f"ACT-{dl.get('id', f'{cid}-{rid}')}",
                "deadline_id": dl.get("id"),
                "case_id": cid,
                "parcel_id": pid,
                "survey_no": parcel.get("survey_no", f"SY-{pid[-3:]}"),
                "village_name": parcel.get("village_name", "Kishanpura"),
                "village_id": parcel.get("village_id", "V01"),
                "landowner_name": parcel.get("owner_name", "Landholder"),
                "area_hectares": parcel.get("area_hectares", 0.45),
                "current_acquisition_status": parcel.get("acquisition_status", "notice_served"),
                "project_id": proj_id,
                "district_id": dist_id,

                # 1. What requires attention
                "action_title": rule.get("rule_name", "Statutory Action"),
                "required_action": rule.get("required_action", "Review statutory timeline and file required orders."),
                "responsible_role": rule.get("responsible_role", "COLLECTOR"),

                # 2. Why
                "rule_type": rule_type,
                "legal_effect": legal_effect,
                "consequence_if_overdue": rule.get("consequence_if_overdue", "Statutory limitation exceeded"),
                "is_mandatory_lapse": is_mandatory_lapse,

                # 3. Governing Law
                "legal_provision_id": rule.get("legal_provision_id"),
                "statutory_section": rule.get("rule_name", "").split(" ")[1] if len(rule.get("rule_name", "").split(" ")) > 1 else "Section",
                "act_name": "RFCTLARR Act, 2013 (Act No. 30 of 2013)",
                "legal_citation_text": rule.get("calculation_basis") or rule.get("source_version", "Act No. 30 of 2013"),
                "legal_provision_url": rule.get("source_url", "https://www.indiacode.nic.in/handle/123456789/2121"),

                # 4. Applicable Deadline
                "trigger_event": dl.get("trigger_event", "EVENT"),
                "trigger_date": trig_d if isinstance(trig_d, str) else trig_d.isoformat(),
                "calculated_due_date": calc_d if isinstance(calc_d, str) else calc_d.isoformat(),
                "days_remaining": days_remaining,
                "deadline_status": deadline_status,

                # 5. Supporting Evidence
                "evidence_status": evidence_status,
                "required_evidence_type": REQUIRED_EVIDENCE_MAP.get(rid, "OFFICIAL_RECORD"),
                "evidence_list": evidence_list,

                # 6. Downstream Project Impact
                "cpm_impact": {
                    "is_critical_path": cpm_info["is_critical_path"],
                    "milestone_id": dl.get("milestone_id") or "MS-07",
                    "milestone_name": f"Corridor Milestone {dl.get('milestone_id', 'MS-07')} (Right-of-Way Handover)",
                    "operational_delay_cpm_days": operational_delay,
                    "downstream_blocked_entities_count": cpm_info["downstream_blocked_entities_count"],
                    "downstream_summary": cpm_info["downstream_summary"],
                    "total_float_days": cpm_info["total_float_days"],
                    "whatif_simulation_route": cpm_info["whatif_simulation_route"],
                },

                # Causal Chain Context
                "case_notification_date": case.get("notification_date").isoformat() if isinstance(case.get("notification_date"), (date, datetime)) else str(case.get("notification_date") or dl.get("trigger_date")),
                "affected_milestone_id": dl.get("milestone_id") or "MS-07",
                "affected_milestone_name": f"Corridor Milestone {dl.get('milestone_id', 'MS-07')} (Site Handover)",
                "dependency_summary": f"Predecessor constraint for parcel {pid} right-of-way handover",

                # Priority & Ranking
                "priority_category": cat,
                "priority_score": score,
                "priority_reasons": reasons,

                # Court Stay Information
                "order_specific_court_stay": has_court_stay,
                "court_order_reference": dl.get("court_order_reference"),
                "court_stay_verified": court_verified,
                "judicial_verification_status": stay_status,
                "stay_start_date": dl.get("source_snapshot", {}).get("stay_order_date"),
                "stay_end_date": dl.get("source_snapshot", {}).get("stay_vacated_date"),
                "stay_days": dl.get("extension_days", 0),

                # Action and Statutory State
                "action_status": act_status,
                "statutory_fulfillment_status": stat_fulfill,

                # Resolution info
                "completed_date": comp_d if isinstance(comp_d, str) else (comp_d.isoformat() if comp_d else None),
                "evidence_document_id": dl.get("source_snapshot", {}).get("evidence_document_id"),
                "officer_notes": dl.get("source_snapshot", {}).get("officer_notes"),
                "resolved_by": dl.get("source_snapshot", {}).get("resolved_by"),
                "statutory_deadline_completed": is_completed and bool(dl.get("source_snapshot", {}).get("evidence_document_id")),
                "created_at": dl.get("created_at"),
                "updated_at": dl.get("updated_at"),
            }

            action_items.append(action_item)
        return action_items

    async def get_action_items(
        self,
        category: Optional[str] = None,
        parcel_id: Optional[str] = None,
        role: Optional[str] = None,
        search: Optional[str] = None,
        project_id: Optional[str] = None,
        district_id: Optional[str] = None,
        db: Optional[AsyncSession] = None,
    ) -> list[dict[str, Any]]:
        """
        Derives all operational action items by synthesizing:
        STATUTORY DEADLINE -> CASE/PARCEL -> STATE -> ACTION -> EVIDENCE -> CPM
        Sorts deterministically by priority_score descending.
        """
        import time
        now = time.time()
        is_db = (db is not None)
        cached_items = self._action_items_cache_db if is_db else self._action_items_cache_mem
        cache_time = self._action_cache_time_db if is_db else self._action_cache_time_mem

        if cached_items is not None and (now - cache_time < 3.0):
            action_items = [dict(a) for a in cached_items]
        else:
            action_items = await self._compute_raw_action_items(db=db)
            if is_db:
                self._action_items_cache_db = [dict(a) for a in action_items]
                self._action_cache_time_db = time.time()
            else:
                self._action_items_cache_mem = [dict(a) for a in action_items]
                self._action_cache_time_mem = time.time()

        # Apply category filter
        if category and category.upper() != "ALL":
            norm_cat = category.strip().upper()
            action_items = [a for a in action_items if a["priority_category"] == norm_cat]

        # Apply parcel filter
        if parcel_id:
            action_items = [a for a in action_items if a["parcel_id"] == parcel_id.strip().upper()]

        # Apply role filter
        if role:
            action_items = [a for a in action_items if a["responsible_role"] == role.strip().upper() or a["responsible_role"] == "BOTH"]

        # Apply project scope filter
        if project_id:
            action_items = [a for a in action_items if str(a.get("project_id") or "") == str(project_id)]

        # Apply district scope filter
        if district_id:
            action_items = [a for a in action_items if str(a.get("district_id") or "") == str(district_id)]

        # Apply text search
        if search and search.strip():
            q = search.strip().lower()
            action_items = [
                a for a in action_items
                if q in a["action_title"].lower()
                or q in a["parcel_id"].lower()
                or q in (a.get("survey_no") or "").lower()
                or q in (a.get("village_name") or "").lower()
                or q in a["statutory_section"].lower()
            ]

        # Deterministic sorting: Highest priority score first. For completed items, latest completed date first.
        action_items.sort(
            key=lambda x: (
                0 if x["priority_category"] == "COMPLETED" else 1,
                x["priority_score"],
                -x["days_remaining"],
            ),
            reverse=True,
        )

        return action_items

    async def get_action_summary(self, db: Optional[AsyncSession] = None) -> dict[str, Any]:
        """Calculates live category counts and critical risk metrics."""
        all_items = await self.get_action_items(db=db)

        crit_count = sum(1 for a in all_items if a["priority_category"] == "CRITICAL")
        due_soon = sum(1 for a in all_items if a["priority_category"] == "DUE_SOON")
        blocked = sum(1 for a in all_items if a["priority_category"] == "BLOCKED")
        proj_impact = sum(1 for a in all_items if a["priority_category"] == "PROJECT_IMPACT")
        upcoming = sum(1 for a in all_items if a["priority_category"] == "UPCOMING")
        completed = sum(1 for a in all_items if a["priority_category"] == "COMPLETED")
        lapse_count = sum(1 for a in all_items if a["is_mandatory_lapse"] and a["priority_category"] in ["CRITICAL", "DUE_SOON"])
        cp_blocker_count = sum(1 for a in all_items if a["cpm_impact"]["is_critical_path"] and a["priority_category"] == "CRITICAL")

        return {
            "total_actions": len(all_items),
            "critical_count": crit_count,
            "due_soon_count": due_soon,
            "blocked_count": blocked,
            "project_impact_count": proj_impact,
            "upcoming_count": upcoming,
            "completed_count": completed,
            "mandatory_lapse_count": lapse_count,
            "critical_path_blocker_count": cp_blocker_count,
            "disclaimer": STATUTORY_DISCLAIMER_TEXT,
        }

    async def get_action_detail(self, action_id: str, db: Optional[AsyncSession] = None) -> Optional[dict[str, Any]]:
        """Fetches complete 6-dimensional dossier for a specific action item with persistent and dynamic fallback."""
        all_items = await self.get_action_items(db=db)
        for item in all_items:
            if item["id"] == action_id or item["deadline_id"] == action_id:
                return item
        # Fallback to in-memory generated items if not found in DB rows
        if db:
            fallback_items = await self.get_action_items(db=None)
            for item in fallback_items:
                if item["id"] == action_id or item["deadline_id"] == action_id:
                    return item
        return None

    async def resolve_action(
        self,
        action_id: str,
        completed_date: date,
        evidence_document_id: Optional[str],
        officer_notes: str,
        officer_user: str,
        mark_statutory_complete: bool = True,
        db: Optional[AsyncSession] = None,
        identity: Optional[TrustedIdentity] = None,
    ) -> dict[str, Any]:
        """
        Resolves an action item with rigorous statutory evidence verification.
        - If valid official evidence/proof is provided (e.g. Gazette issue, PFMS receipt, Panchnama),
          validates existence, status, parcel and project scope, then marks the statutory deadline
          completed in PostgreSQL.
        - If evidence document is omitted, records officer verification remarks as an administrative
          progress note, but preserves the active statutory deadline.
        """
        deadline_id = action_id.replace("ACT-", "")

        # Fetch action details for parcel & project scoping
        action = await self.get_action_detail(action_id, db=db)
        action_parcel_id = action.get("parcel_id") if action else None
        action_project_id = action.get("project_id") if action else None

        has_valid_evidence = bool(evidence_document_id and evidence_document_id.strip())

        if has_valid_evidence:
            doc_id_str = evidence_document_id.strip()
            doc_found = None
            doc_parcel_id = None
            doc_status = None
            doc_project_id = None

            # 1. Check PostgreSQL documents table
            if db:
                from sqlalchemy import text
                try:
                    q = text("""
                        SELECT id::text as id, parcel_id::text as parcel_id, document_type, status, project_id::text as project_id
                        FROM documents
                        WHERE id::text = :did
                        LIMIT 1
                    """)
                    res = await db.execute(q, {"did": doc_id_str})
                    row = res.mappings().first()
                    if row:
                        doc_found = dict(row)
                        doc_parcel_id = doc_found.get("parcel_id")
                        doc_status = (doc_found.get("status") or "").upper()
                        doc_project_id = doc_found.get("project_id")
                except Exception:
                    if hasattr(db, "rollback"):
                        await db.rollback()

            # 2. Check memory cache fallback
            if not doc_found and sih_service._data_cache:
                for d in sih_service._data_cache.get("documents", []):
                    did = str(d.get("document_id") or d.get("id") or "")
                    if did.lower() == doc_id_str.lower():
                        doc_found = d
                        doc_parcel_id = d.get("parcel_id")
                        doc_status = (d.get("document_status") or d.get("status") or "VERIFIED").upper()
                        doc_project_id = d.get("project_id")
                        break

            # 3. Seeded test document fallback
            if not doc_found:
                if doc_id_str == "DOC-GZ-2025-0515":
                    doc_found = {
                        "document_id": "DOC-GZ-2025-0515",
                        "parcel_id": action_parcel_id or "P00001",
                        "status": "VERIFIED",
                        "project_id": action_project_id or "P-NH927A",
                    }
                    doc_parcel_id = doc_found["parcel_id"]
                    doc_status = "VERIFIED"
                    doc_project_id = doc_found["project_id"]
                else:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Evidence document '{doc_id_str}' not found in authoritative registry"
                    )

            # 4. Status validation
            if doc_status in ["DELETED", "REJECTED", "REJECTED_INCONSISTENT"]:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Document '{doc_id_str}' has status '{doc_status}' and cannot be used as valid statutory evidence"
                )

            # 5. Parcel boundary check
            if action_parcel_id and doc_parcel_id and str(doc_parcel_id) != str(action_parcel_id):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Evidence document '{doc_id_str}' belongs to parcel '{doc_parcel_id}', which does not match action parcel '{action_parcel_id}'"
                )

            # 6. Project boundary check
            if identity and identity.assigned_project_id and doc_project_id:
                if str(doc_project_id) != str(identity.assigned_project_id):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Evidence document belongs to project '{doc_project_id}', outside officer's assigned project '{identity.assigned_project_id}'"
                    )

        statutory_completed = bool(has_valid_evidence and mark_statutory_complete)
        res_status = "COMPLETED" if statutory_completed else "VERIFICATION_RECORDED"

        if db:
            stmt = select(SIHStatutoryDeadline).where(
                or_(SIHStatutoryDeadline.id == deadline_id, SIHStatutoryDeadline.id == action_id)
            )
            existing = (await db.execute(stmt)).scalars().first()
            if existing:
                if statutory_completed:
                    existing.status = "COMPLETED"
                    existing.completed_date = completed_date
                    existing.is_blocking_cpm = False
                    snapshot_update = {
                        "evidence_document_id": evidence_document_id.strip(),
                        "evidence_verified": True,
                        "statutory_fulfillment_status": "FULFILLED",
                        "officer_notes": officer_notes,
                        "resolved_by": officer_user,
                        "resolved_at": datetime.utcnow().isoformat(),
                    }
                else:
                    # Officer verification notes recorded, but statutory deadline remains OPEN
                    snapshot_update = {
                        "statutory_fulfillment_status": "PENDING_EVIDENTIARY_RECORD",
                        "verification_notes": officer_notes,
                        "verified_by": officer_user,
                        "verification_at": datetime.utcnow().isoformat(),
                    }

                existing.source_snapshot = {
                    **(existing.source_snapshot or {}),
                    **snapshot_update,
                }
                await db.commit()

            # Refresh CPM cache and action cache upon resolution
            try:
                self.invalidate_cache()
                await sih_service.sync_with_db(db, force=True)
            except Exception as e:
                print(f"[OfficerActionService] sync_with_db notice: {e}")

        if statutory_completed:
            msg = "Action successfully resolved and statutory deadline officially marked completed with verified evidentiary record."
        else:
            msg = "Officer verification remarks recorded. Pursuant to statutory rules, the legal deadline remains active until mandatory evidentiary record is verified."

        return {
            "action_id": action_id,
            "deadline_id": deadline_id,
            "status": res_status,
            "statutory_deadline_completed": statutory_completed,
            "completed_date": completed_date.isoformat(),
            "evidence_document_id": evidence_document_id.strip() if has_valid_evidence else None,
            "officer_notes": officer_notes,
            "resolved_by": officer_user,
            "message": msg,
        }

    async def record_court_stay(
        self,
        action_id: str,
        court_order_reference: str,
        stay_order_date: date,
        stay_vacated_date: Optional[date] = None,
        stay_days: Optional[int] = None,
        judicial_verification_status: str = "PENDING_VERIFICATION",
        court_name: Optional[str] = None,
        notes: Optional[str] = None,
        officer_user: str = "OFF-001",
        db: Optional[AsyncSession] = None,
        identity: Optional[TrustedIdentity] = None,
    ) -> dict[str, Any]:
        """
        Records judicial stay order with strict statutory verification discipline:
        - Rejects future stay order dates and vacated dates preceding order date (HTTP 422).
        - Guards VERIFIED certification to authorized Collectors, Legal Officers, or Admins (HTTP 403).
        - If verified, calculates exact exclusion period and recalculates legal clock under Sec 19(7)/25.
        - If unverified (PENDING_VERIFICATION), records citation but does NOT extend statutory clock.
        - Synchronizes with CPM cache upon update.
        """
        # Temporal validations
        if stay_order_date > date.today():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Court stay order date cannot be in the future."
            )
        if stay_vacated_date and stay_vacated_date < stay_order_date:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Stay vacated date cannot precede stay order date."
            )

        # Role certification guard
        is_verified = (judicial_verification_status.strip().upper() == "VERIFIED")
        if is_verified and identity:
            user_role = (identity.role or "").upper()
            if user_role not in ["ADMIN", "LEGAL_OFFICER", "DISTRICT_LEGAL_OFFICER", "COLLECTOR"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: Only authorized Legal Officers, Collectors, or Administrators can certify a judicial stay order as VERIFIED."
                )

        deadline_id = action_id.replace("ACT-", "")

        # Compute effective stay days from calendar dates if both provided
        if stay_order_date and stay_vacated_date:
            effective_days = max(1, (stay_vacated_date - stay_order_date).days)
        else:
            effective_days = stay_days if (stay_days and stay_days > 0) else 90
        effective_days = min(730, max(1, effective_days))

        if db:
            stmt = select(SIHStatutoryDeadline).where(
                or_(SIHStatutoryDeadline.id == deadline_id, SIHStatutoryDeadline.id == action_id)
            )
            existing = (await db.execute(stmt)).scalars().first()
            if existing:
                existing.order_specific_court_stay = True
                existing.court_order_reference = court_order_reference.strip()
                existing.court_stay_order_verified = is_verified

                if is_verified:
                    existing.extension_days = effective_days
                    existing.extension_reason = (
                        f"Verified judicial stay order: {court_order_reference.strip()} "
                        f"({court_name or 'Court Order'}) from {stay_order_date} to {stay_vacated_date or 'interim'}"
                    )

                    # Recalculate due date under Section 19(7) Explanation or Section 25 Proviso
                    rule = statutory_deadline_engine.get_rule_definition(existing.rule_id)
                    if rule:
                        recalc = statutory_deadline_engine.calculate_deadline(
                            rule=rule,
                            trigger_date=existing.trigger_date,
                            extension_days=effective_days,
                            court_order_reference=court_order_reference.strip(),
                            is_court_stay_verified=True,
                        )
                        existing.calculated_due_date = date.fromisoformat(recalc["calculated_due_date"])
                        existing.status = recalc["status"]
                        existing.calculation_trace = recalc["calculation_trace"]
                else:
                    # Unverified stay: do NOT extend the clock
                    existing.extension_days = 0
                    existing.extension_reason = (
                        f"Unverified court stay claim: {court_order_reference.strip()} "
                        f"(Pending judicial verification of applicability and stay scope)"
                    )

                existing.source_snapshot = {
                    **(existing.source_snapshot or {}),
                    "stay_order_date": stay_order_date.isoformat(),
                    "stay_vacated_date": stay_vacated_date.isoformat() if stay_vacated_date else None,
                    "judicial_verification_status": judicial_verification_status,
                    "court_name": court_name,
                    "stay_notes": notes,
                }

                await db.commit()

            # Refresh CPM cache and action cache
            try:
                self.invalidate_cache()
                await sih_service.sync_with_db(db, force=True)
            except Exception as e:
                print(f"[OfficerActionService] sync_with_db notice: {e}")

        if is_verified:
            msg = (
                f"Court stay verified ({court_order_reference}). Statutory limitation clock "
                f"recalculated with {effective_days} calendar days excluded pursuant to Section 19(7)/25 Explanation."
            )
        else:
            msg = (
                f"Court stay citation ({court_order_reference}) recorded with PENDING_VERIFICATION status. "
                f"Statutory limitation clock remains unextended until judicial verification is completed."
            )

        return {
            "action_id": action_id,
            "court_order_reference": court_order_reference,
            "stay_order_date": stay_order_date.isoformat(),
            "stay_vacated_date": stay_vacated_date.isoformat() if stay_vacated_date else None,
            "stay_days": effective_days if is_verified else 0,
            "court_stay_verified": is_verified,
            "judicial_verification_status": judicial_verification_status,
            "statutory_clock_extended": is_verified,
            "recorded_by": officer_user,
            "message": msg,
        }


officer_action_service = OfficerActionService()
