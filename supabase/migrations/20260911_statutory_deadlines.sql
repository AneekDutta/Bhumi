-- 20260911_statutory_deadlines.sql
-- BHUMI SIH26016: Statutory Deadline & Legal Clock Engine
-- Rule-driven, deterministic calculation engine converting RFCTLARR Act 2013 and Rajasthan Rules 2016
-- provisions into case-specific statutory clocks with CPM impact.

-- 1. Statutory Deadline Rules Definition Table
CREATE TABLE IF NOT EXISTS statutory_deadline_rules (
    id                          TEXT PRIMARY KEY,
    legal_provision_id          TEXT REFERENCES legal_provisions(id) ON DELETE SET NULL,
    rule_name                   TEXT NOT NULL,
    description                 TEXT NOT NULL,
    jurisdiction                TEXT NOT NULL DEFAULT 'CENTRAL', -- CENTRAL | RAJASTHAN
    applies_to_role             TEXT NOT NULL DEFAULT 'FIELD_OFFICER', -- LANDOWNER | FIELD_OFFICER | COLLECTOR | BOTH
    trigger_event               TEXT NOT NULL, -- SECTION_11_PUBLICATION | SECTION_19_DECLARATION | SECTION_21_NOTICE | AWARD_PRONOUNCEMENT | POSSESSION_TAKEN | SECTION_64_APPLICATION
    clock_type                  TEXT NOT NULL, -- CALENDAR_DAYS | MONTHS | YEARS | FIXED_DATE | EVENT_DEPENDENT (WORKING_DAYS unsupported without calendar model)
    duration_value              INTEGER,
    duration_unit               TEXT, -- DAYS | WEEKS | MONTHS | YEARS | EVENT
    start_rule                  TEXT NOT NULL DEFAULT 'DATE_OF_EVENT', -- DATE_OF_EVENT | DAY_AFTER_EVENT | EVENT_OCCURRENCE
    end_rule                    TEXT NOT NULL DEFAULT 'EXACT_DATE', -- EXACT_DATE | SAME_DAY_NEXT_MONTH | NEXT_DAY
    responsible_role            TEXT NOT NULL, -- COLLECTOR | FIELD_OFFICER | LANDOWNER | REQUIRING_BODY
    required_action             TEXT NOT NULL,
    consequence_if_overdue      TEXT NOT NULL,
    is_mandatory_lapse          BOOLEAN NOT NULL DEFAULT FALSE,
    cpm_delay_weight_days       INTEGER NOT NULL DEFAULT 0,
    calculation_notes           TEXT,
    exceptions                  JSONB DEFAULT '[]'::jsonb,
    source_url                  TEXT NOT NULL,
    source_version              TEXT NOT NULL,
    effective_from              DATE,
    effective_to                DATE,
    verification_status         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sd_rules_prov ON statutory_deadline_rules (legal_provision_id);
CREATE INDEX IF NOT EXISTS idx_sd_rules_trigger ON statutory_deadline_rules (trigger_event);
CREATE INDEX IF NOT EXISTS idx_sd_rules_jurisdiction ON statutory_deadline_rules (jurisdiction);
CREATE INDEX IF NOT EXISTS idx_sd_rules_lapse ON statutory_deadline_rules (is_mandatory_lapse);

-- 2. Case-Specific Statutory Deadlines Table
CREATE TABLE IF NOT EXISTS statutory_deadlines (
    id                          TEXT PRIMARY KEY,
    rule_id                     TEXT NOT NULL REFERENCES statutory_deadline_rules(id) ON DELETE CASCADE,
    acquisition_case_id         TEXT,
    parcel_id                   TEXT,
    milestone_id                TEXT,
    trigger_event               TEXT NOT NULL,
    trigger_date                DATE NOT NULL,
    calculated_due_date         DATE NOT NULL,
    completed_date              DATE,
    status                      TEXT NOT NULL DEFAULT 'UPCOMING', -- UPCOMING | DUE_SOON | OVERDUE | COMPLETED | WAIVED | SUPERSEDED | NOT_APPLICABLE
    responsible_role            TEXT NOT NULL,
    source_snapshot             JSONB DEFAULT '{}'::jsonb,
    calculation_trace           JSONB DEFAULT '{}'::jsonb,
    extension_days              INTEGER NOT NULL DEFAULT 0,
    extension_reason            TEXT,
    is_blocking_cpm             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sd_case ON statutory_deadlines (acquisition_case_id);
CREATE INDEX IF NOT EXISTS idx_sd_parcel ON statutory_deadlines (parcel_id);
CREATE INDEX IF NOT EXISTS idx_sd_milestone ON statutory_deadlines (milestone_id);
CREATE INDEX IF NOT EXISTS idx_sd_status ON statutory_deadlines (status);
CREATE INDEX IF NOT EXISTS idx_sd_due_date ON statutory_deadlines (calculated_due_date);
CREATE INDEX IF NOT EXISTS idx_sd_blocking ON statutory_deadlines (is_blocking_cpm);

-- Enable RLS
ALTER TABLE statutory_deadline_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE statutory_deadlines ENABLE ROW LEVEL SECURITY;

-- Transparent read/write policies for statutory deadlines
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'statutory_deadline_rules' AND policyname = 'allow_read_deadline_rules'
    ) THEN
        CREATE POLICY allow_read_deadline_rules ON statutory_deadline_rules FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'statutory_deadline_rules' AND policyname = 'allow_all_deadline_rules'
    ) THEN
        CREATE POLICY allow_all_deadline_rules ON statutory_deadline_rules FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'statutory_deadlines' AND policyname = 'allow_read_deadlines'
    ) THEN
        CREATE POLICY allow_read_deadlines ON statutory_deadlines FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'statutory_deadlines' AND policyname = 'allow_all_deadlines'
    ) THEN
        CREATE POLICY allow_all_deadlines ON statutory_deadlines FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
