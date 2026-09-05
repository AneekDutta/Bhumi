import os

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.database import get_db
from app.main import app


class MockResult:
    def scalars(self_):
        class ScalarResult:
            def first(self_):
                return None
            def all(self_):
                return []
        return ScalarResult()

class MockSession:
    async def execute(self, query):
        return MockResult()
    async def commit(self): pass
    async def refresh(self, obj): pass
    def add(self, obj): pass
    async def close(self): pass

async def override_get_db():
    yield MockSession()

@pytest.fixture(autouse=True)
def mock_db_override():
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.pop(get_db, None)

# --- AUTHENTICATION & PROD BOUNDARY ---
@pytest.mark.asyncio
async def test_auth_fail_closed_prod():
    os.environ["AUTH_MODE"] = "prod"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/acquisition-cases/1efdf6e2-4347-4808-ae2f-6f580bff5a29/transition", json={
            "new_stage": "PRELIMINARY_NOTIFICATION"
        })
    assert response.status_code == 401

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/acquisition-cases/1efdf6e2-4347-4808-ae2f-6f580bff5a29/transition", json={
            "new_stage": "PRELIMINARY_NOTIFICATION"
        }, headers={"x-mock-role": "ADMIN"})
    assert response.status_code == 403
    os.environ["AUTH_MODE"] = "mock"

# --- AUTHORIZATION (REAL ROUTE) ---
@pytest.mark.asyncio
async def test_real_route_authorization_enforcement():
    target_project = "8efdf6e2-4347-4808-ae2f-6f580bff5a29"
    wrong_project = "9efdf6e2-4347-4808-ae2f-6f580bff5a29"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Correct Project -> Should be 404 (mock DB returns None, causing 404 in endpoint)
        resp_correct = await ac.get(f"/api/v1/projects/{target_project}/bottlenecks", headers={
            "x-mock-role": "DISTRICT_OFFICER",
            "x-mock-project-id": target_project
        })
        assert resp_correct.status_code == 404

        # Wrong Project -> Should be 403 (Blocked at AuthZ layer)
        resp_wrong = await ac.get(f"/api/v1/projects/{target_project}/bottlenecks", headers={
            "x-mock-role": "DISTRICT_OFFICER",
            "x-mock-project-id": wrong_project
        })
        assert resp_wrong.status_code == 403

# --- RATE LIMIT TESTS ---
def test_rate_limiter_logic():
    from app.core.security import RateLimiter
    rl = RateLimiter(max_keys=100)
    key = "test_ip_rate_limit"

    assert rl.check_limit(key, max_requests=2, window_seconds=10) is True
    assert rl.check_limit(key, max_requests=2, window_seconds=10) is True
    assert rl.check_limit(key, max_requests=2, window_seconds=10) is False

# --- QUOTA TESTS ---
def test_quota_manager():
    from app.core.security import QuotaManager
    qm = QuotaManager()
    qm._limits["TEST_RESOURCE"] = 2

    assert qm.check_quota("user_1", "TEST_RESOURCE") is True
    assert qm.check_quota("user_1", "TEST_RESOURCE") is True
    assert qm.check_quota("user_1", "TEST_RESOURCE") is False

# --- SSRF TESTS ---
@pytest.mark.asyncio
async def test_ssrf_protection():
    from app.core.security import SafeFetcher

    with pytest.raises(ValueError, match="SSRF Prevention: HTTPS is required"):
        await SafeFetcher.fetch("http://example.com")

    with pytest.raises(ValueError, match="SSRF Prevention: Host not in allowlist"):
        await SafeFetcher.fetch("https://169.254.169.254/latest/meta-data/")

    with pytest.raises(ValueError, match="SSRF Prevention: Host not in allowlist"):
        await SafeFetcher.fetch("https://localhost:8000")

    with pytest.raises(ValueError, match="SSRF Prevention: Host not in allowlist"):
        await SafeFetcher.fetch("https://10.0.0.1")

@pytest.mark.asyncio
async def test_oversized_payload_rejection():
    large_payload = {"data": "x" * (3 * 1024 * 1024)}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = {"Content-Length": str(3 * 1024 * 1024)}
        response = await ac.post("/api/v1/acquisition-cases/1efdf6e2-4347-4808-ae2f-6f580bff5a29/transition", json=large_payload, headers=headers)

    assert response.status_code == 413

@pytest.mark.asyncio
async def test_streamed_oversized_payload_rejection():
    async def generate_large_payload():
        for _ in range(3 * 1024):
            yield b"x" * 1024

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/acquisition-cases/1efdf6e2-4347-4808-ae2f-6f580bff5a29/transition", content=generate_large_payload())

    assert response.status_code == 413
