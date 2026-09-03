# Project Impact Model (Phase 3)

The Impact Model bridges the Phase 2 logical `WorkflowBlocker` graph to the Phase 3 `ScheduleEngine` by mapping exact temporal constraints.

## Knowledge Taxonomy
Every temporal variable in the schedule engine maps to a strict taxonomy:

1. **OBSERVED**: 
   - Known facts. 
   - E.g., `actual_start`, `actual_finish`, `current_stage`.
2. **DERIVED**: 
   - Mathematically computed facts based on observed data. 
   - E.g., `Total Float` (CPM calculation), `is_critical_path`.
3. **ASSUMED (Demo Assumptions)**: 
   - Explicitly configured synthetic values where real empirical data is unavailable. 
   - Magic numbers (e.g., 60 days, 90 days) are strictly forbidden in code.
   - E.g., `WorkflowBlocker.assumed_resolution_days`, `AcquisitionCase.assumed_lapse_recovery_days`. These explicitly declare an assumed constraint duration for the schedule engine.
4. **FORECAST**: 
   - Forward-looking projections incorporating OBSERVED, DERIVED, and ASSUMED states. 
   - E.g., `current_forecast.project_finish`, `issue_recoverable_delay_days`.

## The Bridge (Acquisition to Schedule)
Acquisition state is explicitly converted to a temporal constraint via the `ActivityParcelRequirement` mapping table:
`AcquisitionCase / Blocker -> Parcel Requirement Unmet -> Assumed Delay -> Schedule Constraint`.

If no explicit `ASSUMED` duration is supplied by the data, the engine applies `0` delay. It does not fabricate impact.

## Baseline vs Current Forecast
- **Baseline**: The schedule computed solely from `ProjectActivity` planned durations and logical dependencies, assuming no acquisition delays.
- **Current Forecast**: The schedule computed after applying constraints to any activity logically blocked by `ActivityParcelRequirement`.

## Bottleneck Ranking & Counterfactual Impact
Bottlenecks are ranked by true **Project Impact**, determined counterfactually, avoiding arbitrary magic scores.
1. `issue_recoverable_delay_days`: Calculated by running the CPM engine with ONLY this issue's constraints removed (Counterfactual forecast). This natively handles parallel delays (if two issues delay parallel paths by 10 days, removing one yields 0 days recovered).
2. `affected_critical_milestones`: Count of milestones affected.
3. `is_critical_path`: Does the issue participate in the current critical path?
4. `urgency`: The statutory risk level (CRITICAL, HIGH, MEDIUM, LOW).

By returning these vectors separately, the UI accurately presents an issue with `CRITICAL` urgency but `0` recoverable days distinct from a `LOW` urgency issue blocking the primary critical path.


## Acquisition Workflow Semantics
The internal linear `stage_order` (INITIAL -> PRELIMINARY_NOTIFICATION -> OBJECTIONS -> DECLARATION -> AWARD -> COMPENSATION -> POSSESSION) is a configurable domain assumption matching the current system schema. It operates as a strict timeline model for constraint evaluation, but is not hardcoded as the sole authoritative legal workflow (different statutory acts may skip or rename stages). An activity is considered blocked if the `current_stage` index is strictly less than the `required_stage` index.