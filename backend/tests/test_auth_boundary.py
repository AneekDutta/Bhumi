import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
import os
from unittest.mock import patch

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
            assert res.status_code == 501
            assert "Production IDP is not configured" in res.text
