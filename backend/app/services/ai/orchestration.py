"""
AI Orchestration Service
SIH26016 Land Acquisition Platform - KOSH
Coordinates grounding, provider execution, deterministic What-If simulation, and audit logging.
"""
from datetime import datetime, timezone
import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import TrustedIdentity
from app.services.ai.grounding import grounding_service
from app.services.ai.prompts import sanitize_untrusted_input
from app.services.ai.providers.base import AIProvider
from app.services.ai.providers.mock_provider import MockAIProvider
from app.services.ai.schemas import (
    AIAnswer,
    AIContext,
    ConfidenceLevel,
    DisputeSummary,
    NLWhatIfResult,
    NLWhatIfScenario,
    RecommendedAction,
)
from app.services.sih26016_service import sih_service


class AIOrchestrationService:
    """
    Central orchestration service for the KOSH AI Assistant.
    Maintains strict separation between the deterministic engines and the explanation layer.
    """

    def __init__(self, provider: Optional[AIProvider] = None):
        self._provider: AIProvider = provider or MockAIProvider()
        self._audit_log: List[Dict[str, Any]] = []

    def set_provider(self, provider: AIProvider) -> None:
        """Allows hot-swapping AI providers without altering domain logic."""
        self._provider = provider

    def _log_audit(
        self,
        event_type: str,
        user: Optional[TrustedIdentity],
        parcel_id: Optional[str],
        project_id: Optional[str],
        query: str,
        confidence: str,
        whatif_invoked: bool = False,
    ) -> None:
        """Records data-minimized audit trail of all AI inquiries."""
        entry = {
            "audit_id": f"AIAUDIT-{uuid.uuid4().hex[:8].upper()}",
            "event_type": event_type,
            "actor_id": user.user_id if user else "OFFICER",
            "actor_role": user.role if user else "OFFICER",
            "project_id": project_id,
            "parcel_id": parcel_id,
            "query_sanitized": query[:200],
            "confidence": confidence,
            "whatif_invoked": whatif_invoked,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self._audit_log.append(entry)

    async def ask(
        self,
        query: str,
        parcel_id: Optional[str] = None,
        project_id: Optional[str] = "P-NH927A",
        complaint_id: Optional[str] = None,
        include_whatif: bool = False,
        user: Optional[TrustedIdentity] = None,
        db: Optional[AsyncSession] = None,
    ) -> AIAnswer:
        """
        Executes grounded natural language Q&A:
        1. Sanitizes untrusted query (prompt injection defanging).
        2. Builds authorized, data-minimized AIContext.
        3. If What-If is relevant, invokes deterministic simulator.
        4. Synthesizes grounded AIAnswer via configured AIProvider.
        5. Logs privacy-compliant audit record.
        """
        clean_query, _ = sanitize_untrusted_input(query)

        # 1. Build Grounded Context
        context = await grounding_service.build_context(
            parcel_id=parcel_id,
            project_id=project_id,
            complaint_id=complaint_id,
            user=user,
            db=db,
        )

        # 2. Check if What-If simulation is requested
        whatif_result: Optional[NLWhatIfResult] = None
        whatif_invoked = False
        q_lower = clean_query.lower()
        if include_whatif or any(w in q_lower for w in ["what if", "what happens if", "if we resolve", "if compensation is paid"]):
            whatif_result = await self.simulate_whatif_nl(
                query=clean_query,
                parcel_id=parcel_id,
                project_id=project_id,
                user=user,
                db=db,
            )
            whatif_invoked = True

        # 3. Generate Answer
        answer = await self._provider.generate_answer(context, clean_query)
        if whatif_result:
            answer.whatif_preview = whatif_result

        # 4. Audit Trail
        self._log_audit(
            event_type="AI_GROUNDED_QUERY",
            user=user,
            parcel_id=parcel_id,
            project_id=project_id,
            query=clean_query,
            confidence=answer.confidence.value,
            whatif_invoked=whatif_invoked,
        )

        return answer

    async def summarize_dispute(
        self,
        parcel_id: str,
        project_id: Optional[str] = "P-NH927A",
        user: Optional[TrustedIdentity] = None,
        db: Optional[AsyncSession] = None,
    ) -> DisputeSummary:
        """Generates evidence-backed chronology and factual dispute summary."""
        context = await grounding_service.build_context(
            parcel_id=parcel_id,
            project_id=project_id,
            user=user,
            db=db,
        )
        summary = await self._provider.summarize_dispute(context)
        self._log_audit(
            event_type="AI_DISPUTE_SUMMARY",
            user=user,
            parcel_id=parcel_id,
            project_id=project_id,
            query="Summarize Dispute",
            confidence="HIGH",
        )
        return summary

    async def recommend_actions(
        self,
        parcel_id: str,
        project_id: Optional[str] = "P-NH927A",
        user: Optional[TrustedIdentity] = None,
        db: Optional[AsyncSession] = None,
    ) -> List[RecommendedAction]:
        """Identifies available, executable officer actions for a parcel."""
        context = await grounding_service.build_context(
            parcel_id=parcel_id,
            project_id=project_id,
            user=user,
            db=db,
        )
        actions = await self._provider.recommend_actions(context)
        self._log_audit(
            event_type="AI_ACTION_RECOMMENDATIONS",
            user=user,
            parcel_id=parcel_id,
            project_id=project_id,
            query="Recommend Actions",
            confidence="HIGH",
        )
        return actions

    async def simulate_whatif_nl(
        self,
        query: str,
        parcel_id: Optional[str] = None,
        project_id: Optional[str] = "P-NH927A",
        user: Optional[TrustedIdentity] = None,
        db: Optional[AsyncSession] = None,
    ) -> NLWhatIfResult:
        """
        Parses natural language scenario -> Runs deterministic What-If engine -> Explains result.
        The LLM NEVER computes CPM values; numbers are produced strictly by WhatIfSimulator.
        """
        context = await grounding_service.build_context(
            parcel_id=parcel_id,
            project_id=project_id,
            user=user,
            db=db,
        )
        scenario = await self._provider.parse_whatif_scenario(query, context)

        if not scenario.is_supported:
            return NLWhatIfResult(
                scenario=scenario,
                baseline_delay_days=0,
                scenario_delay_days=0,
                delay_reduction_days=0,
                explanation=scenario.unsupported_reason or "This scenario is not currently supported by KOSH's simulation model.",
                provenance="UNSUPPORTED_SCENARIO_REFUSAL",
                production_mutated=False,
            )

        # Execute deterministic simulator on cloned graph in memory
        sim_res = sih_service.simulate(
            project_id=project_id or "P-NH927A",
            intervention_type=scenario.intervention_type or "process_compensation",
            input_entity_ids=scenario.target_entity_ids or [parcel_id or "P00001"],
            acceleration_factor=scenario.acceleration_factor,
        )

        before = sim_res.get("before", {})
        after = sim_res.get("after", {})
        delay_red = sim_res.get("delay_reduction_days", 0)
        explanation = await self._provider.explain_whatif_result(scenario, sim_res)

        return NLWhatIfResult(
            scenario=scenario,
            baseline_delay_days=before.get("project_delay_days", 0),
            scenario_delay_days=after.get("project_delay_days", 0),
            delay_reduction_days=delay_red,
            baseline_critical_path=before.get("critical_path", []),
            scenario_critical_path=after.get("critical_path", []),
            cost_estimate_units=sim_res.get("cost_estimate_units", {}),
            explanation=explanation,
            provenance="DETERMINISTIC_CPM_SIMULATOR",
            production_mutated=False,
        )

    def get_audit_log(self) -> List[Dict[str, Any]]:
        return self._audit_log


ai_orchestration_service = AIOrchestrationService()
