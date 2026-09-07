"""
Benchmark Script for Evaluator Critical Path
SIH26016 Land Acquisition Platform - KOSH
Measures end-to-end response latency for all 9 key evaluator path endpoints.
"""
import asyncio
import os
import sys
import time
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.services.ai.orchestration import ai_orchestration_service
from app.services.ai.providers.mock_provider import MockAIProvider
from app.services.sih26016_service import sih_service


BENCHMARK_ROUTES = [
    {
        "step": 1,
        "name": "Dashboard / Projects List",
        "method": "GET",
        "path": "/api/v1/sih26016/projects",
        "body": None,
    },
    {
        "step": 2,
        "name": "View Project Dossier (P-NH927A)",
        "method": "GET",
        "path": "/api/v1/sih26016/projects/P-NH927A",
        "body": None,
    },
    {
        "step": 3,
        "name": "Project Parcels Telemetry",
        "method": "GET",
        "path": "/api/v1/sih26016/projects/P-NH927A/parcels",
        "body": None,
    },
    {
        "step": 4,
        "name": "Parcel Dossier (P00001)",
        "method": "GET",
        "path": "/api/v1/sih26016/parcels/P00001",
        "body": None,
    },
    {
        "step": 5,
        "name": "Statutory Deadlines & Legal Rules",
        "method": "GET",
        "path": "/api/v1/deadlines/rules",
        "body": None,
    },
    {
        "step": 6,
        "name": "Impact / CPM Critical Path Topology",
        "method": "GET",
        "path": "/api/v1/impact/P-NH927A",
        "body": None,
    },
    {
        "step": 7,
        "name": "AI Assistant Query (Why High Risk?)",
        "method": "POST",
        "path": "/api/v1/assistant/query",
        "body": {"query": "Why is this parcel high risk?", "parcel_id": "P00001", "project_id": "P-NH927A"},
    },
    {
        "step": 8,
        "name": "Deterministic What-If Simulation",
        "method": "POST",
        "path": "/api/v1/assistant/what-if/simulate",
        "body": {"query": "What happens if the compensation issue is resolved?", "parcel_id": "P00001", "project_id": "P-NH927A"},
    },
    {
        "step": 9,
        "name": "Officer Action Center Recommendations",
        "method": "GET",
        "path": "/api/v1/officer-actions",
        "body": None,
    },
]


async def benchmark_evaluator_path():
    sih_service._load_data()
    sih_service._enrich_and_compute()

    # For deterministic benchmark latency testing, configure local mock
    original_provider = ai_orchestration_service.provider
    ai_orchestration_service.set_provider(MockAIProvider())

    transport = ASGITransport(app=app)
    headers = {
        "x-mock-role": "OFFICER",
        "x-mock-user-id": "OFF-001",
        "x-mock-project-id": "P-NH927A",
    }

    print("\n==========================================================================")
    print("  KOSH EVALUATOR CRITICAL PATH LATENCY BENCHMARK")
    print("==========================================================================")

    results = []
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Warmup
        await client.get("/sih26016/projects", headers=headers)

        for route in BENCHMARK_ROUTES:
            step = route["step"]
            name = route["name"]
            method = route["method"]
            path = route["path"]
            body = route["body"]

            times = []
            status_code = 0
            # Run 3 iterations to measure p50/avg
            for _ in range(3):
                t0 = time.perf_counter()
                if method == "GET":
                    res = await client.get(path, headers=headers)
                else:
                    res = await client.post(path, headers=headers, json=body)
                elapsed_ms = (time.perf_counter() - t0) * 1000
                times.append(elapsed_ms)
                status_code = res.status_code

            avg_ms = sum(times) / len(times)
            min_ms = min(times)
            results.append({
                "step": step,
                "name": name,
                "path": path,
                "status": status_code,
                "avg_ms": avg_ms,
                "min_ms": min_ms,
            })
            print(f"  Step {step}: {name:<42} | HTTP {status_code} | Avg: {avg_ms:6.2f}ms (Min: {min_ms:6.2f}ms)")

    ai_orchestration_service.set_provider(original_provider)

    total_avg = sum(r["avg_ms"] for r in results)
    print("--------------------------------------------------------------------------")
    print(f"  Total Evaluator Flow Accumulated Latency: {total_avg:6.2f}ms")
    print("==========================================================================\n")


if __name__ == "__main__":
    asyncio.run(benchmark_evaluator_path())
