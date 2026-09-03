import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.models.domain import DurationType, WorkflowStage


@pytest.mark.asyncio
async def test_case_transition():
    import uuid

    from app.api.v1.cases import get_db
    
    class MockCase:
        def __init__(self):
            self.id = uuid.uuid4()
            self.parcel_id = uuid.uuid4()
            self.project_id = uuid.uuid4()
            self.current_stage = WorkflowStage.INITIAL.value
            self.statutory_act = "TEST_ACT"
            self.stage_started_at = None
            self.computed_deadline = None
            self.is_lapsed = False
            self.lapse_risk_flag = False

    class MockRule:
        def __init__(self):
            self.duration_type = DurationType.CALENDAR_DAYS.value
            self.duration_value = 30
            
    test_case = MockCase()
    test_rule = MockRule()

    class MockSession:
        async def execute(self, query):
            # We return an object that has .scalars() which returns an object that has .first()
            class ScalarResult:
                def first(self_):
                    if 'statutory_rules' in str(query): return test_rule
                    return test_case
                def all(self_):
                    return [test_case]
            class MockResult:
                def scalars(self_):
                    return ScalarResult()
            return MockResult()
        async def commit(self): pass
        async def refresh(self, obj): pass
        def add(self, obj): pass

    async def override_get_db():
        yield MockSession()
        
    app.dependency_overrides[get_db] = override_get_db
    
    payload = {
        "new_stage": WorkflowStage.PRELIMINARY_NOTIFICATION.value,
        "actor_id": "user-123",
        "actor_role": "DISTRICT_OFFICER"
    }
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(f"/api/v1/acquisition-cases/{test_case.id}/transition", json=payload)
    
    app.dependency_overrides = {}
    
    assert response.status_code == 200
    data = response.json()
    assert data["current_stage"] == WorkflowStage.PRELIMINARY_NOTIFICATION.value
    assert data["stage_started_at"] is not None
