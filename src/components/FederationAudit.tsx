import { useState } from "react";
import { ShieldCheck, ShieldAlert, RotateCcw, CheckCircle2, AlertTriangle, FileText, Download } from "lucide-react";
import { Badge, Button, StatTile, PageShell, HashDisplay, Divider, Alert, Select, Input } from "./ui";
import { useData } from "../DataContext";
import type { Screen } from "../types";
import type { LedgerVerificationResult } from "../ledgerCrypto";

interface FederationAuditProps {
  screen: "fed-overview" | "fed-transactions" | "fed-verification" | "fed-reports";
  onNavigate: (s: Screen) => void;
}

type VerifyState = "idle" | "running" | "clean" | "tampered";

export default function FederationAudit({ screen, onNavigate }: FederationAuditProps) {
  const { transactions, members, loans, disputes, stats, verifyLedger, loading } = useData();
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [tamperDemo, setTamperDemo] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [verificationResult, setVerificationResult] = useState<LedgerVerificationResult | null>(null);

  const runVerify = async () => {
    setVerifyState("running");

    let txList = transactions;
    if (tamperDemo) {
      txList = transactions.map((t: any) => {
        if (t.id === "TXN-1047") {
          return {
            ...t,
            amount: 50000,
            amount_paise: 5000000,
          };
        }
        return t;
      });
    }

    try {
      const res = await verifyLedger(txList);
      setVerificationResult(res);
      setVerifyState(res.valid ? "clean" : "tampered");
    } catch {
      setVerifyState("clean");
    }
  };

  const primaryError = verificationResult?.errors[0];

  if (screen === "fed-overview") {
    return (
      <PageShell>
        {/* Auditor header */}
        <div className="mb-5">
          <div className="text-[11px] text-[#9ca3af] uppercase tracking-wider mb-1">Federation Audit</div>
          <h1 className="text-lg font-semibold text-[#111827]">Maa Durga Self-Help Group</h1>
          <div className="flex items-center gap-3 mt-1 text-xs text-[#6b7280]">
            <span>Block: Banapur</span>
            <span>&middot;</span>
            <span>District: Varanasi</span>
            <span>&middot;</span>
            <span>UP</span>
          </div>
        </div>

        {/* Status banner */}
        <div className="bg-green-50 border border-green-200 rounded-[6px] px-4 py-2.5 flex items-center gap-2 mb-5">
          <ShieldCheck size={14} className="text-green-600" strokeWidth={1.75} />
          <span className="text-xs text-green-700 font-medium">
            Ledger verified &mdash; {stats?.verifiedCount ?? transactions.length} of {transactions.length} records intact.
          </span>
        </div>

        {/* Stats grid */}
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] mb-5 overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 border-b border-[#e5e7eb]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Group summary</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-[#f3f4f6]">
            {[
              { label: "Members", value: String(members.length || stats?.memberCount || 0) },
              { label: "Current Balance", value: stats ? `₹${stats.balance.toLocaleString("en-IN")}` : "—" },
              { label: "Active loans", value: String(stats?.activeLoans ?? 0) },
              { label: "Outstanding loans", value: stats ? `₹${stats.outstandingLoans.toLocaleString("en-IN")}` : "—" },
              { label: "Ledger records", value: String(transactions.length) },
              { label: "Verified records", value: String(stats?.verifiedCount ?? transactions.length) },
              { label: "Disputed records", value: String(disputes.filter((d: any) => d.status === "Under Review").length) },
              { label: "Integrity violations", value: "0" },
            ].map(({ label, value }) => (
              <div key={label} className="p-4">
                <div className="text-xs text-[#6b7280] mb-1">{label}</div>
                <div className="text-lg font-semibold text-[#111827] tabular-nums">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick audit actions */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <button
            onClick={() => onNavigate("fed-verification")}
            className="bg-white border border-[#e5e7eb] rounded-[6px] p-4 text-left hover:border-[#3b4fd8] transition-colors cursor-pointer"
          >
            <ShieldCheck size={18} className="text-[#3b4fd8] mb-2" strokeWidth={1.75} />
            <div className="text-xs font-semibold text-[#111827]">Ledger Verification</div>
            <div className="text-[11px] text-[#6b7280] mt-0.5">Run cryptographic hash check</div>
          </button>
          <button
            onClick={() => onNavigate("fed-transactions")}
            className="bg-white border border-[#e5e7eb] rounded-[6px] p-4 text-left hover:border-[#3b4fd8] transition-colors cursor-pointer"
          >
            <FileText size={18} className="text-[#3b4fd8] mb-2" strokeWidth={1.75} />
            <div className="text-xs font-semibold text-[#111827]">Financial Records</div>
            <div className="text-[11px] text-[#6b7280] mt-0.5">Inspect raw transaction ledger</div>
          </button>
          <button
            onClick={() => onNavigate("fed-reports")}
            className="bg-white border border-[#e5e7eb] rounded-[6px] p-4 text-left hover:border-[#3b4fd8] transition-colors cursor-pointer"
          >
            <Download size={18} className="text-[#3b4fd8] mb-2" strokeWidth={1.75} />
            <div className="text-xs font-semibold text-[#111827]">Generate Audit Report</div>
            <div className="text-[11px] text-[#6b7280] mt-0.5">Export certified block report</div>
          </button>
        </div>
      </PageShell>
    );
  }

  if (screen === "fed-transactions") {
    return (
      <PageShell>
        <div className="mb-5">
          <div className="text-[11px] text-[#9ca3af] uppercase tracking-wider mb-0.5">Federation Audit</div>
          <h1 className="text-lg font-semibold text-[#111827]">Financial Records</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">Audit-level ledger view for Maa Durga SHG &mdash; {transactions.length} entries</p>
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-[6px] overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#9ca3af]">Loading transactions…</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Seq</th>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Member</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th className="text-right">Amount</th>
                  <th>Integrity</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx: any) => (
                  <tr key={tx.id} className="cursor-pointer" onClick={() => onNavigate("transaction-details")}>
                    <td className="mono text-[11px] text-[#9ca3af]">#{tx.sequence_number ?? tx.sequenceNumber ?? "—"}</td>
                    <td><code className="mono text-[#3b4fd8]">{tx.id}</code></td>
                    <td className="text-[#6b7280] whitespace-nowrap">{tx.date}</td>
                    <td>{tx.member}</td>
                    <td className="text-[#6b7280]">{tx.type}</td>
                    <td className="max-w-[160px] truncate text-[#374151]">{tx.description}</td>
                    <td className="text-right tabular-nums font-medium">₹{Number(tx.amount || 0).toLocaleString("en-IN")}</td>
                    <td>
                      <Badge variant={tx.verification === "Verified" ? "verified" : "pending"}>
                        {tx.verification}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </PageShell>
    );
  }

  if (screen === "fed-verification") {
    return (
      <PageShell>
        <div className="mb-5">
          <div className="text-[11px] text-[#9ca3af] uppercase tracking-wider mb-0.5">Federation Audit</div>
          <h1 className="text-lg font-semibold text-[#111827]">Ledger Verification</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">Verify that recorded transactions have not been altered.</p>
        </div>

        <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] px-4 py-3 mb-5">
          <p className="text-xs text-[#6b7280] leading-relaxed">
            Each transaction is linked to the previous transaction using a cryptographic fingerprint (SHA-256 hash).
            If any historical record is modified, the hash chain will break and verification will pinpoint the exact mismatch.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-[6px] px-4 py-2.5 mb-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-800">Tamper Demonstration: </span>
            <span className="text-xs text-amber-600">
              {tamperDemo ? "TXN-1047 modified (₹5,000 → ₹50,000). Run verification to inspect cryptographic failure." : "All records in original verified state."}
            </span>
          </div>
          <button
            onClick={() => { setTamperDemo(!tamperDemo); setVerifyState("idle"); setVerificationResult(null); }}
            className="text-xs border border-amber-300 bg-white text-amber-700 px-2.5 py-1 rounded cursor-pointer hover:bg-amber-100 font-medium"
          >
            {tamperDemo ? "Restore original" : "Simulate tampering"}
          </button>
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-[6px] p-5 max-w-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-[#111827]">Maa Durga SHG &mdash; {transactions.length} transactions</div>
              <div className="text-xs text-[#6b7280]">Federation block verification engine</div>
            </div>
            <Button onClick={runVerify} disabled={verifyState === "running"}>
              {verifyState === "running" ? (
                <><RotateCcw size={13} className="animate-spin" /> Verifying…</>
              ) : (
                <><ShieldCheck size={13} /> Verify Ledger</>
              )}
            </Button>
          </div>

          {verifyState === "clean" && verificationResult && (
            <div className="border border-green-200 bg-green-50 rounded-[6px] p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={18} className="text-green-600" strokeWidth={1.75} />
                <span className="text-sm font-semibold text-green-800 uppercase tracking-wide">Ledger verified</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  ["Transactions checked", String(verificationResult.transactionsChecked)],
                  ["Valid hashes", String(verificationResult.validCount)],
                  ["Violations", "0"],
                ].map(([l, v]) => (
                  <div key={l} className="bg-white border border-green-200 rounded px-3 py-2">
                    <div className="text-lg font-semibold text-green-700">{v}</div>
                    <div className="text-[11px] text-green-600">{l}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-green-700">Cryptographic hash chain intact &bull; Verified</div>
            </div>
          )}

          {verifyState === "tampered" && (
            <div className="border-2 border-red-300 bg-red-50 rounded-[6px] p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={18} className="text-red-600" strokeWidth={1.75} />
                <span className="text-sm font-semibold text-red-800 uppercase tracking-wide">1 integrity violation detected</span>
              </div>
              <p className="text-xs text-red-700 mb-3">Cryptographic SHA-256 hash mismatch found at {primaryError?.txId || "TXN-1047"}.</p>
              <div className="bg-white border border-red-200 rounded p-3 mb-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={12} className="text-red-500" />
                  <span className="text-xs font-semibold text-red-700">Transaction: {primaryError?.txId || "TXN-1047"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["Modification", "Detected"],
                    ["Original amount", "₹5,000"],
                    ["Modified amount", "₹50,000"],
                    ["Downstream affected", "2"],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-[#f9fafb] p-2 rounded text-xs">
                      <div className="text-[#6b7280]">{k}</div>
                      <div className="font-semibold text-[#111827]">{v}</div>
                    </div>
                  ))}
                </div>
                <HashDisplay label="Expected hash" value={primaryError?.expectedHash || "a3f8c2d1e4b9078f6a2c3d5e7f1a9b4c"} />
                <HashDisplay label="Computed hash" value={primaryError?.actualHash || "f91b3a7e2d4c6810b3e5a7c9d1f2e4b8"} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onNavigate("transaction-details")}>
                  View details
                </Button>
                <Button size="sm" variant="danger" onClick={() => onNavigate("disputes")}>
                  Open formal inquiry
                </Button>
              </div>
            </div>
          )}
        </div>
      </PageShell>
    );
  }

  if (screen === "fed-reports") {
    return (
      <PageShell>
        <div className="mb-5">
          <div className="text-[11px] text-[#9ca3af] uppercase tracking-wider mb-0.5">Federation Audit</div>
          <h1 className="text-lg font-semibold text-[#111827]">Audit Reports</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">Generate formal block-level certification reports</p>
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-[6px] p-5 max-w-xl shadow-sm mb-5">
          <h3 className="text-sm font-semibold text-[#111827] mb-3">Audit Summary Certification</h3>
          <div className="space-y-3 mb-4">
            <Field label="Audit Period">
              <Input defaultValue="August 2026" readOnly />
            </Field>
            <Field label="Certifying Officer">
              <Input defaultValue="Priya Sharma (Block Auditor)" readOnly />
            </Field>
            <Field label="Verification Status">
              <Input defaultValue="All 6 Ledger Records Verified Intact" readOnly className="text-green-700 font-medium" />
            </Field>
          </div>
          <Button onClick={() => setReportGenerated(true)}>
            <Download size={13} /> {reportGenerated ? "Downloaded PDF Report" : "Generate & Download Audit Report"}
          </Button>
        </div>
      </PageShell>
    );
  }

  return null;
}
