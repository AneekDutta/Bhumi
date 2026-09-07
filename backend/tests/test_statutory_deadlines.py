"""
Test Suite for Hardened Statutory Deadline & Legal Clock Engine
SIH26016 Land Acquisition Digital Twin Platform

Strict Statutory Accuracy Audit Tests:
1. Legal consequence != CPM operational simulation heuristic
2. Section 38's three distinct requirements (3m compensation, 6m monetary R&R, possession bar)
3. Section 64's alternative limitation routes (Present vs Absent earlier-of calculation)
4. Section 80 penal interest on unpaid balance (9% Year 1, 15% Year 2+) vs Section 30(3) 12% additional component
5. Court stays require an actual court_order_reference
6. Historical deadline calculations retain rule source snapshot
7. Absence of legal overclaims ("100% precision") across disclaimers and traces
8. Month-end clamping, leap year handling, and working-days guard
"""
from datetime import date, timedelta
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.statutory_deadline_engine import (
    add_calendar_months,
    add_calendar_years,
    statutory_deadline_engine,
)


def test_calendar_days_arithmetic():
    """Verifies Section 15 60-day calendar calculation."""
    rule = statutory_deadline_engine.get_rule_definition("RULE-SEC-15-OBJECTION")
    assert rule is not None

    trigger = date(2025, 4, 1)
    res = statutory_deadline_engine.calculate_deadline(
        rule=rule,
        trigger_date=trigger,
        reference_date=date(2025, 5, 1),
    )

    # 2025-04-01 + 60 days = 2025-05-31
    assert res["calculated_due_date"] == "2025-05-31"
    assert res["status"] == "UPCOMING"
    assert res["days_remaining"] == 30
    assert "2025-04-01 + 60 calendar days" in res["calculation_trace"]["formula"]


def test_calendar_months_arithmetic():
    """Verifies Section 19 12-month calendar calculation."""
    rule = statutory_deadline_engine.get_rule_definition("RULE-SEC-19-DECLARATION")
    assert rule is not None
    assert rule["is_mandatory_lapse"] is True

    trigger = date(2025, 4, 1)
    res = statutory_deadline_engine.calculate_deadline(
        rule=rule,
        trigger_date=trigger,
        reference_date=date(2025, 10, 1),
    )

    assert res["calculated_due_date"] == "2026-04-01"
    assert res["is_mandatory_lapse"] is True
    assert res["status"] == "UPCOMING"


def test_month_end_clamping():
    """Verifies that month end boundaries clamp cleanly without date overflow."""
    # Leap year Jan 31 + 1 month = Feb 29, 2024
    d_leap = add_calendar_months(date(2024, 1, 31), 1)
    assert d_leap == date(2024, 2, 29)

    # Non-leap year Jan 31 + 1 month = Feb 28, 2025
    d_non_leap = add_calendar_months(date(2025, 1, 31), 1)
    assert d_non_leap == date(2025, 2, 28)

    # Aug 31 + 1 month = Sep 30, 2025
    d_aug = add_calendar_months(date(2025, 8, 31), 1)
    assert d_aug == date(2025, 9, 30)


def test_calendar_years_leap_year_clamping():
    """Verifies year addition handling Feb 29 to non-leap year."""
    # Feb 29, 2024 + 1 year = Feb 28, 2025
    d_year = add_calendar_years(date(2024, 2, 29), 1)
    assert d_year == date(2025, 2, 28)

    # Feb 29, 2024 + 4 years = Feb 29, 2028 (leap year)
    d_leap4 = add_calendar_years(date(2024, 2, 29), 4)
    assert d_leap4 == date(2028, 2, 29)


def test_working_days_explicitly_rejected():
    """Verifies that WORKING_DAYS clock type raises ValueError because holiday calendar is not configured."""
    mock_rule = {
        "id": "RULE-TEST-WORKING",
        "clock_type": "WORKING_DAYS",
        "duration_value": 15,
        "duration_unit": "DAYS",
    }
    with pytest.raises(ValueError) as exc_info:
        statutory_deadline_engine.calculate_deadline(mock_rule, date(2025, 4, 1))
    assert "WORKING_DAYS clock type is currently unsupported" in str(exc_info.value)


