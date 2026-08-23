-- PS-18 SHG Digital Ledger: Relational Schema & Append-Only Financial Ledger
-- All financial monetary amounts stored in integer paise (1 INR = 100 paise)

-- 1. Groups Table
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  block TEXT,
  district TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Members Table
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('Member', 'Treasurer', 'Group Leader', 'Auditor')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_group ON members(group_id);

-- 3. Meetings Table
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE RESTRICT,
  meeting_number INTEGER NOT NULL,
  date DATE NOT NULL,
  attendance_count INTEGER NOT NULL DEFAULT 0,
  quorum_met BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Attendance', 'Transactions', 'Reconciliation', 'Sign-Off', 'Blocked', 'Closed')),
  location_status TEXT DEFAULT 'AVAILABLE',
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  distance_meters INTEGER DEFAULT 0,
  closed_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, meeting_number)
);

CREATE INDEX IF NOT EXISTS idx_meetings_group ON meetings(group_id);

-- 3.1 Meeting Attendance Table
CREATE TABLE IF NOT EXISTS meeting_attendance (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  present BOOLEAN NOT NULL DEFAULT false,
  recorded_by TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (meeting_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_attendance_meeting ON meeting_attendance(meeting_id);

-- 3.2 Meeting Sign-Offs Table
CREATE TABLE IF NOT EXISTS meeting_signoffs (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Group Leader', 'Treasurer', 'President', 'Auditor')),
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signature_hash TEXT NOT NULL,
  UNIQUE (meeting_id, role)
);

CREATE INDEX IF NOT EXISTS idx_meeting_signoffs_meeting ON meeting_signoffs(meeting_id);

-- 3.3 Cash Reconciliations Table
CREATE TABLE IF NOT EXISTS cash_reconciliations (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  opening_cash_paise BIGINT NOT NULL DEFAULT 0,
  expected_cash_paise BIGINT NOT NULL DEFAULT 0,
  physical_cash_paise BIGINT NOT NULL DEFAULT 0,
  cash_delta_paise BIGINT NOT NULL DEFAULT 0,
  denominations_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'Review Required' CHECK (status IN ('Matched', 'Mismatch', 'Review Required', 'Reconciled')),
  notes TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_meeting ON cash_reconciliations(meeting_id);

-- 4. Transactions Table (Append-Only Cryptographic Hash Chain)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE RESTRICT,
  meeting_id TEXT REFERENCES meetings(id) ON DELETE SET NULL,
  member_id TEXT REFERENCES members(id) ON DELETE RESTRICT,
  member_name TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Contribution', 'Loan', 'Repayment', 'Expense', 'Withdrawal', 'Bank Deposit', 'Reversal', 'Correction')),
  description TEXT NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  principal_paise BIGINT NOT NULL DEFAULT 0 CHECK (principal_paise >= 0),
  interest_paise BIGINT NOT NULL DEFAULT 0 CHECK (interest_paise >= 0),
  payment_mode TEXT NOT NULL DEFAULT 'Cash' CHECK (payment_mode IN ('Cash', 'Bank Transfer', 'UPI', 'Cheque')),
  sequence_number BIGINT NOT NULL,
  prev_hash TEXT NOT NULL,
  current_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Rejected', 'Under Review')),
  verification TEXT NOT NULL DEFAULT 'Pending' CHECK (verification IN ('Verified', 'Pending', 'Failed')),
  approval_count INTEGER NOT NULL DEFAULT 0,
  required_approvals INTEGER NOT NULL DEFAULT 2,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_transactions_group_seq ON transactions(group_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id);

-- 5. Loans Table
CREATE TABLE IF NOT EXISTS loans (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE RESTRICT,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  member_name TEXT NOT NULL,
  principal_paise BIGINT NOT NULL CHECK (principal_paise > 0),
  repaid_paise BIGINT NOT NULL DEFAULT 0 CHECK (repaid_paise >= 0),
  interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 1.0, -- e.g. 1% per month flat/reducing
  interest_type TEXT NOT NULL DEFAULT 'Flat' CHECK (interest_type IN ('Flat', 'Reducing')),
  terms_months INTEGER NOT NULL CHECK (terms_months > 0),
  start_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Cleared', 'Overdue', 'Disputed', 'Pending')),
  notes TEXT,
  disbursement_tx_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loans_group ON loans(group_id);
CREATE INDEX IF NOT EXISTS idx_loans_member ON loans(member_id);

-- 5.1 Loan Schedules Table
CREATE TABLE IF NOT EXISTS loan_schedules (
  id TEXT PRIMARY KEY,
  loan_id TEXT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  expected_principal_paise BIGINT NOT NULL,
  expected_interest_paise BIGINT NOT NULL DEFAULT 0,
  paid_principal_paise BIGINT NOT NULL DEFAULT 0,
  paid_interest_paise BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Partial', 'Paid', 'Overdue')),
  UNIQUE (loan_id, installment_number)
);

CREATE INDEX IF NOT EXISTS idx_loan_schedules_loan ON loan_schedules(loan_id);

-- 6. Loan Repayments Table
CREATE TABLE IF NOT EXISTS loan_repayments (
  id TEXT PRIMARY KEY,
  loan_id TEXT NOT NULL REFERENCES loans(id) ON DELETE RESTRICT,
  transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  principal_paise BIGINT NOT NULL DEFAULT 0,
  interest_paise BIGINT NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loan_repayments_loan ON loan_repayments(loan_id);

-- 7. Disputes Table
CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE RESTRICT,
  transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
  reported_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Under Review' CHECK (status IN ('Under Review', 'Resolved', 'Dismissed')),
  original_amount_paise BIGINT NOT NULL,
  current_amount_paise BIGINT NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_group ON disputes(group_id);
CREATE INDEX IF NOT EXISTS idx_disputes_tx ON disputes(transaction_id);

-- 8. Audit Events Table (Immutable append-only log)
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE RESTRICT,
  actor_user_id TEXT,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_group ON audit_events(group_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at DESC);
