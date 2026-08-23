/**
 * PS-18 V2 — DEMO DATA REFERENCE
 * Hidden from all navigation. Access via /?demo or role switcher secret.
 * This page is a read-only reference for designers and testers.
 */

import { CheckCircle2, AlertTriangle, XCircle, Clock, Shield, Info } from "lucide-react";
import { Badge, PageShell } from "./ui";

type DataSection = { title: string; rows: [string, string][] };

const GROUP: DataSection = {
  title: "Group — Maa Durga SHG",
  rows: [
    ["Group name", "Maa Durga Self-Help Group"],
    ["Total savings", "₹87,700"],
    ["Cash in hand", "₹7,860"],
    ["Bank balance", "₹79,840"],
    ["Active loans", "7"],
    ["Outstanding loans", "₹31,500"],
    ["Federation", "Banapur Block Federation"],
  ],
};

const MEMBER: DataSection = {
  title: "Primary Member — Sunita Devi",
  rows: [
    ["Member ID", "M-02"],
    ["Name", "Sunita Devi"],
    ["Personal savings", "₹12,500"],
    ["Outstanding loan", "₹6,000"],
    ["Next installment", "₹1,000"],
  ],
};

const TRANSACTION: DataSection = {
  title: "Demo Transaction — #1047",
  rows: [
    ["Transaction ID", "TXN-1047"],
    ["Type", "Contribution"],
    ["Amount", "₹500"],
    ["Date", "22 Aug 2026"],
    ["Time", "14:32"],
    ["Member", "Sunita Devi"],
    ["Status", "Verified"],
    ["Dispute ID", "D-1047"],
  ],
};

const TAMPER: DataSection = {
  title: "Tamper Demo — TXN-1047",
  rows: [
    ["Original amount", "₹5,000"],
    ["Modified amount", "₹50,000"],
    ["Status", "Integrity Compromised"],
    ["Hash verification", "FAILED"],
    ["Affected downstream records", "2"],
  ],
};

const LOAN: DataSection = {
  title: "Demo Loan",
  rows: [
    ["Principal", "₹10,000"],
    ["Repaid", "₹4,000"],
    ["Outstanding", "₹6,000"],
    ["Monthly repayment", "₹1,000"],
    ["Terms", "10 months"],
    ["Status", "Partially Repaid"],
  ],
};

const MEETING: DataSection = {
  title: "Meeting #48",
  rows: [
    ["Meeting number", "#48"],
    ["Date", "22 Aug 2026"],
    ["Closed at", "18:21"],
    ["Attendance", "14 / 18"],
    ["Quorum", "✓ Met (70% = 13 required)"],
    ["Transactions", "23"],
    ["Cash", "₹87,700"],
    ["Cash difference", "₹0"],
    ["Status", "Closed"],
    ["President", "Meera Patel"],
    ["Treasurer", "Rekha Singh"],
  ],
};

const TRANSACTION_STATES = [
  { state: "RECORDED",              label: "Saved to ledger",                                    variant: "recorded"  as const, icon: <Clock size={13} /> },
  { state: "PENDING VERIFICATION",  label: "Waiting for verification",                            variant: "pending"   as const, icon: <Clock size={13} /> },
  { state: "VERIFIED",              label: "Ledger verified",                                     variant: "verified"  as const, icon: <CheckCircle2 size={13} /> },
  { state: "DISPUTED",              label: "Member reported a problem",                           variant: "disputed"  as const, icon: <AlertTriangle size={13} /> },
  { state: "UNDER REVIEW",          label: "Auditor is reviewing this transaction",               variant: "review"    as const, icon: <Info size={13} /> },
  { state: "RESOLVED",              label: "Dispute resolved",                                    variant: "resolved"  as const, icon: <CheckCircle2 size={13} /> },
  { state: "INTEGRITY COMPROMISED", label: "Recorded amount no longer matches verified ledger",   variant: "integrity" as const, icon: <XCircle size={13} /> },
];

const LOAN_STATES = [
  { state: "PENDING APPROVAL", label: "Awaiting committee approval",     variant: "pending"  as const },
  { state: "ACTIVE",           label: "Loan disbursed, repaying",        variant: "pending"  as const },
  { state: "PARTIALLY REPAID", label: "Some repayments recorded",        variant: "partial"  as const },
  { state: "OVERDUE",          label: "Missed repayment deadline",       variant: "overdue"  as const },
  { state: "CLOSED",           label: "Fully repaid",                    variant: "verified" as const },
  { state: "DISPUTED",         label: "Loan record contested",           variant: "disputed" as const },
];

const MEETING_STATES = [
  { state: "OPEN",               label: "Meeting started",           variant: "recorded" as const },
  { state: "ATTENDANCE CHECK",   label: "Taking attendance",         variant: "pending"  as const },
  { state: "TRANSACTION ENTRY",  label: "Recording transactions",    variant: "pending"  as const },
  { state: "CASH RECONCILIATION",label: "Counting cash",             variant: "pending"  as const },
  { state: "SIGN OFF",           label: "Awaiting approvals",        variant: "review"   as const },
  { state: "CLOSED",             label: "Meeting complete",          variant: "verified" as const },
  { state: "BLOCKED",            label: "Cannot proceed — see reason", variant: "blocked"  as const },
];

