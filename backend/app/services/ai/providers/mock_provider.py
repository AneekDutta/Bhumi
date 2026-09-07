"""
Mock AI Provider for Deterministic Offline Rehearsal & Testing
SIH26016 Land Acquisition Platform - KOSH
Strict Grounding & Provenance Contract Enforced
"""
import re
from typing import Any, Dict, List, Optional

from app.services.ai.prompts import sanitize_untrusted_input
from app.services.ai.providers.base import AIProvider
from app.services.ai.schemas import (
    AIAnswer,
    AIContext,
    ChronologyItem,
    ConfidenceLevel,
    DisputeSummary,
    EvidenceRef,
    NLWhatIfResult,
    NLWhatIfScenario,
    RecommendedAction,
    SourceType,
)


class MockAIProvider(AIProvider):
    """
    High-fidelity deterministic provider for offline test execution and demonstration.
    Produces strictly grounded outputs derived from the supplied AIContext.
    """

    def __init__(self, provider_name: str = "mock", model_name: str = "deterministic-rule-engine"):
        self.provider_name = provider_name
        self.model_name = model_name

    async def generate_answer(self, context: AIContext, query: str) -> AIAnswer:
        # 1. Defang adversarial prompt injections in query
        clean_query, was_injected = sanitize_untrusted_input(query)
        q_lower = clean_query.lower()

        source_refs: List[EvidenceRef] = list(context.verified_evidence)
        legal_refs: List[str] = [ref.get("section_id", "RFCTLARR") for ref in context.legal_references]
        evidence_refs: List[EvidenceRef] = [r for r in source_refs if r.source_type in [SourceType.DOCUMENT, SourceType.COMPLAINT, SourceType.AWARD]]

        # Insufficient evidence guard
        if context.evidence_completeness == ConfidenceLevel.INSUFFICIENT_EVIDENCE or (not context.parcel_summary and not context.project_summary):
            return AIAnswer(
                query=clean_query,
                answer="Insufficient verified system evidence to answer this. The requested parcel or corridor record does not exist in the registered digital twin state.",
                confidence=ConfidenceLevel.INSUFFICIENT_EVIDENCE,
                source_refs=[],
                legal_refs=[],
                evidence_refs=[],
                recommended_actions=[],
                assumptions=[],
                unanswered_questions=["Verify parcel identifier and ensure project boundary enrollment."],
                provider=self.provider_name,
                model=self.model_name,
                grounded=False,
                factual_basis=[],
                claims=[],
                uncertainty=["Target record not found in system state."],
            )

        pid = context.parcel_id or "P00001"
        p_info = context.parcel_summary or {}
        surv = p_info.get("survey_number", "102/4")
        vil = p_info.get("village_name", "Kanhera Kalan")
        float_days = context.cpm_impact.get("critical_path_float_days", 0)
        is_cp = context.cpm_impact.get("is_parcel_on_critical_path", False)
        comp_info = context.compensation_summary or {}

        # Intent 1: "Why is this parcel high risk?"
        if any(w in q_lower for w in ["why", "risk", "high risk", "bottleneck"]):
            risk_summary = context.risk_summary or {}
            primary_reason = risk_summary.get("primary_bottleneck_reason") or "Active ownership contestation and CPM zero-float condition."

            reasons = []
            if p_info.get("ownership_conflict"):
                reasons.append(f"Unresolved title/boundary contestation flagged on Survey No. {surv} [Evidence: parcel:{pid}].")
            if comp_info.get("is_disputed") or not comp_info.get("total_compensation"):
                reasons.append("Statutory compensation award remains pending or disputed, directly violating Section 38 pre-possession prerequisites [Legal: Section 38].")
            if is_cp or float_days == 0:
                reasons.append(f"Parcel gates corridor possession on the Critical Chain with 0 days total schedule float [CPM Node: parcel:{pid}].")

            answer_text = (
                f"Parcel {pid} (Survey No. {surv}, Village {vil}) is classified as HIGH RISK due to: "
                f"{' '.join(reasons)} "
                f"Primary statutory driver: {primary_reason} "
                f"Possession cannot proceed under Section 38 until full compensation is tendered and title claims are reconciled."
            )

            actions = await self.recommend_actions(context)
            return AIAnswer(
                query=clean_query,
                answer=answer_text,
                confidence=ConfidenceLevel.HIGH,
                source_refs=source_refs,
                legal_refs=legal_refs,
                evidence_refs=evidence_refs,
                recommended_actions=actions,
                assumptions=["Evaluated using registered project dependency graph and CPM topology."],
                unanswered_questions=[],
                provider=self.provider_name,
                model=self.model_name,
                grounded=True,
                factual_basis=reasons,
                claims=["Claimant contestation recorded on parcel survey."] if p_info.get("ownership_conflict") else [],
                uncertainty=[],
            )

        # Intent 2: "Summarize this dispute"
        if any(w in q_lower for w in ["summarize", "dispute", "chronology", "grievance"]):
            dispute = await self.summarize_dispute(context)
            actions = await self.recommend_actions(context)
            summary_text = (
                f"Dispute Summary for Parcel {pid} (Survey No. {surv}, {vil}):\n\n"
                f"FACTS: {'; '.join(dispute.facts)}\n\n"
                f"CLAIMS & INTERPRETATIONS: {'; '.join(dispute.interpretations)}\n\n"
                f"STATUS: Compensation status is {dispute.compensation_status}. "
                f"Statutory clocks: {dispute.statutory_clock_status}. "
                f"Corridor impact: {dispute.cpm_float_impact}."
            )
            return AIAnswer(
                query=clean_query,
                answer=summary_text,
                confidence=ConfidenceLevel.HIGH,
                source_refs=source_refs,
                legal_refs=legal_refs,
                evidence_refs=evidence_refs,
                recommended_actions=actions,
                assumptions=["Derived from registered field verification memoranda and citizen complaint submissions."],
                unanswered_questions=dispute.missing_evidence_checklist,
                provider=self.provider_name,
                model=self.model_name,
                grounded=True,
                factual_basis=dispute.facts,
                claims=dispute.interpretations,
                uncertainty=dispute.missing_evidence_checklist,
            )

        # Intent 3: "What deadlines are at risk?"
        if any(w in q_lower for w in ["deadline", "lapse", "clock", "statutory limit"]):
            clocks = context.statutory_clocks or []
            if not clocks:
                ans = f"No statutory limitation clocks are currently active or breaching for Parcel {pid}."
            else:
                clock_descs = [
                    f"{c.get('rule_name')}: Due {c.get('due_date')} ({c.get('days_remaining')} days remaining, Status: {c.get('status')})"
                    for c in clocks
                ]
                ans = f"Statutory limitation clocks for Parcel {pid}:\n" + "\n".join(clock_descs)

            return AIAnswer(
                query=clean_query,
                answer=ans,
                confidence=ConfidenceLevel.HIGH,
                source_refs=source_refs,
                legal_refs=legal_refs,
                evidence_refs=evidence_refs,
                recommended_actions=await self.recommend_actions(context),
                provider=self.provider_name,
                model=self.model_name,
                grounded=True,
                factual_basis=[f"Statutory clock {c.get('rule_name')} status: {c.get('status')}" for c in clocks],
                claims=[],
                uncertainty=[],
            )

        # Intent 4: "What does Section 38 require?"
        if "38" in q_lower or "possession" in q_lower:
            ans = (
                "Under Section 38(1) and (2) of the RFCTLARR Act 2013, the Collector may take physical possession "
                "of acquired land ONLY AFTER full compensation has been deposited or paid to entitled persons, and "
                "monetary rehabilitation and resettlement allowances have been tendered. Pre-payment physical dispossession "
                "is strictly prohibited and triggers 9%/15% penal interest liabilities under Section 80."
            )
            return AIAnswer(
                query=clean_query,
                answer=ans,
                confidence=ConfidenceLevel.HIGH,
                source_refs=[r for r in source_refs if "38" in r.source_id or "SEC" in r.source_id],
                legal_refs=["Section 38(1) & (2)", "Section 80"],
                evidence_refs=[],
                recommended_actions=await self.recommend_actions(context),
                provider=self.provider_name,
                model=self.model_name,
                grounded=True,
                factual_basis=["RFCTLARR Section 38(1) requires full payment of compensation before possession."],
                claims=[],
                uncertainty=[],
            )

        # Intent 5: "What actions are available?"
        if any(w in q_lower for w in ["action", "what can we do", "what can i do", "available", "option"]):
            actions = await self.recommend_actions(context)
            act_names = [f"• {a.title} ({a.rationale})" for a in actions]
            ans = f"Permissible administrative interventions for Parcel {pid}:\n" + "\n".join(act_names)
            return AIAnswer(
                query=clean_query,
                answer=ans,
                confidence=ConfidenceLevel.HIGH,
                source_refs=source_refs,
                legal_refs=legal_refs,
                evidence_refs=evidence_refs,
                recommended_actions=actions,
                provider=self.provider_name,
                model=self.model_name,
                grounded=True,
                factual_basis=[f"Authorized action: {a.title}" for a in actions],
                claims=[],
                uncertainty=[],
            )

        # Default grounded response
        ans = (
            f"Regarding Parcel {pid} (Survey No. {surv}, Village {vil}): The parcel has acquisition status '{p_info.get('acquisition_status', 'in_progress')}' "
            f"with ownership conflict status '{p_info.get('ownership_conflict', False)}'. "
            f"CPM critical chain float is currently {float_days} days."
        )
        return AIAnswer(
            query=clean_query,
            answer=ans,
            confidence=ConfidenceLevel.MEDIUM,
            source_refs=source_refs,
            legal_refs=legal_refs,
            evidence_refs=evidence_refs,
            recommended_actions=await self.recommend_actions(context),
            provider=self.provider_name,
            model=self.model_name,
            grounded=True,
            factual_basis=[f"Parcel {pid} status is {p_info.get('acquisition_status')}"],
            claims=[],
            uncertainty=[],
        )

    async def summarize_dispute(self, context: AIContext) -> DisputeSummary:
        pid = context.parcel_id or "P00001"
        p_info = context.parcel_summary or {}
        surv = p_info.get("survey_number", "102/4")
        vil = p_info.get("village_name", "Kanhera Kalan")
        comp = context.compensation_summary or {}

        facts = [
            f"Parcel {pid} comprises {p_info.get('area_sqm', 4200)} sq.m ({p_info.get('area_hectares', 0.42)} ha) of {p_info.get('land_use', 'agricultural')} land in Village {vil}.",
            f"Preliminary notification under Section 11 gazetted on 2025-04-01.",
            f"Estimated statutory award calculated at ₹{float(comp.get('total_compensation') or 6734000):,.2f}.",
        ]

        interpretations = [
            f"Landowner claims inheritance partition deed pending revenue mutation on Khasra {surv}.",
            f"Contested compensation rate alleging incorrect circle rate application for roadside irrigated parcel.",
        ]

        recommendations = [
            "Convene Special Revenue Lok Adalat hearing for titleholder legal heir reconciliation.",
            "Verify DGPS boundary pillars with Assistant Director of Land Records (ADLR).",
            "If title remains disputed, deposit compensation with LARR Authority under Section 77 to prevent corridor delay.",
        ]

        chronology = [
            ChronologyItem(date="2025-04-01", event="Section 11 Preliminary Notification Gazette publication", actor_or_authority="Competent Authority"),
            ChronologyItem(date="2025-05-15", event="Field demarcation and cadastral survey completed", actor_or_authority="DGPS Survey Team"),
            ChronologyItem(date="2025-06-10", event="Grievance received alleging boundary encroachment of 8 meters", actor_or_authority="Citizen Titleholder"),
            ChronologyItem(date="2025-07-02", event="Collector preliminary valuation award computed", actor_or_authority="Competent Authority LALR"),
        ]

        missing_evidence = [
            "Registered partition deed copy or family genealogy tree (Shajra Nasab).",
            "Bank account passbook copy for direct PFMS compensation transfer.",
            "Revenue mutation register (Dakhil Kharij) certified extract.",
        ]

        next_action = RecommendedAction(
            action_type="CONVENE_REVENUE_HEARING",
            title="Convene Revenue Lok Adalat Hearing",
            rationale="Reconciles co-sharer claims to enable Section 23 award signing and Section 38 disbursement.",
            legal_basis="Section 64 & Section 77, RFCTLARR Act 2013",
            evidence_refs=context.verified_evidence[:2],
            expected_effect="Clears ownership blocker; restores up to 14 days of CPM corridor float.",
            prerequisites=["Service of 15-day notice to all recorded interested persons"],
            risk_if_not_taken="Continued Critical Path gating threatening project handover deadline.",
            executable=True,
            execution_route="/action-center"
        )

        return DisputeSummary(
            dispute_id=f"DISP-{pid}",
            parcel_id=pid,
            project_id=context.project_id or "P-NH927A",
            title=f"Title & Compensation Dispute on Parcel {pid} (Survey No. {surv})",
            parties_involved=["Revenue Department", "NHAI Project Implementation Unit", "Citizen Titleholders"],
            facts=facts,
            interpretations=interpretations,
            recommendations=recommendations,
            chronology=chronology,
            compensation_status=str(comp.get("status", "CALCULATED")),
            statutory_clock_status="Section 15 Objections Cleared · Section 19 Declaration Clock Active",
            cpm_float_impact="Direct Critical Path membership (0 days float)",
            verified_documents=[r for r in context.verified_evidence if r.source_type == SourceType.DOCUMENT],
            missing_evidence_checklist=missing_evidence,
            applicable_legal_provisions=["Section 15", "Section 19", "Section 38", "Section 64", "Section 77"],
            next_action_recommendation=next_action,
        )

    async def recommend_actions(self, context: AIContext) -> List[RecommendedAction]:
        pid = context.parcel_id or "P00001"
        actions: List[RecommendedAction] = []

        # Action 1: Lok Adalat hearing for title dispute
        actions.append(
            RecommendedAction(
                action_type="RESOLVE_OWNERSHIP_CONFLICT",
                title="Initiate Revenue Lok Adalat Settlement",
                rationale="Resolves competing inheritance claims via summary revenue reconciliation.",
                legal_basis="Section 64 & 77, RFCTLARR Act 2013",
                evidence_refs=[r for r in context.verified_evidence if r.source_type == SourceType.COMPLAINT][:1],
                expected_effect="Removes blocking dependency edge; frees 14 days CPM float.",
                prerequisites=["Notice served to recorded titleholders"],
                risk_if_not_taken="Indefinite freeze of corridor section.",
                executable=True,
                execution_route="/action-center",
            )
        )

        # Action 2: Process PFMS Compensation
        actions.append(
            RecommendedAction(
                action_type="PROCESS_COMPENSATION",
                title="Authorize Direct PFMS Treasury Disbursal",
                rationale="Fulfills Section 38 prerequisite, enabling lawful physical possession.",
                legal_basis="Section 38(1), RFCTLARR Act 2013",
                evidence_refs=[r for r in context.verified_evidence if r.source_type == SourceType.AWARD][:1],
                expected_effect="Permits corridor Right-of-Way handover.",
                prerequisites=["Title verification certified by Legal Officer", "Bank details verified"],
                risk_if_not_taken="Penal interest accrual under Section 80 (9% first year, 15% thereafter).",
                executable=True,
                execution_route="/valuation",
            )
        )

        # Action 3: Simulate What-If
        actions.append(
            RecommendedAction(
                action_type="SIMULATE_WHAT_IF",
                title="Run CPM What-If Counterfactual Simulation",
                rationale="Quantifies schedule float gain across entire highway corridor prior to resource commitment.",
                legal_basis="CPM Topological Schedule Analysis (Section 12 SIH26016)",
                evidence_refs=[],
                expected_effect="Provides exact before-vs-after corridor delivery date forecast.",
                prerequisites=[],
                risk_if_not_taken="Misallocation of fast-track administrative resources.",
                executable=True,
                execution_route="/intelligence/what-if",
            )
        )

        return actions

    async def parse_whatif_scenario(self, query: str, context: AIContext) -> NLWhatIfScenario:
        clean_query, _ = sanitize_untrusted_input(query)
        q_lower = clean_query.lower()
        pid = context.parcel_id or "P00001"

        # Check for unsupported requests
        if any(w in q_lower for w in ["different corridor", "new highway", "bridge", "tunnel", "airport", "cancel project"]):
            return NLWhatIfScenario(
                raw_query=clean_query,
                is_supported=False,
                unsupported_reason="This scenario is not currently supported by KOSH's simulation model. KOSH models administrative interventions on registered cadastral parcels within authorized corridors.",
                parsed_intent="UNSUPPORTED_MACRO_PLANNING_REQUEST"
            )

        # Mappings to WhatIfSimulator interventions
        if any(w in q_lower for w in ["compensation", "pay", "disburs", "money", "award"]):
            itype = "process_compensation"
            intent = f"Simulate immediate compensation clearance for Parcel {pid}"
        elif any(w in q_lower for w in ["ownership", "title", "conflict", "dispute", "lok adalat"]):
            itype = "resolve_ownership_conflict"
            intent = f"Simulate title settlement for Parcel {pid}"
        elif any(w in q_lower for w in ["officer", "staff", "deploy", "taskforce"]):
            itype = "deploy_additional_officers"
            intent = "Deploy additional special taskforce officers across corridor"
        elif any(w in q_lower for w in ["verification", "dgps", "survey"]):
            itype = "complete_field_verification"
            intent = f"Simulate expedited DGPS field survey on Parcel {pid}"
        else:
            itype = "RESOLVE_BLOCKER"
            intent = f"Simulate fast-track blocker clearance on Parcel {pid}"

        return NLWhatIfScenario(
            raw_query=clean_query,
            is_supported=True,
            intervention_type=itype,
            target_entity_ids=[pid],
            acceleration_factor=1.0,
            parsed_intent=intent,
        )

    async def explain_whatif_result(self, scenario: NLWhatIfScenario, result: Dict[str, Any]) -> str:
        delay_red = result.get("delay_reduction_days", 0)
        before = result.get("before", {})
        after = result.get("after", {})
        cost = result.get("cost_estimate_units", {})

        b_finish = before.get("project_finish", "2028-11-15")
        a_finish = after.get("project_finish", "2028-10-11")
        off_days = cost.get("officer_days", 5)
        cost_inr = cost.get("cost_inr", 15000)

        if delay_red > 0:
            return (
                f"Deterministic CPM Analysis: Executing '{scenario.intervention_type}' on {', '.join(scenario.target_entity_ids)} "
                f"reduces total corridor schedule delay by {delay_red} calendar days. "
                f"Projected corridor completion advances from {b_finish} to {a_finish}. "
                f"Estimated administrative commitment: {off_days} officer-days (₹{cost_inr:,.2f}, {cost.get('action_unit', 'Administrative Action')}). "
                f"Production database state remains strictly untouched."
            )
        else:
            return (
                f"Deterministic CPM Analysis: Executing '{scenario.intervention_type}' on {', '.join(scenario.target_entity_ids)} "
                f"does not compress the critical path (0 days reduction) because this entity is not currently consuming zero-float corridor float. "
                f"Projected completion remains {b_finish}."
            )
