"""
Tests for Identity Verification Service & Router
SIH26016 Land Acquisition Platform - KOSH
Data Minimization, Strict Consent, and Statutory Disclaimer Verification
"""
import pytest
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError

from app.main import app
from app.schemas.identity import (
    IdentityType,
    IdentityVerificationRequest,
    STATUTORY_IDENTITY_DISCLAIMER,
    VerificationStatus,
)
from app.services.identity_service import identity_service


@pytest.mark.asyncio
async def test_raw_aadhaar_rejection_data_minimization():
    """Ensure raw 12-digit Aadhaar numbers are rejected under data minimization."""
    with pytest.raises(ValidationError) as excinfo:
        IdentityVerificationRequest(
            id_type=IdentityType.AADHAAR,
            identifier="123456789012",  # Raw 12 digits: MUST BE REJECTED
            claimed_name="Ramesh Chandra",
            consent_given=True,
            consent_purpose="Land acquisition compensation disbursal",
        )
    assert "Raw 12-digit Aadhaar number rejected" in str(excinfo.value)


@pytest.mark.asyncio
async def test_consent_enforcement():
    """Ensure verification fails if statutory consent is not explicitly granted."""
    with pytest.raises(ValidationError) as excinfo:
        IdentityVerificationRequest(
            id_type=IdentityType.AADHAAR,
            identifier="XXXX-XXXX-1234",
            claimed_name="Ramesh Chandra",
            consent_given=False,  # No consent
            consent_purpose="Land acquisition compensation disbursal",
        )
    assert "consent is mandatory" in str(excinfo.value).lower()


@pytest.mark.asyncio
async def test_masked_aadhaar_demographic_match():
    """Ensure masked Aadhaar matches against registry with fuzzy confidence."""
    req = IdentityVerificationRequest(
        id_type=IdentityType.AADHAAR,
        identifier="XXXX-XXXX-1234",
        claimed_name="Ramesh Chandra",
        consent_given=True,
        consent_purpose="Compensation disbursement verification",
    )
    res = await identity_service.verify_identity(req, officer_id="OFF-001")
    assert res.status == VerificationStatus.SUCCESS
    assert res.name_match_score >= 0.90
    assert res.matched_name == "Ramesh Chandra"
    assert STATUTORY_IDENTITY_DISCLAIMER in res.disclaimer
    assert res.data_minimization_audit["raw_aadhaar_stored"] is False
    assert res.data_minimization_audit["statutory_title_conferred"] is False


@pytest.mark.asyncio
async def test_statutory_disclaimer_endpoint():
    """Ensure public disclaimer endpoint explicitly clarifies identity != title."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/identity/disclaimer")
        assert res.status_code == 200
        data = res.json()
        assert "disclaimer" in data
        assert "DOES NOT CONFER, PROVE, OR MODIFY LAND OWNERSHIP" in data["disclaimer"]


@pytest.mark.asyncio
async def test_identity_verify_api_lifecycle_and_audit():
    """Ensure API verification works and audit trail is role-gated."""
    transport = ASGITransport(app=app)
    headers_officer = {"x-mock-role": "OFFICER", "x-mock-user-id": "OFF-777"}
    headers_landowner = {"x-mock-role": "LANDOWNER", "x-mock-user-id": "O00003"}

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Officer verifies identity
        payload = {
            "id_type": "PAN",
            "identifier": "ABCDE1234F",
            "claimed_name": "Ramesh Chandra",
            "consent_given": True,
            "consent_purpose": "Bank account seeding for RFCTLARR Award",
            "parcel_id": "P00003",
        }
        res_verify = await ac.post("/api/v1/identity/verify", headers=headers_officer, json=payload)
        assert res_verify.status_code == 200
        ver_data = res_verify.json()
        assert ver_data["status"] == "SUCCESS"
        assert ver_data["id_type"] == "PAN"
        assert ver_data["data_minimization_audit"]["raw_aadhaar_stored"] is False

        # 2. Officer views audit trail
        res_audit = await ac.get("/api/v1/identity/audit-trail?parcel_id=P00003", headers=headers_officer)
        assert res_audit.status_code == 200
        trail = res_audit.json()
        assert len(trail) >= 1
        entry = next(e for e in trail if e["masked_identifier"] == "ABCDE1234F")
        assert entry["statutory_title_conferred"] is False

        # 3. Landowner is forbidden from viewing internal identity audit trails
        res_forbidden = await ac.get("/api/v1/identity/audit-trail?parcel_id=P00003", headers=headers_landowner)
        assert res_forbidden.status_code == 403
