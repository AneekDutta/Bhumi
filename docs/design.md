# Design Document

## Information Architecture
1. **Global Dashboard**: National/State aggregate metrics.
2. **Project Hub**: Single project view, KPIs, and corridor map.
3. **Intelligence / Bottleneck View**: Deep dive into the dependency DAG and causal chains.
4. **Parcel/Case Detail**: Record-level operational view with Statutory Clock and Audit Trail.

## Primary Navigation
- Left Sidebar (or top nav): Dashboard | Projects | Intelligence | Administration

## Project View
- Summary cards: Total length, Total Parcels, Acquisition % Complete.
- List of Corridors/Segments.
- Embedded map view (planned).

## Parcel / Acquisition Case View
- Top: Status Badge (e.g. DECLARATION)
- Middle: Statutory Clock component (Progress bar, days remaining/lapsed, color coded).
- Bottom: Immutable Audit Log of stage transitions.

## Investigation / Intelligence View
- **Problem**: Graphs (node/link diagrams) often look messy and provide no actionable value.
- **Solution**: A structured, color-coded Card list ranked by Criticality.
- Each Card expands to show:
  1. Root Cause (e.g., Active Litigation)
  2. Causal Chain (`Parcel A` → `Segment 1` → `Milestone M`)
  3. Affected downstream impact count.

## Visual Hierarchy & Interaction Principles
- **Color Semantics**: Red (Critical/Lapsed), Orange (High/Blocker), Amber (Warning), Green (Resolved/Possession), Blue (Info).
- **Typography**: Clean sans-serif (Inter/Geist), monospaced fonts for IDs and technical chains.
- **Responsiveness**: Mobile-first grid layouts for field surveyors updating cases.

*(PLANNED, NOT FULLY IMPLEMENTED)*
