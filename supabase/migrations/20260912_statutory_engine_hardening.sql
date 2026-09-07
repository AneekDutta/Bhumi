-- 20260912_statutory_engine_hardening.sql
-- BHUMI SIH26016: Legal Accuracy Audit & Statutory Engine Hardening
-- Decouples statutory legal consequences from operational CPM simulation heuristics.
-- Adds audit metadata, judicial court-order tracking, and refined statutory classification.

-- 1. Extend statutory_deadline_rules table
ALTER TABLE statutory_deadline_rules
    ADD COLUMN IF NOT EXISTS rule_type TEXT NOT NULL DEFAULT 'PROCEDURAL_WINDOW',
    ADD COLUMN IF NOT EXISTS legal_effect TEXT NOT NULL DEFAULT 'ACTION_REQUIRED',
    ADD COLUMN IF NOT EXISTS calculation_basis TEXT,
    ADD COLUMN IF NOT EXISTS statutory_vs_operational TEXT NOT NULL DEFAULT 'STATUTORY',
    ADD COLUMN IF NOT EXISTS operational_delay_cpm_days INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS operational_impact_notes TEXT,
    ADD COLUMN IF NOT EXISTS exception_type TEXT,
    ADD COLUMN IF NOT EXISTS verification_notes TEXT,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ DEFAULT now(),
    ADD COLUMN IF NOT EXISTS verified_by TEXT DEFAULT 'BHUMI_LEGAL_AUDIT_RFCTLARR_2013';

-- 2. Extend statutory_deadlines table
ALTER TABLE statutory_deadlines
    ADD COLUMN IF NOT EXISTS order_specific_court_stay BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS court_order_reference TEXT,
    ADD COLUMN IF NOT EXISTS court_stay_order_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS statutory_consequence_applied TEXT,
    ADD COLUMN IF NOT EXISTS operational_cpm_delay_applied INTEGER NOT NULL DEFAULT 0;

-- 3. Indexes for hardened queries
CREATE INDEX IF NOT EXISTS idx_sd_rules_type ON statutory_deadline_rules (rule_type);
CREATE INDEX IF NOT EXISTS idx_sd_rules_effect ON statutory_deadline_rules (legal_effect);
CREATE INDEX IF NOT EXISTS idx_sd_rules_stat_vs_op ON statutory_deadline_rules (statutory_vs_operational);
CREATE INDEX IF NOT EXISTS idx_sd_court_stay ON statutory_deadlines (order_specific_court_stay);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sd_case_rule ON statutory_deadlines (acquisition_case_id, rule_id) WHERE acquisition_case_id IS NOT NULL;
