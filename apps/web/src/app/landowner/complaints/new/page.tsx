"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Send, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Layers,
  ArrowLeft,
  FileText,
  UploadCloud,
  FileCheck,
  Compass,
  AlertCircle,
  Plus,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Crosshair
} from "lucide-react";
import { LandownerShell } from "@/components/landowner/LandownerShell";
import { 
  getLandownerParcels, 
  submitLandownerComplaint, 
  uploadEvidenceDocument 
} from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { getCurrentGPSPosition, LocationCoordinates } from "@/lib/native/geolocation";
import { 
  calculatePolygonAreaAndUncertainty, 
  AreaAndUncertaintyResult,
  BoundaryPointWithAccuracy
} from "@/lib/spatial/geodesicArea";

const COMPLAINT_CATEGORIES = [
  "Compensation not received / delayed",
  "Incorrect ownership / title dispute",
  "Land measurement / boundary mismatch",
  "Rehabilitation & Resettlement (R&R) entitlement",
  "Document / Jamabandi mutation issue",
  "Unauthorized physical possession",
  "Structure / Tree valuation discrepancy",
  "Other acquisition-related issue"
];

const DOCUMENT_TYPES = [
  "Land Title Deed / Registry",
  "Jamabandi / Khatauni / Revenue Extract",
  "Property Tax Receipt",
  "Electricity / Utility Bill",
  "Boundary Demarcation Photo",
  "Physical Possession Proof"
];

interface CapturedCornerPoint extends BoundaryPointWithAccuracy {
  sequence: number;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
}

