# Schedule Engine (Phase 3)

The Schedule Engine provides deterministic temporal reasoning over the project's activities.

## Model
- **ProjectActivity**: An operation (e.g. Earthworks) assigned to a `ProjectSegment`.
- **ActivityDependency**: A directional edge (e.g. FINISH_TO_START) between two activities.

## CPM Calculation
The engine performs a true Critical Path Method (CPM) calculation:
1. **Forward Pass**: Calculates Earliest Start (ES) and Earliest Finish (EF).
   `ES = MAX(Predecessor EF) + Exogenous Delay`
2. **Backward Pass**: Calculates Latest Start (LS) and Latest Finish (LF).
   `LF = MIN(Successor LS)`
3. **Float**: `Total Float = LS - ES`.
4. **Critical Path**: Any activity where `Float <= 0`.

## Parallel Work & Double Counting
The engine handles parallel activities automatically. Overlapping delays do not double-count toward the project finish. For example, if Activity A and Activity B run in parallel and both are delayed by 10 days, the project is delayed by exactly 10 days, not 20.


## Constraint Math (MAX Semantics)
Constraints operate on a clock relative to the `analysis_date` (exogenous acquisition clock). If multiple constraints block a single activity, the activity waits for the *latest* constraint to resolve (i.e. `MAX(delay_days)`). Constraints on sequential activities are evaluated strictly as `max(predecessor_finish, constraint_ready_date)`, preventing cumulative error.