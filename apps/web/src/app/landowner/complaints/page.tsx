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
  const [owner, setOwner] = useState<any>({ owner_id: "O00004", name: "Geeta Meena" });

  useEffect(() => {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const sessionCookie = cookies.find((c) => c.startsWith("bhumi_officer_session="));
    let offId = "O00004";
    if (sessionCookie) {
      try {
        const val = decodeURIComponent(sessionCookie.split("=")[1]);
        const parsed = JSON.parse(val);
        if (parsed?.owner_id) {
          setOwner(parsed);
          offId = parsed.owner_id;
        }
      } catch {}
    }

    async function load() {
      setLoading(true);
      try {
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
  useRealtimeComplaints(owner.owner_id, async () => {
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
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white font-display">
              Grievance Records
            </h1>
            <p className="text-xs text-slate-400">
              Live status tracking with Supabase single source of truth
            </p>
          </div>

          <Link
            href="/landowner/complaints/new"
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all"
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
            placeholder="Search by Complaint ID, Parcel, or Issue..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Complaint Cards */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-400" />
            <span>Connecting to Supabase...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-300 font-medium">No grievances matching criteria</p>
            <p className="text-[11px] text-slate-500">
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
                  className="block bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-3 transition-colors shadow-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-emerald-400">
                          {cmp.complaint_id}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs text-slate-400 font-mono">
                          Parcel: {cmp.parcel_id}
                        </span>
                      </div>
                      <h2 className="font-bold text-white text-sm">
                        {cmp.complaint_type}
                      </h2>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase flex-shrink-0 border ${
                        isResolved
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : isVerified
                          ? "bg-teal-500/15 text-teal-300 border-teal-500/30"
                          : isAssigned
                          ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                          : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                      }`}
                    >
                      {cmp.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {cmp.description}
                  </p>

                  {/* 4-Step Visual Progress Bar */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <div className="grid grid-cols-4 gap-1">
                      <div className="h-1.5 rounded-full bg-emerald-500" title="Submitted" />
                      <div className={`h-1.5 rounded-full ${isAssigned || isVerified || isResolved ? "bg-emerald-500" : "bg-slate-800"}`} title="Assigned" />
                      <div className={`h-1.5 rounded-full ${isVerified || isResolved ? "bg-emerald-500" : "bg-slate-800"}`} title="Verified" />
                      <div className={`h-1.5 rounded-full ${isResolved ? "bg-emerald-500" : "bg-slate-800"}`} title="Resolved" />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>
                        {isResolved
                          ? "✓ CALA Resolution Issued"
                          : isVerified
                          ? "✓ Ground Verified by Officer"
                          : isAssigned
                          ? "Site Inspection In Progress"
                          : "Grievance Under Review"}
                      </span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
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
