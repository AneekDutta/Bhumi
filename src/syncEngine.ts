// PS-18 Sync Engine: Durable FIFO Synchronization, Bounded Retries, and Network Detection
import { offlineDb, type SyncQueueItem, type OfflineTransaction, type SyncStatus } from "./offlineDb";
import { api } from "./api";

export type NetworkState = "ONLINE" | "OFFLINE" | "CONNECTION_UNREACHABLE";

export interface SyncProgressEvent {
  current: number;
  total: number;
  syncedCount: number;
  failedCount: number;
  conflictCount: number;
  inProgress: boolean;
  lastError?: string | null;
}

export interface SyncResult {
  client_transaction_id: string;
  status: "SYNCED" | "REJECTED" | "CONFLICT";
  transaction_id?: string;
  sequence_number?: number;
  current_hash?: string;
  verified?: boolean;
  reason?: string;
}

type NetworkListener = (state: NetworkState) => void;
type ProgressListener = (progress: SyncProgressEvent) => void;

class SyncEngine {
  private networkState: NetworkState = "ONLINE";
  private isSyncing = false;
  private networkListeners: Set<NetworkListener> = new Set();
  private progressListeners: Set<ProgressListener> = new Set();
  private maxRetries = 3;
  private retryDelayMs = 1500;

  constructor() {
    if (typeof window !== "undefined") {
      this.networkState = navigator.onLine ? "ONLINE" : "OFFLINE";

      window.addEventListener("online", () => {
        this.setNetworkState("ONLINE");
        this.syncAll();
      });

      window.addEventListener("offline", () => {
        this.setNetworkState("OFFLINE");
      });
    }
  }

  getNetworkState(): NetworkState {
    return this.networkState;
  }

  setNetworkState(state: NetworkState) {
    if (this.networkState !== state) {
      this.networkState = state;
      this.notifyNetworkListeners();
    }
  }

  subscribeNetwork(fn: NetworkListener): () => void {
    this.networkListeners.add(fn);
    fn(this.networkState);
    return () => this.networkListeners.delete(fn);
  }

  subscribeProgress(fn: ProgressListener): () => void {
    this.progressListeners.add(fn);
    return () => this.progressListeners.delete(fn);
  }

  private notifyNetworkListeners() {
    for (const fn of this.networkListeners) {
      try { fn(this.networkState); } catch {}
    }
  }

  private notifyProgress(event: SyncProgressEvent) {
    for (const fn of this.progressListeners) {
      try { fn(event); } catch {}
    }
  }

  // ─── RECORDING MUTATIONS OFFLINE ───────────────────────────────────────────

  async recordOfflineTransaction(params: {
    group_id?: string;
    member_id: string;
    member_name: string;
    meeting_id?: string | null;
    transaction_type: OfflineTransaction["transaction_type"];
    description?: string;
    amount_paise: number;
    principal_paise?: number;
    interest_paise?: number;
    payment_mode?: OfflineTransaction["payment_mode"];
    created_by?: string;
  }): Promise<OfflineTransaction> {
    const localId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `loc_${Date.now()}`;
    const clientTxId = `ctx_${localId}`;

    const offlineTx: OfflineTransaction = {
      local_id: localId,
      client_transaction_id: clientTxId,
      group_id: params.group_id || "MDSHG-2024",
      member_id: params.member_id,
      member_name: params.member_name,
      meeting_id: params.meeting_id || null,
      transaction_type: params.transaction_type,
      description: params.description || `${params.transaction_type} (${params.member_name})`,
      amount_paise: params.amount_paise,
      principal_paise: params.principal_paise || 0,
      interest_paise: params.interest_paise || 0,
      payment_mode: params.payment_mode || "Cash",
      client_created_at: new Date().toISOString(),
      created_by: params.created_by || "user_offline",
      sync_status: "QUEUED",
      sync_attempts: 0,
      last_sync_error: null,
      server_transaction_id: null,
      sequence_number: null,
      prev_hash: null,
      current_hash: null,
      verified: false,
      verified_at: null,
    };

    // 1. Store in IndexedDB
    await offlineDb.saveOfflineTransaction(offlineTx);

    // 2. Add to FIFO Sync Queue
    await offlineDb.enqueueSyncItem({
      entity_type: "transaction",
      entity_id: localId,
      operation: "create",
      payload: { ...offlineTx },
    });

    // 3. Attempt immediate sync if network is active
    if (this.networkState === "ONLINE") {
      this.syncAll().catch(() => {});
    }

    return offlineTx;
  }

  // ─── SYNCHRONIZATION DISPATCHER ────────────────────────────────────────────

