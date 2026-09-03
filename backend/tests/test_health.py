import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_root_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_v1_health_no_db(monkeypatch):
    # Mock the DB session dependency to avoid needing a live DB during unit test
    from app.api.v1.health import get_db
    
    async def override_get_db():
        yield None
        
    app.dependency_overrides[get_db] = override_get_db
    
    # We also need to mock db.execute since we're passing None
    class MockDB:
        async def execute(self, query):
            pass
            
    async def override_get_db_mock():
        yield MockDB()
        
    app.dependency_overrides[get_db] = override_get_db_mock
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
    
    app.dependency_overrides = {}
    
    assert response.status_code == 200
    assert "status" in response.json()
