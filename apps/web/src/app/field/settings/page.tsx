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
      offlineStore.clearAllParcelsCache();
      setCachedCount(0);
      setQueuedCount(0);
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);
    }
  };

  const handleSignOut = async () => {
    offlineStore.clearActiveOfficer();
    const supabase = await import("@/lib/supabase/client").then(m => m.createClient());
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <FieldShell title="Field Ops Settings" showBack>
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Officer Profile Card */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[4px] bg-[#E6F0FA] dark:bg-sky-950/40 border border-[#B8D5ED] dark:border-sky-800/40 flex items-center justify-center text-[#0B2E59] dark:text-sky-300 font-bold flex-shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-[#14213D] dark:text-white text-sm font-display">
                {officer?.name || "Ramesh Patel"}
              </h2>
              <p className="text-xs text-[#0B2E59] dark:text-sky-400 font-semibold">
                {officer?.designation || "Patwari / Revenue Lekhpal"}
              </p>
              <p className="text-[11px] text-[#5A6A80] dark:text-slate-400">
                ID: {officer?.officer_id || officer?.id || "OFF-001"} · {officer?.assigned_villages?.join(", ") || "Corridor Jurisdiction"}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#DCE2E8] dark:border-white/10 flex items-center justify-between text-xs">
            <span className="text-[#5A6A80] dark:text-slate-400">Jurisdiction Access</span>
            <span className="bg-[#E8F5E9] dark:bg-emerald-950/40 border border-[#C8E6C9] dark:border-emerald-800/40 text-[#1E7E34] dark:text-emerald-300 px-2 py-0.5 rounded-[3px] font-mono font-bold text-[10px]">
              RBAC Authorized
            </span>
          </div>
        </div>

        {/* Offline Storage & PWA Diagnostics */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#14213D] dark:text-white uppercase tracking-wider font-mono text-[10px]">
            <Database className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
            <span>Local Device Storage & PWA Mode</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-[#F8FAFC] dark:bg-[#07080F] p-3 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
              <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] mb-0.5 font-medium">Cached Parcels</span>
              <span className="text-xl font-bold font-mono text-[#14213D] dark:text-white">{cachedCount}</span>
            </div>
            <div className="bg-[#F8FAFC] dark:bg-[#07080F] p-3 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
              <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] mb-0.5 font-medium">Queued Submissions</span>
              <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{queuedCount}</span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleClearCache}
              className="w-full py-2 px-3 rounded-[4px] bg-white dark:bg-[#0D121F] hover:bg-[#FFF5F5] dark:hover:bg-rose-950/30 text-[#5A6A80] dark:text-slate-400 hover:text-[#B32424] dark:hover:text-rose-400 border border-[#DCE2E8] dark:border-white/10 font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Local Cache Queue</span>
            </button>
            {cacheCleared && (
              <span className="text-[#1E7E34] dark:text-emerald-400 text-[11px] block text-center font-medium">
                Local device cache cleared.
              </span>
            )}
          </div>
        </div>

        {/* PWA & Capacitor Readiness Card */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#14213D] dark:text-white uppercase tracking-wider font-mono text-[10px]">
            <Smartphone className="w-4 h-4 text-[#1E7E34] dark:text-emerald-400" />
            <span>Capacitor & PWA Installation</span>
          </div>
          <p className="text-[#5A6A80] dark:text-slate-300 leading-relaxed text-xs">
            This field module is architected with Capacitor & PWA compatibility. You can install it to your home screen or build as an Android APK using Capacitor CLI.
          </p>
          <div className="p-2.5 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 font-mono text-[10px] text-[#0B2E59] dark:text-sky-300">
            npx cap add android &amp;&amp; npx cap sync
          </div>
        </div>

        {/* Switch Officer / Sign Out */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="w-full py-2.5 px-4 bg-[#E6F0FA] dark:bg-sky-950/30 hover:bg-[#D4E6F7] text-[#0B2E59] dark:text-sky-300 rounded-[4px] text-xs font-bold border border-[#B8D5ED] dark:border-sky-800/40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Switch to Desktop Web Officer Portal</span>
          </button>

          <Link
            href="/field/login"
            className="w-full py-2.5 px-4 bg-white dark:bg-[#0D121F] hover:bg-[#F4F6F8] dark:hover:bg-slate-800 text-[#14213D] dark:text-white rounded-[4px] text-xs font-bold border border-[#CBD5E1] dark:border-white/10 transition-all flex items-center justify-center gap-2 text-center shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Switch Field Officer Profile</span>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full py-2.5 px-4 bg-[#FFF5F5] dark:bg-rose-950/30 hover:bg-[#FFE5E5] text-[#B32424] dark:text-rose-300 rounded-[4px] text-xs font-bold border border-[#FFCDD2] dark:border-rose-800/40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Officer Terminal</span>
          </button>
        </div>

      </div>
    </FieldShell>
  );
}