function RefSection({ section }: { section: DataSection }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[6px] overflow-hidden">
      <div className="px-4 py-2.5 bg-[#f9fafb] border-b border-[#e5e7eb]">
        <span className="text-xs font-semibold text-[#374151]">{section.title}</span>
      </div>
      <div className="divide-y divide-[#f3f4f6]">
        {section.rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between px-4 py-2">
            <span className="text-xs text-[#6b7280]">{k}</span>
            <span className="text-xs font-semibold text-[#111827] tabular-nums">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DemoData() {
  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={15} className="text-[#3b4fd8]" strokeWidth={1.75} />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#3b4fd8]">PS-18 V2 — Implementation Ready</span>
          </div>
          <h1 className="text-xl font-bold text-[#111827]">Demo Data Reference</h1>
          <p className="text-xs text-[#9ca3af] mt-0.5">Hidden page — not visible in member/treasurer/auditor navigation</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-[6px] px-3 py-2 text-xs text-amber-700 font-medium">
          Not in nav
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <RefSection section={GROUP} />
        <RefSection section={MEMBER} />
        <RefSection section={TRANSACTION} />
        <RefSection section={TAMPER} />
        <RefSection section={LOAN} />
        <RefSection section={MEETING} />
      </div>

      {/* Transaction state model */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-[#111827] mb-1">Transaction State Model</h2>
        <p className="text-xs text-[#9ca3af] mb-3">Every transaction passes through these lifecycle states</p>
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] divide-y divide-[#f3f4f6]">
          {TRANSACTION_STATES.map(({ state, label, variant, icon }) => (
            <div key={state} className="flex items-center gap-3 px-4 py-3">
              <Badge variant={variant}>
                <span className="flex items-center gap-1">{icon}{state}</span>
              </Badge>
              <span className="text-xs text-[#6b7280] flex-1">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Loan state model */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-[#111827] mb-1">Loan State Model</h2>
        <p className="text-xs text-[#9ca3af] mb-3">Loan lifecycle states used across member and treasurer views</p>
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] divide-y divide-[#f3f4f6]">
          {LOAN_STATES.map(({ state, label, variant }) => (
            <div key={state} className="flex items-center gap-3 px-4 py-3">
              <Badge variant={variant}>{state}</Badge>
              <span className="text-xs text-[#6b7280] flex-1">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Meeting state model */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-[#111827] mb-1">Meeting State Model</h2>
        <p className="text-xs text-[#9ca3af] mb-3">A meeting becomes BLOCKED if: quorum not met, cash diff ≠ ₹0, approval missing, or ledger invalid</p>
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] divide-y divide-[#f3f4f6]">
          {MEETING_STATES.map(({ state, label, variant }) => (
            <div key={state} className="flex items-center gap-3 px-4 py-3">
              <Badge variant={variant}>{state}</Badge>
              <span className="text-xs text-[#6b7280] flex-1">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Validation rules */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-[#111827] mb-1">Validation Rules</h2>
        <p className="text-xs text-[#9ca3af] mb-3">These must be enforced in the implementation layer</p>
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] divide-y divide-[#f3f4f6]">
          {[
            ["Contribution", "amount > 0"],
            ["Loan", "principal > 0"],
            ["Repayment", "repayment_amount ≤ outstanding_balance"],
            ["Cash reconciliation", "physical_cash − expected_cash == 0"],
            ["Meeting quorum", "present ≥ required_quorum (70%)"],
            ["Meeting closure", "cash_delta == 0 AND quorum_met AND signoffs_complete AND ledger_valid"],
            ["Tamper detection", "current_hash == expected_hash"],
            ["Dispute", "transaction_id must exist in ledger"],
          ].map(([rule, constraint]) => (
            <div key={rule} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
              <span className="text-xs font-medium text-[#374151]">{rule}</span>
              <code className="text-[11px] text-[#3b4fd8] font-mono bg-blue-50 px-1.5 py-0.5 rounded">{constraint}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Access control */}
      <div>
        <h2 className="text-sm font-semibold text-[#111827] mb-1">Access Control</h2>
        <p className="text-xs text-[#9ca3af] mb-3">Role capabilities enforced at the UI layer</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            {
              role: "Member",
              can: ["Record contribution", "Record repayment", "View own finances", "View group finances", "Report transaction problem", "Use passbook", "View sync status"],
              cannot: ["Close meeting", "Approve loans", "Modify ledger", "Resolve disputes"],
            },
            {
              role: "Treasurer",
              can: ["Record transactions", "Manage loans", "Perform reconciliation", "Manage meetings", "Print receipts", "Import paper records"],
              cannot: ["Silently delete transactions", "Remove audit history"],
            },
            {
              role: "Auditor",
              can: ["Inspect records", "Verify integrity", "Review anomalies", "Review disputes", "Generate reports"],
              cannot: ["Silently modify historical financial records"],
            },
          ].map(({ role, can, cannot }) => (
            <div key={role} className="bg-white border border-[#e5e7eb] rounded-[6px] overflow-hidden">
              <div className="px-4 py-2.5 bg-[#f9fafb] border-b border-[#e5e7eb]">
                <span className="text-xs font-semibold text-[#374151]">{role}</span>
              </div>
              <div className="px-4 py-3 space-y-1">
                {can.map((c) => (
                  <div key={c} className="flex items-start gap-2 text-xs text-[#374151]">
                    <CheckCircle2 size={11} className="text-green-500 shrink-0 mt-0.5" strokeWidth={2} />
                    {c}
                  </div>
                ))}
                <div className="border-t border-[#f3f4f6] my-2" />
                {cannot.map((c) => (
                  <div key={c} className="flex items-start gap-2 text-xs text-[#9ca3af]">
                    <XCircle size={11} className="text-red-400 shrink-0 mt-0.5" strokeWidth={2} />
                    {c}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
