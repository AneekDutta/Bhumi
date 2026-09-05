"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings,
  User,
  ShieldCheck,
  Database,
  Smartphone,
  LogOut,
  Trash2,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { FieldShell } from "@/components/field/FieldShell";
import { offlineStore } from "@/lib/offlineStore";

export default function FieldSettingsPage() {
  const router = useRouter();
  const [officer, setOfficer] = useState<any>(null);
  const [cachedCount, setCachedCount] = useState(0);
  const [queuedCount, setQueuedCount] = useState(0);
  const [cacheCleared, setCacheCleared] = useState(false);

  useEffect(() => {
    const active = offlineStore.getActiveOfficer();
    setOfficer(active || { id: "OFF-001", name: "Ramesh Patel", designation: "Patwari" });

    const offId: string = (active ? (active.officer_id || active.id) : "OFF-001") || "OFF-001";
    const cached = offlineStore.getCachedParcels(offId);
    setCachedCount(cached ? cached.length : 0);

    const queued = offlineStore.getAll();
    setQueuedCount(queued.length);
  }, []);

  const handleClearCache = () => {
    if (officer) {
      offlineStore.clearQueue();
      setQueuedCount(0);
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);
    }
  };

  const handleSignOut = () => {
    offlineStore.clearActiveOfficer();
    document.cookie = "bhumi_officer_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/field/login");
  };

  return (
    <FieldShell title="Field Ops Settings" showBack>
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Officer Profile Card */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base flex-shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base font-display">
                {officer?.name || "Ramesh Patel"}
              </h2>
              <p className="text-xs text-emerald-400 font-medium">
                {officer?.designation || "Patwari / Revenue Lekhpal"}
              </p>
              <p className="text-[11px] text-slate-400">
                ID: {officer?.officer_id || officer?.id || "OFF-001"} · {officer?.assigned_villages?.join(", ") || "Rampur Unit"}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">Jurisdiction Access</span>
            <span className="text-emerald-400 font-mono font-semibold">RBAC Authorized</span>
          </div>
        </div>

        {/* Offline Storage & PWA Diagnostics */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider font-mono text-[11px]">
            <Database className="w-4 h-4 text-indigo-400" />
            <span>Local Device Storage & PWA Mode</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block text-[10px] mb-0.5">Cached Parcels</span>
              <span className="text-xl font-bold font-mono text-white">{cachedCount}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block text-[10px] mb-0.5">Queued Submissions</span>
              <span className="text-xl font-bold font-mono text-amber-400">{queuedCount}</span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleClearCache}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900/70 hover:bg-slate-900 text-slate-400 hover:text-red-400 border border-slate-700/60 font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Local Cache Queue</span>
            </button>
            {cacheCleared && (
              <span className="text-emerald-400 text-[11px] block text-center">
                Local device cache cleared.
              </span>
            )}
          </div>
        </div>

        {/* PWA & Capacitor Readiness Card */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-2.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider font-mono text-[11px]">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Capacitor & PWA Installation</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            This field module is architected with Capacitor & PWA compatibility. You can install it to your home screen or build as an Android APK using Capacitor CLI.
          </p>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 font-mono text-[10px] text-slate-400">
            npx cap add android &amp;&amp; npx cap sync
          </div>
        </div>

        {/* Switch Officer / Sign Out */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={() => {
              document.cookie = "bhumi_officer_session=officer%40bhumi.gov.in; path=/; max-age=86400; SameSite=Lax";
              window.location.href = "/";
            }}
            className="w-full py-3 px-4 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-xl text-xs font-semibold border border-indigo-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Switch to Desktop Web Officer Portal</span>
          </button>

          <Link
            href="/field/login"
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center gap-2 text-center"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Switch Field Officer Profile</span>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full py-3 px-4 bg-red-950/40 hover:bg-red-950/60 text-red-300 rounded-xl text-xs font-semibold border border-red-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Officer Terminal</span>
          </button>
        </div>

      </div>
    </FieldShell>
  );
}
