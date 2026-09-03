# Product Requirements Document (PRD)
**Project**: SIH26016 (National Land Acquisition & Project Management Platform)

## PROBLEM
Infrastructure projects face severe delays due to opaque land acquisition processes, untracked statutory deadlines, and unmanaged dependencies between legal bottlenecks and construction milestones.

## USERS
1. **District Officers / LAOs**: Manage ground-level acquisition, notices, and possession.
2. **Project Managers**: Track corridor segments, construction milestones, and dependencies.
3. **State/National Administrators**: Monitor overall project health, financial outlay, and severe bottlenecks.
4. **Citizens/Owners (Future)**: Access compensation status and statutory notices.

## CORE VALUE PROPOSITION
Provide deterministic, evidence-based visibility—connecting obscure legal land holdups directly to high-visibility project delays via **Dependency Intelligence**.

## FUNCTIONAL REQUIREMENTS
- **Domain API**: CRUD for Projects, Parcels, Cases.
- **Clock Engine**: Deterministic date-math for statutory rules.
- **Dependency Intelligence Engine**: NetworkX-based topological bottleneck identification and downstream impact analysis.
- **What-If Simulation**: (Phase 3) Model schedule impact.
- **Dashboard**: (Phase 5) Viz of critical bottlenecks, causal chains, and downstream impact.

## SECURITY REQUIREMENTS
See `docs/security/security-requirements.md`

## SUCCESS CRITERIA
- System operates locally securely with defense-in-depth baseline established.
- Graph correctly flags lapsed statutory rules.

## ROADMAP
- [x] PHASE 1: Foundation
- [x] PHASE 1.5: Hardening
- [x] PHASE 2: Dependency + Bottleneck Intelligence
- [x] SECURITY/DOC FOUNDATION: Cross-cutting preparation, NOT a product feature phase
- [ ] PHASE 3: Project Impact + What-If Simulation
- [ ] PHASE 4: Spatial Intelligence
- [ ] PHASE 5: National Dashboard + MIS
- [ ] PHASE 6: Final Hardening + Deployment + Demo

## DEMO STORY
The judge will see a multi-segment highway. The dashboard highlights a red "CRITICAL" bottleneck. Clicking it reveals exactly *why*: a specific parcel is 12 days past its Section 19 deadline, blocking Segment 2. The judge sees the evidence and the audit trail of *who performed the recorded workflow action* that led to this state.

*(Note on Performance claims: Any metric such as <50ms graph evaluation is measured on a synthetic development dataset of 5,000 nodes/edges locally.)*
