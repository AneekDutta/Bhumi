"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Compass,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Navigation,
  Sparkles,
  Settings,
  Layers,
  Database,
  FileText
} from "lucide-react";
import { FieldShell } from "@/components/field/FieldShell";
import { getFieldParcels, getFieldIncidents, getLandownerComplaints } from "@/lib/api";
import { offlineStore } from "@/lib/offlineStore";
import { useRealtimeDashboard } from "@/lib/supabase/useRealtime";

export default function FieldDashboardPage() {
  const router = useRouter();
  const [officer, setOfficer] = useState<any>(null);
  const [parcels, setParcels] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [queueCount, setQueueCount] = useState(0);

  const refreshData = async () => {
    try {
      const active = offlineStore.getActiveOfficer();
      const offId: string = (active ? (active.officer_id || active.id) : "OFF-001") || "OFF-001";
      const data = await getFieldParcels(offId);
      setParcels(data || []);
      const incData = await getFieldIncidents();
      setIncidents(incData || []);
      const cData = await getLandownerComplaints();
      setComplaints(cData || []);
    } catch {}
  };

  // Real-time synchronization: automatically updates dashboard when changes occur in Supabase
  useRealtimeDashboard(() => {
    refreshData();
  });

  useEffect(() => {
    const active = offlineStore.getActiveOfficer();
    setOfficer(active || { id: "OFF-001", name: "Ramesh Patel", designation: "Patwari / Revenue Lekhpal" });

    const q = offlineStore.getAll().filter((i) => !i.synced);
    setQueueCount(q.length);

    async function load() {
      try {
        const offId: string = (active ? (active.officer_id || active.id) : "OFF-001") || "OFF-001";
        const data = await getFieldParcels(offId);
        setParcels(data || []);
        if (data && data.length > 0) {
          offlineStore.cacheParcels(offId, data);
        } else {
          offlineStore.clearParcelCache(offId);
        }
      } catch {
        setParcels([]);
      }

      try {
        const incData = await getFieldIncidents();
        setIncidents(incData || []);
        const cData = await getLandownerComplaints();
        setComplaints(cData || []);
      } catch {
        setIncidents([]);
        setComplaints([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // ZERO FAKE DATA: Strictly calculated from actual database records
  const pendingComplaints = complaints.filter(
    (c) => c.status === "Pending Field Verification" || (c.status && (c.status.includes("SUBMITTED") || c.status.includes("AWAITING")))
  );
  const verifiedComplaints = complaints.filter(
    (c) => c.status === "Verified by Field Officer" || (c.status && (c.status.includes("VERIFIED") || c.status.includes("Implementation")))
  );
  const rejectedComplaints = complaints.filter(
    (c) => c.status === "Rejected by Field Officer" || c.status === "REJECTED"
  );

  return (
    <FieldShell title="Field Ops Dashboard">
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Officer Welcome Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                Operational Unit
              </span>
              <h1 className="text-lg font-bold text-white font-display">
                {officer?.name || "Officer Terminal"}
              </h1>
              <p className="text-xs text-slate-300">
                {officer?.designation || "Field Surveyor"} · {officer?.assigned_villages?.join(", ") || "Ramganj Mandi / Kanhera"}
              </p>
            </div>

            <Link
              href="/field/settings"
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Field Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>

          {/* Offline Sync Banner if items are queued */}
          {queueCount > 0 && (
            <Link
              href="/field/sync"
              className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs transition-colors hover:bg-amber-500/20"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="font-medium">{queueCount} Submissions Waiting to Sync</span>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase underline">Review Queue</span>
            </Link>
          )}
        </div>

        {/* Real Complaint Verification Queue / Empty State */}
        {pendingComplaints.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-2 shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h2 className="text-sm font-bold text-white">No grievances available.</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Landowner grievances filed against registered parcels will appear here in real time for on-site boundary verification.
            </p>
          </div>
        ) : (
          <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-4 shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <Link
                href="/field/complaints"
                className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold hover:underline"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Pending Field Verification
              </Link>
              <Link
                href="/field/complaints"
                className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold hover:bg-amber-500/30 transition-colors"
              >
                {pendingComplaints.length} Pending &rarr;
              </Link>
            </div>

            <p className="text-xs text-slate-300">
              Landowner complaints requiring on-ground GPS boundary demarcation and verification:
            </p>

            <div className="space-y-1.5 pt-1">
              {pendingComplaints.slice(0, 3).map((cmp) => (
                <Link
                  key={cmp.id || cmp.complaint_id}
                  href={`/field/complaints/${cmp.id || cmp.complaint_id}`}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <span className="font-bold text-white block text-[11px]">{cmp.complaint_type}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {cmp.parcel_id ? `Parcel: #${cmp.parcel_id}` : "Unregistered Land Claim"} · Citizen: {cmp.owner_name}
                    </span>
                  </div>
                  <span className="text-amber-400 text-[11px] font-semibold flex items-center gap-1">
                    <span>Verify Boundary</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Operational KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-slate-800/90 border border-amber-500/30 p-3.5 rounded-2xl shadow-sm space-y-1">
            <span className="text-amber-400 block text-[11px] font-semibold">PENDING CASES</span>
            <span className="text-2xl font-bold font-mono text-amber-400">{pendingComplaints.length}</span>
            <span className="text-[10px] text-slate-400 block">Awaiting Ground Review</span>
          </div>

          <div className="bg-slate-800/90 border border-emerald-500/30 p-3.5 rounded-2xl shadow-sm space-y-1">
            <span className="text-emerald-400 block text-[11px] font-semibold">VERIFIED CASES</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">{verifiedComplaints.length}</span>
            <span className="text-[10px] text-slate-400 block">Approved by Officer</span>
          </div>

          <div className="bg-slate-800/90 border border-red-500/30 p-3.5 rounded-2xl shadow-sm space-y-1">
            <span className="text-red-400 block text-[11px] font-semibold">DECLINED CASES</span>
            <span className="text-2xl font-bold font-mono text-red-400">{rejectedComplaints.length}</span>
            <span className="text-[10px] text-slate-400 block">Rejected by Officer</span>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-2xl shadow-sm space-y-1">
            <span className="text-slate-300 block text-[11px] font-semibold">TOTAL CASES</span>
            <span className="text-2xl font-bold font-mono text-white">{complaints.length}</span>
            <span className="text-[10px] text-slate-400 block">Assigned to Officer</span>
          </div>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
            <span>Field Workflows</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Link
              href="/field/parcels"
              className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950/40 flex flex-col justify-between h-24 transition-all"
            >
              <div className="flex items-center justify-between">
                <ClipboardList className="w-5 h-5" />
                <ArrowRight className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-sm">Parcels</span>
                <span className="text-[10px] text-emerald-100 opacity-90">{parcels.length} registered</span>
              </div>
            </Link>

            <Link
              href="/field/complaints"
              className="p-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-lg shadow-amber-950/40 flex flex-col justify-between h-24 transition-all"
            >
              <div className="flex items-center justify-between">
                <FileText className="w-5 h-5" />
                <ArrowRight className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-sm">Grievances</span>
                <span className="text-[10px] text-amber-100 opacity-90">{pendingComplaints.length} pending survey</span>
              </div>
            </Link>

            <Link
              href="/field/sync"
              className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-xs shadow-md flex flex-col justify-between h-24 transition-all"
            >
              <div className="flex items-center justify-between">
                <Database className="w-5 h-5 text-indigo-400" />
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <span className="block font-bold text-sm text-white">Offline Sync</span>
                <span className="text-[10px] text-slate-400">{queueCount} records queued</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Registered Parcels Summary */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
            <span>Operational Sector Parcels</span>
            <Link href="/field/parcels" className="text-emerald-400 hover:underline text-[11px] font-mono">
              View All ({parcels.length})
            </Link>
          </div>

          {parcels.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-1 shadow-sm">
              <span className="text-xs font-bold text-slate-300 block">No registered parcels in operational sector.</span>
              <p className="text-[11px] text-slate-400">
                Parcels demarcated by landowners will appear here once registered.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {parcels.slice(0, 3).map((p) => (
                <div
                  key={p.parcel_id}
                  className="block p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs font-mono">
                      Parcel #{p.parcel_id}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-emerald-500/15 border-emerald-500/30 text-emerald-300">
                      {p.status || "Registered"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{p.village_name || "Corridor Sector"} · {p.owner_name || "Landowner"}</span>
                    <span className="text-indigo-400 font-mono">{p.area_acres || 0} Acres</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </FieldShell>
  );
}
