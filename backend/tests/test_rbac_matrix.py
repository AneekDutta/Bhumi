from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.deps import TrustedIdentity, get_current_user_context
from app.core.database import get_db
from app.main import app


@pytest.fixture(autouse=True)
def clean_overrides():
    app.dependency_overrides = {}
    yield
    app.dependency_overrides = {}

class FakeProject:
    def __init__(self, id):
        self.id = id
        self.name = "Test"
        self.total_length_km = 10.0

@pytest.mark.asyncio
async def test_rbac_admin_no_scope():
    async def override_get_user():
        return TrustedIdentity(user_id="u1", role="ADMIN")
    app.dependency_overrides[get_current_user_context] = override_get_user

    project_id = str(uuid4())
    class MockResult:
        def first(self_): return FakeProject(project_id)
    class MockScalarResult:
        def scalars(self_): return MockResult()
    class MockSession:
        async def execute(self, query): return MockScalarResult()
    async def override_db(): yield MockSession()
    app.dependency_overrides[get_db] = override_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(f"/api/v1/projects/{project_id}")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_rbac_admin_project_scope_matches():
    pid = str(uuid4())
    async def override_get_user():
        return TrustedIdentity(user_id="u1", role="ADMIN", assigned_project_id=pid)
    app.dependency_overrides[get_current_user_context] = override_get_user
    class MockResult:
        def first(self_): return FakeProject(pid)
    class MockScalarResult:
        def scalars(self_): return MockResult()
    class MockSession:
        async def execute(self, query): return MockScalarResult()
    async def override_db(): yield MockSession()
    app.dependency_overrides[get_db] = override_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(f"/api/v1/projects/{pid}")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_rbac_admin_project_scope_mismatches():
    pid1 = str(uuid4())
    pid2 = str(uuid4())
    async def override_get_user():
        return TrustedIdentity(user_id="u1", role="ADMIN", assigned_project_id=pid1)
    app.dependency_overrides[get_current_user_context] = override_get_user

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(f"/api/v1/projects/{pid2}")
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_rbac_admin_district_scope():
    did = str(uuid4())
    pid = str(uuid4())
    async def override_get_user():
        return TrustedIdentity(user_id="u1", role="ADMIN", assigned_district_id=did)
    app.dependency_overrides[get_current_user_context] = override_get_user
    class MockResult:
        def first(self_): return FakeProject(pid) # District matches
    class MockScalarResult:
        def scalars(self_): return MockResult()
    class MockSession:
        async def execute(self, query): return MockScalarResult()
    async def override_db(): yield MockSession()
    app.dependency_overrides[get_db] = override_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(f"/api/v1/projects/{pid}")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_rbac_officer_no_scope():
    async def override_get_user():
        return TrustedIdentity(user_id="u1", role="DISTRICT_OFFICER")
    app.dependency_overrides[get_current_user_context] = override_get_user
    class MockSession:
        async def execute(self, query): pass
    async def override_db(): yield MockSession()
    app.dependency_overrides[get_db] = override_db

    pid = str(uuid4())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(f"/api/v1/projects/{pid}")
    assert response.status_code == 403
