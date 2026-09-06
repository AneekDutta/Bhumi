"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Map, { Source, Layer, Marker, NavigationControl, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { 
  Compass, 
  MapPin, 
  Crosshair, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Send, 
  ArrowLeft, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  Info,
  RotateCcw
} from "lucide-react";
import { LandownerShell } from "@/components/landowner/LandownerShell";
import { getCurrentGPSPosition, LocationCoordinates } from "@/lib/native/geolocation";
import { 
  calculatePolygonAreaAndUncertainty, 
  BoundaryPointWithAccuracy, 
  AreaAndUncertaintyResult 
} from "@/lib/spatial/geodesicArea";
import { getLandownerParcels, submitLandownerBoundary } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/context/ThemeContext";

const DARK_MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const LIGHT_MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

interface CapturedPoint extends BoundaryPointWithAccuracy {
  sequence: number;
  lat: number;
  lng: number;
  accuracy: number; // in meters (actual float)
  timestamp: string; // ISO
}

export default function MarkBoundaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedParcel = searchParams.get("parcel_id") || "";
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const mapRef = useRef<MapRef | null>(null);
  const supabase = createClient();

  // URL Params & Mode
  const complaintId = searchParams.get("complaint_id") || null;
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Authentication & session
  const [owner, setOwner] = useState<any>(null);
  const [parcels, setParcels] = useState<any[]>([]);
  const [selectedParcelId, setSelectedParcelId] = useState<string>(preselectedParcel || "unregistered");

  // GPS points capture state
  const [points, setPoints] = useState<CapturedPoint[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [recapturingIndex, setRecapturingIndex] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [accuracyWarning, setAccuracyWarning] = useState<string | null>(null);

  // Current device live position for map centering prior to point capture
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Submission state
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // 1. Load authenticated landowner and parcels
  useEffect(() => {
    async function initSession() {
      const { data: authData } = await supabase.auth.getUser();
      let activeOwnerId: string | null = null;
      let activeName = "Citizen Landowner";
      let activeVillage = "Corridor Sector";

      if (authData?.user) {
        activeOwnerId = authData.user.id;
        activeName = authData.user.user_metadata?.full_name || activeName;
      }

      if (!activeOwnerId) {
        router.push("/landowner/login");
        return;
      }

      setOwner({
        owner_id: activeOwnerId,
        name: activeName,
        contact_village: activeVillage
      });

      try {
        const parcelList = await getLandownerParcels(activeOwnerId);
        setParcels(parcelList || []);
        if (!selectedParcelId && parcelList && parcelList.length > 0) {
          setSelectedParcelId(parcelList[0].parcel_id || parcelList[0].id);
        }
      } catch (err) {
        console.warn("Could not load landowner parcels:", err);
      }
    }

    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, selectedParcelId]);

  // Selected parcel object
  const activeParcel = useMemo(() => {
    return parcels.find((p) => (p.parcel_id || p.id) === selectedParcelId) || null;
  }, [parcels, selectedParcelId]);

  // 2. Real Geodesic Area and Deterministic Uncertainty Calculation
  const areaResult: AreaAndUncertaintyResult | null = useMemo(() => {
    if (points.length < 4) return null;
    return calculatePolygonAreaAndUncertainty(points);
  }, [points]);

  // 3. Construct GeoJSON FeatureCollection for points & polygon (Real Data Only)
  const boundaryGeoJSON: any = useMemo(() => {
    if (points.length < 4) return null;

    const ring: [number, number][] = points.map((p) => [p.lng, p.lat]);
    // Close polygon
    ring.push([points[0].lng, points[0].lat]);

    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [ring]
          },
          properties: {
            boundary_type: "landowner_reported_boundary",
            status: "CLAIMED_UNVERIFIED",
            area_sqm: areaResult?.areaSqm || null
          }
        }
      ]
    };
  }, [points, areaResult]);

  // 4. Center map strictly around real captured points or live device fix
  useEffect(() => {
    if (!mapRef.current) return;

    if (points.length > 0) {
      let minLng = Infinity;
      let minLat = Infinity;
      let maxLng = -Infinity;
      let maxLat = -Infinity;

      for (const pt of points) {
        if (pt.lng < minLng) minLng = pt.lng;
        if (pt.lat < minLat) minLat = pt.lat;
        if (pt.lng > maxLng) maxLng = pt.lng;
        if (pt.lat > maxLat) maxLat = pt.lat;
      }

      if (points.length === 1) {
        mapRef.current.flyTo({
          center: [points[0].lng, points[0].lat],
          zoom: 17,
          duration: 600
        });
      } else {
        mapRef.current.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat]
          ],
          {
            padding: 60,
            maxZoom: 18,
            duration: 700
          }
        );
      }
    } else if (deviceLocation) {
      mapRef.current.flyTo({
        center: [deviceLocation.lng, deviceLocation.lat],
        zoom: 16,
        duration: 600
      });
    }
  }, [points, deviceLocation]);

  // 5. Capture Real Device GPS Point or Demo Simulation Point
  const handleCapturePoint = async (targetIndex?: number) => {
    setCapturing(true);
    setGpsError(null);
    setAccuracyWarning(null);
    if (typeof targetIndex === "number") {
      setRecapturingIndex(targetIndex);
    }

    try {
      let pos: LocationCoordinates;

      if (isDemoMode) {
        // DEMO / SIMULATION MODE: Simulated accuracy strictly within ±12m to ±15m range (NEVER fake or wild numbers)
        const simAccuracy = Number((12.0 + Math.random() * 3.0).toFixed(1)); // strictly between 12.0m and 15.0m
        const seq = typeof targetIndex === "number" ? targetIndex : points.length;
        const baseLat = deviceLocation?.lat || activeParcel?.lat || 24.6650;
        const baseLng = deviceLocation?.lng || activeParcel?.lng || 75.9520;

        // 4 corners of approximate quadrilateral
        const offsets: [number, number][] = [
          [0.0, 0.0],
          [0.0012, 0.0001],
          [0.0011, 0.0009],
          [-0.0001, 0.0008]
        ];
        const offset = offsets[seq % offsets.length];
        pos = {
          lat: Number((baseLat + offset[1]).toFixed(6)),
          lng: Number((baseLng + offset[0]).toFixed(6)),
          accuracy: simAccuracy
        };
      } else {
        // REAL GPS MODE: Real GPS hardware data only. Real device accuracy only. NEVER fabricate or alter accuracy.
        pos = await getCurrentGPSPosition({
          enableHighAccuracy: true,
          timeout: 15000
        });
      }

      // Update live device location
      setDeviceLocation({ lat: pos.lat, lng: pos.lng });

      // Warn if accuracy is poor (> 15m)
      if (pos.accuracy > 15) {
        setAccuracyWarning(
          `GPS accuracy is currently poor (±${pos.accuracy} m). For best results, move to an open area away from tall structures and retry.`
        );
      }

      const newPoint: CapturedPoint = {
        sequence: typeof targetIndex === "number" ? targetIndex + 1 : points.length + 1,
        lat: pos.lat,
        lng: pos.lng,
        accuracy: pos.accuracy,
        timestamp: new Date().toISOString()
      };

      if (typeof targetIndex === "number") {
        // Re-capturing existing point
        setPoints((prev) => {
          const updated = [...prev];
          updated[targetIndex] = newPoint;
          return updated;
        });
        setRecapturingIndex(null);
      } else {
        // Adding new point
        setPoints((prev) => [...prev, newPoint]);
      }
    } catch (err: any) {
      setGpsError(err?.message || "GPS location unavailable. Please enable location permissions and try again.");
    } finally {
      setCapturing(false);
      setRecapturingIndex(null);
    }
  };

  // 6. Remove a specific point
  const handleRemovePoint = (indexToRemove: number) => {
    setPoints((prev) => {
      const filtered = prev.filter((_, idx) => idx !== indexToRemove);
      return filtered.map((pt, idx) => ({ ...pt, sequence: idx + 1 }));
    });
  };

  // 7. Clear all captured points
  const handleResetAll = () => {
    if (window.confirm("Are you sure you want to clear all captured boundary points?")) {
      setPoints([]);
      setGpsError(null);
      setAccuracyWarning(null);
    }
  };

  // 8. Submit Claimed Boundary to Supabase
  const handleSubmitBoundary = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (points.length < 4) {
      setSubmitError("At least 4 actual GPS points are required to define a closed land boundary polygon.");
      return;
    }

    if (!areaResult) {
      setSubmitError("Area calculation unavailable. Please verify your boundary points.");
      return;
    }

    setSubmitting(true);

    try {
      const isUnregistered = !selectedParcelId || selectedParcelId === "unregistered";
      const surveyNumber = isUnregistered
        ? "UNREGISTERED_CLAIM"
        : (activeParcel?.survey_number || activeParcel?.survey_no || selectedParcelId);

      const payload = {
        owner_id: owner.owner_id,
        owner_name: owner.name,
        contact_village: owner.contact_village,
        parcel_id: isUnregistered ? null : selectedParcelId,
        complaint_id: complaintId,
        survey_number: surveyNumber,
        project_id: activeParcel?.project_id || "P-NH927A",
        points: points,
        calculated_area: {
          sqm: areaResult.areaSqm,
          acres: areaResult.areaAcres,
          hectares: areaResult.areaHectares
        },
        uncertainty: areaResult.uncertaintySqm !== null
          ? {
              sqm: areaResult.uncertaintySqm,
              acres: areaResult.uncertaintyAcres,
              percentage: areaResult.uncertaintyPercentage,
              explanation: areaResult.uncertaintyExplanation
            }
          : null,
        perimeter_m: areaResult.perimeterMeters,
        notes: notes.trim(),
        is_demo_simulation: isDemoMode,
        provenance: {
          source: isDemoMode ? "DEMO DATA / SIMULATION" : "LANDOWNER GPS CAPTURE",
          boundary_type: "landowner_reported_boundary",
          status: "CLAIMED / UNVERIFIED",
          area_source: "CALCULATED FROM LANDOWNER GPS POLYGON",
          area_status: "ESTIMATED"
        }
      };

      const result = await submitLandownerBoundary(payload);

      if (!result || !result.success) {
        throw new Error("Unable to save boundary. Please try again.");
      }

      setSubmitSuccess(`Boundary #${result.boundary_id} saved successfully. Synchronized with CALA and Field Officers.`);
      setTimeout(() => {
        if (complaintId) {
          router.push(`/landowner/complaints/${complaintId}`);
        } else {
          router.push("/landowner/home");
        }
      }, 1200);
    } catch (err: any) {
      setSubmitError(err?.message || "Unable to save boundary. Please try again.");
      setSubmitting(false);
    }
  };

  const isPolygonReady = points.length >= 4;

  return (
    <LandownerShell title="Mark Land Boundary" showBack>
      <div className="min-h-screen p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Header Breadcrumb & Status */}
        <div className="flex items-center justify-between">
          <Link
            href="/landowner/home"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Land</span>
          </Link>

          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
            CLAIMED / UNVERIFIED
          </span>
        </div>

        {/* Page Title & Instructions */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-white font-display">
            MARK LAND BOUNDARY
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Capture at least 4 GPS points around the approximate corners of your land. Walk to each corner of your plot and record the position using your device GPS.
          </p>
        </div>

        {/* Operating GPS Mode Switcher: Real Hardware GPS vs Demo Simulation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Operating GPS Mode
            </label>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
              isDemoMode 
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" 
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
            }`}>
              {isDemoMode ? "DEMO DATA / SIMULATION" : "REAL HARDWARE GPS"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsDemoMode(false)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                !isDemoMode
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Real Hardware GPS</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDemoMode(true)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isDemoMode
                  ? "bg-purple-600 text-white shadow-md shadow-purple-950/40"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Demo Simulation</span>
            </button>
          </div>

          {isDemoMode ? (
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-purple-300">
                <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />
                <span>DEMO DATA / SIMULATION</span>
              </div>
              <p className="text-[11px] leading-relaxed text-purple-200/90">
                Simulated coordinates for demonstration. Simulated GPS accuracy is modeled strictly within ±12m to ±15m range (not wildly varying, not presented as real).
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">
              Real Mode: Uses device satellite GPS hardware accuracy only. Zero fake or fabricated coordinates.
            </p>
          )}
        </div>

        {/* Parcel Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            Select Impacted Parcel <span className="text-amber-400">*</span>
          </label>
          <select
            value={selectedParcelId}
            onChange={(e) => setSelectedParcelId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="unregistered">Unregistered Land Claim (No Official Parcel Linked)</option>
            {parcels.map((p) => {
              const id = p.parcel_id || p.id;
              const survey = p.survey_number || p.survey_no || id;
              return (
                <option key={id} value={id}>
                  Survey #{survey} ({id}) · {p.village_name || owner?.contact_village}
                </option>
              );
            })}
          </select>
          {selectedParcelId === "unregistered" ? (
            <div className="text-[11px] font-mono text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/30">
              Unregistered Land Claim: No pre-existing registered land parcel required. This spatial polygon will serve as your initial claimed boundary.
            </div>
          ) : activeParcel ? (
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-1">
              <span>Official Extent: {activeParcel.area_hectares || (activeParcel.area_sqm ? (activeParcel.area_sqm / 10000).toFixed(2) : "-")} Ha</span>
              <span className="text-emerald-400 font-semibold">{activeParcel.classification || "Agricultural"}</span>
            </div>
          ) : null}
        </div>

        {/* Global Error Banner */}
        {gpsError && (
          <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-red-300 block uppercase tracking-wider text-[10px]">Location Status</span>
              <p className="leading-relaxed">{gpsError}</p>
            </div>
          </div>
        )}

        {/* Accuracy Warning Banner */}
        {accuracyWarning && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2 animate-fadeIn">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
            <span>{accuracyWarning}</span>
          </div>
        )}

        {/* Submit Error */}
        {submitError && (
          <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Submit Success */}
        {submitSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{submitSuccess}</span>
          </div>
        )}

        {/* GPS Point Capture Button */}
        <div className="space-y-2">
          <button
            type="button"
            disabled={capturing || submitting}
            onClick={() => handleCapturePoint()}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-950/40 disabled:opacity-60 cursor-pointer"
          >
            {capturing && recapturingIndex === null ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Acquiring Device GPS Fix...</span>
              </>
            ) : (
              <>
                <Crosshair className="w-4 h-4 text-amber-200" />
                <span>
                  {points.length === 0
                    ? "Capture Corner Point 1 (Use My Location)"
                    : `+ Add Boundary Point ${points.length + 1}`}
                </span>
              </>
            )}
          </button>

          <p className="text-[10px] text-slate-400 text-center">
            {points.length < 4
              ? `Captured ${points.length} of 4 minimum required points. Walk to corner ${points.length + 1} and tap to record.`
              : `Minimum 4 points recorded. You may add more corners for irregular boundaries or review below.`}
          </p>
        </div>

        {/* Interactive Map Display */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Spatial Boundary Preview</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {isPolygonReady ? "Closed Polygon" : `${points.length} Vertices`}
            </span>
          </div>

          <div className="h-[340px] sm:h-[400px] w-full rounded-xl overflow-hidden border border-slate-700/80 relative bg-slate-950">
            {points.length === 0 && !deviceLocation ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                <MapPin className="w-8 h-8 text-amber-500/60 animate-bounce" />
                <span className="text-xs font-bold text-slate-300">No GPS Points Captured Yet</span>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Tap &ldquo;Capture Corner Point 1&rdquo; to acquire your current location and display your position on the map.
                </p>
              </div>
            ) : (
              <Map
                ref={mapRef}
                initialViewState={{
                  longitude: points[0]?.lng || deviceLocation?.lng || 75.95,
                  latitude: points[0]?.lat || deviceLocation?.lat || 24.66,
                  zoom: 16,
                  pitch: 10
                }}
                mapStyle={isLight ? LIGHT_MAP_STYLE : DARK_MAP_STYLE}
                cooperativeGestures={true}
                style={{ width: "100%", height: "100%" }}
              >
                <NavigationControl position="bottom-right" />

                {/* Closed Polygon Layer (Only when >= 4 points) */}
                {boundaryGeoJSON && (
                  <Source id="landowner-boundary-source" type="geojson" data={boundaryGeoJSON}>
                    <Layer
                      id="landowner-boundary-fill"
                      type="fill"
                      paint={{
                        "fill-color": "#f59e0b",
                        "fill-opacity": 0.2
                      }}
                    />
                    <Layer
                      id="landowner-boundary-line"
                      type="line"
                      paint={{
                        "line-color": "#f59e0b",
                        "line-width": 2.5,
                        "line-dasharray": [3, 2]
                      }}
                    />
                  </Source>
                )}

                {/* Point Markers */}
                {points.map((pt, idx) => (
                  <Marker
                    key={`point-${idx}-${pt.timestamp}`}
                    longitude={pt.lng}
                    latitude={pt.lat}
                    anchor="center"
                  >
                    <div className="flex flex-col items-center group cursor-pointer">
                      <div className="w-7 h-7 rounded-full bg-amber-600 border-2 border-white text-white font-bold text-[11px] flex items-center justify-center shadow-lg shadow-black/80 font-mono">
                        P{pt.sequence}
                      </div>
                      <span className="text-[9px] font-mono bg-slate-900/90 text-amber-300 px-1 rounded border border-amber-500/30 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ±{pt.accuracy}m
                      </span>
                    </div>
                  </Marker>
                ))}
              </Map>
            )}
          </div>
        </div>

        {/* Captured Points List */}
        {points.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Captured Boundary Vertices ({points.length})</span>
              </h2>

              <button
                type="button"
                onClick={handleResetAll}
                className="text-[10px] font-mono text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            <div className="space-y-2">
              {points.map((pt, idx) => {
                const isRecapturing = capturing && recapturingIndex === idx;

                return (
                  <div
                    key={`item-${idx}`}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-bold font-mono text-[11px] flex items-center justify-center">
                          P{pt.sequence}
                        </span>
                        <span className="font-bold text-white text-xs">
                          Point {pt.sequence} ✓
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                          pt.accuracy <= 10
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                            : pt.accuracy <= 20
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                            : "bg-red-500/15 border-red-500/30 text-red-300"
                        }`}>
                          Actual GPS accuracy: ±{pt.accuracy} m
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 pl-7">
                        Lat: {pt.lat}°, Lng: {pt.lng}°
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={capturing || submitting}
                        onClick={() => handleCapturePoint(idx)}
                        title="Re-capture Point"
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                      >
                        {isRecapturing ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={capturing || submitting}
                        onClick={() => handleRemovePoint(idx)}
                        title="Remove Point"
                        className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Real Area Calculation & Uncertainty (Displayed ONLY when >= 4 points) */}
        {isPolygonReady && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/40 rounded-2xl p-4 shadow-xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30">
                LANDOWNER-REPORTED / ESTIMATED
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {isDemoMode ? "DEMO SIMULATION" : "GPS-based estimate"}
              </span>
            </div>

            {areaResult ? (
              <>
                <div className="space-y-1 text-center py-2 border-y border-slate-800/80">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                    ESTIMATED LAND AREA
                  </span>
                  <div className="text-3xl font-black text-white font-mono tracking-tight">
                    {areaResult.areaAcres} <span className="text-base font-medium text-amber-400">acres</span>
                  </div>
                  <div className="text-xs font-mono text-slate-300 flex items-center justify-center gap-4 pt-1">
                    <span>{areaResult.areaSqm.toLocaleString()} m²</span>
                    <span>·</span>
                    <span>{areaResult.areaHectares} hectares</span>
                  </div>
                </div>

                {/* Uncertainty Section */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 font-mono uppercase text-[10px]">
                      Measurement Uncertainty:
                    </span>
                    {areaResult.uncertaintySqm !== null ? (
                      <span className="font-mono font-bold text-amber-400">
                        ±{areaResult.uncertaintySqm} m² (±{areaResult.uncertaintyAcres} acres)
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {areaResult.uncertaintyExplanation}
                  </p>
                </div>
              </>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-amber-300">
                Area calculation unavailable.
              </div>
            )}

            {/* Data Provenance & Legal Classification Notice */}
            <div className="p-3 rounded-xl bg-slate-950/90 border border-white/5 space-y-2 text-[10px] font-mono">
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">SOURCE:</span>
                <span className="text-slate-200 font-bold">{isDemoMode ? "DEMO DATA / SIMULATION" : "LANDOWNER GPS CAPTURE"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">STATUS:</span>
                <span className="text-amber-400 font-bold">LANDOWNER-REPORTED / ESTIMATED</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">AREA SOURCE:</span>
                <span className="text-slate-200">CALCULATED FROM LANDOWNER GPS POLYGON</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">AREA STATUS:</span>
                <span className="text-amber-300">ESTIMATED</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              Notice: This boundary is self-reported by the landholder for grievance resolution and does not constitute official government cadastral survey data until verified by the Competent Authority (CALA).
            </p>
          </div>
        )}

        {/* Observation Notes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <label className="block text-xs font-semibold text-white">
            Landholder Observations / Boundary Markers (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Corner 1 is at the canal embankment, Corner 3 touches the neem tree, fenced with stone pillars..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
          />
        </div>

        {/* Confirmation Action Button */}
        <form onSubmit={handleSubmitBoundary} className="space-y-3 pt-2">
          <button
            type="submit"
            disabled={!isPolygonReady || submitting}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer ${
              isPolygonReady && !submitting
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/50"
                : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
            }`}
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Land Boundary...</span>
              </>
            ) : !isPolygonReady ? (
              <span>CAPTURE AT LEAST 4 POINTS TO CONFIRM BOUNDARY</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>CONFIRM & SAVE LAND BOUNDARY</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-slate-500 text-center">
            Persisted in official Land Record Database. Synchronized in real time with CALA Admin and Field Officers.
          </p>
        </form>

      </div>
    </LandownerShell>
  );
}
