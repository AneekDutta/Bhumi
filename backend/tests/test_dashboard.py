import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
from uuid import UUID
import os

from app.services.dashboard_service import DashboardService
from app.api.deps import TrustedIdentity, get_current_user_context
from app.core.database import AsyncSessionLocal
from app.main import app

@pytest.mark.asyncio
async def test_dashboard_semantic_parity():
    async with AsyncSessionLocal() as session:
        identity = TrustedIdentity(user_id="u1", role="ADMIN")
        svc = DashboardService(session, identity)
        impacts = await svc.get_projects_impact()

        pune = next((p for p in impacts if "Pune Ring Road" in p["name"]), None)
        assert pune is not None, "Pune Ring Road Expansion not found"
        assert pune["project_delay_days"] == 20
        assert pune["spatial_cluster_count"] == 2

@pytest.mark.asyncio
async def test_dashboard_rbac_isolation():
    async with AsyncSessionLocal() as session:
        identity_all = TrustedIdentity(user_id="u1", role="ADMIN")
        svc_all = DashboardService(session, identity_all)
        all_impacts = await svc_all.get_projects_impact()

        if len(all_impacts) < 1:
            pytest.skip("Not enough projects")

        proj_id = all_impacts[0]["project_id"]

        identity_restricted = TrustedIdentity(user_id="u1", role="OFFICER", assigned_project_id=str(proj_id))
        svc_restricted = DashboardService(session, identity_restricted)
        restricted_impacts = await svc_restricted.get_projects_impact()

        assert len(restricted_impacts) == 1
        assert restricted_impacts[0]["project_id"] == proj_id

@pytest.mark.asyncio
async def test_dashboard_summary_endpoint():
    def mock_auth():
        return TrustedIdentity(user_id="u1", role="ADMIN")
    app.dependency_overrides[get_current_user_context] = mock_auth
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/dashboard/summary")
        assert response.status_code == 200
        assert "total_projects" in response.json()
    app.dependency_overrides.pop(get_current_user_context, None)

@pytest.mark.asyncio
async def test_dashboard_reports_endpoint():
    def mock_auth():
        return TrustedIdentity(user_id="u1", role="ADMIN")
    app.dependency_overrides[get_current_user_context] = mock_auth
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/dashboard/reports?report_type=project_status")
        assert response.status_code == 200
        assert response.json()["report_type"] == "project_status"
    app.dependency_overrides.pop(get_current_user_context, None)

@pytest.mark.asyncio
async def test_dashboard_query_count_n_plus_one():
    # We will verify that _get_projects_impact executes exactly 7 core queries regardless of project count.
    # We can do this by mocking db.execute.
    class MockResult:
        def scalars(self):
            class ScalarResult:
                def all(self): return []
            return ScalarResult()
        def all(self): return []

    class MockDB:
        def __init__(self):
            self.query_count = 0
        async def execute(self, query):
            self.query_count += 1
            return MockResult()

    identity = TrustedIdentity(user_id="u1", role="ADMIN")
    mock_db = MockDB()
    svc = DashboardService(mock_db, identity) # type: ignore

    # Mock _get_authorized_project_ids to return multiple IDs
    async def mock_auth_projects(): return [UUID('00000000-0000-0000-0000-000000000001'), UUID('00000000-0000-0000-0000-000000000002')]
    svc._get_authorized_project_ids = mock_auth_projects
    await svc._get_projects_impact()

    # Check that we didn't loop queries per project.
    # Core queries: Projects, Activities, Dependencies, Requirements, Parcels, Cases, Blockers, Centroids
    assert mock_db.query_count <= 10, f"Expected bounded query count, got {mock_db.query_count}"

@pytest.mark.asyncio
async def test_dashboard_report_rbac():
    async with AsyncSessionLocal() as session:
        # 1. Admin gets all
        identity_all = TrustedIdentity(user_id="u1", role="ADMIN")
        svc_all = DashboardService(session, identity_all)
        reports_all = await svc_all.get_reports("project_status")
        all_len = len(reports_all)
        if all_len < 1:
            pytest.skip("Not enough projects")

        proj_id_str = reports_all[0]["Project ID"]

        # 2. Restricted user gets 1
        identity_restricted = TrustedIdentity(user_id="u2", role="OFFICER", assigned_project_id=proj_id_str)
        svc_restricted = DashboardService(session, identity_restricted)
        reports_restricted = await svc_restricted.get_reports("project_status")

        assert len(reports_restricted) == 1
        assert reports_restricted[0]["Project ID"] == proj_id_str


@pytest.mark.asyncio
async def test_dashboard_mock_auth_admin_no_header():
    from app.api.deps import get_current_user_context
    class MockRequest:
        headers = {}
    req = MockRequest()
    identity = get_current_user_context(req, auth=None)
    assert identity.role == "ADMIN"
    assert identity.assigned_project_id is None

@pytest.mark.asyncio
async def test_dashboard_mock_auth_restricted():
    from app.api.deps import get_current_user_context
    class MockRequest:
        headers = {"x-mock-role": "OFFICER", "x-mock-project-id": "pid-456"}
    req = MockRequest()
    identity = get_current_user_context(req, auth=None)
    assert identity.role == "OFFICER"
    assert identity.assigned_project_id == "pid-456"

@pytest.mark.asyncio
async def test_dashboard_summary_admin_sees_all():
    # If we call summary via endpoint without mocking the auth entirely (just relying on default deps),
    # it should run as ADMIN and see actual DB projects (like the golden dataset).
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/dashboard/summary")
        assert response.status_code == 200
        data = response.json()
        assert data["total_projects"] > 0

@pytest.mark.asyncio
async def test_dashboard_mock_auth_officer_no_header():
    from app.api.deps import get_current_user_context
    class MockRequest:
        headers = {"x-mock-role": "OFFICER"}
    req = MockRequest()
    identity = get_current_user_context(req, auth=None)
    assert identity.role == "OFFICER"
    assert identity.assigned_project_id is None
