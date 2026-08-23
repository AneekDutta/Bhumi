// PS-18 IndexedDB Persistent Offline Financial Storage Layer
// Database: ps18_ledger_offline_v1

export type SyncStatus = "LOCAL_ONLY" | "QUEUED" | "SYNCING" | "SYNCED" | "REJECTED" | "CONFLICT";

export interface OfflineTransaction {
  local_id: string; // crypto.randomUUID()
  client_transaction_id: string; // Idempotency key
  group_id: string;
  member_id: string;
  member_name: string;
  meeting_id?: string | null;
  transaction_type: "Contribution" | "Loan" | "Repayment" | "Expense" | "Withdrawal" | "Bank Deposit" | "Reversal" | "Correction";
  description: string;
  amount_paise: number;
  principal_paise: number;
  interest_paise: number;
  payment_mode: "Cash" | "Bank Transfer" | "UPI" | "Cheque";
  client_created_at: string;
  created_by: string;
  sync_status: SyncStatus;
  sync_attempts: number;
  last_sync_error?: string | null;
  // Server-assigned authoritative fields (null when offline)
  server_transaction_id?: string | null;
  sequence_number?: number | null;
  prev_hash?: string | null;
  current_hash?: string | null;
  verified?: boolean;
  verified_at?: string | null;
}

export interface SyncQueueItem {
  queue_id: string; // crypto.randomUUID()
  entity_type: "transaction" | "meeting" | "reconciliation" | "loan";
  entity_id: string; // local_id or meeting_id
  operation: "create" | "update" | "close" | "reconcile";
  payload: any;
  created_at: string;
  attempt_count: number;
  last_attempt_at?: string | null;
  last_error?: string | null;
  status: SyncStatus;
}

export interface SyncMetadata {
  key: string; // 'global'
  last_synced_at: string | null;
  total_synced_count: number;
  total_failed_count: number;
  total_conflict_count: number;
  last_server_sequence: number;
}

export interface OfflineMeeting {
  id: string;
  group_id: string;
  meeting_number: number;
  date: string;
  attendance: { member_id: string; member_name: string; present: boolean }[];
  quorum_met: boolean;
  status: "DRAFT_LOCAL" | "SAVED_LOCALLY" | "SYNCED" | "CLOSED";
  created_at: string;
  created_by: string;
  closed_at?: string | null;
  sync_status: SyncStatus;
}

export interface OfflineReconciliation {
  meeting_id: string;
  opening_cash_paise: number;
  expected_cash_paise: number;
  physical_cash_paise: number;
  cash_delta_paise: number;
  denominations: Record<number, number>;
  status: "Matched" | "Mismatch" | "Review Required" | "Reconciled";
  recorded_by: string;
  created_at: string;
  sync_status: SyncStatus;
}

const DB_NAME = "ps18_ledger_offline_v1";
const DB_VERSION = 1;

class OfflineDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;
  // In-memory fallback for environments without native indexedDB (e.g. Node test runners)
  private memoryFallback: {
    offline_transactions: Map<string, OfflineTransaction>;
    sync_queue: Map<string, SyncQueueItem>;
    sync_metadata: Map<string, SyncMetadata>;
    offline_meetings: Map<string, OfflineMeeting>;
    offline_reconciliation_data: Map<string, OfflineReconciliation>;
  } = {
    offline_transactions: new Map(),
    sync_queue: new Map(),
    sync_metadata: new Map(),
    offline_meetings: new Map(),
    offline_reconciliation_data: new Map(),
  };

  private isIndexedDbSupported(): boolean {
    return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.isIndexedDbSupported()) {
      throw new Error("IndexedDB not supported in current environment");
    }

    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. offline_transactions store
        if (!db.objectStoreNames.contains("offline_transactions")) {
          const txStore = db.createObjectStore("offline_transactions", { keyPath: "local_id" });
          txStore.createIndex("client_transaction_id", "client_transaction_id", { unique: true });
          txStore.createIndex("sync_status", "sync_status", { unique: false });
        }

        // 2. sync_queue store
        if (!db.objectStoreNames.contains("sync_queue")) {
          const qStore = db.createObjectStore("sync_queue", { keyPath: "queue_id" });
          qStore.createIndex("status", "status", { unique: false });
          qStore.createIndex("created_at", "created_at", { unique: false });
        }

        // 3. sync_metadata store
        if (!db.objectStoreNames.contains("sync_metadata")) {
          db.createObjectStore("sync_metadata", { keyPath: "key" });
        }

        // 4. offline_meetings store
        if (!db.objectStoreNames.contains("offline_meetings")) {
          db.createObjectStore("offline_meetings", { keyPath: "id" });
        }

        // 5. offline_reconciliation_data store
        if (!db.objectStoreNames.contains("offline_reconciliation_data")) {
          db.createObjectStore("offline_reconciliation_data", { keyPath: "meeting_id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // ─── OFFLINE TRANSACTIONS ──────────────────────────────────────────────────

  async saveOfflineTransaction(tx: OfflineTransaction): Promise<void> {
    if (!this.isIndexedDbSupported()) {
      this.memoryFallback.offline_transactions.set(tx.local_id, { ...tx });
      return;
    }
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tr = db.transaction("offline_transactions", "readwrite");
      const store = tr.objectStore("offline_transactions");
      const req = store.put(tx);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getOfflineTransactions(): Promise<OfflineTransaction[]> {
    if (!this.isIndexedDbSupported()) {
      return Array.from(this.memoryFallback.offline_transactions.values());
    }
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tr = db.transaction("offline_transactions", "readonly");
      const store = tr.objectStore("offline_transactions");
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getOfflineTransaction(localId: string): Promise<OfflineTransaction | undefined> {
    if (!this.isIndexedDbSupported()) {
      return this.memoryFallback.offline_transactions.get(localId);
    }
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tr = db.transaction("offline_transactions", "readonly");
      const store = tr.objectStore("offline_transactions");
      const req = store.get(localId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async updateOfflineTransaction(localId: string, updates: Partial<OfflineTransaction>): Promise<void> {
    const existing = await this.getOfflineTransaction(localId);
    if (!existing) throw new Error(`Offline transaction not found: ${localId}`);
    const updated = { ...existing, ...updates };
    await this.saveOfflineTransaction(updated);
  }

  // ─── SYNC QUEUE ────────────────────────────────────────────────────────────

  async enqueueSyncItem(item: Omit<SyncQueueItem, "queue_id" | "created_at" | "attempt_count" | "status">): Promise<SyncQueueItem> {
    const queueItem: SyncQueueItem = {
      queue_id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `q_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      ...item,
      created_at: new Date().toISOString(),
      attempt_count: 0,
      status: "QUEUED",
    };

    if (!this.isIndexedDbSupported()) {
      this.memoryFallback.sync_queue.set(queueItem.queue_id, { ...queueItem });
      return queueItem;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tr = db.transaction("sync_queue", "readwrite");
      const store = tr.objectStore("sync_queue");
      const req = store.put(queueItem);
      req.onsuccess = () => resolve(queueItem);
      req.onerror = () => reject(req.error);
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.isIndexedDbSupported()) {
      return Array.from(this.memoryFallback.sync_queue.values()).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tr = db.transaction("sync_queue", "readonly");
      const store = tr.objectStore("sync_queue");
      const req = store.getAll();
      req.onsuccess = () => {
        const list: SyncQueueItem[] = req.result || [];
        list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async updateSyncQueueItem(queueId: string, updates: Partial<SyncQueueItem>): Promise<void> {
    if (!this.isIndexedDbSupported()) {
      const existing = this.memoryFallback.sync_queue.get(queueId);
      if (existing) {
        this.memoryFallback.sync_queue.set(queueId, { ...existing, ...updates });
      }
      return;
    }
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tr = db.transaction("sync_queue", "readwrite");
      const store = tr.objectStore("sync_queue");
      const req = store.get(queueId);
      req.onsuccess = () => {
        const item = req.result;
        if (!item) {
          resolve();
          return;
        }
        const updated = { ...item, ...updates };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async removeSyncQueueItem(queueId: string): Promise<void> {
    if (!this.isIndexedDbSupported()) {
      this.memoryFallback.sync_queue.delete(queueId);
      return;
    }
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tr = db.transaction("sync_queue", "readwrite");
      const store = tr.objectStore("sync_queue");
      const req = store.delete(queueId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // ─── SYNC METADATA ─────────────────────────────────────────────────────────

  async getSyncMetadata(): Promise<SyncMetadata> {
    const defaultMeta: SyncMetadata = {
      key: "global",
      last_synced_at: null,
      total_synced_count: 0,
      total_failed_count: 0,
      total_conflict_count: 0,
      last_server_sequence: 0,
    };

    if (!this.isIndexedDbSupported()) {
      return this.memoryFallback.sync_metadata.get("global") || defaultMeta;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tr = db.transaction("sync_metadata", "readonly");
      const store = tr.objectStore("sync_metadata");
      const req = store.get("global");
      req.onsuccess = () => resolve(req.result || defaultMeta);
      req.onerror = () => reject(req.error);
    });
  }

  async updateSyncMetadata(updates: Partial<SyncMetadata>): Promise<SyncMetadata> {
    const current = await this.getSyncMetadata();
    const updated = { ...current, ...updates };

    if (!this.isIndexedDbSupported()) {
      this.memoryFallback.sync_metadata.set("global", updated);
      return updated;
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tr = db.transaction("sync_metadata", "readwrite");
      const store = tr.objectStore("sync_metadata");
      const req = store.put(updated);
      req.onsuccess = () => resolve(updated);
      req.onerror = () => reject(req.error);
    });
  }

  // ─── OFFLINE MEETINGS ──────────────────────────────────────────────────────

  async saveOfflineMeeting(meeting: OfflineMeeting): Promise<void> {
    if (!this.isIndexedDbSupported()) {
      this.memoryFallback.offline_meetings.set(meeting.id, { ...meeting });
      return;
    }
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tr = db.transaction("offline_meetings", "readwrite");
      const store = tr.objectStore("offline_meetings");
      const req = store.put(meeting);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getOfflineMeetings(): Promise<OfflineMeeting[]> {
    if (!this.isIndexedDbSupported()) {
      return Array.from(this.memoryFallback.offline_meetings.values());
    }
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tr = db.transaction("offline_meetings", "readonly");
      const store = tr.objectStore("offline_meetings");
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // ─── OFFLINE RECONCILIATION ────────────────────────────────────────────────

  async saveOfflineReconciliation(recon: OfflineReconciliation): Promise<void> {
    if (!this.isIndexedDbSupported()) {
      this.memoryFallback.offline_reconciliation_data.set(recon.meeting_id, { ...recon });
      return;
    }
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tr = db.transaction("offline_reconciliation_data", "readwrite");
      const store = tr.objectStore("offline_reconciliation_data");
      const req = store.put(recon);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getOfflineReconciliation(meetingId: string): Promise<OfflineReconciliation | undefined> {
    if (!this.isIndexedDbSupported()) {
      return this.memoryFallback.offline_reconciliation_data.get(meetingId);
    }
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tr = db.transaction("offline_reconciliation_data", "readonly");
      const store = tr.objectStore("offline_reconciliation_data");
      const req = store.get(meetingId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // ─── RESET / CLEAR ─────────────────────────────────────────────────────────

  async clearAllOfflineData(): Promise<void> {
    this.memoryFallback.offline_transactions.clear();
    this.memoryFallback.sync_queue.clear();
    this.memoryFallback.sync_metadata.clear();
    this.memoryFallback.offline_meetings.clear();
    this.memoryFallback.offline_reconciliation_data.clear();

    if (!this.isIndexedDbSupported()) return;

    const db = await this.getDB();
    const storeNames = ["offline_transactions", "sync_queue", "sync_metadata", "offline_meetings", "offline_reconciliation_data"];
    for (const name of storeNames) {
      await new Promise<void>((resolve, reject) => {
        const tr = db.transaction(name, "readwrite");
        const store = tr.objectStore(name);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
  }
}

export const offlineDb = new OfflineDatabase();
