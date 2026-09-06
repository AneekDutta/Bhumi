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
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Survey No, Village, or Landholder..."
              className="w-full pl-9 pr-8 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 rounded-full text-slate-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2"
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
              className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
                filterMode === "ALL"
                  ? "bg-emerald-600 border-emerald-500 text-white font-bold shadow-sm"
                  : "bg-slate-800/90 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              All Parcels ({geojson?.features?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("PENDING")}
              className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
                filterMode === "PENDING"
                  ? "bg-amber-600 border-amber-500 text-white font-bold shadow-sm"
                  : "bg-slate-800/90 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("DISPUTED")}
              className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
                filterMode === "DISPUTED"
                  ? "bg-red-600 border-red-500 text-white font-bold shadow-sm"
                  : "bg-slate-800/90 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              Disputed / Blocked
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("INCIDENTS")}
              className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
                filterMode === "INCIDENTS"
                  ? "bg-rose-600 border-rose-500 text-white font-bold shadow-sm"
                  : "bg-slate-800/90 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              Incidents ({incidents.length})
            </button>
          </div>
        </div>

        {/* Real Mobile Spatial Map Container */}
        <div className="h-[380px] sm:h-[450px] relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex-shrink-0">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
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
                <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-950/50 backdrop-blur-[2px] pointer-events-none z-10">
                  <div className="max-w-sm p-5 rounded-2xl bg-slate-900/95 border border-slate-700/80 text-center shadow-2xl space-y-2.5 pointer-events-auto">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      No Registered Parcels in Jurisdiction
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
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
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-xl space-y-3 animate-fadeIn flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 font-bold text-xs">
                    Survey {selectedParcel.survey_number || selectedParcel.survey_no || selectedParcel.parcel_id}
                  </span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold ${
                    selectedParcel.ownership_conflict || selectedParcel.acquisition_status === "disputed"
                      ? "bg-red-500/15 border-red-500/30 text-red-300"
                      : selectedParcel.acquisition_status === "possessed"
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                      : "bg-amber-500/15 border-amber-500/30 text-amber-300"
                  }`}>
                    {selectedParcel.acquisition_status || "Pending"}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  {selectedParcel.owner_name || "Citizen Landowner"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {selectedParcel.village_name || "Operational Sector"} · {selectedParcel.area_acres ? `${selectedParcel.area_acres} Acres` : selectedParcel.area_hectares ? `${selectedParcel.area_hectares} Ha` : "Area Pending Verification"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedParcel(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Actions for Selected Parcel */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800 text-xs">
              <Link
                href={`/field/parcels/${selectedParcel.parcel_id}/verify`}
                className="py-2 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-center flex items-center justify-center gap-1 shadow-md"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verify</span>
              </Link>

              <Link
                href={`/field/parcels/${selectedParcel.parcel_id}/report`}
                className="py-2 px-2 bg-red-950/40 hover:bg-red-950/60 border border-red-500/40 text-red-300 font-semibold rounded-xl text-center flex items-center justify-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>Blocker</span>
              </Link>

              <Link
                href={`/field/parcels/${selectedParcel.parcel_id}`}
                className="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-center flex items-center justify-center gap-1 border border-slate-700"
              >
                <span>Dossier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : selectedIncident ? (
          <div className="bg-red-950/30 border border-red-500/40 rounded-2xl p-4 shadow-xl space-y-2.5 animate-fadeIn flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-red-400 font-bold text-xs">
                    {selectedIncident.verification_id}
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold uppercase">
                    {selectedIncident.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white capitalize mt-0.5">
                  {(selectedIncident.issue_type || "Ground Blocker").replace(/_/g, " ")}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedIncident.observations || selectedIncident.remarks}
            </p>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-red-500/20">
              <span>Reported by: {selectedIncident.officer_name || "Field Officer"}</span>
              <Link
                href={`/field/parcels/${selectedIncident.parcel_id}`}
                className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
              >
                Open Parcel Survey {selectedIncident.survey_number || selectedIncident.parcel_id} →
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-md flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px]">
                Tap any parcel polygon or incident marker to inspect & act
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">WGS84 EPSG:4326</span>
          </div>
        )}

      </div>
    </FieldShell>
  );
}