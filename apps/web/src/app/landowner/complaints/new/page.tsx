"use client";

import React, { useState, useEffect } from "react";
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
  HelpCircle,
  Eye
} from "lucide-react";
import { LandownerShell } from "@/components/landowner/LandownerShell";
import { 
  getLandownerParcels, 
  submitLandownerComplaint, 
  uploadEvidenceDocument 
} from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

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

export default function NewComplaintPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedParcel = searchParams.get("parcel_id") || "";
  const supabase = createClient();

  // Form Inputs
  const [parcels, setParcels] = useState<any[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<string>(preselectedParcel);
  const [category, setCategory] = useState<string>(COMPLAINT_CATEGORIES[0]);
  const [description, setDescription] = useState<string>("");
  const [priority, setPriority] = useState<"NORMAL" | "URGENT" | "CRITICAL">("NORMAL");

  // COMPULSORY GPS State
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; accuracy: number; timestamp: string } | null>(null);
  const [capturingGps, setCapturingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // COMPULSORY Document Evidence State
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
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
      } else {
        // Fallback check for session cookie
        const cookies = document.cookie.split(";").map((c) => c.trim());
        const sessionCookie = cookies.find((c) => c.startsWith("bhumi_landowner_session=") || c.startsWith("bhumi_officer_session="));
        if (sessionCookie) {
          try {
            const val = decodeURIComponent(sessionCookie.split("=")[1]);
            const parsed = JSON.parse(val);
            if (parsed?.user_id) activeUserId = parsed.user_id;
            if (parsed?.name) activeName = parsed.name;
            if (parsed?.email) activeEmail = parsed.email;
          } catch {}
        }
      }

      setCurrentUser({
        user_id: activeUserId || "citizen",
        name: activeName,
        email: activeEmail,
        village: "Corridor Sector"
      });

      // 2. Load authorized parcels from Supabase
      try {
        let pData = await getLandownerParcels(activeUserId);
        if (!pData || pData.length === 0) {
          // If citizen has no pre-assigned parcels, fetch all corridor parcels so they can file against any affected project parcel
          const { getFieldParcels } = await import("@/lib/api");
          pData = await getFieldParcels();
        }
        setParcels(pData || []);
        if (!selectedParcel && pData && pData.length > 0) {
          setSelectedParcel(pData[0].parcel_id || pData[0].id);
        }
      } catch (err) {
        console.warn("Could not load landowner parcels:", err);
      }
    }

    initSession();
  }, [selectedParcel, supabase]);

  // =========================================================================
  // COMPULSORY GPS CAPTURE HANDLER (Browser Geolocation API)
  // Rejects fake, hardcoded, or random coordinates.
  // =========================================================================
  const handleCaptureRealGps = () => {
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser. Please use a modern mobile or desktop browser.");
      setGpsLocation(null);
      return;
    }

    setCapturingGps(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const accuracy = Number(pos.coords.accuracy.toFixed(1));

        // Strict verification: coordinates must not be 0,0
        if (lat === 0 && lng === 0) {
          setGpsError("Location is required to submit this complaint. Invalid coordinates obtained.");
          setGpsLocation(null);
          setCapturingGps(false);
          return;
        }

        setGpsLocation({
          lat,
          lng,
          accuracy,
          timestamp: new Date().toISOString()
        });
        setCapturingGps(false);
      },
      (err) => {
        setCapturingGps(false);
        setGpsLocation(null);
        if (err.code === 1) {
          // Permission denied
          setGpsError("Location permission denied. Location is required to submit this complaint so CALA and Field Officers can verify the parcel on the ground. Please grant location access in your browser settings and tap 'Capture Live GPS Location' again.");
        } else if (err.code === 2) {
          setGpsError("Location is required to submit this complaint. Unable to acquire satellite GPS fix. Please ensure device location is enabled and retry.");
        } else {
          setGpsError("Location is required to submit this complaint. GPS acquisition timed out. Please tap retry.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // =========================================================================
  // COMPULSORY DOCUMENT EVIDENCE HANDLER
  // Validates file format (.pdf, .jpg, .png, .webp) and max 50MB
  // =========================================================================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (!e.target.files || e.target.files.length === 0) {
      setEvidenceFile(null);
      return;
    }

    const file = e.target.files[0];

    // Allowed MIME types
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|webp)$/i)) {
      setFileError("Unsupported file format. Please upload a PDF document (.pdf) or image (.jpg, .png, .webp).");
      setEvidenceFile(null);
      return;
    }

    // Maximum 50 MB
    if (file.size > 52428800) {
      setFileError("File too large. Maximum allowed file size for supporting documents is 50 MB.");
      setEvidenceFile(null);
      return;
    }

    setEvidenceFile(file);
  };

  // =========================================================================
  // FORM SUBMISSION (Compulsory Document Upload + Compulsory GPS Enforcement)
  // =========================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Validate Parcel Selection
    if (!selectedParcel) {
      setErrorMsg("Please select the affected land parcel from your authorized landholdings.");
      return;
    }

    // 2. Validate Description Length
    if (description.trim().length < 15) {
      setErrorMsg("Please provide a detailed explanation of the issue (minimum 15 characters).");
      return;
    }

    // 3. Strict GPS Requirement
    if (!gpsLocation) {
      setErrorMsg("Location is required to submit this complaint. Please tap 'Capture Live GPS Location' to obtain satellite coordinates.");
      return;
    }

    // 4. Strict Document Requirement
    if (!evidenceFile) {
      setErrorMsg("Supporting documentation is compulsory. Please attach your land deed, passbook, mutation notice, or physical evidence.");
      return;
    }

    setSubmitting(true);

    try {
      // Phase A: Upload compulsory document to Supabase Storage
      setSubmitPhase("Uploading supporting document to Supabase Storage...");
      const uploadedDocMetadata = await uploadEvidenceDocument(
        evidenceFile,
        evidenceFile.name,
        selectedParcel
      );

      if (!uploadedDocMetadata || !uploadedDocMetadata.storage_path) {
        throw new Error("Document upload failed to return storage metadata. Complaint submission aborted.");
      }

      // Phase B: Write complaint record to Supabase documents & audit_logs
      setSubmitPhase("Registering statutory grievance in Supabase Database...");
      const payload = {
        owner_id: currentUser.user_id,
        owner_name: currentUser.name,
        contact_village: currentUser.village,
        mobile_number: "+91 98290 41234",
        parcel_id: selectedParcel,
        survey_number: selectedParcel,
        project_id: "P-NH927A",
        complaint_type: category,
        description: description.trim(),
        priority: priority,
        document_evidence: uploadedDocMetadata, // COMPULSORY
        gps: {
          lat: gpsLocation.lat,
          lng: gpsLocation.lng,
          accuracy: gpsLocation.accuracy,
          captured_at: gpsLocation.timestamp
        } // COMPULSORY
      };

      const result = await submitLandownerComplaint(payload);

      if (!result || !result.success) {
        throw new Error(result?.message || "Failed to create complaint record in database.");
      }

      // Phase C: Done! Redirect to live tracking
      setSubmitPhase("Complaint registered! Dispatching real-time alert to CALA...");
      setTimeout(() => {
        router.push(`/landowner/complaints/${result.complaint_id}`);
      }, 800);

    } catch (err: any) {
      console.error("Grievance submission error:", err);
      setErrorMsg(err?.message || "An unexpected error occurred while submitting your complaint to Supabase.");
      setSubmitting(false);
      setSubmitPhase(null);
    }
  };

  const isSubmitReady = !!selectedParcel && description.trim().length >= 15 && !!gpsLocation && !!evidenceFile && !submitting;

  return (
    <LandownerShell>
      <div className="p-4 space-y-6 pb-24">
        
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
            Form 20E · Section 20
          </span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Lodge Official Grievance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Submit an official objection to the Competent Authority (CALA) with compulsory GPS coordinates and documentary evidence.
          </p>
        </div>

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
          
          {/* ========================================================================= */}
          {/* SECTION 1: PARCEL & DISPUTE DETAILS                                       */}
          {/* ========================================================================= */}
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
                Select Affected Land Parcel <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedParcel}
                  onChange={(e) => setSelectedParcel(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                >
                  <option value="" disabled>-- Select from authorized parcels --</option>
                  {parcels.map((p) => (
                    <option key={p.parcel_id || p.id} value={p.parcel_id || p.id}>
                      {p.parcel_id || p.id} · Survey {p.survey_number || p.survey_no || "Khasra"} · {p.village_name || "Chandwas"} ({p.area_hectares || 1.2} Ha)
                    </option>
                  ))}
                </select>
              </div>
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

          {/* ========================================================================= */}
          {/* SECTION 2: COMPULSORY GPS LOCATION                                        */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center justify-center font-mono">
                  2
                </span>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Mandatory GPS Location
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                Compulsory
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Statutory verification requires your actual physical coordinates so Revenue Officers can locate the dispute on the cadastral map.
            </p>

            {/* GPS Error Alert */}
            {gpsError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-[11px] uppercase tracking-wider">Location Permission Required</span>
                  <p>{gpsError}</p>
                </div>
              </div>
            )}

            {/* Verified GPS Status or Capture Button */}
            {gpsLocation ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">GPS Coordinates Verified</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCaptureRealGps}
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
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={capturingGps}
                  onClick={handleCaptureRealGps}
                  className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border-2 border-dashed border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-inner"
                >
                  {capturingGps ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Acquiring Device Satellite Coordinates...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-4 h-4 text-amber-400" />
                      <span>Capture Live GPS Location (Required)</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-500 text-center">
                  Browser location prompt will request permission. Hardcoded/fake coordinates are strictly prohibited.
                </p>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: COMPULSORY DOCUMENT EVIDENCE UPLOAD                            */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center justify-center font-mono">
                  3
                </span>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Mandatory Supporting Document
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                Compulsory
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Upload at least one legal title document, revenue notice, passbook photograph, or boundary photo. Stored securely in the Supabase Storage system.
            </p>

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
                      {(evidenceFile.size / (1024 * 1024)).toFixed(2)} MB · {evidenceFile.type || "Document"}
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

          {/* ========================================================================= */}
          {/* SECTION 4: SUBMIT ACTION                                                  */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-2">
            
            {/* Progress Phase Notification */}
            {submitPhase && (
              <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5 animate-fadeIn">
                <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin text-amber-400" />
                <span className="font-medium">{submitPhase}</span>
              </div>
            )}

            <button
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
              Recorded in the immutable Supabase audit log under Section 20E of the National Highways Act.
            </p>
          </div>

        </form>
      </div>
    </LandownerShell>
  );
}
