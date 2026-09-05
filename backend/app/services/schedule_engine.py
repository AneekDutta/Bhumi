from datetime import datetime, timedelta
from typing import Any

import networkx as nx


class ScheduleEngine:
    def __init__(self, analysis_date: datetime):
        self.analysis_date = analysis_date
        self.graph = nx.DiGraph()
        
    def add_activity(self, activity_id: str, duration_days: int, planned_start: datetime, name: str = "", actual_start: datetime | None = None, actual_finish: datetime | None = None, milestone_id: str | None = None):
        self.graph.add_node(
            activity_id, 
            duration_days=duration_days,
            planned_start=planned_start,
            name=name,
            actual_start=actual_start,
            actual_finish=actual_finish,
            milestone_id=milestone_id,
            ES=None, EF=None, LS=None, LF=None, float_days=0,
            constraints={} # source_id -> delay_days (int or None)
        )

    def add_dependency(self, predecessor_id: str, successor_id: str, type: str = "FINISH_TO_START"):
        self.graph.add_edge(predecessor_id, successor_id, type=type)

    def add_constraint(self, activity_id: str, source_id: str, delay_days: int | None):
        """
        Injects a temporal constraint. delay_days can be None if unknown.
        """
        if self.graph.has_node(activity_id):
            self.graph.nodes[activity_id]["constraints"][source_id] = delay_days

    def remove_constraint(self, activity_id: str, source_id: str):
        if self.graph.has_node(activity_id):
            self.graph.nodes[activity_id]["constraints"].pop(source_id, None)

    def calculate_cpm(self, project_start_date: datetime) -> dict[str, Any]:
        if not nx.is_directed_acyclic_graph(self.graph):
            raise ValueError("Schedule graph has a cycle")

        topo_order = list(nx.topological_sort(self.graph))
        has_unknown_constraint = False
        
        # FORWARD PASS
        for node in topo_order:
            attrs = self.graph.nodes[node]
            
            if attrs["actual_finish"]:
                attrs["ES"] = attrs["actual_start"] or project_start_date
                attrs["EF"] = attrs["actual_finish"]
                continue

            max_pred_ef = project_start_date
            for pred in self.graph.predecessors(node):
                edge_data = self.graph.get_edge_data(pred, node)
                pred_attrs = self.graph.nodes[pred]
                if edge_data["type"] == "FINISH_TO_START" and pred_attrs["EF"] and pred_attrs["EF"] > max_pred_ef:
                    max_pred_ef = pred_attrs["EF"]
            
            # Incorporate explicit constraint delay
            max_constraint_delay = 0
            if attrs["constraints"]:
                delays = list(attrs["constraints"].values())
                if None in delays:
                    has_unknown_constraint = True
                valid_delays = [d for d in delays if d is not None]
                if valid_delays:
                    max_constraint_delay = max(valid_delays)
                    
            constraint_ready_date = self.analysis_date + timedelta(days=max_constraint_delay)
            delayed_start = max(max_pred_ef, constraint_ready_date)
            
            attrs["ES"] = max(delayed_start, attrs.get("planned_start") or project_start_date)
            attrs["EF"] = attrs["ES"] + timedelta(days=attrs["duration_days"])

        if not topo_order:
            return {"project_finish": project_start_date, "activities": {}, "milestones": {}, "has_unknown_constraint": False}

        # Project Finish = Max EF of all TERMINAL nodes
        terminal_nodes = [n for n in topo_order if self.graph.out_degree(n) == 0]
        if terminal_nodes:
            project_finish = max(self.graph.nodes[n]["EF"] for n in terminal_nodes)
        else:
            project_finish = max(self.graph.nodes[n]["EF"] for n in topo_order)

        # BACKWARD PASS
        for node in reversed(topo_order):
            attrs = self.graph.nodes[node]
            if attrs["actual_finish"]:
                attrs["LF"] = attrs["actual_finish"]
                attrs["LS"] = attrs["actual_start"] or attrs["actual_finish"]
                attrs["float_days"] = 0
                continue
            
            successors = list(self.graph.successors(node))
            if not successors:
                attrs["LF"] = project_finish
            else:
                min_succ_ls = project_finish
                for succ in successors:
                    succ_attrs = self.graph.nodes[succ]
                    edge_data = self.graph.get_edge_data(node, succ)
                    if edge_data["type"] == "FINISH_TO_START":
                        min_succ_ls = min(min_succ_ls, succ_attrs["LS"])
                attrs["LF"] = min_succ_ls
                
            attrs["LS"] = attrs["LF"] - timedelta(days=attrs["duration_days"])
            attrs["float_days"] = (attrs["LS"] - attrs["ES"]).days

        activities_summary = {}
        critical_path = []
        milestone_contributors = {}
        
        for node, attrs in self.graph.nodes(data=True):
            is_critical = attrs["float_days"] <= 0
            if is_critical:
                critical_path.append(node)
                
            activities_summary[node] = {
                "name": attrs["name"],
                "milestone_id": attrs["milestone_id"],
                "ES": attrs["ES"],
                "EF": attrs["EF"],
                "LS": attrs["LS"],
                "LF": attrs["LF"],
                "float_days": attrs["float_days"],
                "is_critical": is_critical,
                "duration_days": attrs["duration_days"],
                "constraints": dict(attrs["constraints"])
            }
            
            mid = attrs["milestone_id"]
            if mid:
                milestone_contributors.setdefault(mid, []).append(attrs["EF"])
                
        # Milestone Forecast Dates
        milestones_summary = {}
        for mid, efs in milestone_contributors.items():
            milestones_summary[mid] = max(efs)
            
        impact_status = "NO_BLOCKING_CONSTRAINT"
        if any(attrs["constraints"] for _, attrs in self.graph.nodes(data=True)):
            impact_status = "UNQUANTIFIED_IMPACT" if has_unknown_constraint else "QUANTIFIED_IMPACT"
            
        return {
            "project_finish": project_finish,
            "critical_path": critical_path,
            "activities": activities_summary,
            "milestones": milestones_summary,
            "has_unknown_constraint": has_unknown_constraint,
            "impact_status": impact_status
        }
