"""
Abstract Interfaces for Speech-to-Text (STT) and Text-to-Speech (TTS)
SIH26016 Land Acquisition Platform - KOSH
"""
from abc import ABC, abstractmethod
from typing import Optional


class STTProvider(ABC):
    @abstractmethod
    async def transcribe(self, audio_bytes: bytes, audio_format: str = "webm", language: str = "en") -> str:
        """Converts audio stream or file into text."""
        pass


class TTSProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, voice: Optional[str] = "neutral") -> bytes:
        """Synthesizes text into spoken audio bytes."""
        pass
