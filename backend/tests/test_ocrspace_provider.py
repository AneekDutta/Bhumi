"""
Unit and Integration Tests for OCR.Space Provider & Document Intelligence Pipeline
SIH26016 Land Acquisition Platform - KOSH
"""
import io
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi import HTTPException
import httpx

from app.core.config import settings
from app.schemas.document_intelligence import (
    DocumentCategory,
    DocumentExtractionDetail,
    DocumentReviewUpdateRequest,
    FieldReviewUpdate,
    JobStatus,
    ReviewStatus,
)
from app.services.document_intelligence_service import document_intelligence_service
from app.services.ocr.local_provider import LocalOCRProvider
from app.services.ocr.mock_provider import MockOCRProvider
from app.services.ocr.ocrspace_provider import OCRSpaceProvider


# 1. Provider Selection
def test_provider_selection_ocrspace():
    with patch.object(settings, "OCRSPACE_API_KEY", "DUMMY_KEY_FOR_TESTING"):
        provider = document_intelligence_service.get_ocr_provider(ocr_provider="ocrspace")
        assert isinstance(provider, OCRSpaceProvider)
        assert provider.provider_id == "OCR.Space"
        assert provider.engine == "3"


def test_provider_selection_local_and_mock():
    prov_local = document_intelligence_service.get_ocr_provider(ocr_provider="local")
    assert isinstance(prov_local, LocalOCRProvider)

    prov_mock = document_intelligence_service.get_ocr_provider(ocr_provider="mock")
    assert isinstance(prov_mock, MockOCRProvider)

    with pytest.raises(HTTPException) as excinfo:
        document_intelligence_service.get_ocr_provider(ocr_provider="unsupported_engine")
    assert excinfo.value.status_code == 400


def test_provider_selection_default_fallback():
    # When use_mock_ocr is True, mock is selected
    prov = document_intelligence_service.get_ocr_provider(use_mock_ocr=True)
    assert isinstance(prov, MockOCRProvider)

    # When use_mock_ocr is False and OCR_PROVIDER is local
    with patch.object(settings, "OCR_PROVIDER", "local"):
        prov2 = document_intelligence_service.get_ocr_provider(use_mock_ocr=False)
        assert isinstance(prov2, LocalOCRProvider)


# 2. Missing OCRSPACE_API_KEY (raises 500)
def test_missing_api_key_raises_500():
    with pytest.raises(HTTPException) as excinfo:
        OCRSpaceProvider(api_key="")
    assert excinfo.value.status_code == 500
    assert "OCRSPACE_API_KEY is not configured" in excinfo.value.detail

    with pytest.raises(HTTPException) as excinfo2:
        OCRSpaceProvider(api_key="   ")
    assert excinfo2.value.status_code == 500


# 3. Successful OCR.Space Response
@pytest.mark.asyncio
async def test_successful_ocrspace_response():
    provider = OCRSpaceProvider(api_key="TEST_API_KEY", engine="3")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "OCRExitCode": 1,
        "IsErroredOnProcessing": False,
        "ParsedResults": [
            {
                "ParsedText": "GOVERNMENT OF BIHAR NOTIFICATION UNDER SECTION 11(1)",
                "FileParseExitCode": 1,
            }
        ],
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        output = await provider.extract_text(
            file_bytes=b"sample image content",
            filename="notice.png",
            mime_type="image/png",
            document_hash="dummyhash123",
        )

        assert output.provider == "OCR.Space"
        assert output.model_version == "engine-3"
        assert "SECTION 11(1)" in output.full_text
        assert len(output.pages) == 1
        assert output.average_confidence >= 0.90


# 4. Multi-Page ParsedResults Aggregation
@pytest.mark.asyncio
async def test_multipage_parsed_results_aggregation():
    provider = OCRSpaceProvider(api_key="TEST_API_KEY", engine="3")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "OCRExitCode": 1,
        "IsErroredOnProcessing": False,
        "ParsedResults": [
            {"ParsedText": "Page 1: Section 11 Details", "FileParseExitCode": 1},
            {"ParsedText": "Page 2: Affected Survey Numbers SY-101", "FileParseExitCode": 1},
        ],
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        output = await provider.extract_text(
            file_bytes=b"%PDF-1.4 ... /Type /Page ... /Type /Page ...",
            filename="multipage.pdf",
            mime_type="application/pdf",
            document_hash="dummyhashmultipage",
        )

        assert len(output.pages) == 2
        assert output.pages[0].page_number == 1
        assert output.pages[1].page_number == 2
        assert "Page 1: Section 11 Details" in output.full_text
        assert "Page 2: Affected Survey Numbers" in output.full_text


