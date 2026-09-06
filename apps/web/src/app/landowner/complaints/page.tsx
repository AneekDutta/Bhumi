"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  ChevronRight,
  Filter,
  RefreshCw,
  Search
} from "lucide-react";
import { LandownerShell } from "@/components/landowner/LandownerShell";
import { getLandownerComplaints } from "@/lib/api";
import { useRealtimeComplaints } from "@/lib/supabase/useRealtime";

export default function LandownerComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "VERIFIED" | "RESOLVED">("ALL");
  const [search, setSearch] = useState("");
  const [owner, setOwner] = useState<any>(null);

  useEffect(() => {
    
    async function load() {
      setLoading(true);
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const offId = user.id;
        const data = await getLandownerComplaints({ owner_id: offId });
        setComplaints(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Supabase Realtime: updates live when officer verifies or admin resolves
  useRealtimeComplaints(owner?.owner_id || "", async () => {
    if (!owner?.owner_id) return;
    try {
      const data = await getLandownerComplaints({ owner_id: owner.owner_id });
      setComplaints(data || []);
    } catch {}
  });

  const filtered = complaints.filter((c) => {
    if (filter === "ACTIVE") return c.status === "SUBMITTED" || c.status === "UNDER_REVIEW" || c.status === "ASSIGNED_FOR_VERIFICATION";
    if (filter === "VERIFIED") return c.status === "VERIFIED" || c.status === "FIELD_VERIFICATION_IN_PROGRESS";
    if (filter === "RESOLVED") return c.status === "RESOLVED" || c.status === "REJECTED";
    return true;
  }).filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.complaint_id?.toLowerCase().includes(q) ||
      c.complaint_type?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.parcel_id?.toLowerCase().includes(q)
    );
  });

  return (
    <LandownerShell title="My Grievances" showBack>
      <div className="space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-[#14213D] dark:text-white font-display">
              Grievance Records
            </h1>
            <p className="text-xs text-[#5A6A80] dark:text-slate-400">
              Live status tracking with statutory CALA records
            </p>
          </div>

          <Link
            href="/landowner/complaints/new"
            className="px-3 py-1.5 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Lodge Issue</span>
          </Link>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
          {[
            { id: "ALL", label: `All (${complaints.length})` },
            { id: "ACTIVE", label: "Active" },
            { id: "VERIFIED", label: "Field Verified" },
            { id: "RESOLVED", label: "Resolved" }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id as any)}
              className={`px-3 py-1.5 rounded-[4px] font-semibold text-xs transition-all flex-shrink-0 cursor-pointer ${
                filter === item.id
                  ? "bg-[#0B2E59] text-white shadow-xs"
                  : "bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 text-[#5A6A80] dark:text-slate-400 hover:text-[#14213D] dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#5A6A80] dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Complaint ID, Parcel, or Issue..."
            className="w-full pl-9 pr-3 py-2 rounded-[4px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 text-xs text-[#14213D] dark:text-white placeholder-[#5A6A80] dark:placeholder-slate-500 focus:outline-none focus:border-[#0B2E59]"
          />
        </div>

        {/* Complaint Cards */}
        {loading ? (
          <div className="py-12 text-center text-[#5A6A80] dark:text-slate-400 text-xs space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0B2E59] dark:text-sky-400" />
            <span>Connecting to Land Records Registry...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-8 text-center space-y-2">
            <FileText className="w-8 h-8 text-[#5A6A80] dark:text-slate-600 mx-auto" />
            <p className="text-xs text-[#14213D] dark:text-slate-300 font-bold">No grievances matching criteria</p>
            <p className="text-[11px] text-[#5A6A80] dark:text-slate-500">
              Submit a new grievance to initiate CALA administrative and field verification.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((cmp) => {
              const isResolved = cmp.status === "RESOLVED";
              const isVerified = cmp.status === "VERIFIED";
              const isAssigned = cmp.status === "ASSIGNED_FOR_VERIFICATION";

              return (
                <Link
                  key={cmp.id}
                  href={`/landowner/complaints/${cmp.id}`}
                  className="block bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 hover:border-[#0B2E59] rounded-[4px] p-4 space-y-3 transition-colors shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-[#0B2E59] dark:text-sky-400">
                          {cmp.complaint_id}
                        </span>
                        <span className="text-[#DCE2E8] dark:text-slate-600">·</span>
                        <span className="text-xs text-[#5A6A80] dark:text-slate-400 font-mono">
                          Parcel: {cmp.parcel_id}
                        </span>
                      </div>
                      <h2 className="font-bold text-[#14213D] dark:text-white text-sm">
                        {cmp.complaint_type}
                      </h2>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-bold uppercase flex-shrink-0 border ${
                        isResolved
                          ? "bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-400 border-[#C8E6C9] dark:border-emerald-800/50"
                          : isVerified
                          ? "bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800/50"
                          : isAssigned
                          ? "bg-sky-50 dark:bg-sky-950/40 text-[#0B2E59] dark:text-sky-300 border-sky-200 dark:border-sky-800/50"
                          : "bg-[#FFF8E1] dark:bg-amber-950/40 text-[#B36B00] dark:text-amber-400 border-[#FFE082] dark:border-amber-800/50"
                      }`}
                    >
                      {cmp.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <p className="text-xs text-[#5A6A80] dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {cmp.description}
                  </p>

                  {/* 4-Step Visual Progress Bar */}
                  <div className="pt-2 border-t border-[#DCE2E8] dark:border-white/10 space-y-1.5">
                    <div className="grid grid-cols-4 gap-1">
                      <div className="h-1.5 rounded-[2px] bg-[#1E7E34]" title="Submitted" />
                      <div className={`h-1.5 rounded-[2px] ${isAssigned || isVerified || isResolved ? "bg-[#1E7E34]" : "bg-[#E2E8F0] dark:bg-white/10"}`} title="Assigned" />
                      <div className={`h-1.5 rounded-[2px] ${isVerified || isResolved ? "bg-[#1E7E34]" : "bg-[#E2E8F0] dark:bg-white/10"}`} title="Verified" />
                      <div className={`h-1.5 rounded-[2px] ${isResolved ? "bg-[#1E7E34]" : "bg-[#E2E8F0] dark:bg-white/10"}`} title="Resolved" />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#5A6A80] dark:text-slate-400 font-mono">
                      <span>
                        {isResolved
                          ? "✓ CALA Resolution Issued"
                          : isVerified
                          ? "✓ Ground Verified by Officer"
                          : isAssigned
                          ? "Site Inspection In Progress"
                          : "Grievance Under Review"}
                      </span>
                      <span className="text-[#0B2E59] dark:text-sky-400 font-bold flex items-center gap-0.5">
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </LandownerShell>
  );
}
