"""
Unit and Integration Tests for RFCTLARR Act 2013 Statutory Valuation & Compensation Engine
Tests Section 26-30 rules, Decimal currency precision, calculation trace explainability,
and CPM dependency graph synchronization.
"""
from datetime import date, timedelta
from decimal import Decimal
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.valuation_engine import (
    ValuationEngine,
    ValuationInput,
    valuation_engine,
    MULTIPLIER_SLABS,
    RULE_VERSION,
    SOLATIUM_PERCENTAGE,
    ANNUAL_INTEREST_RATE,
)


@pytest.fixture
def sample_valuation_input():
    return ValuationInput(
        parcel_id="P00003",
        area_sqm=Decimal("2500.00"),
        circle_rate_per_sqm=Decimal("1200.00"),
        market_rate_per_sqm=Decimal("1100.00"),
        land_category="agricultural_irrigated",
        distance_from_urban_km=Decimal("15.0"),
        asset_value=Decimal("250000.00"),
        trees_crops_value=Decimal("75000.00"),
        severance_damage=Decimal("50000.00"),
        other_damages=Decimal("25000.00"),
        notification_date=date(2025, 4, 1),
        award_date=date(2025, 10, 1),
    )


def test_statutory_formulas_precision(sample_valuation_input):
    """Verifies Sections 26-30 statutory math with zero floating-point errors."""
    res = valuation_engine.calculate(sample_valuation_input)

    # 1. Base Market Value (Section 26) = 2,500 sqm * max(1200, 1100) = 3,000,000.00
    expected_base = Decimal("3000000.00")
    assert res.market_value_base == expected_base

    # 2. Multiplier (Section 26(2)): 15 km is in 10-20km slab -> 1.50x
    expected_multiplier = Decimal("1.50")
    assert res.multiplier_factor == expected_multiplier
    expected_adjusted = Decimal("4500000.00")
    assert res.market_value_adjusted == expected_adjusted

    # 3. Attached Assets (Section 29) + Severance (Section 27/28)
    # Assets: 250,000 + 75,000 = 325,000
    # Damages: 50,000 + 25,000 = 75,000
    # Subtotal before solatium = 4,500,000 + 325,000 + 75,000 = 4,900,000.00
    expected_subtotal = Decimal("4900000.00")
    assert res.subtotal_before_solatium == expected_subtotal

    # 4. Solatium (Section 30(1)): 100% of subtotal = 4,900,000.00
    assert res.solatium_amount == expected_subtotal

    # 5. Interest (Section 30(3)): 12% p.a. on base market value (3,000,000) for 183 days
    # 3,000,000 * 0.12 * (183 / 365.25) = 180,369.61
    days = (date(2025, 10, 1) - date(2025, 4, 1)).days
    expected_interest = (expected_base * Decimal("0.12") * (Decimal(days) / Decimal("365.25"))).quantize(Decimal("0.01"))
    assert res.interest_12pct_amount == expected_interest

    # 6. Total Statutory Compensation
    expected_total = expected_subtotal + res.solatium_amount + res.interest_12pct_amount
    assert res.total_compensation == expected_total


def test_multiplier_slabs():
    """Verifies statutory distance multiplier slab lookups."""
    # Urban (0 km) -> 1.00
    assert ValuationEngine.determine_multiplier(Decimal("0.0")) == Decimal("1.00")
    assert ValuationEngine.determine_multiplier(None) == Decimal("1.00")

    # 0 to 10 km -> 1.20
    assert ValuationEngine.determine_multiplier(Decimal("5.0")) == Decimal("1.20")
    assert ValuationEngine.determine_multiplier(Decimal("10.0")) == Decimal("1.20")

    # 10 to 20 km -> 1.50
    assert ValuationEngine.determine_multiplier(Decimal("10.1")) == Decimal("1.50")
    assert ValuationEngine.determine_multiplier(Decimal("20.0")) == Decimal("1.50")

    # 20 to 30 km -> 1.75
    assert ValuationEngine.determine_multiplier(Decimal("25.0")) == Decimal("1.75")
    assert ValuationEngine.determine_multiplier(Decimal("30.0")) == Decimal("1.75")

    # > 30 km -> 2.00
    assert ValuationEngine.determine_multiplier(Decimal("35.0")) == Decimal("2.00")
    assert ValuationEngine.determine_multiplier(Decimal("75.0")) == Decimal("2.00")


def test_invalid_area_raises_error():
    """Asserts that invalid/zero parcel area is rejected."""
    with pytest.raises(ValueError, match="Invalid parcel area"):
        v_in = ValuationInput(parcel_id="P_ERR", area_sqm=Decimal("0.00"))
        valuation_engine.calculate(v_in)

    with pytest.raises(ValueError, match="Invalid parcel area"):
        v_in = ValuationInput(parcel_id="P_ERR", area_sqm=Decimal("-100.00"))
        valuation_engine.calculate(v_in)