# 5. Empty OCR Response (raises 422)
@pytest.mark.asyncio
async def test_empty_ocr_response_raises_422():
    provider = OCRSpaceProvider(api_key="TEST_API_KEY", engine="3")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "OCRExitCode": 1,
        "IsErroredOnProcessing": False,
        "ParsedResults": [
            {"ParsedText": "*[No text detected]*", "FileParseExitCode": 1}
        ],
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        with pytest.raises(HTTPException) as excinfo:
            await provider.extract_text(
                file_bytes=b"blank image content",
                filename="blank.png",
                mime_type="image/png",
                document_hash="dummyblank",
            )
        assert excinfo.value.status_code == 422
        assert "empty text extraction" in excinfo.value.detail.lower()


# 6. OCR.Space Application Error (raises 502)
@pytest.mark.asyncio
async def test_ocrspace_application_error_raises_502():
    provider = OCRSpaceProvider(api_key="TEST_API_KEY", engine="3")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "OCRExitCode": 3,
        "IsErroredOnProcessing": True,
        "ErrorMessage": ["File failed conversion: corrupted raster stream"],
    }

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        with pytest.raises(HTTPException) as excinfo:
            await provider.extract_text(
                file_bytes=b"corrupt image",
                filename="corrupt.png",
                mime_type="image/png",
                document_hash="dummycorrupt",
            )
        assert excinfo.value.status_code == 502
        assert "OCR.Space API error" in excinfo.value.detail


# 7. HTTP Non-200 Error (raises 502)
@pytest.mark.asyncio
async def test_http_non_200_error_raises_502():
    provider = OCRSpaceProvider(api_key="TEST_API_KEY", engine="3")

    mock_resp = MagicMock()
    mock_resp.status_code = 503
    mock_resp.text = "Service Unavailable"

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        with pytest.raises(HTTPException) as excinfo:
            await provider.extract_text(
                file_bytes=b"data",
                filename="test.png",
                mime_type="image/png",
                document_hash="dummy503",
            )
        assert excinfo.value.status_code == 502
        assert "HTTP error 503" in excinfo.value.detail


# 8. Timeout Handling (raises 504)
@pytest.mark.asyncio
async def test_ocrspace_timeout_raises_504():
    provider = OCRSpaceProvider(api_key="TEST_API_KEY", engine="3", timeout_seconds=5)

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.TimeoutException("Read timed out")
        with pytest.raises(HTTPException) as excinfo:
            await provider.extract_text(
                file_bytes=b"data",
                filename="timeout.png",
                mime_type="image/png",
                document_hash="dummytimeout",
            )
        assert excinfo.value.status_code == 504
        assert "timed out" in excinfo.value.detail.lower()


# 9. Secret Leak Prevention
@pytest.mark.asyncio
async def test_secret_leak_prevention():
    secret_key = "CONFIDENTIAL_KEY_XYZ_999"
    provider = OCRSpaceProvider(api_key=secret_key, engine="3")

    # If network error message contains the secret key
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.RequestError(f"Connection failed sending to apikey={secret_key}")
        with pytest.raises(HTTPException) as excinfo:
            await provider.extract_text(
                file_bytes=b"data",
                filename="test.png",
                mime_type="image/png",
                document_hash="dummysecret",
            )
        assert excinfo.value.status_code == 502
        # Verify the actual secret key is NOT in the error detail
        assert secret_key not in excinfo.value.detail
        assert "[REDACTED_API_KEY]" in excinfo.value.detail


# 10. Preflight Rejection on >1 MB File (raises 400)
@pytest.mark.asyncio
async def test_preflight_rejection_on_large_file():
    provider = OCRSpaceProvider(api_key="TEST_API_KEY", engine="3")
    oversized_bytes = b"0" * (1024 * 1024 + 50)  # > 1 MB

    with pytest.raises(HTTPException) as excinfo:
        await provider.extract_text(
            file_bytes=oversized_bytes,
            filename="large.png",
            mime_type="image/png",
            document_hash="dummylarge",
        )
    assert excinfo.value.status_code == 400
    assert "exceeds the 1 mb limit" in excinfo.value.detail.lower()


# 11. Preflight Rejection on >3 Pages PDF (raises 400)
@pytest.mark.asyncio
async def test_preflight_rejection_on_multipage_pdf():
    provider = OCRSpaceProvider(api_key="TEST_API_KEY", engine="3")
    # Simulate PDF binary stream containing 4 pages
    four_page_pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj <</Type /Page>> endobj\n"
        b"2 0 obj <</Type /Page>> endobj\n"
        b"3 0 obj <</Type /Page>> endobj\n"
        b"4 0 obj <</Type /Page>> endobj\n"
        b"trailer <</Root 5 0 R>>\n%%EOF"
    )

    with pytest.raises(HTTPException) as excinfo:
        await provider.extract_text(
            file_bytes=four_page_pdf,
            filename="four_pages.pdf",
            mime_type="application/pdf",
            document_hash="dummyfourpages",
        )
    assert excinfo.value.status_code == 400
    assert "4 pages" in excinfo.value.detail
    assert "limit of 3 pages" in excinfo.value.detail


