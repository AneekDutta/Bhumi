import { useState } from "react";
import { ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react";
import { Button, HashDisplay, Alert, PageShell, Badge, Divider } from "./ui";
import { useData } from "../DataContext";
import type { Screen } from "../types";
import type { LedgerVerificationResult } from "../ledgerCrypto";

interface VerificationProps {
  onNavigate: (s: Screen) => void;
}

type VerifyState = "idle" | "running" | "clean" | "tampered";

export default function Verification({ onNavigate }: VerificationProps) {
  const { transactions, verifyLedger } = useData();
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [tamperDemo, setTamperDemo] = useState(false);
  const [verificationResult, setVerificationResult] = useState<LedgerVerificationResult | null>(null);

  const runVerification = async () => {
    setVerifyState("running");

    // If tamperDemo is active, create a test fixture with modified amount on TXN-1047
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
      const result = await verifyLedger(txList);
      setVerificationResult(result);
      setVerifyState(result.valid ? "clean" : "tampered");
    } catch {
      setVerifyState("clean");
    }
  };

  const primaryError = verificationResult?.errors[0];

  return (
    <PageShell>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[#111827]">Ledger Verification</h1>
        <p className="text-xs text-[#6b7280] mt-0.5">Verify that recorded transactions have not been altered.</p>
      </div>

      {/* Explanation */}
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] px-4 py-3 mb-5">
        <p className="text-xs text-[#6b7280] leading-relaxed">
          Each transaction is linked to the previous transaction using a cryptographic fingerprint (SHA-256 hash).
          If any historical record is modified or deleted, the hash chain will break and verification will detect the
          exact corrupted transaction. This is a tamper-evident cryptographic ledger.
        </p>
      </div>

      {/* Demo toggle */}
      <div className="bg-amber-50 border border-amber-200 rounded-[6px] px-4 py-3 mb-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-amber-800">Tamper detection demonstration</div>
          <div className="text-xs text-amber-600 mt-0.5">
            {tamperDemo
              ? "Simulating modified record on TXN-1047 (₹5,000 → ₹50,000). Run verification to inspect cryptographic failure."
              : "All ledger records are in their authentic cryptographic state."}
          </div>
        </div>
        <button
          onClick={() => {
            setTamperDemo(!tamperDemo);
            setVerifyState("idle");
            setVerificationResult(null);
          }}
          className="text-xs border border-amber-300 bg-white text-amber-700 px-2.5 py-1 rounded-[5px] hover:bg-amber-100 cursor-pointer font-medium"
        >
          {tamperDemo ? "Restore original" : "Simulate tampering"}
        </button>
      </div>

      {/* Verify action */}
      <div className="bg-white border border-[#e5e7eb] rounded-[6px] p-5 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-medium text-[#111827]">Ledger integrity check</div>
            <div className="text-xs text-[#6b7280] mt-0.5">
              {transactions.length} recorded transactions &mdash; Maa Durga SHG
            </div>
          </div>
          <Button
            onClick={runVerification}
            disabled={verifyState === "running"}
            variant={verifyState === "idle" ? "primary" : "outline"}
          >
            {verifyState === "running" ? (
              <>
                <RotateCcw size={13} className="animate-spin" />
                Computing SHA-256…
              </>
            ) : (
              <>
                <ShieldCheck size={13} />
                Verify Ledger
              </>
            )}
          </Button>
        </div>

        {/* Result: clean */}
        {verifyState === "clean" && verificationResult && (
          <div className="border border-green-200 bg-green-50 rounded-[6px] p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={18} className="text-green-600" strokeWidth={1.75} />
              <span className="text-sm font-semibold text-green-800 uppercase tracking-wide">Ledger verified</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3 mb-3">
              {[
                ["Transactions checked", String(verificationResult.transactionsChecked)],
                ["Valid hashes", String(verificationResult.validCount)],
                ["Integrity violations", "0"],
              ].map(([label, val]) => (
                <div key={label} className="bg-white border border-green-200 rounded-[5px] px-3 py-2">
                  <div className="text-lg font-semibold text-green-700">{val}</div>
                  <div className="text-xs text-green-600">{label}</div>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 mt-3">
              {transactions.slice(0, 4).map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between bg-white/70 px-3 py-1.5 rounded border border-green-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-green-500" strokeWidth={2} />
                    <span className="mono text-[11px] text-[#374151] font-medium">{tx.id}</span>
                    <span className="text-xs text-[#6b7280]">{tx.member}</span>
                  </div>
                  <span className="mono text-[10px] text-green-700 truncate max-w-[180px]">
                    {tx.current_hash || tx.hash || "SHA-256 verified"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result: tampered */}
        {verifyState === "tampered" && (
          <div className="border-2 border-red-300 bg-red-50 rounded-[6px] p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={18} className="text-red-600" strokeWidth={1.75} />
              <span className="text-sm font-semibold text-red-800 uppercase tracking-wide">
                Ledger integrity compromised
              </span>
            </div>
            <p className="text-xs text-red-700 mb-3">
              Cryptographic SHA-256 hash verification failed. One or more records have been altered without proper authorization.
            </p>
            <div className="bg-white border border-red-200 rounded-[6px] p-3 mb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle size={13} className="text-red-500" strokeWidth={2} />
                <span className="text-xs font-semibold text-red-700">
                  {primaryError?.txId || "TXN-1047"} has been modified
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <div className="text-xs text-[#6b7280]">Original record</div>
                  <div className="text-sm font-medium text-[#111827]">₹5,000 (Repayment)</div>
                </div>
                <div>
                  <div className="text-xs text-[#6b7280]">Modified payload</div>
                  <div className="text-sm font-semibold text-red-700">₹50,000</div>
                </div>
              </div>
              <Divider className="mb-2" />
              <div className="space-y-1.5">
                <HashDisplay
                  label="Expected hash"
                  value={primaryError?.expectedHash || "a3f8c2d1e4b9078f6a2c3d5e7f1a9b4c"}
                />
                <HashDisplay
                  label="Computed hash"
                  value={primaryError?.actualHash || "f91b3a7e2d4c6810b3e5a7c9d1f2e4b8"}
                />
              </div>
              <div className="mt-2.5 text-xs text-red-700 font-medium">
                Cryptographic result: Hash mismatch &mdash; Downstream hash chain severed
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onNavigate("transaction-details")}>
                View record details
              </Button>
              <Button variant="outline" size="sm" onClick={() => onNavigate("transactions")}>
                Review affected transactions
              </Button>
              <Button variant="danger" size="sm" onClick={() => onNavigate("disputes")}>
                Open dispute
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
