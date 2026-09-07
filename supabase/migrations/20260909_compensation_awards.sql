-- 20260909_compensation_awards.sql
-- RFCTLARR Act 2013 Statutory Valuation & Compensation Award Storage
-- Preserves Section 26-30 statutory calculation breakdowns, explainable rule traces, and payment status workflow.

CREATE TABLE IF NOT EXISTS compensation_records (
    compensation_id             TEXT PRIMARY KEY,
    parcel_id                   TEXT,
    case_id                     TEXT,
    market_value_base           NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
    multiplier_factor           NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
    asset_value                 NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
    severance_damage            NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
    subtotal_before_solatium    NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
    solatium_amount             NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
    interest_12pct_amount       NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
    total_compensation          NUMERIC(14, 2) NOT NULL DEFAULT 0.0,
    compensation_status         TEXT NOT NULL DEFAULT 'CALCULATED', -- CALCULATED | APPROVED | PAYMENT_PENDING | PAID | DISPUTED | ON_HOLD
    rule_version                TEXT NOT NULL DEFAULT 'RFCTLARR_2013_DEMO_V1',
    rule_basis                  TEXT NOT NULL DEFAULT 'RFCTLARR Act 2013 (First Schedule, Sections 26-30) - Synthetic Demo Configuration v2026.1',
    calculation_trace           JSONB,
    valuation_inputs            JSONB,
    payment_status              TEXT NOT NULL DEFAULT 'CALCULATED', -- CALCULATED | APPROVED | PAYMENT_PENDING | PAID | DISPUTED | ON_HOLD
    award_date                  DATE,
    approved_by                 TEXT,
    approved_at                 TIMESTAMPTZ,
    source_type                 TEXT NOT NULL DEFAULT 'MODEL_DERIVED',
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comp_parcel_id ON compensation_records (parcel_id);
CREATE INDEX IF NOT EXISTS idx_comp_case_id ON compensation_records (case_id);
CREATE INDEX IF NOT EXISTS idx_comp_status ON compensation_records (compensation_status);
CREATE INDEX IF NOT EXISTS idx_comp_payment ON compensation_records (payment_status);

-- Enable RLS on compensation_records
ALTER TABLE compensation_records ENABLE ROW LEVEL SECURITY;

-- Transparent read/write policy: all authenticated and backend roles can manage compensation awards
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'compensation_records' AND policyname = 'allow_all_compensation_records'
    ) THEN
        CREATE POLICY allow_all_compensation_records ON compensation_records
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
