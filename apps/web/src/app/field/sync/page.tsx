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
  Sparkles,
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
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Field Queue
          </Link>

          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <Wifi className="w-3 h-3 text-emerald-400" /> Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                <WifiOff className="w-3 h-3 text-amber-400" /> Offline Mode
              </span>
            )}
          </div>
        </div>

        {/* Sync Summary Card */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                Storage & Reconciliation
              </span>
              <h1 className="text-lg font-bold text-white font-display">
                Field Queue Manager
              </h1>
              <p className="text-xs text-slate-400">
                Submissions cached on this mobile device for guaranteed zero-data-loss field surveys.
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0a2c5f]/20 border border-[#0a2c5f]/30 flex items-center justify-center text-amber-200 flex-shrink-0">
              <Database className="w-5 h-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 block mb-0.5">Pending Sync</span>
              <span className={`text-2xl font-bold font-mono ${pendingItems.length > 0 ? "text-amber-400" : "text-slate-400"}`}>
                {pendingItems.length}
              </span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 block mb-0.5">Synced / Reconciled</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">
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
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
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
                className="w-full py-2 px-3 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-700/60 rounded-xl text-xs font-medium transition-all"
              >
                Clear Synced Records from Cache
              </button>
            )}
          </div>
        </div>

        {/* Sync Result Banner */}
        {syncResult && (
          <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
            syncResult.failed === 0
              ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
              : "bg-amber-950/30 border-amber-500/40 text-amber-300"
          }`}>
            <Sparkles className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <div>
              <strong className="block font-semibold mb-0.5">
                Batch Reconciliation Result:
              </strong>
              Successfully synchronized {syncResult.synced} records with central authority.
              {syncResult.failed > 0 && ` ${syncResult.failed} failed and remain queued.`}
            </div>
          </div>
        )}

        {/* Queue List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 px-1">
            <span>Queued Submissions ({queue.length})</span>
            <button
              onClick={refreshQueue}
              className="text-emerald-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {queue.length === 0 ? (
            <div className="text-center py-10 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700 p-6 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-white">Queue is Empty</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                No offline records currently stored. Any verifications recorded without internet will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {queue.map((item) => {
                const p = item.payload;
                return (
                  <div
                    key={item.id}
                    className={`bg-slate-800/80 border rounded-xl p-3.5 space-y-2 transition-all ${
                      item.synced ? "border-slate-700 opacity-75" : "border-amber-500/40"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm font-mono">
                            Parcel {p.parcel_id}
                          </span>
                          {item.synced ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                              Synced
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                              Pending
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Status: <span className="font-semibold text-slate-200 capitalize">{p.status}</span>
                          {p.has_issue && (
                            <span className="ml-2 text-red-400 font-semibold font-mono">
                              [⚠️ {p.issue_type}]
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                        title="Delete from local queue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/50 font-mono">
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
