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
          <h2 className="text-sm font-bold text-white">Case Not Found</h2>
          <p className="text-xs text-slate-400">The requested grievance case could not be retrieved.</p>
          <Link href="/landowner/complaints" className="inline-block px-3.5 py-1.5 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white text-xs font-bold transition-colors shadow-xs">
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
      <div className="space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Status Hero Card */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 space-y-3 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono text-[#0B2E59] dark:text-sky-400 font-bold uppercase tracking-wider block mb-0.5">
                Case Tracking Ref
              </span>
              <h1 className="text-lg font-bold text-[#14213D] dark:text-white font-display">
                {complaint.complaint_id}
              </h1>
              <p className="text-xs text-[#5A6A80] dark:text-slate-400">
                {isUnregistered ? (
                  <span className="text-[#B36B00] dark:text-amber-300 font-semibold">UNREGISTERED LAND CLAIM (No Pre-existing Parcel)</span>
                ) : (
                  <>Parcel: <strong className="text-[#14213D] dark:text-slate-200">{complaint.parcel_id}</strong> (Survey {complaint.survey_number})</>
                )}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span
                className={`px-2.5 py-0.5 rounded-[3px] text-[10px] font-mono font-bold uppercase border ${
                  isResolved
                    ? "bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-300 border-[#C8E6C9] dark:border-emerald-800/50"
                    : isRejected
                    ? "bg-[#FFEBEE] dark:bg-rose-950/40 text-[#B32424] dark:text-rose-300 border-[#FFCDD2] dark:border-rose-800/50"
                    : isVerified
                    ? "bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800/50"
                    : isSiteVisitAccepted
                    ? "bg-sky-50 dark:bg-sky-950/40 text-[#0B2E59] dark:text-sky-300 border-sky-200 dark:border-sky-800/50"
                    : "bg-[#FFF8E1] dark:bg-amber-950/40 text-[#B36B00] dark:text-amber-300 border-[#FFE082] dark:border-amber-800/50"
                }`}
              >
                {status.replace(/_/g, " ")}
              </span>

              {isDemo && (
                <span className="text-[9px] font-mono bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 px-2 py-0.5 rounded-[3px] font-bold">
                  CITIZEN SUBMISSION
                </span>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="bg-[#F8FAFC] dark:bg-[#07080F] p-3 rounded-[4px] border border-[#DCE2E8] dark:border-white/10 space-y-0.5">
            <span className="text-[#5A6A80] dark:text-slate-400 text-[10px] block uppercase tracking-wide">Category</span>
            <span className="text-[#14213D] dark:text-white text-xs font-semibold">{complaint.complaint_type}</span>
          </div>

          {/* Citizen Statement */}
          <div className="space-y-1">
            <span className="text-[#5A6A80] dark:text-slate-400 text-[10px] block uppercase tracking-wide">Citizen Statement</span>
            <p className="text-xs text-[#14213D] dark:text-slate-300 leading-relaxed bg-[#F8FAFC] dark:bg-[#07080F] p-3 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
              {complaint.description}
            </p>
          </div>

          {/* Landowner-Reported GPS Location & Boundary */}
          {(complaint.landowner_reported_location || complaint.gps) && (
            <div className="bg-[#F8FAFC] dark:bg-[#07080F] p-3 rounded-[4px] border border-[#DCE2E8] dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#14213D] dark:text-slate-300 text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0B2E59] dark:text-amber-400" />
                  <span>Landowner-Reported Location</span>
                </span>
                <span className="text-[10px] font-mono text-[#1E7E34] dark:text-emerald-400 bg-[#E8F5E9] dark:bg-emerald-950/40 px-2 py-0.5 rounded-[3px] border border-[#C8E6C9] dark:border-emerald-800/40 font-bold">
                  {isDemo ? "Simulated Fix" : "Device GPS Satellite Fix"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-1 border-t border-[#DCE2E8] dark:border-white/10">
                <div>
                  <span className="text-[10px] text-[#5A6A80] dark:text-slate-500 block">Latitude</span>
                  <span className="text-[#14213D] dark:text-white font-bold">
                    {(complaint.landowner_reported_location?.lat || complaint.gps?.lat)}° N
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#5A6A80] dark:text-slate-500 block">Longitude</span>
                  <span className="text-[#14213D] dark:text-white font-bold">
                    {(complaint.landowner_reported_location?.lng || complaint.gps?.lng)}° E
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#5A6A80] dark:text-slate-500 block">Accuracy</span>
                  <span className="text-[#5A6A80] dark:text-slate-300 font-bold">
                    ±{(complaint.landowner_reported_location?.accuracy || complaint.gps?.accuracy)}m
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Landowner Declared Area */}
          {declaredArea && (
            <div className="bg-[#FFF8E1] dark:bg-amber-950/20 p-3 rounded-[4px] border border-[#FFE082] dark:border-amber-800/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-[#B36B00] dark:text-amber-400 bg-white/80 dark:bg-black/20 px-2 py-0.5 rounded-[3px] border border-[#FFE082] dark:border-amber-800/40">
                  LANDOWNER-REPORTED / ESTIMATED
                </span>
                <span className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400">
                  {isDemo ? "SIMULATED ESTIMATE" : "GPS-based estimate"}
                </span>
              </div>
              <div className="text-sm font-bold font-mono text-[#14213D] dark:text-white">
                {declaredArea.acres || (declaredArea.sqm ? (declaredArea.sqm * 0.000247105).toFixed(4) : "-")} acres
                <span className="text-xs text-[#5A6A80] dark:text-slate-400 font-normal ml-2">
                  ({declaredArea.sqm ? declaredArea.sqm.toLocaleString() : "-"} m²)
                </span>
              </div>
              {declaredArea.uncertainty_explanation && (
                <p className="text-[10px] text-[#5A6A80] dark:text-slate-400 font-mono pt-1 border-t border-[#FFE082] dark:border-amber-800/30">
                  {declaredArea.uncertainty_explanation}
                </p>
              )}
            </div>
          )}

          {/* Supporting Document Evidence */}
          {(complaint.document_evidence || (complaint.landowner_documents && complaint.landowner_documents.length > 0)) && (
            <div className="bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 p-3 rounded-[4px] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#0B2E59] dark:text-sky-400 text-[10px] font-bold uppercase tracking-wider block">
                  Supporting Legal Document
                </span>
                <span className="text-[9px] font-mono uppercase bg-[#FFF8E1] dark:bg-amber-950/40 text-[#B36B00] dark:text-amber-300 px-2 py-0.5 rounded-[3px] font-bold border border-[#FFE082] dark:border-amber-800/40">
                  LANDOWNER-SUBMITTED / UNVERIFIED
                </span>
              </div>

              {complaint.document_evidence && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-[#0B2E59] dark:text-amber-400 flex-shrink-0" />
                    <span className="text-xs text-[#14213D] dark:text-white font-medium truncate">
                      {complaint.document_evidence.file_name}
                    </span>
                    <span className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400 flex-shrink-0">
                      ({(complaint.document_evidence.file_size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>

                  {complaint.document_evidence.public_url && (
                    <a
                      href={complaint.document_evidence.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold px-2.5 py-1 rounded-[4px] bg-[#0B2E59] text-white hover:bg-[#082242] transition-colors flex-shrink-0"
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
          <div className="bg-[#E8F5E9] dark:bg-emerald-950/20 border border-[#C8E6C9] dark:border-emerald-800/50 rounded-[4px] p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#C8E6C9] dark:border-emerald-800/40 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[4px] bg-[#1E7E34] text-white flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#1E7E34] dark:text-emerald-300 font-bold block">
                    Government of India &bull; CALA
                  </span>
                  <h2 className="text-xs font-bold text-[#14213D] dark:text-white">
                    Official Statutory Resolution Notice
                  </h2>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-[#1E7E34] text-white px-2 py-0.5 rounded-[3px] uppercase">
                MATTER RESOLVED
              </span>
            </div>

            {/* Notice Reference & Legal Summary */}
            <div className="bg-white dark:bg-[#0D121F] p-3 rounded-[4px] border border-[#C8E6C9] dark:border-emerald-800/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider">Statutory Notice Ref:</span>
                <span className="text-xs font-mono font-bold text-[#0B2E59] dark:text-amber-400 bg-[#F4F6F8] dark:bg-black/30 px-2 py-0.5 rounded-[3px] border border-[#DCE2E8] dark:border-white/10">
                  {complaint.notice_reference || complaint.resolution_notice?.notice_reference || `CALA/NOTICE/2026/${String(complaint.complaint_id || complaint.id).slice(-4)}`}
                </span>
              </div>
              <div className="text-xs text-[#14213D] dark:text-slate-300 leading-relaxed">
                <strong className="text-[#0B2E59] dark:text-white">Determination: </strong>
                {complaint.resolution_notice?.resolution_notes || complaint.resolution?.resolution_comment || "Grievance resolved in accordance with RFCTLARR Act 2013 First Schedule. Cadastral records mutated and revised compensation entitlement approved."}
              </div>
              <div className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400 pt-1 border-t border-[#DCE2E8] dark:border-white/10 flex items-center justify-between">
                <span>Sanctioned by: <strong className="text-[#14213D] dark:text-slate-200">{complaint.resolution_notice?.admin_name || complaint.resolution?.admin_name || "Competent Authority CALA"}</strong></span>
                <span>{new Date(complaint.resolution_notice?.resolved_at || complaint.resolution?.resolved_at || complaint.submitted_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => generateLandownerNoticePdf(buildLandownerNoticeData(complaint))}
                className="w-full py-2 px-3 rounded-[4px] bg-[#1E7E34] hover:bg-[#166527] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Official Resolution Notice (PDF)</span>
              </button>

              {(complaint.what_if_simulation || complaint.simulation_record) && (
                <button
                  onClick={() => generateCaseReportPdf(buildCaseReportData(complaint))}
                  className="w-full py-2 px-3 rounded-[4px] bg-white dark:bg-[#0D121F] hover:bg-[#F8FAFC] text-[#0B2E59] dark:text-sky-300 font-semibold text-xs flex items-center justify-center gap-2 border border-[#DCE2E8] dark:border-white/10 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download Complete Case Report &amp; What-If File (PDF)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Attached What-If Simulation Card */}
        {(complaint.what_if_simulation || complaint.simulation_record) && (
          <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-none p-4 space-y-3 shadow-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
                <h2 className="text-xs font-bold text-[#14213D] dark:text-white uppercase tracking-wider font-mono">
                  What-If Simulation Record Attached
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold bg-sky-50 dark:bg-sky-950/40 text-[#0B2E59] dark:text-sky-300 border border-sky-200 dark:border-sky-800/40 px-2 py-0.5 rounded-[3px]">
                {(complaint.what_if_simulation || complaint.simulation_record).simulation_id || "SIM-RFCTLARR"}
              </span>
            </div>

            <p className="text-xs text-[#5A6A80] dark:text-slate-300 leading-relaxed">
              A statutory counterfactual simulation was evaluated for your parcel under the RFCTLARR Act 2013 First Schedule provisions.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10">
                <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 block">Total Statutory Award:</span>
                <span className="text-[#1E7E34] dark:text-emerald-400 font-bold text-sm">
                  ₹{Number((complaint.what_if_simulation || complaint.simulation_record).simulated?.award_breakdown?.total_statutory_award || 4850000).toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10">
                <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 block">Rural Multiplier:</span>
                <span className="text-[#0B2E59] dark:text-sky-400 font-bold text-sm">
                  {(complaint.what_if_simulation || complaint.simulation_record).simulated?.multipliers?.rural || 1.25}x
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Field Officer Ground Verification Card (Preserves Landowner Claim) */}
        {fieldVerification && (
          <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1E7E34] dark:text-emerald-400" />
                <h2 className="text-xs font-bold text-[#14213D] dark:text-white uppercase tracking-wider font-mono">
                  Official Field Ground Verification
                </h2>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] border uppercase ${
                fieldVerification.verification_status === "VERIFIED"
                  ? "bg-[#E8F5E9] dark:bg-emerald-950/40 border-[#C8E6C9] dark:border-emerald-800/50 text-[#1E7E34] dark:text-emerald-300"
                  : fieldVerification.verification_status === "PARTIALLY_VERIFIED"
                  ? "bg-[#FFF8E1] dark:bg-amber-950/40 border-[#FFE082] dark:border-amber-800/50 text-[#B36B00] dark:text-amber-300"
                  : "bg-[#FFEBEE] dark:bg-rose-950/40 border-[#FFCDD2] dark:border-rose-800/50 text-[#B32424] dark:text-rose-300"
              }`}>
                {fieldVerification.verification_status || "VERIFIED"}
              </span>
            </div>

            <p className="text-xs text-[#5A6A80] dark:text-slate-300 leading-relaxed">
              {fieldVerification.observations || "Field officer completed on-site physical survey and boundary demarcation."}
            </p>

            {fieldVerification.field_verified_area && (
              <div className="p-2.5 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 text-xs font-mono space-y-1">
                <span className="text-[#5A6A80] dark:text-slate-400 text-[10px] block">Field-Verified Area:</span>
                <span className="text-[#1E7E34] dark:text-emerald-400 font-bold text-sm">
                  {fieldVerification.field_verified_area.acres || (fieldVerification.field_verified_area.sqm * 0.000247105).toFixed(4)} acres
                </span>
                <span className="text-[#5A6A80] dark:text-slate-400 ml-2">({fieldVerification.field_verified_area.sqm} m²)</span>
              </div>
            )}

            <div className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400 border-t border-[#DCE2E8] dark:border-white/10 pt-2 flex items-center justify-between">
              <span>Surveyed by: {fieldVerification.officer_name || "Revenue Officer"}</span>
              <span>{new Date(fieldVerification.verified_at || complaint.submitted_at).toLocaleDateString()}</span>
            </div>

            <p className="text-[10px] text-[#5A6A80] dark:text-slate-400 italic">
              Provenance Note: Landowner self-reported boundary claim is permanently preserved in the immutable audit trail.
            </p>
          </div>
        )}

        {/* Official 5-Stage Timeline */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 space-y-3 shadow-xs">
          <h2 className="text-xs font-bold text-[#14213D] dark:text-white uppercase tracking-wider font-mono">
            Redressal Lifecycle Tracker
          </h2>

          <div className="space-y-3.5 relative pl-6 border-l-2 border-[#DCE2E8] dark:border-white/15 ml-2">
            {/* Step 1: Lodged */}
            <div className="relative">
              <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-[#1E7E34] border-2 border-white dark:border-[#0D121F]" />
              <div>
                <h3 className="text-xs font-bold text-[#14213D] dark:text-white">1. Grievance Lodged by Citizen</h3>
                <p className="text-[11px] text-[#5A6A80] dark:text-slate-400">{new Date(complaint.submitted_at).toLocaleString()}</p>
                <span className="text-[10px] font-mono text-[#0B2E59] dark:text-sky-400 font-semibold">
                  Initial Status: SUBMITTED — AWAITING FIELD REVIEW
                </span>
              </div>
            </div>

            {/* Step 2: Site Visit Accepted */}
            <div className="relative">
              <div className={`absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#0D121F] ${
                isSiteVisitAccepted || isVerified || isResolved ? "bg-[#1E7E34]" : "bg-[#CBD5E1] dark:bg-white/20"
              }`} />
              <div>
                <h3 className="text-xs font-bold text-[#14213D] dark:text-white">2. Site Visit Accepted by Field Officer</h3>
                {complaint.assigned_officer ? (
                  <div className="text-[11px] text-[#14213D] dark:text-slate-300 space-y-0.5 mt-0.5">
                    <p>Officer: <strong className="text-[#0B2E59] dark:text-sky-400">{complaint.assigned_officer.officer_name}</strong> ({complaint.assigned_officer.officer_id})</p>
                    {complaint.assigned_officer.admin_notes && (
                      <p className="text-[#5A6A80] dark:text-slate-400 italic">&ldquo;{complaint.assigned_officer.admin_notes}&rdquo;</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#5A6A80] dark:text-slate-500">Awaiting field officer assignment or acceptance</p>
                )}
              </div>
            </div>

            {/* Step 3: Field Ground Verification */}
            <div className="relative">
              <div className={`absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#0D121F] ${
                isVerified || isResolved ? "bg-[#1E7E34]" : "bg-[#CBD5E1] dark:bg-white/20"
              }`} />
              <div>
                <h3 className="text-xs font-bold text-[#14213D] dark:text-white">3. On-Site Ground Survey & Demarcation</h3>
                {fieldVerification ? (
                  <div className="text-[11px] text-[#14213D] dark:text-slate-300 space-y-1 mt-1 bg-[#F8FAFC] dark:bg-[#07080F] p-2.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
                    <p className="text-[#1E7E34] dark:text-emerald-300 font-semibold">✓ Ground Survey Completed: {fieldVerification.verification_status || "VERIFIED"}</p>
                    <p className="text-[#5A6A80] dark:text-slate-300">{fieldVerification.observations}</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#5A6A80] dark:text-slate-500">On-site ground verification pending</p>
                )}
              </div>
            </div>

            {/* Step 4: CALA Determination */}
            <div className="relative">
              <div className={`absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#0D121F] ${
                isResolved || isRejected ? "bg-[#1E7E34]" : "bg-[#CBD5E1] dark:bg-white/20"
              }`} />
              <div>
                <h3 className="text-xs font-bold text-[#14213D] dark:text-white">4. Competent Authority (CALA) Determination</h3>
                {isResolved ? (
                  <div className="text-[11px] text-[#14213D] dark:text-slate-300 space-y-1 mt-1 bg-[#E8F5E9] dark:bg-emerald-950/20 border border-[#C8E6C9] dark:border-emerald-800/40 p-2.5 rounded-[4px]">
                    <p className="text-[#1E7E34] dark:text-emerald-300 font-bold uppercase">MATTER RESOLVED &bull; STATUTORY ORDER ISSUED</p>
                    <p className="text-[#14213D] dark:text-slate-200">{complaint.resolution_notice?.resolution_notes || complaint.resolution?.resolution_comment || "Grievance resolved in accordance with RFCTLARR Act 2013 First Schedule."}</p>
                    <p className="text-[10px] text-[#0B2E59] dark:text-sky-300 font-mono">Notice Ref: {complaint.notice_reference || complaint.resolution_notice?.notice_reference || "CALA/NOTICE/2026/0081"}</p>
                    <p className="text-[10px] text-[#5A6A80] dark:text-slate-400 font-mono">Issued by: {complaint.resolution_notice?.admin_name || complaint.resolution?.admin_name || "Competent Authority CALA"}</p>
                  </div>
                ) : complaint.resolution ? (
                  <div className="text-[11px] text-[#14213D] dark:text-slate-300 space-y-1 mt-1 bg-[#E8F5E9] dark:bg-emerald-950/20 border border-[#C8E6C9] dark:border-emerald-800/40 p-2.5 rounded-[4px]">
                    <p className="text-[#1E7E34] dark:text-emerald-300 font-bold uppercase">{complaint.resolution.resolution_action}</p>
                    <p className="text-[#14213D] dark:text-slate-200">{complaint.resolution.resolution_comment}</p>
                    <p className="text-[10px] text-[#5A6A80] dark:text-slate-400 font-mono">Issued by: {complaint.resolution.admin_name || "CALA District Office"}</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#5A6A80] dark:text-slate-500">Awaiting final administrative determination</p>
                )}
              </div>
            </div>

            {/* Step 5: Statutory Notice Issued to Citizen */}
            <div className="relative">
              <div className={`absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#0D121F] ${
                isResolved ? "bg-[#1E7E34]" : "bg-[#CBD5E1] dark:bg-white/20"
              }`} />
              <div>
                <h3 className="text-xs font-bold text-[#14213D] dark:text-white">5. Statutory Notice Issued to Citizen</h3>
                {isResolved ? (
                  <div className="text-[11px] text-[#14213D] dark:text-slate-300 space-y-1 mt-1 bg-[#F8FAFC] dark:bg-[#07080F] p-2.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
                    <span className="text-[10px] font-mono text-[#1E7E34] dark:text-emerald-400 font-bold uppercase block">
                      DELIVERED TO CITIZEN PORTAL &bull; RECORD FINALIZED
                    </span>
                    <p className="text-[#5A6A80] dark:text-slate-300">
                      The official statutory resolution notice has been published and is permanently archived in your portal.
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#5A6A80] dark:text-slate-500">Notice will be generated upon administrative determination</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chronological Statutory Audit Trail */}
        {auditLogs && auditLogs.length > 0 && (
          <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
              <h2 className="text-xs font-bold text-[#14213D] dark:text-white uppercase tracking-wider font-mono">
                Official Statutory Audit Trail
              </h2>
            </div>

            <div className="space-y-2.5 relative pl-4 border-l-2 border-[#DCE2E8] dark:border-white/10 ml-1">
              {auditLogs.map((log, idx) => (
                <div key={log.id || idx} className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-[#0B2E59] dark:bg-sky-400" />
                  <div className="bg-[#F8FAFC] dark:bg-[#07080F] p-2.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10 space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#0B2E59] dark:text-sky-400 font-bold">{log.action.replace(/_/g, " ")}</span>
                      <span className="text-[#5A6A80] dark:text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-[#14213D] dark:text-slate-300">
                      Actor: <strong className="text-[#14213D] dark:text-slate-200">{log.actor_role || "Officer"}</strong> ({log.actor_id || "System"})
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
