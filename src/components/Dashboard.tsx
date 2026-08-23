import { Plus, ArrowRight, RotateCcw } from "lucide-react";
import { StatTile, Badge, StatusDot, Button, PageShell } from "./ui";
import { useData } from "../DataContext";
import FinancialTimeline from "./FinancialTimeline";
import type { Screen } from "../types";

interface DashboardProps {
  onNavigate: (s: Screen) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { transactions, stats, loading, error, refresh } = useData();
  const recent = transactions.slice(0, 6);

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-[#111827]">Overview</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">Maa Durga SHG &mdash; 22 August 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="text-[#9ca3af] hover:text-[#374151] cursor-pointer" title="Refresh">
            <RotateCcw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <Button onClick={() => onNavigate("create-transaction")}>
            <Plus size={13} strokeWidth={2} />
            New transaction
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-[6px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-red-800">Backend Communication Error</div>
            <div className="text-xs text-red-600 mt-0.5">{error}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refresh()}
              className="px-3 py-1.5 bg-white border border-red-300 text-xs font-medium text-red-700 rounded-[5px] hover:bg-red-50 cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile
          label="Current Balance"
          value={loading ? "…" : stats ? `₹${stats.balance.toLocaleString("en-IN")}` : "—"}
          sub="As of today"
        />
        <StatTile
          label="Total Contributions"
          value={loading ? "…" : stats ? `₹${stats.totalContributions.toLocaleString("en-IN")}` : "—"}
          sub="This month"
        />
        <StatTile
          label="Outstanding Loans"
          value={loading ? "…" : stats ? `₹${stats.outstandingLoans.toLocaleString("en-IN")}` : "—"}
          sub={stats ? `${stats.activeLoans} active loans` : "No active loans"}
        />
        <StatTile
          label="Total Transactions"
          value={loading ? "…" : stats ? String(stats.transactionCount) : "—"}
          sub="Ledger entries"
        />
      </div>

      {/* Recent transactions */}
      <div className="bg-white border border-[#e5e7eb] rounded-[6px] mb-4">
        <div className="px-4 py-3 border-b border-[#e5e7eb] flex items-center justify-between">
          <h3 className="text-sm font-medium text-[#111827]">Recent Transactions</h3>
          <button onClick={() => onNavigate("transactions")} className="text-xs text-[#3b4fd8] hover:underline flex items-center gap-1 cursor-pointer">
            View all <ArrowRight size={11} />
          </button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-xs text-[#9ca3af]">Loading transactions…</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transaction</th>
                  <th>Member</th>
                  <th>Type</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                  <th>Verification</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((tx: any) => (
                  <tr key={tx.id} className="cursor-pointer" onClick={() => onNavigate("transaction-details")}>
                    <td className="text-[#6b7280]">{tx.date?.slice(0, 6)}</td>
                    <td>
                      <span className="font-medium">{tx.description}</span>
                      <span className="text-[#9ca3af] ml-1.5 text-xs">{tx.id}</span>
                    </td>
                    <td>{tx.member}</td>
                    <td className="text-[#6b7280]">{tx.type}</td>
                    <td className="text-right font-medium tabular-nums">₹{Number(tx.amount).toLocaleString("en-IN")}</td>
                    <td>
                      <Badge variant={tx.status === "Completed" ? "completed" : tx.status === "Pending" ? "pending" : "rejected"}>
                        <StatusDot variant={tx.status === "Completed" ? "completed" : tx.status === "Pending" ? "pending" : "rejected"} />
                        {tx.status}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={tx.verification === "Verified" ? "verified" : tx.verification === "Pending" ? "pending" : "failed"}>
                        {tx.verification}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-[#9ca3af] py-6">No transactions yet.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Financial timeline */}
      <div className="mb-4">
        <FinancialTimeline onNavigate={onNavigate} limit={5} />
      </div>

      {/* Quick alerts */}
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => onNavigate("approvals")} className="bg-amber-50 border border-amber-100 rounded-[6px] px-4 py-3 text-left hover:bg-amber-100 transition-colors cursor-pointer">
          <div className="text-xs font-semibold text-amber-800">
            {transactions.filter((t: any) => t.status === "Pending").length} Pending Approval{transactions.filter((t: any) => t.status === "Pending").length !== 1 ? "s" : ""}
          </div>
          <div className="text-xs text-amber-600 mt-0.5">Require authorization</div>
        </button>
        <button onClick={() => onNavigate("verification")} className="bg-green-50 border border-green-100 rounded-[6px] px-4 py-3 text-left hover:bg-green-100 transition-colors cursor-pointer">
          <div className="text-xs font-semibold text-green-800">Ledger Verified</div>
          <div className="text-xs text-green-600 mt-0.5">{stats ? `${stats.verifiedCount} records checked` : "—"}</div>
        </button>
        <button onClick={() => onNavigate("disputes")} className="bg-red-50 border border-red-100 rounded-[6px] px-4 py-3 text-left hover:bg-red-100 transition-colors cursor-pointer">
          <div className="text-xs font-semibold text-red-800">{stats ? `${stats.openDisputes} Active Dispute${stats.openDisputes !== 1 ? "s" : ""}` : "0 Active Disputes"}</div>
          <div className="text-xs text-red-600 mt-0.5">Under review</div>
        </button>
      </div>
    </PageShell>
  );
}
