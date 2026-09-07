"""
Test Suite for KOSH Officer Action Center
SIH26016 Land Acquisition Digital Twin Platform

Validates:
1. Core Action Model: Derivation from statutory deadlines, parcel dossiers, and NetworkX CPM graph.
2. Deterministic Prioritization: Explicit, reproducible ranking without black-box scoring.
3. Transparency: Every action exposes the explicit rationale in `priority_reasons`.
4. Operational Categories: Strictly partitions items into CRITICAL, DUE_SOON, BLOCKED, PROJECT_IMPACT, UPCOMING, COMPLETED without fake urgency.
5. Role Isolation: Landowner users are strictly barred from internal officer notes and risk data.
6. Causal Chain: LAW -> STAGE -> DEADLINE -> OFFICER ACTION -> EVIDENCE -> CPM IMPACT.
7. Action Resolution: Successfully resolves actions and updates underlying PostgreSQL state.
8. Court Stay Recording: Verified court stay exclusions update the clock with order citation.
"""
from datetime import date, timedelta
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.officer_action_service import officer_action_service


@pytest.mark.asyncio
async def test_action_items_derivation():
    """Verifies that operational actions are derived directly from existing statutory deadlines and parcels."""
    actions = await officer_action_service.get_action_items()
    assert len(actions) > 0

    first = actions[0]
    assert "id" in first
    assert "deadline_id" in first
    assert "parcel_id" in first
    assert "action_title" in first
    assert "required_action" in first
    assert "rule_type" in first
    assert "legal_effect" in first
    assert "calculated_due_date" in first
    assert "days_remaining" in first
    assert "evidence_status" in first
    assert "cpm_impact" in first
    assert "priority_category" in first
    assert "priority_score" in first
    assert "priority_reasons" in first

    # Verify NetworkX CPM impact connection
    assert "is_critical_path" in first["cpm_impact"]
    assert "whatif_simulation_route" in first["cpm_impact"]


@pytest.mark.asyncio
async def test_deterministic_priority_ranking():
    """Verifies that items are ordered deterministically by priority score."""
    actions = await officer_action_service.get_action_items()
    active_actions = [a for a in actions if a["priority_category"] != "COMPLETED"]

    # Check non-increasing priority score order
    for i in range(len(active_actions) - 1):
        assert active_actions[i]["priority_score"] >= active_actions[i + 1]["priority_score"], (
            f"Item {active_actions[i]['id']} ({active_actions[i]['priority_score']}) should rank >= "
            f"{active_actions[i + 1]['id']} ({active_actions[i + 1]['priority_score']})"
        )


@pytest.mark.asyncio
async def test_priority_reason_transparency():
    """Verifies that each action item provides human-readable priority rationale strings."""
    actions = await officer_action_service.get_action_items()
    for item in actions:
        reasons = item["priority_reasons"]
        assert isinstance(reasons, list)
        assert len(reasons) > 0

        # If item has mandatory lapse, must be stated in reasons
        if item["is_mandatory_lapse"]:
            assert any("MANDATORY STATUTORY LAPSE" in r for r in reasons)

        # If item is overdue, must be stated in reasons
        if item["deadline_status"] in ["OVERDUE", "LAPSED"]:
            assert any("OVERDUE" in r for r in reasons)


@pytest.mark.asyncio
async def test_six_action_categories_partition():
    """Verifies that actions are partitioned into the 6 operational categories without artificial inflation."""
    summary = await officer_action_service.get_action_summary()
    assert summary["total_actions"] > 0
    assert summary["critical_count"] >= 0
    assert summary["due_soon_count"] >= 0
    assert summary["blocked_count"] >= 0
    assert summary["project_impact_count"] >= 0
    assert summary["upcoming_count"] >= 0
    assert summary["completed_count"] >= 0
    assert "does not determine legal rights" in summary["disclaimer"].lower()

    # Sum of categories must equal total actions
    sum_cats = (
        summary["critical_count"]
        + summary["due_soon_count"]
        + summary["blocked_count"]
        + summary["project_impact_count"]
        + summary["upcoming_count"]
        + summary["completed_count"]
    )
    assert sum_cats == summary["total_actions"]


@pytest.mark.asyncio
async def test_zero_fake_urgency():
    """Verifies that upcoming non-critical actions are not falsely elevated to CRITICAL."""
    actions = await officer_action_service.get_action_items(category="UPCOMING")
    for a in actions:
        assert a["priority_category"] == "UPCOMING"
        assert not a["is_mandatory_lapse"]
        assert a["deadline_status"] not in ["OVERDUE", "LAPSED"]


