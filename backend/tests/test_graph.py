import uuid
from datetime import datetime, timezone

import pytest

from app.models.domain import (
    AcquisitionCase,
    Milestone,
    Parcel,
    ParcelSegment,
    ProjectSegment,
    StatutoryRule,
    WorkflowStage,
)
from app.services.graph_engine import IntelligenceEngine


@pytest.mark.asyncio
async def test_intelligence_engine():
    # We will mock the database by passing an object that returns predefined data
    class MockSession:
        def __init__(self):
            self.p_id = uuid.uuid4()
            self.seg = ProjectSegment(id=uuid.uuid4(), project_id=self.p_id)
            self.mil = Milestone(id=uuid.uuid4(), segment_id=self.seg.id)
            self.par = Parcel(id=uuid.uuid4(), project_id=self.p_id)
            self.ps = ParcelSegment(id=uuid.uuid4(), parcel_id=self.par.id, segment_id=self.seg.id)
            
            # Case that is LAPSED
            self.case = AcquisitionCase(
                id=uuid.uuid4(), parcel_id=self.par.id, 
                current_stage=WorkflowStage.PRELIMINARY_NOTIFICATION.value,
                stage_started_at=datetime(2023, 1, 1, tzinfo=timezone.utc), # extremely old
                statutory_act="RFCTLARR_2013"
            )
            
            self.rule = StatutoryRule(
                rule_code="TEST_RULE",
                act_code="RFCTLARR_2013",
                trigger_stage=WorkflowStage.PRELIMINARY_NOTIFICATION.value,
                target_stage=WorkflowStage.DECLARATION.value,
                duration_value=30,
                duration_type="CALENDAR_DAYS",
                warning_threshold_days=10,
                is_hard_lapse=True,
                statutory_citation="Sec 1"
            )

        async def execute(self, query):
            class ScalarResult:
                def __init__(self, data):
                    self.data = data
                def scalars(self):
                    class Scal:
                        def all(self_): return self.data
                    return Scal()
            
            q_str = str(query)
            if 'project_segments' in q_str: return ScalarResult([self.seg])
            if 'parcels' in q_str and 'parcel_segments' not in q_str: return ScalarResult([self.par])
            if 'milestones' in q_str: return ScalarResult([self.mil])
            if 'acquisition_cases' in q_str: return ScalarResult([self.case])
            if 'parcel_segments' in q_str: return ScalarResult([self.ps])
            if 'workflow_blockers' in q_str: return ScalarResult([])
            if 'statutory_rules' in q_str: return ScalarResult([self.rule])
            return ScalarResult([])

    session = MockSession()
    engine = IntelligenceEngine(session)
    await engine.build_project_graph(session.p_id)
    
    bottlenecks = engine.identify_bottlenecks()
    
    assert len(bottlenecks) == 1
    bn = bottlenecks[0]
    
    assert bn["entity_type"] == "CASE"
    assert bn["status"] == "CRITICAL" # lapsed + blocks milestone
    assert bn["downstream_impact_count"] == 3 # Case -> Parcel -> Segment -> Milestone
    assert str(session.mil.id) in bn["affected_milestones"]
