export type Screen =
  | "login"
  // Member screens
  | "member-home"
  | "member-record"
  | "member-transactions"
  | "member-loans"
  | "group-finances"
  // Treasurer screens
  | "dashboard"
  | "transactions"
  | "create-transaction"
  | "transaction-details"
  | "approvals"
  | "loans"
  | "loan-details"
  | "loan-create"
  | "verification"
  | "disputes"
  | "members"
  | "reports"
  | "settings"
  | "audit-history"
  // Federation Auditor screens
  | "fed-overview"
  | "fed-transactions"
  | "fed-verification"
  | "fed-reports"
  // New feature screens
  | "cash-reconciliation"
  | "financial-timeline"
  | "member-summary"
  // v2 screens
  | "meeting"
  | "risk-review"
  | "panchasutra"
  | "sync-center"
  | "thermal-receipt"
  | "nfc-passbook"
  | "bank-position"
  | "paper-import"
  | "demo-data";

export type UserRole = "member" | "treasurer" | "auditor";

/** Resolved authentication state of the app. */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * Minimal server-owned profile for the authenticated user.
 *
 * `role` is resolved by the Edge Function from stored profile data — never from
 * a client-supplied value. Phase 4 replaces this with a real profiles table and
 * RLS-backed authorization.
 */
export interface Profile {
  userId: string;
  displayName: string;
  role: UserRole;
  email?: string | null;
  phone?: string | null;
  /** Role the user asked for at sign-up. Untrusted — never used to authorize. */
  requestedRole?: string | null;
  /** Link to an SHG member record, once Phase 4 introduces one. */
  memberId?: string | null;
  createdAt?: string;
}

export type TransactionType = "Contribution" | "Loan" | "Repayment" | "Expense" | "Withdrawal" | "Other";
export type TransactionStatus = "Completed" | "Pending" | "Rejected" | "Under Review";
export type VerificationStatus = "Verified" | "Pending" | "Failed";
export type Role = "Member" | "Treasurer" | "Group Leader" | "Auditor";

export interface Transaction {
  id: string;
  date: string;
  member: string;
  type: TransactionType;
  description: string;
  amount: number;
  status: TransactionStatus;
  verification: VerificationStatus;
  approvalCount: number;
  requiredApprovals: number;
  hash: string;
  prevHash: string;
}

export interface Member {
  id: string;
  name: string;
  role: Role;
  status: "Active" | "Inactive";
  transactions: number;
  approvals: number;
  lastActivity: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  type: "created" | "approval" | "verified" | "modified" | "dispute" | "resolved";
  txId?: string;
}

export interface Loan {
  id: string;
  member: string;
  principal: number;
  repaid: number;
  termsMonths: number;
  startDate: string;
  status: "Active" | "Cleared" | "Overdue";
  notes?: string;
  repayments: LoanRepayment[];
}

export interface LoanRepayment {
  date: string;
  amount: number;
}
