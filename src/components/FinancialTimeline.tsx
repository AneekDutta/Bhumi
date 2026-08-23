import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { useData } from "../DataContext";
import { NoteRow } from "./CurrencyNotes";
import type { Screen } from "../types";

interface FinancialTimelineProps {
  onNavigate: (s: Screen) => void;
  limit?: number;
  showHeader?: boolean;
}

function verificationIcon(v: string) {
  if (v === "Verified") return <CheckCircle2 size={12} className="text-green-600 shrink-0" strokeWidth={2} />;
  if (v === "Pending") return <Clock size={12} className="text-amber-500 shrink-0" strokeWidth={2} />;
  return <AlertTriangle size={12} className="text-red-500 shrink-0" strokeWidth={2} />;
}

const TYPE_LABELS: Record<string, string> = {
  Contribution: "Contribution",
  Loan: "Internal Loan",
  Repayment: "Loan Repayment",
  Expense: "Group Expense",
  Withdrawal: "Withdrawal",
  Other: "Transaction",
};

export default function FinancialTimeline({ onNavigate, limit, showHeader = true }: FinancialTimelineProps) {
  const { transactions, loading } = useData();
  const items = limit ? transactions.slice(0, limit) : transactions;

  // Group by date label
  const grouped: { date: string; items: any[] }[] = [];
  for (const tx of items) {
    const dateLabel = tx.date?.slice(0, 6) ?? "—";
    const last = grouped[grouped.length - 1];
    if (last && last.date === dateLabel) {
      last.items.push(tx);
    } else {
      grouped.push({ date: dateLabel, items: [tx] });
    }
  }

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[6px]">
      {showHeader && (
        <div className="px-4 py-2.5 border-b border-[#e5e7eb] flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Financial Timeline</h3>
          {limit && (
            <button onClick={() => onNavigate("transactions")} className="text-xs text-[#3b4fd8] hover:underline cursor-pointer">
              View all
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="px-4 py-6 text-center text-xs text-[#9ca3af]">Loading timeline…</div>
      ) : grouped.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-[#9ca3af]">No transactions recorded.</div>
      ) : (
        <div className="divide-y divide-[#f3f4f6]">
          {grouped.map(({ date, items: dayItems }) => (
            <div key={date}>
              <div className="px-4 py-1.5 bg-[#f9fafb] border-b border-[#f3f4f6]">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">{date}</span>
              </div>
              {dayItems.map((tx: any) => (
                <div
                  key={tx.id}
                  className="px-4 py-3 flex items-start justify-between gap-4 hover:bg-[#fafafa] cursor-pointer transition-colors"
                  onClick={() => onNavigate("transaction-details")}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="text-sm font-medium text-[#111827]">{tx.member}</span>
                      <span className="text-xs text-[#9ca3af]">&middot;</span>
                      <span className="text-xs text-[#6b7280]">{TYPE_LABELS[tx.type] ?? tx.type}</span>
                    </div>
                    <NoteRow amount={tx.amount} showToggle />
                  </div>
                  <div className="shrink-0 flex items-center gap-1 mt-0.5">
                    {verificationIcon(tx.verification)}
                    <span className={`text-xs ${tx.verification === "Verified" ? "text-green-600" : tx.verification === "Pending" ? "text-amber-600" : "text-red-600"}`}>
                      {tx.verification}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