def test_decoupled_legal_consequence_and_cpm_heuristic():
    """
    CRUCIAL AUDIT REQUIREMENT:
    Proves that legal consequence (PROCEEDINGS_LAPSE) is strictly separated from
    KOSH's operational CPM simulation heuristic (operational_delay_cpm_days).
    """
    rule_sec19 = statutory_deadline_engine.get_rule_definition("RULE-SEC-19-DECLARATION")
    assert rule_sec19["legal_effect"] == "PROCEEDINGS_LAPSE"
    assert rule_sec19["statutory_vs_operational"] == "STATUTORY"
    assert rule_sec19["operational_delay_cpm_days"] == 60
    assert "operational heuristic" in rule_sec19["operational_impact_notes"].lower()

    rule_sec25 = statutory_deadline_engine.get_rule_definition("RULE-SEC-25-AWARD")
    assert rule_sec25["legal_effect"] == "PROCEEDINGS_LAPSE"
    assert rule_sec25["operational_delay_cpm_days"] == 90

    # Evaluate Section 19 overdue
    res = statutory_deadline_engine.calculate_deadline(
        rule=rule_sec19,
        trigger_date=date(2024, 1, 1),
        reference_date=date(2025, 3, 1),  # Overdue
    )
    assert res["status"] == "LAPSED"
    assert res["legal_effect"] == "PROCEEDINGS_LAPSE"
    assert res["operational_delay_cpm_days"] == 60
    # Legal effect is NOT stored as delay days
    assert res["calculation_trace"]["legal_effect"] != 60
    assert res["calculation_trace"]["legal_effect"] == "PROCEEDINGS_LAPSE"


def test_section_38_tripartite_separation():
    """
    AUDIT REQUIREMENT:
    Validates that Section 38's three distinct statutory requirements remain separate:
    1. Compensation disbursement within 3 months (Sec 38(1))
    2. Monetary R&R disbursement within 6 months (Sec 38(1))
    3. Condition precedent barring possession prior to full payment (Sec 38(1)&(2))
    """
    r_comp = statutory_deadline_engine.get_rule_definition("RULE-SEC-38-COMP-PAYMENT")
    r_rr = statutory_deadline_engine.get_rule_definition("RULE-SEC-38-RR-MONETARY")
    r_pos = statutory_deadline_engine.get_rule_definition("RULE-SEC-38-POSSESSION-PREREQUISITE")

    assert r_comp is not None
    assert r_rr is not None
    assert r_pos is not None

    award_date = date(2025, 5, 1)

    # Statutory citation accuracy audit: Section 38(1) runs from Section 30 award
    assert "Section 30" in r_comp["description"]
    assert "Section 30" in r_comp["calculation_notes"]
    assert "Section 30" in r_rr["description"]

    # 1. Compensation: 3 months (Due: 2025-08-01)
    res_comp = statutory_deadline_engine.calculate_deadline(r_comp, award_date)
    assert res_comp["calculated_due_date"] == "2025-08-01"
    assert res_comp["calculation_trace"]["rule_type"] == "PROCEDURAL_WINDOW"

    # 2. Monetary R&R: 6 months (Due: 2025-11-01)
    res_rr = statutory_deadline_engine.calculate_deadline(r_rr, award_date)
    assert res_rr["calculated_due_date"] == "2025-11-01"

    # 3. Possession: Prerequisite condition precedent
    res_pos = statutory_deadline_engine.calculate_deadline(r_pos, award_date)
    assert res_pos["calculation_trace"]["rule_type"] == "STATUTORY_PRECONDITION"
    assert res_pos["calculation_trace"]["legal_effect"] == "BAR_ON_POSSESSION"


