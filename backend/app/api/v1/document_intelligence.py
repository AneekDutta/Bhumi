"""
FastAPI Router for KOSH Document Intelligence & OCR Pipeline
SIH26016 Land Acquisition Digital Twin Platform
"""
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import TrustedIdentity, get_current_user_context
from app.core.database import get_db
from app.schemas.document_intelligence import (
    DocumentCategory,
    DocumentExtractionDetail,
    DocumentJobRead,
    DocumentReviewUpdateRequest,
)
from app.services.document_intelligence_service import document_intelligence_service

router = APIRouter()


def require_officer_or_admin(identity: TrustedIdentity) -> str:
    role = (identity.role or "").upper()
    if role in ["LANDOWNER", "CITIZEN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Document Intelligence and extraction verification are restricted to authorized acquisition officers."
        )
    return identity.user_id or "OFF-001"


@router.post("/upload", response_model=DocumentJobRead)
async def upload_document_for_intelligence(
    file: UploadFile = File(...),
    category: Optional[str] = Form(None),
    use_mock_ocr: bool = Form(True),
    identity: TrustedIdentity = Depends(get_current_user_context),
):
    """
    Ingests document, validates size and signature, generates SHA-256 hash,
    executes OCR, extracts structured schema fields, and initializes Human Review Gate.
    """
    officer_user = require_officer_or_admin(identity)

    # Size check: 25MB max
    file_bytes = await file.read()
    if len(file_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Document exceeds maximum limit of 25MB.")
    if len(file_bytes) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded document is empty.")

    cat_enum = None
    if category:
        try:
            cat_enum = DocumentCategory(category.upper().strip())
        except ValueError:
            cat_enum = None

    return await document_intelligence_service.ingest_document(
        file_bytes=file_bytes,
        filename=file.filename or "uploaded_document.pdf",
        mime_type=file.content_type or "application/pdf",
        category=cat_enum,
        use_mock_ocr=use_mock_ocr,
        uploaded_by=officer_user,
    )


@router.get("/{document_id}/extraction", response_model=DocumentExtractionDetail)
async def get_document_extraction(
    document_id: str,
    identity: TrustedIdentity = Depends(get_current_user_context),
):
    """Retrieves full structured extraction dossier with field layout bounding boxes and confidence scores."""
    require_officer_or_admin(identity)
    return document_intelligence_service.get_document_extraction(document_id)


@router.post("/{document_id}/review", response_model=DocumentExtractionDetail)
async def review_document_extraction(
    document_id: str,
    payload: DocumentReviewUpdateRequest,
    identity: TrustedIdentity = Depends(get_current_user_context),
):
    """
    Human Review Gate:
    Officers inspect, edit, accept, or reject proposed OCR extractions.
    Gated so that unverified AI extractions cannot mutate legal cases.
    """
    officer_user = require_officer_or_admin(identity)
    return document_intelligence_service.update_field_reviews(
        doc_id=document_id,
        payload=payload,
        officer_user=officer_user,
    )


@router.post("/{document_id}/apply")
async def apply_verified_extraction(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    identity: TrustedIdentity = Depends(get_current_user_context),
):
    """
    Applies human-verified document extraction into production acquisition case,
    generates statutory limitation clocks, updates Action Center, and syncs CPM.
    """
    officer_user = require_officer_or_admin(identity)
    return await document_intelligence_service.apply_to_acquisition_workflow(
        doc_id=document_id,
        officer_user=officer_user,
        db=db,
    )
