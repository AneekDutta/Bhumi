import { CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { PageShell } from "./ui";
import { NoteRow } from "./CurrencyNotes";
import { useData } from "../DataContext";
import type { Screen } from "../types";

interface GroupFinancesProps {
  onNavigate?: (s: Screen) => void;
}

export default function GroupFinances({ onNavigate }: GroupFinancesProps) {
  const { transactions, loans, stats, loading } = useData();

  const activeLoans = loans.filter((l: any) => l.status === "Active" || l.status === "Overdue");
  const balance = stats?.balance ?? 80000;
  const activeLoansCount = stats?.activeLoans ?? activeLoans.length;
  const totalOutstanding = stats?.outstandingLoans ?? activeLoans.reduce((s: number, l: any) => s + (Number(l.principal || 0) - Number(l.repaid || 0)), 0);
  const cash = Math.round(balance * 0.1);
  const bank = balance - cash;

  const monthTxns = transactions.filter((tx: any) => tx.date?.includes("Aug") || tx.created_at?.includes("2026-08"));
  const monthContributions = monthTxns.filter((tx: any) => tx.type === "Contribution" || tx.transaction_type === "Contribution").reduce((s: number, tx: any) => s + Number(tx.amount || 0), 0);
  const monthRepayments = monthTxns.filter((tx: any) => tx.type === "Repayment" || tx.transaction_type === "Repayment").reduce((s: number, tx: any) => s + Number(tx.amount || 0), 0);

  const recentActivity = transactions.slice(0, 6);

  return (
    <PageShell>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[#111827]">Group Finances</h1>
        <p className="text-xs text-[#6b7280] mt-0.5">Maa Durga SHG &mdash; summary visible to all members</p>
      </div>

      {/* Main stats */}
      <div className="bg-white border border-[#e5e7eb] rounded-[6px] mb-4">
        <div className="px-4 py-2.5 border-b border-[#e5e7eb]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Group savings</span>
        </div>
        <div className="px-5 py-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af] mb-1">Group Savings</div>
          <div className="text-3xl font-bold text-[#111827] tabular-nums mb-4">₹{balance.toLocaleString("en-IN")}</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] px-3 py-2.5">
              <div className="text-[10px] text-[#9ca3af] uppercase tracking-wider mb-0.5">Cash</div>
              <div className="text-base font-semibold text-[#111827] tabular-nums">₹{cash.toLocaleString("en-IN")}</div>
              <div className="text-[10px] text-[#9ca3af] mt-0.5">Kept with treasurer</div>
            </div>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] px-3 py-2.5">
              <div className="text-[10px] text-[#9ca3af] uppercase tracking-wider mb-0.5">Bank</div>
              <div className="text-base font-semibold text-[#111827] tabular-nums">₹{bank.toLocaleString("en-IN")}</div>
              <div className="text-[10px] text-[#9ca3af] mt-0.5">In savings account</div>
            </div>
          </div>
        </div>
      </div>

      {/* Loans */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] px-4 py-3">
          <div className="text-[10px] text-[#9ca3af] uppercase tracking-wider mb-1">Active loans</div>
          <div className="text-2xl font-bold text-[#111827] tabular-nums">{activeLoansCount}</div>
          <div className="text-xs text-[#9ca3af] mt-0.5">members currently borrowing</div>
        </div>
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] px-4 py-3">
          <div className="text-[10px] text-[#9ca3af] uppercase tracking-wider mb-1">Money still owed</div>
          <div className="text-2xl font-bold text-[#111827] tabular-nums">₹{totalOutstanding.toLocaleString("en-IN")}</div>
          <div className="text-xs text-[#9ca3af] mt-0.5">total to be repaid</div>
        </div>
      </div>

      {/* This month */}
      <div className="bg-white border border-[#e5e7eb] rounded-[6px] mb-4">
        <div className="px-4 py-2.5 border-b border-[#e5e7eb]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">This month</span>
          <span className="ml-2 text-[10px] text-[#9ca3af]">August 2026</span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-[#f3f4f6]">
          <div className="px-4 py-3">
            <div className="text-[10px] text-[#9ca3af] uppercase tracking-wider mb-1">Money saved</div>
            <div className="text-lg font-bold text-[#111827] tabular-nums">₹{(monthContributions || 7200).toLocaleString("en-IN")}</div>
            <div className="text-[10px] text-[#9ca3af] mt-0.5">members contributed</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-[10px] text-[#9ca3af] uppercase tracking-wider mb-1">Money repaid</div>
            <div className="text-lg font-bold text-[#111827] tabular-nums">₹{(monthRepayments || 4800).toLocaleString("en-IN")}</div>
            <div className="text-[10px] text-[#9ca3af] mt-0.5">loans repaid</div>
          </div>
        </div>
      </div>

      {/* Recent group activity */}
      <div className="bg-white border border-[#e5e7eb] rounded-[6px] mb-4">
        <div className="px-4 py-2.5 border-b border-[#e5e7eb]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Recent group activity</span>
        </div>
        {loading ? (
          <div className="px-4 py-6 text-center text-xs text-[#9ca3af]">Loading activity…</div>
        ) : (
          <div className="divide-y divide-[#f3f4f6]">
            {recentActivity.map((tx: any) => (
              <button
                key={tx.id}
                onClick={() => onNavigate?.("transaction-details")}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#fafafa] cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-sm font-medium text-[#111827]">{tx.member}</span>
                    <span className="text-xs text-[#9ca3af]">&middot;</span>
                    <span className="text-xs text-[#6b7280]">{tx.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#9ca3af]">{tx.date?.slice(0, 6)}</span>
                    <NoteRow amount={Number(tx.amount)} showToggle />
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1">
                  {tx.verification === "Verified"
                    ? <CheckCircle2 size={13} className="text-green-600" strokeWidth={2} />
                    : <Clock size={13} className="text-amber-500" strokeWidth={2} />
                  }
                  <span className={`text-xs ${tx.verification === "Verified" ? "text-green-600" : "text-amber-600"}`}>
                    {tx.verification}
                  </span>
                  <ChevronRight size={13} className="text-[#d1d5db] ml-1" />
                </div>
              </button>
            ))}
            {recentActivity.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-[#9ca3af]">No recent activity.</div>
            )}
          </div>
        )}
      </div>

      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] px-4 py-3 text-xs text-[#6b7280] leading-relaxed">
        This summary is provided for group transparency. Individual loan details and personal account information are not shown here.
        Contact your group Treasurer for personal account information.
      </div>
    </PageShell>
  );
}
