import { useState } from "react";
import { Plus, Search, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { Badge, StatusDot, Button, PageShell, Input, Select } from "./ui";
import type { BadgeVariant } from "./ui";
import { useData } from "../DataContext";
import type { Screen } from "../types";

function reviewFlag(tx: any): string | null {
  if (tx.amount >= 20000) return "Large transaction";
  if (tx.approvalCount < tx.requiredApprovals && tx.status !== "Rejected") return "Missing approval";
  if (tx.verification === "Failed") return "Integrity check failed";
  return null;
}

// Maps a transaction's fields to the 7-state lifecycle model
function txState(tx: any): { label: string; variant: BadgeVariant; sub: string } {
  if (tx.verification === "Failed") return { label: "Integrity Compromised", variant: "integrity", sub: "Hash mismatch" };
  if (tx.status === "Rejected") return { label: "Rejected", variant: "rejected", sub: "Approval denied" };
  if (tx.disputeStatus === "Under Review") return { label: "Under Review", variant: "review", sub: "Auditor reviewing" };
  if (tx.disputeStatus === "Disputed") return { label: "Disputed", variant: "disputed", sub: "Member reported problem" };
  if (tx.disputeStatus === "Resolved") return { label: "Resolved", variant: "resolved", sub: "Dispute resolved" };
  if (tx.verification === "Verified") return { label: "Verified", variant: "verified", sub: "Ledger verified" };
  if (tx.approvalCount >= tx.requiredApprovals) return { label: "Pending Verification", variant: "pending", sub: "Waiting for ledger check" };
  return { label: "Recorded", variant: "recorded", sub: "Saved to ledger" };
}

interface TransactionsProps {
  onNavigate: (s: Screen) => void;
}

export default function Transactions({ onNavigate }: TransactionsProps) {
  const { transactions, loading } = useData();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = transactions.filter((tx: any) => {
    const matchSearch = tx.member?.toLowerCase().includes(search.toLowerCase()) || tx.id?.toLowerCase().includes(search.toLowerCase()) || tx.description?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || tx.type === typeFilter;
    const matchStatus = statusFilter === "All" || tx.verification === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-[#111827]">Transactions</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">{transactions.length} ledger entries</p>
        </div>
        <Button onClick={() => onNavigate("create-transaction")}>
          <Plus size={13} strokeWidth={2} />
          New transaction
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions…" className="pl-8" />
        </div>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-36">
          <option value="All">All types</option>
          <option value="Contribution">Contribution</option>
          <option value="Loan">Loan</option>
          <option value="Repayment">Repayment</option>
          <option value="Expense">Expense</option>
          <option value="Withdrawal">Withdrawal</option>
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
          <option value="All">All status</option>
          <option value="Verified">Verified</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </Select>
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-[6px] overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-xs text-[#9ca3af]">Loading transactions…</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Member</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th className="text-right">Amount</th>
                  <th>Approval</th>
                  <th>Integrity</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx: any) => {
                  const flag = reviewFlag(tx);
                  return (
                    <tr key={tx.id} className="cursor-pointer" onClick={() => onNavigate("transaction-details")}>
                      <td><code className="mono text-[#3b4fd8]">{tx.id}</code></td>
                      <td className="text-[#6b7280] whitespace-nowrap">{tx.date}</td>
                      <td className="whitespace-nowrap">{tx.member}</td>
                      <td className="text-[#6b7280] whitespace-nowrap">{tx.type}</td>
                      <td className="max-w-[180px] truncate text-[#374151]">{tx.description}</td>
                      <td className="text-right font-medium tabular-nums whitespace-nowrap">₹{Number(tx.amount).toLocaleString("en-IN")}</td>
                      <td className="whitespace-nowrap">
                        <span className="text-xs text-[#6b7280]">{tx.approvalCount}/{tx.requiredApprovals}</span>
                        {tx.approvalCount >= tx.requiredApprovals && <span className="ml-1 text-xs text-green-600">✓</span>}
                      </td>
                      <td className="whitespace-nowrap">
                        {(() => { const s = txState(tx); return (
                          <Badge variant={s.variant}>
                            <StatusDot variant={s.variant} />
                            {s.label}
                          </Badge>
                        ); })()}
                      </td>
                      <td>
                        {flag && (
                          <span title={flag} className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded whitespace-nowrap">
                            <Flag size={10} strokeWidth={2} />
                            Review
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-[#9ca3af] py-8">No transactions match the current filters.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-4 py-2.5 border-t border-[#e5e7eb] flex items-center justify-between">
          <span className="text-xs text-[#6b7280]">Showing {filtered.length} of {transactions.length} entries</span>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded text-[#6b7280] hover:bg-[#f3f4f6] cursor-pointer"><ChevronLeft size={14} /></button>
            <span className="text-xs px-2 py-0.5 bg-[#3b4fd8] text-white rounded">1</span>
            <button className="p-1 rounded text-[#6b7280] hover:bg-[#f3f4f6] cursor-pointer"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
