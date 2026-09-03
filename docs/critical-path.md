# Critical Path Methodology

## Current Implementation
The prototype leverages the Dependency Graph (DAG) to determine downstream impact. 

A traditional Critical Path Method (CPM) calculates the longest sequence of tasks. In the land acquisition domain, "criticality" is determined by:
1. **Statutory Clocks**: Expiration of a notification (e.g. Section 19 lapse).
2. **Downstream Multipliers**: An unresolved parcel holding up a segment that blocks multiple milestones.

## Bottleneck Criticality Rules
1. **CRITICAL**: The entity's statutory deadline has LAPSED, or an ACTIVE Blocker directly prevents a Milestone.
2. **HIGH**: An ACTIVE Blocker exists but hasn't yet threatened a formal Milestone.
3. **MEDIUM**: A statutory deadline is approaching (WARNING state).

The critical chain is derived by traversing `NetworkX` descendants from a CRITICAL node.
