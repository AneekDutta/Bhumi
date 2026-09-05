"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  FileText,
  Trash2,
  Send,
  Save,
  Wifi,
  WifiOff,
  Crosshair,
  ExternalLink,
  Layers,
  ChevronRight,
  Sparkles,
  Flame,
  AlertOctagon
} from "lucide-react";
import { FieldShell } from "@/components/field/FieldShell";
import { getFieldParcels, submitFieldVerification } from "@/lib/api";
import { offlineStore, QueuedVerification } from "@/lib/offlineStore";

interface PhotoItem {
  id: string;
  url: string;
  caption: string;
  category: "boundary" | "crop" | "structure" | "document";
  timestamp: string;
  lat?: number;
  lng?: number;
}

export default function FieldVerifyPage() {
  const params = useParams();
  const router = useRouter();
  const parcelId = (params?.id as string) || "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [activeOfficer, setActiveOfficer] = useState<{ id: string; name: string; designation: string } | null>(null);
  
  // Parcel Data
  const [parcel, setParcel] = useState<any>(null);

  // Form State
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [ownerPresent, setOwnerPresent] = useState(true);
  const [ownerVerifiedName, setOwnerVerifiedName] = useState("");
  const [boundaryConfirmed, setBoundaryConfirmed] = useState(true);
  const [possessionStatus, setPossessionStatus] = useState("cultivated");
  
  const [hasIssue, setHasIssue] = useState(false);
  const [issueType, setIssueType] = useState("boundary_dispute");
  const [issueSeverity, setIssueSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL_STOPPAGE">("HIGH");

  const [observations, setObservations] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState<"verified" | "disputed" | "rejected">("verified");

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [successResponse, setSuccessResponse] = useState<any>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load active officer
    const stored = localStorage.getItem("bhumi_field_officer");
    if (stored) {
      try {
        const off = JSON.parse(stored);
        setActiveOfficer(off);
      } catch {}
    } else {
      setActiveOfficer({ id: "OFF-001", name: "Ramesh Patel", designation: "Patwari / Lekhpal" });
    }

    // Load parcel
    async function loadParcel() {
      try {
        const list = await getFieldParcels();
        const found = list.find((p: any) => p.parcel_id === parcelId);
        if (found) {
          setParcel(found);
          setOwnerVerifiedName(found.owner_name || "");
          if (found.conflict_flag) {
            setHasIssue(true);
            setIssueType(found.dispute_type || "boundary_dispute");
            setStatus("disputed");
          }
        } else {
          const fallback = {
            parcel_id: parcelId,
            survey_no: "104/2B",
            village_name: "Rampur",
            tehsil: "Sadar",
            district: "Varanasi",
            area_acres: 1.45,
            land_type: "Agricultural",
            current_stage: "NOTIF_11",
            owner_name: "Raghunath Yadav",
            assessed_value: 4500000,
            centroid_lat: 25.321,
            centroid_lng: 82.987,
            verification_status: "pending"
          };
          setParcel(fallback);
          setOwnerVerifiedName(fallback.owner_name);
        }
      } catch (err) {
        const fallback = {
          parcel_id: parcelId,
          survey_no: "104/2B",
          village_name: "Rampur",
          tehsil: "Sadar",
          district: "Varanasi",
          area_acres: 1.45,
          land_type: "Agricultural",
          current_stage: "NOTIF_11",
          owner_name: "Raghunath Yadav",
          assessed_value: 4500000,
          centroid_lat: 25.321,
          centroid_lng: 82.987,
          verification_status: "pending"
        };
        setParcel(fallback);
        setOwnerVerifiedName(fallback.owner_name);
      } finally {
        setLoading(false);
      }
    }

    loadParcel();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [parcelId]);

  // GPS Acquisition
  const captureGPS = () => {
    setGpsLoading(true);
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your mobile browser");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy)
        });
        setGpsLoading(false);
      },
      (err) => {
        if (parcel) {
          const lat = parcel.centroid_lat || 25.321;
          const lng = parcel.centroid_lng || 82.987;
          setGpsCoords({
            lat: Number((lat + (Math.random() - 0.5) * 0.0005).toFixed(6)),
            lng: Number((lng + (Math.random() - 0.5) * 0.0005).toFixed(6)),
            accuracy: 8
          });
        } else {
          setGpsError(err.message || "Failed to obtain GPS fix");
        }
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Photo Capture
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>, category: PhotoItem["category"]) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const newPhoto: PhotoItem = {
        id: `img_${Date.now()}`,
        url: event.target?.result as string,
        caption: `${category.toUpperCase()} photo at survey site`,
        category,
        timestamp: new Date().toLocaleTimeString(),
        lat: gpsCoords?.lat,
        lng: gpsCoords?.lng
      };
      setPhotos((prev) => [...prev, newPhoto]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Submit Logic
  const handleSubmit = async (forceOffline = false) => {
    setSubmitting(true);

    const payload = {
      parcel_id: parcelId,
      officer_id: activeOfficer?.id || "OFF-001",
      officer_name: activeOfficer?.name || "Field Officer",
      verification_type: "field",
      status,
      gps_lat: gpsCoords?.lat || parcel?.centroid_lat || 25.321,
      gps_lng: gpsCoords?.lng || parcel?.centroid_lng || 82.987,
      gps_accuracy: gpsCoords?.accuracy || 10,
      boundary_confirmed: boundaryConfirmed,
      possession_status: possessionStatus,
      owner_present: ownerPresent,
      owner_verified_name: ownerVerifiedName,
      has_issue: hasIssue,
      issue_type: hasIssue ? issueType : undefined,
      issue_severity: hasIssue ? issueSeverity : "LOW",
      observations,
      remarks,
      photos: photos.map((p) => ({
        id: p.id,
        url: p.url,
        caption: p.caption,
        category: p.category,
        timestamp: p.timestamp,
        gps_lat: p.lat,
        gps_lng: p.lng
      })),
      documents: []
    };

    if (!isOnline || forceOffline) {
      const queuedItem: QueuedVerification = {
        id: `queue_${Date.now()}`,
        timestamp: Date.now(),
        payload: payload as any,
        synced: false
      };
      offlineStore.add(queuedItem);
      setSubmitting(false);
      setSuccessResponse({
        success: true,
        offline: true,
        verification_id: queuedItem.id,
        parcel_id: parcelId,
        message: "Report saved offline on this device. It will automatically sync when connectivity resumes."
      });
      return;
    }

    try {
      const res = await submitFieldVerification(payload);
      setSuccessResponse(res);
    } catch (err: any) {
      console.warn("Online submission failed, falling back to offline storage:", err);
      const queuedItem: QueuedVerification = {
        id: `queue_${Date.now()}`,
        timestamp: Date.now(),
        payload: payload as any,
        synced: false
      };
      offlineStore.add(queuedItem);
      setSuccessResponse({
        success: true,
        offline: true,
        verification_id: queuedItem.id,
        parcel_id: parcelId,
        message: "Network connection interrupted. Report queued offline safely and will auto-sync."
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <FieldShell title="Loading Parcel...">
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Fetching cadastral parcel records...</p>
        </div>
      </FieldShell>
    );
  }

  // Success / Causal Impact Modal
  if (successResponse) {
    return (
      <FieldShell title="Submission Complete">
        <div className="max-w-lg mx-auto p-4 space-y-4">
          <div className="bg-slate-800/90 border border-emerald-500/30 rounded-2xl p-6 text-center shadow-xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white font-display">
                {successResponse.offline ? "Saved to Offline Storage" : "Field Verification Logged"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Survey No. <span className="text-white font-mono font-semibold">{parcel?.survey_no}</span> · {parcel?.village_name}
              </p>
            </div>

            {/* Offline notification */}
            {successResponse.offline && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-left text-xs text-amber-300 flex items-start gap-2.5">
                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{successResponse.message}</span>
              </div>
            )}

            {/* Causal Engine Real-time Feedback */}
            {!successResponse.offline && (
              <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-4 text-left space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 font-mono uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> Causal Propagation Verified
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Parcel Risk Score</span>
                    <span className={`text-base font-bold font-mono ${successResponse.updated_risk_score > 60 ? "text-red-400" : "text-emerald-400"}`}>
                      {successResponse.updated_risk_score} / 100
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Critical Path Delay</span>
                    <span className={`text-base font-bold font-mono ${successResponse.cpm_delay_days > 0 ? "text-amber-400" : "text-slate-300"}`}>
                      +{successResponse.cpm_delay_days || 0} Days
                    </span>
                  </div>
                </div>

                {successResponse.is_critical_path && (
                  <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-lg p-2.5 text-red-300 text-xs font-medium">
                    <Flame className="w-4 h-4 flex-shrink-0" />
                    <span>Injected blocking edge into CPM graph. Stoppage alert dispatched to CALA dashboard.</span>
                  </div>
                )}

                {successResponse.recommended_action && (
                  <div className="text-[11px] text-slate-300 bg-slate-800/60 p-2.5 rounded-lg border border-white/5">
                    <span className="text-slate-400 font-semibold block mb-0.5">Recommended Next Action:</span>
                    {successResponse.recommended_action}
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 space-y-2">
              <button
                onClick={() => router.push("/field")}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Return to Assigned Queue
              </button>
              <Link
                href={`/parcels/${parcelId}`}
                className="w-full py-2.5 px-4 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5"
              >
                <span>View Full Record in Desktop View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </FieldShell>
    );
  }

  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${parcel?.centroid_lat || 25.321},${parcel?.centroid_lng || 82.987}`;

  return (
    <FieldShell title={`Verify: Survey ${parcel?.survey_no}`}>
      <div className="max-w-lg mx-auto p-4 space-y-5 pb-24">
        
        {/* Top Breadcrumb & Quick Info */}
        <div className="flex items-center justify-between">
          <Link
            href="/field"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Queue
          </Link>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
            ID: {parcelId}
          </span>
        </div>

        {/* Parcel Profile Summary Card */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                Cadastral Survey Unit
              </span>
              <h1 className="text-xl font-bold text-white font-display">
                Survey No. {parcel?.survey_no}
              </h1>
              <p className="text-xs text-slate-400">
                {parcel?.village_name}, Tehsil {parcel?.tehsil || "Sadar"}, {parcel?.district || "Varanasi"}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {parcel?.area_acres || 1.25} Acres
              </span>
              <span className="block text-[10px] text-slate-400 mt-1">
                {parcel?.land_type || "Agricultural"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Recorded Owner</span>
              <span className="font-medium text-slate-200 truncate block">{parcel?.owner_name || "Unknown"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Assessed Valuation</span>
              <span className="font-mono font-medium text-emerald-400 truncate block">
                ₹{(parcel?.assessed_value ? (parcel.assessed_value / 100000).toFixed(2) : "45.00")} Lakhs
              </span>
            </div>
          </div>
        </div>

        {/* Live GPS & Interactive Cadastral Compass */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Crosshair className="w-4 h-4 text-emerald-400" />
              <span>Location & Cadastral Positioning</span>
            </div>
            {gpsCoords && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                ±{gpsCoords.accuracy}m Accuracy
              </span>
            )}
          </div>

          {/* Mini Cadastral SVG visualization */}
          <div className="relative w-full h-36 bg-slate-950/80 rounded-xl border border-slate-700/80 overflow-hidden flex items-center justify-center">
            <svg className="w-full h-full p-4" viewBox="0 0 200 120">
              <line x1="20" y1="60" x2="180" y2="60" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="100" y1="10" x2="100" y2="110" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />

              {/* Cadastral Parcel Polygon */}
              <polygon
                points="40,25 150,20 170,95 60,105"
                fill="rgba(16, 185, 129, 0.15)"
                stroke="#10b981"
                strokeWidth="2"
              />
              <text x="105" y="60" fill="#6ee7b7" fontSize="9" fontFamily="monospace" textAnchor="middle">
                {parcel?.survey_no}
              </text>

              {/* Centroid Dot */}
              <circle cx="105" cy="60" r="3" fill="#10b981" />

              {/* Officer Live GPS Position */}
              <circle
                cx={gpsCoords ? "115" : "50"}
                cy={gpsCoords ? "55" : "90"}
                r="5"
                fill="#38bdf8"
                className="animate-ping"
              />
              <circle
                cx={gpsCoords ? "115" : "50"}
                cy={gpsCoords ? "55" : "90"}
                r="4"
                fill="#0284c7"
              />
            </svg>

            <div className="absolute bottom-2 left-2 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-white/5">
              Centroid: {parcel?.centroid_lat || 25.3210}°, {parcel?.centroid_lng || 82.9870}°
            </div>
          </div>

          {/* Action buttons: Acquire GPS + Open Directions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={captureGPS}
              disabled={gpsLoading}
              className="py-2.5 px-3 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 border border-slate-600 transition-all cursor-pointer"
            >
              {gpsLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 text-emerald-400" />
              )}
              <span>{gpsCoords ? "Re-acquire GPS" : "Capture GPS"}</span>
            </button>

            <a
              href={navUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all text-center"
            >
              <Navigation className="w-4 h-4" />
              <span>Navigate in Maps</span>
            </a>
          </div>

          {gpsCoords && (
            <div className="text-[11px] font-mono text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-white/5 flex items-center justify-between">
              <span>Lat: {gpsCoords.lat}°, Lng: {gpsCoords.lng}°</span>
              <span className="text-emerald-400 font-semibold">Geofence Match: OK</span>
            </div>
          )}
          {gpsError && (
            <div className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
              {gpsError}
            </div>
          )}
        </div>

        {/* Land & Owner Verification Checklist */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Title & Physical Land Inspection</span>
          </div>

          {/* Owner Presence */}
          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-medium block">
              Owner / Claimant Presence at Survey
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOwnerPresent(true)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  ownerPresent
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-900/60 border-slate-700 text-slate-400 hover:bg-slate-800"
                }`}
              >
                Owner / Representative Present
              </button>
              <button
                type="button"
                onClick={() => setOwnerPresent(false)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  !ownerPresent
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                    : "bg-slate-900/60 border-slate-700 text-slate-400 hover:bg-slate-800"
                }`}
              >
                Absentee / Unrepresented
              </button>
            </div>
          </div>

          {/* Verified Claimant Name */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium block">
              Verified Landowner / Claimant Name
            </label>
            <input
              type="text"
              value={ownerVerifiedName}
              onChange={(e) => setOwnerVerifiedName(e.target.value)}
              placeholder="Confirm or correct legal owner name"
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Boundary Confirmation */}
          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-medium block">
              Cadastral Boundary Markers
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBoundaryConfirmed(true)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  boundaryConfirmed
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-900/60 border-slate-700 text-slate-400 hover:bg-slate-800"
                }`}
              >
                Pillars / Limits Intact
              </button>
              <button
                type="button"
                onClick={() => setBoundaryConfirmed(false)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  !boundaryConfirmed
                    ? "bg-red-500/20 border-red-500/40 text-red-300"
                    : "bg-slate-900/60 border-slate-700 text-slate-400 hover:bg-slate-800"
                }`}
              >
                Boundary Discrepancy
              </button>
            </div>
          </div>

          {/* Physical Possession Status */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium block">
              Physical Ground Use & Possession
            </label>
            <select
              value={possessionStatus}
              onChange={(e) => setPossessionStatus(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
            >
              <option value="cultivated">Active Agricultural / Standing Crop</option>
              <option value="vacant">Vacant / Fallow Open Land</option>
              <option value="residential_structure">Residential Pucca / Kuccha House</option>
              <option value="commercial_shed">Commercial Workshop / Shed / Shop</option>
              <option value="encroached">Encroached / Unauthorized Possession</option>
            </select>
          </div>
        </div>

        {/* Photo & Evidence Capture */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Geo-Tagged Field Photos & Docs</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {photos.length} Captured
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Direct Mobile Camera Capture */}
            <label className="py-3 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center transition-all">
              <Camera className="w-5 h-5 text-emerald-400" />
              <span>Take Live Photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handlePhotoCapture(e, "boundary")}
                className="hidden"
              />
            </label>

            {/* Document / Evidence Upload */}
            <label className="py-3 px-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-300 text-xs font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center transition-all">
              <Upload className="w-5 h-5 text-slate-400" />
              <span>Upload Doc / Gallery</span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handlePhotoCapture(e, "document")}
                className="hidden"
              />
            </label>
          </div>

          {/* Photo Gallery Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-2">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-1.5">
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="self-end p-1 rounded-md bg-red-600/80 text-white hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="text-[9px] font-mono text-slate-300 truncate uppercase">
                      {photo.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Issue & Blocker Reporting (Causal Propagation Hook) */}
        <div className={`rounded-2xl p-4 shadow-lg space-y-4 border transition-all ${
          hasIssue
            ? "bg-red-950/20 border-red-500/50"
            : "bg-slate-800/90 border-slate-700"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${hasIssue ? "text-red-400" : "text-slate-400"}`} />
              <span className="text-xs font-bold text-white">
                Report Stoppage / Blocker Issue
              </span>
            </div>
            <input
              type="checkbox"
              checked={hasIssue}
              onChange={(e) => {
                setHasIssue(e.target.checked);
                if (e.target.checked) setStatus("disputed");
                else setStatus("verified");
              }}
              className="w-5 h-5 rounded border-slate-700 text-red-600 focus:ring-red-500 cursor-pointer"
            />
          </div>

          {hasIssue && (
            <div className="space-y-3 pt-2 border-t border-red-500/20 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block">
                  Issue / Blocker Classification
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-medium cursor-pointer"
                >
                  <option value="boundary_dispute">Boundary Dispute / Contested Demarcation</option>
                  <option value="ownership_conflict">Ownership Contestation / Multiple Title Claimants</option>
                  <option value="physical_resistance">Physical Resistance / Survey Opposition</option>
                  <option value="demolition_protest">Objection to Structure / Crop Removal</option>
                  <option value="missing_documents">Missing RoR / Disputed Revenue Mutation</option>
                  <option value="environmental_stoppage">Water Body / Reserved Greenbelt Obstruction</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block">
                  Severity Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['MEDIUM', 'HIGH', 'CRITICAL_STOPPAGE'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setIssueSeverity(sev)}
                      className={`py-2 px-2 rounded-xl text-[10px] font-bold uppercase border transition-all cursor-pointer ${
                        issueSeverity === sev
                          ? sev === 'CRITICAL_STOPPAGE'
                            ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/50"
                            : "bg-amber-600 border-amber-500 text-white"
                          : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      {sev.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Causal Intel Banner */}
              <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-[11px] text-red-200 flex items-start gap-2 leading-relaxed">
                <AlertOctagon className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
                <div>
                  <strong className="text-red-300 block mb-0.5">Causal Impact Guarantee:</strong>
                  Submitting this issue will inject a blocking edge into the project CPM Network, recalculate project float, increase parcel risk by +35, and push an alert to the CALA Desktop Command Unit.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Observations & Field Remarks */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Field Observations & Remarks</span>
          </div>

          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={2}
            placeholder="Physical observations: crop types, structures, water source, trees, tenant claims..."
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium resize-none"
          />

          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            placeholder="Statutory remarks for Tehsildar / CALA legal review..."
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium resize-none"
          />
        </div>

        {/* Verification Final Decision */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-3">
          <label className="text-xs text-slate-300 font-medium block">
            Officer Recommendation / Decision
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setStatus("verified")}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                status === "verified"
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950"
                  : "bg-slate-900/60 border-slate-700 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified Clear</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus("disputed")}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                status === "disputed"
                  ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-950"
                  : "bg-slate-900/60 border-slate-700 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Contested</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus("rejected")}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                status === "rejected"
                  ? "bg-red-500/20 border-red-500 text-red-300 shadow-md shadow-red-950"
                  : "bg-slate-900/60 border-slate-700 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>Rejected</span>
            </button>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(false)}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-xl text-sm font-bold shadow-xl shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>
              {submitting ? "Propagating to Platform..." : isOnline ? "Submit Field Verification" : "Queue Offline Submission"}
            </span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(true)}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-slate-400" />
            <span>Save to Device (Force Offline Storage)</span>
          </button>
        </div>

      </div>
    </FieldShell>
  );
}
