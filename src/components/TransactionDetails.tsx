import { useState } from "react";
import { ChevronLeft, CheckCircle2, ExternalLink, XCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { Badge, Button, HashDisplay, PageShell, Divider } from "./ui";
import { CurrencyViewToggle } from "./CurrencyNotes";
import { useData } from "../DataContext";
import type { Screen } from "../types";

interface TransactionDetailsProps {
  onNavigate: (s: Screen) => void;
}

type DisputeState = "idle" | "recognize" | "dispute-form" | "submitted";
type TamperState = "clean" | "tampered";

const DISPUTE_REASONS = [
  "I didn't make this payment",
  "The amount is incorrect",
  "I don't recognize this transaction",
  "Other",
];

export default function TransactionDetails({ onNavigate }: TransactionDetailsProps) {
  const { createDispute, transactions } = useData();
  const [tamperState, setTamperState] = useState<TamperState>("clean");
  const [disputeState, setDisputeState] = useState<DisputeState>("idle");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeNote, setDisputeNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isTampered = tamperState === "tampered";

  const handleSubmitDispute = async () => {
    setSubmitting(true);
    try {
      await createDispute({
        txId: "TXN-1047",
        reportedBy: "Lakshmi Nair",
        reason: disputeReason || "I do not recognize this transaction.",
        notes: disputeNote,
        originalAmount: 5000,
        currentAmount: isTampered ? 50000 : 5000,
      });
    } catch {
      // continue to submitted state
    }
    setSubmitting(false);
    setDisputeState("submitted");
  };

  // ── Dispute flow ──────────────────────────────────────────────────────────
  if (disputeState === "recognize") {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex flex-col max-w-md mx-auto px-4 pt-8">
        <button onClick={() => setDisputeState("idle")} className="flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#111827] mb-6 cursor-pointer">
          <ChevronLeft size={15} /> Back
        </button>
        <div className="bg-white border border-[#e5e7eb] rounded-[8px] p-5">
          <h2 className="text-base font-semibold text-[#111827] mb-1 uppercase tracking-wide">Do you recognize this transaction?</h2>
          <p className="text-xs text-[#9ca3af] mb-5">Review the transaction below before responding.</p>
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] divide-y divide-[#f3f4f6] mb-5">
            {[["Type", "Loan Repayment"], ["Amount", "₹5,000"], ["Date", "22 August 2026"], ["ID", "TXN-1047"]].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-[#6b7280]">{k}</span>
                <span className="text-sm font-semibold text-[#111827]">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setDisputeState("idle")}
              className="w-full border-2 border-green-300 bg-green-50 text-green-800 rounded-[8px] py-3 text-sm font-semibold hover:bg-green-100 cursor-pointer"
            >
              Yes, this is mine
            </button>
            <button
              onClick={() => setDisputeState("dispute-form")}
              className="w-full border-2 border-red-200 text-red-700 bg-red-50 rounded-[8px] py-3 text-sm font-semibold hover:bg-red-100 cursor-pointer"
            >
              No — report a problem
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (disputeState === "dispute-form") {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex flex-col max-w-md mx-auto px-4 pt-8">
        <button onClick={() => setDisputeState("recognize")} className="flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#111827] mb-6 cursor-pointer">
          <ChevronLeft size={15} /> Back
        </button>
        <div className="bg-white border border-[#e5e7eb] rounded-[8px] p-5">
          <h2 className="text-base font-semibold text-[#111827] mb-1 uppercase tracking-wide">Open Dispute</h2>
          <p className="text-xs text-[#9ca3af] mb-5">Why are you reporting this transaction?</p>

          <div className="space-y-2 mb-4">
            {DISPUTE_REASONS.map((reason) => (
              <label key={reason} className="flex items-center gap-3 px-3 py-2.5 border border-[#e5e7eb] rounded-[6px] cursor-pointer hover:bg-[#f9fafb] transition-colors">
                <input
                  type="radio"
                  name="dispute-reason"
                  value={reason}
                  checked={disputeReason === reason}
                  onChange={() => setDisputeReason(reason)}
                  className="w-4 h-4 accent-[#3b4fd8]"
                />
                <span className="text-sm text-[#374151]">{reason}</span>
              </label>
            ))}
          </div>

          <div className="mb-5">
            <label className="text-xs font-medium text-[#374151] block mb-1">Add a short explanation (optional)</label>
            <textarea
              value={disputeNote}
              onChange={(e) => setDisputeNote(e.target.value)}
              placeholder="Describe what happened…"
              rows={3}
              className="w-full border border-[#d1d5db] rounded-[6px] px-3 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#3b4fd8] resize-none"
            />
          </div>

          <button
            onClick={handleSubmitDispute}
            disabled={!disputeReason || submitting}
            className="w-full bg-[#111827] text-white rounded-[8px] py-3 text-sm font-semibold hover:bg-[#374151] cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Dispute"}
          </button>
        </div>
      </div>
    );
  }

  if (disputeState === "submitted") {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex flex-col max-w-md mx-auto px-4 pt-8">
        <div className="bg-white border border-[#e5e7eb] rounded-[8px] p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={18} className="text-[#3b4fd8]" strokeWidth={1.5} />
            <span className="text-base font-semibold text-[#111827] uppercase tracking-wide">Dispute Opened</span>
          </div>
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] divide-y divide-[#f3f4f6] mb-4">
            {[["Dispute ID", "D-1047"], ["Status", "Under Review"], ["Transaction", "TXN-1047"], ["Reason", disputeReason || "Reported"]].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-[#6b7280]">{k}</span>
                <span className="text-sm font-semibold text-[#111827]">{v}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 mb-5">
            {[
              { label: "Submitted", sub: "22 Aug · 18:21", state: "done" as const },
              { label: "Under Review", sub: "Current", state: "current" as const },
              { label: "Resolved", sub: "Pending", state: "pending" as const },
            ].map(({ label, sub, state }) => (
              <div key={label} className="flex items-center gap-2">
                {state === "done"
                  ? <CheckCircle2 size={14} className="text-green-600 shrink-0" strokeWidth={2} />
                  : state === "current"
                  ? <div className="w-3.5 h-3.5 rounded-full border-2 border-[#3b4fd8] shrink-0" />
                  : <div className="w-3.5 h-3.5 rounded-full border-2 border-[#d1d5db] shrink-0" />
                }
                <div>
                  <div className={`text-sm font-medium ${state === "current" ? "text-[#3b4fd8]" : "text-[#374151]"}`}>{label}</div>
                  <div className="text-xs text-[#9ca3af]">{sub}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setDisputeState("idle"); onNavigate("disputes"); }}
            className="text-sm font-medium text-[#3b4fd8] hover:underline cursor-pointer flex items-center gap-1"
          >
            View all disputes <ArrowRight size={13} />
          </button>
        </div>
      </div>
    );
  }

  // ── Tamper comparison view ─────────────────────────────────────────────────
  if (isTampered) {
    return (
      <PageShell>
        <button onClick={() => setTamperState("clean")} className="flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#111827] mb-5 cursor-pointer">
          <ChevronLeft size={15} /> Back to verified state
        </button>

        <div className="border-2 border-red-300 rounded-[6px] overflow-hidden mb-5">
          <div className="bg-red-600 px-4 py-2.5 flex items-center gap-2">
            <XCircle size={15} className="text-white" strokeWidth={2} />
            <span className="text-sm font-bold text-white uppercase tracking-wide">Ledger Integrity Compromised</span>
          </div>
          <div className="bg-red-50 px-4 py-3 text-xs text-red-700">
            The recorded amount no longer matches the verified ledger history. This transaction may have been altered after it was recorded.
          </div>
        </div>

        {/* Before / After comparison */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Original */}
          <div className="bg-green-50 border-2 border-green-300 rounded-[6px] p-4">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-green-700 mb-2">Original record</div>
            <div className="text-2xl font-bold text-[#111827] tabular-nums mb-1">₹5,000</div>
            <div className="text-xs text-[#6b7280] mb-3">22 Aug · 14:32</div>
            <div className="text-[10px] text-green-700 mb-0.5 font-medium uppercase tracking-wider">Original hash</div>
            <div className="font-mono text-[10px] text-green-800 break-all mb-2">a3f8c2d1…9b4c</div>
            <div className="flex items-center gap-1 text-xs text-green-700 font-semibold">
              <CheckCircle2 size={12} strokeWidth={2} /> Valid
            </div>
          </div>

          {/* Current */}
          <div className="bg-red-50 border-2 border-red-300 rounded-[6px] p-4">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-red-700 mb-2">Current record</div>
            <div className="text-2xl font-bold text-red-700 tabular-nums mb-1">₹50,000</div>
            <div className="text-xs text-[#6b7280] mb-3">22 Aug · 14:32</div>
            <div className="text-[10px] text-red-700 mb-0.5 font-medium uppercase tracking-wider">Current hash</div>
            <div className="font-mono text-[10px] text-red-800 break-all mb-2">7f2a9e4b…1c3d</div>
            <div className="flex items-center gap-1 text-xs text-red-700 font-semibold">
              <XCircle size={12} strokeWidth={2} /> Mismatch
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] divide-y divide-[#f3f4f6] mb-4">
          {[
            { label: "Original amount", value: "₹5,000", color: "text-[#111827]" },
            { label: "Current amount", value: "₹50,000", color: "text-red-700 font-bold" },
            { label: "Integrity check", value: "Failed", color: "text-red-700 font-semibold" },
            { label: "Affected downstream records", value: "2", color: "text-amber-700 font-semibold" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-[#6b7280]">{label}</span>
              <span className={`text-sm tabular-nums ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setTamperState("clean")}>View original</Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate("audit-history")}>View audit trail</Button>
          <Button variant="danger" size="sm" onClick={() => setDisputeState("recognize")}>Open dispute</Button>
        </div>
      </PageShell>
    );
  }

  // ── Normal (clean) view ───────────────────────────────────────────────────
  return (
    <PageShell>
      <button
        onClick={() => onNavigate("transactions")}
        className="flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#111827] mb-5 cursor-pointer"
      >
        <ChevronLeft size={15} /> Transactions
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-xs text-[#6b7280] mb-1">
            <code className="mono">TXN-1047</code>
          </div>
          <div className="text-sm text-[#6b7280] mt-1 mb-2">Loan repayment</div>
          <CurrencyViewToggle amount={5000} size="md" />
        </div>
        <div className="flex gap-2">
          <Badge variant="completed">Completed</Badge>
          <Badge variant="verified">Verified</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-[#e5e7eb] rounded-[6px]">
            <div className="px-4 py-2.5 border-b border-[#e5e7eb]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Transaction information</h3>
            </div>
            <div className="divide-y divide-[#f3f4f6]">
              {[
                ["Transaction ID", "TXN-1047"],
                ["Created by", "Sunita Devi (M-02)"],
                ["Created", "22 August 2026, 14:32"],
                ["Type", "Repayment"],
                ["Description", "Monthly loan repayment"],
                ["Amount", "₹5,000"],
              ].map(([label, value]) => (
                <div key={label} className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs text-[#6b7280]">{label}</span>
                  <span className="text-sm text-[#111827]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-[6px]">
            <div className="px-4 py-2.5 border-b border-[#e5e7eb]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Approval history</h3>
            </div>
            <div className="px-4 py-3 space-y-3">
              {[
                { actor: "Kamla Verma", role: "Group Leader", time: "14:35", approved: true },
                { actor: "Priya Sharma", role: "Auditor", time: "14:37", approved: true },
                { actor: "Sunita Devi", role: "Treasurer", time: "14:38", approved: true },
              ].map((a) => (
                <div key={a.actor} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-600 shrink-0" strokeWidth={1.75} />
                    <div>
                      <span className="text-sm font-medium">{a.actor}</span>
                      <span className="text-xs text-[#9ca3af] ml-1">({a.role})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 font-medium">Approved</span>
                    <span className="text-xs text-[#9ca3af]">{a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-[#e5e7eb] rounded-[6px]">
            <div className="px-4 py-2.5 border-b border-[#e5e7eb]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Integrity</h3>
            </div>
            <div className="px-4 py-3 space-y-3">
              <HashDisplay label="Transaction hash" value="a3f8c2d1e4b9078f6a2c3d5e7f1a9b4c" />
              <HashDisplay label="Previous transaction" value="9b2e1d4c7a6f3e8b2c5d9f1a4e7c3b6a" />
              <Divider />
              <div>
                <div className="text-xs text-[#6b7280] mb-1">Integrity status</div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-600" strokeWidth={1.75} />
                  <span className="text-sm font-semibold text-green-700 uppercase tracking-wide">Verified</span>
                </div>
                <p className="text-xs text-[#6b7280] mt-1.5 leading-relaxed">
                  This transaction's hash matches the expected value. No modifications detected.
                </p>
              </div>
              <button
                onClick={() => onNavigate("verification")}
                className="text-xs text-[#3b4fd8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                View verification details <ExternalLink size={11} />
              </button>
              <Divider />
              <button
                onClick={() => setTamperState("tampered")}
                className="text-xs text-amber-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <AlertTriangle size={11} /> Demo: Show tamper scenario
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-[6px] px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7280] mb-2.5">Actions</div>
            <div className="space-y-1.5">
              <Button variant="outline" size="sm" className="w-full justify-center" onClick={() => onNavigate("audit-history")}>
                View audit history
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-center" onClick={() => setDisputeState("recognize")}>
                Report a problem
              </Button>
              <Button variant="danger" size="sm" className="w-full justify-center" onClick={() => onNavigate("disputes")}>
                Open dispute
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
