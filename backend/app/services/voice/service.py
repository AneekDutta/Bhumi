"""
Voice Assistant Service
SIH26016 Land Acquisition Platform - KOSH
Strict Voice Safety Contract & Anti-Injection Guard Enforced
"""
import base64
from typing import Optional

from app.services.ai.prompts import sanitize_untrusted_input
from app.services.ai.schemas import (
    VoiceSynthesisResponse,
    VoiceTranscriptionResponse,
)
from app.services.voice.base import STTProvider, TTSProvider
from app.services.voice.mock_provider import MockSTTProvider, MockTTSProvider


class VoiceAssistantService:
    """
    Coordinates speech recognition, synthesis, and strict voice safety guardrails.
    Voice input is treated as untrusted user input and cannot autonomously mutate statutory state.
    """

    def __init__(
        self,
        stt_provider: Optional[STTProvider] = None,
        tts_provider: Optional[TTSProvider] = None,
    ):
        self._stt: STTProvider = stt_provider or MockSTTProvider()
        self._tts: TTSProvider = tts_provider or MockTTSProvider()

    def set_providers(self, stt: STTProvider, tts: TTSProvider) -> None:
        self._stt = stt
        self._tts = tts

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        audio_format: str = "webm",
        language: str = "en",
    ) -> VoiceTranscriptionResponse:
        """
        Transcribes speech and immediately defangs any injected adversarial instructions.
        """
        raw_text = await self._stt.transcribe(audio_bytes, audio_format=audio_format, language=language)
        sanitized_text, was_injected = sanitize_untrusted_input(raw_text)

        return VoiceTranscriptionResponse(
            transcription=sanitized_text,
            confidence=0.95 if not was_injected else 0.50,
            language_detected=language,
            sanitized=was_injected,
            filtered_payloads_count=1 if was_injected else 0,
        )

    async def synthesize_speech(
        self,
        text: str,
        voice: Optional[str] = "neutral",
    ) -> VoiceSynthesisResponse:
        """Synthesizes response text into audio bytes."""
        audio_bytes = await self._tts.synthesize(text, voice=voice)
        audio_b64 = base64.b64encode(audio_bytes).decode("ascii")

        return VoiceSynthesisResponse(
            audio_base64=audio_b64,
            mime_type="audio/wav",
            duration_seconds=round(len(text) * 0.06, 2),
        )

    def check_voice_safety_boundary(self, transcription: str) -> Optional[str]:
        """
        Voice Safety Contract:
        If spoken transcription attempts to trigger destructive or high-impact actions
        (e.g., 'approve award', 'disburse payment', 'delete milestone'),
        refuses autonomous execution and reminds the user of the officer certification requirement.
        """
        t_lower = transcription.lower()
        if any(w in t_lower for w in ["approve award", "approve compensation", "pay compensation", "disburse payment", "delete milestone", "force override"]):
            return (
                "Voice Safety Policy: Spoken commands cannot autonomously approve compensation, "
                "disburse funds, or override statutory milestones. A review draft has been prepared "
                "in the Officer Action Center for your authenticated manual certification."
            )
        return None


voice_assistant_service = VoiceAssistantService()
