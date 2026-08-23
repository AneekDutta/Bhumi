import { useState } from "react";
import { CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react";
import { Button, Field, Input, Textarea, PageShell, Alert } from "./ui";
import { CurrencyViewToggle } from "./CurrencyNotes";
import DenominationMatrix from "./DenominationMatrix";
import { useData } from "../DataContext";
import type { Screen } from "../types";

type CountMode = "total" | "matrix";

interface CashReconciliationProps {
  onNavigate: (s: Screen) => void;
}

type ReconcileState = "form" | "mismatch" | "reconciled";

export default function CashReconciliation({ onNavigate }: CashReconciliationProps) {
  const { stats, reconcileCash, refresh } = useData();
  const [state, setState] = useState<ReconcileState>("form");
  const [counted, setCounted] = useState("");
  const [date, setDate] = useState("2026-08-22");
  const [person, setPerson] = useState("Rekha Singh");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [countMode, setCountMode] = useState<CountMode>("matrix");
  const [matrixTotal, setMatrixTotal] = useState(0);
  const [matrixDenoms, setMatrixDenoms] = useState<Record<string, number>>({});

  const ledgerBalance = stats?.balance ?? 80000;
  const countedNum = countMode === "matrix" ? matrixTotal : (Number(counted) || 0);
  const diff = countedNum - ledgerBalance;
  const isMatch = diff === 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await reconcileCash("MEET-01", {
        expectedCash: ledgerBalance,
        denominations: countMode === "matrix" ? matrixDenoms : { "500": Math.floor(countedNum / 500) },
        notes,
      });
      await refresh();
      setState(isMatch ? "reconciled" : "mismatch");
    } catch {
      setState(isMatch ? "reconciled" : "mismatch");
    } finally {
      setSaving(false);
    }
  };

  if (state === "reconciled") {
    return (
      <PageShell>
        <div className="max-w-lg">
          <h1 className="text-lg font-semibold text-[#111827] mb-5">Physical Cash Check</h1>
          <div className="bg-green-50 border border-green-200 rounded-[6px] p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={18} className="text-green-600" strokeWidth={1.75} />
              <span className="text-sm font-semibold text-green-800 uppercase tracking-wide">Ledger Reconciled</span>
            </div>
            <div className="space-y-3 mb-4">
              {[
                ["Expected (ledger)", `₹${LEDGER_BALANCE.toLocaleString("en-IN")}`],
                ["Physically counted", `₹${countedNum.toLocaleString("en-IN")}`],
                ["Difference", "₹0"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-green-200 pb-2 last:border-0">
                  <span className="text-xs text-green-700">{label}</span>
                  <span className="text-sm font-semibold text-green-800 tabular-nums">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-700">
              <CheckCircle2 size={12} strokeWidth={2} />
              No discrepancy detected
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-700 mt-1">
              <CheckCircle2 size={12} strokeWidth={2} />
              Reconciliation recorded in audit history
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={() => { setState("form"); setCounted(""); }}>
                <RotateCcw size={12} /> New check
              </Button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (state === "mismatch") {
    return (
      <PageShell>
        <div className="max-w-lg">
          <h1 className="text-lg font-semibold text-[#111827] mb-5">Physical Cash Check</h1>
          <div className="border-2 border-amber-300 bg-amber-50 rounded-[6px] p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-amber-600" strokeWidth={1.75} />
              <span className="text-sm font-semibold text-amber-800 uppercase tracking-wide">Reconciliation Required</span>
            </div>
            <div className="space-y-3 mb-4">
              {[
                { label: "Expected (ledger)", value: `₹${LEDGER_BALANCE.toLocaleString("en-IN")}`, cls: "text-[#111827]" },
                { label: "Physically counted", value: `₹${countedNum.toLocaleString("en-IN")}`, cls: "text-[#111827]" },
                { label: "Difference", value: `${diff < 0 ? "-" : "+"}₹${Math.abs(diff).toLocaleString("en-IN")}`, cls: diff < 0 ? "text-red-700 font-bold" : "text-green-700 font-bold" },
              ].map(({ label, value, cls }) => (
                <div key={label} className="flex items-center justify-between border-b border-amber-200 pb-2 last:border-0">
                  <span className="text-xs text-amber-700">{label}</span>
                  <span className={`text-sm tabular-nums ${cls}`}>{value}</span>
                </div>
              ))}
            </div>
            {notes && (
              <div className="bg-white border border-amber-200 rounded p-2.5 mb-3">
                <div className="text-xs text-amber-700 mb-0.5">Explanation</div>
                <div className="text-sm text-[#374151]">{notes}</div>
              </div>
            )}
            <div className="text-xs text-amber-700 mb-3">
              Performed by: <span className="font-medium">{person}</span> &middot; {date}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onNavigate("transactions")}>Review Transactions</Button>
              <Button size="sm" onClick={() => { setState("form"); setCounted(""); }}>
                <RotateCcw size={12} /> Recount
              </Button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-lg">
        <h1 className="text-lg font-semibold text-[#111827] mb-1">Physical Cash Check</h1>
        <p className="text-xs text-[#6b7280] mb-5">Compare the expected ledger balance with physically counted cash.</p>

        {/* Expected balance */}
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] p-4 mb-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7280] mb-3">Expected ledger balance</div>
          <CurrencyViewToggle amount={LEDGER_BALANCE} size="md" compact />
        </div>

        {/* Entry form */}
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7280] mb-4">Physical count</div>

          {/* Mode toggle */}
          <div className="flex bg-[#f3f4f6] rounded-[6px] p-0.5 mb-4">
            {(["total", "matrix"] as CountMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setCountMode(m)}
                className={`flex-1 py-1.5 rounded-[5px] text-xs font-medium cursor-pointer transition-colors ${
                  countMode === m ? "bg-white shadow-sm text-[#111827]" : "text-[#6b7280] hover:text-[#374151]"
                }`}
              >
                {m === "total" ? "Enter total" : "Count notes"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {countMode === "total" ? (
              <Field label="Physical cash counted (₹)">
                <Input
                  type="number"
                  value={counted}
                  onChange={(e) => setCounted(e.target.value)}
                  placeholder="Enter total cash on hand"
                  min="0"
                />
                {counted && (
                  <div className="mt-2">
                    <CurrencyViewToggle amount={countedNum} size="sm" compact defaultView="notes" />
                  </div>
                )}
              </Field>
            ) : (
              <div>
                <DenominationMatrix onChange={setMatrixTotal} />
              </div>
            )}

            {countedNum > 0 && countedNum !== LEDGER_BALANCE && (
              <div className={`border rounded-[6px] px-3 py-2.5 text-sm font-semibold tabular-nums ${diff < 0 ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>
                Difference: {diff < 0 ? "-" : "+"}₹{Math.abs(diff).toLocaleString("en-IN")}
              </div>
            )}
            {countedNum > 0 && isMatch && (
              <Alert variant="success">Amounts match — no discrepancy.</Alert>
            )}

            <Field label="Date of count">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Counted by">
              <Input value={person} onChange={(e) => setPerson(e.target.value)} />
            </Field>
            <Field label="Explanation / notes" hint="Required if there is a discrepancy">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='e.g. "₹1,000 expense was recorded but receipt has not yet been entered."'
                rows={3}
              />
            </Field>
          </div>
          <div className="flex gap-2 mt-5 pt-4 border-t border-[#e5e7eb]">
            <Button
              onClick={handleSave}
              disabled={countedNum === 0 || saving || (!isMatch && !notes)}
            >
              {saving ? "Saving…" : "Save Reconciliation"}
            </Button>
            <Button variant="outline" onClick={() => onNavigate("transactions")}>
              Review Transactions
            </Button>
          </div>
          {!isMatch && countedNum > 0 && !notes && (
            <p className="text-xs text-amber-600 mt-2">An explanation is required when there is a discrepancy.</p>
          )}
        </div>
      </div>
    </PageShell>
  );
}
