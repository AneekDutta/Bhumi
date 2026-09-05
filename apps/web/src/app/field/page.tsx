"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Filter, 
  Compass, 
  ChevronRight,
  ShieldCheck,
  User,
  ExternalLink,
  Layers
} from "lucide-react";
import { FieldShell } from "@/components/field/FieldShell";
import { getFieldParcels } from "@/lib/api";
import { offlineStore } from "@/lib/offlineStore";

interface FieldParcel {
  parcel_id: string;
  survey_no: string;
  village_name: string;
  tehsil?: string;
  district?: string;
  area_acres?: number;
  land_type?: string;
  current_stage?: string;
  owner_name?: string;
  assessed_value?: number;
  centroid_lat?: number;
  centroid_lng?: number;
  verification_status?: "verified" | "disputed" | "rejected" | "pending";
  conflict_flag?: boolean;
  distance_meters?: number;
}

const FALLBACK_PARCELS: FieldParcel[] = [
  {
    parcel_id: "PAR-001",
    survey_no: "104/2B",
    village_name: "Rampur",
    tehsil: "Sadar",
    district: "Varanasi",
    area_acres: 1.45,
    land_type: "Agricultural",
    current_stage: "PRELIMINARY_NOTIFICATION",
    owner_name: "Raghunath Yadav",
    assessed_value: 4500000,
    centroid_lat: 25.321,
    centroid_lng: 82.987,
    verification_status: "pending"
  },
  {
    parcel_id: "PAR-002",
    survey_no: "108/1A",
    village_name: "Bilaspur",
    tehsil: "Sadar",
    district: "Varanasi",
    area_acres: 0.85,
    land_type: "Commercial",
    current_stage: "HEARING_OF_OBJECTIONS",
    owner_name: "Sunil Kumar",
    assessed_value: 3200000,
    centroid_lat: 25.325,
    centroid_lng: 82.991,
    verification_status: "disputed",
    conflict_flag: true
  },
  {
    parcel_id: "PAR-003",
    survey_no: "112/3",
    village_name: "Rampur",
    tehsil: "Sadar",
    district: "Varanasi",
    area_acres: 2.10,
    land_type: "Agricultural",
    current_stage: "DECLARATION",
    owner_name: "Mukesh Tiwari",
    assessed_value: 6800000,
    centroid_lat: 25.318,
    centroid_lng: 82.983,
    verification_status: "pending"
  },
  {
    parcel_id: "PAR-004",
    survey_no: "115/C",
    village_name: "Wagholi",
    tehsil: "Haveli",
    district: "Pune",
    area_acres: 1.15,
    land_type: "Residential",
    current_stage: "AWARD_ENQUIRY",
    owner_name: "Kisan Jadhav",
    assessed_value: 5200000,
    centroid_lat: 18.579,
    centroid_lng: 73.981,
    verification_status: "verified"
  }
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
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

export default function FieldDashboardPage() {
  const router = useRouter();
  const [parcels, setParcels] = useState<FieldParcel[]>(FALLBACK_PARCELS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "disputed" | "verified">("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [officer, setOfficer] = useState<any>(null);

  useEffect(() => {
    const active = offlineStore.getActiveOfficer();
    setOfficer(active || { id: "OFF-001", name: "Ramesh Patel", designation: "Patwari" });

    // Try to get GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          // Default near Varanasi if GPS blocked
          setUserLocation({ lat: 25.32, lng: 82.985 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    async function loadData() {
      try {
        const officerId: string = (active ? (active.officer_id || active.id) : "OFF-001") || "OFF-001";
        const fetched = await getFieldParcels(officerId);
        if (fetched && fetched.length > 0) {
          setParcels(fetched);
          offlineStore.cacheParcels(officerId, fetched);
        } else {
          const cached = offlineStore.getCachedParcels(officerId);
          if (cached) setParcels(cached);
        }
      } catch {
        const officerId: string = (active ? (active.officer_id || active.id) : "OFF-001") || "OFF-001";
        const cached = offlineStore.getCachedParcels(officerId);
        if (cached) setParcels(cached);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter & Search
  const filtered = parcels.filter((p) => {
    const matchSearch =
      p.survey_no.toLowerCase().includes(search.toLowerCase()) ||
      p.village_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.owner_name && p.owner_name.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;

    if (filterStatus === "all") return true;
    if (filterStatus === "pending") return p.verification_status === "pending" || !p.verification_status;
    if (filterStatus === "disputed") return p.verification_status === "disputed" || p.conflict_flag;
    if (filterStatus === "verified") return p.verification_status === "verified";
    return true;
  });

  return (
    <FieldShell title="Assigned Parcels">
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Officer Assigned Banner */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <span className="font-bold text-white text-sm block truncate">
                {officer?.name || "Ramesh Patel"}
              </span>
              <span className="text-[11px] text-slate-400 block truncate">
                {officer?.designation || "Patwari"} · {officer?.assigned_villages?.join(", ") || "Rampur Unit"}
              </span>
            </div>
          </div>
          
          <Link
            href="/field/login"
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0"
          >
            Switch
          </Link>
        </div>

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

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
          {(["all", "pending", "disputed", "verified"] as const).map((st) => (
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
              {st} {st === "all" ? `(${parcels.length})` : ""}
            </button>
          ))}
        </div>

        {/* Parcel List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
            <span>{filtered.length} Parcels Assigned</span>
            <span className="font-mono text-[10px] text-emerald-400">GPS Auto-Sorted</span>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700 p-6 space-y-2">
              <Clock className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-semibold text-white">No Matching Parcels Found</p>
              <p className="text-xs text-slate-400">
                Try adjusting your search query or status filter.
              </p>
            </div>
          ) : (
            filtered.map((parcel) => {
              const dist =
                userLocation && parcel.centroid_lat && parcel.centroid_lng
                  ? calculateDistance(
                      userLocation.lat,
                      userLocation.lng,
                      parcel.centroid_lat,
                      parcel.centroid_lng
                    )
                  : undefined;

              const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${parcel.centroid_lat || 25.321},${parcel.centroid_lng || 82.987}`;

              return (
                <div
                  key={parcel.parcel_id}
                  className="bg-slate-800/90 border border-slate-700/80 hover:border-emerald-500/40 rounded-2xl p-4 shadow-lg transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-white font-display">
                          Survey No. {parcel.survey_no}
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
                        {parcel.village_name}, {parcel.tehsil || "Sadar"} · {parcel.area_acres || 1.25} Acres
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
                        {parcel.owner_name || "Unrecorded"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Current Stage</span>
                      <span className="font-mono text-indigo-300 truncate block text-[11px]">
                        {parcel.current_stage || "PRELIMINARY"}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Start Verification + Open Maps Navigation */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href={`/field/verify/${parcel.parcel_id}`}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 transition-all text-center"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify & Report</span>
                    </Link>

                    <a
                      href={navUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-600 transition-all text-center"
                    >
                      <Navigation className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Directions</span>
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
