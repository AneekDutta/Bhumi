import uuid
import hashlib
import httpx
from typing import Optional
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.domain import Document, DocumentVersion, Parcel
from app.schemas.domain import DocumentCreate
from app.services.authorization import AuthorizationService
from app.services.audit import log_transition
from app.api.deps import TrustedIdentity
from app.core.config import settings

ALLOWED_MIME_TYPES = {"application/pdf", "image/jpeg", "image/png"}
ALLOWED_EXTENSIONS = {".pdf", ".jpeg", ".jpg", ".png"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50MB

PDF_MAGIC = b"%PDF-"
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
JPEG_MAGIC = b"\xff\xd8\xff"

class DocumentService:

    @staticmethod
    async def _compute_sha256(file: UploadFile) -> str:
        sha256_hash = hashlib.sha256()
        await file.seek(0)
        while chunk := await file.read(8192):
            sha256_hash.update(chunk)
        await file.seek(0)
        return sha256_hash.hexdigest()

    @staticmethod
    async def _verify_magic_bytes(file: UploadFile, mime_type: str):
        await file.seek(0)
        header = await file.read(8)
        await file.seek(0)

        if mime_type == "application/pdf" and not header.startswith(PDF_MAGIC):
            raise HTTPException(status_code=400, detail="Invalid file signature: Expected PDF")
        elif mime_type == "image/png" and not header.startswith(PNG_MAGIC):
            raise HTTPException(status_code=400, detail="Invalid file signature: Expected PNG")
        elif mime_type in ("image/jpeg", "image/jpg") and not header.startswith(JPEG_MAGIC):
            raise HTTPException(status_code=400, detail="Invalid file signature: Expected JPEG")

    @staticmethod
    async def _upload_to_supabase(storage_path: str, file: UploadFile, mime_type: str):
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise HTTPException(status_code=500, detail="Storage is not configured.")

        await file.seek(0)
        content = await file.read()

        url = f"{settings.SUPABASE_URL}/storage/v1/object/{settings.STORAGE_BUCKET_NAME}/{storage_path}"
        headers = {
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": mime_type
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(url, headers=headers, content=content)
            if resp.status_code >= 400:
                raise HTTPException(status_code=502, detail=f"Failed to upload document to storage: {resp.text}")

    @staticmethod
    async def _delete_from_supabase(storage_path: str):
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            return
        url = f"{settings.SUPABASE_URL}/storage/v1/object/{settings.STORAGE_BUCKET_NAME}/{storage_path}"
        headers = {
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}"
        }
        async with httpx.AsyncClient() as client:
            await client.delete(url, headers=headers)

    @staticmethod
    async def _get_signed_url(storage_path: str) -> str:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise HTTPException(status_code=500, detail="Storage is not configured.")

        url = f"{settings.SUPABASE_URL}/storage/v1/object/sign/{settings.STORAGE_BUCKET_NAME}/{storage_path}"
        headers = {
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json"
        }
        payload = {"expiresIn": 3600}

        async with httpx.AsyncClient() as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code >= 400:
                raise HTTPException(status_code=502, detail="Failed to generate download URL")
            data = resp.json()
            return f"{settings.SUPABASE_URL}/storage/v1{data['signedURL']}"

    @classmethod
    async def upload_document(
        cls,
        db: AsyncSession,
        user: TrustedIdentity,
        data: DocumentCreate,
        file: UploadFile
    ) -> Document:
        if data.acquisition_case_id:
            from app.models.domain import AcquisitionCase
            acq_case = await db.get(AcquisitionCase, data.acquisition_case_id)
            if not acq_case:
                raise HTTPException(status_code=404, detail="Acquisition case not found")
            if data.parcel_id and str(acq_case.parcel_id) != str(data.parcel_id):
                raise HTTPException(status_code=400, detail="Mismatched acquisition case and parcel associations")
            data.parcel_id = acq_case.parcel_id

        if data.parcel_id:
            parcel = await db.get(Parcel, data.parcel_id)
            if not parcel:
                raise HTTPException(status_code=404, detail="Parcel not found")
            if data.project_id and str(parcel.project_id) != str(data.project_id):
                raise HTTPException(status_code=400, detail="Mismatched parcel and project associations")
            data.project_id = parcel.project_id

        if not data.project_id:
            raise HTTPException(status_code=400, detail="Project ID, Parcel ID, or Case ID is required to authorize document upload.")

        await AuthorizationService.verify_project_access(user, str(data.project_id), db)

        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(status_code=400, detail="Unsupported file type.")

        ext = ""
        if file.filename:
            ext = "." + file.filename.split(".")[-1].lower()
            if ext not in ALLOWED_EXTENSIONS and ext != ".":
                raise HTTPException(status_code=400, detail="Unsupported file extension.")

        await cls._verify_magic_bytes(file, file.content_type)

        file_size = 0
        await file.seek(0)
        while chunk := await file.read(8192):
            file_size += len(chunk)
            if file_size > MAX_FILE_SIZE_BYTES:
                raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB.")

        sha256 = await cls._compute_sha256(file)

        doc_id = uuid.uuid4()
        new_doc = Document(
            id=doc_id,
            project_id=data.project_id,
            parcel_id=data.parcel_id,
            acquisition_case_id=data.acquisition_case_id,
            title=data.title,
            description=data.description,
            document_type=data.document_type,
            current_version=1,
            status="ACTIVE"
        )
        db.add(new_doc)

        storage_path = f"projects/{data.project_id or 'parcel-' + str(data.parcel_id)}/documents/{doc_id}/v1{ext}"

        new_version = DocumentVersion(
            id=uuid.uuid4(),
            document_id=doc_id,
            version_number=1,
            storage_path=storage_path,
            original_filename=file.filename or "unknown",
            mime_type=file.content_type,
            size_bytes=file_size,
            sha256_hash=sha256,
            uploaded_by_id=user.user_id,
            uploaded_by_role=user.role
        )
        db.add(new_version)

        await log_transition(
            db=db,
            entity_type="DOCUMENT",
            entity_id=doc_id,
            action="UPLOAD",
            actor_id=user.user_id,
            actor_role=user.role,
            state_before={},
            state_after={"title": data.title, "version": 1}
        )

        try:
            await cls._upload_to_supabase(storage_path, file, file.content_type)
        except Exception as e:
            await db.rollback()
            raise HTTPException(status_code=502, detail="Storage failed. Transaction rolled back.")

        try:
            await db.commit()
            await db.refresh(new_doc)
        except Exception as e:
            await db.rollback()
            # Try to cleanup orphaned object
            await cls._delete_from_supabase(storage_path)
            raise HTTPException(status_code=500, detail="Database persistence failed. Upload cleaned up.")

        return new_doc

    @classmethod
    async def add_version(
        cls,
        db: AsyncSession,
        user: TrustedIdentity,
        document_id: str,
        file: UploadFile
    ) -> Document:
        doc = await db.get(Document, uuid.UUID(document_id))
        if not doc or doc.status != "ACTIVE":
            raise HTTPException(status_code=404, detail="Document not found")

        if doc.project_id:
            await AuthorizationService.verify_project_access(user, str(doc.project_id), db)
        elif doc.parcel_id:
            parcel = await db.get(Parcel, doc.parcel_id)
            if not parcel:
                raise HTTPException(status_code=404, detail="Parcel not found")
            await AuthorizationService.verify_project_access(user, str(parcel.project_id), db)

        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(status_code=400, detail="Unsupported file type.")

        await cls._verify_magic_bytes(file, file.content_type)

        file_size = 0
        await file.seek(0)
        while chunk := await file.read(8192):
            file_size += len(chunk)
            if file_size > MAX_FILE_SIZE_BYTES:
                raise HTTPException(status_code=413, detail="File too large.")

        sha256 = await cls._compute_sha256(file)

        next_version = doc.current_version + 1
        ext = "." + file.filename.split(".")[-1].lower() if file.filename else ""
        storage_path = f"projects/{doc.project_id or 'parcel-' + str(doc.parcel_id)}/documents/{doc.id}/v{next_version}{ext}"

        new_version = DocumentVersion(
            id=uuid.uuid4(),
            document_id=doc.id,
            version_number=next_version,
            storage_path=storage_path,
            original_filename=file.filename or "unknown",
            mime_type=file.content_type,
            size_bytes=file_size,
            sha256_hash=sha256,
            uploaded_by_id=user.user_id,
            uploaded_by_role=user.role
        )
        db.add(new_version)

        doc.current_version = next_version

        await log_transition(
            db=db,
            entity_type="DOCUMENT",
            entity_id=doc.id,
            action="VERSION_CREATE",
            actor_id=user.user_id,
            actor_role=user.role,
            state_before={"version": doc.current_version - 1},
            state_after={"version": next_version}
        )

        try:
            await cls._upload_to_supabase(storage_path, file, file.content_type)
        except Exception as e:
            await db.rollback()
            raise HTTPException(status_code=502, detail="Storage failed. Transaction rolled back.")

        try:
            await db.commit()
            await db.refresh(doc)
        except Exception as e:
            await db.rollback()
            await cls._delete_from_supabase(storage_path)
            raise HTTPException(status_code=500, detail="Database persistence failed. Upload cleaned up.")

        return doc

    @classmethod
    async def get_document(cls, db: AsyncSession, user: TrustedIdentity, document_id: str) -> Document:
        query = select(Document).where(Document.id == uuid.UUID(document_id))
        result = await db.execute(query)
        doc = result.scalars().first()
        if not doc or doc.status != "ACTIVE":
            raise HTTPException(status_code=404, detail="Document not found")

        if doc.project_id:
            await AuthorizationService.verify_project_access(user, str(doc.project_id), db)
        elif doc.parcel_id:
            parcel = await db.get(Parcel, doc.parcel_id)
            if not parcel:
                raise HTTPException(status_code=404, detail="Parcel not found")
            await AuthorizationService.verify_project_access(user, str(parcel.project_id), db)

        v_query = select(DocumentVersion).where(DocumentVersion.document_id == doc.id).order_by(DocumentVersion.version_number.desc())
        v_result = await db.execute(v_query)
        doc.versions = v_result.scalars().all()
        return doc

    @classmethod
    async def list_documents(cls, db: AsyncSession, user: TrustedIdentity, project_id: Optional[str] = None, parcel_id: Optional[str] = None) -> list[Document]:
        if project_id:
            await AuthorizationService.verify_project_access(user, project_id, db)
            query = select(Document).where(Document.project_id == uuid.UUID(project_id), Document.status == "ACTIVE")
        elif parcel_id:
            parcel = await db.get(Parcel, uuid.UUID(parcel_id))
            if not parcel:
                raise HTTPException(status_code=404, detail="Parcel not found")
            await AuthorizationService.verify_project_access(user, str(parcel.project_id), db)
            query = select(Document).where(Document.parcel_id == uuid.UUID(parcel_id), Document.status == "ACTIVE")
        else:
            if user.role == "ADMIN" and not user.assigned_project_id and not user.assigned_district_id:
                query = select(Document).where(Document.status == "ACTIVE")
            elif user.assigned_project_id:
                query = select(Document).where(Document.project_id == uuid.UUID(user.assigned_project_id), Document.status == "ACTIVE")
            elif user.assigned_district_id:
                from app.models.domain import Project, Village
                subq = select(Project.id).join(Parcel, Parcel.project_id == Project.id).join(Village, Village.id == Parcel.village_id).where(Village.district_id == uuid.UUID(user.assigned_district_id))
                query = select(Document).where(Document.project_id.in_(subq), Document.status == "ACTIVE")
            else:
                raise HTTPException(status_code=403, detail="Forbidden: Insufficient privileges to list all documents")

        result = await db.execute(query)
        docs = result.scalars().all()

        for doc in docs:
            v_query = select(DocumentVersion).where(DocumentVersion.document_id == doc.id).order_by(DocumentVersion.version_number.desc())
            v_result = await db.execute(v_query)
            doc.versions = v_result.scalars().all()

        return docs

    @classmethod
    async def delete_document(cls, db: AsyncSession, user: TrustedIdentity, document_id: str):
        AuthorizationService.verify_mutation_access(user)

        doc = await db.get(Document, uuid.UUID(document_id))
        if not doc or doc.status == "DELETED":
            raise HTTPException(status_code=404, detail="Document not found")

        if doc.project_id:
            await AuthorizationService.verify_project_access(user, str(doc.project_id), db)
        elif doc.parcel_id:
            parcel = await db.get(Parcel, doc.parcel_id)
            if not parcel:
                raise HTTPException(status_code=404, detail="Parcel not found")
            await AuthorizationService.verify_project_access(user, str(parcel.project_id), db)

        doc.status = "DELETED"
        await log_transition(
            db=db,
            entity_type="DOCUMENT",
            entity_id=doc.id,
            action="DELETE",
            actor_id=user.user_id,
            actor_role=user.role,
            state_before={"status": "ACTIVE"},
            state_after={"status": "DELETED"}
        )
        await db.commit()

    @classmethod
    async def generate_download_url(cls, db: AsyncSession, user: TrustedIdentity, document_id: str, version_number: Optional[int] = None) -> str:
        doc = await db.get(Document, uuid.UUID(document_id))
        if not doc or doc.status != "ACTIVE":
            raise HTTPException(status_code=404, detail="Document not found")

        if doc.project_id:
            await AuthorizationService.verify_project_access(user, str(doc.project_id), db)
        elif doc.parcel_id:
            parcel = await db.get(Parcel, doc.parcel_id)
            if not parcel:
                raise HTTPException(status_code=404, detail="Parcel not found")
            await AuthorizationService.verify_project_access(user, str(parcel.project_id), db)

        target_version = version_number or doc.current_version

        v_query = select(DocumentVersion).where(DocumentVersion.document_id == doc.id, DocumentVersion.version_number == target_version)
        v_result = await db.execute(v_query)
        ver = v_result.scalars().first()

        if not ver:
            raise HTTPException(status_code=404, detail="Version not found")

        await log_transition(
            db=db,
            entity_type="DOCUMENT",
            entity_id=doc.id,
            action="DOWNLOAD",
            actor_id=user.user_id,
            actor_role=user.role,
            state_before={},
            state_after={"downloaded_version": target_version}
        )
        await db.commit()

        return await cls._get_signed_url(ver.storage_path)
