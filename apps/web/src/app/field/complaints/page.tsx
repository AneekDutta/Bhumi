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
  Layers
} from "lucide-react";
import { FieldShell } from "@/components/field/FieldShell";
import { getLandownerComplaints } from "@/lib/api";
import { useRealtimeComplaints } from "@/lib/supabase/useRealtime";

export default function FieldComplaintsListPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "AWAITING" | "ACCEPTED" | "VERIFIED" | "RESOLVED">("ALL");
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
    if (filter === "AWAITING") return s.includes("SUBMITTED") || s.includes("AWAITING");
    if (filter === "ACCEPTED") return s.includes("SITE VISIT") || s.includes("ASSIGNED");
    if (filter === "VERIFIED") return s.includes("VERIFIED") && !s.includes("AWAITING");
    if (filter === "RESOLVED") return s === "RESOLVED" || s === "REJECTED";
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
            Review landowner-reported land disputes, schedule site visits, and record independent ground surveys.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
          {[
            { id: "ALL", label: `All (${complaints.length})` },
            { id: "AWAITING", label: "Awaiting Review" },
            { id: "ACCEPTED", label: "Site Visit Accepted" },
            { id: "VERIFIED", label: "Field Verified" },
            { id: "RESOLVED", label: "Resolved" }
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
            placeholder="Search by ID, Citizen, Parcel, or Issue..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        {/* List of Grievances */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-400" />
            <span>Fetching grievances from Supabase...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Grievances Match Filters</h3>
            <p className="text-xs text-slate-400">All assigned complaints are up to date.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((c) => {
              const s = c.status || "";
              const isUnregistered = !c.parcel_id || c.parcel_id === "null";

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
                        {isUnregistered && (
                          <span className="text-[9px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold">
                            UNREGISTERED CLAIM
                          </span>
                        )}
                        {c.is_demo_simulation && (
                          <span className="text-[9px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-bold">
                            DEMO SIMULATION
                          </span>
                        )}
                      </div>
                      <h2 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {c.complaint_type}
                      </h2>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border uppercase flex-shrink-0 ${
                      s.includes("VERIFIED")
                        ? "bg-teal-500/10 text-teal-300 border-teal-500/30"
                        : s.includes("SITE VISIT")
                        ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                        : s === "RESOLVED"
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    }`}>
                      {s.replace(/_/g, " ")}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-2">
                    <span>Citizen: <strong className="text-slate-200">{c.owner_name}</strong></span>
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                      <span>Review & Survey</span>
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
