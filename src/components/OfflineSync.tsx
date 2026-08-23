import { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw, CheckCircle2, Shield, Plus, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { PageShell, Button, Badge } from "./ui";
import { useData } from "../DataContext";
import { offlineDb, type SyncQueueItem, type OfflineTransaction, type SyncMetadata } from "../offlineDb";
import { syncEngine, type NetworkState, type SyncProgressEvent } from "../syncEngine";

export default function OfflineSync() {
  const { refresh } = useData();
  const [networkState, setNetworkState] = useState<NetworkState>(syncEngine.getNetworkState());
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [offlineTxns, setOfflineTxns] = useState<OfflineTransaction[]>([]);
  const [metadata, setMetadata] = useState<SyncMetadata | null>(null);
  const [progress, setProgress] = useState<SyncProgressEvent | null>(null);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState("Sunita Devi");
  const [newType, setNewType] = useState<OfflineTransaction["transaction_type"]>("Contribution");
  const [newAmount, setNewAmount] = useState("500");

  const loadData = async () => {
    const q = await offlineDb.getSyncQueue();
    const txs = await offlineDb.getOfflineTransactions();
    const meta = await offlineDb.getSyncMetadata();
    setQueue(q);
    setOfflineTxns(txs);
    setMetadata(meta);
  };

  useEffect(() => {
    loadData();

    const unsubNet = syncEngine.subscribeNetwork((state) => {
      setNetworkState(state);
    });

    const unsubProg = syncEngine.subscribeProgress((p) => {
      setProgress(p);
      loadData();
    });

    return () => {
      unsubNet();
      unsubProg();
    };
  }, []);

  const handleCreateOffline = async () => {
    const amt = Number(newAmount) || 500;
    await syncEngine.recordOfflineTransaction({
      member_id: newMember === "Sunita Devi" ? "M-02" : "M-01",
      member_name: newMember,
      transaction_type: newType,
      amount_paise: amt * 100,
      principal_paise: amt * 100,
      description: `Offline ${newType} (${newMember})`,
    });
    setShowAddForm(false);
    await loadData();
  };

  const handleSyncNow = async () => {
    await syncEngine.syncAll();
    await refresh();
    await loadData();
  };

  const queuedItems = queue.filter((i) => i.status === "QUEUED" || i.status === "SYNCING");
  const failedItems = queue.filter((i) => i.status === "REJECTED" || i.status === "CONFLICT");

  const isOnline = networkState === "ONLINE";

  return (
    <PageShell>
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">Offline Synchronization Center</h1>
            <p className="text-xs text-[#6b7280] mt-0.5">Durable IndexedDB financial queue with zero data loss</p>
          </div>
          <Badge variant={isOnline ? "verified" : "pending"}>
            {isOnline ? (
              <span className="flex items-center gap-1"><Wifi size={12} /> ONLINE</span>
            ) : networkState === "CONNECTION_UNREACHABLE" ? (
              <span className="flex items-center gap-1"><AlertTriangle size={12} /> UNREACHABLE</span>
            ) : (
              <span className="flex items-center gap-1"><WifiOff size={12} /> OFFLINE</span>
            )}
          </Badge>
        </div>

        {/* Network & Live Status Card */}
        <div className={`border rounded-[8px] p-4 mb-4 ${
          isOnline ? "bg-green-50/70 border-green-200" : "bg-amber-50/70 border-amber-200"
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isOnline ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              }`}>
                {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
              </div>
              <div>
                <div className="text-sm font-semibold text-[#111827]">
                  {isOnline
                    ? "Connection Active & Authoritative"
                    : "Operating in Offline Mode (IndexedDB Active)"}
                </div>
                <div className="text-xs text-[#6b7280]">
                  {queuedItems.length > 0
                    ? `${queuedItems.length} transaction${queuedItems.length > 1 ? "s" : ""} waiting to sync to ledger.`
                    : "All offline records are fully synchronized with authoritative ledger."}
                </div>
              </div>
            </div>

            {queuedItems.length > 0 && isOnline && (
              <Button onClick={handleSyncNow} disabled={progress?.inProgress}>
                {progress?.inProgress ? (
                  <span className="flex items-center gap-1.5"><RefreshCw size={13} className="animate-spin" /> Syncing…</span>
                ) : (
                  "Sync Now"
                )}
              </Button>
            )}
          </div>

          {/* Real Live Progress Indicator */}
          {progress && progress.inProgress && (
            <div className="mt-3 pt-3 border-t border-green-200/80">
              <div className="flex justify-between text-xs font-semibold text-gray-800 mb-1">
                <span>SYNCING IN PROGRESS</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#3b4fd8] h-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sync Summary Metrics */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-white border border-[#e5e7eb] rounded-[6px] p-3 text-center shadow-xs">
            <div className="text-[10px] uppercase tracking-wider text-[#6b7280] font-semibold">Queued</div>
            <div className="text-xl font-bold text-[#111827] mt-0.5">{queuedItems.length}</div>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-[6px] p-3 text-center shadow-xs">
            <div className="text-[10px] uppercase tracking-wider text-[#6b7280] font-semibold">Synced</div>
            <div className="text-xl font-bold text-green-700 mt-0.5">{metadata?.total_synced_count ?? 0}</div>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-[6px] p-3 text-center shadow-xs">
            <div className="text-[10px] uppercase tracking-wider text-[#6b7280] font-semibold">Failed</div>
            <div className="text-xl font-bold text-red-600 mt-0.5">{metadata?.total_failed_count ?? 0}</div>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-[6px] p-3 text-center shadow-xs">
            <div className="text-[10px] uppercase tracking-wider text-[#6b7280] font-semibold">Conflicts</div>
            <div className="text-xl font-bold text-amber-600 mt-0.5">{metadata?.total_conflict_count ?? 0}</div>
          </div>
        </div>

        {/* Last synchronized bar */}
        <div className="bg-white border border-[#e5e7eb] rounded-[6px] px-4 py-2.5 mb-4 flex items-center justify-between text-xs text-[#6b7280]">
          <span className="flex items-center gap-1.5">
            <Clock size={13} />
            Last synchronized:
          </span>
          <span className="font-mono font-medium text-[#111827]">
            {metadata?.last_synced_at ? new Date(metadata.last_synced_at).toLocaleString("en-IN") : "Never"}
          </span>
        </div>

        {/* Pending Sync Queue */}
        <div className="bg-white border border-[#e5e7eb] rounded-[8px] p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
              Persistent Offline Queue ({queue.length})
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus size={13} className="mr-1 inline" /> Record Offline
            </Button>
          </div>

          {showAddForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-[6px] p-3 mb-3 space-y-2.5 text-xs">
              <div className="font-semibold text-gray-900 pb-1 border-b border-gray-200">
                New Offline Financial Mutation (IndexedDB)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 mb-1 font-medium">Member</label>
                  <select
                    value={newMember}
                    onChange={(e) => setNewMember(e.target.value)}
                    className="w-full border border-gray-300 rounded p-1.5 bg-white text-xs"
                  >
                    {["Sunita Devi", "Kamla Verma", "Anita Sharma", "Rekha Singh", "Meera Patel", "Priya Kumari"].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-1 font-medium">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full border border-gray-300 rounded p-1.5 bg-white text-xs"
                  >
                    <option value="Contribution">Regular Savings</option>
                    <option value="Repayment">Loan Repayment</option>
                    <option value="Loan">Loan Disbursement</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-1 font-medium">Amount (₹)</label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded p-1.5 bg-white text-xs"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleCreateOffline}>Save to IndexedDB</Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {queue.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-400">
              <CheckCircle2 size={24} className="text-green-500 mx-auto mb-1.5" />
              All offline transactions have been synchronized and verified by the server.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {queue.map((item) => {
                const payload = item.payload as OfflineTransaction;
                const isFailed = item.status === "REJECTED" || item.status === "CONFLICT";
                return (
                  <div key={item.queue_id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-gray-900">{payload.member_name}</div>
                      <div className="text-gray-500 text-[11px] mt-0.5">
                        {payload.transaction_type} &bull; <span className="font-mono text-[10px] text-gray-400">{payload.client_transaction_id}</span>
                      </div>
                      {item.last_error && (
                        <div className="text-[10px] text-red-600 font-medium mt-1">
                          Error: {item.last_error}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        ₹{(payload.amount_paise / 100).toLocaleString("en-IN")}
                      </div>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mt-1 ${
                        item.status === "SYNCING"
                          ? "bg-blue-100 text-blue-800 animate-pulse"
                          : isFailed
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {item.status === "SYNCING" ? "Syncing…" : item.status === "CONFLICT" ? "Conflict" : item.status === "REJECTED" ? "Rejected" : "Waiting to Sync"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Local Transactions History in IndexedDB */}
        {offlineTxns.length > 0 && (
          <div className="bg-white border border-[#e5e7eb] rounded-[8px] p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7280] mb-3">
              IndexedDB Records History ({offlineTxns.length})
            </div>
            <div className="divide-y divide-gray-100 text-xs max-h-60 overflow-y-auto">
              {offlineTxns.map((tx) => (
                <div key={tx.local_id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{tx.member_name} &mdash; {tx.transaction_type}</div>
                    <div className="text-[10px] text-gray-400 font-mono">
                      {tx.server_transaction_id ? `Server TXN: ${tx.server_transaction_id} (Seq #${tx.sequence_number})` : `Local ID: ${tx.local_id}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">₹{(tx.amount_paise / 100).toLocaleString("en-IN")}</span>
                    <div>
                      <span className={`text-[10px] font-semibold ${tx.sync_status === "SYNCED" ? "text-green-700" : "text-amber-700"}`}>
                        {tx.sync_status === "SYNCED" ? "✓ Synced & Verified" : "Waiting to Sync"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