# 12. Existing Local/Mock Provider Behavior Preserved
@pytest.mark.asyncio
async def test_existing_providers_preserved():
    local_p = LocalOCRProvider()
    out_local = await local_p.extract_text(
        file_bytes=b"Sample plain document text",
        filename="doc.txt",
        mime_type="text/plain",
        document_hash="localhash",
    )
    assert out_local.provider == "LOCAL_HEADLESS_OCR"
    assert "Sample plain document" in out_local.full_text

    mock_p = MockOCRProvider()
    out_mock = await mock_p.extract_text(
        file_bytes=b"dummy",
        filename="sec11_notice.pdf",
        mime_type="application/pdf",
        document_hash="mockhash",
    )
    assert out_mock.provider == "MOCK_STATUTORY_OCR"
    assert "SECTION 11(1)" in out_mock.full_text


# 13. End-to-End Ingest with OCR.Space Provenance & PENDING_REVIEW Gate
@pytest.mark.asyncio
async def test_ingest_with_ocrspace_provenance_and_review():
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "OCRExitCode": 1,
        "IsErroredOnProcessing": False,
        "ParsedResults": [
            {
                "ParsedText": (
                    "NOTIFICATION UNDER SECTION 11(1) RFCTLARR ACT, 2013\n"
                    "Notification No: LA-2026-PAT-091\n"
                    "Dated: 15-05-2025\n"
                    "District: Patna, Tehsil: Patna Sadar\n"
                    "Villages: Rampur, Devpura\n"
                    "Survey Numbers: SY-101, SY-102\n"
                    "Total Area: 14.85 Hectares\n"
                    "Public Purpose: NH-927A Infrastructure Corridor"
                ),
                "FileParseExitCode": 1,
            }
        ],
    }

    with patch.object(settings, "OCRSPACE_API_KEY", "DUMMY_KEY_FOR_TESTING"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        sample_bytes = b"Simulated Section 11 image bytes"
        job = await document_intelligence_service.ingest_document(
            file_bytes=sample_bytes,
            filename="sec11_scan.png",
            mime_type="image/png",
            ocr_provider="ocrspace",
            use_mock_ocr=False,
            uploaded_by="OFF-001",
        )

        assert job.status == JobStatus.REVIEW_REQUIRED
        detail: DocumentExtractionDetail = document_intelligence_service.get_document_extraction(job.document_id)

        # Verify Provenance metadata
        assert detail.ocr_provider == "OCR.Space"
        assert detail.ocr_engine == "3"
        assert detail.ocr_source == "External OCR"
        assert detail.ocr_status == "OCR complete"
        assert detail.review_status == ReviewStatus.PENDING_REVIEW


# 14. Governance Gate: Unverified Document Cannot Alter Acquisition State
@pytest.mark.asyncio
async def test_unverified_ocr_cannot_mutate_workflow_state():
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "OCRExitCode": 1,
        "IsErroredOnProcessing": False,
        "ParsedResults": [
            {
                "ParsedText": "AWARD STATEMENT UNDER SECTION 23/25 RFCTLARR ACT, 2013\nAward No: AWD-999\nTotal: 5000000",
                "FileParseExitCode": 1,
            }
        ],
    }

    with patch.object(settings, "OCRSPACE_API_KEY", "DUMMY_KEY_FOR_TESTING"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        job = await document_intelligence_service.ingest_document(
            file_bytes=b"Award document bytes for gate test",
            filename="award_gate.png",
            mime_type="image/png",
            ocr_provider="ocrspace",
            use_mock_ocr=False,
            uploaded_by="OFF-001",
        )

        # Attempt to apply to workflow before human review must fail
        with pytest.raises(HTTPException) as excinfo:
            await document_intelligence_service.apply_to_acquisition_workflow(
                doc_id=job.document_id,
                officer_user="OFF-001",
            )
        assert excinfo.value.status_code == 422
        assert "Governance Gate" in excinfo.value.detail

        # Officer completes human verification gate
        review_update = DocumentReviewUpdateRequest(
            field_updates=[
                FieldReviewUpdate(field_name="award_number", verified_value="AWD-999-VERIFIED", status="ACCEPTED")
            ],
            mark_verified=True,
            review_notes="Certified by CALA officer.",
        )
        updated_detail = document_intelligence_service.update_field_reviews(
            doc_id=job.document_id,
            payload=review_update,
            officer_user="OFF-001",
        )
        assert updated_detail.review_status == ReviewStatus.VERIFIED

        # Now apply succeeds
        apply_res = await document_intelligence_service.apply_to_acquisition_workflow(
            doc_id=job.document_id,
            officer_user="OFF-001",
        )
        assert apply_res["status"] == "APPLIED_TO_WORKFLOW"
