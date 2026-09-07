"""
Deterministic Mock Speech Provider for Offline Tests & Demonstrations
SIH26016 Land Acquisition Platform - KOSH
"""
import base64
from typing import Optional
from app.services.voice.base import STTProvider, TTSProvider


class MockSTTProvider(STTProvider):
    """Deterministic Speech-to-Text mock."""

    async def transcribe(self, audio_bytes: bytes, audio_format: str = "webm", language: str = "en") -> str:
        # If text header encoded in mock audio bytes, decode it
        try:
            if audio_bytes.startswith(b"MOCK_SPEECH:"):
                return audio_bytes.decode("utf-8").replace("MOCK_SPEECH:", "").strip()
        except Exception:
            pass

        # Fallback default high-value query for simulation
        return "Why is this parcel high risk and what is blocking corridor possession?"


class MockTTSProvider(TTSProvider):
    """Deterministic Text-to-Speech mock generating valid RIFF WAV audio container."""

    async def synthesize(self, text: str, voice: Optional[str] = "neutral") -> bytes:
        # Generate minimal 44-byte valid PCM WAV header for browser audio element compatibility
        sample_rate = 16000
        num_channels = 1
        bits_per_sample = 16
        byte_rate = sample_rate * num_channels * bits_per_sample // 8
        block_align = num_channels * bits_per_sample // 8
        data_size = 1600  # 0.1s of silence/tone

        header = bytearray()
        header.extend(b"RIFF")
        header.extend((data_size + 36).to_bytes(4, "little"))
        header.extend(b"WAVE")
        header.extend(b"fmt ")
        header.extend((16).to_bytes(4, "little"))  # Subchunk1Size
        header.extend((1).to_bytes(2, "little"))   # AudioFormat (PCM)
        header.extend(num_channels.to_bytes(2, "little"))
        header.extend(sample_rate.to_bytes(4, "little"))
        header.extend(byte_rate.to_bytes(4, "little"))
        header.extend(block_align.to_bytes(2, "little"))
        header.extend(bits_per_sample.to_bytes(2, "little"))
        header.extend(b"data")
        header.extend(data_size.to_bytes(4, "little"))
        header.extend(b"\x00" * data_size)

        return bytes(header)
