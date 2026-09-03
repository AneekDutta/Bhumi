from app.models.domain import Project, StatutoryRule, WorkflowStage


def test_project_model_creation():
    project = Project(name="Test Highway")
    assert project.name == "Test Highway"
    assert project.id is None # UUID assigned on flush if not set

def test_statutory_rule_model():
    rule = StatutoryRule(
        rule_code="RFCTLARR_SEC19_LAPSE",
        act_code="RFCTLARR_2013",
        trigger_stage=WorkflowStage.PRELIMINARY_NOTIFICATION.value,
        target_stage=WorkflowStage.DECLARATION.value,
        duration_value=365,
        warning_threshold_days=30,
        is_hard_lapse=True,
        statutory_citation="Sec 19(7)"
    )
    assert rule.duration_value == 365
    assert rule.is_hard_lapse is True