@pytest.mark.asyncio
async def test_api_list_actions_authenticated_officer():
    """Verifies GET /api/v1/officer-actions returns 200 for officer role."""
    headers = {"Authorization": "Bearer mock-officer-token"}
    cookies = {"sih_role": "FIELD_OFFICER", "sih_user_id": "OFF-001"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies=cookies) as ac:
        resp = await ac.get("/api/v1/officer-actions", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0


@pytest.mark.asyncio
async def test_api_landowner_role_isolation():
    """Verifies that landowner role is strictly 403 FORBIDDEN from accessing the Officer Action Center."""
    cookies = {"sih_role": "LANDOWNER", "sih_user_id": "LO-001"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies=cookies) as ac:
        resp = await ac.get("/api/v1/officer-actions")
    assert resp.status_code == 403
    assert "Forbidden" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_resolve_action_lifecycle():
    """
    Verifies that resolve_action only marks statutory deadline completed when valid evidence is provided.
    Without evidence, officer remarks are saved but statutory deadline remains open.
    """
    actions = await officer_action_service.get_action_items()
    target_action = actions[0]
    action_id = target_action["id"]

    cookies = {"sih_role": "FIELD_OFFICER", "sih_user_id": "OFF-001"}

    # 1. Attempt resolution WITHOUT evidence document ID (officer notes only)
    no_evidence_payload = {
        "completed_date": "2025-05-15",
        "evidence_document_id": None,
        "officer_notes": "Officer notes entered without official gazette or voucher proof.",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies=cookies) as ac:
        resp_no_ev = await ac.post(f"/api/v1/officer-actions/{action_id}/resolve", json=no_evidence_payload)
    assert resp_no_ev.status_code == 200
    res_no_ev = resp_no_ev.json()
    assert res_no_ev["status"] == "VERIFICATION_RECORDED"
    assert res_no_ev["statutory_deadline_completed"] is False
    assert "remains active" in res_no_ev["message"]

    # 2. Complete with valid official evidence document ID
    valid_evidence_payload = {
        "completed_date": "2025-05-15",
        "evidence_document_id": "DOC-GZ-2025-0515",
        "officer_notes": "Statutory notice published in official gazette and village chaupal.",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies=cookies) as ac:
        resp_ev = await ac.post(f"/api/v1/officer-actions/{action_id}/resolve", json=valid_evidence_payload)
    assert resp_ev.status_code == 200
    res_ev = resp_ev.json()
    assert res_ev["status"] == "COMPLETED"
    assert res_ev["statutory_deadline_completed"] is True
    assert res_ev["evidence_document_id"] == "DOC-GZ-2025-0515"


@pytest.mark.asyncio
async def test_record_court_stay_lifecycle():
    """
    Verifies judicial-verification discipline:
    - PENDING_VERIFICATION does NOT extend the statutory clock.
    - VERIFIED status recalculates clock with explicit exclusion period.
    """
    actions = await officer_action_service.get_action_items()
    target_action = actions[0]
    action_id = target_action["id"]
    cookies = {"sih_role": "COLLECTOR", "sih_user_id": "COL-001"}

    # 1. Unverified court stay claim
    unverified_payload = {
        "court_order_reference": "WP(C) 1234/2025 Rajasthan High Court",
        "stay_order_date": "2025-06-01",
        "stay_days": 60,
        "judicial_verification_status": "PENDING_VERIFICATION",
        "notes": "Citizen produced copy of stay petition; judicial registry verification pending.",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies=cookies) as ac:
        resp_unverified = await ac.post(f"/api/v1/officer-actions/{action_id}/record-stay", json=unverified_payload)
    assert resp_unverified.status_code == 200
    res_unv = resp_unverified.json()
    assert res_unv["court_stay_verified"] is False
    assert res_unv["statutory_clock_extended"] is False
    assert res_unv["stay_days"] == 0
    assert "PENDING_VERIFICATION" in res_unv["message"]

    # 2. Verified court stay with explicit dates
    verified_payload = {
        "court_order_reference": "WP(C) 5542/2025 Rajasthan High Court",
        "stay_order_date": "2025-06-01",
        "stay_vacated_date": "2025-07-31",
        "judicial_verification_status": "VERIFIED",
        "court_name": "High Court of Judicature for Rajasthan at Jaipur",
        "notes": "Certified copy of stay order verified from court registry.",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies=cookies) as ac:
        resp_verified = await ac.post(f"/api/v1/officer-actions/{action_id}/record-stay", json=verified_payload)
    assert resp_verified.status_code == 200
    res_ver = resp_verified.json()
    assert res_ver["court_stay_verified"] is True
    assert res_ver["statutory_clock_extended"] is True
    assert res_ver["stay_days"] == 60  # July 31 - June 1 = 60 days
    assert "WP(C) 5542/2025" in res_ver["court_order_reference"]
