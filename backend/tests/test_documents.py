import pytest
from httpx import ASGITransport, AsyncClient
import uuid
import json
from unittest.mock import patch
from app.main import app
import asyncio

pytestmark = pytest.mark.asyncio

PDF_MAGIC = b"%PDF-"
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
JPEG_MAGIC = b"\xff\xd8\xff"

# We mock the AuthorizationService so we don't need real DB records for tests
@pytest.fixture(autouse=True)
def mock_auth(monkeypatch):
    async def mock_verify(user, project_id, db):
        if user.role == "OFFICER" and user.assigned_project_id != project_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Forbidden")
        return True
    monkeypatch.setattr("app.services.authorization.AuthorizationService.verify_project_access", mock_verify)

    def mock_mutation_auth(user):
        if user.role not in ["ADMIN", "DISTRICT_OFFICER"]:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Forbidden")
        return True
    monkeypatch.setattr("app.services.authorization.AuthorizationService.verify_mutation_access", mock_mutation_auth)

# And we mock DB operations to just return fake models
@pytest.fixture(autouse=True)
def mock_db_deps(monkeypatch):
    from app.api.deps import get_current_user_context
    from app.core.database import get_db

    class MockSession:
        async def commit(self): pass
        async def refresh(self, obj):
            from datetime import datetime, timezone
            obj.created_at = datetime.now(timezone.utc)
            obj.updated_at = datetime.now(timezone.utc)
        async def rollback(self): pass
        def add(self, obj): pass
        async def execute(self, query):
            class MockResult:
                def scalars(self):
                    class MockScalars:
                        def first(self):
                            from app.models.domain import Document
                            from datetime import datetime, timezone
                            now = datetime.now(timezone.utc)
                            d = Document(id=uuid.uuid4(), project_id=uuid.uuid4(), title="Mock", document_type="DEED", current_version=1, status="ACTIVE", created_at=now, updated_at=now)
                            d.versions = []
                            return d
                        def all(self):
                            return []
                    return MockScalars()
            return MockResult()
        async def get(self, model, ident):
            from app.models.domain import Document, Parcel, AcquisitionCase
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            if model == Document:
                d = Document(id=ident, project_id=uuid.uuid4(), title="Mock", document_type="DEED", current_version=1, status="ACTIVE", created_at=now, updated_at=now)
                return d
            if model == Parcel:
                p = Parcel(id=ident, project_id=uuid.uuid4())
                # Actually we need it to match so we return none if it doesnt match but in a mock we cant see the request.
                # So we can just skip this test or fix it. Wait, the mock doesnt know the original project_id
                return p
            if model == AcquisitionCase:
                a = AcquisitionCase(id=ident, parcel_id=uuid.uuid4())
                return a
            return None

    async def override_get_db():
        yield MockSession()

    app.dependency_overrides[get_db] = override_get_db

async def test_upload_document_success():
    metadata = {
        "title": "Test Deed",
        "description": "A test deed for parcel",
        "document_type": "DEED",
        "project_id": str(uuid.uuid4()),

    }

    file_content = PDF_MAGIC + b"fake pdf content"
    files = {"file": ("test.pdf", file_content, "application/pdf")}

    with patch("app.services.document_service.DocumentService._upload_to_supabase") as mock_upload:
        mock_upload.return_value = None

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.post(
                "/api/v1/documents/",
                data={"metadata": json.dumps(metadata)},
                files=files,
                headers={"x-mock-role": "ADMIN"}
            )

    assert response.status_code == 200

async def test_upload_document_invalid_mime():
    metadata = {
        "title": "Test Malware",
        "document_type": "OTHER",
        "project_id": str(uuid.uuid4()),
    }
    files = {"file": ("test.exe", b"bad", "application/x-msdownload")}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/documents/",
            data={"metadata": json.dumps(metadata)},
            files=files,
            headers={"x-mock-role": "ADMIN"}
        )
    assert response.status_code == 400

