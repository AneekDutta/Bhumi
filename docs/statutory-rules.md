# Statutory Rules Engine

## Representation
Legal rules are not hardcoded. They are stored in the `statutory_rules` table.

Fields:
- `rule_id`: Unique identifier (e.g., RFCTLARR_SEC19_LAPSE)
- `act_code`: The legal act (e.g., RFCTLARR_2013)
- `trigger_stage`: The workflow stage that starts the clock
- `target_stage`: The stage that must be reached to stop the clock
- `max_duration_days`: Statutory limit
- `is_hard_lapse`: Boolean indicating if proceedings terminate upon breach
- `statutory_citation`: Exact legal reference (e.g., "Section 19(7)")

## Evaluation
When a case transitions to a `trigger_stage`, a deadline is computed.
Background tasks or API requests evaluate `deadline < now()` to determine breach/lapse status.
