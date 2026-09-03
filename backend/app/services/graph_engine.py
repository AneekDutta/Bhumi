from datetime import datetime, timezone
from typing import Any
from uuid import UUID

import networkx as nx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.domain import (
    AcquisitionCase,
    Milestone,
    Parcel,
    ParcelSegment,
    ProjectSegment,
    StatutoryRule,
    WorkflowBlocker,
    WorkflowStage,
)
from app.services.clock import evaluate_deadline


class IntelligenceEngine:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.graph = nx.DiGraph()
        self.nodes = {}
        self.now = datetime.now(timezone.utc)

    async def build_project_graph(self, project_id: UUID):
        """Constructs a deterministic DAG representing blockers and dependencies."""
        
        # 1. Fetch Entities
        segments_q = await self.db.execute(select(ProjectSegment).where(ProjectSegment.project_id == project_id))
        segments = segments_q.scalars().all()
        
        parcels_q = await self.db.execute(select(Parcel).where(Parcel.project_id == project_id))
        parcels = parcels_q.scalars().all()
        parcel_ids = [p.id for p in parcels]
        
        milestones_q = await self.db.execute(select(Milestone).where(Milestone.segment_id.in_([s.id for s in segments])))
        milestones = milestones_q.scalars().all()
        
        if parcel_ids:
            cases_q = await self.db.execute(select(AcquisitionCase).where(AcquisitionCase.parcel_id.in_(parcel_ids)))
            cases = cases_q.scalars().all()
            
            parcel_segments_q = await self.db.execute(select(ParcelSegment).where(ParcelSegment.parcel_id.in_(parcel_ids)))
            parcel_segments = parcel_segments_q.scalars().all()
            
            blockers_q = await self.db.execute(select(WorkflowBlocker).where(WorkflowBlocker.parcel_id.in_(parcel_ids), WorkflowBlocker.status == "ACTIVE"))
            blockers = blockers_q.scalars().all()
        else:
            cases, parcel_segments, blockers = [], [], []
            
        rules_q = await self.db.execute(select(StatutoryRule))
        rules = {r.trigger_stage: r for r in rules_q.scalars().all()} # Simplified lookup

        # 2. Add Nodes
        for m in milestones:
            node_id = f"milestone_{m.id}"
            self.graph.add_node(node_id, type="MILESTONE", data=m)
            self.nodes[node_id] = m
            
        for s in segments:
            node_id = f"segment_{s.id}"
            self.graph.add_node(node_id, type="SEGMENT", data=s)
            self.nodes[node_id] = s
            
        for p in parcels:
            node_id = f"parcel_{p.id}"
            self.graph.add_node(node_id, type="PARCEL", data=p)
            self.nodes[node_id] = p
            
        for c in cases:
            node_id = f"case_{c.id}"
            # Evaluate deadline
            rule = rules.get(c.current_stage)
            deadline_info = evaluate_deadline(c, rule, now=self.now) if rule else None
            self.graph.add_node(node_id, type="CASE", data=c, deadline=deadline_info)
            self.nodes[node_id] = c
            
        for b in blockers:
            node_id = f"blocker_{b.id}"
            self.graph.add_node(node_id, type="BLOCKER", data=b)
            self.nodes[node_id] = b

        # 3. Add Edges (A blocks B)
        for m in milestones:
            self.graph.add_edge(f"segment_{m.segment_id}", f"milestone_{m.id}", type="SEGMENT_BLOCKS_MILESTONE")
            
        for ps in parcel_segments:
            # Parcel blocks segment construction
            self.graph.add_edge(f"parcel_{ps.parcel_id}", f"segment_{ps.segment_id}", type="PARCEL_BLOCKS_SEGMENT")
            
        for c in cases:
            if c.current_stage != WorkflowStage.POSSESSION.value:
                # Case blocks parcel possession
                self.graph.add_edge(f"case_{c.id}", f"parcel_{c.parcel_id}", type="CASE_BLOCKS_PARCEL")
                
        for b in blockers:
            self.graph.add_edge(f"blocker_{b.id}", f"parcel_{b.parcel_id}", type="WORKFLOW_BLOCKS_PARCEL")

    def identify_bottlenecks(self) -> list[dict[str, Any]]:
        """Identify critical bottlenecks based on deterministic rules."""
        bottlenecks = []
        
        for node_id, attrs in self.graph.nodes(data=True):
            node_type = attrs.get("type")
            
            is_bottleneck = False
            status = "OK"
            reasons = []
            
            # Rule 1: Active Blockers
            if node_type == "BLOCKER":
                is_bottleneck = True
                status = "HIGH"
                reasons.append(f"Active workflow blocker: {attrs['data'].blocker_type}")
                
            # Rule 2: Statutory Urgency
            if node_type == "CASE":
                deadline = attrs.get("deadline")
                if deadline:
                    if deadline["status"] == "LAPSED":
                        is_bottleneck = True
                        status = "CRITICAL"
                        reasons.append(f"Statutory deadline lapsed for {attrs['data'].current_stage}")
                    elif deadline["status"] == "WARNING":
                        is_bottleneck = True
                        status = "MEDIUM"
                        reasons.append("Approaching statutory deadline")

            if not is_bottleneck:
                continue
                
            # Calculate impact
            descendants = list(nx.descendants(self.graph, node_id))
            impact_count = len(descendants)
            
            affected_milestones = []
            for d in descendants:
                if self.graph.nodes[d].get("type") == "MILESTONE":
                    affected_milestones.append(str(self.graph.nodes[d]["data"].id))
                    
            if affected_milestones and status == "HIGH":
                status = "CRITICAL" # Upgraded because it blocks a milestone
                reasons.append(f"Directly blocks {len(affected_milestones)} milestones")

            if impact_count > 0:
                bottlenecks.append({
                    "entity_id": str(attrs["data"].id),
                    "entity_type": node_type,
                    "status": status,
                    "reasons": reasons,
                    "downstream_impact_count": impact_count,
                    "affected_milestones": affected_milestones,
                    "blocking_chain": descendants
                })
                
        # Sort by criticality
        criticality_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2}
        bottlenecks.sort(key=lambda x: (criticality_order.get(x["status"], 99), -x["downstream_impact_count"]))
        
        return bottlenecks
