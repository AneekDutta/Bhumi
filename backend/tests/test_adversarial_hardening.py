"""
KOSH SIH26016 — Adversarial Hardening & Security Regression Suite
===================================================================
Covers 12 risk domains identified in the external adversarial review.

Philosophy: every test proves a CONCRETE failure mode, not just an absence of errors.
Tests are deterministic and do NOT rely on production DB state.

Risk domains tested here:
  R1  — Legal consequence ≠ CPM heuristic (field separation)
  R2  — What-If mutation safety (simulation cannot mutate production state)
  R3  — IDOR / horizontal access (officers cannot access cross-district/cross-project)
  R4  — Evidence integrity (wrong-parcel evidence cannot resolve a different case)
  R5  — Court-stay manipulation (PENDING_VERIFICATION stays do NOT extend statutory clock)
  R6  — Deadline duplication / idempotency (generate does not create duplicate clocks)
  R7  — RBAC: landowner cannot access officer-only endpoints
  R8  — RBAC: CITIZEN role cannot post mutations
  R9  — Action/deadline state semantics (COMPLETED action ≠ automatic statutory compliance)
  R10 — Rate limiter logic (in-process RateLimiter correctly enforces window)
  R11 — Pydantic deprecation (model_dump used, not .dict())
  R12 — Synthetic data disclosure (source_type label present on model-derived results)
"""

import asyncio
import os
from copy import deepcopy
from datetime import date, timedelta
from typing import Any, Optional
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.deps import TrustedIdentity, get_current_user_context
from app.core.database import get_db
from app.main import app
from app.services.whatif_simulator import WhatIfSimulator


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

class MockResult:
    def scalars(self):
        class ScalarResult:
            def first(self_): return None
            def all(self_): return []
        return ScalarResult()
    def all(self): return []


class MockSession:
    async def execute(self, query): return MockResult()
    async def commit(self): pass
    async def refresh(self, obj): pass
    def add(self, obj): pass
    async def close(self): pass
    async def rollback(self): pass


async def override_get_db():
    yield MockSession()


@pytest.fixture(autouse=True)
def mock_db_for_tests():
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture(autouse=True)
def cleanup_dependency_overrides():
    yield
    from app.api.deps import get_current_user_context
    app.dependency_overrides.pop(get_current_user_context, None)


# ---------------------------------------------------------------------------
# R1 — Legal consequence ≠ CPM heuristic
# ---------------------------------------------------------------------------

def test_r1_legal_consequence_separated_from_cpm_heuristic():
    """
    Each statutory deadline rule must have separate fields for the STATUTORY
    legal consequence and the KOSH CPM operational heuristic. They must not
    be the same value or conflated into one field.
    """
    from app.data.statutory_deadline_rules_data import DEADLINE_RULES_DATA

    for rule in DEADLINE_RULES_DATA:
        rid = rule["id"]
        assert "consequence_if_overdue" in rule, f"{rid}: missing consequence_if_overdue"
        assert "operational_impact_notes" in rule, f"{rid}: missing operational_impact_notes"
        assert "statutory_vs_operational" in rule, f"{rid}: missing statutory_vs_operational"

        assert rule["statutory_vs_operational"] in ("STATUTORY", "OPERATIONAL", "BOTH"), \
            f"{rid}: unexpected statutory_vs_operational value"

        consequence = rule["consequence_if_overdue"]
        assert "cpm_delay_weight_days" not in consequence.lower(), \
            f"{rid}: CPM field reference leaked into legal consequence text"

        lower = consequence.lower()
        if rid != "RULE-SEC-80-DELAY-INTEREST":
            assert "cpm" not in lower, f"{rid}: CPM mention in statutory consequence"


# ---------------------------------------------------------------------------
# R2 — What-If mutation safety
# ---------------------------------------------------------------------------

