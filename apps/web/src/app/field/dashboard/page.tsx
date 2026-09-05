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
  Database
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
      const offId: string = (active ? (active.officer_id || active.id) : "OF001") || "OF001";
      const data = await getFieldParcels(offId);
      if (data && data.length > 0) setParcels(data);
      const incData = await getFieldIncidents();
      if (incData) setIncidents(incData);
      const cData = await getLandownerComplaints();
      if (cData) setComplaints(cData);
    } catch {}
  };

  // Real-time synchronization: automatically updates dashboard when changes occur in Supabase
  useRealtimeDashboard(() => {
    refreshData();
  });

  useEffect(() => {
    const active = offlineStore.getActiveOfficer();
    setOfficer(active || { id: "OF001", name: "Ramesh Patel", designation: "Patwari / Revenue Lekhpal" });

    const q = offlineStore.getAll().filter((i) => !i.synced);
    setQueueCount(q.length);

    async function load() {
      try {
        const offId: string = (active ? (active.officer_id || active.id) : "OF001") || "OF001";
        const data = await getFieldParcels(offId);
        if (data && data.length > 0) {
          setParcels(data);
          offlineStore.cacheParcels(offId, data);
        } else {
          const cached = offlineStore.getCachedParcels(offId);
          if (cached) setParcels(cached);
        }
      } catch {
        const offId: string = (active ? (active.officer_id || active.id) : "OF001") || "OF001";
        const cached = offlineStore.getCachedParcels(offId);
        if (cached) setParcels(cached);
      }

      try {
        const incData = await getFieldIncidents();
        setIncidents(incData || []);
        const cData = await getLandownerComplaints();
        setComplaints(cData || []);
      } catch {
        setIncidents([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const pendingCount = parcels.filter((p) => !p.verification_status || p.verification_status === "pending").length;
  const disputedCount = parcels.filter((p) => p.verification_status === "disputed" || p.conflict_flag).length;
  const verifiedCount = parcels.filter((p) => p.verification_status === "verified").length;

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


        {/* Assigned Citizen Grievances Banner */}
        {complaints.filter((c) => c.status !== "RESOLVED" && c.status !== "REJECTED").length > 0 && (
          <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-4 shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Citizen Grievances For Verification
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                {complaints.filter((c) => c.status !== "RESOLVED" && c.status !== "REJECTED").length} Pending
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Affected citizens have submitted land or compensation grievances requiring ground verification.
            </p>

            <div className="space-y-1.5 pt-1">
              {complaints.filter((c) => c.status !== "RESOLVED" && c.status !== "REJECTED").slice(0, 2).map((cmp) => (
                <Link
                  key={cmp.id}
                  href={`/field/parcels/${cmp.parcel_id}`}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <span className="font-bold text-white block text-[11px]">{cmp.complaint_type}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Parcel: {cmp.parcel_id} · Citizen: {cmp.owner_name}
                    </span>
                  </div>
                  <span className="text-amber-400 text-[11px] font-semibold flex items-center gap-1">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-2xl shadow-sm space-y-1">
            <span className="text-slate-400 block text-[11px]">Assigned Parcels</span>
            <span className="text-2xl font-bold font-mono text-white">{parcels.length}</span>
            <span className="text-[10px] text-slate-400 block">In Active Corridor</span>
          </div>

          <div className="bg-slate-800/90 border border-amber-500/30 p-3.5 rounded-2xl shadow-sm space-y-1">
            <span className="text-amber-400 block text-[11px]">Pending Surveys</span>
            <span className="text-2xl font-bold font-mono text-amber-400">{pendingCount}</span>
            <span className="text-[10px] text-slate-400 block">Awaiting Field Verification</span>
          </div>

          <div className="bg-slate-800/90 border border-red-500/30 p-3.5 rounded-2xl shadow-sm space-y-1">
            <span className="text-red-400 block text-[11px]">Flagged Disputes</span>
            <span className="text-2xl font-bold font-mono text-red-400">{disputedCount || incidents.length}</span>
            <span className="text-[10px] text-slate-400 block">Blocking CPM Path</span>
          </div>

          <div className="bg-slate-800/90 border border-emerald-500/30 p-3.5 rounded-2xl shadow-sm space-y-1">
            <span className="text-emerald-400 block text-[11px]">Verified Clear</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">{verifiedCount}</span>
            <span className="text-[10px] text-slate-400 block">Reconciled with Records</span>
          </div>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
            <span>Field Workflows</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/field/parcels"
              className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950/40 flex flex-col justify-between h-24 transition-all"
            >
              <div className="flex items-center justify-between">
                <ClipboardList className="w-5 h-5" />
                <ArrowRight className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-sm">Assigned Queue</span>
                <span className="text-[10px] text-emerald-100 opacity-90">GPS-sorted parcel list</span>
              </div>
            </Link>

            <Link
              href="/field/sync"
              className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-xs shadow-md flex flex-col justify-between h-24 transition-all"
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

        {/* Urgent Field Incidents / Bottlenecks */}
        {incidents.length > 0 && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-red-400 px-1">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Active Ground Incidents ({incidents.length})
              </span>
            </div>

            <div className="space-y-2">
              {incidents.map((inc) => (
                <Link
                  key={inc.verification_id}
                  href={`/field/parcels/${inc.parcel_id}`}
                  className="block p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 hover:border-red-500/60 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs font-display flex items-center gap-1.5">
                      <span className="font-mono text-red-400">{inc.verification_id}:</span>
                      <span>{(inc.issue_type || "Incident").replace(/_/g, " ")}</span>
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 uppercase font-bold">
                      {inc.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    {inc.observations || inc.remarks}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Survey {inc.survey_number || inc.parcel_id} · {inc.village_name}</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      Inspect & Confirm <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Priority Parcels Nearby */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
            <span>Priority Assigned Parcels</span>
            <Link href="/field/parcels" className="text-emerald-400 hover:underline text-[11px] font-mono">
              View All ({parcels.length})
            </Link>
          </div>

          <div className="space-y-2">
            {parcels.slice(0, 3).map((p) => (
              <Link
                key={p.parcel_id}
                href={`/field/parcels/${p.parcel_id}`}
                className="block p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/40 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs font-display">
                    Survey No. {p.survey_no || p.survey_number}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    p.verification_status === "verified"
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                      : p.conflict_flag || p.verification_status === "disputed"
                      ? "bg-red-500/15 border-red-500/30 text-red-300"
                      : "bg-amber-500/15 border-amber-500/30 text-amber-300"
                  }`}>
                    {p.verification_status || "Pending"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{p.village_name || "Ramganj Mandi"} · {p.owner_name || "Landholder"}</span>
                  <span className="text-indigo-400 font-mono">{p.area_acres || 1.2} Acres</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </FieldShell>
  );
}