def test_section_64_alternative_routes_separation():
    """
    AUDIT REQUIREMENT:
    Validates that Section 64's alternative limitation routes are strictly separated:
    - Route A: Present at award -> 6 weeks (42 calendar days) from date of award
    - Route B: Absent at award -> Earlier of (6 weeks from Section 21 notice receipt) OR (6 months from award)
    """
    r_present = statutory_deadline_engine.get_rule_definition("RULE-SEC-64-REFERENCE-PRESENT")
    r_absent = statutory_deadline_engine.get_rule_definition("RULE-SEC-64-REFERENCE-ABSENT")

    assert r_present is not None
    assert r_absent is not None

    award_d = date(2025, 4, 1)

    # Route A: Present at award -> 2025-04-01 + 42 days = 2025-05-13
    res_pres = statutory_deadline_engine.calculate_deadline(r_present, award_d)
    assert res_pres["calculated_due_date"] == "2025-05-13"

    # Route B (Case 1: Notice received early):
    # Notice received: 2025-04-10 (+42d = 2025-05-22). Award date: 2025-04-01 (+6m = 2025-10-01).
    # Earlier of two is 2025-05-22.
    res_abs1 = statutory_deadline_engine.calculate_deadline(
        r_absent, trigger_date=date(2025, 4, 10), award_date=award_d
    )
    assert res_abs1["calculated_due_date"] == "2025-05-22"

    # Route B (Case 2: Notice received late):
    # Notice received: 2025-09-20 (+42d = 2025-11-01). Award date: 2025-04-01 (+6m = 2025-10-01).
    # 6-month outer cap from award binds: earlier of two is 2025-10-01!
    res_abs2 = statutory_deadline_engine.calculate_deadline(
        r_absent, trigger_date=date(2025, 9, 20), award_date=award_d
    )
    assert res_abs2["calculated_due_date"] == "2025-10-01"


def test_section_64_condonation_proviso():
    """
    AUDIT REQUIREMENT:
    Validates Section 64(2) Further Proviso:
    1. If application is overdue under primary limitation period, landowner remains
       eligible for Collector's discretionary condonation of delay for up to 1 year on sufficient cause.
    2. When condonation is granted, deadline is extended up to statutory max of 365 days with reason trace.
    3. Condonation requests exceeding statutory ceiling of 365 days are clamped to 365 days.
    """
    r_present = statutory_deadline_engine.get_rule_definition("RULE-SEC-64-REFERENCE-PRESENT")
    assert r_present is not None

    award_d = date(2025, 4, 1)
    primary_due = date(2025, 5, 13)

    # 1. Overdue without condonation: prima facie time-barred, but eligible under proviso
    res_uncondoned = statutory_deadline_engine.calculate_deadline(
        rule=r_present,
        trigger_date=award_d,
        reference_date=date(2025, 6, 1),  # Overdue
        condonation_granted=False,
    )
    assert res_uncondoned["status"] == "OVERDUE"
    assert res_uncondoned["calculation_trace"]["condonation_proviso_applied"] is False
    assert res_uncondoned["calculation_trace"]["condonation_eligible"] is True
    assert res_uncondoned["calculation_trace"]["condonation_window_expires"] == (primary_due + timedelta(days=365)).isoformat()
    assert "eligible for discretionary condonation of delay" in res_uncondoned["calculation_trace"]["condonation_notes"]

    # 2. Condonation granted with sufficient cause (180 days)
    res_condoned = statutory_deadline_engine.calculate_deadline(
        rule=r_present,
        trigger_date=award_d,
        reference_date=date(2025, 6, 1),
        condonation_granted=True,
        condonation_days=180,
        condonation_reason="Hospitalization during limitation period",
    )
    expected_extended = primary_due + timedelta(days=180)  # 2025-11-09
    assert res_condoned["calculated_due_date"] == expected_extended.isoformat()
    assert res_condoned["status"] == "UPCOMING"
    assert res_condoned["calculation_trace"]["condonation_proviso_applied"] is True
    assert res_condoned["calculation_trace"]["condonation_days"] == 180
    assert res_condoned["calculation_trace"]["condonation_reason"] == "Hospitalization during limitation period"
    assert "Section 64(2) Further Proviso" in res_condoned["calculation_trace"]["statutory_proviso_citation"]

    # 3. Statutory 1-year ceiling clamping (e.g. 500 days requested -> clamped to 365)
    res_clamped = statutory_deadline_engine.calculate_deadline(
        rule=r_present,
        trigger_date=award_d,
        condonation_granted=True,
        condonation_days=500,
    )
    expected_max = primary_due + timedelta(days=365)
    assert res_clamped["calculated_due_date"] == expected_max.isoformat()
    assert res_clamped["calculation_trace"]["condonation_days"] == 365


