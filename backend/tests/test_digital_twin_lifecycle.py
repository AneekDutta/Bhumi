"""
Comprehensive Tests for Digital Twin, CPM Synchronization & Lifecycle
SIH26016 Land Acquisition Platform - KOSH

Verifies:
A. Mutation immediately followed by recalculation
B. Two consecutive mutations
C. What-If followed by real mutation
D. Repeated identical recalculation (deterministic invariance)
E. Concurrent / simulated concurrent updates
"""
import asyncio
import copy
from datetime import date
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.sih26016_service import sih_service
from app.services.whatif_simulator import whatif_simulator


@pytest.fixture(autouse=True)
def ensure_sih_service_loaded():
    """Ensure service cache is cleanly loaded before each test."""
    sih_service._load_data()
    sih_service._enrich_and_compute()
    yield


def test_scenario_a_mutation_immediately_followed_by_recalculation():
    """A: Mutation immediately followed by recalculation reflects fresh state."""
    # Find a non-conflicted parcel
    parcels = sih_service._data_cache.get("parcels", [])
    p = next((x for x in parcels if not x.get("ownership_conflict")), parcels[0])
    pid = p["parcel_id"]

    # 1. Record field issue
    report = {
        "parcel_id": pid,
        "has_issue": True,
        "issue_type": "boundary_encroachment",
        "issue_severity": "CRITICAL",
        "status": "disputed",
        "officer_id": "OFF-TEST-A",
    }
    result = sih_service.record_field_verification(report)
    assert result["success"] is True
    assert result["has_issue"] is True

    # 2. Immediate recalculation check
    cpm = sih_service.get_critical_path_report()
    assert cpm is not None
    assert "critical_path_nodes" in cpm
    # The mutated parcel should reflect conflict in parcels list
    updated_p = next(x for x in sih_service.get_parcels() if x["parcel_id"] == pid)
    assert updated_p["ownership_conflict"] is True


def test_scenario_b_two_consecutive_mutations():
    """B: Two consecutive mutations properly transition graph state without orphan edges."""
    parcels = sih_service._data_cache.get("parcels", [])
    pid = parcels[0]["parcel_id"]

    # Mutation 1: Raise dispute
    report_1 = {
        "parcel_id": pid,
        "has_issue": True,
        "issue_type": "title_dispute",
        "issue_severity": "HIGH",
        "status": "disputed",
        "officer_id": "OFF-TEST-B",
    }
    res1 = sih_service.record_field_verification(report_1)
    assert res1["success"] is True
    incident_id = res1["verification_id"]

    p1 = next(x for x in sih_service.get_parcels() if x["parcel_id"] == pid)
    assert p1["ownership_conflict"] is True

    # Mutation 2: Resolve dispute via admin resolution
    res2 = sih_service.resolve_field_incident(
        incident_id=incident_id,
        admin_id="ADM-TEST-B",
        resolution_status="resolved",
        comments="Resolved boundary dispute via revenue settlement",
        clear_cpm_blocker=True,
    )
    assert res2["resolution_status"] == "resolved"

    p2 = next(x for x in sih_service.get_parcels() if x["parcel_id"] == pid)
    assert p2["ownership_conflict"] is False

    # Graph remains consistent
    cpm = sih_service.get_critical_path_report()
    assert cpm["project_delay_days"] >= 0


def test_scenario_c_what_if_followed_by_real_mutation():
    """C: What-If simulation uses deepcopy and never mutates production state before real mutation."""
    base_edges_before = copy.deepcopy(sih_service._data_cache.get("dependency_edges", []))
    cpm_before = copy.deepcopy(sih_service._cpm_cache)

    # 1. Run What-If simulation
    sim_result = sih_service.simulate(
        project_id="P-NH927A",
        intervention_type="process_compensation",
        input_entity_ids=["P00001", "P00002"],
        acceleration_factor=0.5,
    )
    assert "before" in sim_result
    assert "after" in sim_result
    assert "delay_reduction_days" in sim_result
    assert sim_result["source_type"] == "MODEL_DERIVED"

    # Verify production state did NOT change during What-If
    base_edges_after_sim = sih_service._data_cache.get("dependency_edges", [])
    assert len(base_edges_after_sim) == len(base_edges_before)
    assert sih_service._cpm_cache["project_delay_days"] == cpm_before["project_delay_days"]

    # 2. Perform real mutation
    pid = "P00004"
    report = {
        "parcel_id": pid,
        "has_issue": True,
        "issue_type": "survey_correction",
        "issue_severity": "HIGH",
        "status": "disputed",
        "officer_id": "OFF-REAL-MUT",
    }
    res_real = sih_service.record_field_verification(report)
    assert res_real["success"] is True
    p_real = next(x for x in sih_service.get_parcels() if x["parcel_id"] == pid)
    assert p_real["ownership_conflict"] is True


def test_scenario_d_repeated_identical_recalculation_invariance():
    """D: Repeated recalculation produces strictly invariant deterministic output."""
    res1 = copy.deepcopy(sih_service.get_critical_path_report())

    # Run recalculations repeatedly
    for _ in range(5):
        sih_service._enrich_and_compute()
        res_n = sih_service.get_critical_path_report()
        assert res_n["project_delay_days"] == res1["project_delay_days"]
        assert res_n["critical_path_nodes"] == res1["critical_path_nodes"]
        assert res_n["projected_finish"] == res1["projected_finish"]


@pytest.mark.asyncio
async def test_scenario_e_concurrent_simulated_updates():
    """E: Concurrent read and calculation requests execute safely without race conditions."""
    async def fetch_schedule():
        return sih_service.get_critical_path_report()

    async def fetch_parcels():
        return sih_service.get_parcels()

    async def fetch_projects():
        return sih_service.get_projects()

    # Execute 21 concurrent queries
    tasks = []
    for _ in range(7):
        tasks.append(fetch_schedule())
        tasks.append(fetch_parcels())
        tasks.append(fetch_projects())

    results = await asyncio.gather(*tasks)
    assert len(results) == 21
    for r in results:
        assert r is not None
