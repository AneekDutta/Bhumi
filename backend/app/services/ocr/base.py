"""
Base OCR Provider Interface
SIH26016 Land Acquisition Digital Twin Platform
"""
from abc import ABC, abstractmethod
from app.schemas.document_intelligence import OCROutput


class OCRProvider(ABC):
    @property
    @abstractmethod
    def provider_id(self) -> str:
        pass

    @property
    @abstractmethod
    def model_version(self) -> str:
        pass

    @abstractmethod
    async def extract_text(self, file_bytes: bytes, filename: str, mime_type: str, document_hash: str) -> OCROutput:
        """
        Extracts full text, page layouts, blocks, bounding boxes, and confidence scores from raw document bytes.
        """
        pass
