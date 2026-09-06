"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FileText, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  User, 
  RefreshCw, 
  Camera,
  ArrowLeft,
  Compass,
  Layers,
  Check,
  XCircle,
  AlertCircle
} from "lucide-react";
import { LandownerShell } from "@/components/landowner/LandownerShell";
import { getLandownerComplaints } from "@/lib/api";
import { useRealtimeComplaints } from "@/lib/supabase/useRealtime";

export default function LandownerComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const complaintId = params.id as string;

  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const all = await getLandownerComplaints();
      const match = all.find((c) => c.id === complaintId || c.complaint_id === complaintId);
      setComplaint(match || null);
    } catch {
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaintId]);

  // Realtime hook for immediate sync
  useRealtimeComplaints(complaintId, () => {
    loadData();
  });

  if (loading) {
    return (
      <LandownerShell title="Grievance Details" showBack>
        <div className="py-20 text-center text-xs text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
          <span>Fetching real-time case data...</span>
        </div>
      </LandownerShell>
    );
  }

  if (!complaint) {
    return (
      <LandownerShell title="Grievance Details" showBack>
        <div className="p-4 text-center py-20 space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <h2 className="text-sm font-bold text-white">Case Not Found</h2>
          <p className="text-xs text-slate-400">The requested grievance case could not be retrieved.</p>
          <Link href="/landowner/complaints" className="inline-block px-4 py-2 rounded-xl bg-slate-800 text-emerald-400 text-xs font-semibold">
            ← Return to Grievance List
          </Link>
        </div>
      </LandownerShell>
    );
  }

  const status = complaint.status || "SUBMITTED — AWAITING FIELD REVIEW";
  const isResolved = status === "RESOLVED";
  const isRejected = status === "REJECTED";
  const isVerified = status === "VERIFIED" || status === "PARTIALLY_VERIFIED" || status === "NOT_VERIFIED" || !!complaint.field_verification;
  const isSiteVisitAccepted = status === "SITE VISIT ACCEPTED" || status === "SITE_VISIT_ACCEPTED" || !!complaint.assigned_officer;

  const isDemo = complaint.is_demo_simulation;
  const isUnregistered = !complaint.parcel_id || complaint.parcel_id === "null";

  const declaredArea = complaint.landowner_declared_area;
  const fieldVerification = complaint.field_verification || complaint.verification;

  return (
    <LandownerShell title={`Case #${complaint.complaint_id}`} showBack>
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Status Hero Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block mb-0.5">
                Case Tracking Ref
              </span>
              <h1 className="text-lg font-bold text-white font-display">
                {complaint.complaint_id}
              </h1>
              <p className="text-xs text-slate-400">
                {isUnregistered ? (
                  <span className="text-amber-300 font-semibold">UNREGISTERED LAND CLAIM (No Pre-existing Parcel)</span>
                ) : (
                  <>Parcel: <strong className="text-slate-200">{complaint.parcel_id}</strong> (Survey {complaint.survey_number})</>
                )}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${
                  isResolved
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : isRejected
                    ? "bg-red-500/15 text-red-300 border-red-500/30"
                    : isVerified
                    ? "bg-teal-500/15 text-teal-300 border-teal-500/30"
                    : isSiteVisitAccepted
                    ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                    : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                }`}
              >
                {status.replace(/_/g, " ")}
              </span>

              {isDemo && (
                <span className="text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded font-bold">
                  DEMO DATA / SIMULATION
                </span>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <span className="text-slate-400 text-[10px] block uppercase tracking-wide">Category</span>
            <span className="text-white text-xs font-semibold">{complaint.complaint_type}</span>
          </div>

          {/* Citizen Statement */}
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] block uppercase tracking-wide">Citizen Statement</span>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/50">
              {complaint.description}
            </p>
          </div>

          {/* Landowner-Reported GPS Location & Boundary */}
          {(complaint.landowner_reported_location || complaint.gps) && (
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Landowner-Reported Location</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                  {isDemo ? "Simulated Fix" : "Device GPS Satellite Fix"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-1">
                <div>
                  <span className="text-[10px] text-slate-500 block">Latitude</span>
                  <span className="text-white font-bold">
                    {(complaint.landowner_reported_location?.lat || complaint.gps?.lat)}° N
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Longitude</span>
                  <span className="text-white font-bold">
                    {(complaint.landowner_reported_location?.lng || complaint.gps?.lng)}° E
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Accuracy</span>
                  <span className="text-slate-300">
                    ±{(complaint.landowner_reported_location?.accuracy || complaint.gps?.accuracy)}m
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Landowner Declared Area */}
          {declaredArea && (
            <div className="bg-gradient-to-br from-slate-950 to-amber-950/20 p-3.5 rounded-xl border border-amber-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  LANDOWNER-REPORTED / ESTIMATED
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {isDemo ? "SIMULATED ESTIMATE" : "GPS-based estimate"}
                </span>
              </div>
              <div className="text-base font-bold font-mono text-white">
                {declaredArea.acres || (declaredArea.sqm ? (declaredArea.sqm * 0.000247105).toFixed(4) : "-")} acres
                <span className="text-xs text-slate-400 font-normal ml-2">
                  ({declaredArea.sqm ? declaredArea.sqm.toLocaleString() : "-"} m²)
                </span>
              </div>
              {declaredArea.uncertainty_explanation && (
                <p className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                  {declaredArea.uncertainty_explanation}
                </p>
              )}
            </div>
          )}

          {/* Supporting Document Evidence */}
          {(complaint.document_evidence || (complaint.landowner_documents && complaint.landowner_documents.length > 0)) && (
            <div className="bg-amber-950/20 border border-amber-500/30 p-3.5 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider block">
                  Supporting Legal Document
                </span>
                <span className="text-[9px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30">
                  LANDOWNER-SUBMITTED / UNVERIFIED
                </span>
              </div>

              {complaint.document_evidence && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-xs text-white font-medium truncate">
                      {complaint.document_evidence.file_name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                      ({(complaint.document_evidence.file_size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>

                  {complaint.document_evidence.public_url && (
                    <a
                      href={complaint.document_evidence.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors flex-shrink-0"
                    >
                      View File →
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Field Officer Ground Verification Card (Preserves Landowner Claim) */}
        {fieldVerification && (
          <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Official Field Ground Verification
                </h2>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                fieldVerification.verification_status === "VERIFIED"
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : fieldVerification.verification_status === "PARTIALLY_VERIFIED"
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                  : "bg-red-500/20 border-red-500/40 text-red-300"
              }`}>
                {fieldVerification.verification_status || "VERIFIED"}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {fieldVerification.observations || "Field officer completed on-site physical survey and boundary demarcation."}
            </p>

            {fieldVerification.field_verified_area && (
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                <span className="text-slate-400 text-[10px] block">Field-Verified Area:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {fieldVerification.field_verified_area.acres || (fieldVerification.field_verified_area.sqm * 0.000247105).toFixed(4)} acres
                </span>
                <span className="text-slate-400 ml-2">({fieldVerification.field_verified_area.sqm} m²)</span>
              </div>
            )}

            <div className="text-[10px] font-mono text-slate-400 border-t border-emerald-500/20 pt-2 flex items-center justify-between">
              <span>Surveyed by: {fieldVerification.officer_name || "Revenue Officer"}</span>
              <span>{new Date(fieldVerification.verified_at || complaint.submitted_at).toLocaleDateString()}</span>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              Provenance Note: Landowner self-reported boundary claim is permanently preserved in the immutable audit trail.
            </p>
          </div>
        )}

        {/* Official 5-Stage Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Redressal Lifecycle Tracker
          </h2>

          <div className="space-y-3.5 relative pl-6 border-l-2 border-slate-800">
            {/* Step 1: Lodged */}
            <div className="relative">
              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center" />
              <div>
                <h3 className="text-xs font-bold text-white">1. Grievance Lodged by Citizen</h3>
                <p className="text-[11px] text-slate-400">{new Date(complaint.submitted_at).toLocaleString()}</p>
                <span className="text-[10px] font-mono text-emerald-400">
                  Initial Status: SUBMITTED — AWAITING FIELD REVIEW
                </span>
              </div>
            </div>

            {/* Step 2: Site Visit Accepted */}
            <div className="relative">
              <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                isSiteVisitAccepted || isVerified || isResolved ? "bg-emerald-500" : "bg-slate-700"
              }`} />
              <div>
                <h3 className="text-xs font-bold text-white">2. Site Visit Accepted by Field Officer</h3>
                {complaint.assigned_officer ? (
                  <div className="text-[11px] text-slate-300 space-y-0.5 mt-0.5">
                    <p>Officer: <strong className="text-emerald-400">{complaint.assigned_officer.officer_name}</strong> ({complaint.assigned_officer.officer_id})</p>
                    {complaint.assigned_officer.admin_notes && (
                      <p className="text-slate-400 italic">&ldquo;{complaint.assigned_officer.admin_notes}&rdquo;</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">Awaiting field officer assignment or acceptance</p>
                )}
              </div>
            </div>

            {/* Step 3: Field Ground Verification */}
            <div className="relative">
              <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                isVerified || isResolved ? "bg-emerald-500" : "bg-slate-700"
              }`} />
              <div>
                <h3 className="text-xs font-bold text-white">3. On-Site Ground Survey & Demarcation</h3>
                {fieldVerification ? (
                  <div className="text-[11px] text-slate-300 space-y-1 mt-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <p className="text-emerald-300 font-semibold">✓ Ground Survey Completed: {fieldVerification.verification_status || "VERIFIED"}</p>
                    <p className="text-slate-300">{fieldVerification.observations}</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">On-site ground verification pending</p>
                )}
              </div>
            </div>

            {/* Step 4: CALA Determination */}
            <div className="relative">
              <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                isResolved || isRejected ? "bg-emerald-500" : "bg-slate-700"
              }`} />
              <div>
                <h3 className="text-xs font-bold text-white">4. Competent Authority (CALA) Determination</h3>
                {complaint.resolution ? (
                  <div className="text-[11px] text-slate-300 space-y-1 mt-1 bg-emerald-950/20 border border-emerald-500/30 p-2.5 rounded-xl">
                    <p className="text-emerald-300 font-bold uppercase">{complaint.resolution.resolution_action}</p>
                    <p className="text-slate-200">{complaint.resolution.resolution_comment}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Issued by: {complaint.resolution.admin_name || "CALA District Office"}</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">Awaiting final administrative determination</p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </LandownerShell>
  );
}