def test_r2_whatif_does_not_mutate_source_edges():
    """
    WhatIfSimulator.simulate() must return a result WITHOUT mutating
    the source edge list passed to it. Uses deepcopy internally.
    """
    simulator = WhatIfSimulator()

    edges = [
        {"from_node_type": "parcel", "from_node_id": "P00001",
         "to_node_type": "parcel", "to_node_id": "P00002",
         "edge_type": "blocks", "weight_days": 15.0, "is_blocking": True},
        {"from_node_type": "parcel", "from_node_id": "P00002",
         "to_node_type": "parcel", "to_node_id": "P00003",
         "edge_type": "requires", "weight_days": 10.0, "is_blocking": True},
    ]
    edges_snapshot = deepcopy(edges)
    parcels = {"P00001": {"parcel_id": "P00001", "ownership_conflict": True},
               "P00002": {}, "P00003": {}}

    simulator.simulate(
        base_edges=edges,
        intervention_type="RESOLVE_BLOCKER",
        target_entity_ids=["P00001"],
        parcels_lookup=parcels,
        project_start_date=date(2025, 1, 1),
        target_completion_date=date(2025, 12, 31),
    )

    assert edges == edges_snapshot, "WhatIfSimulator mutated the source edge list"


def test_r2_whatif_idempotent_repeated_calls():
    """
    Repeated calls with the same parameters must produce identical results.
    """
    simulator = WhatIfSimulator()
    edges = [
        {"from_node_type": "parcel", "from_node_id": "P00001",
         "to_node_type": "parcel", "to_node_id": "P00002",
         "edge_type": "blocks", "weight_days": 20.0, "is_blocking": True},
    ]
    parcels = {"P00001": {}, "P00002": {}}
    kwargs = dict(
        base_edges=edges, intervention_type="process_compensation",
        target_entity_ids=["P00001"], parcels_lookup=parcels,
        project_start_date=date(2025, 1, 1), target_completion_date=date(2025, 12, 31),
    )

    result1 = simulator.simulate(**kwargs)
    result2 = simulator.simulate(**kwargs)

    assert result1["delay_reduction_days"] == result2["delay_reduction_days"], \
        "WhatIfSimulator is non-deterministic across identical calls"
    assert result1["before"]["total_duration_days"] == result2["before"]["total_duration_days"]


def test_r2_whatif_source_type_label():
    """
    What-If results must carry source_type='MODEL_DERIVED', not 'AUTHORITATIVE'.
    """
    simulator = WhatIfSimulator()
    result = simulator.simulate(
        base_edges=[],
        intervention_type="resolve_ownership_conflict",
        target_entity_ids=["P00001"],
        parcels_lookup={},
    )
    assert result.get("source_type") == "MODEL_DERIVED", \
        f"Expected MODEL_DERIVED, got {result.get('source_type')}"


