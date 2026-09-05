import uuid
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import ValidationError

from app.core.database import get_db
from app.api.deps import get_current_user_context, TrustedIdentity
from app.schemas.domain import DocumentRead, DocumentCreate
from app.services.document_service import DocumentService

router = APIRouter()

@router.post("/", response_model=DocumentRead)
async def create_document(
    metadata: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: TrustedIdentity = Depends(get_current_user_context)
):
    try:
        data_dict = json.loads(metadata)
        data = DocumentCreate(**data_dict)
    except (json.JSONDecodeError, ValidationError) as e:
        raise HTTPException(status_code=400, detail="Invalid metadata format")

    return await DocumentService.upload_document(db, user, data, file)

@router.get("/", response_model=List[DocumentRead])
async def list_documents(
    project_id: Optional[str] = None,
    parcel_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: TrustedIdentity = Depends(get_current_user_context)
):
    return await DocumentService.list_documents(db, user, project_id, parcel_id)

@router.get("/{document_id}", response_model=DocumentRead)
async def get_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    user: TrustedIdentity = Depends(get_current_user_context)
):
    return await DocumentService.get_document(db, user, document_id)

@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    user: TrustedIdentity = Depends(get_current_user_context)
):
    await DocumentService.delete_document(db, user, document_id)
    return Response(status_code=204)

@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    version: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    user: TrustedIdentity = Depends(get_current_user_context)
):
    url = await DocumentService.generate_download_url(db, user, document_id, version)
    return {"download_url": url}

@router.post("/{document_id}/versions", response_model=DocumentRead)
async def add_document_version(
    document_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: TrustedIdentity = Depends(get_current_user_context)
):
    return await DocumentService.add_version(db, user, document_id, file)