  async syncAll(): Promise<{
    uploaded: number;
    verified: number;
    failed: number;
    conflicts: number;
  }> {
    if (this.isSyncing) {
      return { uploaded: 0, verified: 0, failed: 0, conflicts: 0 };
    }

    const queue = await offlineDb.getSyncQueue();
    const pendingItems = queue.filter((q) => q.status === "QUEUED" || (q.status === "REJECTED" && q.attempt_count < this.maxRetries));

    if (pendingItems.length === 0) {
      this.notifyProgress({
        current: 0,
        total: 0,
        syncedCount: 0,
        failedCount: 0,
        conflictCount: 0,
        inProgress: false,
      });
      return { uploaded: 0, verified: 0, failed: 0, conflicts: 0 };
    }

    this.isSyncing = true;
    let syncedCount = 0;
    let failedCount = 0;
    let conflictCount = 0;

    this.notifyProgress({
      current: 0,
      total: pendingItems.length,
      syncedCount: 0,
      failedCount: 0,
      conflictCount: 0,
      inProgress: true,
    });

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      await offlineDb.updateSyncQueueItem(item.queue_id, {
        status: "SYNCING",
        attempt_count: item.attempt_count + 1,
        last_attempt_at: new Date().toISOString(),
      });

      this.notifyProgress({
        current: i + 1,
        total: pendingItems.length,
        syncedCount,
        failedCount,
        conflictCount,
        inProgress: true,
      });

      try {
        if (item.entity_type === "transaction") {
          const res = await this.syncTransactionItem(item);
          if (res.status === "SYNCED") {
            syncedCount++;
          } else if (res.status === "CONFLICT") {
            conflictCount++;
          } else {
            failedCount++;
          }
        }
      } catch (err: any) {
        failedCount++;
        const errMsg = err?.message || "Network request failed";
        this.setNetworkState("CONNECTION_UNREACHABLE");

        await offlineDb.updateSyncQueueItem(item.queue_id, {
          status: item.attempt_count + 1 >= this.maxRetries ? "REJECTED" : "QUEUED",
          last_error: errMsg,
        });

        const tx = await offlineDb.getOfflineTransaction(item.entity_id);
        if (tx) {
          await offlineDb.updateOfflineTransaction(item.entity_id, {
            sync_status: item.attempt_count + 1 >= this.maxRetries ? "REJECTED" : "QUEUED",
            sync_attempts: item.attempt_count + 1,
            last_sync_error: errMsg,
          });
        }
      }

      // Small bounded pause between operations to avoid connection congestion
      await new Promise((r) => setTimeout(r, 100));
    }

    // Update global sync metadata
    await offlineDb.updateSyncMetadata({
      last_synced_at: new Date().toISOString(),
      total_synced_count: (await offlineDb.getSyncMetadata()).total_synced_count + syncedCount,
      total_failed_count: (await offlineDb.getSyncMetadata()).total_failed_count + failedCount,
      total_conflict_count: (await offlineDb.getSyncMetadata()).total_conflict_count + conflictCount,
    });

    this.isSyncing = false;
    this.notifyProgress({
      current: pendingItems.length,
      total: pendingItems.length,
      syncedCount,
      failedCount,
      conflictCount,
      inProgress: false,
    });

    return {
      uploaded: syncedCount,
      verified: syncedCount,
      failed: failedCount,
      conflicts: conflictCount,
    };
  }

  private async syncTransactionItem(item: SyncQueueItem): Promise<SyncResult> {
    const payload = item.payload as OfflineTransaction;
    const batchRequest = {
      operations: [
        {
          client_transaction_id: payload.client_transaction_id,
          group_id: payload.group_id,
          member_id: payload.member_id,
          member_name: payload.member_name,
          meeting_id: payload.meeting_id,
          transaction_type: payload.transaction_type,
          description: payload.description,
          amount_paise: payload.amount_paise,
          principal_paise: payload.principal_paise,
          interest_paise: payload.interest_paise,
          payment_mode: payload.payment_mode,
          client_created_at: payload.client_created_at,
          created_by: payload.created_by,
        },
      ],
    };

    const response = await api.syncBatch(batchRequest);
    const result: SyncResult = response?.results?.[0] || {
      client_transaction_id: payload.client_transaction_id,
      status: "REJECTED",
      reason: "Empty server sync response",
    };

    if (result.status === "SYNCED") {
      // Update local transaction with authoritative server details
      await offlineDb.updateOfflineTransaction(item.entity_id, {
        server_transaction_id: result.transaction_id,
        sequence_number: result.sequence_number,
        current_hash: result.current_hash,
        verified: true,
        verified_at: new Date().toISOString(),
        sync_status: "SYNCED",
        last_sync_error: null,
      });

      // Remove from queue on complete success
      await offlineDb.removeSyncQueueItem(item.queue_id);
    } else if (result.status === "CONFLICT") {
      await offlineDb.updateOfflineTransaction(item.entity_id, {
        sync_status: "CONFLICT",
        last_sync_error: result.reason || "Conflict detected on server",
      });

      await offlineDb.updateSyncQueueItem(item.queue_id, {
        status: "CONFLICT",
        last_error: result.reason,
      });
    } else {
      await offlineDb.updateOfflineTransaction(item.entity_id, {
        sync_status: "REJECTED",
        last_sync_error: result.reason || "Rejected by server validation",
      });

      await offlineDb.updateSyncQueueItem(item.queue_id, {
        status: "REJECTED",
        last_error: result.reason,
      });
    }

    return result;
  }
}

export const syncEngine = new SyncEngine();
