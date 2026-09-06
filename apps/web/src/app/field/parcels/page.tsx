"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  User,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import { FieldShell } from "@/components/field/FieldShell";
import { getFieldParcels } from "@/lib/api";
import { offlineStore } from "@/lib/offlineStore";
import { useRealtimeDashboard } from "@/lib/supabase/useRealtime";

export default function AssignedParcelsPage() {
  const [parcels, setParcels] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "verified">("all");
  const [loading, setLoading] = useState(true);

  const refreshParcels = async () => {
    try {
      const active = offlineStore.getActiveOfficer();
      const offId = (active ? (active.officer_id || active.id) : "OFF-001") || "OFF-001";
      const fetched = await getFieldParcels(offId);
      setParcels(fetched || []);
    } catch {
      setParcels([]);
    }
  };

  useRealtimeDashboard(() => {
    refreshParcels();
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const active = offlineStore.getActiveOfficer();
        const offId = (active ? (active.officer_id || active.id) : "OFF-001") || "OFF-001";
        const fetched = await getFieldParcels(offId);
        setParcels(fetched || []);
      } catch {
        setParcels([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filtered = parcels.filter((p) => {
    if (filterStatus === "pending") {
      return p.status !== "Registered" && p.verification_status !== "verified";
    }
    if (filterStatus === "verified") {
      return p.status === "Registered" || p.verification_status === "verified";
    }
    return true;
  }).filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.parcel_id || "").toLowerCase().includes(q) ||
      (p.survey_number || "").toLowerCase().includes(q) ||
      (p.village_name || "").toLowerCase().includes(q) ||
      (p.owner_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <FieldShell title="Operational Sector Parcels">
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/field/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-[#0B2E59] dark:text-sky-400 hover:underline transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Field Dashboard</span>
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#1E7E34] dark:text-emerald-400 font-bold bg-[#E8F5E9] dark:bg-emerald-950/40 px-2 py-0.5 rounded-[3px] border border-[#C8E6C9] dark:border-emerald-800/40">
            Cadastral Records
          </span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-[#14213D] dark:text-white font-display">
            Operational Sector Parcels
          </h1>
          <p className="text-xs text-[#5A6A80] dark:text-slate-300">
            Official landowner-demarcated parcels recorded in the cadastral registry.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#5A6A80] dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by 14-digit Parcel ID, Owner Name, or Village..."
            className="w-full bg-white dark:bg-[#0D121F] border border-[#CBD5E1] dark:border-white/15 rounded-[4px] pl-10 pr-4 py-2.5 text-xs text-[#14213D] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0B2E59] font-mono shadow-xs"
          />
        </div>

        {/* Parcel Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-[#5A6A80] dark:text-slate-400 px-1 uppercase tracking-wider">
            <span>{filtered.length} Parcels In Jurisdiction</span>
            <span className="font-mono text-[10px] text-[#0B2E59] dark:text-sky-400">Official Revenue Registry</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[#5A6A80] dark:text-slate-400 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0B2E59] dark:text-sky-400" />
              <span>Querying registered parcels...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#0D121F] rounded-[4px] border border-dashed border-[#DCE2E8] dark:border-white/10 p-6 space-y-2 shadow-xs">
              <ShieldCheck className="w-8 h-8 text-[#5A6A80] dark:text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-[#14213D] dark:text-white">No registered parcels found in operational sector.</p>
              <p className="text-xs text-[#5A6A80] dark:text-slate-400 max-w-sm mx-auto">
                Parcels registered and demarcated by landowners will appear here for ground inspection and verification.
              </p>
            </div>
          ) : (
            filtered.map((parcel) => {
              const pId = parcel.parcel_id || parcel.id;
              return (
                <div
                  key={pId}
                  className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 hover:border-[#0B2E59] rounded-[4px] p-4 shadow-xs transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#14213D] dark:text-white font-mono">
                          Parcel #{pId}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-[3px] bg-[#E8F5E9] dark:bg-emerald-950/40 border border-[#C8E6C9] dark:border-emerald-800/40 text-[#1E7E34] dark:text-emerald-300 font-bold">
                          {parcel.status || "Registered"}
                        </span>
                      </div>
                      <p className="text-xs text-[#5A6A80] dark:text-slate-300 mt-1">
                        {parcel.survey_number || `Survey #${(pId || "").slice(-4)}`} &middot; {parcel.village_name || "Corridor Sector"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs text-[#0B2E59] dark:text-sky-400 font-bold block">
                        {parcel.area_acres || 0} Acres
                      </span>
                      <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 font-mono">
                        {parcel.coordinates?.length || 4} GPS Corners
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#5A6A80] dark:text-slate-400 border-t border-[#DCE2E8] dark:border-white/10 pt-2 font-mono">
                    <span>Owner: <strong className="text-[#14213D] dark:text-white">{parcel.owner_name}</strong></span>
                    <span className="text-[#0B2E59] dark:text-sky-400 text-[11px] font-semibold">
                      Demarcated Polygon
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </FieldShell>
  );
}
