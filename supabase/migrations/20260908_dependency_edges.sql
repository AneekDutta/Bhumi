-- 20260908_dependency_edges.sql
-- SIH26016 Authoritative Dependency Graph Storage
-- Enables dynamic linking of citizen grievances, field verifications, and milestones to the CPM engine.

CREATE TABLE IF NOT EXISTS dependency_edges (
    edge_id         SERIAL PRIMARY KEY,
    from_node_type  TEXT NOT NULL,   -- project|village|parcel|owner|land_record|acquisition_case|compensation_record|
                                       -- rr_record|legal_case|document|verification|approval|officer|department|
                                       -- project_segment|milestone|complaint
    from_node_id    TEXT NOT NULL,
    to_node_type    TEXT NOT NULL,
    to_node_id      TEXT NOT NULL,
    edge_type       TEXT NOT NULL,   -- belongs_to|owned_by|has|requires|blocked_by|blocks|leads_to|required_for|
                                       -- contributes_to|gates|assigned_to|owns
    is_blocking     BOOLEAN NOT NULL DEFAULT FALSE,
    weight_days     NUMERIC,          -- expected resolution duration used by CPM engine
    source_type     TEXT NOT NULL DEFAULT 'SYNTHETIC'
);

CREATE INDEX IF NOT EXISTS idx_edges_from ON dependency_edges (from_node_type, from_node_id);
CREATE INDEX IF NOT EXISTS idx_edges_to   ON dependency_edges (to_node_type, to_node_id);
CREATE INDEX IF NOT EXISTS idx_edges_blocking ON dependency_edges (is_blocking);
