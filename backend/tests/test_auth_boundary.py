import os
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_prod_auth_fails_closed():
    with patch.dict(os.environ, {"AUTH_MODE": "prod"}):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            # 1. Missing token
            res = await ac.get("/api/v1/projects/")
            assert res.status_code == 401
            assert "Missing authentication token" in res.text

            # 2. Mock headers strictly forbidden
            res = await ac.get("/api/v1/projects/", headers={"x-mock-role": "ADMIN"})
            assert res.status_code == 403
            assert "Mock headers strictly forbidden" in res.text

            # 3. Provided token but unconfigured IDP (fails closed)
            res = await ac.get("/api/v1/projects/", headers={"Authorization": "Bearer fake_token"})
            assert res.status_code == 503
            assert "Authentication is not configured" in res.text

@pytest.mark.asyncio
async def test_prod_auth_success_lookup_by_sub():
    import os
    import uuid
    from unittest.mock import patch

    from app.api.deps import get_current_user_context
    from app.core.database import AsyncSessionLocal
    from app.models.domain import User

    mock_sub = uuid.uuid4()

    # Create a user in the test database if DB is reachable
    try:
        async with AsyncSessionLocal() as session:
            user = User(id=mock_sub, email=f"test_{mock_sub}@example.com", full_name="Test User", role="ADMIN")
            session.add(user)
            await session.commit()
    except Exception as e:
        pytest.skip(f"Database not available: {e}")

    class MockRequest:
        headers = {}

    class MockAuth:
        credentials = "fake_valid_token"

    req = MockRequest()
    auth = MockAuth()

    with patch.dict(os.environ, {"AUTH_MODE": "prod"}),          patch("app.api.deps.decode_and_verify_jwt", return_value={"sub": str(mock_sub)}):

        async with AsyncSessionLocal() as session:
            identity = await get_current_user_context(req, auth=auth, db=session)
            assert identity.user_id == str(mock_sub)
            assert identity.role == "ADMIN"
