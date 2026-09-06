"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  ShieldCheck,
  Compass,
  ArrowRight,
  ExternalLink,
  Search,
  Filter,
  Layers,
  Sparkles,
  RefreshCw,
  X
} from "lucide-react";
import { FieldShell } from "@/components/field/FieldShell";
import { FieldSpatialMap } from "@/components/field/FieldSpatialMap";
import { getAllRegisteredParcels, getLandownerComplaints, getFieldIncidents } from "@/lib/api";
import { useRealtimeIncidents, useRealtimeDashboard } from "@/lib/supabase/useRealtime";

export default function FieldMapPage() {
  const [geojson, setGeojson] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [filterMode, setFilterMode] = useState<"ALL" | "PENDING" | "DISPUTED" | "INCIDENTS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadSpatialData = useCallback(async () => {
    setLoading(true);
    try {
      const [parcels, complaints, incs] = await Promise.all([
        getAllRegisteredParcels(),
        getLandownerComplaints(),
        getFieldIncidents()
      ]);

      const features: any[] = [];
      const seenIds = new Set<string>();

      // 1. Process complaints with boundary coordinates
      for (const c of (complaints || [])) {
        const pid = c.parcel_id || c.id;
        seenIds.add(pid);
        if (c.id) seenIds.add(c.id);

        let coords: [number, number][] = [];
        if (c.landowner_reported_boundary?.coordinates?.[0]) {
          coords = c.landowner_reported_boundary.coordinates[0];
        } else if (c.boundary?.coordinates?.[0]) {
          coords = c.boundary.coordinates[0];
        } else if (Array.isArray(c.coordinates) && c.coordinates.length >= 3) {
          coords = c.coordinates.map((pt: any) => [pt.lng ?? pt[0], pt.lat ?? pt[1]]);
          if (coords[0] && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
            coords.push([...coords[0]]);
          }
        } else if (c.landowner_boundary_coordinates && c.landowner_boundary_coordinates.length >= 3) {
          coords = c.landowner_boundary_coordinates.map((pt: any) => [pt.lng ?? pt[0], pt.lat ?? pt[1]]);
          if (coords[0] && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
            coords.push([...coords[0]]);
          }
        } else if (c.landowner_reported_location?.lng && c.landowner_reported_location?.lat) {
          const centroid = [c.landowner_reported_location.lng, c.landowner_reported_location.lat];
          const d = 0.0006;
          coords = [
            [centroid[0] - d, centroid[1] - d],
            [centroid[0] + d, centroid[1] - d],
            [centroid[0] + d, centroid[1] + d],
            [centroid[0] - d, centroid[1] + d],
            [centroid[0] - d, centroid[1] - d],
          ];
        }

        if (coords.length >= 4) {
          const areaAcres = Number(c.landowner_declared_area?.acres || (c.area_sqm ? c.area_sqm / 4046.86 : 0));
          const areaSqm = Number(c.landowner_declared_area?.sqm || c.area_sqm || 0);
          const isDisputed = Boolean(c.status?.toLowerCase().includes("dispute") || c.complaint_type);
          const isVerified = Boolean(c.status?.toLowerCase().includes("verified"));

          features.push({
            type: "Feature",
            id: c.id || pid,
            geometry: {
              type: "Polygon",
              coordinates: [coords]
            },
            properties: {
              parcel_id: pid,
              survey_number: c.survey_number || c.survey_no || pid,
              village_name: c.contact_village || c.village || "Operational Sector",
              owner_name: c.owner_name || "Citizen Landowner",
              area_sqm: areaSqm,
              area_hectares: Number((areaAcres * 0.404686).toFixed(3)),
              area_acres: areaAcres,
              acquisition_status: isVerified ? "possessed" : isDisputed ? "disputed" : "notified",
              ownership_conflict: isDisputed,
              is_critical_path: isDisputed,
              risk_score: isDisputed ? 75 : 25,
              hasComplaint: true
            }
          });
        }
      }

      // 2. Process registered parcels without active complaints
      for (const p of (parcels || [])) {
        const pid = p.parcel_id || p.id;
        if (seenIds.has(pid) || seenIds.has(p.id)) continue;

        let coords: [number, number][] = [];
        if (p.boundary_coordinates && p.boundary_coordinates.length >= 3) {
          coords = p.boundary_coordinates.map((pt: any) => [pt.lng ?? pt[0], pt.lat ?? pt[1]]);
          if (coords[0] && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
            coords.push([...coords[0]]);
          }
        } else if (Array.isArray(p.coordinates) && p.coordinates.length >= 3) {
          coords = p.coordinates.map((pt: any) => [pt.lng ?? pt[0], pt.lat ?? pt[1]]);
          if (coords[0] && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
            coords.push([...coords[0]]);
          }
        }

        if (coords.length >= 4) {
          const areaAcres = Number(p.calculated_area_acres || p.area_acres || (p.calculated_area_sqm ? p.calculated_area_sqm / 4046.86 : 0));
          const areaSqm = Number(p.calculated_area_sqm || p.area_sqm || 0);

          features.push({
            type: "Feature",
            id: pid,
            geometry: {
              type: "Polygon",
              coordinates: [coords]
            },
            properties: {
              parcel_id: pid,
              survey_number: p.survey_number || p.khasra_number || pid,
              village_name: p.village_name || p.contact_village || "Operational Sector",
              owner_name: p.owner_legal_name || p.owner_name || "Citizen Landowner",
              area_sqm: areaSqm,
              area_hectares: Number((areaAcres * 0.404686).toFixed(3)),
              area_acres: areaAcres,
              acquisition_status: p.status?.toLowerCase().includes("verified") ? "possessed" : "notified",
              ownership_conflict: false,
              is_critical_path: false,
              risk_score: 15,
              hasComplaint: false
            }
          });
        }
      }

      setGeojson({
        type: "FeatureCollection",
        features,
        properties: {
          center: [75.9284, 24.6492],
          zoom: 13,
          total_parcels: features.length
        }
      });
      setIncidents(incs || []);
    } catch (err) {
      console.error("Failed to load field spatial data:", err);
      setGeojson({
        type: "FeatureCollection",
        features: [],
        properties: { center: [75.9284, 24.6492], zoom: 13, total_parcels: 0 }
      });
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time synchronization: updates incident map markers when reported or resolved
  useRealtimeIncidents(undefined, () => {
    loadSpatialData();
  });

  useRealtimeDashboard(() => {
    loadSpatialData();
  });

  useEffect(() => {
    loadSpatialData();
  }, [loadSpatialData]);

  // Filter geojson features based on search query and filter chips
  const filteredGeojson = useMemo(() => {
    if (!geojson || !geojson.features) return geojson;

    let filtered = geojson.features;

    if (filterMode === "PENDING") {
      filtered = filtered.filter(
        (f: any) => !f.properties.acquisition_status || f.properties.acquisition_status === "not_started" || f.properties.acquisition_status === "notified"
      );
    } else if (filterMode === "DISPUTED") {
      filtered = filtered.filter(
        (f: any) => f.properties.ownership_conflict || f.properties.acquisition_status === "disputed" || f.properties.is_critical_path
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((f: any) => {
        const sNo = String(f.properties?.survey_number || "").toLowerCase();
        const pId = String(f.properties?.parcel_id || "").toLowerCase();
        const vName = String(f.properties?.village_name || "").toLowerCase();
        const oName = String(f.properties?.owner_name || "").toLowerCase();
        return sNo.includes(q) || pId.includes(q) || vName.includes(q) || oName.includes(q);
      });
    }

    return {
      ...geojson,
      features: filtered
    };
  }, [geojson, filterMode, searchQuery]);

  return (
    <FieldShell title="Corridor Spatial GIS">
      <div className="flex flex-col min-h-[calc(100vh-120px)] max-w-lg mx-auto p-3 space-y-3">
        
        {/* Search & Filter Header */}
        <div className="space-y-2">
          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#64748B] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Survey No, Village, or Landholder..."
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-white/15 rounded-[4px] text-xs text-[#14213D] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0B2E59] font-medium shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 rounded-full text-[#64748B] hover:text-[#14213D] dark:text-slate-400 dark:hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono no-scrollbar">
            <button
              type="button"
              onClick={() => setFilterMode("ALL")}
              className={`px-2.5 py-1 rounded-[3px] border whitespace-nowrap transition-all ${
                filterMode === "ALL"
                  ? "bg-[#0B2E59] border-[#0B2E59] text-white font-bold shadow-xs"
                  : "bg-white dark:bg-[#0D121F] border-[#DCE2E8] dark:border-white/10 text-[#64748B] dark:text-slate-400 hover:bg-slate-50"
              }`}
            >
              All Parcels ({geojson?.features?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("PENDING")}
              className={`px-2.5 py-1 rounded-[3px] border whitespace-nowrap transition-all ${
                filterMode === "PENDING"
                  ? "bg-[#B36B00] border-[#B36B00] text-white font-bold shadow-xs"
                  : "bg-white dark:bg-[#0D121F] border-[#DCE2E8] dark:border-white/10 text-[#64748B] dark:text-slate-400 hover:bg-slate-50"
              }`}
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("DISPUTED")}
              className={`px-2.5 py-1 rounded-[3px] border whitespace-nowrap transition-all ${
                filterMode === "DISPUTED"
                  ? "bg-[#B32424] border-[#B32424] text-white font-bold shadow-xs"
                  : "bg-white dark:bg-[#0D121F] border-[#DCE2E8] dark:border-white/10 text-[#64748B] dark:text-slate-400 hover:bg-slate-50"
              }`}
            >
              Disputed / Blocked
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("INCIDENTS")}
              className={`px-2.5 py-1 rounded-[3px] border whitespace-nowrap transition-all ${
                filterMode === "INCIDENTS"
                  ? "bg-[#B32424] border-[#B32424] text-white font-bold shadow-xs"
                  : "bg-white dark:bg-[#0D121F] border-[#DCE2E8] dark:border-white/10 text-[#64748B] dark:text-slate-400 hover:bg-slate-50"
              }`}
            >
              Incidents ({incidents.length})
            </button>
          </div>
        </div>

        {/* Real Mobile Spatial Map Container */}
        <div className="h-[380px] sm:h-[450px] relative rounded-[4px] overflow-hidden shadow-xs border border-[#DCE2E8] dark:border-white/10 flex-shrink-0">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#07080F] text-[#64748B] dark:text-slate-400 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0B2E59] dark:text-sky-400" />
              <span className="text-xs font-mono">Loading Registered Cadastral Boundaries...</span>
            </div>
          ) : (
            <>
              <FieldSpatialMap
                geojson={filteredGeojson}
                incidents={incidents}
                selectedParcelId={selectedParcel?.parcel_id}
                onParcelSelect={(p) => {
                  setSelectedParcel(p);
                  setSelectedIncident(null);
                }}
                onIncidentSelect={(inc) => {
                  setSelectedIncident(inc);
                  setSelectedParcel(null);
                }}
                height="100%"
              />

              {/* Clean Empty State Overlay when 0 parcels in jurisdiction */}
              {(!filteredGeojson || !filteredGeojson.features || filteredGeojson.features.length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-[2px] pointer-events-none z-10">
                  <div className="max-w-sm p-5 rounded-[4px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 text-center shadow-md space-y-2.5 pointer-events-auto">
                    <div className="w-10 h-10 rounded-[4px] bg-[#E6F0FA] dark:bg-sky-950/40 border border-[#B8D5ED] dark:border-sky-800/40 text-[#0B5FA5] dark:text-sky-400 flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-[#14213D] dark:text-white uppercase tracking-wider font-mono">
                      No Registered Parcels in Jurisdiction
                    </h4>
                    <p className="text-[11px] text-[#64748B] dark:text-slate-300 leading-relaxed">
                      No citizen land parcels or grievance boundaries have been registered in this sector.
                      Once landowners register parcels or submit demarcation claims, their GPS boundary polygons will appear here for ground inspection.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Interactive Detail Card / Drawer */}
        {selectedParcel ? (
          <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-3 animate-fadeIn flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#0B2E59] dark:text-sky-400 font-bold text-xs">
                    Survey {selectedParcel.survey_number || selectedParcel.survey_no || selectedParcel.parcel_id}
                  </span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-[3px] border uppercase font-bold ${
                    selectedParcel.ownership_conflict || selectedParcel.acquisition_status === "disputed"
                      ? "bg-[#FFEBEE] dark:bg-rose-950/40 border-[#FFCDD2] dark:border-rose-800/40 text-[#B32424] dark:text-rose-300"
                      : selectedParcel.acquisition_status === "possessed"
                      ? "bg-[#E8F5E9] dark:bg-emerald-950/40 border-[#C8E6C9] dark:border-emerald-800/40 text-[#1E7E34] dark:text-emerald-300"
                      : "bg-[#FFF8E1] dark:bg-amber-950/40 border-[#FFE082] dark:border-amber-800/40 text-[#B36B00] dark:text-amber-300"
                  }`}>
                    {selectedParcel.acquisition_status || "Pending"}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#14213D] dark:text-white mt-0.5">
                  {selectedParcel.owner_name || "Citizen Landowner"}
                </h3>
                <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                  {selectedParcel.village_name || "Operational Sector"} · {selectedParcel.area_acres ? `${selectedParcel.area_acres} Acres` : selectedParcel.area_hectares ? `${selectedParcel.area_hectares} Ha` : "Area Pending Verification"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedParcel(null)}
                className="p-1.5 rounded-[4px] text-[#64748B] hover:text-[#14213D] dark:text-slate-400 dark:hover:text-white bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Actions for Selected Parcel */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#DCE2E8] dark:border-white/10 text-xs">
              <Link
                href={`/field/parcels/${selectedParcel.parcel_id}/verify`}
                className="py-2 px-2 bg-[#1E7E34] hover:bg-[#166527] text-white font-bold rounded-[4px] text-center flex items-center justify-center gap-1 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verify</span>
              </Link>

              <Link
                href={`/field/parcels/${selectedParcel.parcel_id}/report`}
                className="py-2 px-2 bg-white dark:bg-[#0D121F] hover:bg-[#FFEBEE] dark:hover:bg-rose-950/30 border border-[#FFCDD2] dark:border-rose-800/40 text-[#B32424] dark:text-rose-400 font-semibold rounded-[4px] text-center flex items-center justify-center gap-1 shadow-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#B32424] dark:text-rose-400" />
                <span>Blocker</span>
              </Link>

              <Link
                href={`/field/parcels/${selectedParcel.parcel_id}`}
                className="py-2 px-2 bg-white dark:bg-[#0D121F] hover:bg-slate-50 dark:hover:bg-white/5 text-[#0B2E59] dark:text-sky-400 font-semibold rounded-[4px] text-center flex items-center justify-center gap-1 border border-[#DCE2E8] dark:border-white/10 shadow-xs"
              >
                <span>Dossier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : selectedIncident ? (
          <div className="bg-white dark:bg-[#0D121F] border border-[#FFCDD2] dark:border-rose-800/40 rounded-[4px] p-4 shadow-xs space-y-2.5 animate-fadeIn flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#B32424] dark:text-rose-400 font-bold text-xs">
                    {selectedIncident.verification_id}
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-[3px] bg-[#FFEBEE] dark:bg-rose-950/40 text-[#B32424] dark:text-rose-300 font-bold uppercase border border-[#FFCDD2] dark:border-rose-800/40">
                    {selectedIncident.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#14213D] dark:text-white capitalize mt-0.5">
                  {(selectedIncident.issue_type || "Ground Blocker").replace(/_/g, " ")}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="p-1.5 rounded-[4px] text-[#64748B] hover:text-[#14213D] dark:text-slate-400 dark:hover:text-white bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-[#333333] dark:text-slate-300 leading-relaxed">
              {selectedIncident.observations || selectedIncident.remarks}
            </p>

            <div className="flex items-center justify-between text-[10px] text-[#64748B] dark:text-slate-400 pt-1 border-t border-[#DCE2E8] dark:border-white/10">
              <span>Reported by: {selectedIncident.officer_name || "Field Officer"}</span>
              <Link
                href={`/field/parcels/${selectedIncident.parcel_id}`}
                className="text-[#0B5FA5] dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold"
              >
                Open Parcel Survey {selectedIncident.survey_number || selectedIncident.parcel_id} →
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-3 shadow-xs flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
              <span className="text-[11px]">
                Tap any parcel polygon or incident marker to inspect &amp; act
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#64748B] dark:text-slate-500">WGS84 EPSG:4326</span>
          </div>
        )}

      </div>
    </FieldShell>
  );
}