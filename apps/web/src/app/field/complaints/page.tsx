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
            className="inline-flex items-center gap-1.5 text-xs text-[#0B2E59] dark:text-sky-400 hover:underline transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Field Dashboard</span>
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#1E7E34] dark:text-emerald-400 font-bold bg-[#E8F5E9] dark:bg-emerald-950/40 px-2 py-0.5 rounded-[3px] border border-[#C8E6C9] dark:border-emerald-800/40">
            Ground Verification Unit
          </span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-[#14213D] dark:text-white font-display">
            Citizen Grievances & Claims
          </h1>
          <p className="text-xs text-[#5A6A80] dark:text-slate-300">
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
              className={`px-3 py-1.5 rounded-[4px] font-medium transition-all flex-shrink-0 cursor-pointer ${
                filter === item.id
                  ? "bg-[#0B2E59] text-white font-bold shadow-xs"
                  : "bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 text-[#5A6A80] dark:text-slate-400 hover:text-[#14213D] dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#5A6A80] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Parcel ID, Citizen Name, or Grievance..."
            className="w-full pl-9 pr-3 py-2 rounded-[4px] bg-white dark:bg-[#0D121F] border border-[#CBD5E1] dark:border-white/15 text-xs text-[#14213D] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0B2E59] font-mono shadow-xs"
          />
        </div>

        {/* List of Grievances */}
        {loading ? (
          <div className="py-16 text-center text-[#5A6A80] dark:text-slate-400 text-xs space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0B2E59] dark:text-sky-400" />
            <span>Loading grievances...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-8 text-center space-y-2 shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-[#1E7E34] dark:text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-[#14213D] dark:text-white">No grievances available.</h3>
            <p className="text-xs text-[#5A6A80] dark:text-slate-400 max-w-sm mx-auto">
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
                  className="block bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 hover:border-[#0B2E59] rounded-[4px] p-3.5 space-y-2.5 transition-all shadow-xs group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono text-[#0B2E59] dark:text-sky-400 font-bold uppercase">
                          {c.complaint_id || c.id}
                        </span>
                        {c.parcel_id && (
                          <span className="text-[9px] font-mono bg-[#EBF3FC] dark:bg-sky-950/40 text-[#0B2E59] dark:text-sky-300 border border-[#DCE2E8] dark:border-sky-800/40 px-1.5 py-0.2 rounded-[2px] font-bold">
                            PARCEL: #{c.parcel_id}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xs font-bold text-[#14213D] dark:text-white group-hover:text-[#0B2E59] dark:group-hover:text-sky-300 transition-colors">
                        {c.complaint_type}
                      </h2>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[3px] font-bold border uppercase flex-shrink-0 ${
                      isVerified
                        ? "bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-300 border-[#C8E6C9] dark:border-emerald-800/40"
                        : isRejected
                        ? "bg-[#FFEBEE] dark:bg-rose-950/40 text-[#B32424] dark:text-rose-300 border-[#FFCDD2] dark:border-rose-800/40"
                        : "bg-[#FFF8E1] dark:bg-amber-950/40 text-[#B36B00] dark:text-amber-300 border-[#FFE082] dark:border-amber-800/40"
                    }`}>
                      {s}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#5A6A80] dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#5A6A80] dark:text-slate-400 border-t border-[#DCE2E8] dark:border-white/10 pt-2">
                    <span>Citizen: <strong className="text-[#14213D] dark:text-slate-200">{c.owner_name}</strong></span>
                    <span className="flex items-center gap-1 text-[#0B2E59] dark:text-sky-400 font-bold group-hover:translate-x-0.5 transition-transform">
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