def test_calculation_trace_explainability(sample_valuation_input):
    """Verifies explainable audit trace with legal citations and synthetic disclaimer."""
    res = valuation_engine.calculate(sample_valuation_input)
    assert len(res.steps) == 6

    # Verify each step has required explainability elements
    citations = [s.statutory_citation for s in res.steps]
    assert any("Section 26(1)" in c for c in citations)
    assert any("Section 26(2)" in c for c in citations)
    assert any("Sections 27, 28 & 29" in c for c in citations)
    assert any("Section 30(1)" in c for c in citations)
    assert any("Section 30(3)" in c for c in citations)

    # Check synthetic demo disclaimer
    assert "Synthetic Demo" in res.disclaimer
    assert "RFCTLARR Act 2013" in res.disclaimer


@pytest.mark.asyncio
async def test_valuation_rules_api():
    """Tests GET /api/v1/valuation/rules returns active statutory configuration."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/valuation/rules", headers={"x-mock-role": "ADMIN"})
        assert res.status_code == 200
        data = res.json()
        assert data["rule_version"] == RULE_VERSION
        assert data["solatium_percentage"] == float(SOLATIUM_PERCENTAGE)
        assert data["annual_interest_rate_pct"] == float(ANNUAL_INTEREST_RATE * 100)
        assert len(data["multiplier_slabs"]) >= 4
        assert "agricultural_irrigated" in data["default_circle_rates"]
        assert "Synthetic Demo" in data["disclaimer"]


@pytest.mark.asyncio
async def test_preview_calculate_api():
    """Tests POST /api/v1/valuation/calculate in-memory calculation endpoint."""
    payload = {
        "parcel_id": "P00003",
        "area_sqm": 2000.0,
        "circle_rate_per_sqm": 1200.0,
        "land_category": "agricultural_irrigated",
        "distance_from_urban_km": 15.0,
        "asset_value": 150000.0,
        "trees_crops_value": 50000.0,
        "severance_damage": 25000.0,
        "notification_date": "2025-01-01",
        "award_date": "2025-07-01",
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/valuation/calculate", json=payload, headers={"x-mock-role": "ADMIN"})
        assert res.status_code == 200
        data = res.json()
        assert data["parcel_id"] == "P00003"
        assert data["market_value_base"] == 2400000.0
        assert data["multiplier_factor"] == 1.5
        assert data["solatium_amount"] == data["subtotal_before_solatium"]
        assert len(data["calculation_trace"]["steps"]) == 6


@pytest.mark.asyncio
async def test_parcel_dossier_integration():
    """Tests GET /api/v1/valuation/parcels/{parcel_id} retrieves database award."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/valuation/parcels/P00001", headers={"x-mock-role": "ADMIN"})
        assert res.status_code == 200
        data = res.json()
        assert data["parcel_id"] == "P00001" or data.get("case_id") == "AC00001"
        assert data["total_compensation"] > 0


@pytest.mark.asyncio
async def test_officer_approval_and_cpm_blocker_lifecycle():
    """
    Tests complete lifecycle:
    1. Calculate and save award for parcel P00002
    2. Officer approves award (CALCULATED -> APPROVED)
    3. Dispute raised (APPROVED -> DISPUTED), confirms CPM dependency edge activated
    4. Disbursed (DISPUTED -> PAID), confirms CPM dependency edge deactivated
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Save award
        calc_payload = {
            "parcel_id": "P00002",
            "area_sqm": 1500.0,
            "circle_rate_per_sqm": 1200.0,
            "distance_from_urban_km": 12.0,
            "asset_value": 100000.0,
        }
        res_save = await ac.post("/api/v1/valuation/parcels/P00002/calculate", json=calc_payload, headers={"x-mock-role": "OFFICER"})
        assert res_save.status_code == 200
        saved = res_save.json()
        cid = saved["compensation_id"]
        assert saved["compensation_status"] == "CALCULATED"

        # 2. Officer Approve
        res_app = await ac.post(f"/api/v1/valuation/awards/{cid}/approve", json={"notes": "Collector approved"}, headers={"x-mock-role": "OFFICER"})
        assert res_app.status_code == 200
        app_res = res_app.json()
        assert app_res["status"] == "APPROVED"

        # 3. Dispute Raised -> Activates CPM blocker
        res_disp = await ac.post(f"/api/v1/valuation/awards/{cid}/payment-status", json={"status": "DISPUTED", "notes": "Tree rate contest"}, headers={"x-mock-role": "OFFICER"})
        assert res_disp.status_code == 200
        disp_res = res_disp.json()
        assert disp_res["new_status"] == "DISPUTED"
        assert disp_res["cpm_impact"]["blocked"] is True

        # 4. Paid -> Releases CPM blocker
        res_paid = await ac.post(f"/api/v1/valuation/awards/{cid}/payment-status", json={"status": "PAID", "notes": "Disbursed via PFMS"}, headers={"x-mock-role": "OFFICER"})
        assert res_paid.status_code == 200
        paid_res = res_paid.json()
        assert paid_res["new_status"] == "PAID"
        assert paid_res["cpm_impact"]["blocked"] is False
