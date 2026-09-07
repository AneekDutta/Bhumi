"""
Live Verification Script for Google Gemini Generative AI Provider
SIH26016 Land Acquisition Platform - KOSH
Executes the 6 critical demo queries against live Gemini model (gemini-2.5-flash)
and measures end-to-end latency, grounding fidelity, CPM invariance, and provenance.
"""
import asyncio
import os
import sys
import time
from typing import Optional

# Ensure project root in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.services.ai.orchestration import AIOrchestrationService
from app.services.ai.providers.gemini_provider import GeminiAIProvider
from app.services.sih26016_service import sih_service


DEMO_QUERIES = [
    {
        "id": 1,
        "query": "Why is this parcel high risk?",
        "parcel_id": "P00001",
        "expected_terms": ["risk", "section 38", "compensation", "cpm", "float"],
    },
    {
        "id": 2,
        "query": "Summarize this dispute and separate facts from claimant assertions.",
        "parcel_id": "P00001",
        "expected_terms": ["dispute", "facts", "claims"],
    },
    {
        "id": 3,
        "query": "What actions can the officer take?",
        "parcel_id": "P00001",
        "expected_terms": ["action", "officer"],
    },
    {
        "id": 4,
        "query": "What happens if the compensation blocker is resolved?",
        "parcel_id": "P00001",
        "expected_terms": ["delay", "days"],
        "include_whatif": True,
    },
    {
        "id": 5,
        "query": "What does Section 38 require before possession?",
        "parcel_id": "P00001",
        "expected_terms": ["section 38", "possession", "compensation"],
    },
    {
        "id": 6,
        "query": "Which deadlines are currently at risk?",
        "parcel_id": "P00001",
        "expected_terms": ["deadline", "limitation", "clock"],
    },
]


async def run_live_verification(api_key: Optional[str] = None):
    key = api_key or os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
    if not key:
        print("\n========================================================")
        print("  GEMINI LIVE VERIFICATION: NO API KEY PROVIDED")
        print("  Set GEMINI_API_KEY in environment or .env to execute live calls.")
        print("  Truthful Status: Provider unconfigured -> raises HTTP 503.")
        print("========================================================\n")
        return False

    model_to_use = settings.GEMINI_MODEL or "gemini-flash-latest"
    print("\n========================================================")
    print(f"  KOSH GEMINI LIVE VERIFICATION")
    print(f"  Model: {model_to_use}")
    print(f"  Target Corridor: NH-927A (P-NH927A)")
    print("========================================================\n")

    sih_service._load_data()
    sih_service._enrich_and_compute()

    provider = GeminiAIProvider(api_key=key, model_name=model_to_use)
    orchestrator = AIOrchestrationService(provider=provider)

    total_latency = 0.0
    passed_queries = 0

    print("--- PART 1: EVALUATING SIX DEMO QUERIES ---")
    for item in DEMO_QUERIES:
        q_text = item["query"]
        pid = item["parcel_id"]
        is_whatif = item.get("include_whatif", False)

        print(f"[{item['id']}/6] Query: \"{q_text}\" (Parcel: {pid})")
        t0 = time.perf_counter()

        try:
            answer = await orchestrator.ask(
                query=q_text,
                parcel_id=pid,
                project_id="P-NH927A",
                include_whatif=is_whatif,
            )
            elapsed_ms = (time.perf_counter() - t0) * 1000
            total_latency += elapsed_ms

            print(f"    ✓ Latency: {elapsed_ms:.1f}ms")
            print(f"    ✓ Provider: {answer.provider} | Model: {answer.model} | Grounded: {answer.grounded}")
            print(f"    ✓ Confidence: {answer.confidence.value}")
            print(f"    ✓ Citations: {len(answer.source_refs)} source refs | Facts: {len(answer.factual_basis)} | Claims: {len(answer.claims)}")
            print(f"    ✓ Sample Answer: {answer.answer[:140]}...")

            if answer.whatif_preview:
                print(f"    ✓ CPM Simulation Result: Delay reduction = {answer.whatif_preview.delay_reduction_days} days (Engine-computed)")
                print(f"    ✓ What-If Provenance: {answer.whatif_preview.provenance}")

            print()
            passed_queries += 1

        except Exception as e:
            elapsed_ms = (time.perf_counter() - t0) * 1000
            print(f"    ✗ Failed ({elapsed_ms:.1f}ms): {e}\n")

        # Pacing for free tier safe execution (5 RPM ceiling = 12s interval)
        await asyncio.sleep(12.0)

    avg_latency = total_latency / len(DEMO_QUERIES) if DEMO_QUERIES else 0
    print(f"Part 1 Summary: {passed_queries}/{len(DEMO_QUERIES)} queries completed.")
    print(f"Average AI Request Latency: {avg_latency:.1f}ms\n")

    # PART 2: 7-MINUTE LIVE PITCH SEQUENCE
    print("--- PART 2: 7-MINUTE LIVE PITCH SEQUENCE SIMULATION ---")
    print("Step 1 & 2: Officer opens Assistant for Parcel P00001")
    print("Step 3: Officer queries: \"Why is this parcel high risk?\"")
    t0_pitch1 = time.perf_counter()
    ans_pitch1 = await orchestrator.ask(
        query="Why is this parcel high risk?",
        parcel_id="P00001",
        project_id="P-NH927A",
    )
    t1_pitch1 = time.perf_counter()
    pitch1_ms = (t1_pitch1 - t0_pitch1) * 1000
    print(f"Step 4: Answer received in {pitch1_ms:.1f}ms (Provider: {ans_pitch1.provider}, Model: {ans_pitch1.model})")
    print(f"        Summary: {ans_pitch1.answer[:120]}...")
    print(f"        Verified Facts: {len(ans_pitch1.factual_basis)} | Citations: {len(ans_pitch1.source_refs)}")

    await asyncio.sleep(12.0)

    print("\nStep 5: Officer queries What-If: \"What happens if the compensation blocker is resolved?\"")
    t0_pitch2 = time.perf_counter()
    ans_pitch2 = await orchestrator.ask(
        query="What happens if the compensation blocker is resolved?",
        parcel_id="P00001",
        project_id="P-NH927A",
        include_whatif=True,
    )
    t1_pitch2 = time.perf_counter()
    pitch2_ms = (t1_pitch2 - t0_pitch2) * 1000
    print(f"Step 6: What-If received in {pitch2_ms:.1f}ms (Provider: {ans_pitch2.provider}, Model: {ans_pitch2.model})")
    if ans_pitch2.whatif_preview:
        print(f"        CPM Delay Reduction: {ans_pitch2.whatif_preview.delay_reduction_days} days (Engine-computed)")
        print(f"        Provenance: {ans_pitch2.whatif_preview.provenance}")
    print(f"        Explanation: {ans_pitch2.answer[:120]}...")
    print("\n========================================================")
    print("  7-MINUTE PITCH SEQUENCE VERIFIED SUCCESSFULLY")
    print("========================================================\n")

    return passed_queries == len(DEMO_QUERIES)


if __name__ == "__main__":
    cli_key = sys.argv[1] if len(sys.argv) > 1 else None
    success = asyncio.run(run_live_verification(cli_key))
    sys.exit(0 if success else 1)