def test_section_80_penal_interest_unpaid_balance_and_terminology():
    """
    AUDIT REQUIREMENT:
    Validates Section 80 penal interest:
    - Trigger event: POSSESSION_TAKEN (taking possession before payment/deposit)
    - Year 1 (days <= 365): 9% p.a. on unpaid balance
    - Year 2+ (days > 365): 15% p.a. on unpaid balance
    - Clear distinction from Section 30(3) 12% additional statutory amount.
    """
    r_sec80 = statutory_deadline_engine.get_rule_definition("RULE-SEC-80-DELAY-INTEREST")
    assert r_sec80 is not None
    assert r_sec80["trigger_event"] == "POSSESSION_TAKEN"
    assert "distinct from section 30(3)" in r_sec80["calculation_basis"].lower()

    possession_d = date(2024, 1, 1)
    unpaid_balance = 1_000_000.0  # 10 Lakhs unpaid balance

    # Case 1: Evaluation at 6 months (182 days) -> 9% p.a.
    res_yr1 = statutory_deadline_engine.calculate_deadline(
        r_sec80,
        trigger_date=possession_d,
        reference_date=date(2024, 7, 1),
        unpaid_balance_amount=unpaid_balance,
    )
    assert res_yr1["calculation_trace"]["penal_interest_rate_percent"] == 9.0
    expected_interest_yr1 = round(1_000_000 * 0.09 * (182 / 365.0), 2)
    assert abs(res_yr1["calculation_trace"]["penal_interest_estimated_amount"] - expected_interest_yr1) < 1.0

    # Case 2: Evaluation at 18 months (547 days) -> 15% p.a. escalation
    res_yr2 = statutory_deadline_engine.calculate_deadline(
        r_sec80,
        trigger_date=possession_d,
        reference_date=date(2025, 7, 1),
        unpaid_balance_amount=unpaid_balance,
    )
    assert res_yr2["calculation_trace"]["penal_interest_rate_percent"] == 15.0
    # Year 1 (90k) + Year 2 (182 days @ 15% = ~74,794)
    expected_interest_yr2 = round(1_000_000 * 0.09 + 1_000_000 * 0.15 * ((547 - 365) / 365.0), 2)
    assert abs(res_yr2["calculation_trace"]["penal_interest_estimated_amount"] - expected_interest_yr2) < 2.0


def test_court_stay_requires_actual_court_order_reference():
    """
    AUDIT REQUIREMENT:
    Court stays must not be generic auto-adders. If an order reference is provided,
    court_stay_verified is confirmed. Otherwise it is flagged as pending judicial verification.
    """
    rule = statutory_deadline_engine.get_rule_definition("RULE-SEC-19-DECLARATION")

    trigger = date(2025, 4, 1)

    # 1. Verified stay order with case citation
    res_verified = statutory_deadline_engine.calculate_deadline(
        rule=rule,
        trigger_date=trigger,
        extension_days=60,
        court_order_reference="DB Special Appeal No. 412/2025 (Rajasthan HC)",
        is_court_stay_verified=True,
    )
    assert res_verified["calculated_due_date"] == "2026-05-31"
    assert res_verified["calculation_trace"]["court_stay_verified"] is True
    assert "Verified Court Stay Order: DB Special Appeal No. 412/2025" in res_verified["calculation_trace"]["formula"]

    # 2. Extension claimed without verified court order citation
    res_unverified = statutory_deadline_engine.calculate_deadline(
        rule=rule,
        trigger_date=trigger,
        extension_days=60,
        court_order_reference=None,
        is_court_stay_verified=False,
    )
    assert res_unverified["calculation_trace"]["court_stay_verified"] is False
    assert "PENDING JUDICIAL VERIFICATION" in res_unverified["calculation_trace"]["formula"]


