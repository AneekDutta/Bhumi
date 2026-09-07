"""
Mock OCR Provider
Generates realistic, deterministic OCR outputs with layout bounding boxes and confidence scores
for testing and offline demo execution.
"""
from datetime import datetime, timezone
from app.schemas.document_intelligence import BoundingBox, OCRBlock, OCROutput, OCRPage
from app.services.ocr.base import OCRProvider


class MockOCRProvider(OCRProvider):
    @property
    def provider_id(self) -> str:
        return "MOCK_STATUTORY_OCR"

    @property
    def model_version(self) -> str:
        return "v2.4.0-mock-statutory"

    async def extract_text(self, file_bytes: bytes, filename: str, mime_type: str, document_hash: str) -> OCROutput:
        fname = filename.lower()
        if "sec11" in fname or "notification" in fname:
            sample_text = (
                "EXTRAORDINARY GAZETTE OF RAJASTHAN\n"
                "NOTIFICATION UNDER SECTION 11(1) OF THE RFCTLARR ACT, 2013\n"
                "Notification No: F.1(4)Rev/Gr.1/2025/NH-927A/11\n"
                "Dated: 15-05-2025\n"
                "Project: Four Laning of NH-927A Corridor (Salumbar-Banswara Section)\n"
                "District: Salumbar, Tehsil: Salumbar\n"
                "Villages: Kishanpura, Chandwas, Devpura\n"
                "Survey Numbers: SY-101, SY-102, SY-103, SY-104/1, SY-105\n"
                "Total Area: 14.8500 Hectares\n"
                "Public Purpose: Infrastructure Corridor Right-of-Way Construction"
            )
            blocks = [
                OCRBlock(text="EXTRAORDINARY GAZETTE OF RAJASTHAN", confidence=0.99, bbox=BoundingBox(ymin=0.05, xmin=0.2, ymax=0.09, xmax=0.8)),
                OCRBlock(text="NOTIFICATION UNDER SECTION 11(1) OF THE RFCTLARR ACT, 2013", confidence=0.98, bbox=BoundingBox(ymin=0.10, xmin=0.15, ymax=0.14, xmax=0.85)),
                OCRBlock(text="Notification No: F.1(4)Rev/Gr.1/2025/NH-927A/11", confidence=0.97, bbox=BoundingBox(ymin=0.16, xmin=0.1, ymax=0.20, xmax=0.65)),
                OCRBlock(text="Dated: 15-05-2025", confidence=0.99, bbox=BoundingBox(ymin=0.22, xmin=0.1, ymax=0.26, xmax=0.4)),
                OCRBlock(text="Project: Four Laning of NH-927A Corridor", confidence=0.96, bbox=BoundingBox(ymin=0.28, xmin=0.1, ymax=0.32, xmax=0.75)),
                OCRBlock(text="District: Salumbar, Tehsil: Salumbar", confidence=0.95, bbox=BoundingBox(ymin=0.34, xmin=0.1, ymax=0.38, xmax=0.6)),
                OCRBlock(text="Villages: Kishanpura, Chandwas, Devpura", confidence=0.94, bbox=BoundingBox(ymin=0.40, xmin=0.1, ymax=0.44, xmax=0.65)),
                OCRBlock(text="Survey Numbers: SY-101, SY-102, SY-103, SY-104/1, SY-105", confidence=0.93, bbox=BoundingBox(ymin=0.46, xmin=0.1, ymax=0.50, xmax=0.85)),
                OCRBlock(text="Total Area: 14.8500 Hectares", confidence=0.96, bbox=BoundingBox(ymin=0.52, xmin=0.1, ymax=0.56, xmax=0.5)),
            ]
        elif "award" in fname:
            sample_text = (
                "OFFICE OF THE COMPETENT AUTHORITY FOR LAND ACQUISITION (CALA)\n"
                "AWARD STATEMENT UNDER SECTION 23 / 25 RFCTLARR ACT, 2013\n"
                "Award No: CALA/NH-927A/AWD/2025/08\n"
                "Award Date: 12-08-2025\n"
                "Parcel ID: P00001, Survey No: SY-101\n"
                "Landowner: Rameshwar Lal s/o Hariram\n"
                "Area: 0.4500 Hectares\n"
                "Base Market Value: Rs 12,00,000\n"
                "Multiplier Factor: 1.50\n"
                "Total Market Value: Rs 18,00,000\n"
                "Asset / Structure Damages: Rs 1,50,000\n"
                "Solatium (100%): Rs 19,50,000\n"
                "Section 30(3) Additional Interest: Rs 96,000\n"
                "Total Compensation Awarded: Rs 39,96,000"
            )
            blocks = [
                OCRBlock(text="AWARD STATEMENT UNDER SECTION 23 / 25 RFCTLARR ACT, 2013", confidence=0.98, bbox=BoundingBox(ymin=0.08, xmin=0.15, ymax=0.12, xmax=0.85)),
                OCRBlock(text="Award No: CALA/NH-927A/AWD/2025/08", confidence=0.97, bbox=BoundingBox(ymin=0.14, xmin=0.1, ymax=0.18, xmax=0.6)),
                OCRBlock(text="Award Date: 12-08-2025", confidence=0.99, bbox=BoundingBox(ymin=0.20, xmin=0.1, ymax=0.24, xmax=0.4)),
                OCRBlock(text="Parcel ID: P00001, Survey No: SY-101", confidence=0.96, bbox=BoundingBox(ymin=0.26, xmin=0.1, ymax=0.30, xmax=0.6)),
                OCRBlock(text="Landowner: Rameshwar Lal s/o Hariram", confidence=0.95, bbox=BoundingBox(ymin=0.32, xmin=0.1, ymax=0.36, xmax=0.65)),
                OCRBlock(text="Total Market Value: Rs 18,00,000", confidence=0.94, bbox=BoundingBox(ymin=0.38, xmin=0.1, ymax=0.42, xmax=0.55)),
                OCRBlock(text="Solatium (100%): Rs 19,50,000", confidence=0.95, bbox=BoundingBox(ymin=0.44, xmin=0.1, ymax=0.48, xmax=0.55)),
                OCRBlock(text="Total Compensation Awarded: Rs 39,96,000", confidence=0.99, bbox=BoundingBox(ymin=0.52, xmin=0.1, ymax=0.56, xmax=0.65)),
            ]
        elif "stay" in fname or "order" in fname or "court" in fname:
            sample_text = (
                "IN THE HIGH COURT OF JUDICATURE FOR RAJASTHAN AT JAIPUR\n"
                "D.B. Civil Writ Petition No. 7842/2025\n"
                "Petitioner: Kalyan Singh vs State of Rajasthan & NHAI\n"
                "Order Date: 10-06-2025\n"
                "Operative Direction: It is hereby directed that dispossession and felling of standing trees "
                "on Khasra No. 101, Village Kishanpura shall remain stayed until next date of hearing.\n"
                "Stay Vacated Date: 25-08-2025\n"
                "Interim Stay Duration: 76 Calendar Days"
            )
            blocks = [
                OCRBlock(text="IN THE HIGH COURT OF JUDICATURE FOR RAJASTHAN AT JAIPUR", confidence=0.99, bbox=BoundingBox(ymin=0.08, xmin=0.1, ymax=0.12, xmax=0.9)),
                OCRBlock(text="D.B. Civil Writ Petition No. 7842/2025", confidence=0.98, bbox=BoundingBox(ymin=0.14, xmin=0.1, ymax=0.18, xmax=0.6)),
                OCRBlock(text="Order Date: 10-06-2025", confidence=0.99, bbox=BoundingBox(ymin=0.20, xmin=0.1, ymax=0.24, xmax=0.4)),
                OCRBlock(text="Khasra No. 101, Village Kishanpura shall remain stayed", confidence=0.96, bbox=BoundingBox(ymin=0.26, xmin=0.1, ymax=0.32, xmax=0.85)),
                OCRBlock(text="Stay Vacated Date: 25-08-2025", confidence=0.94, bbox=BoundingBox(ymin=0.34, xmin=0.1, ymax=0.38, xmax=0.5)),
            ]
        else:
            sample_text = (
                f"OFFICIAL DOCUMENT: {filename}\n"
                f"Source Hash: {document_hash[:16]}...\n"
                "Standard cadastral and revenue acquisition record."
            )
            blocks = [
                OCRBlock(text=f"OFFICIAL DOCUMENT: {filename}", confidence=0.92, bbox=BoundingBox(ymin=0.1, xmin=0.1, ymax=0.15, xmax=0.8)),
            ]

        pages = [
            OCRPage(
                page_number=1,
                width=612.0,
                height=792.0,
                text=sample_text,
                blocks=blocks
            )
        ]

        return OCROutput(
            document_hash=document_hash,
            provider=self.provider_id,
            model_version=self.model_version,
            pages=pages,
            full_text=sample_text,
            average_confidence=0.965,
            processing_timestamp=datetime.now(timezone.utc).isoformat()
        )
