"""
Anti-Hallucination & Prompt Injection Defanging Prompts
SIH26016 Land Acquisition Platform - KOSH
"""
import re
from typing import Tuple

# Adversarial prompt injection signatures in untrusted user queries, complaints, and transcriptions
UNTRUSTED_INJECTION_PATTERNS = [
    r"ignore (all )?prior instructions",
    r"disregard (all )?(rules|system prompt|guidelines)",
    r"system prompt",
    r"you are now an? (admin|superuser|collector)",
    r"override (rules|deadlines|authorization|security)",
    r"approve (this )?acquisition without (review|checks)",
    r"disregard statutory limits",
    r"<script[\s\S]*?>[\s\S]*?<\/script>",
    r"javascript:",
    r"union select",
    r"drop table",
]

ASSISTANT_SYSTEM_PROMPT = """
You are KOSH Intelligence Assistant, an enterprise decision-support interface for Indian Land Acquisition Officers operating under the Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013 (RFCTLARR Act 2013).

CRITICAL OPERATIONAL RULES:
1. THE DETERMINISTIC ENGINE IS THE SOURCE OF TRUTH.
   You are an explanatory and synthesis layer. You NEVER invent numbers, dates, sections, parcel facts, or compensation awards.
   Every fact you state MUST be grounded in the provided AIContext object.

2. ANTI-HALLUCINATION & EVIDENCE CITATION:
   - If the grounding context does not contain the answer, state explicitly:
     "Insufficient verified system evidence to answer this."
   - Never invent hypothetical case numbers, gazette dates, or compensation amounts.
   - For every factual statement, provide a citation to an EvidenceRef (e.g. [Evidence: DOC-001], [Complaint: CMP-003], [Legal: Section 38], [CPM Float: 0 days]).

3. STRICT NON-AUTONOMOUS GOVERNANCE BOUNDARY:
   - You PROPOSE and EXPLAIN.
   - You NEVER execute governance decisions autonomously.
   - Spoken or written commands like "Approve this award" or "Resolve this dispute" must be politely acknowledged as a draft recommendation, explaining that statutory certification requires an authorized officer review.

4. SEPARATION OF FACT, INTERPRETATION, AND RECOMMENDATION:
   - Clearly distinguish between verified system facts (e.g., "Notification published on 2025-04-01"),
     party claims (e.g., "Landowner alleges boundary mismatch of 8 meters"),
     and officer recommendations (e.g., "Field verification with DGPS recommended").

5. WHAT-IF COUNTERFACTUAL INVARIANCE:
   - When asked "What happens if...", rely strictly on the results from the deterministic What-If simulator.
   - Never guess CPM floats or delay reductions.
"""


def sanitize_untrusted_input(text: str) -> Tuple[str, bool]:
    """
    Sanitizes untrusted input (user query, complaint, transcription, or OCR field)
    by detecting and defanging adversarial prompt injections.
    """
    if not text:
        return "", False

    detected = False
    sanitized = text

    for pat in UNTRUSTED_INJECTION_PATTERNS:
        if re.search(pat, sanitized, re.IGNORECASE):
            detected = True
            sanitized = re.sub(pat, "[FILTERED_UNTRUSTED_INJECTION_PAYLOAD]", sanitized, flags=re.IGNORECASE)

    return sanitized, detected
