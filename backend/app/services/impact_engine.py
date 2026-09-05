import copy
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.domain import (
    AcquisitionCase,
    ActivityDependency,
    ActivityParcelRequirement,
    Parcel,
    Project,
    ProjectActivity,
    WorkflowBlocker,
)
from app.services.schedule_engine import ScheduleEngine


class ImpactEngine:
    def __init__(self, db: AsyncSession, analysis_date: datetime | None = None):
        self.db = db
        self.analysis_date = analysis_date or datetime.now(timezone.utc)
        self.baseline_engine = ScheduleEngine(self.analysis_date)
        self.current_engine = ScheduleEngine(self.analysis_date)
        self.project_start_date = self.analysis_date
        self.bottleneck_evidence = {}
        self.domain_cache = {"cases": {}, "blockers": {}, "reqs": {}}

    async def load_project(self, project_id: UUID):
        proj_q = await self.db.execute(select(Project).where(Project.id == project_id))
        project = proj_q.scalars().first()
        if not project:
            raise ValueError("Project not found")

        # Load Activities
        act_q = await self.db.execute(select(ProjectActivity).where(ProjectActivity.project_id == project_id))
        activities = act_q.scalars().all()
        
        if activities:
            self.project_start_date = min(a.planned_start for a in activities)

        for a in activities:
            milestone_id = str(a.milestone_id) if a.milestone_id else None
            self.baseline_engine.add_activity(
                str(a.id), a.duration_days, a.planned_start, a.name, a.actual_start, a.actual_finish, milestone_id
            )
            self.current_engine.add_activity(
                str(a.id), a.duration_days, a.planned_start, a.name, a.actual_start, a.actual_finish, milestone_id
            )
            
        # Load Dependencies
        if activities:
            act_ids = [a.id for a in activities]
            dep_q = await self.db.execute(select(ActivityDependency).where(ActivityDependency.predecessor_id.in_(act_ids)))
            for d in dep_q.scalars().all():
                self.baseline_engine.add_dependency(str(d.predecessor_id), str(d.successor_id), d.dependency_type)
                self.current_engine.add_dependency(str(d.predecessor_id), str(d.successor_id), d.dependency_type)

        # 3. Explicit Domain Bridge
        req_q = await self.db.execute(
            select(ActivityParcelRequirement).where(ActivityParcelRequirement.activity_id.in_(act_ids))
        )
        requirements = req_q.scalars().all()
        parcel_ids = list({r.parcel_id for r in requirements})
        
        parcels_q = await self.db.execute(select(Parcel).where(Parcel.id.in_(parcel_ids)))
        parcels = {p.id: p for p in parcels_q.scalars().all()}
        
        cases_q = await self.db.execute(select(AcquisitionCase).where(AcquisitionCase.parcel_id.in_(parcel_ids)))
        cases_by_parcel = {}
        for c in cases_q.scalars().all():
            cases_by_parcel.setdefault(c.parcel_id, []).append(c)
            
        blockers_q = await self.db.execute(select(WorkflowBlocker).where(WorkflowBlocker.parcel_id.in_(parcel_ids), WorkflowBlocker.status == "ACTIVE"))
        blockers_by_parcel = {}
        for b in blockers_q.scalars().all():
            blockers_by_parcel.setdefault(b.parcel_id, []).append(b)
            


        stage_order = {
            "INITIAL": 0,
            "PRELIMINARY_NOTIFICATION": 1,
            "OBJECTIONS": 2,
            "DECLARATION": 3,
            "AWARD": 4,
            "COMPENSATION": 5,
            "POSSESSION": 6,
            "PHYSICAL": 7
        }
        
        # Build Constraint Data
        self.domain_cache["cases"] = {str(k): v for k, v in cases_by_parcel.items()}
        self.domain_cache["blockers"] = {str(k): v for k, v in blockers_by_parcel.items()}
        self.domain_cache["reqs"] = {}
        for req in requirements:
            self.domain_cache["reqs"].setdefault(str(req.activity_id), []).append(req)
        for req in requirements:
            parcel = parcels.get(req.parcel_id)
            if not parcel:
                continue
                
            if str(parcel.project_id) != str(project_id):
                raise ValueError(f"Cross-project constraint violation: Parcel {req.parcel_id} does not belong to Project {project_id}")
                
            parcel_cases = cases_by_parcel.get(parcel.id, [])
            parcel_blockers = blockers_by_parcel.get(parcel.id, [])
            
            # Find max current stage among cases, or POSSESSION/PHYSICAL if parcel is complete
            current_stage_idx = stage_order.get(parcel.possession_type, 0)
            if current_stage_idx < stage_order["PHYSICAL"]:
                for c in parcel_cases:
                    idx = stage_order.get(c.current_stage, 0)
                    current_stage_idx = max(current_stage_idx, idx)
                        
            required_stage_idx = stage_order.get(req.required_stage, stage_order["POSSESSION"])
            
            if current_stage_idx >= required_stage_idx:
                continue # Requirement strictly met by workflow logic


                

            # Requirement is NOT met. Extract actual temporal constraint.
            delay_days = 0
            primary_reason = ""
            urgency = "LOW"
            
            if parcel_blockers:
                b = parcel_blockers[0]
                delay_days = b.assumed_resolution_days # None if unknown
                primary_reason = f"Active blocker: {b.blocker_type}"
                urgency = "HIGH"
            elif parcel_cases:
                lapsed = any(c.is_lapsed for c in parcel_cases)
                c = parcel_cases[0]
                if lapsed:
                    delay_days = c.assumed_lapse_recovery_days # None if unknown
                    primary_reason = "Statutory lapse occurred"
                    urgency = "CRITICAL"
                else:
                    delay_days = None # Cannot infer duration without a stated assumption
                    primary_reason = "Pending routine acquisition"

            if delay_days is None or delay_days >= 0:

                parcel_id_str = str(parcel.id)
                act_id_str = str(req.activity_id)
                
                # Apply constraint provenance explicitly
                self.current_engine.add_constraint(act_id_str, parcel_id_str, delay_days)
                
                # Evidence building
                if parcel_id_str not in self.bottleneck_evidence:
                    self.bottleneck_evidence[parcel_id_str] = {
                        "parcel_id": parcel_id_str,
                        "delay_days": delay_days,
                        "urgency": urgency,
                        "reason": primary_reason,
                        "cases": [str(c.id) for c in parcel_cases],
                        "blockers": [str(b.id) for b in parcel_blockers],
                        "affected_activities": set()
                    }
                self.bottleneck_evidence[parcel_id_str]["affected_activities"].add(act_id_str)

    def _get_causal_path(self, result: dict[str, Any], start_activities: list[str], evidence: dict[str, Any]) -> list[dict[str, Any]]:
        path = []
        parcel_id = str(evidence["parcel_id"])
        
        # 1. Case/Blocker -> Parcel (Verify Domain)
        cases_for_parcel = self.domain_cache["cases"].get(parcel_id, [])
        blockers_for_parcel = self.domain_cache["blockers"].get(parcel_id, [])
        
        valid_cases = [str(c.id) for c in cases_for_parcel]
        valid_blockers = [str(b.id) for b in blockers_for_parcel]
        
        if evidence.get("cases"):
            for case_id in evidence["cases"]:
                if str(case_id) not in valid_cases:
                    raise ValueError(f"Invalid causal relationship: Case {case_id} does not belong to Parcel {parcel_id}")
                path.append({
                    "source_type": "ACQUISITION_CASE",
                    "source_id": str(case_id),
                    "source_label": f"Acquisition Case {str(case_id)[:8]}",
                    "relationship": "HAS_PARCEL",
                    "target_type": "PARCEL",
                    "target_id": str(parcel_id),
                    "target_label": f"Parcel {str(parcel_id)[:8]}"
                })
        if evidence.get("blockers"):
            for blocker_id in evidence["blockers"]:
                if str(blocker_id) not in valid_blockers:
                    raise ValueError(f"Invalid causal relationship: Blocker {blocker_id} does not belong to Parcel {parcel_id}")
                path.append({
                    "source_type": "WORKFLOW_BLOCKER",
                    "source_id": str(blocker_id),
                    "source_label": f"Blocker {str(blocker_id)[:8]}",
                    "relationship": "HAS_PARCEL",
                    "target_type": "PARCEL",
                    "target_id": str(parcel_id),
                    "target_label": f"Parcel {str(parcel_id)[:8]}"
                })
                
        for act in start_activities:
            act_id_str = str(act)
            reqs = self.domain_cache["reqs"].get(act_id_str, [])
            if not any(str(req.parcel_id) == str(parcel_id) for req in reqs):
                raise ValueError(f"Invalid causal relationship: Parcel {parcel_id} is not required by Activity {act}")
                
            act_name = result["activities"][act]["name"]
            
            # 2. Parcel -> Activity
            path.append({
                "source_type": "PARCEL",
                "source_id": str(parcel_id),
                "source_label": f"Parcel {str(parcel_id)[:8]}",
                "relationship": "REQUIRED_BY",
                "target_type": "PROJECT_ACTIVITY",
                "target_id": act,
                "target_label": f"Activity: {act_name}"
            })
            
            # Trace complete downstream schedule propagation chain if critical
            if result["activities"][act]["is_critical"]:
                curr_act = act
                visited_acts = {curr_act}
                
                # Traverse downstream critical activities connected in the schedule graph
                while True:
                    critical_succs = []
                    if self.current_engine.graph.has_node(curr_act):
                        critical_succs = [
                            succ for succ in self.current_engine.graph.successors(curr_act)
                            if succ in result["activities"] and result["activities"][succ]["is_critical"] and succ not in visited_acts
                        ]
                    if not critical_succs:
                        break
                    # Pick finish-determining successor (highest EF)
                    next_act = max(critical_succs, key=lambda s: result["activities"][s].get("EF") or result["project_finish"])
                    visited_acts.add(next_act)
                    next_name = result["activities"][next_act]["name"]
                    
                    path.append({
                        "source_type": "PROJECT_ACTIVITY",
                        "source_id": curr_act,
                        "source_label": f"Activity: {result['activities'][curr_act]['name']}",
                        "relationship": "PRECEDES",
                        "target_type": "PROJECT_ACTIVITY",
                        "target_id": next_act,
                        "target_label": f"Activity: {next_name}"
                    })
                    curr_act = next_act

                # Now curr_act is the terminal activity on this critical chain
                terminal_milestone_id = result["activities"][curr_act]["milestone_id"]
                if terminal_milestone_id:
                    path.append({
                        "source_type": "PROJECT_ACTIVITY",
                        "source_id": curr_act,
                        "source_label": f"Activity: {result['activities'][curr_act]['name']}",
                        "relationship": "COMPLETES",
                        "target_type": "MILESTONE",
                        "target_id": str(terminal_milestone_id),
                        "target_label": f"Milestone {str(terminal_milestone_id)[:8]}"
                    })
                    path.append({
                        "source_type": "MILESTONE",
                        "source_id": str(terminal_milestone_id),
                        "source_label": f"Milestone {str(terminal_milestone_id)[:8]}",
                        "relationship": "CONTRIBUTES_TO",
                        "target_type": "PROJECT_FINISH",
                        "target_id": "PROJECT_FINISH",
                        "target_label": "Project Finish"
                    })
                else:
                    path.append({
                        "source_type": "PROJECT_ACTIVITY",
                        "source_id": curr_act,
                        "source_label": f"Activity: {result['activities'][curr_act]['name']}",
                        "relationship": "CONTRIBUTES_TO",
                        "target_type": "PROJECT_FINISH",
                        "target_id": "PROJECT_FINISH",
                        "target_label": "Project Finish"
                    })
            else:
                # Non-critical activity: connect to milestone if directly attached, does not dictate project finish
                milestone_id = result["activities"][act]["milestone_id"]
                if milestone_id:
                    path.append({
                        "source_type": "PROJECT_ACTIVITY",
                        "source_id": act,
                        "source_label": f"Activity: {act_name}",
                        "relationship": "COMPLETES",
                        "target_type": "MILESTONE",
                        "target_id": str(milestone_id),
                        "target_label": f"Milestone {str(milestone_id)[:8]}"
                    })
            
        return path

    def analyze_impact(self) -> dict[str, Any]:
        baseline_result = self.baseline_engine.calculate_cpm(self.project_start_date)
        current_result = self.current_engine.calculate_cpm(self.project_start_date)
        
        baseline_finish = baseline_result["project_finish"]
        current_finish = current_result["project_finish"]
        project_delay = (current_finish - baseline_finish).days
        
        ranked_bottlenecks = []
        
        # 4. COUNTERFACTUAL IMPACT
        for parcel_id, evidence in self.bottleneck_evidence.items():
            # Clone current engine and remove ONLY THIS ISSUE's constraints
            cf_engine = ScheduleEngine(self.analysis_date)
            cf_engine.graph = copy.deepcopy(self.current_engine.graph)
            
            for act_id in evidence["affected_activities"]:
                cf_engine.remove_constraint(act_id, parcel_id)
                
            cf_result = cf_engine.calculate_cpm(self.project_start_date)
            cf_finish = cf_result["project_finish"]
            
            if evidence["delay_days"] is None:
                recoverable_days = None
                sort_recoverable = -1
            else:
                recoverable_days = (current_finish - cf_finish).days
                sort_recoverable = recoverable_days
            
            # Is it on the critical path?
            is_critical = any(current_result["activities"][act]["is_critical"] for act in evidence["affected_activities"])
            
            affected_milestones = []
            for act_id in evidence["affected_activities"]:
                mid = current_result["activities"][act_id]["milestone_id"]
                if mid: affected_milestones.append(mid)
            
            urgency_rank = {"CRITICAL": 3, "HIGH": 2, "MEDIUM": 1, "LOW": 0}.get(evidence["urgency"], 0)
            sort_key = (
                sort_recoverable,
                len(affected_milestones),
                1 if is_critical else 0,
                urgency_rank
            )

            
            causal_path = self._get_causal_path(current_result, list(evidence["affected_activities"]), evidence)
            
            ranked_bottlenecks.append({
                "parcel_id": evidence["parcel_id"],
                "delay_days": evidence["delay_days"], # The local constraint value
                "urgency": evidence["urgency"],
                "reason": evidence["reason"],
                "cases": evidence["cases"],
                "blockers": evidence["blockers"],
                "is_critical_path": is_critical,
                "project_delay_days": recoverable_days, # Issue-attributable project impact
                "causal_path": causal_path,
                "_sort_key": sort_key
            })
            
        ranked_bottlenecks.sort(key=lambda x: x["_sort_key"], reverse=True)
        
        # Clean up sort keys
        for b in ranked_bottlenecks:
            del b["_sort_key"]

        return {
            "baseline": {
                "project_finish": baseline_finish,
                "critical_path": baseline_result["critical_path"],
                "impact_status": "NO_BLOCKING_CONSTRAINT"
            },
            "current_forecast": {
                "project_finish": current_finish,
                "critical_path": current_result["critical_path"],
                "project_delay_days": project_delay if current_result["impact_status"] == "QUANTIFIED_IMPACT" else None,
                "impact_status": current_result["impact_status"]
            },
            "bottlenecks": ranked_bottlenecks
        }
        
    def simulate_intervention(self, intervention: dict[str, Any]) -> dict[str, Any]:
        """
        Non-destructive simulation. 
        """
        intervention_type = intervention.get("type")
        if intervention_type != "RESOLVE_BLOCKER":
            raise ValueError("Intervention type not currently supported")
            
        parcel_id = intervention.get("parcel_id")
        
        sim_engine = ScheduleEngine(self.analysis_date)
        import copy
        sim_engine.graph = copy.deepcopy(self.current_engine.graph)
        
        evidence = self.bottleneck_evidence.get(parcel_id)
        if not evidence:
            raise ValueError("Parcel constraint not associated with this project schedule")
            
        for act_id in evidence["affected_activities"]:
            sim_engine.remove_constraint(act_id, parcel_id)
                    
        sim_result = sim_engine.calculate_cpm(self.project_start_date)
        current_result = self.current_engine.calculate_cpm(self.project_start_date)
        
        days_recovered = (current_result["project_finish"] - sim_result["project_finish"]).days
        
        return {
            "before": {
                "project_finish": current_result["project_finish"],
                "critical_path": current_result["critical_path"]
            },
            "after": {
                "project_finish": sim_result["project_finish"],
                "critical_path": sim_result["critical_path"]
            },
            "days_recovered": max(0, days_recovered)
        }
