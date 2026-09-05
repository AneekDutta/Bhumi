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
  ArrowLeft
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
          <span>Fetching real-time case data from Supabase...</span>
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

  const isResolved = complaint.status === "RESOLVED";
  const isVerified = complaint.status === "VERIFIED";
  const isAssigned = complaint.status === "ASSIGNED_FOR_VERIFICATION";

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
                Parcel: <strong className="text-slate-200">{complaint.parcel_id}</strong> (Survey {complaint.survey_number})
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${
                isResolved
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : isVerified
                  ? "bg-teal-500/15 text-teal-300 border-teal-500/30"
                  : isAssigned
                  ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                  : "bg-amber-500/15 text-amber-300 border-amber-500/30"
              }`}
            >
              {complaint.status.replace(/_/g, " ")}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <span className="text-slate-400 text-[10px] block uppercase tracking-wide">Category</span>
            <span className="text-white text-xs font-semibold">{complaint.complaint_type}</span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] block uppercase tracking-wide">Citizen Statement</span>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/50">
              {complaint.description}
            </p>
          </div>

          {/* Verified GPS Coordinates */}
          {complaint.gps && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] block uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>Verified Citizen GPS Location</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
                  Satellite Fix
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Latitude</span>
                  <span className="text-white font-bold">{complaint.gps.lat}° N</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Longitude</span>
                  <span className="text-white font-bold">{complaint.gps.lng}° E</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Accuracy</span>
                  <span className="text-slate-300">±{complaint.gps.accuracy}m</span>
                </div>
              </div>
            </div>
          )}

          {/* Supporting Document Evidence from Supabase Storage */}
          {complaint.document_evidence && (
            <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl space-y-2">
              <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider block">
                Supporting Legal Document (Supabase Storage)
              </span>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-xs text-white font-medium truncate">
                    {complaint.document_evidence.file_name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                    ({(complaint.document_evidence.file_size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>

                <a
                  href={complaint.document_evidence.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors flex-shrink-0"
                >
                  View File →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* 4-Stage Lifecycle Stepper */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Official Case Timeline & Redressal
          </h2>

          <div className="space-y-3 relative pl-6 border-l-2 border-slate-800">
            {/* Step 1: Lodged */}
            <div className="relative">
              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center" />
              <div>
                <h3 className="text-xs font-bold text-white">Grievance Lodged by Citizen</h3>
                <p className="text-[11px] text-slate-400">{new Date(complaint.submitted_at).toLocaleString()}</p>
                <span className="text-[10px] font-mono text-emerald-400">Registered in Supabase</span>
              </div>
            </div>

            {/* Step 2: Officer Assigned */}
            <div className="relative">
              <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                isAssigned || isVerified || isResolved ? "bg-emerald-500" : "bg-slate-700"
              }`} />
              <div>
                <h3 className="text-xs font-bold text-white">Assigned to Field Officer</h3>
                {complaint.assigned_officer ? (
                  <div className="text-[11px] text-slate-300 space-y-0.5 mt-0.5">
                    <p>Officer: <strong className="text-emerald-400">{complaint.assigned_officer.officer_name}</strong> ({complaint.assigned_officer.officer_id})</p>
                    {complaint.assigned_officer.admin_notes && (
                      <p className="text-slate-400 italic">&quot;{complaint.assigned_officer.admin_notes}&quot;</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">Awaiting CALA officer assignment</p>
                )}
              </div>
            </div>

            {/* Step 3: Ground Verification */}
            <div className="relative">
              <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                isVerified || isResolved ? "bg-emerald-500" : "bg-slate-700"
              }`} />
              <div>
                <h3 className="text-xs font-bold text-white">On-Site Ground Verification</h3>
                {complaint.verification ? (
                  <div className="text-[11px] text-slate-300 space-y-1 mt-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <p className="text-emerald-300 font-semibold">✓ Physical Site Inspection Completed</p>
                    <p className="text-slate-300">{complaint.verification.observations}</p>
                    {complaint.verification.gps && (
                      <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>GPS Fix: {complaint.verification.gps.lat}°, {complaint.verification.gps.lng}° (±{complaint.verification.gps.accuracy}m)</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">Officer site visit pending</p>
                )}
              </div>
            </div>

            {/* Step 4: Resolution */}
            <div className="relative">
              <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                isResolved ? "bg-emerald-500" : "bg-slate-700"
              }`} />
              <div>
                <h3 className="text-xs font-bold text-white">Competent Authority Resolution</h3>
                {complaint.resolution ? (
                  <div className="text-[11px] text-slate-300 space-y-1 mt-1 bg-emerald-950/20 border border-emerald-500/30 p-2.5 rounded-xl">
                    <p className="text-emerald-300 font-bold uppercase">{complaint.resolution.resolution_action}</p>
                    <p className="text-slate-200">{complaint.resolution.resolution_comment}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Issued by: {complaint.resolution.admin_name || "CALA Authority"}</p>
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