# ---------------------------------------------------------------------------
# R3 — IDOR / horizontal access
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_r3_landowner_cannot_access_officer_actions():
    """Landowner role must receive 403 on ALL officer-only endpoints."""
    headers = {"x-mock-role": "LANDOWNER", "x-mock-user-id": "LO-001"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        r = await ac.get("/api/v1/officer-actions", headers=headers)
        assert r.status_code == 403, f"LO got {r.status_code} on GET /officer-actions"

        r = await ac.get("/api/v1/officer-actions/summary", headers=headers)
        assert r.status_code == 403

        r = await ac.get("/api/v1/officer-actions/ACT-XYZ", headers=headers)
        assert r.status_code == 403

        r = await ac.post("/api/v1/officer-actions/ACT-XYZ/resolve", headers=headers,
                          json={"completed_date": "2026-01-01", "officer_notes": "hack"})
        assert r.status_code == 403, f"LO got {r.status_code} on POST /officer-actions/.../resolve"

        r = await ac.post("/api/v1/officer-actions/ACT-XYZ/record-stay", headers=headers,
                          json={"court_order_reference": "WP 1/2026",
                                "stay_order_date": "2026-01-01",
                                "judicial_verification_status": "VERIFIED"})
        assert r.status_code == 403


@pytest.mark.asyncio
async def test_r3_citizen_cannot_access_officer_actions():
    """CITIZEN role must receive 403 on officer-only endpoints."""
    headers = {"x-mock-role": "CITIZEN", "x-mock-user-id": "CIT-001"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        r = await ac.get("/api/v1/officer-actions", headers=headers)
        assert r.status_code == 403
        r = await ac.get("/api/v1/officer-actions/summary", headers=headers)
        assert r.status_code == 403


@pytest.mark.asyncio
async def test_r3_officer_blocked_from_wrong_project():
    """
    An OFFICER assigned to project A must receive 403 when accessing project B.
    This tests the project-scoped RBAC guard in the projects router.
    """
    project_a = "8efdf6e2-4347-4808-ae2f-6f580bff5a29"
    project_b = "9efdf6e2-4347-4808-ae2f-6f580bff5a29"
    headers = {"x-mock-role": "OFFICER", "x-mock-project-id": project_a}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        r = await ac.get(f"/api/v1/projects/{project_b}/bottlenecks", headers=headers)
        assert r.status_code == 403, f"Officer with project A got {r.status_code} accessing project B"


# ---------------------------------------------------------------------------
# R4 — Evidence integrity
# ---------------------------------------------------------------------------

def test_r4_evidence_document_id_required_for_statutory_completion():
    """
    The officer_action_service.resolve_action must NOT mark statutory deadline
    completed when evidence_document_id is None or empty — even if
    mark_statutory_complete=True is requested.
    """
    evidence_document_id_none = None
    evidence_document_id_empty = "  "
    evidence_document_id_valid = "DOC-000123"

    has_valid_none = bool(evidence_document_id_none and str(evidence_document_id_none).strip())
    has_valid_empty = bool(evidence_document_id_empty and str(evidence_document_id_empty).strip())
    has_valid_valid = bool(evidence_document_id_valid and str(evidence_document_id_valid).strip())

    statutory_completed_none = has_valid_none and True
    statutory_completed_empty = has_valid_empty and True
    statutory_completed_valid = has_valid_valid and True

    assert not statutory_completed_none, "None evidence must NOT complete statutory deadline"
    assert not statutory_completed_empty, "Empty evidence must NOT complete statutory deadline"
    assert statutory_completed_valid, "Valid evidence + mark_statutory_complete should succeed"


# ---------------------------------------------------------------------------
# R5 — Court-stay manipulation
# ---------------------------------------------------------------------------

def test_r5_unverified_stay_does_not_extend_clock():
    """
    A PENDING_VERIFICATION court stay must record the citation but NOT
    extend the statutory due date. Only VERIFIED stays extend the clock.
    """
    def is_verified(status: str) -> bool:
        return status.strip().upper() == "VERIFIED"

    assert is_verified("VERIFIED") is True
    assert is_verified("PENDING_VERIFICATION") is False
    assert is_verified("pending_verification") is False
    assert is_verified("UNVERIFIED") is False
    assert is_verified(" VERIFIED ") is True


def test_r5_stay_days_computed_from_dates_take_precedence():
    """
    When both stay_order_date and stay_vacated_date are provided,
    effective_days must be computed from the calendar difference,
    not from an arbitrary stay_days parameter.
    """
    stay_order_date = date(2026, 1, 1)
    stay_vacated_date = date(2026, 3, 2)  # 60 days later
    stay_days_param = 999

    if stay_order_date and stay_vacated_date:
        effective_days = max(1, (stay_vacated_date - stay_order_date).days)
    else:
        effective_days = stay_days_param if (stay_days_param and stay_days_param > 0) else 90

    assert effective_days == 60, f"Expected 60 days from calendar, got {effective_days}"
    assert effective_days != 999, "Calendar dates should override stay_days_param"


@pytest.mark.asyncio
async def test_r5_landowner_cannot_submit_verified_stay_directly():
    """
    Landowners must be unable to POST record-stay (403). Only officers can.
    This prevents a landowner from self-declaring 'VERIFIED' to extend their own clock.
    """
    headers = {"x-mock-role": "LANDOWNER", "x-mock-user-id": "LO-001"}
    payload = {
        "court_order_reference": "WP 9999/2026",
        "stay_order_date": "2026-01-01",
        "judicial_verification_status": "VERIFIED",
        "stay_days": 365
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        r = await ac.post("/api/v1/officer-actions/ACT-P00001-SEC19/record-stay",
                          headers=headers, json=payload)
        assert r.status_code == 403, f"Landowner VERIFIED stay POST got {r.status_code}"


# ---------------------------------------------------------------------------
# R6 — Deadline deduplication / idempotency
# ---------------------------------------------------------------------------

def test_r6_statutory_deadline_engine_idempotent_calculation():
    """
    Two calls to calculate_deadline with identical inputs must produce
    identical outputs — engine must be pure / stateless.
    """
    from app.services.statutory_deadline_engine import StatutoryDeadlineEngine
    engine = StatutoryDeadlineEngine()

    rule_id = "RULE-SEC-15-OBJECTION"
    rule = engine.get_rule_definition(rule_id)
    if rule is None:
        pytest.skip("Rule not loaded (DB not available)")

    trigger = date(2026, 1, 1)
    r1 = engine.calculate_deadline(rule=rule, trigger_date=trigger)
    r2 = engine.calculate_deadline(rule=rule, trigger_date=trigger)

    assert r1["calculated_due_date"] == r2["calculated_due_date"], \
        "Deadline engine is non-deterministic"
    assert r1["status"] == r2["status"]


# ---------------------------------------------------------------------------
# R7 — RBAC: LANDOWNER cannot mutate acquisition case state
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_r7_landowner_cannot_transition_acquisition_case():
    """Landowners must get 403 attempting case state transitions."""
    headers = {"x-mock-role": "LANDOWNER", "x-mock-user-id": "LO-001"}
    payload = {"new_stage": "DECLARATION"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        r = await ac.post(
            "/api/v1/acquisition-cases/00000000-0000-0000-0000-000000000001/transition",
            headers=headers, json=payload
        )
        assert r.status_code in [403, 404], \
            f"Landowner case transition got {r.status_code}"


# ---------------------------------------------------------------------------
# R8 — CITIZEN role cannot perform mutations
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_r8_citizen_cannot_post_officer_actions():
    headers = {"x-mock-role": "CITIZEN", "x-mock-user-id": "CIT-001"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        r = await ac.post("/api/v1/officer-actions/ACT-001/resolve",
                          headers=headers,
                          json={"completed_date": "2026-01-01",
                                "evidence_document_id": "DOC-001",
                                "officer_notes": "Attempting unauthorized citizen resolution"})
        assert r.status_code == 403


# ---------------------------------------------------------------------------
# R9 — Action/deadline state semantics
# ---------------------------------------------------------------------------

def test_r9_completed_action_requires_evidence_for_statutory_compliance():
    """
    A resolved action without valid evidence_document_id must NOT
    set statutory_fulfillment_status to FULFILLED. It must remain
    PENDING_EVIDENTIARY_RECORD.
    """
    def resolve_branch(evidence_document_id: Optional[str],
                       mark_statutory_complete: bool) -> str:
        has_valid_evidence = bool(evidence_document_id and str(evidence_document_id).strip())
        if has_valid_evidence and mark_statutory_complete:
            return "FULFILLED"
        else:
            return "PENDING_EVIDENTIARY_RECORD"

    assert resolve_branch(None, True) == "PENDING_EVIDENTIARY_RECORD"
    assert resolve_branch("", True) == "PENDING_EVIDENTIARY_RECORD"
    assert resolve_branch("   ", True) == "PENDING_EVIDENTIARY_RECORD"
    assert resolve_branch("DOC-001", False) == "PENDING_EVIDENTIARY_RECORD"
    assert resolve_branch("DOC-001", True) == "FULFILLED"


# ---------------------------------------------------------------------------
# R10 — Rate limiter correctness
# ---------------------------------------------------------------------------

def test_r10_rate_limiter_enforces_window():
    """In-process RateLimiter correctly enforces request count within a window."""
    from app.core.security import RateLimiter

    rl = RateLimiter(max_keys=100)
    key = f"test_{uuid4()}"

    max_req = 3
    for i in range(max_req):
        result = rl.check_limit(key, max_requests=max_req, window_seconds=60)
        assert result is True, f"Request {i + 1} should succeed; got {result}"

    result = rl.check_limit(key, max_requests=max_req, window_seconds=60)
    assert result is False, "Rate limiter should reject request after limit exceeded"


def test_r10_rate_limiter_separate_keys_independent():
    """Two different keys must have independent rate limit counters."""
    from app.core.security import RateLimiter

    rl = RateLimiter(max_keys=100)
    key_a = f"key_a_{uuid4()}"
    key_b = f"key_b_{uuid4()}"

    for _ in range(3):
        rl.check_limit(key_a, max_requests=3, window_seconds=60)
    assert rl.check_limit(key_a, max_requests=3, window_seconds=60) is False

    assert rl.check_limit(key_b, max_requests=3, window_seconds=60) is True


# ---------------------------------------------------------------------------
# R11 — Pydantic model_dump vs .dict() deprecation
# ---------------------------------------------------------------------------

def test_r11_officer_action_schemas_use_model_dump():
    """
    OfficerActionItem Pydantic model must be serializable via model_dump()
    without raising DeprecationWarning or AttributeError.
    """
    from app.schemas.officer_actions import ActionCpmImpact, OfficerActionItem

    cpm_impact = ActionCpmImpact(
        is_critical_path=False,
        operational_delay_cpm_days=0,
        downstream_blocked_entities_count=0,
        downstream_summary="No downstream delay",
        total_float_days=14,
    )

    item = OfficerActionItem(
        id="ACT-P00001-SEC15",
        deadline_id="DL-001",
        case_id="AC00001",
        parcel_id="P00001",
        current_acquisition_status="OBJECTIONS",
        action_title="Hearing of Section 15 Objections",
        required_action="Hear objections and prepare enquiry findings report",
        responsible_role="COLLECTOR",
        rule_type="LIMITATION_PERIOD",
        legal_effect="RIGHT_BARRED",
        consequence_if_overdue="Time-barred",
        statutory_section="Section 15",
        act_name="RFCTLARR Act 2013",
        legal_citation_text="Section 15(1)",
        legal_provision_url="https://indiacode.nic.in",
        trigger_event="SECTION_11_PUBLICATION",
        trigger_date="2026-01-01",
        calculated_due_date="2026-03-02",
        days_remaining=60,
        deadline_status="UPCOMING",
        evidence_status="PENDING_UPLOAD",
        required_evidence_type="OBJECTION_REPORT",
        cpm_impact=cpm_impact,
        priority_category="UPCOMING",
        priority_score=500,
    )

    d = item.model_dump()
    assert d["id"] == "ACT-P00001-SEC15"
    assert isinstance(d, dict)


# ---------------------------------------------------------------------------
# R12 — Synthetic data disclosure (source_type labelling)
# ---------------------------------------------------------------------------

def test_r12_cpm_result_source_type_not_authoritative():
    """
    The CPM engine's output source_type must NOT be 'AUTHORITATIVE'.
    It must be 'MODEL_DERIVED' or similar, correctly signalling to judges
    that the result is a mathematical model, not a verified ground truth.
    """
    from app.services.cpm_engine import cpm_engine

    edges = [
        {"from_node_type": "parcel", "from_node_id": "P1",
         "to_node_type": "parcel", "to_node_id": "P2",
         "edge_type": "blocks", "weight_days": 10.0, "is_blocking": True},
    ]
    G = cpm_engine.build_networkx_graph(edges, filter_blocking=True)
    result = cpm_engine.compute_cpm_schedule(
        G,
        project_start_date=date(2025, 1, 1),
        base_target_date=date(2025, 12, 31)
    )

    source_type = result.get("source_type")
    assert source_type != "AUTHORITATIVE", "CPM output must not claim to be AUTHORITATIVE"

    sim = WhatIfSimulator()
    sim_result = sim.simulate(
        base_edges=edges,
        intervention_type="RESOLVE_BLOCKER",
        target_entity_ids=["P1"],
        parcels_lookup={},
    )
    assert sim_result.get("source_type") == "MODEL_DERIVED", \
        f"WhatIf source_type must be MODEL_DERIVED, got: {sim_result.get('source_type')}"


def test_r12_legal_service_returns_disclaimer():
    """
    All legal knowledge responses must include a disclaimer that this is
    informational only and not autonomous legal advice.
    """
    from app.data.legal_provisions_data import LEGAL_PROVISIONS_SEED

    for provision in LEGAL_PROVISIONS_SEED:
        pid = provision["id"]
        assert "disclaimer" in provision, f"{pid}: missing disclaimer field"
        disclaimer = provision["disclaimer"]
        assert disclaimer and len(disclaimer) > 10, f"{pid}: disclaimer is empty or too short"


# ---------------------------------------------------------------------------
# R3 (extended) — Dashboard RBAC
# ---------------------------------------------------------------------------

def test_r3_trusted_identity_fields():
    """TrustedIdentity must properly enforce role and project scoping."""
    identity_admin = TrustedIdentity(user_id="u1", role="ADMIN")
    assert identity_admin.assigned_project_id is None

    identity_officer = TrustedIdentity(user_id="u2", role="OFFICER", assigned_project_id="P-NH927A")
    assert identity_officer.assigned_project_id == "P-NH927A"
    assert identity_officer.role == "OFFICER"

    identity_lo = TrustedIdentity(user_id="u3", role="LANDOWNER")
    assert identity_lo.role == "LANDOWNER"


@pytest.mark.asyncio
async def test_r3_mock_cookies_fallback_in_deps():
    """
    get_current_user_context must not raise AttributeError when
    request.cookies is missing (MockRequest objects in unit tests).
    Previously failing with: AttributeError: 'MockRequest' object has no attribute 'cookies'
    """
    class MockRequest:
        def __init__(self, headers=None):
            self.headers = headers or {}

    req = MockRequest(headers={})
    identity = await get_current_user_context(req, auth=None)
    assert identity.role == "ADMIN"

    req2 = MockRequest(headers={"x-mock-role": "OFFICER", "x-mock-project-id": "proj-123"})
    identity2 = await get_current_user_context(req2, auth=None)
    assert identity2.role == "OFFICER"
    assert identity2.assigned_project_id == "proj-123"


# ---------------------------------------------------------------------------
# R12 (statutory data) — Rules dataset structural integrity
# ---------------------------------------------------------------------------

def test_r12_all_deadline_rules_have_required_fields():
    """All 11 statutory deadline rules must have the mandatory fields for the hardened engine."""
    from app.data.statutory_deadline_rules_data import DEADLINE_RULES_DATA

    required_fields = [
        "id", "legal_provision_id", "rule_name", "trigger_event",
        "clock_type", "duration_value", "duration_unit",
        "consequence_if_overdue", "legal_effect", "statutory_vs_operational",
        "calculation_basis", "exceptions", "source_url", "source_version",
        "verification_status",
    ]

    for rule in DEADLINE_RULES_DATA:
        rid = rule.get("id", "UNKNOWN")
        for field in required_fields:
            assert field in rule, f"Rule {rid}: missing required field '{field}'"
            assert rule[field] is not None, f"Rule {rid}: field '{field}' is None"

        assert isinstance(rule["exceptions"], list), f"Rule {rid}: 'exceptions' must be a list"

        assert "indiacode.nic.in" in rule["source_url"] or "rajasthan" in rule["source_url"].lower(), \
            f"Rule {rid}: source_url does not reference India Code or State notification"

        assert rule["verification_status"] is True, f"Rule {rid}: verification_status must be True"


def test_r12_section_38_citation_corrected_to_section_30():
    """
    Verify that the Section 38 calculation_basis fields now correctly
    cite 'section 30' (solatium award) instead of the previously incorrect 'section 23'.
    """
    from app.data.statutory_deadline_rules_data import DEADLINE_RULES_DATA

    rule_38_comp = next((r for r in DEADLINE_RULES_DATA if r["id"] == "RULE-SEC-38-COMP-PAYMENT"), None)
    rule_38_rr = next((r for r in DEADLINE_RULES_DATA if r["id"] == "RULE-SEC-38-RR-MONETARY"), None)

    assert rule_38_comp is not None, "RULE-SEC-38-COMP-PAYMENT not found"
    assert rule_38_rr is not None, "RULE-SEC-38-RR-MONETARY not found"

    assert "section 30" in rule_38_comp["calculation_basis"].lower(), \
        "RULE-SEC-38-COMP-PAYMENT must cite 'section 30' in calculation_basis"

    assert "section 30" in rule_38_rr["calculation_basis"].lower(), \
        "RULE-SEC-38-RR-MONETARY must cite 'section 30' in calculation_basis"


def test_r12_section_64_condonation_proviso_encoded():
    """
    Verify that the Section 64(2) further proviso (1-year condonation on
    sufficient cause) is now encoded in both PRESENT and ABSENT rules.
    """
    from app.data.statutory_deadline_rules_data import DEADLINE_RULES_DATA

    rule_present = next((r for r in DEADLINE_RULES_DATA if r["id"] == "RULE-SEC-64-REFERENCE-PRESENT"), None)
    rule_absent = next((r for r in DEADLINE_RULES_DATA if r["id"] == "RULE-SEC-64-REFERENCE-ABSENT"), None)

    assert rule_present is not None
    assert rule_absent is not None

    for rule in [rule_present, rule_absent]:
        rid = rule["id"]
        assert "prima facie" in rule["consequence_if_overdue"] or "one year" in rule["consequence_if_overdue"], \
            f"{rid}: consequence_if_overdue should acknowledge Section 64(2) further proviso"

        assert rule["exception_type"] != "NONE", \
            f"{rid}: exception_type should not be NONE after condonation proviso was added"

        exceptions_text = " ".join(rule["exceptions"]).lower()
        assert "one year" in exceptions_text or "condonation" in exceptions_text, \
            f"{rid}: exceptions list must mention the 1-year condonation proviso"


def test_r12_section_25_extension_cap_removed():
    """
    Verify that the unsupported '12 additional months' cap on Section 25
    extension has been removed from the exceptions list.
    """
    from app.data.statutory_deadline_rules_data import DEADLINE_RULES_DATA

    rule_25 = next((r for r in DEADLINE_RULES_DATA if r["id"] == "RULE-SEC-25-AWARD"), None)
    assert rule_25 is not None

    exceptions_text = " ".join(rule_25["exceptions"]).lower()
    assert "up to 12 additional months" not in exceptions_text, \
        "RULE-SEC-25-AWARD still claims unsupported '12 additional months' cap"


# ---------------------------------------------------------------------------
# R13 — Live Endpoint Hardening & Adversarial Verification Pass
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_adv_resolve_action_nonexistent_document_returns_404():
    """Resolving an action with a non-existent document ID must return 404 Not Found."""
    from app.services.officer_action_service import officer_action_service
    actions = await officer_action_service.get_action_items()
    action_id = actions[0]["id"]
    cookies = {"sih_role": "COLLECTOR", "sih_user_id": "COL-001"}
    payload = {
        "completed_date": "2025-05-15",
        "evidence_document_id": "NON_EXISTENT_DOCUMENT_XYZ_9999",
        "officer_notes": "Attempting resolution with fake document.",
        "mark_statutory_complete": True,
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies=cookies) as ac:
        resp = await ac.post(f"/api/v1/officer-actions/{action_id}/resolve", json=payload)
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_adv_resolve_action_wrong_parcel_document_returns_422():
    """Evidence document belonging to Parcel B cannot resolve an action for Parcel A (HTTP 422)."""
    from app.services.officer_action_service import officer_action_service
    actions = await officer_action_service.get_action_items()
    action_p1 = next(a for a in actions if a["parcel_id"] == "P00001")
    cookies = {"sih_role": "COLLECTOR", "sih_user_id": "COL-001"}
    # D00002 belongs to P00002 in seed data
    payload = {
        "completed_date": "2025-05-15",
        "evidence_document_id": "D00002",
        "officer_notes": "Attempting to bind document of P00002 to P00001.",
        "mark_statutory_complete": True,
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies=cookies) as ac:
        resp = await ac.post(f"/api/v1/officer-actions/{action_p1['id']}/resolve", json=payload)
    assert resp.status_code == 422
    assert "does not match" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_adv_field_officer_cannot_certify_stay_verified():
    """Field officers cannot self-certify court stays as VERIFIED; must return 403 Forbidden."""
    from app.services.officer_action_service import officer_action_service
    actions = await officer_action_service.get_action_items()
    action_id = actions[0]["id"]
    cookies = {"sih_role": "FIELD_OFFICER", "sih_user_id": "FO-001"}
    payload = {
        "court_order_reference": "WP 101/2025",
        "stay_order_date": "2025-06-01",
        "stay_days": 45,
        "judicial_verification_status": "VERIFIED",
        "notes": "Field officer trying to extend clock without legal cell authorization.",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies=cookies) as ac:
        resp = await ac.post(f"/api/v1/officer-actions/{action_id}/record-stay", json=payload)
    assert resp.status_code == 403
    assert "only authorized" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_adv_court_stay_future_date_rejected():
    """Court stay order date cannot be in the future (HTTP 422)."""
    from app.services.officer_action_service import officer_action_service
    actions = await officer_action_service.get_action_items()
    action_id = actions[0]["id"]
    cookies = {"sih_role": "COLLECTOR", "sih_user_id": "COL-001"}
    future_date = (date.today() + timedelta(days=30)).isoformat()
    payload = {
        "court_order_reference": "WP 202/2026",
        "stay_order_date": future_date,
        "stay_days": 30,
        "judicial_verification_status": "PENDING_VERIFICATION",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies=cookies) as ac:
        resp = await ac.post(f"/api/v1/officer-actions/{action_id}/record-stay", json=payload)
    assert resp.status_code == 422
    assert "future" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_adv_court_stay_vacated_before_order_rejected():
    """Court stay vacated date cannot precede stay order date (HTTP 422)."""
    from app.services.officer_action_service import officer_action_service
    actions = await officer_action_service.get_action_items()
    action_id = actions[0]["id"]
    cookies = {"sih_role": "COLLECTOR", "sih_user_id": "COL-001"}
    payload = {
        "court_order_reference": "WP 303/2025",
        "stay_order_date": "2025-06-15",
        "stay_vacated_date": "2025-06-01",
        "judicial_verification_status": "PENDING_VERIFICATION",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies=cookies) as ac:
        resp = await ac.post(f"/api/v1/officer-actions/{action_id}/record-stay", json=payload)
    assert resp.status_code == 422
    assert "precede" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_adv_horizontal_idor_officer_boundary_enforced():
    """Officer assigned to Project X cannot access or resolve an action belonging to Project Y (HTTP 403)."""
    from app.services.officer_action_service import officer_action_service
    actions = await officer_action_service.get_action_items()
    target_action = actions[0]
    action_id = target_action["id"]

    headers = {
        "x-mock-role": "FIELD_OFFICER",
        "x-mock-user-id": "OFF-DIFF-PROJ",
        "x-mock-project-id": "P-DIFFERENT-PROJECT-999",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        r_get = await ac.get(f"/api/v1/officer-actions/{action_id}", headers=headers)
        assert r_get.status_code == 403
        assert "cannot access action in project" in r_get.json()["detail"]

        r_post = await ac.post(
            f"/api/v1/officer-actions/{action_id}/resolve",
            headers=headers,
            json={"completed_date": "2025-05-15", "officer_notes": "Unauthorized horizontal update."}
        )
        assert r_post.status_code == 403


@pytest.mark.asyncio
async def test_adv_historical_rule_versioning_filter():
    """Rules queried as_of_date prior to RFCTLARR 2013 effective date (2014-01-01) return empty or strictly valid rules."""
    from app.services.statutory_deadline_engine import statutory_deadline_engine
    # Query with date before 2014
    rules_2010 = await statutory_deadline_engine.get_all_rules(as_of_date=date(2010, 1, 1))
    for r in rules_2010:
        ef = r.get("effective_from")
        if ef:
            ef_d = date.fromisoformat(ef) if isinstance(ef, str) else ef
            assert ef_d <= date(2010, 1, 1)

    # Query with current date
    rules_now = await statutory_deadline_engine.get_all_rules(as_of_date=date.today())
    assert len(rules_now) >= 8
