import { CheckCircle2, AlertTriangle, Shield, FilePlus, MessageSquare, Clock } from "lucide-react";
import { PageShell, Badge } from "./ui";
import { useData } from "../DataContext";

function EventIcon({ type }: { type: string }) {
  const props = { size: 14, strokeWidth: 1.75 };
  switch (type) {
    case "created": return <FilePlus {...props} className="text-[#3b4fd8]" />;
    case "approval": return <CheckCircle2 {...props} className="text-green-600" />;
    case "verified": return <Shield {...props} className="text-green-600" />;
    case "modified": return <AlertTriangle {...props} className="text-red-600" />;
    case "dispute": return <MessageSquare {...props} className="text-amber-600" />;
    case "resolved": return <CheckCircle2 {...props} className="text-[#3b4fd8]" />;
    default: return <Clock {...props} className="text-[#9ca3af]" />;
  }
}

function eventBadge(type: string) {
  switch (type) {
    case "created": return <Badge variant="pending">Created</Badge>;
    case "approval": return <Badge variant="verified">Approved</Badge>;
    case "verified": return <Badge variant="verified">Verified</Badge>;
    case "modified": return <Badge variant="failed">Modified</Badge>;
    case "dispute": return <Badge variant="review">Dispute</Badge>;
    case "resolved": return <Badge variant="completed">Resolved</Badge>;
    default: return null;
  }
}

export default function AuditHistory() {
  const { auditEvents, loading } = useData();

  return (
    <PageShell>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[#111827]">Audit History</h1>
        <p className="text-xs text-[#6b7280] mt-0.5">Complete chronological record of all ledger events</p>
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-[6px]">
        <div className="px-4 py-2.5 border-b border-[#e5e7eb]">
          <div className="text-xs text-[#6b7280]">{auditEvents.length} recorded events</div>
        </div>
        {loading ? (
          <div className="px-4 py-8 text-center text-xs text-[#9ca3af]">Loading audit history…</div>
        ) : (
          <div className="px-4 py-3">
            <div className="relative">
              <div className="absolute left-[6px] top-2 bottom-2 w-px bg-[#e5e7eb]" />
              <div className="space-y-0">
                {auditEvents.map((event: any, i: number) => (
                  <div key={event.id} className={`relative flex items-start gap-3 pl-6 ${i < auditEvents.length - 1 ? "pb-4" : ""}`}>
                    <div className="absolute left-0 top-0.5 flex items-center justify-center w-[13px] h-[13px] rounded-full bg-white border border-[#e5e7eb] z-10">
                      <EventIcon type={event.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-medium text-[#111827]">{event.actor}</span>
                            {event.txId && <code className="mono text-[10px] text-[#9ca3af]">{event.txId}</code>}
                            {eventBadge(event.type)}
                          </div>
                          <p className="text-xs text-[#374151] mt-0.5 leading-relaxed">{event.action}</p>
                        </div>
                        <div className="text-[10px] text-[#9ca3af] whitespace-nowrap shrink-0">{event.timestamp}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {auditEvents.length === 0 && (
                  <div className="text-center text-xs text-[#9ca3af] py-4">No audit events recorded.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
