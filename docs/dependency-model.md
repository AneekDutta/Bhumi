# Dependency Model

The dependency model is not an arbitrary graph structure (nodes/edges) but rather derived dynamically from authoritative SQL relationships and domain rules.

## Relational Dependencies
1. **Parcel ↔ Segment**: Defined explicitly in the `parcel_segments` associative table. This represents physical or planned intersections where a parcel is required for segment construction.
2. **Segment ↔ Milestone**: Defined by `milestones.segment_id`. A milestone cannot be met if its parent segment is blocked.
3. **Case ↔ Parcel**: Evaluated implicitly based on `AcquisitionCase.current_stage`. A parcel is "blocked" legally if its acquisition case has not reached `POSSESSION`.
4. **Blocker ↔ Parcel**: Captured via `workflow_blockers`. Captures active exceptions like `LITIGATION`, `FUNDS_DELAY`.

## Graph Construction (NetworkX)
The `IntelligenceEngine` constructs an in-memory DAG for a specific project:
- **Nodes**: `Case`, `Parcel`, `Segment`, `Milestone`, `Blocker`
- **Edges**: 
  - Blocker → Parcel
  - Case → Parcel (if stage != POSSESSION)
  - Parcel → Segment
  - Segment → Milestone

This DAG allows rapid topological analysis for bottlenecks without complex recursive SQL queries.
