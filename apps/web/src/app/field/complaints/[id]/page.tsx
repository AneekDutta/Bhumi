"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FileText, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ArrowLeft,
  Compass,
  Layers,
  ShieldCheck,
  Send,
  Plus,
  Trash2,
  ExternalLink,
  ClipboardCheck
} from "lucide-react";
import { FieldShell } from "@/components/field/FieldShell";
import { 
  getLandownerComplaints, 
  acceptComplaintForSiteVisit, 
  submitFieldGroundVerification,
  linkOfficialParcelToComplaint,
  getFieldParcels
} from "@/lib/api";
import { offlineStore } from "@/lib/offlineStore";
import { getCurrentGPSPosition, LocationCoordinates } from "@/lib/native/geolocation";
import { calculatePolygonAreaAndUncertainty, AreaAndUncertaintyResult, BoundaryPointWithAccuracy } from "@/lib/spatial/geodesicArea";
import { useRealtimeComplaints } from "@/lib/supabase/useRealtime";

interface FieldPoint extends BoundaryPointWithAccuracy {
  sequence: number;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
}

export default function FieldComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const complaintId = params.id as string;

  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [officer, setOfficer] = useState<any>(null);
  const [parcels, setParcels] = useState<any[]>([]);

  // Action states
  const [accepting, setAccepting] = useState(false);
  const [acceptNotes, setAcceptNotes] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Ground Verification Survey Form
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [surveyPoints, setSurveyPoints] = useState<FieldPoint[]>([]);
  const [capturingPoint, setCapturingPoint] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"VERIFIED" | "PARTIALLY VERIFIED" | "NOT VERIFIED">("VERIFIED");
  const [surveyNotes, setSurveyNotes] = useState("");
  const [submittingSurvey, setSubmittingSurvey] = useState(false);

  // Parcel Link
  const [selectedLinkParcel, setSelectedLinkParcel] = useState("");
  const [linkingParcel, setLinkingParcel] = useState(false);

  // Calculate Field Area
  const fieldAreaResult: AreaAndUncertaintyResult | null = useMemo(() => {
    if (surveyPoints.length < 4) return null;
    return calculatePolygonAreaAndUncertainty(surveyPoints);
  }, [surveyPoints]);

  const loadData = async () => {
    try {
      const [allComplaints, allParcels] = await Promise.all([
        getLandownerComplaints(),
        getFieldParcels()
      ]);
      const match = allComplaints.find((c: any) => c.id === complaintId || c.complaint_id === complaintId);
      setComplaint(match || null);
      setParcels(allParcels || []);
    } catch {
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const active = offlineStore.getActiveOfficer();
    setOfficer(active || { officer_id: "OF001", name: "Ramesh Patel", designation: "Patwari / Lekhpal" });
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaintId]);

  useRealtimeComplaints(complaintId, () => {
    loadData();
  });

  const handleAcceptSiteVisit = async () => {
    setAccepting(true);
    setFeedback(null);
    try {
      const res = await acceptComplaintForSiteVisit(
        complaintId,
        officer?.officer_id || "OF001",
        officer?.name || "Ramesh Patel",
        acceptNotes.trim()
      );
      setFeedback({ type: "success", message: res?.message || "Complaint accepted for site visit." });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Failed to accept site visit." });
    } finally {
      setAccepting(false);
    }
  };

  const handleCaptureFieldPoint = async () => {
    setCapturingPoint(true);
    try {
      let pos: LocationCoordinates;
      if (isDemoMode) {
        // DEMO MODE: simulated accuracy between ±12m and ±15m
        const simAcc = Number((12.0 + Math.random() * 3.0).toFixed(1));
        const baseLat = complaint?.landowner_reported_location?.lat || 24.6650;
        const baseLng = complaint?.landowner_reported_location?.lng || 75.9520;
        const seq = surveyPoints.length;
        const offsets = [
          [0.0, 0.0],
          [0.0011, 0.0001],
          [0.0010, 0.0009],
          [-0.0001, 0.0008]
        ];
        const offset = offsets[seq % offsets.length];
        pos = {
          lat: Number((baseLat + offset[1]).toFixed(6)),
          lng: Number((baseLng + offset[0]).toFixed(6)),
          accuracy: simAcc,
          timestamp: Date.now()
        };
      } else {
        // REAL GPS MODE: Hardware GPS only
        pos = await getCurrentGPSPosition({ enableHighAccuracy: true, timeout: 15000 });
      }

      const newPt: FieldPoint = {
        sequence: surveyPoints.length + 1,
        lat: pos.lat,
        lng: pos.lng,
        accuracy: pos.accuracy,
        timestamp: new Date().toISOString()
      };
      setSurveyPoints((prev) => [...prev, newPt]);
    } catch (err: any) {
      alert(err?.message || "GPS capture failed. Check device location permissions.");
    } finally {
      setCapturingPoint(false);
    }
  };

  const handleRemoveFieldPoint = (idx: number) => {
    setSurveyPoints((prev) => {
      const filtered = prev.filter((_, i) => i !== idx);
      return filtered.map((p, i) => ({ ...p, sequence: i + 1 }));
    });
  };

  const handleSubmitGroundSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (surveyPoints.length === 0) {
      alert("Please capture at least 1 verified GPS point or 4 corner points for boundary.");
      return;
    }
    setSubmittingSurvey(true);
    setFeedback(null);

    try {
      const primaryLoc = {
        lat: surveyPoints[0].lat,
        lng: surveyPoints[0].lng,
        accuracy: surveyPoints[0].accuracy,
        captured_at: surveyPoints[0].timestamp
      };

      let boundaryGeoJSON: any = null;
      if (surveyPoints.length >= 4) {
        const ring: [number, number][] = surveyPoints.map((p) => [p.lng, p.lat]);
        ring.push([surveyPoints[0].lng, surveyPoints[0].lat]);
        boundaryGeoJSON = {
          type: "Polygon",
          coordinates: [ring],
          points: surveyPoints
        };
      }

      const payload = {
        complaint_id: complaintId,
        officer_id: officer?.officer_id || "OF001",
        officer_name: officer?.name || "Ramesh Patel",
        field_verified_boundary: boundaryGeoJSON,
        field_verified_location: primaryLoc,
        field_verified_area: fieldAreaResult ? {
          sqm: fieldAreaResult.areaSqm,
          acres: fieldAreaResult.areaAcres,
          hectares: fieldAreaResult.areaHectares
        } : null,
        field_gps_accuracy: surveyPoints[0].accuracy,
        verification_status: verificationStatus,
        observations: surveyNotes.trim() || "On-site physical inspection and boundary survey conducted.",
        is_demo_simulation: isDemoMode
      };

      const res = await submitFieldGroundVerification(payload);
      setFeedback({ type: "success", message: res?.message || "Field ground verification recorded successfully." });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Failed to submit ground verification." });
    } finally {
      setSubmittingSurvey(false);
    }
  };

  const handleLinkOfficialParcel = async () => {
    if (!selectedLinkParcel) return;
    setLinkingParcel(true);
    setFeedback(null);
    try {
      const res = await linkOfficialParcelToComplaint(complaintId, selectedLinkParcel, officer?.name || "Field Officer");
      setFeedback({ type: "success", message: res?.message || `Linked official parcel #${selectedLinkParcel}.` });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Failed to link parcel." });
    } finally {
      setLinkingParcel(false);
    }
  };

  if (loading) {
    return (
      <FieldShell title="Review Grievance">
        <div className="py-20 text-center text-xs text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
          <span>Loading grievance data...</span>
        </div>
      </FieldShell>
    );
  }

  if (!complaint) {
    return (
      <FieldShell title="Review Grievance">
        <div className="p-4 text-center py-20 space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <h2 className="text-sm font-bold text-white">Grievance Not Found</h2>
          <Link href="/field/complaints" className="inline-block px-4 py-2 rounded-xl bg-slate-800 text-emerald-400 text-xs font-semibold">
            ← Return to Grievance Queue
          </Link>
        </div>
      </FieldShell>
    );
  }

  const status = complaint.status || "SUBMITTED — AWAITING FIELD REVIEW";
  const isUnregistered = !complaint.parcel_id || complaint.parcel_id === "null";
  const declaredArea = complaint.landowner_declared_area;
  const fieldVerification = complaint.field_verification;

  return (
    <FieldShell title={`Review #${complaint.complaint_id}`} showBack>
      <div className="p-4 space-y-5 max-w-lg mx-auto pb-24">
        
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/field/complaints"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Queue</span>
          </Link>
          <span className="text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
            {status.replace(/_/g, " ")}
          </span>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-fadeIn ${
            feedback.type === "success" 
              ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-200" 
              : "bg-red-500/15 border border-red-500/40 text-red-200"
          }`}>
            {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* SECTION 1: CITIZEN CLAIM OVERVIEW */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold block mb-0.5">
                Citizen Landowner Claim
              </span>
              <h1 className="text-base font-bold text-white">
                {complaint.complaint_type}
              </h1>
              <p className="text-xs text-slate-300">
                Landowner: <strong>{complaint.owner_name}</strong> · Village: {complaint.contact_village || "Corridor Sector"}
              </p>
            </div>

            {isUnregistered && (
              <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold">
                UNREGISTERED
              </span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Citizen Statement:</span>
            <p className="text-xs text-slate-200 leading-relaxed">{complaint.description}</p>
          </div>

          {/* Landowner Reported Location */}
          {(complaint.landowner_reported_location || complaint.gps) && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs font-mono">
              <span className="text-[10px] uppercase text-amber-400 font-bold block">
                Landowner-Reported GPS Fix:
              </span>
              <div className="grid grid-cols-3 gap-2 text-slate-300">
                <div>Lat: {(complaint.landowner_reported_location?.lat || complaint.gps?.lat)}° N</div>
                <div>Lng: {(complaint.landowner_reported_location?.lng || complaint.gps?.lng)}° E</div>
                <div>Acc: ±{(complaint.landowner_reported_location?.accuracy || complaint.gps?.accuracy)}m</div>
              </div>
            </div>
          )}

          {/* Landowner Declared Area */}
          {declaredArea && (
            <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                  LANDOWNER-REPORTED / ESTIMATED
                </span>
                <span className="text-[10px] font-mono text-slate-400">GPS Polygon Estimate</span>
              </div>
              <div className="font-mono text-white font-bold">
                {declaredArea.acres || (declaredArea.sqm * 0.000247105).toFixed(4)} acres ({declaredArea.sqm} m²)
              </div>
            </div>
          )}

          {/* Landowner Attached Documents */}
          {complaint.document_evidence && (
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 text-[10px] font-bold uppercase font-mono">
                  Document Evidence (LANDOWNER-SUBMITTED / UNVERIFIED)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-200 truncate">{complaint.document_evidence.file_name}</span>
                {complaint.document_evidence.public_url && (
                  <a
                    href={complaint.document_evidence.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-300 hover:underline text-[11px] font-semibold flex items-center gap-1"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: ACCEPT COMPLAINT FOR SITE VISIT */}
        {status.includes("SUBMITTED") && (
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Accept Complaint for Site Visit
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              Confirm that you will conduct an on-site physical inspection to verify the citizen&apos;s boundary claim.
            </p>

            <textarea
              value={acceptNotes}
              onChange={(e) => setAcceptNotes(e.target.value)}
              placeholder="Enter field notes or tentative visit schedule (optional)..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />

            <button
              type="button"
              disabled={accepting}
              onClick={handleAcceptSiteVisit}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-950/50"
            >
              {accepting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Accept Complaint for Site Visit</span>
            </button>
          </div>
        )}

        {/* SECTION 3: GROUND SURVEY & FIELD VERIFICATION */}
        <form onSubmit={handleSubmitGroundSurvey} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Conduct Ground Survey & Verification
              </h2>
            </div>
            <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
              On-Site Demarcation
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Conduct on-site demarcation. This records independent field verification data without altering the citizen&apos;s original reported claim.
          </p>

          {/* Mode Switcher for Field Survey */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setIsDemoMode(false)}
              className={`py-1.5 px-3 rounded-xl font-bold transition-all ${
                !isDemoMode ? "bg-emerald-600 text-white" : "bg-slate-950 text-slate-400 border border-slate-800"
              }`}
            >
              Real Device GPS
            </button>
            <button
              type="button"
              onClick={() => setIsDemoMode(true)}
              className={`py-1.5 px-3 rounded-xl font-bold transition-all ${
                isDemoMode ? "bg-purple-600 text-white" : "bg-slate-950 text-slate-400 border border-slate-800"
              }`}
            >
              Demo Simulation (±12m - ±15m)
            </button>
          </div>

          {/* GPS Point Capture Button */}
          <div className="space-y-2">
            <button
              type="button"
              disabled={capturingPoint}
              onClick={handleCaptureFieldPoint}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border-2 border-dashed border-emerald-500/50 hover:border-emerald-400 text-emerald-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {capturingPoint ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Recording GPS Coordinates...</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>+ Record Field Survey Point {surveyPoints.length + 1}</span>
                </>
              )}
            </button>

            {/* List of captured field points */}
            {surveyPoints.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-xs">
                {surveyPoints.map((pt, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-white text-[11px]">
                      P{pt.sequence}: {pt.lat}°, {pt.lng}° (±{pt.accuracy}m)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFieldPoint(idx)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Calculated Field Area */}
          {surveyPoints.length >= 4 && fieldAreaResult && (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs font-mono space-y-1">
              <span className="text-emerald-400 font-bold block uppercase text-[10px]">
                Field-Verified Ground Area:
              </span>
              <div className="text-base text-white font-bold">
                {fieldAreaResult.areaAcres} acres ({fieldAreaResult.areaSqm.toLocaleString()} m²)
              </div>
              <p className="text-[10px] text-slate-400">{fieldAreaResult.uncertaintyExplanation}</p>
            </div>
          )}

          {/* Verification Status Radio */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Verification Outcome Status <span className="text-amber-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["VERIFIED", "PARTIALLY VERIFIED", "NOT VERIFIED"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setVerificationStatus(s)}
                  className={`py-2 px-2 rounded-xl text-[10px] font-bold transition-all text-center ${
                    verificationStatus === s
                      ? s === "VERIFIED"
                        ? "bg-emerald-600 text-white shadow-md"
                        : s === "PARTIALLY VERIFIED"
                        ? "bg-amber-600 text-white shadow-md"
                        : "bg-red-600 text-white shadow-md"
                      : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Officer Observations */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Field Officer Findings & Observations
            </label>
            <textarea
              value={surveyNotes}
              onChange={(e) => setSurveyNotes(e.target.value)}
              placeholder="e.g. Boundary verified on the ground with revenue pillar #412. Discrepancy observed on northern flank..."
              rows={3}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={submittingSurvey || surveyPoints.length === 0}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/50 disabled:opacity-60"
          >
            {submittingSurvey ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Recording Ground Verification...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Submit Field Ground Verification</span>
              </>
            )}
          </button>
        </form>

        {/* SECTION 4: LINK OFFICIAL PARCEL (If Unregistered) */}
        {isUnregistered && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Link Official Cadastral Parcel
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              If an official corridor survey parcel corresponds to this claim, associate it with the grievance.
            </p>

            <select
              value={selectedLinkParcel}
              onChange={(e) => setSelectedLinkParcel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="">-- Select matching official parcel --</option>
              {parcels.map((p) => (
                <option key={p.parcel_id || p.id} value={p.parcel_id || p.id}>
                  {p.parcel_id || p.id} (Survey {p.survey_number || p.survey_no || "Khasra"}) · {p.village_name || "Chandwas"}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={linkingParcel || !selectedLinkParcel}
              onClick={handleLinkOfficialParcel}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {linkingParcel ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              <span>Link Official Parcel to Complaint</span>
            </button>
          </div>
        )}

      </div>
    </FieldShell>
  );
}
