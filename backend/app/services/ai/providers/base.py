"""
Abstract AI Provider Interface
SIH26016 Land Acquisition Platform - KOSH
Defines pluggable contract for LLM backends.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List

from app.services.ai.schemas import (
    AIAnswer,
    AIContext,
    DisputeSummary,
    NLWhatIfResult,
    NLWhatIfScenario,
    RecommendedAction,
)


class AIProvider(ABC):
    """
    Abstract provider interface for natural language explanation and synthesis.
    All implementations MUST strictly ground answers in the supplied AIContext.
    """

    @abstractmethod
    async def generate_answer(self, context: AIContext, query: str) -> AIAnswer:
        """Generates grounded explanatory answer for an officer query."""
        pass

    @abstractmethod
    async def summarize_dispute(self, context: AIContext) -> DisputeSummary:
        """Constructs evidence-backed dispute summary with chronology and missing evidence."""
        pass

    @abstractmethod
    async def recommend_actions(self, context: AIContext) -> List[RecommendedAction]:
        """Identifies permissible, executable officer interventions from context."""
        pass

    @abstractmethod
    async def parse_whatif_scenario(self, query: str, context: AIContext) -> NLWhatIfScenario:
        """Translates natural language scenario into deterministic What-If parameters."""
        pass

    @abstractmethod
    async def explain_whatif_result(self, scenario: NLWhatIfScenario, result: Dict[str, Any]) -> str:
        """Produces plain-language explanation of deterministic CPM simulation output."""
        pass
