# What-If Simulation Model (Phase 3)

The Simulation Engine enables decision-support testing without mutating production data.

## Non-Destructive Architecture
1. Copy the `current_engine` graph into memory.
2. Apply the intervention (e.g. `RESOLVE_BLOCKER` sets `blocked_delay_days` to 0 for the target constraints).
3. Recalculate CPM (`simulate_intervention`).
4. Compare `sim_result` against `current_result` to find `days_recovered`.

The database is never committed during a simulation. Audit logs are not fired.
