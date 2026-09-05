-- ============================================================
-- SIH26016 Land Acquisition Digital Twin — PostgreSQL + PostGIS schema
-- All data inserted against this schema for the prototype is SYNTHETIC
-- unless source_type = 'REAL_PUBLIC' and source_url is populated.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ---------- Shared provenance columns (mixed into every table) ----------
-- source_type: REAL_PUBLIC | SYNTHETIC | USER_ENTERED | MODEL_DERIVED

CREATE TABLE projects (
    project_id          TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    project_type        TEXT NOT NULL,          -- highway | railway | metro | airport | industrial_corridor | dam | power
    state               TEXT,
    district             TEXT,
    alignment           GEOMETRY(LINESTRING, 4326),   -- centerline
    estimated_cost      NUMERIC,
    start_date          DATE,
    target_completion   DATE,
    projected_completion DATE,                  -- MODEL_DERIVED, recomputed by CPM engine
    status              TEXT,                    -- planning | in_progress | delayed | completed
    source_type         TEXT NOT NULL DEFAULT 'SYNTHETIC',
    source              TEXT,
    source_url          TEXT,
    source_timestamp    TIMESTAMPTZ,
    verification_status TEXT,
    confidence          NUMERIC,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE villages (
    village_id      TEXT PRIMARY KEY,
    project_id      TEXT REFERENCES projects(project_id),
    name            TEXT NOT NULL,
    tehsil          TEXT,
    district        TEXT,
    state           TEXT,
    boundary        GEOMETRY(MULTIPOLYGON, 4326),
    population      INTEGER,
    source_type     TEXT NOT NULL DEFAULT 'SYNTHETIC',
    source          TEXT,
    source_url      TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE departments (
    department_id   TEXT PRIMARY KEY,
    name            TEXT NOT NULL,          -- e.g. Revenue Dept, PWD, District Collectorate, NHAI Regional Office
    jurisdiction    TEXT,
    source_type     TEXT NOT NULL DEFAULT 'SYNTHETIC'
);

CREATE TABLE officers (
    officer_id      TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    designation     TEXT,
    department_id   TEXT REFERENCES departments(department_id),
    assigned_villages TEXT[],
    source_type     TEXT NOT NULL DEFAULT 'SYNTHETIC'
);

CREATE TABLE owners (
    owner_id        TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    owner_type      TEXT,           -- individual | joint | institutional
    contact_village TEXT,
    source_type     TEXT NOT NULL DEFAULT 'SYNTHETIC'
);

CREATE TABLE parcels (
    parcel_id           TEXT PRIMARY KEY,
    project_id          TEXT REFERENCES projects(project_id),
    village_id          TEXT REFERENCES villages(village_id),
    survey_number       TEXT NOT NULL,          -- khasra-style number, synthetic
    geometry            GEOMETRY(POLYGON, 4326) NOT NULL,
    area_sqm            NUMERIC,
    land_use            TEXT,                   -- agricultural | residential | commercial | forest | barren
    acquisition_status  TEXT,                   -- not_started | notified | award_declared | compensated | possessed
    owner_id            TEXT REFERENCES owners(owner_id),
    ownership_conflict  BOOLEAN DEFAULT FALSE,
    conflict_type       TEXT,                   -- none | duplicate_claim | succession_dispute | boundary_dispute
    criticality_score   NUMERIC,                -- MODEL_DERIVED
    risk_score          NUMERIC,                -- MODEL_DERIVED
    is_hidden_critical  BOOLEAN DEFAULT FALSE,   -- generator-injected scenario flag (internal QA use)
    source_type         TEXT NOT NULL DEFAULT 'SYNTHETIC',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_parcels_geom ON parcels USING GIST (geometry);

CREATE TABLE land_records (
    record_id       TEXT PRIMARY KEY,
    parcel_id       TEXT REFERENCES parcels(parcel_id),
    record_type     TEXT,           -- jamabandi | mutation | girdawari
    record_date     DATE,
    details_json    JSONB,
    source_type     TEXT NOT NULL DEFAULT 'SYNTHETIC'
);

CREATE TABLE acquisition_cases (
    case_id             TEXT PRIMARY KEY,
    parcel_id           TEXT REFERENCES parcels(parcel_id),
    notification_date   DATE,       -- Section 11 RFCTLARR
    declaration_date    DATE,       -- Section 19
    award_date          DATE,       -- Section 30
    possession_date     DATE,
    status              TEXT,       -- notified | declared | awarded | compensation_pending | possessed | disputed
    source_type         TEXT NOT NULL DEFAULT 'SYNTHETIC'
);

CREATE TABLE compensation_records (
    compensation_id         TEXT PRIMARY KEY,
    case_id                 TEXT REFERENCES acquisition_cases(case_id),
    market_value_base       NUMERIC,
    multiplier_factor       NUMERIC,        -- RFCTLARR First Schedule, 1.0-2.0
    asset_value             NUMERIC,        -- Sections 28-29
    severance_damage        NUMERIC,
    subtotal_before_solatium NUMERIC,
    solatium_amount         NUMERIC,        -- Section 30(1), 100% of subtotal
    interest_12pct_amount   NUMERIC,        -- Section 30(3)
    total_compensation      NUMERIC,
    compensation_status     TEXT,           -- pending | disbursed | disputed | enhanced_by_court
    source_type             TEXT NOT NULL DEFAULT 'MODEL_DERIVED'  -- computed via real RFCTLARR formula on synthetic inputs
);

CREATE TABLE rr_records (
    rr_id               TEXT PRIMARY KEY,
    case_id             TEXT REFERENCES acquisition_cases(case_id),
    family_type         TEXT,       -- titleholder | landless_labourer | tenant
    housing_entitlement NUMERIC,
    subsistence_allowance NUMERIC,
    transport_allowance NUMERIC,
    resettlement_allowance NUMERIC,
    livelihood_option   TEXT,       -- annuity | employment | one_time
    rr_status           TEXT,       -- not_applicable | pending | in_progress | completed
    source_type         TEXT NOT NULL DEFAULT 'SYNTHETIC'
);

CREATE TABLE legal_cases (
    legal_case_id   TEXT PRIMARY KEY,
    case_id         TEXT REFERENCES acquisition_cases(case_id),  -- NULL for real reference cases
    case_name       TEXT,
    court           TEXT,
    filed_date      DATE,
    legal_issue     TEXT,
    legal_status    TEXT,       -- none | filed | in_hearing | stayed | decided_for_owner | decided_for_authority
    decision_notes  TEXT,
    is_reference_case BOOLEAN DEFAULT FALSE,  -- TRUE for real historical cases (Section 1/5), not wired into live graph
    source_type     TEXT NOT NULL DEFAULT 'SYNTHETIC',
    source          TEXT,
    source_url      TEXT
);

CREATE TABLE documents (
    document_id     TEXT PRIMARY KEY,
    case_id         TEXT REFERENCES acquisition_cases(case_id),
    parcel_id       TEXT REFERENCES parcels(parcel_id),
    document_type   TEXT,       -- notification | award | title_deed | mutation_certificate | rr_entitlement_card
    upload_date     DATE,
    document_status TEXT,       -- missing | submitted | under_verification | verified | rejected_inconsistent
    file_ref        TEXT,
    extracted_fields JSONB,     -- MODEL_DERIVED OCR/NLP output
    source_type     TEXT NOT NULL DEFAULT 'SYNTHETIC'
);

CREATE TABLE verifications (
    verification_id TEXT PRIMARY KEY,
    document_id     TEXT REFERENCES documents(document_id),
    parcel_id       TEXT REFERENCES parcels(parcel_id),
    verification_type TEXT,     -- ownership | document | field
    status          TEXT,       -- pending | verified | rejected
    officer_id      TEXT REFERENCES officers(officer_id),
    verified_at     TIMESTAMPTZ,
    source_type     TEXT NOT NULL DEFAULT 'SYNTHETIC'
);

CREATE TABLE approvals (
    approval_id     TEXT PRIMARY KEY,
    entity_type     TEXT,       -- compensation | rr | possession | notification
    entity_id       TEXT,       -- polymorphic reference
    officer_id      TEXT REFERENCES officers(officer_id),
    department_id   TEXT REFERENCES departments(department_id),
    approval_status TEXT,       -- pending | under_review | approved | rejected | escalated
    requested_at    TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ,
    source_type     TEXT NOT NULL DEFAULT 'SYNTHETIC'
);

CREATE TABLE project_segments (
    segment_id      TEXT PRIMARY KEY,
    project_id      TEXT REFERENCES projects(project_id),
    name            TEXT,
    geometry        GEOMETRY(LINESTRING, 4326),
    chainage_start  NUMERIC,
    chainage_end    NUMERIC,
    status          TEXT,
    source_type     TEXT NOT NULL DEFAULT 'SYNTHETIC'
);

CREATE TABLE parcel_segment_map (
    parcel_id       TEXT REFERENCES parcels(parcel_id),
    segment_id      TEXT REFERENCES project_segments(segment_id),
    PRIMARY KEY (parcel_id, segment_id)
);

CREATE TABLE milestones (
    milestone_id    TEXT PRIMARY KEY,
    project_id      TEXT REFERENCES projects(project_id),
    name            TEXT,
    target_date     DATE,
    projected_date  NUMERIC,   -- MODEL_DERIVED
    status          TEXT,
    source_type     TEXT NOT NULL DEFAULT 'SYNTHETIC'
);

CREATE TABLE segment_milestone_map (
    segment_id      TEXT REFERENCES project_segments(segment_id),
    milestone_id    TEXT REFERENCES milestones(milestone_id),
    PRIMARY KEY (segment_id, milestone_id)
);

-- ---------- Dependency graph (generic edge table, Section 11) ----------
CREATE TABLE dependency_edges (
    edge_id         SERIAL PRIMARY KEY,
    from_node_type  TEXT NOT NULL,   -- project|village|parcel|owner|land_record|acquisition_case|compensation_record|
                                       -- rr_record|legal_case|document|verification|approval|officer|department|
                                       -- project_segment|milestone
    from_node_id    TEXT NOT NULL,
    to_node_type    TEXT NOT NULL,
    to_node_id      TEXT NOT NULL,
    edge_type       TEXT NOT NULL,   -- belongs_to|owned_by|has|requires|blocked_by|blocks|leads_to|required_for|
                                       -- contributes_to|gates|assigned_to|owns
    is_blocking     BOOLEAN NOT NULL DEFAULT FALSE,
    weight_days     NUMERIC,          -- expected resolution duration used by CPM engine
    source_type     TEXT NOT NULL DEFAULT 'SYNTHETIC'
);
CREATE INDEX idx_edges_from ON dependency_edges (from_node_type, from_node_id);
CREATE INDEX idx_edges_to   ON dependency_edges (to_node_type, to_node_id);

-- ---------- Roads / infrastructure reference layers (real, e.g. OSM-derived) ----------
CREATE TABLE roads (
    road_id         TEXT PRIMARY KEY,
    name            TEXT,
    road_class      TEXT,
    geometry        GEOMETRY(LINESTRING, 4326),
    source_type     TEXT NOT NULL DEFAULT 'REAL_PUBLIC',
    source          TEXT DEFAULT 'OpenStreetMap via Geofabrik',
    source_url      TEXT DEFAULT 'https://download.geofabrik.de/asia/india.html'
);

CREATE TABLE infrastructure (
    infra_id        TEXT PRIMARY KEY,
    name            TEXT,
    infra_type      TEXT,   -- railway_line|railway_station|river|water_body|airport|city
    geometry        GEOMETRY(GEOMETRY, 4326),  -- mixed types across rows
    source_type     TEXT NOT NULL DEFAULT 'REAL_PUBLIC',
    source          TEXT,
    source_url      TEXT
);

CREATE TABLE audit_logs (
    log_id          BIGSERIAL PRIMARY KEY,
    entity_type     TEXT NOT NULL,
    entity_id       TEXT NOT NULL,
    action          TEXT NOT NULL,      -- created|status_changed|approved|rejected|document_uploaded|comment
    actor_id        TEXT,               -- officer_id or 'system'
    before_value    JSONB,
    after_value     JSONB,
    timestamp       TIMESTAMPTZ DEFAULT now(),
    source_type     TEXT NOT NULL DEFAULT 'USER_ENTERED'
);
