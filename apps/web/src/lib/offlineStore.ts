"use client";

export interface FieldPhotoAttachment {
  id?: string;
  url?: string;
  caption?: string;
  category?: string;
  timestamp?: string;
  gps_lat?: number;
  gps_lng?: number;
}

export interface FieldVerificationPayload {
  parcel_id: string;
  officer_id: string;
  officer_name?: string;
  verification_type?: string;
  status: "verified" | "rejected" | "disputed" | "pending";
  gps_lat?: number;
  gps_lng?: number;
  gps_accuracy?: number;
  measured_area_sqm?: number;
  boundary_confirmed?: boolean;
  possession_status?: string;
  owner_present?: boolean;
  owner_verified_name?: string;
  has_issue?: boolean;
  issue_type?: string;
  issue_severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL_STOPPAGE";
  observations?: string;
  remarks?: string;
  photos?: FieldPhotoAttachment[];
  documents?: any[];
}

export interface QueuedVerification {
  id: string;
  timestamp: number;
  payload: FieldVerificationPayload;
  synced: boolean;
}

export interface OfflineVerificationQueueItem extends QueuedVerification {}

const STORAGE_KEY_QUEUE = "bhumi_offline_field_queue";
const STORAGE_KEY_ACTIVE_OFFICER = "bhumi_field_officer";
const STORAGE_KEY_PARCEL_CACHE = "bhumi_field_parcel_cache";

export const offlineStore = {
  // Queue methods
  getAll(): QueuedVerification[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  getQueue(): QueuedVerification[] {
    return this.getAll();
  },

  add(item: QueuedVerification): void {
    if (typeof window === "undefined") return;
    const current = this.getAll();
    current.unshift(item);
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent("bhumi-queue-change", { detail: { count: current.length } }));
  },

  enqueue(item: Omit<QueuedVerification, "id" | "timestamp" | "synced"> & { id?: string }): QueuedVerification {
    const entry: QueuedVerification = {
      id: item.id || `queue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      payload: item.payload,
      synced: false
    };
    this.add(entry);
    return entry;
  },

  markSynced(id: string): void {
    if (typeof window === "undefined") return;
    const current = this.getAll().map((item) =>
      item.id === id ? { ...item, synced: true } : item
    );
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(current));
  },

  remove(id: string): void {
    if (typeof window === "undefined") return;
    const current = this.getAll().filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent("bhumi-queue-change", { detail: { count: current.length } }));
  },

  dequeue(id: string): void {
    this.remove(id);
  },

  clearSynced(): void {
    if (typeof window === "undefined") return;
    const remaining = this.getAll().filter((item) => !item.synced);
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(remaining));
    window.dispatchEvent(new CustomEvent("bhumi-queue-change", { detail: { count: remaining.length } }));
  },

  clearQueue(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY_QUEUE);
    window.dispatchEvent(new CustomEvent("bhumi-queue-change", { detail: { count: 0 } }));
  },

  // Officer Session methods
  getActiveOfficer(): { officer_id: string; id?: string; name: string; designation?: string; assigned_villages?: string[] } | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_OFFICER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setActiveOfficer(officer: { officer_id?: string; id?: string; name: string; designation?: string; assigned_villages?: string[] }): void {
    if (typeof window === "undefined") return;
    const formatted = {
      ...officer,
      id: officer.id || officer.officer_id,
      officer_id: officer.officer_id || officer.id
    };
    localStorage.setItem(STORAGE_KEY_ACTIVE_OFFICER, JSON.stringify(formatted));
  },

  clearActiveOfficer(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY_ACTIVE_OFFICER);
  },

  // Local parcel caching
  cacheParcels(officerId: string, parcels: any[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`${STORAGE_KEY_PARCEL_CACHE}_${officerId}`, JSON.stringify({
        cached_at: new Date().toISOString(),
        parcels
      }));
    } catch (e) {
      console.warn("LocalStorage full or unavailable for caching parcels", e);
    }
  },

  getCachedParcels(officerId: string): any[] | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PARCEL_CACHE}_${officerId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.parcels || null;
    } catch {
      return null;
    }
  }
};
