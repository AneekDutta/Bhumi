import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_unauthenticated_landowner_request_prod(monkeypatch):
    monkeypatch.setenv("AUTH_MODE", "prod")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/landowner/profile/O00001")
        assert response.status_code == 401

@pytest.mark.asyncio
async def test_authenticated_landowner_can_only_access_own_profile():
    headers = {
        "x-mock-role": "LANDOWNER",
        "x-mock-user-id": "O00001"
    }
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/landowner/profile/O00002", headers=headers)
        assert response.status_code == 403

        response = await ac.post("/api/v1/landowner/complaints", json={
            "complaint_type": "Boundary Dispute",
            "description": "Test",
            "owner_id": "O00002",
            "owner_name": "Other Guy",
            "parcel_id": "P001",
            "document_evidence": {}
        }, headers=headers)
        assert response.status_code == 403

@pytest.mark.asyncio
async def test_landowner_cannot_resolve_complaints():
    headers = {
        "x-mock-role": "LANDOWNER",
        "x-mock-user-id": "O00001"
    }
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/landowner/complaints/CMP-123/resolve", json={
            "resolution_action": "REJECTED",
            "resolution_notes": "Nope"
        }, headers=headers)
        assert response.status_code == 403
