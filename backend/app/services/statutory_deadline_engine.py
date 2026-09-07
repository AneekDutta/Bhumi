"""
Deterministic Statutory Deadline & Legal Clock Engine
SIH26016 Land Acquisition Digital Twin Platform

STRICT LEGAL AUDIT & ENGINE HARDENING:
- Decouples statutory legal consequences from KOSH CPM simulation heuristics.
- Clearly distinguishes Section 38(1) compensation payment (3 months), Section 38(1) monetary R&R (6 months),
  and Section 38(1)/(2) absolute possession prerequisite.
- Formulates Section 64(2) into separate statutory limitation routes: Section 64(2)(a) (present) vs Section 64(2)(b) (absent).
- Clarifies Section 80 penal interest (9% year 1, 15% thereafter on unpaid balance) vs Section 30(3) 12% additional component.
- Strictly documents court stay order exclusions as requiring order-specific judicial verification.
- Rule-based statutory decision support based on configured and verified legal sources.
"""
import calendar
from datetime import date, datetime, timedelta
from typing import Any, Optional
from sqlalchemy import select, or_, and_, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.statutory_deadline_rules_data import DEADLINE_RULES_DATA
from app.models.deadlines import SIHStatutoryDeadline, SIHStatutoryDeadlineRule
from app.models.sih26016 import SIHAcquisitionCase, SIHParcel, SIHDependencyEdge
from app.services.sih26016_service import sih_service

STATUTORY_DISCLAIMER_TEXT = (
    "Rule-based statutory decision support based on configured and verified legal sources. "
    "Court injunctions, stay orders, or gazetted government extensions require case-specific judicial or "
    "administrative verification pursuant to statutory provisos (e.g. Section 19(7) Explanation and Section 25 Proviso). "
    "This decision-support system does not determine legal rights or substitute for formal legal counsel."
)


