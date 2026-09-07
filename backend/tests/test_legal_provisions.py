"""
Test Suite for Legal & Rights Knowledge Center
RFCTLARR Act 2013 & Rajasthan Rules 2016 Statutory Provisions,
17 Officer Stages, 6 Landowner Areas, Parcel Context, and Complaint Legal Mapping.
"""
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.legal_service import LEGAL_DISCLAIMER_TEXT, legal_service


@pytest.mark.asyncio
async def test_get_legal_disclaimer():
    """Verifies that the legal disclaimer endpoint returns standard statutory text."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/legal/disclaimer")
    assert response.status_code == 200
    data = response.json()
    assert "disclaimer" in data
    assert "does not provide legal advice" in data["disclaimer"]
    assert "RFCTLARR" in data["disclaimer"] or "statutory" in data["disclaimer"]


@pytest.mark.asyncio
async def test_list_all_provisions():
    """Verifies that all seeded statutory provisions are returned."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/legal/provisions")
    assert response.status_code == 200
    provisions = response.json()
    assert len(provisions) >= 15
    # Verify core sections are present
    section_numbers = [p["section_number"] for p in provisions]
    assert "11" in section_numbers
    assert "15" in section_numbers
    assert "19" in section_numbers
    assert "26" in section_numbers
    assert "30" in section_numbers
    assert "38" in section_numbers
    assert "64" in section_numbers


@pytest.mark.asyncio
async def test_role_filtering():
    """Verifies that provisions can be filtered by role (LANDOWNER vs FIELD_OFFICER)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        lo_resp = await ac.get("/api/v1/legal/provisions?role=LANDOWNER")
        fo_resp = await ac.get("/api/v1/legal/provisions?role=FIELD_OFFICER")

    assert lo_resp.status_code == 200
    assert fo_resp.status_code == 200

    lo_data = lo_resp.json()
    fo_data = fo_resp.json()

    for p in lo_data:
        assert p["applies_to"] in ["LANDOWNER", "BOTH"]
        assert p["landowner_guidance"] is not None

    for p in fo_data:
        assert p["applies_to"] in ["FIELD_OFFICER", "BOTH"]
        assert p["officer_guidance"] is not None


@pytest.mark.asyncio
async def test_jurisdiction_filtering():
    """Verifies filtering by jurisdiction (CENTRAL vs RAJASTHAN)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        central_resp = await ac.get("/api/v1/legal/provisions?jurisdiction=CENTRAL")
        raj_resp = await ac.get("/api/v1/legal/provisions?jurisdiction=RAJASTHAN")

    assert central_resp.status_code == 200
    assert raj_resp.status_code == 200

    central_data = central_resp.json()
    raj_data = raj_resp.json()

    assert len(central_data) >= 14
    assert all(p["jurisdiction"] == "CENTRAL" for p in central_data)

    assert len(raj_data) >= 1
    assert any("Rajasthan" in p["act_name"] or p["jurisdiction"] == "RAJASTHAN" for p in raj_data)


@pytest.mark.asyncio
async def test_search_provisions():
    """Verifies full-text search across provisions."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/legal/provisions?search=solatium")

    assert resp.status_code == 200
    results = resp.json()
    assert len(results) >= 1
    assert any("30" in p["section_number"] for p in results)


@pytest.mark.asyncio
async def test_get_provision_by_id():
    """Verifies retrieving a specific statutory provision by ID."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/legal/provisions/RFCTLARR-2013-SEC-30-1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == "RFCTLARR-2013-SEC-30-1"
        assert data["section_number"] == "30"
        assert "solatium" in data["title"].lower()
        assert "100%" in data["plain_language_summary"] or "one hundred per cent" in data["plain_language_summary"].lower()

        # Non-existent provision
        not_found_resp = await ac.get("/api/v1/legal/provisions/NON-EXISTENT-ID")
        assert not_found_resp.status_code == 404


