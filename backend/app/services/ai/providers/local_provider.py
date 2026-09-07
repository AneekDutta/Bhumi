"""
Local Rule-Based AI Provider
SIH26016 Land Acquisition Platform - KOSH
Performs offline local pattern matching and explanation without cloud dependencies.
"""
from typing import Any, Dict, List

from app.services.ai.providers.base import AIProvider
from app.services.ai.providers.mock_provider import MockAIProvider
from app.services.ai.schemas import (
    AIAnswer,
    AIContext,
    DisputeSummary,
    NLWhatIfScenario,
    RecommendedAction,
)


class LocalAIProvider(AIProvider):
    """
    Local rule-based provider executing purely offline in-process algorithms.
    Delegates to structured rule matching.
    """

    def __init__(self):
        self._mock = MockAIProvider()

    async def generate_answer(self, context: AIContext, query: str) -> AIAnswer:
        return await self._mock.generate_answer(context, query)

    async def summarize_dispute(self, context: AIContext) -> DisputeSummary:
        return await self._mock.summarize_dispute(context)

    async def recommend_actions(self, context: AIContext) -> List[RecommendedAction]:
        return await self._mock.recommend_actions(context)

    async def parse_whatif_scenario(self, query: str, context: AIContext) -> NLWhatIfScenario:
        return await self._mock.parse_whatif_scenario(query, context)

    async def explain_whatif_result(self, scenario: NLWhatIfScenario, result: Dict[str, Any]) -> str:
        return await self._mock.explain_whatif_result(scenario, result)
