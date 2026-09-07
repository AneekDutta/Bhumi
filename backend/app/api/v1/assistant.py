"""
FastAPI Router for KOSH Intelligence Assistant & Voice Interface
SIH26016 Land Acquisition Platform - KOSH
"""
import base64
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import TrustedIdentity, get_current_user_context
from app.core.database import get_db
from app.services.ai.orchestration import ai_orchestration_service
from app.services.ai.schemas import (
    AIAssistantQueryRequest,
    AIAnswer,
    DisputeSummary,
    NLWhatIfResult,
    RecommendedAction,
    VoiceSynthesisRequest,
    VoiceSynthesisResponse,
    VoiceTranscriptionResponse,
)
from app.services.voice.service import voice_assistant_service

router = APIRouter()


class ParcelScopedRequest(BaseModel):
    parcel_id: str = Field(..., description="Target parcel identifier (e.g. P00003)")
    project_id: Optional[str] = Field("P-NH927A", description="Corridor project identifier")


class WhatIfNLRequest(BaseModel):
    query: str = Field(..., description="Natural language counterfactual question (e.g. 'What if compensation is cleared?')")
    parcel_id: Optional[str] = None
    project_id: Optional[str] = "P-NH927A"


PREDEFINED_INTENTS = [
    {
        "id": "why_high_risk",
        "label": "Why is this parcel high risk?",
        "query": "Why is this parcel high risk?",
        "category": "EXPLAINABLE_RISK",
        "description": "Explains causal triggers, Section 38 prerequisites, and CPM zero-float bottlenecks."
    },
    {
        "id": "summarize_dispute",
        "label": "Summarize this dispute",
        "query": "Summarize this dispute and chronology.",
        "category": "DISPUTE_INTELLIGENCE",
        "description": "Produces evidence-grounded chronology, facts vs claims, and missing evidence checklist."
    },
    {
        "id": "available_actions",
        "label": "What actions can we take?",
        "query": "What actions are available to resolve this blocker?",
        "category": "RESOLUTION_ASSISTANT",
        "description": "Identifies executable administrative options tied to authorized workflows."
    },
    {
        "id": "whatif_compensation",
        "label": "What if compensation is resolved?",
        "query": "What happens if the compensation issue is resolved?",
        "category": "WHAT_IF_SIMULATION",
        "description": "Runs deterministic CPM counterfactual simulation and calculates corridor delay reduction."
    },
    {
        "id": "sec_38_requirements",
        "label": "What does Section 38 require here?",
        "query": "What does Section 38 require before physical possession?",
        "category": "STATUTORY_LAW",
        "description": "Explains legal condition precedent under Section 38(1) & (2) with India Code citations."
    },
    {
        "id": "at_risk_deadlines",
        "label": "Which deadlines are currently at risk?",
        "query": "What statutory deadlines are currently at risk or breaching?",
        "category": "STATUTORY_CLOCKS",
        "description": "Evaluates Section 15, 19(7), and 25 limitation clocks and mandatory lapse exposure."
    },
]


@router.get("/intents", response_model=List[Dict[str, Any]])
async def list_predefined_intents():
    """Returns curated high-value query catalog for quick one-click officer execution."""
    return PREDEFINED_INTENTS


@router.post("/query", response_model=AIAnswer)
async def ask_assistant(
    req: AIAssistantQueryRequest,
    db: AsyncSession = Depends(get_db),
    identity: TrustedIdentity = Depends(get_current_user_context),
):
    """
    Submits a natural language query to the grounded KOSH Assistant.
    Enforces tenant scoping, data minimization, and evidence citation.
    """
    return await ai_orchestration_service.ask(
        query=req.query,
        parcel_id=req.parcel_id,
        project_id=req.project_id,
        complaint_id=req.complaint_id,
        include_whatif=req.include_whatif,
        user=identity,
        db=db,
    )


@router.post("/dispute/summarize", response_model=DisputeSummary)
async def summarize_parcel_dispute(
    req: ParcelScopedRequest,
    db: AsyncSession = Depends(get_db),
    identity: TrustedIdentity = Depends(get_current_user_context),
):
    """
    Generates structured, evidence-grounded dispute summary with strict separation
    between Facts, Claimant Claims, and Recommendations.
    """
    return await ai_orchestration_service.summarize_dispute(
        parcel_id=req.parcel_id,
        project_id=req.project_id,
        user=identity,
        db=db,
    )


@router.post("/resolution/recommend", response_model=List[RecommendedAction])
async def recommend_resolutions(
    req: ParcelScopedRequest,
    db: AsyncSession = Depends(get_db),
    identity: TrustedIdentity = Depends(get_current_user_context),
):
    """
    Identifies available, executable officer actions tied to existing system workflows.
    """
    return await ai_orchestration_service.recommend_actions(
        parcel_id=req.parcel_id,
        project_id=req.project_id,
        user=identity,
        db=db,
    )


@router.post("/what-if/simulate", response_model=NLWhatIfResult)
async def simulate_whatif_nl(
    req: WhatIfNLRequest,
    db: AsyncSession = Depends(get_db),
    identity: TrustedIdentity = Depends(get_current_user_context),
):
    """
    Translates natural language scenario into deterministic What-If parameters,
    runs the existing WhatIfSimulator, and produces an explainable diff.
    """
    return await ai_orchestration_service.simulate_whatif_nl(
        query=req.query,
        parcel_id=req.parcel_id,
        project_id=req.project_id,
        user=identity,
        db=db,
    )


@router.post("/voice/transcribe", response_model=VoiceTranscriptionResponse)
async def transcribe_voice(
    file: Optional[UploadFile] = File(None),
    audio_base64: Optional[str] = Form(None),
    audio_format: str = Form("webm"),
    language: str = Form("en"),
    identity: TrustedIdentity = Depends(get_current_user_context),
):
    """
    Transcribes spoken officer query and defangs any prompt injection payloads.
    Voice input is treated as untrusted user input.
    """
    audio_bytes = b""
    if file:
        audio_bytes = await file.read()
    elif audio_base64:
        try:
            audio_bytes = base64.b64decode(audio_base64)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid audio base64 payload.")

    if not audio_bytes:
        # Generate default demonstration query
        audio_bytes = b"MOCK_SPEECH:Why is this parcel high risk and what is blocking corridor possession?"

    return await voice_assistant_service.transcribe_audio(
        audio_bytes=audio_bytes,
        audio_format=audio_format,
        language=language,
    )


@router.post("/voice/synthesize", response_model=VoiceSynthesisResponse)
async def synthesize_voice(
    req: VoiceSynthesisRequest,
    identity: TrustedIdentity = Depends(get_current_user_context),
):
    """
    Synthesizes assistant answer into spoken audio (WAV container).
    """
    return await voice_assistant_service.synthesize_speech(
        text=req.text,
        voice=req.voice or "neutral",
    )