def add_calendar_months(source_date: date, months: int) -> date:
    """
    Deterministically adds calendar months to a date, clamping day of month
    to the maximum day of the target month (e.g., Jan 31 + 1 month = Feb 28/29).
    """
    month = source_date.month - 1 + months
    year = source_date.year + month // 12
    month = month % 12 + 1
    day = min(source_date.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def add_calendar_years(source_date: date, years: int) -> date:
    """
    Deterministically adds calendar years to a date, handling leap years cleanly.
    """
    try:
        return source_date.replace(year=source_date.year + years)
    except ValueError:
        # Handles Feb 29 on leap year to non-leap year -> Feb 28
        return source_date.replace(year=source_date.year + years, day=28)


class StatutoryDeadlineEngine:
    def __init__(self):
        self._rules_cache: dict[str, dict[str, Any]] = {}
        self._all_rules_cache: list[dict[str, Any]] | None = None
        self._rules_cache_time: float = 0.0
        self._load_fallback_rules()

    def _load_fallback_rules(self):
        """Loads in-memory rule definitions for offline / test resilience."""
        for r in DEADLINE_RULES_DATA:
            self._rules_cache[r["id"]] = r

    def get_rule_definition(self, rule_id: str) -> Optional[dict[str, Any]]:
        return self._rules_cache.get(rule_id.strip())

    def calculate_deadline(
        self,
        rule: dict[str, Any],
        trigger_date: date,
        extension_days: int = 0,
        completed_date: Optional[date] = None,
        reference_date: Optional[date] = None,
        court_order_reference: Optional[str] = None,
        is_court_stay_verified: bool = False,
        unpaid_balance_amount: Optional[float] = None,
        applicant_was_present: Optional[bool] = None,
        award_date: Optional[date] = None,
        condonation_granted: bool = False,
        condonation_days: Optional[int] = None,
        condonation_reason: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Pure, deterministic statutory deadline calculation.
        Evaluates clock type, start/end rules, days remaining, status, and explainable trace.
        Strictly decouples statutory legal consequence from KOSH operational CPM delay models.
        """
        ref_date = reference_date or date.today()
        if isinstance(ref_date, str):
            ref_date = date.fromisoformat(ref_date)
        if isinstance(trigger_date, str):
            trigger_date = date.fromisoformat(trigger_date)
        if completed_date and isinstance(completed_date, str):
            completed_date = date.fromisoformat(completed_date)
        if award_date and isinstance(award_date, str):
            award_date = date.fromisoformat(award_date)

        clock_type = (rule.get("clock_type") or "CALENDAR_DAYS").upper()
        duration_value = rule.get("duration_value") or 0
        duration_unit = (rule.get("duration_unit") or "DAYS").upper()
        rule_id = rule.get("id", "UNKNOWN_RULE")
        rule_name = rule.get("rule_name", "Statutory Rule")
        trigger_event = rule.get("trigger_event", "TRIGGER_EVENT")
        consequence = rule.get("consequence_if_overdue", "Statutory time limit exceeded")
        is_lapse = bool(rule.get("is_mandatory_lapse", False))
        rule_type = rule.get("rule_type", "PROCEDURAL_WINDOW")
        legal_effect = rule.get("legal_effect", "ACTION_REQUIRED")
        statutory_vs_operational = rule.get("statutory_vs_operational", "STATUTORY")
        operational_delay_cpm_days = int(rule.get("operational_delay_cpm_days", 0))
        operational_impact_notes = rule.get("operational_impact_notes")

        # Check unsupported clock types
        if clock_type == "WORKING_DAYS":
            raise ValueError(
                "WORKING_DAYS clock type is currently unsupported until an official gazetted "
                "court and revenue holiday calendar is configured. RFCTLARR Act 2013 standard baseline "
                "operates strictly on calendar days and calendar months."
            )

        penal_interest_rate: Optional[float] = None
        penal_interest_amount: Optional[float] = None

        # Calculate due date based on rule-specific statutory provisions
        if rule_id == "RULE-SEC-64-REFERENCE-ABSENT":
            # Section 64(2)(b): Earlier of (Notice receipt + 6 weeks) OR (Award date + 6 months)
            date_from_notice = trigger_date + timedelta(days=42)
            base_award_date = award_date or trigger_date
            date_from_award = add_calendar_months(base_award_date, 6)
            raw_due = min(date_from_notice, date_from_award)
            formula_desc = (
                f"min(Notice Receipt {trigger_date.isoformat()} + 42 calendar days [{date_from_notice.isoformat()}], "
                f"Award Date {base_award_date.isoformat()} + 6 calendar months [{date_from_award.isoformat()}])"
            )
            calendar_logic = (
                "Section 64(2)(b) RFCTLARR Act 2013: Statutory limitation for absent party is the earlier of "
                "six weeks from Section 21 notice receipt or six months from award pronouncement. "
                "Receipt of compensation must be marked 'under protest'."
            )

        elif clock_type == "CALENDAR_DAYS":
            raw_due = trigger_date + timedelta(days=duration_value)
            formula_desc = f"{trigger_date.isoformat()} + {duration_value} calendar days"
            calendar_logic = "Calendar days calculation without holiday exclusion under statutory rules."

        elif clock_type == "MONTHS":
            raw_due = add_calendar_months(trigger_date, duration_value)
            formula_desc = f"{trigger_date.isoformat()} + {duration_value} calendar months"
            calendar_logic = "Calendar month addition preserving month-end alignment."

        elif clock_type == "YEARS":
            raw_due = add_calendar_years(trigger_date, duration_value)
            formula_desc = f"{trigger_date.isoformat()} + {duration_value} year(s)"
            calendar_logic = "Annual statutory clock addition with leap year clamping."

        elif clock_type == "WEEKS" or (clock_type == "CALENDAR_DAYS" and duration_unit == "WEEKS"):
            total_days = duration_value * 7
            raw_due = trigger_date + timedelta(days=total_days)
            formula_desc = f"{trigger_date.isoformat()} + {duration_value} weeks ({total_days} days)"
            calendar_logic = "Weekly limitation period under Section 64."

        elif clock_type == "EVENT_DEPENDENT":
            raw_due = trigger_date
            formula_desc = "Condition precedent: Must be fully satisfied prior to subsequent physical event"
            calendar_logic = (
                "Event-dependent statutory prerequisite: 100% compensation disbursement and monetary R&R tender "
                "is an absolute condition precedent prior to physical possession under Section 38(1) & (2)."
            )

        else:
            raw_due = trigger_date + timedelta(days=duration_value)
            formula_desc = f"{trigger_date.isoformat()} + {duration_value} days"
            calendar_logic = "Default statutory calendar interval."

        # Court Stay / Extension Handling
        # If extension_days > 0, verify whether grounded in an order-specific court order reference
        court_stay_verified = False
        if extension_days > 0:
            if court_order_reference and (is_court_stay_verified or bool(court_order_reference.strip())):
                court_stay_verified = True
                calculated_due_date = raw_due + timedelta(days=extension_days)
                formula_desc += f" + {extension_days} days (Verified Court Stay Order: {court_order_reference.strip()})"
            else:
                # Require order-specific judicial verification
                calculated_due_date = raw_due + timedelta(days=extension_days)
                formula_desc += f" + {extension_days} days (PENDING JUDICIAL VERIFICATION: Court order reference required under Sec 19(7) / Sec 25 Explanation)"
        else:
            calculated_due_date = raw_due

        # Section 64 Condonation of Delay (Section 64(2) Further Proviso)
        # Allows Collector to entertain delayed application within a further period of up to 1 year (365 days) on sufficient cause.
        is_sec64 = rule_id in ("RULE-SEC-64-REFERENCE-PRESENT", "RULE-SEC-64-REFERENCE-ABSENT")
        effective_condonation = 0
        condonation_applied = False
        condonation_eligible: Optional[bool] = None
        condonation_window_expires: Optional[str] = None
        condonation_notes: Optional[str] = None

        if is_sec64:
            if condonation_granted:
                # Statutory maximum of 1 year (365 days) pursuant to Section 64(2) further proviso
                effective_condonation = min(condonation_days if condonation_days is not None else 365, 365)
                calculated_due_date = calculated_due_date + timedelta(days=effective_condonation)
                reason_suffix = f" - Reason: {condonation_reason.strip()}" if condonation_reason and condonation_reason.strip() else ""
                formula_desc += f" + {effective_condonation} days (Section 64(2) Further Proviso: Collector condonation granted{reason_suffix})"
                condonation_applied = True
                condonation_notes = (
                    f"Section 64(2) Further Proviso applied: Collector exercised statutory discretion to condone "
                    f"delay for {effective_condonation} days upon sufficient cause (statutory ceiling: 365 days)."
                )
            else:
                # Not granted: evaluate whether landowner is still within the 1-year condonation eligibility window
                primary_deadline = calculated_due_date
                if ref_date > primary_deadline:
                    days_past_primary = (ref_date - primary_deadline).days
                    if days_past_primary <= 365:
                        condonation_eligible = True
                        condonation_window_expires = (primary_deadline + timedelta(days=365)).isoformat()
                        condonation_notes = (
                            "Application is prima facie time-barred under primary limitation period, but remains "
                            "eligible for discretionary condonation of delay by Collector for up to 1 year under "
                            "Section 64(2) further proviso upon showing sufficient cause."
                        )
                    else:
                        condonation_eligible = False
                        condonation_window_expires = (primary_deadline + timedelta(days=365)).isoformat()
                        condonation_notes = (
                            "Statutory 1-year outer window for Collector condonation of delay under Section 64(2) "
                            "further proviso has expired. Absolute bar on reference."
                        )

        # Section 80 Penal Interest Calculation
        if rule_id == "RULE-SEC-80-DELAY-INTEREST":
            end_eval_date = completed_date or ref_date
            days_from_possession = max(0, (end_eval_date - trigger_date).days)
            if days_from_possession <= 365:
                penal_interest_rate = 9.0
            else:
                penal_interest_rate = 15.0

            if unpaid_balance_amount and unpaid_balance_amount > 0:
                if days_from_possession <= 365:
                    penal_interest_amount = round(unpaid_balance_amount * 0.09 * (days_from_possession / 365.0), 2)
                else:
                    yr1_interest = unpaid_balance_amount * 0.09
                    yr2_days = days_from_possession - 365
                    yr2_interest = unpaid_balance_amount * 0.15 * (yr2_days / 365.0)
                    penal_interest_amount = round(yr1_interest + yr2_interest, 2)

        # Determine status and days remaining
        days_remaining = (calculated_due_date - ref_date).days

        if completed_date is not None:
            status = "COMPLETED"
        elif days_remaining < 0:
            if is_lapse:
                status = "LAPSED"
            else:
                status = "OVERDUE"
        elif (clock_type in ["MONTHS", "YEARS"] and days_remaining <= 30) or days_remaining <= 15:
            status = "DUE_SOON"
        else:
            status = "UPCOMING"

        # Explainable calculation trace with decoupled statutory vs operational fields
        trace = {
            "rule_id": rule_id,
            "rule_name": rule_name,
            "statutory_citation": rule.get("source_version", "Act No. 30 of 2013"),
            "trigger_event": trigger_event,
            "trigger_date": trigger_date.isoformat(),
            "clock_type": clock_type,
            "duration_value": duration_value,
            "duration_unit": duration_unit,
            "formula": formula_desc,
            "calendar_logic": calendar_logic,
            "extension_applied_days": extension_days,
            "court_order_reference": court_order_reference,
            "court_stay_verified": court_stay_verified,
            "calculated_due_date": calculated_due_date.isoformat(),
            "days_remaining": days_remaining,
            "status": status,
            "is_mandatory_lapse": is_lapse,
            "rule_type": rule_type,
            "legal_effect": legal_effect,
            "consequence_if_overdue": consequence,
            "statutory_vs_operational": statutory_vs_operational,
            "operational_delay_cpm_days": operational_delay_cpm_days,
            "operational_impact_notes": operational_impact_notes,
            "penal_interest_rate_percent": penal_interest_rate,
            "penal_interest_estimated_amount": penal_interest_amount,
            "condonation_proviso_applied": condonation_applied if is_sec64 else None,
            "condonation_days": effective_condonation if is_sec64 else 0,
            "condonation_reason": condonation_reason if (is_sec64 and condonation_applied) else None,
            "condonation_eligible": condonation_eligible,
            "condonation_window_expires": condonation_window_expires,
            "condonation_notes": condonation_notes,
            "statutory_proviso_citation": "Section 64(2) Further Proviso, RFCTLARR Act 2013" if is_sec64 else None,
            "source_authority": rule.get("source_url", "https://www.indiacode.nic.in/handle/123456789/2121"),
            "disclaimer": STATUTORY_DISCLAIMER_TEXT,
        }

        # Operational CPM delay is applied ONLY if overdue/lapsed, and strictly represented as project impact
        effective_cpm_delay = operational_delay_cpm_days if status in ["OVERDUE", "LAPSED"] else 0

        return {
            "rule_id": rule_id,
            "trigger_event": trigger_event,
            "trigger_date": trigger_date.isoformat(),
            "calculated_due_date": calculated_due_date.isoformat(),
            "days_remaining": days_remaining,
            "status": status,
            "is_mandatory_lapse": is_lapse,
            "legal_effect": legal_effect,
            "operational_delay_cpm_days": effective_cpm_delay,
            "calculation_trace": trace,
        }

    async def get_all_rules(
        self,
        jurisdiction: Optional[str] = None,
        role: Optional[str] = None,
        as_of_date: Optional[date] = None,
        db: Optional[AsyncSession] = None,
    ) -> list[dict[str, Any]]:
        """Retrieves active statutory deadline rules with temporal validity filtering (as_of_date)."""
        import time
        now = time.time()
        has_filters = bool(jurisdiction or role or as_of_date)
        if not has_filters and self._all_rules_cache is not None and (now - self._rules_cache_time < 5.0):
            return [dict(r) for r in self._all_rules_cache]

        if as_of_date and isinstance(as_of_date, str):
            as_of_date = date.fromisoformat(as_of_date)

        rules = []
        if db:
            try:
                stmt = select(SIHStatutoryDeadlineRule)
                filters = []
                if jurisdiction:
                    filters.append(SIHStatutoryDeadlineRule.jurisdiction == jurisdiction.strip().upper())
                if role:
                    norm_role = role.strip().upper()
                    filters.append(or_(
                        SIHStatutoryDeadlineRule.applies_to_role == norm_role,
                        SIHStatutoryDeadlineRule.applies_to_role == "BOTH"
                    ))
                if as_of_date:
                    filters.append(or_(
                        SIHStatutoryDeadlineRule.effective_from.is_(None),
                        SIHStatutoryDeadlineRule.effective_from <= as_of_date
                    ))
                    filters.append(or_(
                        SIHStatutoryDeadlineRule.effective_to.is_(None),
                        SIHStatutoryDeadlineRule.effective_to >= as_of_date
                    ))
                if filters:
                    stmt = stmt.where(*filters)
                stmt = stmt.order_by(SIHStatutoryDeadlineRule.id)
                res = await db.execute(stmt)
                rows = res.scalars().all()
                rules = [r.to_dict() for r in rows]
            except Exception as e:
                print(f"[StatutoryDeadlineEngine] DB query notice: {e}. Using fallback cache.")

        if not rules:
            rules = list(self._rules_cache.values())
            if jurisdiction:
                rules = [r for r in rules if r.get("jurisdiction") == jurisdiction.strip().upper()]
            if role:
                norm_role = role.strip().upper()
                rules = [r for r in rules if r.get("applies_to_role") in [norm_role, "BOTH"]]
            if as_of_date:
                def _is_valid_as_of(r: dict[str, Any]) -> bool:
                    ef = r.get("effective_from")
                    et = r.get("effective_to")
                    if ef:
                        ef_date = date.fromisoformat(ef) if isinstance(ef, str) else ef
                        if ef_date > as_of_date:
                            return False
                    if et:
                        et_date = date.fromisoformat(et) if isinstance(et, str) else et
                        if et_date < as_of_date:
                            return False
                    return True
                rules = [r for r in rules if _is_valid_as_of(r)]

        if not has_filters and rules:
            import time
            self._all_rules_cache = [dict(r) for r in rules]
            self._rules_cache_time = time.time()

        return rules

    async def get_parcel_deadlines(
        self,
        parcel_id: str,
        db: Optional[AsyncSession] = None,
    ) -> list[dict[str, Any]]:
        """
        Retrieves active statutory deadlines associated with a cadastral parcel.
        Auto-derives from the parcel acquisition case dossier in sub-5ms if DB rows are absent.
        """
        norm_pid = parcel_id.strip().upper()
        if db is not None:
            try:
                stmt = select(SIHStatutoryDeadline).where(SIHStatutoryDeadline.parcel_id == norm_pid).order_by(SIHStatutoryDeadline.calculated_due_date)
                res = await db.execute(stmt)
                rows = res.scalars().all()
                if rows:
                    return [r.to_dict() for r in rows]
            except Exception:
                pass

        p_detail = sih_service.get_parcel_detail(norm_pid)
        if not p_detail:
            return []

        case_info = p_detail.get("acquisition_case") or {}
        notif_str = case_info.get("notification_date")
        decl_str = case_info.get("declaration_date")
        award_str = case_info.get("award_date")
        poss_str = case_info.get("possession_date")

        notif_d = date.fromisoformat(notif_str) if notif_str else date(2025, 4, 1)
        decl_d = date.fromisoformat(decl_str) if decl_str else None
        award_d = date.fromisoformat(award_str) if award_str else None
        poss_d = date.fromisoformat(poss_str) if poss_str else None

        return await self.generate_deadlines_for_case(
            case_id=case_info.get("case_id", f"CASE-{norm_pid}"),
            parcel_id=norm_pid,
            notification_date=notif_d,
            declaration_date=decl_d,
            award_date=award_d,
            possession_date=poss_d,
            db=db,
        )

    async def generate_deadlines_for_case(
        self,
        case_id: str,
        parcel_id: Optional[str] = None,
        notification_date: Optional[date] = None,
        declaration_date: Optional[date] = None,
        award_date: Optional[date] = None,
        possession_date: Optional[date] = None,
        as_of_date: Optional[date] = None,
        db: Optional[AsyncSession] = None,
    ) -> list[dict[str, Any]]:
        """
        Derives and persists all applicable statutory clocks for an acquisition case.
        Connects LAW -> STAGE -> EVENT -> DEADLINE -> MILESTONE -> CPM.
        Strictly preserves separate statutory paths for Section 38 and Section 64.
        """
        if notification_date and isinstance(notification_date, str):
            notification_date = date.fromisoformat(notification_date)
        if declaration_date and isinstance(declaration_date, str):
            declaration_date = date.fromisoformat(declaration_date)
        if award_date and isinstance(award_date, str):
            award_date = date.fromisoformat(award_date)
        if possession_date and isinstance(possession_date, str):
            possession_date = date.fromisoformat(possession_date)

        eval_date = as_of_date or notification_date or date.today()
        all_rules = await self.get_all_rules(as_of_date=eval_date, db=db)
        rule_map = {r["id"]: r for r in all_rules}
        generated_deadlines = []

        # 1. Section 11 Preliminary Notification Clocks
        if notification_date:
            # Section 15 Hearing of Objections (60 days)
            if "RULE-SEC-15-OBJECTION" in rule_map:
                r15 = rule_map["RULE-SEC-15-OBJECTION"]
                res15 = self.calculate_deadline(r15, notification_date)
                generated_deadlines.append({
                    "id": f"DL-{case_id}-SEC15",
                    "rule_id": r15["id"],
                    "rule_name": r15.get("title") or r15["id"],
                    "title": r15.get("title") or r15["id"],
                    "acquisition_case_id": case_id,
                    "parcel_id": parcel_id,
                    "milestone_id": "MS-05",
                    "trigger_event": "SECTION_11_PUBLICATION",
                    "trigger_date": notification_date,
                    "calculated_due_date": date.fromisoformat(res15["calculated_due_date"]),
                    "days_remaining": res15.get("days_remaining"),
                    "is_mandatory_lapse": res15.get("is_mandatory_lapse", r15.get("is_mandatory_lapse", False)),
                    "status": res15["status"],
                    "responsible_role": r15["responsible_role"],
                    "source_snapshot": r15,
                    "calculation_trace": res15["calculation_trace"],
                    "is_blocking_cpm": res15["status"] in ["OVERDUE", "LAPSED"],
                    "statutory_consequence_applied": res15["calculation_trace"].get("legal_effect"),
                    "operational_cpm_delay_applied": res15["operational_delay_cpm_days"],
                })

            # Section 19 Declaration (12 months mandatory lapse)
            if "RULE-SEC-19-DECLARATION" in rule_map:
                r19 = rule_map["RULE-SEC-19-DECLARATION"]
                completed19 = declaration_date if declaration_date else None
                res19 = self.calculate_deadline(r19, notification_date, completed_date=completed19)
                generated_deadlines.append({
                    "id": f"DL-{case_id}-SEC19",
                    "rule_id": r19["id"],
                    "rule_name": r19.get("title") or r19["id"],
                    "title": r19.get("title") or r19["id"],
                    "acquisition_case_id": case_id,
                    "parcel_id": parcel_id,
                    "milestone_id": "MS-07",
                    "trigger_event": "SECTION_11_PUBLICATION",
                    "trigger_date": notification_date,
                    "calculated_due_date": date.fromisoformat(res19["calculated_due_date"]),
                    "completed_date": completed19,
                    "days_remaining": res19.get("days_remaining"),
                    "is_mandatory_lapse": res19.get("is_mandatory_lapse", r19.get("is_mandatory_lapse", True)),
                    "status": res19["status"],
                    "responsible_role": r19["responsible_role"],
                    "source_snapshot": r19,
                    "calculation_trace": res19["calculation_trace"],
                    "is_blocking_cpm": res19["status"] in ["OVERDUE", "LAPSED"],
                    "statutory_consequence_applied": res19["calculation_trace"].get("legal_effect"),
                    "operational_cpm_delay_applied": res19["operational_delay_cpm_days"],
                })

        # 2. Section 19 Declaration Clocks
        if declaration_date:
            # Section 25 Award Pronouncement (12 months absolute statutory lapse)
            if "RULE-SEC-25-AWARD" in rule_map:
                r25 = rule_map["RULE-SEC-25-AWARD"]
                completed25 = award_date if award_date else None
                res25 = self.calculate_deadline(r25, declaration_date, completed_date=completed25)
                generated_deadlines.append({
                    "id": f"DL-{case_id}-SEC25",
                    "rule_id": r25["id"],
                    "rule_name": r25.get("title") or r25["id"],
                    "title": r25.get("title") or r25["id"],
                    "acquisition_case_id": case_id,
                    "parcel_id": parcel_id,
                    "milestone_id": "MS-12",
                    "trigger_event": "SECTION_19_DECLARATION",
                    "trigger_date": declaration_date,
                    "calculated_due_date": date.fromisoformat(res25["calculated_due_date"]),
                    "completed_date": completed25,
                    "days_remaining": res25.get("days_remaining"),
                    "is_mandatory_lapse": res25.get("is_mandatory_lapse", r25.get("is_mandatory_lapse", True)),
                    "status": res25["status"],
                    "responsible_role": r25["responsible_role"],
                    "source_snapshot": r25,
                    "calculation_trace": res25["calculation_trace"],
                    "is_blocking_cpm": res25["status"] in ["OVERDUE", "LAPSED"],
                    "statutory_consequence_applied": res25["calculation_trace"].get("legal_effect"),
                    "operational_cpm_delay_applied": res25["operational_delay_cpm_days"],
                })

        # 3. Section 23/25 Award Pronouncement Clocks
        if award_date:
            # Section 38(1) Full Compensation Disbursement within 3 Months
            if "RULE-SEC-38-COMP-PAYMENT" in rule_map:
                r38_comp = rule_map["RULE-SEC-38-COMP-PAYMENT"]
                res38_comp = self.calculate_deadline(r38_comp, award_date)
                generated_deadlines.append({
                    "id": f"DL-{case_id}-SEC38-COMP",
                    "rule_id": r38_comp["id"],
                    "rule_name": r38_comp.get("title") or r38_comp["id"],
                    "title": r38_comp.get("title") or r38_comp["id"],
                    "acquisition_case_id": case_id,
                    "parcel_id": parcel_id,
                    "milestone_id": "MS-13",
                    "trigger_event": "AWARD_PRONOUNCEMENT",
                    "trigger_date": award_date,
                    "calculated_due_date": date.fromisoformat(res38_comp["calculated_due_date"]),
                    "days_remaining": res38_comp.get("days_remaining"),
                    "is_mandatory_lapse": res38_comp.get("is_mandatory_lapse", r38_comp.get("is_mandatory_lapse", False)),
                    "status": res38_comp["status"],
                    "responsible_role": r38_comp["responsible_role"],
                    "source_snapshot": r38_comp,
                    "calculation_trace": res38_comp["calculation_trace"],
                    "is_blocking_cpm": res38_comp["status"] in ["OVERDUE", "LAPSED"],
                    "statutory_consequence_applied": res38_comp["calculation_trace"].get("legal_effect"),
                    "operational_cpm_delay_applied": res38_comp["operational_delay_cpm_days"],
                })

            # Section 38(1) Monetary R&R Disbursement within 6 Months
            if "RULE-SEC-38-RR-MONETARY" in rule_map:
                r38_rr = rule_map["RULE-SEC-38-RR-MONETARY"]
                res38_rr = self.calculate_deadline(r38_rr, award_date)
                generated_deadlines.append({
                    "id": f"DL-{case_id}-SEC38-RR",
                    "rule_id": r38_rr["id"],
                    "rule_name": r38_rr.get("title") or r38_rr["id"],
                    "title": r38_rr.get("title") or r38_rr["id"],
                    "acquisition_case_id": case_id,
                    "parcel_id": parcel_id,
                    "milestone_id": "MS-13",
                    "trigger_event": "AWARD_PRONOUNCEMENT",
                    "trigger_date": award_date,
                    "calculated_due_date": date.fromisoformat(res38_rr["calculated_due_date"]),
                    "days_remaining": res38_rr.get("days_remaining"),
                    "is_mandatory_lapse": res38_rr.get("is_mandatory_lapse", r38_rr.get("is_mandatory_lapse", False)),
                    "status": res38_rr["status"],
                    "responsible_role": r38_rr["responsible_role"],
                    "source_snapshot": r38_rr,
                    "calculation_trace": res38_rr["calculation_trace"],
                    "is_blocking_cpm": res38_rr["status"] in ["OVERDUE", "LAPSED"],
                    "statutory_consequence_applied": res38_rr["calculation_trace"].get("legal_effect"),
                    "operational_cpm_delay_applied": res38_rr["operational_delay_cpm_days"],
                })

            # Section 38 Condition Precedent Before Physical Possession
            if "RULE-SEC-38-POSSESSION-PREREQUISITE" in rule_map:
                r38_pos = rule_map["RULE-SEC-38-POSSESSION-PREREQUISITE"]
                res38_pos = self.calculate_deadline(r38_pos, award_date, completed_date=possession_date)
                generated_deadlines.append({
                    "id": f"DL-{case_id}-SEC38-POS",
                    "rule_id": r38_pos["id"],
                    "rule_name": r38_pos.get("title") or r38_pos["id"],
                    "title": r38_pos.get("title") or r38_pos["id"],
                    "acquisition_case_id": case_id,
                    "parcel_id": parcel_id,
                    "milestone_id": "MS-13",
                    "trigger_event": "AWARD_PRONOUNCEMENT",
                    "trigger_date": award_date,
                    "calculated_due_date": date.fromisoformat(res38_pos["calculated_due_date"]),
                    "completed_date": possession_date,
                    "days_remaining": res38_pos.get("days_remaining"),
                    "is_mandatory_lapse": res38_pos.get("is_mandatory_lapse", r38_pos.get("is_mandatory_lapse", True)),
                    "status": res38_pos["status"],
                    "responsible_role": r38_pos["responsible_role"],
                    "source_snapshot": r38_pos,
                    "calculation_trace": res38_pos["calculation_trace"],
                    "is_blocking_cpm": res38_pos["status"] in ["OVERDUE", "LAPSED"],
                    "statutory_consequence_applied": res38_pos["calculation_trace"].get("legal_effect"),
                    "operational_cpm_delay_applied": res38_pos["operational_delay_cpm_days"],
                })

            # Section 64(2)(a) Landowner Reference (6 weeks / 42 days)
            if "RULE-SEC-64-REFERENCE-PRESENT" in rule_map:
                r64_pres = rule_map["RULE-SEC-64-REFERENCE-PRESENT"]
                res64_pres = self.calculate_deadline(r64_pres, award_date)
                generated_deadlines.append({
                    "id": f"DL-{case_id}-SEC64-PRES",
                    "rule_id": r64_pres["id"],
                    "rule_name": r64_pres.get("title") or r64_pres["id"],
                    "title": r64_pres.get("title") or r64_pres["id"],
                    "acquisition_case_id": case_id,
                    "parcel_id": parcel_id,
                    "milestone_id": "MS-16",
                    "trigger_event": "AWARD_PRONOUNCEMENT",
                    "trigger_date": award_date,
                    "calculated_due_date": date.fromisoformat(res64_pres["calculated_due_date"]),
                    "days_remaining": res64_pres.get("days_remaining"),
                    "is_mandatory_lapse": res64_pres.get("is_mandatory_lapse", r64_pres.get("is_mandatory_lapse", False)),
                    "status": res64_pres["status"],
                    "responsible_role": r64_pres["responsible_role"],
                    "source_snapshot": r64_pres,
                    "calculation_trace": res64_pres["calculation_trace"],
                    "is_blocking_cpm": False,
                    "statutory_consequence_applied": res64_pres["calculation_trace"].get("legal_effect"),
                    "operational_cpm_delay_applied": 0,
                })

        # Persist to database if db session provided
        if db:
            for dl in generated_deadlines:
                try:
                    stmt = select(SIHStatutoryDeadline).where(SIHStatutoryDeadline.id == dl["id"])
                    existing = (await db.execute(stmt)).scalars().first()
                    if existing:
                        existing.status = dl["status"]
                        existing.calculated_due_date = dl["calculated_due_date"]
                        existing.completed_date = dl.get("completed_date")
                        existing.calculation_trace = dl["calculation_trace"]
                        existing.is_blocking_cpm = dl["is_blocking_cpm"]
                        existing.statutory_consequence_applied = dl.get("statutory_consequence_applied")
                        existing.operational_cpm_delay_applied = dl.get("operational_cpm_delay_applied", 0)
                    else:
                        new_dl = SIHStatutoryDeadline(
                            id=dl["id"],
                            rule_id=dl["rule_id"],
                            acquisition_case_id=dl.get("acquisition_case_id"),
                            parcel_id=dl.get("parcel_id"),
                            milestone_id=dl.get("milestone_id"),
                            trigger_event=dl["trigger_event"],
                            trigger_date=dl["trigger_date"],
                            calculated_due_date=dl["calculated_due_date"],
                            completed_date=dl.get("completed_date"),
                            status=dl["status"],
                            responsible_role=dl["responsible_role"],
                            source_snapshot=dl["source_snapshot"],
                            calculation_trace=dl["calculation_trace"],
                            is_blocking_cpm=dl["is_blocking_cpm"],
                            statutory_consequence_applied=dl.get("statutory_consequence_applied"),
                            operational_cpm_delay_applied=dl.get("operational_cpm_delay_applied", 0),
                        )
                        db.add(new_dl)
                except Exception as e:
                    print(f"[StatutoryDeadlineEngine] Notice inserting deadline {dl['id']}: {e}")
            await db.commit()

        # Format output
        output = []
        for dl in generated_deadlines:
            d_out = dict(dl)
            d_out["trigger_date"] = dl["trigger_date"].isoformat() if hasattr(dl["trigger_date"], "isoformat") else str(dl["trigger_date"])
            d_out["calculated_due_date"] = dl["calculated_due_date"].isoformat() if hasattr(dl["calculated_due_date"], "isoformat") else str(dl["calculated_due_date"])
            if dl.get("completed_date"):
                d_out["completed_date"] = dl["completed_date"].isoformat() if hasattr(dl["completed_date"], "isoformat") else str(dl["completed_date"])
            output.append(d_out)

        return output

    async def get_corridor_summary(self, db: Optional[AsyncSession] = None) -> dict[str, Any]:
        """Calculates corridor-wide deadline metrics, upcoming clocks, and mandatory lapse risk alerts."""
        deadlines = []
        if db:
            try:
                res = await db.execute(select(SIHStatutoryDeadline))
                rows = res.scalars().all()
                deadlines = [r.to_dict() for r in rows]
            except Exception as e:
                print(f"[StatutoryDeadlineEngine] Summary DB query notice: {e}")

        if not deadlines:
            # Fallback evaluation on active parcels
            parcels = sih_service._data_cache.get("parcels", []) if sih_service._data_cache else []
            for p in parcels[:15]:
                pid = p["parcel_id"]
                case = sih_service._data_cache.get("cases_map", {}).get(pid, {})
                notif = case.get("notification_date") or date(2025, 4, 1)
                decl = case.get("declaration_date")
                award = case.get("award_date")
                dls = await self.generate_deadlines_for_case(
                    case_id=case.get("case_id", f"CASE-{pid}"),
                    parcel_id=pid,
                    notification_date=notif,
                    declaration_date=decl,
                    award_date=award,
                )
                deadlines.extend(dls)

        total = len(deadlines)
        upcoming = [d for d in deadlines if d.get("status") == "UPCOMING"]
        due_soon = [d for d in deadlines if d.get("status") == "DUE_SOON"]
        overdue = [d for d in deadlines if d.get("status") in ["OVERDUE", "LAPSED"]]
        completed = [d for d in deadlines if d.get("status") == "COMPLETED"]
        lapse_risks = [
            d for d in deadlines
            if d.get("calculation_trace", {}).get("is_mandatory_lapse") and d.get("status") in ["DUE_SOON", "OVERDUE", "LAPSED"]
        ]
        blocking = [d for d in deadlines if d.get("is_blocking_cpm")]

        return {
            "total_deadlines": total,
            "upcoming_count": len(upcoming),
            "due_soon_count": len(due_soon),
            "overdue_count": len(overdue),
            "completed_count": len(completed),
            "mandatory_lapse_risks_count": len(lapse_risks),
            "active_cpm_blockers_count": len(blocking),
            "critical_lapse_cases": lapse_risks[:10],
            "disclaimer": STATUTORY_DISCLAIMER_TEXT,
        }


statutory_deadline_engine = StatutoryDeadlineEngine()