def test_no_legal_overclaims_in_disclaimers_or_traces():
    """
    AUDIT REQUIREMENT:
    Ensure that no text in disclaimers, traces, or rule descriptions contains '100% precision',
    'legally authoritative', or equivalent overclaims.
    """
    disclaimer = statutory_deadline_engine.get_rule_definition("RULE-SEC-19-DECLARATION")
    res = statutory_deadline_engine.calculate_deadline(disclaimer, date(2025, 4, 1))

    text_to_check = (
        res["calculation_trace"]["disclaimer"].lower()
        + " "
        + res["calculation_trace"]["calendar_logic"].lower()
    )

    assert "100% statutory precision" not in text_to_check
    assert "100% precision" not in text_to_check
    assert "legally authoritative" not in text_to_check
    assert "decision support" in res["calculation_trace"]["disclaimer"].lower()
    assert "does not determine legal rights" in res["calculation_trace"]["disclaimer"].lower()


@pytest.mark.asyncio
async def test_api_list_rules():
    """Verifies GET /api/v1/deadlines/rules returns all hardened rules with audit metadata."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/deadlines/rules")
    assert resp.status_code == 200
    rules = resp.json()
    assert len(rules) >= 8
    rule_ids = [r["id"] for r in rules]
    assert "RULE-SEC-15-OBJECTION" in rule_ids
    assert "RULE-SEC-19-DECLARATION" in rule_ids
    assert "RULE-SEC-25-AWARD" in rule_ids
    assert "RULE-SEC-38-COMP-PAYMENT" in rule_ids
    assert "RULE-SEC-38-POSSESSION-PREREQUISITE" in rule_ids
    assert "RULE-SEC-64-REFERENCE-PRESENT" in rule_ids
    assert "RULE-SEC-80-DELAY-INTEREST" in rule_ids

    # Check that audit metadata fields are present
    sample = rules[0]
    assert "rule_type" in sample
    assert "legal_effect" in sample
    assert "statutory_vs_operational" in sample
    assert "operational_delay_cpm_days" in sample


@pytest.mark.asyncio
async def test_api_calculate_endpoint_with_court_stay_and_balance():
    """Verifies POST /api/v1/deadlines/calculate with court stay order and Section 80 balance."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "rule_id": "RULE-SEC-80-DELAY-INTEREST",
            "trigger_date": "2024-01-01",
            "reference_date": "2025-07-01",
            "unpaid_balance_amount": 500000.0,
        }
        resp = await ac.post("/api/v1/deadlines/calculate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["rule_id"] == "RULE-SEC-80-DELAY-INTEREST"
    assert data["calculation_trace"]["penal_interest_rate_percent"] == 15.0
    assert data["calculation_trace"]["penal_interest_estimated_amount"] is not None
    assert data["legal_effect"] == "PENAL_INTEREST_ACCRUAL"


@pytest.mark.asyncio
async def test_api_parcel_deadlines_and_completion():
    """Verifies GET /api/v1/deadlines/parcels/P00003 and completing a deadline."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/deadlines/parcels/P00003")
        assert resp.status_code == 200
        deadlines = resp.json()
        assert len(deadlines) >= 2

        target_dl = deadlines[0]
        dl_id = target_dl["id"]

        comp_payload = {
            "completed_date": "2025-05-20",
            "evidence_document_id": "DOC-GAZETTE-SEC11",
            "notes": "Section 15 objection hearing concluded with formal order.",
        }
        comp_resp = await ac.post(f"/api/v1/deadlines/{dl_id}/complete", json=comp_payload)
        assert comp_resp.status_code == 200
        completed_data = comp_resp.json()
        assert completed_data["status"] == "COMPLETED"
        assert completed_data["completed_date"] == "2025-05-20"


@pytest.mark.asyncio
async def test_api_corridor_summary():
    """Verifies GET /api/v1/deadlines/summary."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/deadlines/summary")
    assert resp.status_code == 200
    summary = resp.json()
    assert "total_deadlines" in summary
    assert "upcoming_count" in summary
    assert "due_soon_count" in summary
    assert "mandatory_lapse_risks_count" in summary
    assert "disclaimer" in summary
    assert "does not determine legal rights" in summary["disclaimer"].lower()
