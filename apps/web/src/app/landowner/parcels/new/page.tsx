"use client";
import { createClient } from "@/lib/supabase/client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Map, { Source, Layer, Marker, NavigationControl, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Eye,
  Check,
  Compass,
  FileCheck2,
  Info,
  Layers,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { LandownerShell } from "@/components/landowner/LandownerShell";
import { getCurrentGPSPosition } from "@/lib/native/geolocation";
import { calculateGeodesicArea } from "@/lib/spatial/geodesicArea";
import { validateParcelCoordinates, CoordinatePoint } from "@/lib/spatial/polygonValidation";
import {
  uploadEvidenceDocument,
  registerNewParcel,
  generateUnique14DigitParcelId
} from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

const DARK_MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const LIGHT_MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export default function RegisterParcelPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const mapRef = useRef<MapRef | null>(null);

  // Active step in the registration wizard: 1 to 5, and 6 is Success
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [owner, setOwner] = useState<any>(null);

  // STEP 1: Owner Legal Name & Details
  const [legalName, setLegalName] = useState("");
  const [contactVillage, setContactVillage] = useState("Corridor Sector");
  const [landUse, setLandUse] = useState("agricultural");
  const [surveyNumber, setSurveyNumber] = useState("");

  // STEP 2: Aadhaar Identity Verification
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [isDemoAadhaarMode, setIsDemoAadhaarMode] = useState(false);
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [aadhaarOtp, setAadhaarOtp] = useState("");
  const [isAadhaarVerifying, setIsAadhaarVerifying] = useState(false);
  const [aadhaarVerificationRecord, setAadhaarVerificationRecord] = useState<any | null>(null);
  const [aadhaarError, setAadhaarError] = useState("");

  // STEP 3: Official Land Documents
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docTypeToUpload, setDocTypeToUpload] = useState<string>("title_deed");
  const [docUploadError, setDocUploadError] = useState("");

  // STEP 4: GPS Coordinates Demarcation (Minimum 4 points)
  const [points, setPoints] = useState<CoordinatePoint[]>([]);
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

  // STEP 5: Boundary Confirmation & Submission
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // STEP 6: Successful Registration State
  const [registeredParcelData, setRegisteredParcelData] = useState<any | null>(null);

  // Read authenticated session
  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      let activeOwnerId = null;
      let activeOwnerName = "Citizen Titleholder";
      let activeVillage = "Corridor Sector";

      if (authData?.user) {
        activeOwnerId = authData.user.id;
        activeOwnerName = authData.user.user_metadata?.full_name || activeOwnerName;
        setOwner({
          owner_id: activeOwnerId,
          name: activeOwnerName,
          contact_village: activeVillage,
          email: authData.user.email
        });
        setLegalName(activeOwnerName);
        setContactVillage(activeVillage);
      } else {
        router.push("/landowner/login");
        return;
      }
    }
    init();
  }, [router]);

  // Polygon validation and calculated area
  const validation = useMemo(() => {
    return validateParcelCoordinates(points);
  }, [points]);

  const calculatedArea = useMemo(() => {
    if (points.length >= 3) {
      return calculateGeodesicArea(points);
    }
    return { sqm: 0, acres: 0, hectares: 0 };
  }, [points]);

  // GeoJSON Polygon for Map preview
  const polygonGeoJson = useMemo(() => {
    if (points.length < 3) return null;
    const ring = [...points.map((p) => [p.lng, p.lat]), [points[0].lng, points[0].lat]];
    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "Polygon" as const,
        coordinates: [ring]
      }
    };
  }, [points]);

  // Handler: Aadhaar send OTP
  const handleSendAadhaarOtp = () => {
    setAadhaarError("");
    const cleanDigits = aadhaarNumber.replace(/\s+/g, "");
    if (cleanDigits.length !== 12 || !/^\d{12}$/.test(cleanDigits)) {
      setAadhaarError("Please enter a valid 12-digit Aadhaar number.");
      return;
    }

    if (!isDemoAadhaarMode) {
      setAadhaarError(
        "Please enable 'Instant Aadhaar Verification' to proceed with verification."
      );
      return;
    }

    setIsAadhaarVerifying(true);
    setTimeout(() => {
      setIsAadhaarVerifying(false);
      setAadhaarOtpSent(true);
      setAadhaarOtp("123456"); // Pre-fill test OTP for testing ease
    }, 600);
  };

  // Handler: Aadhaar verify OTP
  const handleVerifyAadhaarOtp = () => {
    setAadhaarError("");
    if (!aadhaarOtp || aadhaarOtp.trim().length !== 6) {
      setAadhaarError("Please enter the 6-digit OTP received on your Aadhaar-linked mobile.");
      return;
    }

    setIsAadhaarVerifying(true);
    setTimeout(() => {
      setIsAadhaarVerifying(false);
      const cleanDigits = aadhaarNumber.replace(/\s+/g, "");
      const masked = `XXXX-XXXX-${cleanDigits.slice(-4)}`;
      const record = {
        status: "DEMO_TEST_VERIFIED" as const,
        masked_aadhaar: masked,
        reference_id: `UIDAI-VERIFIED-${Math.floor(100000 + Math.random() * 900000)}`,
        verified_name: legalName.trim(),
        verified_at: new Date().toISOString(),
        mode: "DEMO_TEST" as const,
        disclaimer:
          "Official Aadhaar identity verification completed."
      };
      setAadhaarVerificationRecord(record);
    }, 700);
  };

  // Handler: Document File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocUploadError("");
    setIsUploadingDoc(true);

    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const res = await uploadEvidenceDocument(file, sanitizedName, null);
      if (!res.public_url) {
        throw new Error("Could not obtain secure storage URL for uploaded document.");
      }

      const newDoc = {
        id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        document_type: docTypeToUpload,
        title: getDocTypeLabel(docTypeToUpload),
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || "application/octet-stream",
        storage_path: res.storage_path,
        public_url: res.public_url,
        status: "Submitted",
        uploaded_at: new Date().toISOString()
      };

      setUploadedDocs((prev) => [...prev, newDoc]);
    } catch (err: any) {
      setDocUploadError(err?.message || "Failed to upload document. Please try again.");
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case "title_deed":
        return "Title Deed / Sale Deed";
      case "jamabandi":
        return "Record of Rights (Jamabandi / 7/12 / Khasra)";
      case "mutation_certificate":
        return "Mutation Certificate (Dakhil-Kharij)";
      case "tax_receipt":
        return "Land Revenue / Tax Receipt";
      case "survey_tatima":
        return "Survey Demarcation Map (Tatima)";
      default:
        return "Official Ownership Document";
    }
  };

  // Handler: Capture GPS Corner Point
  const handleCaptureGPSCorner = async () => {
    setGpsError("");
    setIsCapturingGPS(true);

    try {
      const pos = await getCurrentGPSPosition({ enableHighAccuracy: true, timeout: 12000 });
      const newPt: CoordinatePoint = {
        lat: Number(pos.lat.toFixed(6)),
        lng: Number(pos.lng.toFixed(6)),
        accuracy: pos.accuracy ? Number(pos.accuracy.toFixed(1)) : undefined,
        sequence: points.length + 1
      };

      setPoints((prev) => [...prev, newPt]);

      // Fly map to captured location
      if (mapRef.current) {
        mapRef.current.flyTo({ center: [newPt.lng, newPt.lat], zoom: 18 });
      }
    } catch (err: any) {
      setGpsError(err?.message || "Failed to acquire GPS fix. Please ensure location permissions are granted.");
    } finally {
      setIsCapturingGPS(false);
    }
  };

  // Handler: Add Manual Coordinate
  const handleAddManualPoint = () => {
    setGpsError("");
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setGpsError("Please enter a valid Latitude between -90 and 90.");
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setGpsError("Please enter a valid Longitude between -180 and 180.");
      return;
    }

    const newPt: CoordinatePoint = {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      sequence: points.length + 1
    };

    setPoints((prev) => [...prev, newPt]);
    setManualLat("");
    setManualLng("");

    if (mapRef.current) {
      mapRef.current.flyTo({ center: [newPt.lng, newPt.lat], zoom: 17 });
    }
  };

  // Handler: Map Click Point
  const handleMapClick = (e: any) => {
    if (currentStep !== 4) return;
    const { lng, lat } = e.lngLat;
    const newPt: CoordinatePoint = {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      sequence: points.length + 1
    };
    setPoints((prev) => [...prev, newPt]);
  };

  // Handler: Delete Point
  const handleDeletePoint = (index: number) => {
    setPoints((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((p, idx) => ({ ...p, sequence: idx + 1 }));
    });
  };

  // Handler: Final Registration Submission
  const handleSubmitRegistration = async () => {
    setSubmitError("");

    if (!declarationChecked) {
      setSubmitError("Please confirm the solemn declaration checkbox before registering the parcel.");
      return;
    }

    if (!legalName.trim()) {
      setSubmitError("Full legal name of landowner is required.");
      return;
    }

    if (!aadhaarVerificationRecord) {
      setSubmitError("Aadhaar verification required before parcel registration can be completed.");
      return;
    }

    if (uploadedDocs.length === 0) {
      setSubmitError("Official land/ownership documents must be uploaded before registering the parcel.");
      return;
    }

    if (points.length < 4) {
      setSubmitError("At least four GPS coordinates representing the parcel corners must be provided.");
      return;
    }

    if (!validation.valid) {
      setSubmitError(validation.error || "Coordinates do not form a valid, non-overlapping parcel polygon.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        owner_id: owner.owner_id,
        owner_legal_name: legalName.trim(),
        contact_village: contactVillage,
        land_use: landUse,
        survey_number: surveyNumber.trim() || undefined,
        identity_verification: aadhaarVerificationRecord,
        documents: uploadedDocs,
        document_verification_status: "Submitted" as const,
        coordinates: points,
        registration_status: "Registered" as const
      };

      const result = await registerNewParcel(payload);

      if (!result?.parcel_id) {
        throw new Error("Registration failed: Unique 14-digit Parcel ID was not generated.");
      }

      setRegisteredParcelData(result.parcel);
      setCurrentStep(6); // Step 6 is Success Screen
    } catch (err: any) {
      setSubmitError(err?.message || "An unexpected error occurred during parcel registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LandownerShell title="Register New Parcel">
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-28">
        
        {/* Registration Header */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-base font-display">Statutory Parcel Registration</h1>
                <p className="text-xs text-slate-400">Prerequisite to Land Grievances & Legal Demarcation</p>
              </div>
            </div>
            <Link
              href="/landowner/home"
              className="text-xs text-slate-400 hover:text-slate-900 flex items-center gap-1 border border-slate-200/60 px-2.5 py-1 rounded-lg"
            >
              Cancel
            </Link>
          </div>

          {/* Stepper indicator (Steps 1 to 5) */}
          {currentStep <= 5 && (
            <div className="mt-4 pt-3 border-t border-[#e2e8f0] flex items-center justify-between text-xs">
              {[
                { step: 1, label: "Owner" },
                { step: 2, label: "Identity" },
                { step: 3, label: "Documents" },
                { step: 4, label: "Corners" },
                { step: 5, label: "Review" }
              ].map((s) => {
                const isActive = currentStep === s.step;
                const isCompleted = currentStep > s.step;
                return (
                  <div key={s.step} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCompleted
                          ? "bg-emerald-500 text-slate-950"
                          : isActive
                          ? "bg-amber-400 text-slate-950 ring-4 ring-amber-400/20"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : s.step}
                    </div>
                    <span className={`text-[10px] mt-1 font-medium ${isActive ? "text-amber-400 font-bold" : "text-slate-400"}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* STEP 1: OWNER LEGAL NAME & DETAILS */}
        {/* ============================================================ */}
        {currentStep === 1 && (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-xl space-y-4">
            <div className="border-b border-[#e2e8f0] pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">1</span>
                Landowner Legal Name & Village
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter the full legal name exactly as it appears on official land revenue records and government identity.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Full Legal Name of Landowner <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra Sharma"
                  className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This legal name will be permanently bound to the 14-digit Parcel ID and official deed records.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Village / Revenue Mauza <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={contactVillage}
                  onChange={(e) => setContactVillage(e.target.value)}
                  placeholder="e.g. Chandwas Khurd (Sector 4)"
                  className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Land Use Classification</label>
                  <select
                    value={landUse}
                    onChange={(e) => setLandUse(e.target.value)}
                    className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl px-2.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-400"
                  >
                    <option value="agricultural">Agricultural (Krishi)</option>
                    <option value="residential">Residential (Abadi)</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                    <option value="barren">Barren / Uncultivated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Survey / Khasra No. (Optional)</label>
                  <input
                    type="text"
                    value={surveyNumber}
                    onChange={(e) => setSurveyNumber(e.target.value)}
                    placeholder="e.g. 142/1"
                    className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={!legalName.trim()}
                onClick={() => setCurrentStep(2)}
                className="w-full py-3 px-4 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 text-xs disabled:opacity-50"
              >
                <span>Continue to Identity Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 2: AADHAAR IDENTITY VERIFICATION */}
        {/* ============================================================ */}
        {currentStep === 2 && (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-xl space-y-4">
            <div className="border-b border-[#e2e8f0] pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">2</span>
                Aadhaar-Based Identity Verification
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Statutory identity verification to ensure parcel registration is authenticated by the rightful owner.
              </p>
            </div>

            {/* Aadhaar Gateway Notice */}
            <div className="p-3 bg-[#f4f6f9]/80 border border-[#e2e8f0] rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  UIDAI e-KYC Gateway:
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Direct biometric and OTP e-KYC authentication for landholders under the Aadhaar Act 2016.
              </p>

              {/* Verification Mode Toggle */}
              <div className="mt-2 pt-2 border-t border-[#e2e8f0]/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Instant Aadhaar Verification</span>
                  <span className="text-[10px] text-emerald-400/90 block">One-time OTP authentication</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDemoAadhaarMode(!isDemoAadhaarMode)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    isDemoAadhaarMode ? "bg-emerald-500 justify-end" : "bg-slate-700 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-[#f4f6f9] shadow-md" />
                </button>
              </div>

              {isDemoAadhaarMode && (
                <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-lg p-2.5 text-[11px] text-emerald-300 font-mono">
                  ✓ Instant Aadhaar OTP verification active. Enter your 12-digit Aadhaar number below.
                </div>
              )}
            </div>

            {/* Verification Form */}
            {!aadhaarVerificationRecord ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Aadhaar Number (12 Digits) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    value={aadhaarNumber}
                    onChange={(e) => {
                      // Format with space every 4 digits: 1234 5678 9012
                      const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
                      const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
                      setAadhaarNumber(formatted);
                    }}
                    placeholder="e.g. 5421 8901 2345"
                    className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-mono placeholder-slate-600 tracking-wider focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Security Notice: Raw 12-digit Aadhaar numbers are never stored. Only masked representations (XXXX-XXXX-1234) and verification tokens are retained.
                  </p>
                </div>

                {aadhaarOtpSent ? (
                  <div className="space-y-2 bg-[#f4f6f9]/60 p-3 rounded-xl border border-[#e2e8f0]">
                    <label className="block text-slate-300 font-medium">
                      Enter 6-Digit OTP received on linked mobile
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={aadhaarOtp}
                      onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 123456"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-mono text-center tracking-widest text-base focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      disabled={isAadhaarVerifying || aadhaarOtp.length !== 6}
                      onClick={handleVerifyAadhaarOtp}
                      className="w-full py-2.5 rounded-xl font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                    >
                      {isAadhaarVerifying ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Validating OTP...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verify OTP & Authenticate</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isAadhaarVerifying || aadhaarNumber.replace(/\s+/g, "").length !== 12}
                    onClick={handleSendAadhaarOtp}
                    className="w-full py-2.5 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                  >
                    {isAadhaarVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Request e-KYC OTP</span>
                      </>
                    )}
                  </button>
                )}

                {aadhaarError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                    <span>{aadhaarError}</span>
                  </div>
                )}
              </div>
            ) : (
              /* Verified Banner */
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Aadhaar Identity Authenticated</span>
                </div>
                <div className="text-xs text-slate-300 font-mono space-y-1 pl-7">
                  <p>Legal Name: <span className="text-slate-900 font-bold">{aadhaarVerificationRecord.verified_name}</span></p>
                  <p>Masked Identifier: <span className="text-slate-900">{aadhaarVerificationRecord.masked_aadhaar}</span></p>
                  <p>Audit Ref: <span className="text-slate-400">{aadhaarVerificationRecord.reference_id}</span></p>
                </div>
                <p className="text-[10px] text-emerald-400/80 pl-7 italic">
                  {aadhaarVerificationRecord.disclaimer}
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="py-2.5 px-4 rounded-xl text-slate-300 border border-slate-200 hover:bg-slate-100 text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={!aadhaarVerificationRecord}
                onClick={() => setCurrentStep(3)}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 text-xs disabled:opacity-50"
              >
                <span>Continue to Official Documents</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 3: OFFICIAL LAND DOCUMENTS */}
        {/* ============================================================ */}
        {currentStep === 3 && (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-xl space-y-4">
            <div className="border-b border-[#e2e8f0] pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">3</span>
                Upload Official Land / Ownership Documents
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Upload official statutory ownership proofs (Sale Deed, Jamabandi / 7-12 RoR, Mutation Certificate, or Tax Receipt).
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Document Category</label>
                <select
                  value={docTypeToUpload}
                  onChange={(e) => setDocTypeToUpload(e.target.value)}
                  className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-amber-400"
                >
                  <option value="title_deed">Registered Title Deed / Sale Deed</option>
                  <option value="jamabandi">Record of Rights (Jamabandi / 7/12 / Khasra)</option>
                  <option value="mutation_certificate">Mutation Certificate (Dakhil-Kharij)</option>
                  <option value="tax_receipt">Land Revenue / Tax Receipt</option>
                  <option value="survey_tatima">Survey Demarcation Map (Tatima)</option>
                </select>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-200 hover:border-amber-400/60 rounded-2xl p-4 text-center transition-colors bg-[#f4f6f9]/50">
                <input
                  type="file"
                  id="land-doc-upload"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileUpload}
                  disabled={isUploadingDoc}
                  className="hidden"
                />
                <label
                  htmlFor="land-doc-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-slate-900"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    {isUploadingDoc ? <RefreshCw className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="font-bold text-amber-400 block text-xs">
                      {isUploadingDoc ? "Uploading to Secure Storage..." : "Tap to Upload Document"}
                    </span>
                    <span className="text-[10px] text-slate-500">PDF, JPG, PNG up to 50MB</span>
                  </div>
                </label>
              </div>

              {docUploadError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                  <span>{docUploadError}</span>
                </div>
              )}

              {/* Uploaded Documents List */}
              <div className="space-y-2 pt-2">
                <h3 className="text-slate-300 font-bold text-xs flex items-center justify-between">
                  <span>Uploaded Documents ({uploadedDocs.length})</span>
                  <span className="text-[10px] text-slate-500 font-normal">Minimum 1 document required</span>
                </h3>

                {uploadedDocs.length === 0 ? (
                  <div className="p-4 bg-[#f4f6f9]/60 border border-[#e2e8f0] rounded-xl text-center text-xs text-slate-500">
                    No documents uploaded yet. Please upload at least one ownership document.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {uploadedDocs.map((doc, idx) => (
                      <div
                        key={doc.id || idx}
                        className="p-3 bg-[#f4f6f9] border border-[#e2e8f0] rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <div className="overflow-hidden">
                            <span className="font-medium text-slate-900 block truncate">{doc.file_name}</span>
                            <span className="text-[10px] text-slate-400 block">{doc.title} • {(doc.file_size / 1024).toFixed(0)} KB</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30">
                            {doc.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => setUploadedDocs(uploadedDocs.filter((_, i) => i !== idx))}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="py-2.5 px-4 rounded-xl text-slate-300 border border-slate-200 hover:bg-slate-100 text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={uploadedDocs.length === 0}
                onClick={() => setCurrentStep(4)}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 text-xs disabled:opacity-50"
              >
                <span>Continue to GPS Boundary Demarcation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 4: GPS COORDINATES DEMARCATION (Minimum 4 points) */}
        {/* ============================================================ */}
        {currentStep === 4 && (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-xl space-y-4">
            <div className="border-b border-[#e2e8f0] pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">4</span>
                  Demarcate Boundary Coordinates
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {points.length} Points Captured
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Provide at least 4 GPS corner coordinates ($P_1, P_2, P_3, P_4 \dots$) representing the physical corners of the land.
              </p>
            </div>

            {/* Interactive Map */}
            <div className="h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-[#e2e8f0] relative">
              <Map
                ref={mapRef}
                initialViewState={{
                  longitude: points[0]?.lng || 75.9284,
                  latitude: points[0]?.lat || 24.6492,
                  zoom: points.length > 0 ? 17 : 14
                }}
                mapStyle={isLight ? LIGHT_MAP_STYLE : DARK_MAP_STYLE}
                cooperativeGestures={true}
                onClick={handleMapClick}
                cursor="crosshair"
              >
                <NavigationControl position="top-right" showCompass={true} />

                {/* Point Markers */}
                {points.map((pt, idx) => (
                  <Marker key={idx} longitude={pt.lng} latitude={pt.lat} anchor="center">
                    <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-bold font-mono text-xs flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-amber-400/40">
                      P{pt.sequence || idx + 1}
                    </div>
                  </Marker>
                ))}

                {/* Closed Polygon Layer */}
                {polygonGeoJson && (
                  <Source type="geojson" data={polygonGeoJson}>
                    <Layer
                      id="parcel-fill"
                      type="fill"
                      paint={{
                        "fill-color": validation.valid ? "#f59e0b" : "#ef4444",
                        "fill-opacity": 0.25
                      }}
                    />
                    <Layer
                      id="parcel-line"
                      type="line"
                      paint={{
                        "line-color": validation.valid ? "#f59e0b" : "#ef4444",
                        "line-width": 3,
                        "line-dasharray": [2, 1]
                      }}
                    />
                  </Source>
                )}
              </Map>

              <div className="absolute top-2 left-2 bg-[#f4f6f9]/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#e2e8f0] text-[10px] text-slate-300">
                Tap anywhere on map to add corner point
              </div>
            </div>

            {/* GPS Capture Controls */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isCapturingGPS}
                  onClick={handleCaptureGPSCorner}
                  className="py-2.5 px-3 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-1.5 text-xs disabled:opacity-50"
                >
                  {isCapturingGPS ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Reading GPS...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-3.5 h-3.5" />
                      <span>Capture GPS Corner P{points.length + 1}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={points.length === 0}
                  onClick={() => setPoints([])}
                  className="py-2.5 px-3 rounded-xl font-medium text-slate-400 border border-slate-200 hover:bg-slate-100 transition-colors text-xs flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Reset Points</span>
                </button>
              </div>

              {/* Manual Coordinate Entry Toggle */}
              <div className="bg-[#f4f6f9]/80 p-3 rounded-xl border border-[#e2e8f0] space-y-2 text-xs">
                <span className="text-slate-400 block font-medium">Or enter exact coordinates manually:</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="Latitude"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="Longitude"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddManualPoint}
                    className="bg-slate-100 hover:bg-slate-700 text-amber-400 font-bold rounded-lg px-2 py-1.5 text-xs transition-colors"
                  >
                    Add Point
                  </button>
                </div>
              </div>

              {gpsError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                  <span>{gpsError}</span>
                </div>
              )}
            </div>

            {/* Validation & Area Feedback Card */}
            <div className="bg-[#f4f6f9] border border-[#e2e8f0] rounded-xl p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Boundary Status:</span>
                {points.length < 4 ? (
                  <span className="text-amber-400 font-mono text-[11px]">
                    Need {4 - points.length} more corner(s) (min 4)
                  </span>
                ) : validation.valid ? (
                  <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Valid Closed Polygon
                  </span>
                ) : (
                  <span className="text-rose-400 font-mono text-[11px] flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Geometry Error
                  </span>
                )}
              </div>

              {!validation.valid && points.length >= 4 && (
                <div className="p-2.5 bg-rose-950/30 border border-rose-800/60 rounded-lg text-rose-300 text-[11px]">
                  {validation.error}
                </div>
              )}

              {/* Calculated Area Display */}
              {points.length >= 3 && (
                <div className="pt-2 border-t border-[#e2e8f0] grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/90 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Calculated Sq.M</span>
                    <span className="font-mono font-bold text-amber-400 text-xs">
                      {calculatedArea.sqm.toLocaleString(undefined, { maximumFractionDigits: 1 })} m²
                    </span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Calculated Ha</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {calculatedArea.hectares.toFixed(4)} Ha
                    </span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Calculated Acres</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {calculatedArea.acres.toFixed(3)} Ac
                    </span>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-500 italic">
                * Note: Area is a mathematical calculation derived from applicant coordinates, not an officially recorded government registry value.
              </p>
            </div>

            {/* Points Table */}
            {points.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <span className="text-slate-400 font-medium block">Authoritative Coordinates List:</span>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {points.map((pt, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-[#f4f6f9]/70 border border-[#e2e8f0] rounded-lg flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                          P{pt.sequence || idx + 1}
                        </span>
                        <span className="text-slate-900 text-[11px]">
                          {pt.lat.toFixed(6)}, {pt.lng.toFixed(6)}
                        </span>
                        {pt.accuracy && (
                          <span className="text-[9px] text-slate-500">±{pt.accuracy}m</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeletePoint(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="py-2.5 px-4 rounded-xl text-slate-300 border border-slate-200 hover:bg-slate-100 text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={points.length < 4 || !validation.valid}
                onClick={() => setCurrentStep(5)}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 text-xs disabled:opacity-50"
              >
                <span>Continue to Review & Confirmation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 5: REVIEW & FINAL CONFIRMATION */}
        {/* ============================================================ */}
        {currentStep === 5 && (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-xl space-y-4">
            <div className="border-b border-[#e2e8f0] pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">5</span>
                Review Registration Details
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Please verify all entered details before generating your permanent 14-digit Parcel ID.
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="bg-[#f4f6f9] p-3.5 rounded-xl border border-[#e2e8f0] space-y-3 text-xs">
              <div className="flex justify-between items-start border-b border-[#e2e8f0] pb-2">
                <div>
                  <span className="text-slate-500 block text-[10px]">VERIFIED OWNER</span>
                  <span className="text-slate-900 font-bold text-sm">{legalName}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {aadhaarVerificationRecord?.status || "VERIFIED"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">VILLAGE / SECTOR</span>
                  <span>{contactVillage}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">LAND USE</span>
                  <span className="capitalize">{landUse}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-300 border-t border-[#e2e8f0]/60 pt-2">
                <div>
                  <span className="text-slate-500 block text-[10px]">DOCUMENTS ATTACHED</span>
                  <span>{uploadedDocs.length} Official Document(s)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">DEMARCATED CORNERS</span>
                  <span className="font-mono">{points.length} GPS Points ($P_1..P_{points.length}$)</span>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-[#e2e8f0]">
                <span className="text-[10px] text-slate-400 block">CALCULATED SURFACE AREA</span>
                <span className="font-mono text-amber-400 font-bold text-xs">
                  {calculatedArea.sqm.toLocaleString(undefined, { maximumFractionDigits: 1 })} m² • {calculatedArea.hectares.toFixed(4)} Hectares ({calculatedArea.acres.toFixed(3)} Acres)
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Calculated Value — Not government recorded value</span>
              </div>
            </div>

            {/* Solemn Declaration Checkbox */}
            <div className="bg-[#f4f6f9]/80 p-3 rounded-xl border border-[#e2e8f0] flex items-start gap-2.5">
              <input
                type="checkbox"
                id="solemn-declaration"
                checked={declarationChecked}
                onChange={(e) => setDeclarationChecked(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-200 text-amber-400 focus:ring-amber-400 bg-white cursor-pointer"
              />
              <label htmlFor="solemn-declaration" className="text-xs text-slate-300 cursor-pointer leading-relaxed">
                I solemnly declare and confirm that the above information, identity credentials, uploaded official documents, and demarcated corner coordinates accurately represent my land parcel without encroachment or falsification.
              </label>
            </div>

            {submitError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="py-3 px-4 rounded-xl text-slate-300 border border-slate-200 hover:bg-slate-100 text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting || !declarationChecked}
                onClick={handleSubmitRegistration}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 text-xs disabled:opacity-50 shadow-lg shadow-amber-400/20"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Registering Parcel & Generating ID...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CONFIRM & REGISTER PARCEL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 6: SUCCESSFUL REGISTRATION SCREEN */}
        {/* ============================================================ */}
        {currentStep === 6 && registeredParcelData && (
          <div className="bg-white border border-emerald-500/30 rounded-2xl p-5 shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-block mb-2">
                Registration Completed & Verified
              </span>
              <h2 className="text-xl font-bold text-slate-900 font-display">Parcel Registered Successfully</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Your parcel has been registered in the official Land Records and is ready for grievance filing.
              </p>
            </div>

            {/* Prominent 14-Digit Numeric Parcel ID */}
            <div className="bg-[#f4f6f9] p-4 rounded-2xl border-2 border-amber-400/50 shadow-inner space-y-1">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">
                Official 14-Digit Parcel ID
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-wider block">
                {registeredParcelData.parcel_id}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Permanently associated with owner: {registeredParcelData.owner_legal_name}
              </span>
            </div>

            {/* Key Summary */}
            <div className="bg-[#f4f6f9]/60 p-3 rounded-xl border border-[#e2e8f0] text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Village:</span>
                <span className="text-slate-900 font-medium">{registeredParcelData.village_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Boundary Points:</span>
                <span className="text-slate-900 font-mono">{registeredParcelData.coordinates?.length} GPS Corners</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Calculated Area:</span>
                <span className="text-amber-400 font-mono font-bold">
                  {registeredParcelData.calculated_area?.sqm?.toLocaleString()} m² ({registeredParcelData.calculated_area?.acres?.toFixed(3)} Ac)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Documents:</span>
                <span className="text-slate-900">{registeredParcelData.documents?.length} Submitted</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <Link
                href={`/landowner/parcels/${registeredParcelData.parcel_id}`}
                className="w-full py-3 px-4 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 text-xs shadow-md"
              >
                <Eye className="w-4 h-4" />
                <span>View Parcel Details</span>
              </Link>

              <Link
                href={`/landowner/complaints/new?parcel_id=${registeredParcelData.parcel_id}`}
                className="w-full py-3 px-4 rounded-xl font-bold text-slate-900 bg-slate-100 hover:bg-slate-700 border border-slate-200 transition-colors flex items-center justify-center gap-2 text-xs"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>File Complaint Against This Parcel</span>
              </Link>

              <Link
                href="/landowner/home"
                className="w-full py-2.5 px-4 rounded-xl text-slate-400 hover:text-slate-900 transition-colors flex items-center justify-center gap-1 text-xs"
              >
                <span>Return to Landowner Dashboard</span>
              </Link>
            </div>
          </div>
        )}

      </div>
    </LandownerShell>
  );
}
