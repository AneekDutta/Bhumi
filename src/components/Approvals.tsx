import { useState } from "react";
import { CheckCircle2, XCircle, Clock, ChevronRight } from "lucide-react";
import { Badge, Button, Alert, PageShell } from "./ui";
import { useData } from "../DataContext";
import type { Screen } from "../types";

interface ApprovalsProps {
  onNavigate: (s: Screen) => void;
}

export default function Approvals({ onNavigate }: ApprovalsProps) {
  const { transactions, loading, approveTransaction, rejectTransaction } = useData();
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ id: string; action: "approved" | "rejected" } | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pending = transactions.filter((t: any) => t.status === "Pending");
  const completed = transactions.filter((t: any) => t.status === "Completed" || t.status === "Rejected");

  const doApprove = async (id: string) => {
    setBusy(id);
    setErrorMsg(null);
    try {
      await approveTransaction(id);
      setFlash({ id, action: "approved" });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to approve transaction.");
    } finally {
      setBusy(null);
    }
  };

  const doReject = async (id: string) => {
    setBusy(id);
    setErrorMsg(null);
    try {
      await rejectTransaction(id);
      setFlash({ id, action: "rejected" });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reject transaction.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <PageShell>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[#111827]">Approvals</h1>
        <p className="text-xs text-[#6b7280] mt-0.5">Transactions pending financial authorization</p>
      </div>

      {errorMsg && (
        <div className="mb-4">
          <Alert variant="danger" title="Action Failed">
            {errorMsg}
          </Alert>
        </div>
      )}

      {flash && (
        <div className="mb-4">
          <Alert variant={flash.action === "approved" ? "success" : "warning"}
            title={flash.action === "approved" ? "Transaction approved" : "Transaction rejected"}>
            {flash.action === "approved"
              ? `${flash.id} approved and added to the verified ledger.`
              : `${flash.id} rejected and returned to requester.`}
          </Alert>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] px-4 py-8 text-center text-xs text-[#9ca3af]">Loading approvals…</div>
      ) : pending.length === 0 ? (
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] px-4 py-8 text-center mb-4">
          <CheckCircle2 size={24} className="text-green-500 mx-auto mb-2" strokeWidth={1.5} />
          <div className="text-sm font-medium text-[#374151]">No pending approvals</div>
          <div className="text-xs text-[#9ca3af] mt-1">All transactions have been reviewed.</div>
        </div>
      ) : (
        pending.map((tx: any) => (
          <div key={tx.id} className="bg-white border border-[#e5e7eb] rounded-[6px] mb-4">
            <div className="px-4 py-3 border-b border-[#e5e7eb] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-amber-500" />
                <span className="text-sm font-medium">Pending approval</span>
              </div>
              <Badge variant="pending">Awaiting</Badge>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-[#6b7280] mb-0.5">
                    <code className="mono">{tx.id}</code> &mdash; {tx.description}
                  </div>
                  <div className="text-2xl font-semibold text-[#111827] tracking-tight">₹{Number(tx.amount).toLocaleString("en-IN")}</div>
                  <div className="text-sm text-[#6b7280] mt-0.5">Requested by {tx.member} &mdash; {tx.date}</div>
                </div>
                <button onClick={() => onNavigate("transaction-details")} className="text-xs text-[#3b4fd8] hover:underline flex items-center gap-1 cursor-pointer">
                  View details <ChevronRight size={11} />
                </button>
              </div>

              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] p-3 mb-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7280] mb-2.5">Approval requirements</div>
                <div className="space-y-2">
                  {[
                    { role: "Group Leader", status: tx.approvalCount >= 1 ? "approved" : "pending" },
                    { role: "Treasurer", status: tx.approvalCount >= 2 ? "approved" : "pending" },
                  ].map((item) => (
                    <div key={item.role} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.status === "approved" ? (
                          <CheckCircle2 size={14} className="text-green-600" strokeWidth={1.75} />
                        ) : (
                          <Clock size={14} className="text-amber-500" strokeWidth={1.75} />
                        )}
                        <span className="text-sm">{item.role}</span>
                      </div>
                      <Badge variant={item.status === "approved" ? "verified" : "pending"}>
                        {item.status === "approved" ? "Approved" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#e5e7eb] text-xs text-[#6b7280]">
                  Required: <span className="font-medium text-[#374151]">2 of 2</span> &mdash; {tx.approvalCount} of 2 received
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => doApprove(tx.id)} disabled={busy === tx.id}>
                  <CheckCircle2 size={13} strokeWidth={2} />
                  {busy === tx.id ? "Approving…" : "Approve"}
                </Button>
                <Button variant="danger" onClick={() => doReject(tx.id)} disabled={busy === tx.id}>
                  <XCircle size={13} strokeWidth={2} />
                  Reject
                </Button>
                <Button variant="outline" onClick={() => onNavigate("transaction-details")}>View details</Button>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Recently completed */}
      <div className="bg-white border border-[#e5e7eb] rounded-[6px]">
        <div className="px-4 py-2.5 border-b border-[#e5e7eb]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Recently completed</h3>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Member</th>
                <th className="text-right">Amount</th>
                <th>Date</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {completed.slice(0, 5).map((tx: any) => (
                <tr key={tx.id} className="cursor-pointer" onClick={() => onNavigate("transaction-details")}>
                  <td>
                    <code className="mono text-[#3b4fd8]">{tx.id}</code>
                    <span className="ml-1.5 text-xs text-[#6b7280]">{tx.type}</span>
                  </td>
                  <td>{tx.member}</td>
                  <td className="text-right tabular-nums font-medium">₹{Number(tx.amount).toLocaleString("en-IN")}</td>
                  <td className="text-[#6b7280] whitespace-nowrap">{tx.date}</td>
                  <td>
                    <Badge variant={tx.status === "Completed" ? "verified" : "rejected"}>
                      {tx.status === "Completed" ? "Approved" : "Rejected"}
                    </Badge>
                  </td>
                </tr>
              ))}
              {completed.length === 0 && (
                <tr><td colSpan={5} className="text-center text-[#9ca3af] py-4 text-xs">No completed approvals yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
