# Bottleneck Identification Engine

## Principles
- No opaque AI/ML scores. 
- A bottleneck must be explainable through causal chains.
- Relies strictly on `services/graph_engine.py` using NetworkX.

## Logic Flow
1. Construct the Project DAG.
2. Evaluate statutory clocks for all cases against `StatutoryRule` limits.
3. Flag nodes triggering Urgency Rules (Warning/Lapse).
4. Traverse DAG downstream using `nx.descendants()`.
5. Aggregate affected entities and explicitly identify affected `Milestones`.
6. Sort final bottlenecks by Tier (CRITICAL > HIGH > MEDIUM) and then by downstream impact count.