async def test_upload_document_magic_byte_mismatch():
    metadata = {
        "title": "Fake PDF",
        "document_type": "OTHER",
        "project_id": str(uuid.uuid4()),
    }

    files = {"file": ("test.pdf", b"MZ\x90\x00", "application/pdf")}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/documents/",
            data={"metadata": json.dumps(metadata)},
            files=files,
            headers={"x-mock-role": "ADMIN"}
        )
    assert response.status_code == 400

async def test_upload_document_rbac_reject():
    metadata = {
        "title": "Test Deed",
        "document_type": "DEED",
        "project_id": str(uuid.uuid4()),
    }
    files = {"file": ("test.pdf", PDF_MAGIC + b"pdf", "application/pdf")}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/documents/",
            data={"metadata": json.dumps(metadata)},
            files=files,
            headers={"x-mock-role": "OFFICER", "x-mock-project-id": str(uuid.uuid4())}
        )
    assert response.status_code == 403

async def test_upload_document_unscoped_restricted_reject():
    metadata = {
        "title": "Test Deed",
        "document_type": "DEED",
        "project_id": str(uuid.uuid4()),
    }
    files = {"file": ("test.pdf", PDF_MAGIC + b"pdf", "application/pdf")}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/documents/",
            data={"metadata": json.dumps(metadata)},
            files=files,
            headers={"x-mock-role": "OFFICER"}
        )
    assert response.status_code == 403

async def test_parcel_scoped_authorization_reject():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(
            f"/api/v1/documents/?parcel_id={uuid.uuid4()}",
            headers={"x-mock-role": "OFFICER", "x-mock-project-id": str(uuid.uuid4())}
        )
    assert response.status_code == 403

async def test_document_versioning():
    doc_id = str(uuid.uuid4())
    files2 = {"file": ("test2.jpg", JPEG_MAGIC + b"jpg2", "image/jpeg")}
    with patch("app.services.document_service.DocumentService._upload_to_supabase"):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            res2 = await ac.post(
                f"/api/v1/documents/{doc_id}/versions",
                files=files2,
                headers={"x-mock-role": "ADMIN"}
            )
            assert res2.status_code == 200

async def test_document_soft_delete():
    doc_id = str(uuid.uuid4())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        del_res = await ac.delete(f"/api/v1/documents/{doc_id}", headers={"x-mock-role": "ADMIN"})
        assert del_res.status_code == 204

async def test_mismatched_parcel_project():
    metadata = {
        "title": "Test Mismatch",
        "document_type": "DEED",
        "project_id": str(uuid.uuid4()), "parcel_id": str(uuid.uuid4())

    }
    files = {"file": ("test.pdf", PDF_MAGIC + b"pdf", "application/pdf")}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/documents/",
            data={"metadata": json.dumps(metadata)},
            files=files,
            headers={"x-mock-role": "ADMIN"}
        )
    assert response.status_code == 400
    assert "Mismatched parcel and project associations" in response.text

async def test_list_unfiltered_restricted_no_scope():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(
            "/api/v1/documents/",
            headers={"x-mock-role": "OFFICER"}
        )
    assert response.status_code == 403
    assert "Forbidden: Insufficient privileges" in response.text

async def test_list_unfiltered_project_scoped():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(
            "/api/v1/documents/",
            headers={"x-mock-role": "OFFICER", "x-mock-project-id": str(uuid.uuid4())}
        )
    # The mocked db will just return empty for all, but it shouldn't 403
    assert response.status_code == 200


async def test_mismatched_case_parcel():
    metadata = {
        "title": "Test Case Mismatch",
        "document_type": "DEED",
        "acquisition_case_id": str(uuid.uuid4()),
        "parcel_id": str(uuid.uuid4())
    }
    files = {"file": ("test.pdf", PDF_MAGIC + b"pdf", "application/pdf")}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/documents/",
            data={"metadata": json.dumps(metadata)},
            files=files,
            headers={"x-mock-role": "ADMIN"}
        )
    assert response.status_code == 400
    assert "Mismatched acquisition case and parcel associations" in response.text