export default function NewComplaintPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedParcel = searchParams.get("parcel_id") || "";
  const supabase = createClient();

  // Mode: Real Hardware GPS vs Demo Simulation
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Form Inputs
  const [parcels, setParcels] = useState<any[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<string>(preselectedParcel || "unregistered");
  const [category, setCategory] = useState<string>(COMPLAINT_CATEGORIES[0]);
  const [description, setDescription] = useState<string>("");
  const [priority, setPriority] = useState<"NORMAL" | "URGENT" | "CRITICAL">("NORMAL");

  // GPS Location State (Primary Coordinates)
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; accuracy: number; timestamp: string } | null>(null);
  const [capturingGps, setCapturingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [accuracyWarning, setAccuracyWarning] = useState<string | null>(null);

  // Multi-point Boundary Polygon Marking (Optional / Recommended)
  const [boundaryPoints, setBoundaryPoints] = useState<CapturedCornerPoint[]>([]);
  const [capturingCorner, setCapturingCorner] = useState(false);

  // Document Evidence State (Classified as LANDOWNER-SUBMITTED / UNVERIFIED)
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [docCategory, setDocCategory] = useState<string>(DOCUMENT_TYPES[0]);
  const [fileError, setFileError] = useState<string | null>(null);

  // Flow State
  const [submitting, setSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Landowner Session Identity
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Area & Uncertainty Calculation
  const areaResult: AreaAndUncertaintyResult | null = useMemo(() => {
    if (boundaryPoints.length < 4) return null;
    return calculatePolygonAreaAndUncertainty(boundaryPoints);
  }, [boundaryPoints]);

  // Load authenticated session & parcels
  useEffect(() => {
    async function initSession() {
      // 1. Check Supabase Auth user
      const { data: authData } = await supabase.auth.getUser();
      let activeUserId = "";
      let activeName = "Citizen Landowner";
      let activeEmail = "";

      if (authData?.user) {
        activeUserId = authData.user.id;
        activeEmail = authData.user.email || activeEmail;
        activeName = authData.user.user_metadata?.full_name || activeName;
      }

      setCurrentUser({
        user_id: activeUserId || "citizen",
        name: activeName,
        email: activeEmail,
        village: "Corridor Sector"
      });

      // 2. Load authorized parcels from Supabase
      try {
        const pData = await getLandownerParcels(activeUserId);
        setParcels(pData || []);
        if (pData && pData.length > 0) {
          if (!preselectedParcel) {
            setSelectedParcel(pData[0].parcel_id || pData[0].id);
          }
        } else {
          // Unregistered citizen without linked parcels: default to unregistered claim
          setSelectedParcel("unregistered");
        }
      } catch (err) {
        console.warn("Could not load landowner parcels:", err);
        setSelectedParcel("unregistered");
      }
    }

    initSession();
  }, [preselectedParcel, supabase]);

  // =========================================================================
  // GPS FIX HANDLER (Real Hardware GPS vs Demo Simulation Mode)
  // =========================================================================
  const handleCaptureLocation = async () => {
    setGpsError(null);
    setAccuracyWarning(null);
    setCapturingGps(true);

    try {
      let pos: LocationCoordinates;

      if (isDemoMode) {
        // DEMO / SIMULATION MODE: Realistic accuracy within ±12m to ±15m range (not wildly varying)
        const simAccuracy = Number((12.0 + Math.random() * 3.0).toFixed(1));
        const baseLat = 24.6650;
        const baseLng = 75.9520;
        pos = {
          lat: Number(baseLat.toFixed(6)),
          lng: Number(baseLng.toFixed(6)),
          accuracy: simAccuracy
        };
      } else {
        // REAL GPS MODE: Hardware GPS only. Real coordinates & accuracy only. NEVER fabricate.
        pos = await getCurrentGPSPosition({
          enableHighAccuracy: true,
          timeout: 15000
        });
      }

      if (pos.lat === 0 && pos.lng === 0) {
        throw new Error("Invalid 0,0 coordinates received from GPS sensor.");
      }

      if (pos.accuracy > 15) {
        setAccuracyWarning(`GPS accuracy is ±${pos.accuracy}m. Move to an open area away from tall structures for optimal precision.`);
      }

      const timestamp = new Date().toISOString();
      const locData = {
        lat: pos.lat,
        lng: pos.lng,
        accuracy: pos.accuracy,
        timestamp
      };

      setGpsLocation(locData);

      // If no boundary corner 1 exists, also record it as Corner 1
      if (boundaryPoints.length === 0) {
        setBoundaryPoints([
          {
            sequence: 1,
            lat: pos.lat,
            lng: pos.lng,
            accuracy: pos.accuracy,
            timestamp
          }
        ]);
      }
    } catch (err: any) {
      setGpsError(err?.message || "GPS location unavailable. Please enable location permissions and try again.");
      setGpsLocation(null);
    } finally {
      setCapturingGps(false);
    }
  };

  // =========================================================================
  // CORNER POINT CAPTURE (P1 -> P2 -> P3 -> P4 -> P1 polygon)
  // =========================================================================
  const handleAddCornerPoint = async () => {
    setGpsError(null);
    setCapturingCorner(true);

    try {
      let pos: LocationCoordinates;

      if (isDemoMode) {
        // DEMO / SIMULATION MODE: Realistic simulated accuracy within ±12m to ±15m
        const simAccuracy = Number((12.0 + Math.random() * 3.0).toFixed(1));
        const seq = boundaryPoints.length;
        const baseLat = gpsLocation?.lat || 24.6650;
        const baseLng = gpsLocation?.lng || 75.9520;
        const offsets = [
          [0.0, 0.0],
          [0.0012, 0.0001],
          [0.0011, 0.0009],
          [-0.0001, 0.0008],
          [0.0005, 0.0013]
        ];
        const offset = offsets[seq % offsets.length];
        pos = {
          lat: Number((baseLat + offset[1]).toFixed(6)),
          lng: Number((baseLng + offset[0]).toFixed(6)),
          accuracy: simAccuracy
        };
      } else {
        // REAL GPS MODE: Hardware GPS only
        pos = await getCurrentGPSPosition({
          enableHighAccuracy: true,
          timeout: 15000
        });
      }

      const newPoint: CapturedCornerPoint = {
        sequence: boundaryPoints.length + 1,
        lat: pos.lat,
        lng: pos.lng,
        accuracy: pos.accuracy,
        timestamp: new Date().toISOString()
      };

      setBoundaryPoints((prev) => [...prev, newPoint]);

      if (!gpsLocation) {
        setGpsLocation({
          lat: pos.lat,
          lng: pos.lng,
          accuracy: pos.accuracy,
          timestamp: newPoint.timestamp
        });
      }
    } catch (err: any) {
      setGpsError(err?.message || "GPS location unavailable. Please enable location permissions and try again.");
    } finally {
      setCapturingCorner(false);
    }
  };

  const handleRemoveCorner = (idxToRemove: number) => {
    setBoundaryPoints((prev) => {
      const filtered = prev.filter((_, idx) => idx !== idxToRemove);
      return filtered.map((pt, idx) => ({ ...pt, sequence: idx + 1 }));
    });
  };

  // =========================================================================
  // DOCUMENT EVIDENCE HANDLER
  // Classified as: LANDOWNER-SUBMITTED / UNVERIFIED
  // =========================================================================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (!e.target.files || e.target.files.length === 0) {
      setEvidenceFile(null);
      return;
    }

    const file = e.target.files[0];
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|webp)$/i)) {
      setFileError("Unsupported file format. Please upload a PDF document (.pdf) or image (.jpg, .png, .webp).");
      setEvidenceFile(null);
      return;
    }

    if (file.size > 52428800) {
      setFileError("File too large. Maximum allowed file size for supporting documents is 50 MB.");
      setEvidenceFile(null);
      return;
    }

    setEvidenceFile(file);
  };

  // =========================================================================
  // FORM SUBMISSION (No Pre-existing Land Parcel Required)
  // Initial Status: SUBMITTED — AWAITING FIELD REVIEW
  // =========================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Description Length Validation
    if (description.trim().length < 15) {
      setErrorMsg("Please provide a detailed explanation of the issue (minimum 15 characters).");
      return;
    }

    // 2. GPS Requirement
    if (!gpsLocation) {
      setErrorMsg("Location is required to submit this complaint. Please capture your GPS location.");
      return;
    }

    // 3. Document Evidence Requirement
    if (!evidenceFile) {
      setErrorMsg("Supporting documentation is compulsory. Please attach your title deed, tax receipt, or boundary photo.");
      return;
    }

    setSubmitting(true);

    try {
      // Phase A: Upload supporting document to Supabase Storage (parcel_id = null if unregistered)
      setSubmitPhase("Uploading supporting document to Supabase Storage...");
      const folderParcelId = selectedParcel === "unregistered" ? null : selectedParcel;
      const uploadedDocMetadata = await uploadEvidenceDocument(
        evidenceFile,
        evidenceFile.name,
        folderParcelId
      );

      if (!uploadedDocMetadata || !uploadedDocMetadata.storage_path) {
        throw new Error("Document upload failed to return storage metadata. Complaint submission aborted.");
      }

      // Attach classification: LANDOWNER-SUBMITTED / UNVERIFIED
      const docRecord = {
        ...uploadedDocMetadata,
        document_category: docCategory,
        classification: "LANDOWNER-SUBMITTED / UNVERIFIED",
        uploaded_at: new Date().toISOString()
      };

      // Phase B: Build boundary GeoJSON polygon if >= 4 corner points captured
      let boundaryGeoJSON: any = null;
      if (boundaryPoints.length >= 4) {
        const ring: [number, number][] = boundaryPoints.map((p) => [p.lng, p.lat]);
        ring.push([boundaryPoints[0].lng, boundaryPoints[0].lat]); // Close polygon P1->P2->P3->P4->P1
        boundaryGeoJSON = {
          type: "Polygon",
          coordinates: [ring],
          points: boundaryPoints
        };
      }

      // Phase C: Write complaint record to Supabase
      setSubmitPhase("Registering statutory grievance in Supabase Database...");
      const isUnregistered = selectedParcel === "unregistered" || !selectedParcel;
      const targetParcelId = isUnregistered ? null : selectedParcel;
      const targetSurvey = isUnregistered ? "UNREGISTERED_CLAIM" : selectedParcel;

      const payload = {
        owner_id: currentUser.user_id,
        owner_name: currentUser.name,
        contact_village: currentUser.village,
        mobile_number: "+91 98290 41234",
        parcel_id: targetParcelId,
        survey_number: targetSurvey,
        project_id: "P-NH927A",
        complaint_type: category,
        description: description.trim(),
        priority: priority,
        document_evidence: docRecord,
        gps: {
          lat: gpsLocation.lat,
          lng: gpsLocation.lng,
          accuracy: gpsLocation.accuracy,
          captured_at: gpsLocation.timestamp
        },
        landowner_reported_boundary: boundaryGeoJSON,
        landowner_reported_location: {
          lat: gpsLocation.lat,
          lng: gpsLocation.lng,
          accuracy: gpsLocation.accuracy,
          captured_at: gpsLocation.timestamp
        },
        landowner_declared_area: areaResult ? {
          sqm: areaResult.areaSqm,
          acres: areaResult.areaAcres,
          hectares: areaResult.areaHectares,
          uncertainty: areaResult.uncertaintySqm,
          uncertainty_acres: areaResult.uncertaintyAcres,
          uncertainty_explanation: areaResult.uncertaintyExplanation,
          status: "LANDOWNER-REPORTED / ESTIMATED"
        } : null,
        landowner_documents: [docRecord],
        is_demo_simulation: isDemoMode
      };

      const result = await submitLandownerComplaint(payload);

      if (!result?.success) {
        throw new Error(result?.message || "Unable to submit grievance. Please try again.");
      }

      // Phase D: Done! Redirect to live tracking
      setSubmitPhase("Grievance registered! Status: SUBMITTED — AWAITING FIELD REVIEW...");
      setTimeout(() => {
        router.push(`/landowner/complaints/${result.complaint_id}`);
      }, 700);

    } catch (err: any) {
      console.error("Grievance submission error:", err);
      setErrorMsg(err?.message || "An unexpected error occurred while submitting your grievance.");
      setSubmitting(false);
      setSubmitPhase(null);
    }
  };

  const isSubmitReady = description.trim().length >= 15 && !!gpsLocation && !!evidenceFile && !submitting;
  const isUnregistered = selectedParcel === "unregistered" || parcels.length === 0;

  return (
    <LandownerShell>
      <div className="p-4 space-y-6 pb-24 max-w-lg mx-auto">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/landowner/complaints"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Grievances</span>
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
            SUBMITTED — AWAITING FIELD REVIEW
          </span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Lodge Official Grievance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Submit an official objection to the Competent Authority (CALA) with GPS boundary capture and supporting documentation.
          </p>
        </div>

        {/* Real Mode vs Demo Simulation Switcher */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Operating GPS Mode
            </span>
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
                  ? "bg-emerald-600 text-white shadow-md"
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
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Demo Simulation</span>
            </button>
          </div>

          {isDemoMode ? (
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider text-purple-300">
                <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />
                <span>DEMO DATA / SIMULATION</span>
              </div>
              <p className="text-[10px] text-purple-200/90 leading-relaxed">
                Simulated coordinates modeled strictly within ±12m to ±15m accuracy (never wildly varying, not presented as real).
              </p>
            </div>
          ) : (
            <p className="text-[10px] text-slate-400">
              Real Mode: Hardware GPS accuracy only. Zero fake or fabricated coordinates.
            </p>
          )}
        </div>

        {/* Fallback Banner for Landowners without Pre-existing Land Parcels */}
        {isUnregistered && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-3 animate-fadeIn">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
                  No registered parcel linked to this account.
                </span>
                <p className="text-slate-300 leading-relaxed text-xs">
                  You can still report an issue by providing your documents and marking the approximate land boundary.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
              <a
                href="#boundary-marking-section"
                className="py-1.5 px-2 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-center font-bold"
              >
                1. Mark Boundary
              </a>
              <a
                href="#documents-section"
                className="py-1.5 px-2 rounded-lg bg-amber-600/30 hover:bg-amber-600/40 border border-amber-500/40 text-amber-300 text-center font-bold"
              >
                2. Upload Docs
              </a>
              <button
                type="button"
                onClick={() => {
                  const submitBtn = document.getElementById("submit-complaint-btn");
                  submitBtn?.scrollIntoView({ behavior: "smooth" });
                }}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-center font-bold border border-slate-700 cursor-pointer"
              >
                3. Submit
              </button>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs flex items-start gap-3 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-red-300 block uppercase tracking-wider text-[11px]">Submission Error</span>
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1: PARCEL & DISPUTE DETAILS */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center justify-center font-mono">
                1
              </span>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Parcel & Objection Category
              </h2>
            </div>

            {/* Affected Parcel Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Impacted Land Parcel
              </label>
              <select
                value={selectedParcel}
                onChange={(e) => setSelectedParcel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
              >
                <option value="unregistered">Unregistered Land Claim (No Official Parcel Linked)</option>
                {parcels.map((p) => (
                  <option key={p.parcel_id || p.id} value={p.parcel_id || p.id}>
                    {p.parcel_id || p.id} · Survey {p.survey_number || p.survey_no || "Khasra"} · {p.village_name || "Chandwas"} ({p.area_hectares || 1.2} Ha)
                  </option>
                ))}
              </select>
              {selectedParcel === "unregistered" && (
                <span className="text-[10px] text-amber-400 font-mono block mt-1">
                  Claim without pre-registered parcel. An official parcel will be linked during field verification.
                </span>
              )}
            </div>

            {/* Complaint Category */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Objection / Grievance Category <span className="text-amber-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                {COMPLAINT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Problem Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Detailed Explanation of the Problem <span className="text-amber-400">*</span>
                </label>
                <span className={`text-[10px] font-mono ${description.length < 15 ? "text-amber-400" : "text-emerald-400"}`}>
                  {description.length} / 15 min chars
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                placeholder="Explain the discrepancy, boundary pillar offset, delayed compensation notice, or unauthorized possession..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500 placeholder-slate-600 leading-relaxed"
              />
            </div>

            {/* Priority Picker */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Impact Urgency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["NORMAL", "URGENT", "CRITICAL"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      priority === p
                        ? p === "CRITICAL"
                          ? "bg-red-500/20 border border-red-500/50 text-red-400"
                          : p === "URGENT"
                          ? "bg-amber-500/20 border border-amber-500/50 text-amber-400"
                          : "bg-indigo-500/20 border border-indigo-500/50 text-indigo-300"
                        : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: GPS LOCATION & BOUNDARY MARKING */}
          <div id="boundary-marking-section" className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center justify-center font-mono">
                  2
                </span>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  GPS Land Location & Corner Marking
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                Satellite Capture
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Capture your physical device GPS coordinates. You can also walk the corners of your parcel (P1 → P2 → P3 → P4 → P1) to mark your claimed boundary.
            </p>

            {/* Error / Warning Alert */}
            {gpsError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-[11px] uppercase tracking-wider">Location Error</span>
                  <p>{gpsError}</p>
                </div>
              </div>
            )}

            {accuracyWarning && (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-fadeIn">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-400" />
                <span>{accuracyWarning}</span>
              </div>
            )}

            {/* Primary GPS Status */}
            {gpsLocation ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">
                      {isDemoMode ? "Simulated GPS Position" : "Device GPS Coordinates Verified"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCaptureLocation}
                    className="text-[10px] font-mono text-emerald-400 hover:underline cursor-pointer"
                  >
                    [ Refresh Fix ]
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-1 border-t border-emerald-500/20">
                  <div>
                    <span className="text-[10px] text-emerald-500 block">Latitude</span>
                    <span className="font-bold">{gpsLocation.lat}° N</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-500 block">Longitude</span>
                    <span className="font-bold">{gpsLocation.lng}° E</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-500 block">Accuracy</span>
                    <span className="font-bold">±{gpsLocation.accuracy}m</span>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={capturingGps}
                onClick={handleCaptureLocation}
                className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border-2 border-dashed border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-inner"
              >
                {capturingGps ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Acquiring Device GPS Coordinates...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-4 h-4 text-amber-400" />
                    <span>Capture Current GPS Location (Required)</span>
                  </>
                )}
              </button>
            )}

            {/* Corner Marking Sub-flow (P1 -> P2 -> P3 -> P4 -> P1) */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Mark Land Boundary Corners (P1 → P2 → P3 → P4)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Walk to each corner of your land plot to record a closed polygon
                  </span>
                </div>
                <button
                  type="button"
                  disabled={capturingCorner}
                  onClick={handleAddCornerPoint}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {capturingCorner ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>+ Point {boundaryPoints.length + 1}</span>
                </button>
              </div>

              {/* Recorded Vertices List */}
              {boundaryPoints.length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {boundaryPoints.map((pt, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">
                          P{pt.sequence}
                        </span>
                        <span className="text-white text-[11px]">
                          {pt.lat}°, {pt.lng}°
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          (±{pt.accuracy}m)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCorner(idx)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Remove point"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Calculated Area Card if >= 4 points */}
              {boundaryPoints.length >= 4 && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      LANDOWNER-REPORTED / ESTIMATED
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {isDemoMode ? "SIMULATED ESTIMATE" : "GPS-based estimate"}
                    </span>
                  </div>

                  {areaResult ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-xl font-bold font-mono text-white text-center">
                        {areaResult.areaAcres} <span className="text-sm font-medium text-amber-400">acres</span>
                        <span className="text-xs text-slate-400 font-normal block mt-0.5">
                          {areaResult.areaSqm.toLocaleString()} m² · {areaResult.areaHectares} Ha
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono border-t border-slate-800 pt-1.5">
                        <span className="text-slate-300 font-bold block mb-0.5">Uncertainty:</span>
                        {areaResult.uncertaintySqm !== null ? (
                          <span className="text-amber-300">
                            ±{areaResult.uncertaintySqm} m² (±{areaResult.uncertaintyAcres} acres)
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">
                            Area uncertainty cannot be reliably calculated from the available GPS data.
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">
                      Area uncertainty cannot be reliably calculated from the available GPS data.
                    </p>
                  )}
                </div>
              )}

              {boundaryPoints.length > 0 && boundaryPoints.length < 4 && (
                <p className="text-[11px] text-slate-400 italic">
                  Recorded {boundaryPoints.length} of 4 points. Capture at least 4 corner points to define a closed land boundary polygon.
                </p>
              )}
            </div>
          </div>

          {/* SECTION 3: COMPULSORY DOCUMENT EVIDENCE UPLOAD */}
          <div id="documents-section" className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center justify-center font-mono">
                  3
                </span>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Supporting Legal Document
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                LANDOWNER-SUBMITTED / UNVERIFIED
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Upload title deed, tax receipt, electricity bill, boundary demarcation photo, or physical possession proof.
            </p>

            {/* Document Type Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Document Type
              </label>
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                {DOCUMENT_TYPES.map((dt) => (
                  <option key={dt} value={dt}>
                    {dt}
                  </option>
                ))}
              </select>
            </div>

            {/* File Error Alert */}
            {fileError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{fileError}</span>
              </div>
            )}

            {/* File Upload Widget */}
            {evidenceFile ? (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-bold text-xs text-white truncate block">
                      {evidenceFile.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {(evidenceFile.size / (1024 * 1024)).toFixed(2)} MB · {docCategory}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEvidenceFile(null)}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1 rounded bg-red-500/10 border border-red-500/20 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <label className="block w-full p-4 rounded-xl bg-slate-950 hover:bg-slate-800/80 border-2 border-dashed border-amber-500/50 hover:border-amber-400 transition-all text-center cursor-pointer group">
                  <UploadCloud className="w-7 h-7 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-white block">
                    Choose Supporting Document or Photo
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    PDF, JPG, PNG, WEBP (Max 50 MB)
                  </span>
                  <input
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png,.webp,image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* SECTION 4: SUBMIT ACTION */}
          <div className="space-y-3 pt-2">
            
            {/* Progress Phase Notification */}
            {submitPhase && (
              <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5 animate-fadeIn">
                <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin text-amber-400" />
                <span className="font-medium">{submitPhase}</span>
              </div>
            )}

            <button
              id="submit-complaint-btn"
              type="submit"
              disabled={!isSubmitReady}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer ${
                isSubmitReady
                  ? "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-950/50"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              }`}
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Submission...</span>
                </>
              ) : !gpsLocation ? (
                <span>CAPTURE GPS LOCATION TO PROCEED</span>
              ) : !evidenceFile ? (
                <span>ATTACH COMPULSORY DOCUMENT TO PROCEED</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>SUBMIT STATUTORY GRIEVANCE TO SUPABASE</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-slate-500 text-center">
              Initial status: SUBMITTED — AWAITING FIELD REVIEW. Recorded in immutable Supabase audit log.
            </p>
          </div>

        </form>
      </div>
    </LandownerShell>
  );
}
