-- 20260910_legal_provisions.sql
-- BHUMI SIH26016: Legal & Rights Knowledge Center
-- Traceable, authoritative statutory knowledge model for RFCTLARR Act 2013 and State Rules.

CREATE TABLE IF NOT EXISTS legal_provisions (
    id                          TEXT PRIMARY KEY,
    act_name                    TEXT NOT NULL,
    act_short_name              TEXT NOT NULL,
    section_number              TEXT NOT NULL,
    subsection                  TEXT,
    title                       TEXT NOT NULL,
    category                    TEXT NOT NULL, -- NOTIFICATION | SURVEY | OBJECTION | VALUATION | COMPENSATION | R_AND_R | POSSESSION | DISPUTE | APPEAL | SC_ST_PROTECTION | DOCUMENTATION | PROCEDURAL
    applies_to                  TEXT NOT NULL DEFAULT 'BOTH', -- LANDOWNER | FIELD_OFFICER | BOTH
    acquisition_stage           TEXT, -- proposal | sia | preliminary_notification | survey | objections | rr_planning | declaration | measurement | notice_to_interested | enquiry | valuation | award | compensation_payment | rr_award | possession | dispute_reference | closure
    plain_language_summary      TEXT NOT NULL,
    landowner_guidance          TEXT,
    officer_guidance            TEXT,
    required_documents          JSONB DEFAULT '[]'::jsonb,
    statutory_citations         JSONB DEFAULT '[]'::jsonb,
    deadline_days               INTEGER,
    deadline_trigger            TEXT,
    deadline_rule_type          TEXT, -- MANDATORY_LAPSE | DIRECTORY | STATUTORY_LIMITATION | INTEREST_ACCRUAL | NONE
    calendar_rule               TEXT DEFAULT 'CALENDAR_DAYS', -- CALENDAR_DAYS | WORKING_DAYS | MONTHS | YEARS | EVENT_DEPENDENT
    consequence_if_overdue      TEXT,
    source_url                  TEXT NOT NULL,
    source_document             TEXT NOT NULL,
    source_version              TEXT NOT NULL,
    effective_from              DATE,
    effective_to                DATE,
    jurisdiction                TEXT NOT NULL DEFAULT 'CENTRAL', -- CENTRAL | RAJASTHAN | SPECIAL_PROJECT
    central_or_state            TEXT NOT NULL DEFAULT 'CENTRAL', -- CENTRAL | STATE
    verification_status         BOOLEAN NOT NULL DEFAULT TRUE,
    disclaimer                  TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_cat ON legal_provisions (category);
CREATE INDEX IF NOT EXISTS idx_legal_applies ON legal_provisions (applies_to);
CREATE INDEX IF NOT EXISTS idx_legal_stage ON legal_provisions (acquisition_stage);
CREATE INDEX IF NOT EXISTS idx_legal_jurisdiction ON legal_provisions (jurisdiction);
CREATE INDEX IF NOT EXISTS idx_legal_sec ON legal_provisions (section_number);

-- Enable RLS on legal_provisions
ALTER TABLE legal_provisions ENABLE ROW LEVEL SECURITY;

-- Transparent read/write policy for legal provisions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'legal_provisions' AND policyname = 'allow_read_legal_provisions'
    ) THEN
        CREATE POLICY allow_read_legal_provisions ON legal_provisions
            FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'legal_provisions' AND policyname = 'allow_all_legal_provisions'
    ) THEN
        CREATE POLICY allow_all_legal_provisions ON legal_provisions
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
