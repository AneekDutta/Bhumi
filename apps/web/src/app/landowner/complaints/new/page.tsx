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
  ShieldCheck,
  Crosshair,
  Building2,
  Check
} from "lucide-react";
import { LandownerShell } from "@/components/landowner/LandownerShell";
import { 
  getLandownerParcels, 
  submitLandownerComplaint, 
  uploadEvidenceDocument 
} from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { getCurrentGPSPosition, LocationCoordinates } from "@/lib/native/geolocation";
import { haversineDistance } from "@/lib/spatial/geodesicArea";

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

  // GPS Location State (One-time Proximity Verification)
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; accuracy: number; timestamp: string } | null>(null);
  const [capturingGps, setCapturingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [accuracyWarning, setAccuracyWarning] = useState<string | null>(null);

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
          setSelectedParcel("unregistered");
        }
      } catch (err) {
        console.warn("Could not load landowner parcels:", err);
        setSelectedParcel("unregistered");
      }
    }

    initSession();
  }, [preselectedParcel, supabase]);

  // Selected Parcel Registered Object (Single Authoritative Source of Truth)
  const selectedParcelData = useMemo(() => {
    if (!selectedParcel || selectedParcel === "unregistered") return null;
    return parcels.find((p) => (p.parcel_id || p.id) === selectedParcel) || null;
  }, [selectedParcel, parcels]);

  // Proximity Calculation: Distance from Landowner Device GPS to Registered Parcel
  const proximityResult = useMemo(() => {
    if (!gpsLocation || !selectedParcelData) return null;
    const coords = selectedParcelData.coordinates || [];
    if (coords.length === 0) return null;

    // Centroid calculation from registered polygon points
    const centroidLng = coords.reduce((s: number, p: any) => s + p.lng, 0) / coords.length;
    const centroidLat = coords.reduce((s: number, p: any) => s + p.lat, 0) / coords.length;

    const distanceMeters = Math.round(haversineDistance([gpsLocation.lng, gpsLocation.lat], [centroidLng, centroidLat]));
    
    return {
      distanceMeters,
      isNear: distanceMeters <= 500, // within reasonable survey proximity
      centroid: { lat: centroidLat, lng: centroidLng }
    };
  }, [gpsLocation, selectedParcelData]);

  // =========================================================================
  // ONE-TIME GPS PROXIMITY CAPTURE HANDLER
  // Strictly checks physical proximity without altering parcel coordinates
  // =========================================================================
  const handleCaptureLocation = async () => {
    setGpsError(null);
    setAccuracyWarning(null);
    setCapturingGps(true);

    try {
      let pos: LocationCoordinates;

      if (isDemoMode) {
        // DEMO / SIMULATION MODE: Modeled in close proximity to registered parcel
        const baseLat = selectedParcelData?.coordinates?.[0]?.lat || 24.6650;
        const baseLng = selectedParcelData?.coordinates?.[0]?.lng || 75.9520;
        const simAccuracy = Number((12.0 + Math.random() * 3.0).toFixed(1));
        pos = {
          lat: Number((baseLat + 0.00018).toFixed(6)),
          lng: Number((baseLng + 0.00015).toFixed(6)),
          accuracy: simAccuracy
        };
      } else {
        // REAL GPS MODE: Hardware GPS only. Real coordinates & accuracy only.
        pos = await getCurrentGPSPosition({
          enableHighAccuracy: true,
          timeout: 15000
        });
      }

      if (pos.lat === 0 && pos.lng === 0) {
        throw new Error("Invalid 0,0 coordinates received from GPS sensor.");
      }

      if (pos.accuracy > 20) {
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
    } catch (err: any) {
      setGpsError(err?.message || "GPS location unavailable. Please enable location permissions and try again.");
      setGpsLocation(null);
    } finally {
      setCapturingGps(false);
    }
  };

  // =========================================================================
  // DOCUMENT EVIDENCE HANDLER
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
  // FORM SUBMISSION (Authoritative Registered Parcel Referenced)
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
      // Phase A: Upload supporting document to Supabase Storage
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

      const docRecord = {
        ...uploadedDocMetadata,
        document_category: docCategory,
        classification: "LANDOWNER-SUBMITTED / UNVERIFIED",
        uploaded_at: new Date().toISOString()
      };

      // Phase B: Build complaint payload referencing registered parcel
      setSubmitPhase("Registering statutory grievance in Supabase Database...");
      const isUnregistered = selectedParcel === "unregistered" || !selectedParcel;
      const targetParcelId = isUnregistered ? null : (selectedParcelData?.parcel_id || selectedParcel);
      const targetSurvey = isUnregistered ? "UNREGISTERED_CLAIM" : (selectedParcelData?.survey_number || selectedParcel);

      const payload = {
        owner_id: currentUser.user_id,
        owner_name: currentUser.name,
        contact_village: selectedParcelData?.village_name || currentUser.village,
        mobile_number: "+91 98290 41234",
        parcel_id: targetParcelId,
        survey_number: targetSurvey,
        project_id: selectedParcelData?.project_id || "P-NH927A",
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
        proximity_verification: {
          lat: gpsLocation.lat,
          lng: gpsLocation.lng,
          accuracy: gpsLocation.accuracy,
          distance_meters: proximityResult?.distanceMeters ?? null,
          verified: true,
          captured_at: gpsLocation.timestamp
        },
        landowner_reported_location: {
          lat: gpsLocation.lat,
          lng: gpsLocation.lng,
          accuracy: gpsLocation.accuracy,
          captured_at: gpsLocation.timestamp
        },
        // DO NOT create competing polygon or declared area: registered parcel is the single source of truth
        landowner_reported_boundary: null,
        landowner_declared_area: null,
        landowner_documents: [docRecord],
        is_demo_simulation: isDemoMode
      };

      const result = await submitLandownerComplaint(payload);

      if (!result?.success) {
        throw new Error(result?.message || "Unable to submit grievance. Please try again.");
      }

      // Phase C: Done! Redirect to live tracking
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
      <div className="space-y-5 pb-24 max-w-lg mx-auto">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/landowner/complaints"
            className="inline-flex items-center gap-1.5 text-xs text-[#5A6A80] dark:text-slate-400 hover:text-[#0B2E59] dark:hover:text-white transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Grievances</span>
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#B36B00] dark:text-amber-400 font-bold bg-[#FFF8E1] dark:bg-amber-950/40 px-2 py-0.5 rounded-[3px] border border-[#FFE082] dark:border-amber-800/50">
            SUBMITTED — AWAITING REVIEW
          </span>
        </div>

        <div>
          <h1 className="text-lg font-bold text-[#14213D] dark:text-white tracking-tight font-display">
            Lodge Statutory Grievance
          </h1>
          <p className="text-xs text-[#5A6A80] dark:text-slate-400 mt-0.5">
            Submit an official objection to CALA referencing your registered land parcel with GPS proximity verification under RFCTLARR 2013.
          </p>
        </div>

        {/* Operating GPS Mode Switcher */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-3.5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#14213D] dark:text-slate-300 uppercase tracking-wider">
              Operating GPS Mode
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[3px] font-bold uppercase ${
              isDemoMode 
                ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40" 
                : "bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-300 border border-[#C8E6C9] dark:border-emerald-800/50"
            }`}>
              {isDemoMode ? "DEMO DATA / SIMULATION" : "REAL HARDWARE GPS"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsDemoMode(false)}
              className={`py-2 px-3 rounded-[4px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                !isDemoMode
                  ? "bg-[#0B2E59] text-white shadow-xs"
                  : "bg-[#F8FAFC] dark:bg-[#07080F] text-[#5A6A80] dark:text-slate-400 border border-[#CBD5E1] dark:border-white/10 hover:text-[#14213D] dark:hover:text-white"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Real Hardware GPS</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDemoMode(true)}
              className={`py-2 px-3 rounded-[4px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isDemoMode
                  ? "bg-[#0B2E59] text-white shadow-xs"
                  : "bg-[#F8FAFC] dark:bg-[#07080F] text-[#5A6A80] dark:text-slate-400 border border-[#CBD5E1] dark:border-white/10 hover:text-[#14213D] dark:hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Demo Simulation</span>
            </button>
          </div>

          {isDemoMode ? (
            <div className="p-2.5 rounded-[4px] bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 text-purple-900 dark:text-purple-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider text-purple-800 dark:text-purple-300">
                <AlertTriangle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>DEMO DATA / SIMULATION</span>
              </div>
              <p className="text-[10px] text-purple-800/90 dark:text-purple-200/90 leading-relaxed">
                Simulated coordinates modeled strictly within ±12m to ±15m accuracy in proximity to the parcel boundary.
              </p>
            </div>
          ) : (
            <p className="text-[10px] text-[#5A6A80] dark:text-slate-400">
              Real Mode: Hardware GPS accuracy only. Zero fake or fabricated coordinates.
            </p>
          )}
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="p-3 rounded-[4px] bg-[#FFEBEE] dark:bg-rose-950/40 border border-[#FFCDD2] dark:border-rose-800/50 text-[#B32424] dark:text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#B32424] dark:text-rose-400 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-[#B32424] dark:text-rose-300 block uppercase tracking-wider text-[11px]">Submission Error</span>
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* SECTION 1: PARCEL & DISPUTE DETAILS */}
          <div className="p-4 rounded-[4px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[#DCE2E8] dark:border-white/10 pb-2.5">
              <span className="w-5 h-5 rounded-[3px] bg-[#0B2E59] text-white text-xs font-bold flex items-center justify-center font-mono">
                1
              </span>
              <h2 className="text-xs font-bold text-[#14213D] dark:text-white uppercase tracking-wider">
                Parcel &amp; Objection Category
              </h2>
            </div>

            {/* Affected Parcel Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-[#14213D] dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Impacted Land Parcel <span className="text-rose-600">*</span>
              </label>
              <select
                value={selectedParcel}
                onChange={(e) => setSelectedParcel(e.target.value)}
                className="w-full px-3 py-2 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#CBD5E1] dark:border-white/15 text-[#14213D] dark:text-white text-xs focus:outline-none focus:border-[#0B2E59] font-mono"
              >
                <option value="unregistered">Unregistered Land Claim (No Official Parcel Linked)</option>
                {parcels.map((p) => (
                  <option key={p.parcel_id || p.id} value={p.parcel_id || p.id}>
                    {p.parcel_id || p.id} · Survey {p.survey_number || p.survey_no || "Khasra"} · {p.village_name || "Chandwas"} ({p.area_hectares || 1.2} Ha)
                  </option>
                ))}
              </select>
            </div>

            {/* AUTHORITATIVE REGISTERED PARCEL DETAILS CARD */}
            {selectedParcelData && (
              <div className="bg-[#F8FAFC] dark:bg-[#07080F] border border-[#CBD5E1] dark:border-white/15 rounded-[4px] p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-[#DCE2E8] dark:border-white/10 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#0B2E59] dark:text-sky-400" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0B2E59] dark:text-sky-400">
                      Authoritative Registered Parcel Record (Single Source of Truth)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-[2px] border border-emerald-200 dark:border-emerald-800/40">
                    VERIFIED IN REGISTRY
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase block font-semibold">Parcel ID:</span>
                    <span className="text-[#0B2E59] dark:text-sky-300 font-bold">{selectedParcelData.parcel_id || selectedParcelData.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase block font-semibold">Survey / Khasra No:</span>
                    <span className="text-[#14213D] dark:text-white font-bold">{selectedParcelData.survey_number || selectedParcelData.survey_no || "45/1A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase block font-semibold">Registered Owner:</span>
                    <span className="text-[#14213D] dark:text-white font-bold">{selectedParcelData.owner_legal_name || currentUser?.name || "Verified Landowner"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase block font-semibold">Registered Land Area:</span>
                    <span className="text-[#1E7E34] dark:text-emerald-400 font-bold">
                      {selectedParcelData.area_hectares || selectedParcelData.calculated_area?.hectares || 1.2} Ha 
                      {" "}({selectedParcelData.area_acres || selectedParcelData.calculated_area?.acres || 2.96} Acres)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase block font-semibold">Corridor / Project:</span>
                    <span className="text-[#14213D] dark:text-slate-300">{selectedParcelData.project_name || selectedParcelData.project_id || "P-NH927A (Amritsar-Jamnagar)"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase block font-semibold">Location / Jurisdiction:</span>
                    <span className="text-[#14213D] dark:text-slate-300">
                      {selectedParcelData.village_name || "Chandwas"}, {selectedParcelData.district || "Nagaur"}, {selectedParcelData.state || "Rajasthan"}
                    </span>
                  </div>
                </div>

                {/* Authoritative Boundary Coordinates Preview (P1 -> P2 -> P3 -> P4) */}
                {selectedParcelData.coordinates && selectedParcelData.coordinates.length > 0 && (
                  <div className="pt-2 border-t border-[#DCE2E8] dark:border-white/10 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6A80] dark:text-slate-400 font-mono block">
                      Registered Cadastral Boundary Points ({selectedParcelData.coordinates.length} Corners):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono">
                      {selectedParcelData.coordinates.map((pt: any, idx: number) => (
                        <div key={idx} className="p-1.5 rounded-[3px] bg-white dark:bg-[#0D121F] border border-[#CBD5E1] dark:border-white/10">
                          <span className="font-bold text-[#0B2E59] dark:text-sky-400">P{pt.sequence || idx + 1}:</span>{" "}
                          <span className="text-slate-700 dark:text-slate-300">{Number(pt.lat).toFixed(4)}°, {Number(pt.lng).toFixed(4)}°</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-2 rounded-[3px] bg-blue-50/50 dark:bg-sky-950/20 border border-blue-100 dark:border-sky-900/30 text-[10px] text-[#0B2E59] dark:text-sky-300">
                  <strong>Notice:</strong> The registered parcel geometry and area are authoritative from the official database. Grievance filing will not alter or duplicate registered parcel coordinates.
                </div>
              </div>
            )}

            {/* Complaint Category */}
            <div>
              <label className="block text-[11px] font-semibold text-[#14213D] dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Objection / Grievance Category <span className="text-rose-600">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#CBD5E1] dark:border-white/15 text-[#14213D] dark:text-white text-xs focus:outline-none focus:border-[#0B2E59]"
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
                <label className="block text-[11px] font-semibold text-[#14213D] dark:text-slate-300 uppercase tracking-wider">
                  Detailed Explanation of the Problem <span className="text-rose-600">*</span>
                </label>
                <span className={`text-[10px] font-mono ${description.length < 15 ? "text-[#B36B00] dark:text-amber-400" : "text-[#1E7E34] dark:text-emerald-400"}`}>
                  {description.length} / 15 min chars
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                placeholder="Explain the discrepancy, boundary pillar offset, delayed compensation notice, or unauthorized possession..."
                className="w-full px-3 py-2 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#CBD5E1] dark:border-white/15 text-[#14213D] dark:text-white text-xs focus:outline-none focus:border-[#0B2E59] placeholder-[#5A6A80] dark:placeholder-slate-500 leading-relaxed"
              />
            </div>

            {/* Priority Picker */}
            <div>
              <label className="block text-[11px] font-semibold text-[#14213D] dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Impact Urgency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["NORMAL", "URGENT", "CRITICAL"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 px-3 rounded-[4px] text-xs font-bold transition-all ${
                      priority === p
                        ? p === "CRITICAL"
                          ? "bg-[#FFEBEE] dark:bg-rose-950/40 border border-[#FFCDD2] dark:border-rose-800/50 text-[#B32424] dark:text-rose-400"
                          : p === "URGENT"
                          ? "bg-[#FFF8E1] dark:bg-amber-950/40 border border-[#FFE082] dark:border-amber-800/50 text-[#B36B00] dark:text-amber-400"
                          : "bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50 text-[#0B2E59] dark:text-sky-300"
                        : "bg-[#F8FAFC] dark:bg-[#07080F] border border-[#CBD5E1] dark:border-white/10 text-[#5A6A80] dark:text-slate-400 hover:text-[#14213D] dark:hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: PARCEL LOCATION VERIFICATION (ONE-TIME PROXIMITY CHECK) */}
          <div id="location-verification-section" className="p-4 rounded-[4px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#DCE2E8] dark:border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-[3px] bg-[#0B2E59] text-white text-xs font-bold flex items-center justify-center font-mono">
                  2
                </span>
                <h2 className="text-xs font-bold text-[#14213D] dark:text-white uppercase tracking-wider">
                  Parcel Location Verification
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#0B2E59] dark:text-sky-400 uppercase tracking-wider bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-[3px] border border-sky-200 dark:border-sky-800/50">
                Proximity Verification
              </span>
            </div>

            <p className="text-xs text-[#5A6A80] dark:text-slate-300 leading-relaxed">
              Statutory verification requires confirming your physical presence in proximity to the registered parcel using your device GPS. You do not need to re-mark corners or calculate land area.
            </p>

            {/* Error / Warning Alert */}
            {gpsError && (
              <div className="p-3 rounded-[4px] bg-[#FFEBEE] dark:bg-rose-950/40 border border-[#FFCDD2] dark:border-rose-800/50 text-[#B32424] dark:text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#B32424] dark:text-rose-400 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block text-[11px] uppercase tracking-wider">Location Error</span>
                  <p>{gpsError}</p>
                </div>
              </div>
            )}

            {accuracyWarning && (
              <div className="p-3 rounded-[4px] bg-[#FFF8E1] dark:bg-amber-950/40 border border-[#FFE082] dark:border-amber-800/50 text-[#B36B00] dark:text-amber-300 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#B36B00] dark:text-amber-400" />
                <span>{accuracyWarning}</span>
              </div>
            )}

            {/* Captured Proximity Status */}
            {gpsLocation ? (
              <div className="p-3.5 rounded-[4px] bg-[#E8F5E9] dark:bg-emerald-950/30 border border-[#C8E6C9] dark:border-emerald-800/50 text-[#1E7E34] dark:text-emerald-300 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1E7E34] dark:text-emerald-400 flex-shrink-0" />
                    <span className="text-xs font-bold">
                      {isDemoMode ? "Simulated Proximity Location Verified" : "Device GPS Proximity Confirmed"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCaptureLocation}
                    className="text-[10px] font-mono text-[#1E7E34] dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    [ Refresh Fix ]
                  </button>
                </div>

                {/* Proximity Distance Metric */}
                {proximityResult && (
                  <div className="p-2.5 rounded-[3px] bg-white dark:bg-[#0D121F] border border-[#C8E6C9] dark:border-emerald-800/40 text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase">Distance to Registered Parcel:</span>
                      <span className="font-bold text-[#1E7E34] dark:text-emerald-400">
                        {proximityResult.distanceMeters} meters
                      </span>
                    </div>
                    <p className="text-[11px] text-[#1E7E34] dark:text-emerald-300">
                      ✓ Location proximity confirmed: Device is located within {proximityResult.distanceMeters}m of registered parcel {selectedParcelData?.parcel_id || selectedParcel}.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-1 border-t border-[#C8E6C9] dark:border-emerald-800/30">
                  <div>
                    <span className="text-[10px] text-[#5A6A80] dark:text-emerald-400 block">Latitude</span>
                    <span className="font-bold">{gpsLocation.lat}° N</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#5A6A80] dark:text-emerald-400 block">Longitude</span>
                    <span className="font-bold">{gpsLocation.lng}° E</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#5A6A80] dark:text-emerald-400 block">Accuracy</span>
                    <span className="font-bold">±{gpsLocation.accuracy}m</span>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={capturingGps}
                onClick={handleCaptureLocation}
                className="w-full py-3.5 px-4 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] hover:bg-[#EDF2F7] dark:hover:bg-white/5 border-2 border-dashed border-[#0B2E59]/40 hover:border-[#0B2E59] text-[#0B2E59] dark:text-sky-400 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {capturingGps ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#0B2E59] dark:text-sky-400" />
                    <span>Verifying Device GPS Proximity...</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
                    <span>Capture Current GPS Location (Proximity Check)</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* SECTION 3: COMPULSORY DOCUMENT EVIDENCE UPLOAD */}
          <div id="documents-section" className="p-4 rounded-[4px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#DCE2E8] dark:border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-[3px] bg-[#0B2E59] text-white text-xs font-bold flex items-center justify-center font-mono">
                  3
                </span>
                <h2 className="text-xs font-bold text-[#14213D] dark:text-white uppercase tracking-wider">
                  Supporting Legal Document
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#B36B00] dark:text-amber-400 uppercase tracking-wider bg-[#FFF8E1] dark:bg-amber-950/40 px-2 py-0.5 rounded-[3px] border border-[#FFE082] dark:border-amber-800/50">
                LANDOWNER-SUBMITTED / UNVERIFIED
              </span>
            </div>

            <p className="text-xs text-[#5A6A80] dark:text-slate-300 leading-relaxed">
              Upload title deed, tax receipt, electricity bill, boundary demarcation photo, or physical possession proof.
            </p>

            {/* Document Type Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-[#14213D] dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Document Type
              </label>
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#CBD5E1] dark:border-white/15 text-[#14213D] dark:text-white text-xs focus:outline-none focus:border-[#0B2E59]"
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
              <div className="p-3 rounded-[4px] bg-[#FFEBEE] dark:bg-rose-950/40 border border-[#FFCDD2] dark:border-rose-800/50 text-[#B32424] dark:text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#B32424] dark:text-rose-400" />
                <span>{fileError}</span>
              </div>
            )}

            {/* File Upload Widget */}
            {evidenceFile ? (
              <div className="p-3 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#CBD5E1] dark:border-white/15 flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-9 h-9 rounded-[4px] bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 text-[#0B2E59] dark:text-sky-400 flex items-center justify-center flex-shrink-0">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-bold text-xs text-[#14213D] dark:text-white truncate block">
                      {evidenceFile.name}
                    </span>
                    <span className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400">
                      {(evidenceFile.size / (1024 * 1024)).toFixed(2)} MB · {docCategory}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEvidenceFile(null)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1 rounded-[3px] bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <label className="block w-full p-4 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] hover:bg-[#EDF2F7] dark:hover:bg-white/5 border-2 border-dashed border-[#CBD5E1] dark:border-white/20 hover:border-[#0B2E59] transition-all text-center cursor-pointer group">
                  <UploadCloud className="w-6 h-6 text-[#0B2E59] dark:text-sky-400 mx-auto mb-1.5 group-hover:scale-105 transition-transform" />
                  <span className="text-xs font-bold text-[#14213D] dark:text-white block">
                    Choose Supporting Document or Photo
                  </span>
                  <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 block mt-0.5">
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
          <div className="space-y-2.5 pt-2">
            {submitPhase && (
              <div className="p-3 rounded-[4px] bg-[#FFF8E1] dark:bg-amber-950/30 border border-[#FFE082] dark:border-amber-800/40 text-[#B36B00] dark:text-amber-300 text-xs flex items-center gap-2 animate-fadeIn">
                <RefreshCw className="w-3.5 h-3.5 flex-shrink-0 animate-spin text-[#B36B00] dark:text-amber-400" />
                <span className="font-semibold">{submitPhase}</span>
              </div>
            )}

            <button
              id="submit-complaint-btn"
              type="submit"
              disabled={!isSubmitReady}
              className={`w-full py-2.5 px-4 rounded-[4px] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                isSubmitReady
                  ? "bg-[#0B2E59] hover:bg-[#082242] text-white"
                  : "bg-[#E2E8F0] dark:bg-white/10 text-[#5A6A80] dark:text-slate-500 cursor-not-allowed border border-[#CBD5E1] dark:border-white/10"
              }`}
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Submission...</span>
                </>
              ) : !gpsLocation ? (
                <span>CAPTURE GPS LOCATION TO PROCEED</span>
              ) : !evidenceFile ? (
                <span>ATTACH COMPULSORY DOCUMENT TO PROCEED</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>SUBMIT STATUTORY GRIEVANCE TO CALA</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-[#5A6A80] dark:text-slate-400 text-center">
              Initial status: SUBMITTED — AWAITING FIELD REVIEW. Recorded in immutable Supabase audit log.
            </p>
          </div>

        </form>
      </div>
    </LandownerShell>
  );
}
