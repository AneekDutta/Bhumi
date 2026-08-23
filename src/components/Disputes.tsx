import { useState } from "react";
import { AlertTriangle, FileText, GitCompare, CheckCircle2 } from "lucide-react";
import { Badge, Button, PageShell, Divider, Alert } from "./ui";
import { useData } from "../DataContext";
import type { Screen } from "../types";

interface DisputesProps {
  onNavigate: (s: Screen) => void;
}

export default function Disputes({ onNavigate }: DisputesProps) {
  const { disputes, loading, resolveDispute, createDispute } = useData();
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const active = disputes.filter((d: any) => d.status === "Under Review");
  const closed = disputes.filter((d: any) => d.status !== "Under Review");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const doResolve = async (id: string) => {
    setBusy(id);
    setErrorMsg(null);
    try {
      await resolveDispute(id);
      setFlash(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resolve dispute.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <PageShell>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[#111827]">Disputes</h1>
        <p className="text-xs text-[#6b7280] mt-0.5">Contested transactions and integrity violations</p>
      </div>

      {errorMsg && (
        <div className="mb-4">
          <Alert variant="danger" title="Action Failed">{errorMsg}</Alert>
        </div>
      )}

      {flash && (
        <div className="mb-4">
          <Alert variant="success" title="Dispute resolved">Original records restored and noted in the audit log.</Alert>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] px-4 py-8 text-center text-xs text-[#9ca3af] mb-4">Loading disputes…</div>
      ) : active.length === 0 ? (
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] px-4 py-8 text-center mb-4">
          <CheckCircle2 size={24} className="text-green-500 mx-auto mb-2" strokeWidth={1.5} />
          <div className="text-sm font-medium text-[#374151]">No active disputes</div>
          <div className="text-xs text-[#9ca3af] mt-1">All transactions are uncontested.</div>
        </div>
      ) : (
        active.map((d: any) => (
          <div key={d.id} className="bg-white border border-red-200 rounded-[6px] mb-4">
            <div className="px-4 py-3 border-b border-red-200 bg-red-50 rounded-t-[6px] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-600" strokeWidth={1.75} />
                <span className="text-sm font-semibold text-red-800">Dispute #{d.id}</span>
              </div>
              <Badge variant="review">Under review</Badge>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] divide-y divide-[#e5e7eb]">
                  {[
                    ["Transaction", d.txId],
                    ["Reported by", d.reportedBy],
                    ["Date reported", d.date],
                    ["Reason", `"${d.reason}"`],
                  ].map(([label, value]) => (
                    <div key={label} className="px-3 py-2 flex items-start justify-between gap-2">
                      <span className="text-xs text-[#6b7280] shrink-0">{label}</span>
                      <span className="text-xs text-[#111827] text-right">{value}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7280] mb-2">Amount discrepancy</div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-green-50 border border-green-200 rounded-[6px] px-3 py-2.5">
                      <div className="text-xs text-green-600 mb-0.5">Original recorded</div>
                      <div className="text-lg font-semibold text-green-800">₹{Number(d.originalAmount || 5000).toLocaleString("en-IN")}</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-[6px] px-3 py-2.5">
                      <div className="text-xs text-red-600 mb-0.5">Current (modified)</div>
                      <div className="text-lg font-semibold text-red-700">₹{Number(d.currentAmount || 50000).toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                  <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] divide-y divide-[#e5e7eb]">
                    {[["Integrity check", "Failed"], ["Hash mismatch", "Yes"], ["Downstream affected", "2"]].map(([label, value]) => (
                      <div key={label} className="px-3 py-2 flex items-center justify-between">
                        <span className="text-xs text-[#6b7280]">{label}</span>
                        <span className={`text-xs font-medium ${value === "Failed" || value === "Yes" ? "text-red-600" : "text-[#111827]"}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Divider className="mb-3" />
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => onNavigate("transaction-details")}>
                  <FileText size={12} /> Review evidence
                </Button>
                <Button variant="outline" size="sm">
                  <GitCompare size={12} /> Compare versions
                </Button>
                <Button size="sm" onClick={() => doResolve(d.id)} disabled={busy === d.id}>
                  <CheckCircle2 size={12} />
                  {busy === d.id ? "Resolving…" : "Resolve dispute"}
                </Button>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Closed disputes */}
      <div className="bg-white border border-[#e5e7eb] rounded-[6px]">
        <div className="px-4 py-2.5 border-b border-[#e5e7eb]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Closed disputes</h3>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Dispute</th>
                <th>Transaction</th>
                <th>Reported by</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {closed.map((d: any) => (
                <tr key={d.id}>
                  <td><code className="mono text-[#6b7280]">{d.id}</code></td>
                  <td><code className="mono text-[#3b4fd8]">{d.txId}</code></td>
                  <td>{d.reportedBy}</td>
                  <td className="text-[#6b7280]">{d.date}</td>
                  <td><Badge variant="verified">Resolved</Badge></td>
                </tr>
              ))}
              {closed.length === 0 && (
                <tr><td colSpan={5} className="text-center text-[#9ca3af] py-4 text-xs">No closed disputes.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
