import uuid
from datetime import datetime, timezone

import pytest

from app.services.impact_engine import ImpactEngine


def test_causal_path_invalid_case():
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    engine = ImpactEngine(db=None, analysis_date=start)
    engine.domain_cache = {"cases": {}, "blockers": {}, "reqs": {}}
    
    # We pass evidence with a case, but domain_cache is empty!
    evidence = {
        "parcel_id": str(uuid.uuid4()),
        "cases": [str(uuid.uuid4())],
        "blockers": [],
        "affected_activities": set()
    }
    with pytest.raises(ValueError, match="Invalid causal relationship: Case"):
        engine._get_causal_path({"activities": {}}, [], evidence)

def test_causal_path_invalid_requirement():
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    engine = ImpactEngine(db=None, analysis_date=start)
    engine.domain_cache = {"cases": {}, "blockers": {}, "reqs": {}}
    
    parcel_id = uuid.uuid4()
    act_id = uuid.uuid4()
    evidence = {
        "parcel_id": str(parcel_id),
        "cases": [],
        "blockers": [],
        "affected_activities": {str(act_id)}
    }
    
    # No requirement registered
    with pytest.raises(ValueError, match="is not required by Activity"):
        engine._get_causal_path({"activities": {str(act_id): {"name": "Test"}}}, [str(act_id)], evidence)

def test_causal_path_valid_scenarios():
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    engine = ImpactEngine(db=None, analysis_date=start)
    
    parcel_id = uuid.uuid4()
    act1_id = uuid.uuid4()
    act2_id = uuid.uuid4()
    case1_id = uuid.uuid4()
    case2_id = uuid.uuid4()
    
    # Setup cache
    class FakeCase: id = case1_id
    class FakeCase2: id = case2_id
    class FakeReq:
        def __init__(self, p): self.parcel_id = p 
        
        
        
        
    engine.domain_cache = {
        "cases": {str(parcel_id): [FakeCase(), FakeCase2()]},
        "blockers": {},
        "reqs": {str(act1_id): [FakeReq(parcel_id)], str(act2_id): [FakeReq(parcel_id)]}
    }
    
    evidence = {
        "parcel_id": str(parcel_id),
        "cases": [str(case1_id), str(case2_id)],
        "blockers": [],
        "affected_activities": {str(act1_id), str(act2_id)}
    }
    
    # Act1 has NO milestone and is critical
    # Act2 HAS milestone but is NOT critical
    mock_result = {
        "project_finish": start,
        "activities": {
            str(act1_id): {"name": "Act 1", "milestone_id": None, "is_critical": True},
            str(act2_id): {"name": "Act 2", "milestone_id": "M1", "is_critical": False}
        }
    }
    
    paths = engine._get_causal_path(mock_result, [str(act1_id), str(act2_id)], evidence)
    
    # Cases -> Parcel (2 paths)
    assert any(p["source_id"] == str(case1_id) and p["target_id"] == str(parcel_id) for p in paths)
    assert any(p["source_id"] == str(case2_id) and p["target_id"] == str(parcel_id) for p in paths)
    
    # Parcel -> Activities (2 paths)
    assert any(p["source_id"] == str(parcel_id) and p["target_id"] == str(act1_id) for p in paths)
    assert any(p["source_id"] == str(parcel_id) and p["target_id"] == str(act2_id) for p in paths)
    
    # Act1 is critical but no milestone -> Act1 -> Project Finish directly
    assert any(p["source_id"] == str(act1_id) and p["target_id"] == "PROJECT_FINISH" for p in paths)
    
    # Act2 has milestone M1. Act2 -> M1. M1 DOES NOT contribute to project finish (not critical).
    assert any(p["source_id"] == str(act2_id) and p["target_id"] == "M1" for p in paths)
    assert not any(p["source_id"] == "M1" and p["target_id"] == "PROJECT_FINISH" for p in paths)



def test_causal_path_full_propagation_chain():
    start = datetime(2026, 1, 1, tzinfo=timezone.utc)
    engine = ImpactEngine(db=None, analysis_date=start)
    
    parcel_id = uuid.uuid4()
    case_id = uuid.uuid4()
    act1_id = "A1"
    act2_id = "A2"
    act3_id = "A3"
    milestone_id = "M1"
    
    class FakeCase: id = case_id
    class FakeReq:
        def __init__(self, p): self.parcel_id = p
        
    engine.domain_cache = {
        "cases": {str(parcel_id): [FakeCase()]},
        "blockers": {},
        "reqs": {act1_id: [FakeReq(parcel_id)]}
    }
    
    # Configure graph dependencies: A1 -> A2 -> A3
    engine.current_engine.add_activity(act1_id, 10, start, name="A1: Land Clearing")
    engine.current_engine.add_activity(act2_id, 15, start, name="A2: Earthworks")
    engine.current_engine.add_activity(act3_id, 10, start, name="A3: Paving", milestone_id=milestone_id)
    engine.current_engine.add_dependency(act1_id, act2_id)
    engine.current_engine.add_dependency(act2_id, act3_id)
    
    mock_result = {
        "project_finish": start,
        "activities": {
            act1_id: {"name": "A1: Land Clearing", "milestone_id": None, "is_critical": True, "EF": start},
            act2_id: {"name": "A2: Earthworks", "milestone_id": None, "is_critical": True, "EF": start},
            act3_id: {"name": "A3: Paving", "milestone_id": milestone_id, "is_critical": True, "EF": start},
        }
    }
    
    evidence = {
        "parcel_id": str(parcel_id),
        "cases": [str(case_id)],
        "blockers": [],
        "affected_activities": {act1_id}
    }
    
    paths = engine._get_causal_path(mock_result, [act1_id], evidence)
    
    # Verify exact chain:
    # 1. Case -> Parcel
    # 2. Parcel -> A1
    # 3. A1 -> A2
    # 4. A2 -> A3
    # 5. A3 -> M1
    # 6. M1 -> Project Finish
    assert len(paths) == 6
    
    assert paths[0]["source_id"] == str(case_id) and paths[0]["target_id"] == str(parcel_id)
    assert paths[1]["source_id"] == str(parcel_id) and paths[1]["target_id"] == act1_id
    assert paths[1]["relationship"] == "REQUIRED_BY"
    
    assert paths[2]["source_id"] == act1_id and paths[2]["target_id"] == act2_id
    assert paths[2]["relationship"] == "PRECEDES"
    
    assert paths[3]["source_id"] == act2_id and paths[3]["target_id"] == act3_id
    assert paths[3]["relationship"] == "PRECEDES"
    
    assert paths[4]["source_id"] == act3_id and paths[4]["target_id"] == milestone_id
    assert paths[4]["relationship"] == "COMPLETES"
    
    assert paths[5]["source_id"] == milestone_id and paths[5]["target_id"] == "PROJECT_FINISH"
    assert paths[5]["relationship"] == "CONTRIBUTES_TO"
