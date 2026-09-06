"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Layers,
  Database,
  Wifi,
  WifiOff
} from "lucide-react";
import { FieldShell } from "@/components/field/FieldShell";
import { offlineStore, QueuedVerification } from "@/lib/offlineStore";
import { syncFieldBatch, submitFieldVerification } from "@/lib/api";

export default function FieldSyncPage() {
  const [queue, setQueue] = useState<QueuedVerification[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; synced: number; failed: number } | null>(null);

  const refreshQueue = () => {
    setQueue(offlineStore.getAll());
  };

  useEffect(() => {
    setIsOnline(navigator.onLine);
    refreshQueue();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSyncAll = async () => {
    const pending = queue.filter((item) => !item.synced);
    if (pending.length === 0) return;

    setSyncing(true);
    setSyncResult(null);

    let syncedCount = 0;
    let failedCount = 0;

    const officerStored = localStorage.getItem("bhumi_field_officer");
    const officerId = officerStored ? JSON.parse(officerStored).id : "OFF-001";

    try {
      // Try batch sync first
      const submissions = pending.map((p) => p.payload);
      const res = await syncFieldBatch(officerId, submissions);
      if (res && res.success) {
        syncedCount = res.synced_count;
        pending.forEach((p) => offlineStore.markSynced(p.id));
      } else {
        // Fallback to one-by-one submission
        for (const item of pending) {
          try {
            await submitFieldVerification(item.payload);
            offlineStore.markSynced(item.id);
            syncedCount++;
          } catch {
            failedCount++;
          }
        }
      }
    } catch {
      // Fallback one-by-one
      for (const item of pending) {
        try {
          await submitFieldVerification(item.payload);
          offlineStore.markSynced(item.id);
          syncedCount++;
        } catch {
          failedCount++;
        }
      }
    }

    setSyncResult({
      success: syncedCount > 0,
      synced: syncedCount,
      failed: failedCount
    });
    setSyncing(false);
    refreshQueue();
  };

  const handleClearSynced = () => {
    offlineStore.clearSynced();
    refreshQueue();
  };

  const handleDeleteItem = (id: string) => {
    offlineStore.remove(id);
    refreshQueue();
  };

  const pendingItems = queue.filter((i) => !i.synced);
  const syncedItems = queue.filter((i) => i.synced);

  return (
    <FieldShell title="Offline Sync Center">
      <div className="max-w-lg mx-auto p-4 space-y-4 pb-24">
        
        {/* Navigation & Status Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/field"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A6A80] dark:text-slate-400 hover:text-[#0B2E59] dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Field Queue
          </Link>

          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-[3px] bg-[#E8F5E9] dark:bg-emerald-950/40 border border-[#C8E6C9] dark:border-emerald-800/40 text-[#1E7E34] dark:text-emerald-300 font-bold">
                <Wifi className="w-3 h-3 text-[#1E7E34] dark:text-emerald-400" /> Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-[3px] bg-[#FFF8E1] dark:bg-amber-950/40 border border-[#FFE082] dark:border-amber-800/40 text-[#B36B00] dark:text-amber-300 font-bold">
                <WifiOff className="w-3 h-3 text-[#B36B00] dark:text-amber-400" /> Offline Mode
              </span>
            )}
          </div>
        </div>

        {/* Sync Summary Card */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B2E59] dark:text-sky-400 font-mono">
                Storage & Reconciliation
              </span>
              <h1 className="text-base font-bold text-[#14213D] dark:text-white font-display">
                Field Queue Manager
              </h1>
              <p className="text-xs text-[#5A6A80] dark:text-slate-400 mt-0.5">
                Submissions cached on this mobile device for guaranteed zero-data-loss field surveys.
              </p>
            </div>
            <div className="w-9 h-9 rounded-[4px] bg-[#E6F0FA] dark:bg-sky-950/40 border border-[#B8D5ED] dark:border-sky-800/40 flex items-center justify-center text-[#0B2E59] dark:text-sky-300 flex-shrink-0">
              <Database className="w-4 h-4" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-[#F8FAFC] dark:bg-[#07080F] p-3 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
              <span className="text-[11px] font-semibold text-[#5A6A80] dark:text-slate-400 block mb-0.5">Pending Sync</span>
              <span className={`text-2xl font-bold font-mono ${pendingItems.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-[#5A6A80] dark:text-slate-400"}`}>
                {pendingItems.length}
              </span>
            </div>
            <div className="bg-[#F8FAFC] dark:bg-[#07080F] p-3 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
              <span className="text-[11px] font-semibold text-[#5A6A80] dark:text-slate-400 block mb-0.5">Synced / Reconciled</span>
              <span className="text-2xl font-bold font-mono text-[#1E7E34] dark:text-emerald-400">
                {syncedItems.length}
              </span>
            </div>
          </div>

          {/* Sync Trigger Button */}
          <div className="pt-1 space-y-2">
            <button
              type="button"
              disabled={syncing || pendingItems.length === 0 || !isOnline}
              onClick={handleSyncAll}
              className="w-full py-2.5 px-4 bg-[#0B2E59] hover:bg-[#082242] disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-[4px] text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              <span>
                {syncing
                  ? "Synchronizing with National DB..."
                  : !isOnline
                  ? "Connect Online to Sync"
                  : pendingItems.length === 0
                  ? "All Records Up-to-Date"
                  : `Sync ${pendingItems.length} Pending Records Now`}
              </span>
            </button>

            {syncedItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearSynced}
                className="w-full py-2 px-3 bg-white dark:bg-[#0D121F] hover:bg-[#F4F6F8] dark:hover:bg-slate-800 text-[#5A6A80] dark:text-slate-400 hover:text-[#14213D] dark:hover:text-slate-200 border border-[#DCE2E8] dark:border-white/10 rounded-[4px] text-xs font-semibold transition-all cursor-pointer"
              >
                Clear Synced Records from Cache
              </button>
            )}
          </div>
        </div>

        {/* Sync Result Banner */}
        {syncResult && (
          <div className={`p-3 rounded-none border text-xs flex items-start gap-2.5 ${
            syncResult.failed === 0
              ? "bg-[#E8F5E9] dark:bg-emerald-950/30 border-[#C8E6C9] dark:border-emerald-500/40 text-[#1E7E34] dark:text-emerald-300"
              : "bg-[#FFF8E1] dark:bg-amber-950/30 border-[#FFE082] dark:border-amber-500/40 text-[#B36B00] dark:text-amber-300"
          }`}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#1E7E34] dark:text-emerald-400 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5">
                Batch Reconciliation Result:
              </strong>
              Successfully synchronized {syncResult.synced} records with central authority.
              {syncResult.failed > 0 && ` ${syncResult.failed} failed and remain queued.`}
            </div>
          </div>
        )}

        {/* Queue List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#14213D] dark:text-slate-300 px-1">
            <span>Queued Submissions ({queue.length})</span>
            <button
              onClick={refreshQueue}
              className="text-[#0B2E59] dark:text-sky-400 hover:underline flex items-center gap-1 font-mono text-[11px] font-semibold"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {queue.length === 0 ? (
            <div className="text-center py-8 bg-[#F8FAFC] dark:bg-[#07080F] rounded-[4px] border border-dashed border-[#CBD5E1] dark:border-white/10 p-6 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#1E7E34] dark:text-emerald-400 mx-auto" />
              <p className="text-xs font-bold text-[#14213D] dark:text-white">Queue is Empty</p>
              <p className="text-[11px] text-[#5A6A80] dark:text-slate-400 max-w-xs mx-auto">
                No offline records currently stored. Any verifications recorded without internet will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((item) => {
                const p = item.payload;
                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-[#0D121F] border rounded-[4px] p-3 space-y-2 transition-all shadow-xs ${
                      item.synced 
                        ? "border-[#DCE2E8] dark:border-white/10 opacity-80" 
                        : "border-amber-400 dark:border-amber-500/40"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#14213D] dark:text-white text-xs font-mono">
                            Parcel #{p.parcel_id}
                          </span>
                          {item.synced ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[3px] bg-[#E8F5E9] dark:bg-emerald-950/40 border border-[#C8E6C9] dark:border-emerald-800/40 text-[#1E7E34] dark:text-emerald-300 font-bold">
                              Synced
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[3px] bg-[#FFF8E1] dark:bg-amber-950/40 border border-[#FFE082] dark:border-amber-800/40 text-[#B36B00] dark:text-amber-300 font-bold">
                              Pending
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-1">
                          Status: <span className="font-bold text-[#14213D] dark:text-slate-200 capitalize">{p.status}</span>
                          {p.has_issue && (
                            <span className="ml-2 text-[#B32424] dark:text-rose-400 font-bold font-mono text-[10px]">
                              [⚠️ {p.issue_type}]
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-[3px] text-[#5A6A80] dark:text-slate-400 hover:text-[#B32424] dark:hover:text-rose-400 hover:bg-[#F4F6F8] dark:hover:bg-slate-800 transition-colors"
                        title="Delete from local queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#5A6A80] dark:text-slate-400 pt-1.5 border-t border-[#DCE2E8] dark:border-white/10 font-mono">
                      <span>GPS: {p.gps_lat?.toFixed(4)}°, {p.gps_lng?.toFixed(4)}° (±{p.gps_accuracy || 10}m)</span>
                      <span>Photos: {p.photos?.length || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </FieldShell>
  );
}
