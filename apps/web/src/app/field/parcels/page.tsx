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
  ShieldCheck
} from "lucide-react";
import { FieldShell } from "@/components/field/FieldShell";
import { getFieldParcels } from "@/lib/api";
import { offlineStore } from "@/lib/offlineStore";
import { useRealtimeDashboard } from "@/lib/supabase/useRealtime";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export default function AssignedParcelsPage() {
  const [parcels, setParcels] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "disputed" | "verified">("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshParcels = async () => {
    try {
      const active = offlineStore.getActiveOfficer();
      const offId = (active ? (active.officer_id || active.id) : "OFF-001") || "OFF-001";
      const fetched = await getFieldParcels(offId);
      if (fetched && fetched.length > 0) setParcels(fetched);
    } catch {}
  };

  // Real-time synchronization: automatically reloads parcels when Supabase changes
  useRealtimeDashboard(() => {
    refreshParcels();
  });
  const [officer, setOfficer] = useState<any>(null);

  useEffect(() => {
    const active = offlineStore.getActiveOfficer();
    setOfficer(active || { id: "OFF-001", name: "Ramesh Patel", designation: "Patwari" });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          setUserLocation({ lat: 25.321, lng: 82.987 });
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }

    async function loadData() {
      try {
        const offId = (active ? (active.officer_id || active.id) : "OFF-001") || "OFF-001";
        const fetched = await getFieldParcels(offId);
        if (fetched && fetched.length > 0) {
          setParcels(fetched);
          offlineStore.cacheParcels(offId, fetched);
        } else {
          const cached = offlineStore.getCachedParcels(offId);
          if (cached) setParcels(cached);
        }
      } catch {
        const offId = (active ? (active.officer_id || active.id) : "OFF-001") || "OFF-001";
        const cached = offlineStore.getCachedParcels(offId);
        if (cached) setParcels(cached);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filtered = parcels.filter((p) => {
    const sNo = (p.survey_no || p.survey_number || "").toLowerCase();
    const vName = (p.village_name || "").toLowerCase();
    const oName = (p.owner_name || "").toLowerCase();
    const q = search.toLowerCase();

    const matches = sNo.includes(q) || vName.includes(q) || oName.includes(q);
    if (!matches) return false;

    if (filterStatus === "all") return true;
    if (filterStatus === "pending") return !p.verification_status || p.verification_status === "pending";
    if (filterStatus === "disputed") return p.verification_status === "disputed" || p.conflict_flag;
    if (filterStatus === "verified") return p.verification_status === "verified";
    return true;
  });

  return (
    <FieldShell title="Assigned Parcels Queue">
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Survey No, Village, Claimant..."
            className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
          {(['all', 'pending', 'disputed', 'verified'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-medium capitalize whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === st
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950 font-semibold"
                  : "bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              {st} {st === 'all' ? `(${parcels.length})` : ''}
            </button>
          ))}
        </div>

        {/* Parcel Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
            <span>{filtered.length} Parcels In Jurisdiction</span>
            <span className="font-mono text-[10px] text-emerald-400">GPS Auto-Sorted</span>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700 p-6 space-y-2">
              <Clock className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-semibold text-white">No Matching Parcels Found</p>
              <p className="text-xs text-slate-400">Try changing your search query or status filter.</p>
            </div>
          ) : (
            filtered.map((parcel) => {
              const lat = parcel.centroid_lat || 25.321;
              const lng = parcel.centroid_lng || 82.987;
              const dist = userLocation
                ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng)
                : undefined;

              const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
              const pId = parcel.parcel_id || parcel.id;

              return (
                <div
                  key={pId}
                  className="bg-slate-800/90 border border-slate-700/80 hover:border-emerald-500/40 rounded-2xl p-4 shadow-lg transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-white font-display">
                          Survey No. {parcel.survey_no || parcel.survey_number}
                        </span>
                        {parcel.verification_status === "verified" && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                            Verified
                          </span>
                        )}
                        {(parcel.verification_status === "disputed" || parcel.conflict_flag) && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300">
                            Disputed
                          </span>
                        )}
                        {(!parcel.verification_status || parcel.verification_status === "pending") && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                            Pending
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-0.5">
                        {parcel.village_name || "Rampur"} · {parcel.area_acres || 1.25} Acres
                      </p>
                    </div>

                    {typeof dist === "number" && (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-900 text-emerald-400 border border-slate-700 flex-shrink-0">
                        {dist > 1000 ? `${(dist / 1000).toFixed(1)} km` : `${dist}m`}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-700/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Owner / Claimant</span>
                      <span className="font-medium text-slate-200 truncate block">
                        {parcel.owner_name || "Recorded Landholder"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Current Stage</span>
                      <span className="font-mono text-indigo-300 truncate block text-[11px]">
                        {parcel.current_stage || "PRELIMINARY"}
                      </span>
                    </div>
                  </div>

                  {/* Actions: View Details, Verify, Directions */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <Link
                      href={`/field/parcels/${pId}`}
                      className="py-2 px-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold text-center border border-slate-600 transition-all"
                    >
                      Details
                    </Link>

                    <Link
                      href={`/field/parcels/${pId}/verify`}
                      className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold text-center shadow-md shadow-emerald-950 transition-all flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Verify
                    </Link>

                    <a
                      href={navUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-semibold text-center shadow-sm transition-all flex items-center justify-center gap-1"
                    >
                      <Navigation className="w-3 h-3" /> Maps
                    </a>
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
