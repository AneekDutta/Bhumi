"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  ChevronRight, 
  RefreshCw, 
  Search, 
  Filter, 
  ArrowLeft,
  Compass,
  Clock,
  ShieldCheck,
  Layers,
  XCircle
} from "lucide-react";
import { FieldShell } from "@/components/field/FieldShell";
import { getLandownerComplaints } from "@/lib/api";
import { useRealtimeComplaints } from "@/lib/supabase/useRealtime";

export default function FieldComplaintsListPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "VERIFIED" | "REJECTED">("ALL");
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getLandownerComplaints();
      setComplaints(data || []);
    } catch (err) {
      console.error("Error loading complaints for field officer:", err);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useRealtimeComplaints(undefined, () => {
    loadData();
  });

  const filtered = complaints.filter((c) => {
    const s = c.status || "";
    if (filter === "PENDING") {
      return s === "Pending Field Verification" || s.includes("SUBMITTED") || s.includes("AWAITING");
    }
    if (filter === "VERIFIED") {
      return s === "FIELD VERIFIED" || s === "Verified by Field Officer" || s.includes("Implementation") || s === "RESOLVED";
    }
    if (filter === "REJECTED") {
      return s === "FIELD DECLINED" || s === "Rejected by Field Officer" || s === "REJECTED";
    }
    return true;
  }).filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.complaint_id || "").toLowerCase().includes(q) ||
      (c.complaint_type || "").toLowerCase().includes(q) ||
      (c.owner_name || "").toLowerCase().includes(q) ||
      (c.parcel_id || "").toLowerCase().includes(q)
    );
  });

  const pendingCount = complaints.filter(
    (c) => c.status === "Pending Field Verification" || (c.status && (c.status.includes("SUBMITTED") || c.status.includes("AWAITING")))
  ).length;

  return (
    <FieldShell title="Citizen Grievances & Claims">
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/field/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Field Dashboard</span>
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
            Ground Verification Unit
          </span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-white font-display">
            Citizen Grievances & Claims
          </h1>
          <p className="text-xs text-slate-300">
            Conduct on-ground inspection of landowner grievances filed against registered parcels.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
          {[
            { id: "ALL", label: `All (${complaints.length})` },
            { id: "PENDING", label: `Pending Verification (${pendingCount})` },
            { id: "VERIFIED", label: "Verified by Officer" },
            { id: "REJECTED", label: "Rejected" }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id as any)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all flex-shrink-0 cursor-pointer ${
                filter === item.id
                  ? "bg-emerald-600 text-white font-bold shadow-sm"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Parcel ID, Citizen Name, or Grievance..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        {/* List of Grievances */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-400" />
            <span>Loading grievances...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2 shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">No complaints pending verification.</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {complaints.length === 0
                ? "New landowner grievances filed against registered parcels will appear here in real time."
                : "No grievances match the selected filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((c) => {
              const s = c.status || "Pending Field Verification";
              const isPending = s === "Pending Field Verification" || s.includes("SUBMITTED") || s.includes("AWAITING");
              const isVerified = s === "FIELD VERIFIED" || s === "Verified by Field Officer" || s.includes("Implementation") || s === "RESOLVED";
              const isRejected = s === "FIELD DECLINED" || s === "Rejected by Field Officer" || s === "REJECTED";

              return (
                <Link
                  key={c.id || c.complaint_id}
                  href={`/field/complaints/${c.id || c.complaint_id}`}
                  className="block bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-3.5 space-y-2.5 transition-all shadow-md group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                          {c.complaint_id || c.id}
                        </span>
                        {c.parcel_id && (
                          <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-bold">
                            PARCEL: #{c.parcel_id}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {c.complaint_type}
                      </h2>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border uppercase flex-shrink-0 ${
                      isVerified
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                        : isRejected
                        ? "bg-red-500/15 text-red-300 border-red-500/40"
                        : "bg-amber-500/15 text-amber-300 border-amber-500/40"
                    }`}>
                      {s}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-2">
                    <span>Citizen: <strong className="text-slate-200">{c.owner_name}</strong></span>
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                      <span>{isPending ? "Verify Complaint" : "Review Details"}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </FieldShell>
  );
}
