import { useState } from "react";
import { Plus, ChevronRight, ChevronLeft, AlertTriangle } from "lucide-react";
import { Badge, Button, StatTile, PageShell } from "./ui";
import type { BadgeVariant } from "./ui";
import { NoteRow, CurrencyViewToggle } from "./CurrencyNotes";
import { useData } from "../DataContext";
import type { Screen } from "../types";

interface LoansProps {
  onNavigate: (s: Screen) => void;
}

export default function Loans({ onNavigate }: LoansProps) {
  const { loans, loading, addRepayment } = useData();
  const [selected, setSelected] = useState<any | null>(null);
  const [repayAmt, setRepayAmt] = useState("");
  const [repaying, setRepaying] = useState(false);

  const active = loans.filter((l: any) => l.status === "Active" || l.status === "Overdue");

  function loanState(loan: any): { label: string; variant: BadgeVariant } {
    const outstanding = loan.principal - loan.repaid;
    if (loan.status === "Overdue") return { label: "Overdue", variant: "overdue" };
    if (loan.status === "Disputed") return { label: "Disputed", variant: "disputed" };
    if (outstanding <= 0) return { label: "Closed", variant: "verified" };
    if (loan.repaid === 0) return { label: "Active", variant: "pending" };
    return { label: "Partially Repaid", variant: "partial" };
  }
  const totalOutstanding = active.reduce((s: number, l: any) => s + (l.principal - l.repaid), 0);
  const repaidThisMonth = loans.reduce((s: number, l: any) => s + (l.repayments ?? []).filter((r: any) => r.date?.includes("Aug 2026")).reduce((a: number, r: any) => a + r.amount, 0), 0);

  const [repayError, setRepayError] = useState<string | null>(null);

  const doRepay = async () => {
    if (!selected || !repayAmt) return;
    setRepaying(true);
    setRepayError(null);
    try {
      const amt = Number(repayAmt);
      await addRepayment(selected.id, amt);
      setSelected((prev: any) => ({
        ...prev,
        repaid: (prev.repaid || 0) + amt,
        repayments: [{ date: "22 Aug 2026", amount: amt }, ...(prev.repayments ?? [])],
      }));
      setRepayAmt("");
    } catch (err: any) {
      setRepayError(err.message || "Failed to record loan repayment.");
    } finally {
      setRepaying(false);
    }
  };

  if (selected) {
    const outstanding = selected.principal - selected.repaid;
    const pct = Math.round((selected.repaid / selected.principal) * 100);
    return (
      <PageShell>
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#111827] mb-5 cursor-pointer">
          <ChevronLeft size={15} /> Loans
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-3xl">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-[#e5e7eb] rounded-[6px] p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-[#6b7280] mb-0.5"><code className="mono">{selected.id}</code></div>
                  <div className="text-xl font-semibold text-[#111827]">{selected.member}</div>
                </div>
                {(() => { const s = loanState(selected); return <Badge variant={s.variant}>{s.label}</Badge>; })()}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <div className="text-xs text-[#6b7280]">Principal</div>
                  <div className="text-base font-semibold">₹{selected.principal.toLocaleString("en-IN")}</div>
                </div>
                <div>
                  <div className="text-xs text-[#6b7280]">Repaid</div>
                  <div className="text-base font-semibold text-green-600">₹{selected.repaid.toLocaleString("en-IN")}</div>
                </div>
                <div>
                  <div className="text-xs text-[#6b7280]">Outstanding</div>
                  <div className="text-xl font-bold text-[#111827]">₹{outstanding.toLocaleString("en-IN")}</div>
                </div>
              </div>
              {/* Overdue warning */}
              {selected.status === "Overdue" && (
                <div className="bg-orange-50 border border-orange-200 rounded-[6px] px-3 py-2 flex items-center gap-2 mb-3">
                  <AlertTriangle size={13} className="text-orange-600 shrink-0" strokeWidth={1.75} />
                  <span className="text-xs text-orange-700 font-medium">Repayment overdue — please contact the member</span>
                </div>
              )}
              {/* Next repayment */}
              {selected.status === "Active" && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded px-3 py-2 flex items-center justify-between mb-1">
                  <div>
                    <div className="text-xs text-[#6b7280]">Next repayment</div>
                    <div className="text-sm font-semibold text-[#111827]">₹{Math.round(selected.principal / selected.termsMonths).toLocaleString("en-IN")}</div>
                  </div>
                  <div className="text-xs text-[#9ca3af]">28 August 2026</div>
                </div>
              )}
              <div className="w-full bg-[#f3f4f6] rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-[10px] text-[#9ca3af] mt-1">{pct}% repaid &mdash; {selected.termsMonths} months total</div>
              {selected.notes && <div className="mt-2 text-xs text-[#6b7280]">Note: {selected.notes}</div>}
            </div>

            <div className="bg-white border border-[#e5e7eb] rounded-[6px]">
              <div className="px-4 py-2.5 border-b border-[#e5e7eb]">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Repayment history</h3>
              </div>
              {(selected.repayments ?? []).length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-[#9ca3af]">No repayments recorded yet.</div>
              ) : (
                <div className="divide-y divide-[#f9fafb]">
                  {(selected.repayments ?? []).map((r: any, i: number) => (
                    <div key={i} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#6b7280]">{r.date}</span>
                        <span className="text-sm font-medium text-green-600 tabular-nums">₹{r.amount.toLocaleString("en-IN")}</span>
                      </div>
                      <NoteRow amount={r.amount} showToggle />
                    </div>
                  ))}
                </div>
              )}
              <div className="px-4 py-2 border-t border-[#e5e7eb] flex items-center justify-between">
                <span className="text-xs text-[#6b7280]">Total repaid</span>
                <span className="text-sm font-semibold text-green-600 tabular-nums">₹{selected.repaid.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white border border-[#e5e7eb] rounded-[6px] p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7280] mb-3">Loan details</div>
              {[["Start date", selected.startDate], ["Terms", `${selected.termsMonths} months`], ["Frequency", "Monthly"], ["Interest", "0% — group policy"]].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-[#f3f4f6] last:border-0">
                  <span className="text-xs text-[#6b7280]">{k}</span>
                  <span className="text-xs font-medium text-[#374151]">{v}</span>
                </div>
              ))}
            </div>

            {selected.status === "Active" && (
              <div className="bg-white border border-[#e5e7eb] rounded-[6px] p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7280] mb-3">Record repayment</div>
                {repayError && (
                  <div className="text-xs text-red-600 mb-2 p-2 bg-red-50 rounded border border-red-200">
                    {repayError}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={repayAmt}
                    onChange={(e) => setRepayAmt(e.target.value)}
                    placeholder="₹ amount"
                    className="flex-1 border border-[#d1d5db] rounded-[6px] px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#3b4fd8]"
                  />
                  <Button size="sm" onClick={doRepay} disabled={!repayAmt || repaying}>
                    {repaying ? "…" : "Save"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-[#111827]">Loans</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">Internal lending and repayment tracking</p>
        </div>
        <Button onClick={() => onNavigate("loan-create")}>
          <Plus size={13} />
          New loan
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatTile label="Active loans" value={loading ? "…" : String(active.length)} sub="Members borrowing" />
        <StatTile label="Total outstanding" value={loading ? "…" : `₹${totalOutstanding.toLocaleString("en-IN")}`} sub="Across active loans" />
        <StatTile label="Repaid this month" value={loading ? "…" : `₹${repaidThisMonth.toLocaleString("en-IN")}`} sub="August 2026" />
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-[6px] overflow-hidden">
        {loading ? (
          <div className="px-4 py-8 text-center text-xs text-[#9ca3af]">Loading loans…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Member</th>
                <th className="text-right">Principal</th>
                <th className="text-right">Repaid</th>
                <th className="text-right">Outstanding</th>
                <th>Terms</th>
                <th>Start</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan: any) => {
                const outstanding = loan.principal - loan.repaid;
                return (
                  <tr key={loan.id} className="cursor-pointer" onClick={() => setSelected(loan)}>
                    <td><code className="mono text-[#9ca3af]">{loan.id}</code></td>
                    <td className="font-medium">{loan.member}</td>
                    <td className="text-right tabular-nums">₹{loan.principal.toLocaleString("en-IN")}</td>
                    <td className="text-right tabular-nums text-green-600">₹{loan.repaid.toLocaleString("en-IN")}</td>
                    <td className="text-right tabular-nums font-medium">
                      {outstanding > 0 ? `₹${outstanding.toLocaleString("en-IN")}` : <span className="text-green-600">Cleared</span>}
                    </td>
                    <td className="text-[#6b7280]">{loan.termsMonths}m</td>
                    <td className="text-[#6b7280] whitespace-nowrap">{loan.startDate}</td>
                    <td>
                      {(() => { const s = loanState(loan); return <Badge variant={s.variant}>{s.label}</Badge>; })()}
                    </td>
                    <td className="text-[#9ca3af]"><ChevronRight size={14} /></td>
                  </tr>
                );
              })}
              {loans.length === 0 && (
                <tr><td colSpan={9} className="text-center text-[#9ca3af] py-8 text-xs">No loans recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}
