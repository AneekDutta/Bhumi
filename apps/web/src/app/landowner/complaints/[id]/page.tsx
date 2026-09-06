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
  AlertCircle,
  Download,
  Sparkles,
  Scale,
  History
} from "lucide-react";
import { LandownerShell } from "@/components/landowner/LandownerShell";
import { getLandownerComplaints, getComplaintAuditTrail } from "@/lib/api";
import { useRealtimeComplaints } from "@/lib/supabase/useRealtime";
import { 
  generateLandownerNoticePdf, 
  generateCaseReportPdf, 
  buildLandownerNoticeData, 
  buildCaseReportData 
} from "@/lib/pdf/caseReportPdfGenerator";

export default function LandownerComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const complaintId = params.id as string;

  const [complaint, setComplaint] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const all = await getLandownerComplaints();
      const match = all.find((c: any) => c.id === complaintId || c.complaint_id === complaintId);
      setComplaint(match || null);

      try {
        const logs = await getComplaintAuditTrail(complaintId);
        setAuditLogs(logs || []);
      } catch {
        setAuditLogs([]);
      }
    } catch {
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaintId]);

  // Realtime hook for immediate sync
  useRealtimeComplaints(complaintId, () => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <h2 className="text-sm font-bold text-slate-900">Case Not Found</h2>
          <p className="text-xs text-slate-400">The requested grievance case could not be retrieved.</p>
          <Link href="/landowner/complaints" className="inline-block px-4 py-2 rounded-xl bg-slate-100 text-emerald-400 text-xs font-semibold">
            ← Return to Grievance List
          </Link>
        </div>
      </LandownerShell>
    );
  }

  const status = complaint.status || "SUBMITTED — AWAITING FIELD REVIEW";
  const isResolved = status === "RESOLVED" || status === "Implementation Completed" || !!complaint.resolution_notice;
  const isRejected = status === "REJECTED" || status === "FIELD DECLINED";
  const isVerified = status === "VERIFIED" || status === "FIELD VERIFIED" || status === "PARTIALLY_VERIFIED" || status === "NOT_VERIFIED" || !!complaint.field_verification;
  const isSiteVisitAccepted = status === "SITE VISIT ACCEPTED" || status === "SITE_VISIT_ACCEPTED" || !!complaint.assigned_officer;

  const isDemo = complaint.is_demo_simulation;
  const isUnregistered = !complaint.parcel_id || complaint.parcel_id === "null";

  const declaredArea = complaint.landowner_declared_area;
  const fieldVerification = complaint.field_verification || complaint.verification;

  return (
    <LandownerShell title={`Case #${complaint.complaint_id}`} showBack>
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Status Hero Card */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block mb-0.5">
                Case Tracking Ref
              </span>
              <h1 className="text-lg font-bold text-slate-900 font-display">
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
                  CITIZEN SUBMISSION
                </span>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="bg-[#f4f6f9] p-3 rounded-xl border border-[#e2e8f0]/80 space-y-1">
            <span className="text-slate-400 text-[10px] block uppercase tracking-wide">Category</span>
            <span className="text-slate-900 text-xs font-semibold">{complaint.complaint_type}</span>
          </div>

          {/* Citizen Statement */}
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] block uppercase tracking-wide">Citizen Statement</span>
            <p className="text-xs text-slate-300 leading-relaxed bg-[#f4f6f9]/60 p-3 rounded-xl border border-[#e2e8f0]/50">
              {complaint.description}
            </p>
          </div>

          {/* Landowner-Reported GPS Location & Boundary */}
          {(complaint.landowner_reported_location || complaint.gps) && (
            <div className="bg-[#f4f6f9] p-3.5 rounded-xl border border-[#e2e8f0] space-y-2">
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
                  <span className="text-slate-900 font-bold">
                    {(complaint.landowner_reported_location?.lat || complaint.gps?.lat)}° N
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Longitude</span>
                  <span className="text-slate-900 font-bold">
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
              <div className="text-base font-bold font-mono text-slate-900">
                {declaredArea.acres || (declaredArea.sqm ? (declaredArea.sqm * 0.000247105).toFixed(4) : "-")} acres
                <span className="text-xs text-slate-400 font-normal ml-2">
                  ({declaredArea.sqm ? declaredArea.sqm.toLocaleString() : "-"} m²)
                </span>
              </div>
              {declaredArea.uncertainty_explanation && (
                <p className="text-[10px] text-slate-400 font-mono pt-1 border-t border-[#e2e8f0]">
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
                    <span className="text-xs text-slate-900 font-medium truncate">
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

        {/* Statutory Resolution Notice Card */}
        {(isResolved || complaint.resolution_notice) && (
          <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-teal-950/30 border-2 border-emerald-500/50 rounded-2xl p-5 space-y-4 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                    Government of India &bull; CALA
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">
                    Official Statutory Resolution Notice
                  </h2>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-full uppercase">
                MATTER RESOLVED
              </span>
            </div>

            {/* Notice Reference & Legal Summary */}
            <div className="bg-[#f4f6f9]/80 p-3.5 rounded-xl border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Statutory Notice Ref:</span>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {complaint.notice_reference || complaint.resolution_notice?.notice_reference || `CALA/NOTICE/2026/${String(complaint.complaint_id || complaint.id).slice(-4)}`}
                </span>
              </div>
              <div className="text-xs text-slate-300 font-sans leading-relaxed">
                <strong className="text-slate-900">Determination: </strong>
                {complaint.resolution_notice?.resolution_notes || complaint.resolution?.resolution_comment || "Grievance resolved in accordance with RFCTLARR Act 2013 First Schedule. Cadastral records mutated and revised compensation entitlement approved."}
              </div>
              <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-[#e2e8f0] flex items-center justify-between">
                <span>Sanctioned by: <strong className="text-slate-200">{complaint.resolution_notice?.admin_name || complaint.resolution?.admin_name || "Competent Authority CALA"}</strong></span>
                <span>{new Date(complaint.resolution_notice?.resolved_at || complaint.resolution?.resolved_at || complaint.submitted_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => generateLandownerNoticePdf(buildLandownerNoticeData(complaint))}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Official Resolution Notice (PDF)</span>
              </button>

              {(complaint.what_if_simulation || complaint.simulation_record) && (
                <button
                  onClick={() => generateCaseReportPdf(buildCaseReportData(complaint))}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-200 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download Complete Case Report &amp; What-If File (PDF)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Attached What-If Simulation Card */}
        {(complaint.what_if_simulation || complaint.simulation_record) && (
          <div className="bg-white border border-indigo-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  What-If Simulation Record Attached
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded">
                {(complaint.what_if_simulation || complaint.simulation_record).simulation_id || "SIM-RFCTLARR"}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              A statutory counterfactual simulation was evaluated for your parcel under the RFCTLARR Act 2013 First Schedule provisions.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-[#f4f6f9] border border-[#e2e8f0]">
                <span className="text-[10px] text-slate-400 block">Total Statutory Award:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  ₹{Number((complaint.what_if_simulation || complaint.simulation_record).simulated?.award_breakdown?.total_statutory_award || 4850000).toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#f4f6f9] border border-[#e2e8f0]">
                <span className="text-[10px] text-slate-400 block">Rural Multiplier:</span>
                <span className="text-indigo-400 font-bold text-sm">
                  {(complaint.what_if_simulation || complaint.simulation_record).simulated?.multipliers?.rural || 1.25}x
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Field Officer Ground Verification Card (Preserves Landowner Claim) */}
        {fieldVerification && (
          <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
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
              <div className="p-2.5 rounded-xl bg-[#f4f6f9] border border-[#e2e8f0] text-xs font-mono space-y-1">
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
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
            Redressal Lifecycle Tracker
          </h2>

          <div className="space-y-3.5 relative pl-6 border-l-2 border-[#e2e8f0]">
            {/* Step 1: Lodged */}
            <div className="relative">
              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center" />
              <div>
                <h3 className="text-xs font-bold text-slate-900">1. Grievance Lodged by Citizen</h3>
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
                <h3 className="text-xs font-bold text-slate-900">2. Site Visit Accepted by Field Officer</h3>
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
                <h3 className="text-xs font-bold text-slate-900">3. On-Site Ground Survey & Demarcation</h3>
                {fieldVerification ? (
                  <div className="text-[11px] text-slate-300 space-y-1 mt-1 bg-[#f4f6f9] p-2.5 rounded-xl border border-[#e2e8f0]">
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
                <h3 className="text-xs font-bold text-slate-900">4. Competent Authority (CALA) Determination</h3>
                {isResolved ? (
                  <div className="text-[11px] text-slate-300 space-y-1 mt-1 bg-emerald-950/20 border border-emerald-500/30 p-2.5 rounded-xl">
                    <p className="text-emerald-300 font-bold uppercase">MATTER RESOLVED &bull; STATUTORY ORDER ISSUED</p>
                    <p className="text-slate-200">{complaint.resolution_notice?.resolution_notes || complaint.resolution?.resolution_comment || "Grievance resolved in accordance with RFCTLARR Act 2013 First Schedule."}</p>
                    <p className="text-[10px] text-amber-300 font-mono">Notice Ref: {complaint.notice_reference || complaint.resolution_notice?.notice_reference || "CALA/NOTICE/2026/0081"}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Issued by: {complaint.resolution_notice?.admin_name || complaint.resolution?.admin_name || "Competent Authority CALA"}</p>
                  </div>
                ) : complaint.resolution ? (
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

            {/* Step 5: Statutory Notice Issued to Citizen */}
            <div className="relative">
              <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                isResolved ? "bg-emerald-500" : "bg-slate-700"
              }`} />
              <div>
                <h3 className="text-xs font-bold text-slate-900">5. Statutory Notice Issued to Citizen</h3>
                {isResolved ? (
                  <div className="text-[11px] text-slate-300 space-y-1 mt-1 bg-[#f4f6f9] p-2.5 rounded-xl border border-[#e2e8f0]">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block">
                      DELIVERED TO CITIZEN PORTAL &bull; RECORD FINALIZED
                    </span>
                    <p className="text-slate-300">
                      The official statutory resolution notice has been published and is permanently archived in your portal.
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">Notice will be generated upon administrative determination</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chronological Statutory Audit Trail */}
        {auditLogs && auditLogs.length > 0 && (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Official Statutory Audit Trail
              </h2>
            </div>

            <div className="space-y-3 relative pl-4 border-l-2 border-[#e2e8f0]">
              {auditLogs.map((log, idx) => (
                <div key={log.id || idx} className="relative">
                  <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-emerald-500 border border-slate-900" />
                  <div className="bg-[#f4f6f9]/60 p-2.5 rounded-xl border border-[#e2e8f0]/60 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold">{log.action.replace(/_/g, " ")}</span>
                      <span className="text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Actor: <strong className="text-slate-200">{log.actor_role || "Officer"}</strong> ({log.actor_id || "System"})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </LandownerShell>
  );
}