@pytest.mark.asyncio
async def test_officer_procedural_guide_17_stages():
    """Verifies that the officer procedural guide has 17 sequential stages."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/legal/officer-guide")

    assert resp.status_code == 200
    stages = resp.json()
    assert len(stages) == 17

    # Verify sequential numbers 1 to 17
    stage_numbers = [s["stage_number"] for s in stages]
    assert stage_numbers == list(range(1, 18))

    # Verify key stage attributes
    stage_keys = [s["stage_key"] for s in stages]
    assert "preliminary_notification" in stage_keys
    assert "objections" in stage_keys
    assert "declaration" in stage_keys
    assert "valuation" in stage_keys
    assert "award" in stage_keys
    assert "compensation_payment" in stage_keys
    assert "possession" in stage_keys
    assert "dispute_reference" in stage_keys

    # Check stage 7 (declaration) has statutory lapse warning
    decl_stage = next(s for s in stages if s["stage_key"] == "declaration")
    assert "12 months" in decl_stage["statutory_clock"].lower()
    assert "lapse" in decl_stage["risk_if_overdue"].lower()


@pytest.mark.asyncio
async def test_landowner_guide_6_sections():
    """Verifies that the landowner rights guide contains 6 practical areas."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/legal/landowner-guide")

    assert resp.status_code == 200
    sections = resp.json()
    assert len(sections) == 6

    section_keys = [s["section_key"] for s in sections]
    assert "before_acquisition" in section_keys
    assert "compensation" in section_keys
    assert "objections_disputes" in section_keys
    assert "rehabilitation_resettlement" in section_keys
    assert "possession_completion" in section_keys
    assert "if_you_disagree" in section_keys

    # Verify questions exist in compensation section
    comp_sec = next(s for s in sections if s["section_key"] == "compensation")
    assert len(comp_sec["questions"]) >= 4
    # Check Section 30(3) is explained as 12% additional statutory amount
    q_texts = " ".join([q["question"] + " " + q["answer"] for q in comp_sec["questions"]])
    assert "12%" in q_texts
    assert "Solatium" in q_texts


@pytest.mark.asyncio
async def test_parcel_legal_context():
    """Verifies mapping a parcel state to applicable statutory provisions."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/legal/parcels/P00003")

    assert resp.status_code == 200
    ctx = resp.json()
    assert ctx["parcel_id"] == "P00003"
    assert "acquisition_status" in ctx
    assert "current_stage" in ctx
    assert len(ctx["applicable_provisions"]) >= 2
    assert "disclaimer" in ctx


@pytest.mark.asyncio
async def test_complaint_legal_context():
    """Verifies mapping complaint types to legal rights, officer action, and limitations."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Title dispute
        resp_title = await ac.get("/api/v1/legal/complaints/TITLE_DISPUTE")
        assert resp_title.status_code == 200
        title_ctx = resp_title.json()
        assert "Section 77(2)" in title_ctx["required_officer_action"]
        assert "6 weeks" in title_ctx["statutory_limitation"]

        # Premature possession
        resp_poss = await ac.get("/api/v1/legal/complaints/PHYSICAL_POSSESSION")
        assert resp_poss.status_code == 200
        poss_ctx = resp_poss.json()
        assert "Section 38" in poss_ctx["statutory_limitation"]
        assert "100%" in poss_ctx["required_officer_action"]

        # Compensation delay
        resp_comp = await ac.get("/api/v1/legal/complaints/COMPENSATION_DELAY")
        assert resp_comp.status_code == 200
        comp_ctx = resp_comp.json()
        assert "Section 80" in comp_ctx["required_officer_action"]


@pytest.mark.asyncio
async def test_statutory_traceability_official_sources():
    """Verifies that all provisions reference authentic official legislative sources."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/v1/legal/provisions")

    assert resp.status_code == 200
    provisions = resp.json()

    for p in provisions:
        assert p["source_url"].startswith("http")
        if p["jurisdiction"] == "CENTRAL":
            assert "indiacode.nic.in" in p["source_url"]
            assert "Act No. 30 of 2013" in p["source_document"]
        elif p["jurisdiction"] == "RAJASTHAN":
            assert "rajasthan.gov.in" in p["source_url"]
