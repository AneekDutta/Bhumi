"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Map, { Source, Layer, Marker, NavigationControl, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { 
  ArrowLeft, 
  MapPin, 
  Compass, 
  UploadCloud, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Send, 
  ShieldCheck, 
  Crosshair, 
  Info,
  Layers,
  PlusCircle,
  FileCheck2,
  Lock
} from "lucide-react";
import { LandownerShell } from "@/components/landowner/LandownerShell";
import { 
  getLandownerParcels, 
  submitLandownerComplaint, 
  uploadEvidenceDocument 
} from "@/lib/api";
import { getCurrentGPSPosition, LocationCoordinates } from "@/lib/native/geolocation";
import { useTheme } from "@/context/ThemeContext";

const DARK_MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const LIGHT_MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export default function NewLandownerComplaintPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedParcel = searchParams.get("parcel_id");
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const mapRef = useRef<MapRef | null>(null);

  // Authenticated state & parcels
  const [currentUser, setCurrentUser] = useState<any>({ user_id: "", name: "Citizen Landowner", email: "", village: "Corridor Sector" });
  const [parcels, setParcels] = useState<any[]>([]);
  const [selectedParcelId, setSelectedParcelId] = useState<string>("");
  const [loadingParcels, setLoadingParcels] = useState<boolean>(true);

  // Complaint Form Fields
  const [category, setCategory] = useState<string>("BOUNDARY_DISPUTE");
  const [priority, setPriority] = useState<"NORMAL" | "URGENT" | "CRITICAL">("NORMAL");
  const [description, setDescription] = useState<string>("");

  // Supporting Evidence File
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [docCategory, setDocCategory] = useState<string>("title_deed");

  // GPS filing coordinates
  const [filingGps, setFilingGps] = useState<{ lat: number; lng: number; accuracy?: number; timestamp: string } | null>(null);
  const [capturingGps, setCapturingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitPhase, setSubmitPhase] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Read session and fetch user's registered parcels
  useEffect(() => {
    async function init() {
      setLoadingParcels(true);

      let activeUserId = "";
      let activeName = "Citizen Landowner";
      let activeEmail = "";
      let activeVillage = "Corridor Sector";

      const cookies = document.cookie.split(";").map((c) => c.trim());
      const sessionCookie = cookies.find(
        (c) => c.startsWith("bhumi_landowner_session=") || c.startsWith("bhumi_officer_session=")
      );

      if (sessionCookie) {
        try {
          const val = decodeURIComponent(sessionCookie.split("=")[1]);
          const parsed = JSON.parse(val);
          if (parsed?.user_id || parsed?.owner_id) {
            activeUserId = parsed.user_id || parsed.owner_id;
            activeName = parsed.name || activeName;
            activeEmail = parsed.email || activeEmail;
            activeVillage = parsed.contact_village || parsed.village || activeVillage;
          }
        } catch {}
      }

      if (!activeUserId) {
        router.push("/landowner/login");
        return;
      }

      setCurrentUser({
        user_id: activeUserId,
        name: activeName,
        email: activeEmail,
        village: activeVillage
      });

      try {
        const pData = await getLandownerParcels(activeUserId);
        setParcels(pData || []);

        if (pData && pData.length > 0) {
          if (preselectedParcel && pData.some((p: any) => p.parcel_id === preselectedParcel || p.id === preselectedParcel)) {
            setSelectedParcelId(preselectedParcel);
          } else {
            setSelectedParcelId(pData[0].parcel_id || pData[0].id);
          }
        }
      } catch (err) {
        console.warn("Could not load registered parcels:", err);
      } finally {
        setLoadingParcels(false);
      }
    }

    init();
  }, [preselectedParcel, router]);

  // The active selected registered parcel object
  const activeParcel = useMemo(() => {
    if (!parcels || parcels.length === 0) return null;
    return parcels.find((p) => p.parcel_id === selectedParcelId || p.id === selectedParcelId) || parcels[0];
  }, [parcels, selectedParcelId]);

  // GeoJSON Polygon from the selected parcel
  const parcelGeoJson = useMemo(() => {
    if (!activeParcel) return null;
    if (activeParcel.geometry) {
      return {
        type: "Feature" as const,
        properties: {},
        geometry: activeParcel.geometry
      };
    }
    if (activeParcel.coordinates && activeParcel.coordinates.length >= 3) {
      const ring = [
        ...activeParcel.coordinates.map((p: any) => [p.lng, p.lat]),
        [activeParcel.coordinates[0].lng, activeParcel.coordinates[0].lat]
      ];
      return {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "Polygon" as const,
          coordinates: [ring]
        }
      };
    }
    return null;
  }, [activeParcel]);

  // Centroid of the registered parcel
  const parcelCentroid = useMemo(() => {
    if (activeParcel?.coordinates && activeParcel.coordinates.length > 0) {
      const avgLat = activeParcel.coordinates.reduce((s: number, p: any) => s + p.lat, 0) / activeParcel.coordinates.length;
      const avgLng = activeParcel.coordinates.reduce((s: number, p: any) => s + p.lng, 0) / activeParcel.coordinates.length;
      return { lat: avgLat, lng: avgLng };
    }
    return { lat: 24.6492, lng: 75.9284 };
  }, [activeParcel]);

  // Handle GPS location capture for filing verification
  const handleCaptureFilingGPS = async () => {
    setGpsError(null);
    setCapturingGps(true);
    try {
      const pos = await getCurrentGPSPosition({ enableHighAccuracy: true, timeout: 10000 });
      setFilingGps({
        lat: Number(pos.lat.toFixed(6)),
        lng: Number(pos.lng.toFixed(6)),
        accuracy: pos.accuracy ? Number(pos.accuracy.toFixed(1)) : undefined,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      setGpsError(err?.message || "Could not acquire current GPS position.");
    } finally {
      setCapturingGps(false);
    }
  };

  // Handle Evidence File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEvidenceFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setEvidencePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setEvidencePreview(null);
      }
    }
  };

  // Submit Complaint
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!activeParcel) {
      setErrorMsg("A complaint can only be filed against a registered parcel.");
      return;
    }

    if (description.trim().length < 15) {
      setErrorMsg("Please provide a detailed description (at least 15 characters) of your grievance.");
      return;
    }

    if (!evidenceFile) {
      setErrorMsg("Please attach at least one supporting evidence document or on-site photograph.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Upload evidence document
      setSubmitPhase("Uploading supporting evidence to secure storage...");
      const sanitizedName = evidenceFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const docMetadata = await uploadEvidenceDocument(evidenceFile, sanitizedName, activeParcel.parcel_id);

      const docRecord = {
        ...docMetadata,
        document_category: docCategory,
        classification: "LANDOWNER-SUBMITTED / UNVERIFIED",
        uploaded_at: new Date().toISOString()
      };

      // 2. Submit complaint bound to the 14-digit Parcel ID
      setSubmitPhase("Registering statutory grievance in Land Records Registry...");
      const payload = {
        owner_id: currentUser.user_id,
        owner_name: activeParcel.owner_legal_name || activeParcel.owner_name || currentUser.name,
        contact_village: activeParcel.village_name || activeParcel.contact_village || currentUser.village,
        parcel_id: activeParcel.parcel_id,
        survey_number: activeParcel.survey_number || `Survey #${activeParcel.parcel_id.slice(-4)}`,
        complaint_type: category,
        description: description.trim(),
        priority: priority,
        document_evidence: docRecord,
        landowner_documents: [docRecord],
        gps: filingGps || {
          lat: parcelCentroid.lat,
          lng: parcelCentroid.lng,
          accuracy: undefined,
          captured_at: new Date().toISOString()
        },
        landowner_reported_location: {
          lat: parcelCentroid.lat,
          lng: parcelCentroid.lng,
          accuracy: activeParcel.coordinates?.[0]?.accuracy || 5.0,
          timestamp: new Date().toISOString()
        },
        // Automatically link the already registered parcel boundary without requiring redrawing!
        landowner_reported_boundary: {
          points: activeParcel.coordinates || [],
          polygon: activeParcel.geometry || activeParcel.geom,
          area_sqm: activeParcel.area_sqm,
          area_acres: activeParcel.area_acres,
          area_hectares: activeParcel.area_hectares
        },
        landowner_declared_area: {
          sqm: activeParcel.area_sqm,
          acres: activeParcel.area_acres,
          hectares: activeParcel.area_hectares,
          label: "LANDOWNER-REPORTED / ESTIMATED"
        }
      };

      const result = await submitLandownerComplaint(payload);

      if (!result?.success) {
        throw new Error(result?.message || "Failed to lodge grievance in database.");
      }

      setSubmitPhase("Grievance registered successfully! Status: SUBMITTED — AWAITING FIELD REVIEW");
      setTimeout(() => {
        router.push(`/landowner/complaints/${result.complaint_id}`);
      }, 700);

    } catch (err: any) {
      console.error("Grievance error:", err);
      setErrorMsg(err?.message || "An unexpected error occurred while submitting your grievance.");
      setSubmitting(false);
      setSubmitPhase(null);
    }
  };

  if (loadingParcels) {
    return (
      <LandownerShell title="File Land Complaint">
        <div className="py-24 text-center text-xs text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
          <span>Verifying registered land parcels...</span>
        </div>
      </LandownerShell>
    );
  }

  // =========================================================================
  // BLOCKER: PARCEL REGISTRATION MUST HAPPEN BEFORE COMPLAINTS
  // =========================================================================
  if (parcels.length === 0) {
    return (
      <LandownerShell title="File Land Complaint">
        <div className="p-4 max-w-lg mx-auto space-y-4 pb-24">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-2 max-w-sm mx-auto">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Statutory Requirement
              </span>
              <h1 className="text-lg font-bold text-white font-display">
                Parcel Registration Required Before Filing a Complaint
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                Under official land dispute procedures, a citizen must first <strong>register a parcel of land</strong>, verify their identity via Aadhaar, and demarcate boundary coordinates before a complaint can be lodged against that parcel.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left text-xs space-y-1.5 font-mono text-slate-400">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>Statutory Workflow:</span>
              </div>
              <p className="pl-6 text-[11px]">
                1. Register Parcel → 2. Aadhaar Identity → 3. Demarcate 4+ GPS Corners → 4. Obtain 14-Digit Parcel ID → 5. File Grievance.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <Link
                href="/landowner/parcels/new"
                className="w-full py-3.5 px-4 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 text-xs shadow-lg shadow-amber-400/20"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>REGISTER NEW PARCEL NOW</span>
              </Link>

              <Link
                href="/landowner/home"
                className="w-full py-2.5 px-4 rounded-xl text-slate-400 hover:text-white transition-colors flex items-center justify-center text-xs"
              >
                <span>Return to Landowner Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </LandownerShell>
    );
  }

  // =========================================================================
  // MAIN FORM: REGISTERED PARCEL SELECTED -> COMPLAINT SUBMISSION
  // =========================================================================
  return (
    <LandownerShell title="File Land Complaint">
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-28">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/landowner/home"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 border border-slate-800 px-3 py-1.5 rounded-xl bg-slate-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </Link>
          <span className="text-xs text-slate-400">Step 2: Lodge Grievance</span>
        </div>

        {/* Selected Registered Parcel Summary Card */}
        {activeParcel && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono">
                CONCERNS REGISTERED PARCEL
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Verified Land Record
              </span>
            </div>

            {/* Parcel Dropdown if user has multiple parcels */}
            {parcels.length > 1 ? (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Switch Registered Parcel:</label>
                <select
                  value={selectedParcelId}
                  onChange={(e) => setSelectedParcelId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                >
                  {parcels.map((p) => (
                    <option key={p.parcel_id || p.id} value={p.parcel_id || p.id}>
                      Parcel #{p.parcel_id || p.id} - {p.owner_legal_name || p.owner_name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="font-mono text-xl font-extrabold text-white tracking-wider">
                Parcel ID: {activeParcel.parcel_id || activeParcel.id}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
              <div>
                <span className="text-slate-500 block text-[10px]">VERIFIED OWNER</span>
                <span className="text-white font-bold">{activeParcel.owner_legal_name || activeParcel.owner_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">VILLAGE / REVENUE MAUZA</span>
                <span className="text-white">{activeParcel.village_name || activeParcel.contact_village}</span>
              </div>
            </div>

            {/* Map Preview of the Registered Polygon */}
            <div className="h-44 w-full rounded-xl overflow-hidden border border-slate-800 relative mt-2">
              <Map
                ref={mapRef}
                initialViewState={{
                  longitude: parcelCentroid.lng,
                  latitude: parcelCentroid.lat,
                  zoom: 16.5
                }}
                mapStyle={isLight ? LIGHT_MAP_STYLE : DARK_MAP_STYLE}
                cooperativeGestures={true}
              >
                <NavigationControl position="top-right" showCompass={false} />

                {activeParcel.coordinates?.map((pt: any, idx: number) => (
                  <Marker key={idx} longitude={pt.lng} latitude={pt.lat} anchor="center">
                    <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-bold font-mono text-[9px] flex items-center justify-center shadow border border-white">
                      P{pt.sequence || idx + 1}
                    </div>
                  </Marker>
                ))}

                {parcelGeoJson && (
                  <Source type="geojson" data={parcelGeoJson}>
                    <Layer
                      id="registered-fill"
                      type="fill"
                      paint={{
                        "fill-color": "#f59e0b",
                        "fill-opacity": 0.25
                      }}
                    />
                    <Layer
                      id="registered-line"
                      type="line"
                      paint={{
                        "line-color": "#f59e0b",
                        "line-width": 2.5
                      }}
                    />
                  </Source>
                )}
              </Map>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 text-[10px]">
                Registered Area: {activeParcel.area_sqm?.toLocaleString()} m² ({activeParcel.coordinates?.length || 4} Corners)
              </span>
              <span className="text-emerald-400 text-[10px] font-bold">
                Auto-Linked
              </span>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              * The registered parcel boundary coordinates and polygon are automatically attached to this grievance. Redrawing is not required.
            </p>
          </div>
        )}

        {/* Complaint Form */}
        <form onSubmit={handleSubmitComplaint} className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Grievance Details</span>
            </h2>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Grievance Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="BOUNDARY_DISPUTE">Boundary & Demarcation Dispute</option>
                <option value="COMPENSATION_DELAY">Compensation Payment Delay / Calculation Error</option>
                <option value="OWNERSHIP_CONFLICT">Ownership / Succession / Co-sharer Dispute</option>
                <option value="ENCROACHMENT">Physical Encroachment / ROW Trespass</option>
                <option value="RR_ENTITLEMENT">Rehabilitation & Resettlement (R&R) Discrepancy</option>
                <option value="OTHER_STATUTORY">Other Statutory Land Grievance</option>
              </select>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Urgency Priority</label>
              <div className="grid grid-cols-3 gap-2">
                {(["NORMAL", "URGENT", "CRITICAL"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setPriority(lvl)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                      priority === lvl
                        ? lvl === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500"
                          : lvl === "URGENT"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500"
                          : "bg-blue-500/20 text-blue-300 border-blue-500"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Detailed Statement of Grievance <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the specific issue regarding boundary demarcation, award compensation, or survey records..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <span className="text-[10px] text-slate-500 block text-right">
                {description.trim().length}/15 characters minimum
              </span>
            </div>

            {/* Upload Supporting Evidence Document */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Attach Supporting Evidence Document / Photo <span className="text-rose-400">*</span>
              </label>

              <div className="border-2 border-dashed border-slate-700 hover:border-amber-400/60 rounded-2xl p-4 text-center transition-colors bg-slate-950/50">
                <input
                  type="file"
                  id="evidence-upload"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="evidence-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-white"
                >
                  <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-amber-400 block text-xs">
                      {evidenceFile ? evidenceFile.name : "Tap to Attach Document / Ground Photo"}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {evidenceFile ? `${(evidenceFile.size / 1024).toFixed(0)} KB attached` : "PDF, JPG, PNG up to 50MB"}
                    </span>
                  </div>
                </label>
              </div>

              {evidencePreview && (
                <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-700 h-32 w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={evidencePreview} alt="Evidence preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Optional Current Location Fix */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Current Ground Location</span>
                  <span className="text-[10px] text-slate-500 block">Optional location check of applicant</span>
                </div>
                <button
                  type="button"
                  disabled={capturingGps}
                  onClick={handleCaptureFilingGPS}
                  className="py-1.5 px-3 rounded-lg text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {capturingGps ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
                  <span>{filingGps ? "Re-acquire GPS" : "Get GPS Fix"}</span>
                </button>
              </div>

              {filingGps && (
                <div className="text-[11px] font-mono text-emerald-400 pt-1">
                  Location Captured: {filingGps.lat.toFixed(6)}, {filingGps.lng.toFixed(6)} {filingGps.accuracy ? `(±${filingGps.accuracy}m)` : ""}
                </div>
              )}
              {gpsError && (
                <div className="text-[11px] text-rose-400">{gpsError}</div>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {submitPhase && (
            <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl text-xs text-amber-300 flex items-center gap-2 font-mono">
              <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
              <span>{submitPhase}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || description.trim().length < 15 || !evidenceFile}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 text-xs disabled:opacity-50 shadow-lg shadow-amber-400/20"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Submitting Statutory Grievance...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>SUBMIT STATUTORY GRIEVANCE</span>
              </>
            )}
          </button>
        </form>

      </div>
    </LandownerShell>
  );
}
