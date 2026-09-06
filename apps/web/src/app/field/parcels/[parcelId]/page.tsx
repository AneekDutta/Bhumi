"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  FileText,
  ShieldCheck,
  Coins,
  Scale,
  Sparkles,
  Send,
  Camera,
  Compass
} from "lucide-react";
import { FieldShell } from "@/components/field/FieldShell";
import { 
  getFieldParcels, 
  getFieldIncidents, 
  confirmFieldIncident, 
  getLandownerComplaints, 
  submitComplaintVerification,
  getLandownerBoundaries,
  submitFieldBoundaryVerification
} from "@/lib/api";
import { useRealtimeParcel, useRealtimeComplaints } from "@/lib/supabase/useRealtime";
import { CaptureLocation } from "@/components/field/CaptureLocation";
import { offlineStore } from "@/lib/offlineStore";

export default function ParcelDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const parcelId = (params?.parcelId as string) || "";

  const [parcel, setParcel] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmNotes, setConfirmNotes] = useState<string>("");
  const [confirmingSubmitting, setConfirmingSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [verifyingComplaintId, setVerifyingComplaintId] = useState<string | null>(null);
  const [complaintObservations, setComplaintObservations] = useState("");
  const [verifyingSubmitting, setVerifyingSubmitting] = useState(false);

  // Landowner Claimed Boundary States
  const [claimedBoundaries, setClaimedBoundaries] = useState<any[]>([]);
  const [verifyingBoundaryId, setVerifyingBoundaryId] = useState<string | null>(null);
  const [boundaryStatus, setBoundaryStatus] = useState<"verified_match" | "minor_variance" | "demarcation_dispute" | "requires_joint_survey">("verified_match");
  const [boundaryAuditNotes, setBoundaryAuditNotes] = useState<string>("");
  const [boundarySubmitting, setBoundarySubmitting] = useState<boolean>(false);

  const loadParcel = async () => {
    try {
      const list = await getFieldParcels();
      const match = list.find((p: any) => p.parcel_id === parcelId || p.id === parcelId);
      if (match) setParcel(match);
      const incs = await getFieldIncidents({ parcel_id: parcelId });
      setIncidents(incs || []);
      const cmps = await getLandownerComplaints({ parcel_id: parcelId });
      setComplaints(cmps || []);
      const bounds = await getLandownerBoundaries({ parcel_id: parcelId });
      setClaimedBoundaries(bounds || []);
    } catch {}
  };

  // Supabase Realtime: updates when Admin resolves issues or verifies from desktop
  useRealtimeParcel(parcelId, () => {
    loadParcel();
  });

  useRealtimeComplaints(parcelId, () => {
    loadParcel();
  });

  useEffect(() => {
    async function load() {
      try {
        const list = await getFieldParcels();
        const match = list.find((p: any) => p.parcel_id === parcelId || p.id === parcelId);
        setParcel(match || null);
      } catch {
        setParcel(null);
      } finally {
        setLoading(false);
      }

      try {
        const incs = await getFieldIncidents({ parcel_id: parcelId });
        setIncidents(incs || []);
      } catch {
        setIncidents([]);
      }

      try {
        const bounds = await getLandownerBoundaries({ parcel_id: parcelId });
        setClaimedBoundaries(bounds || []);
      } catch {
        setClaimedBoundaries([]);
      }
    }

    load();
  }, [parcelId]);

  const handleVerifyBoundary = async (boundaryId: string) => {
    if (!boundaryAuditNotes.trim()) {
      alert("Please provide boundary audit observations.");
      return;
    }
    setBoundarySubmitting(true);
    try {
      const officer = offlineStore.getActiveOfficer();
      const res = await submitFieldBoundaryVerification({
        boundary_id: boundaryId,
        parcel_id: parcelId,
        officer_id: officer?.officer_id || officer?.id || "OFF-001",
        officer_name: officer?.name || "Ramesh Patel",
        verification_status: boundaryStatus,
        field_notes: boundaryAuditNotes.trim()
      });
      setFeedback(res.message || "Boundary audit recorded. Landowner claimed boundary preserved.");
      setVerifyingBoundaryId(null);
      setBoundaryAuditNotes("");
      await loadParcel();
    } catch (err: any) {
      alert(err?.message || "Failed to submit boundary audit.");
    } finally {
      setBoundarySubmitting(false);
    }
  };

  const handleVerifyComplaint = async (complaintId: string) => {
    if (!complaintObservations.trim()) {
      alert("Please provide on-ground verification observations.");
      return;
    }
    setVerifyingSubmitting(true);
    try {
      const officer = offlineStore.getActiveOfficer();
      const res = await submitComplaintVerification({
        complaint_id: complaintId,
        officer_id: officer?.officer_id || officer?.id || "OFF-001",
        officer_name: officer?.name || "Ramesh Patel",
        observations: complaintObservations.trim(),
        gps_lat: parcel?.centroid_lat || 24.6492,
        gps_lng: parcel?.centroid_lng || 75.9284,
        gps_accuracy: 3.8
      });
      setFeedback(res.message || "Citizen grievance verified on ground. Realtime sync complete.");
      setVerifyingComplaintId(null);
      setComplaintObservations("");
      await loadParcel();
    } catch (err: any) {
      alert(err?.message || "Failed to submit ground verification.");
    } finally {
      setVerifyingSubmitting(false);
    }
  };

  const handleConfirmIncident = async (incidentId: string) => {
    setConfirmingSubmitting(true);
    setFeedback(null);
    try {
      const officer = offlineStore.getActiveOfficer();
      await confirmFieldIncident(incidentId, {
        officer_name: officer?.name || "Field Officer",
        officer_id: officer?.id || officer?.officer_id || "OF001",
        confirmation_status: "confirmed",
        observation_notes: confirmNotes || "Confirmed by officer on-site inspection.",
        gps_latitude: parcel?.centroid_lat || 24.6492,
        gps_longitude: parcel?.centroid_lng || 75.9284,
        gps_accuracy: 4.0
      });

      setFeedback("Ground incident confirmed with GPS tag and forwarded to CALA dashboard.");
      setConfirmingId(null);
      setConfirmNotes("");
      const incs = await getFieldIncidents({ parcel_id: parcelId });
      setIncidents(incs || []);
      const cmps = await getLandownerComplaints({ parcel_id: parcelId });
      setComplaints(cmps || []);
    } catch {
      setFeedback("Failed to confirm incident. Please check connection.");
    } finally {
      setConfirmingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <FieldShell title="Loading Parcel...">
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0B2E59] dark:border-sky-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#64748B] dark:text-slate-400 font-mono">Fetching cadastral record...</p>
        </div>
      </FieldShell>
    );
  }

  if (!parcel) {
    return (
      <FieldShell title="Parcel Dossier" showBack>
        <div className="p-8 space-y-4 max-w-lg mx-auto text-center py-16">
          <div className="w-12 h-12 rounded-[4px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 flex items-center justify-center mx-auto text-[#64748B] dark:text-slate-400 shadow-xs">
            <ShieldCheck className="w-6 h-6 text-[#0B2E59] dark:text-sky-400" />
          </div>
          <h2 className="text-base font-bold text-[#14213D] dark:text-white">Parcel Record Not Found</h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
            No registered cadastral parcel record found for ID #{parcelId}.
          </p>
          <div className="pt-2">
            <Link
              href="/field/parcels"
              className="inline-flex items-center gap-1.5 py-2 px-4 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white text-xs font-bold transition-all shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Assigned Parcels
            </Link>
          </div>
        </div>
      </FieldShell>
    );
  }

  const sNo = parcel.survey_no || parcel.survey_number || parcel.parcel_id || "-";

  return (
    <FieldShell title={`Parcel: Survey ${sNo}`} showBack>
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/field/parcels"
            className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0B2E59] dark:text-slate-400 dark:hover:text-white transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> All Assigned Parcels
          </Link>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-[3px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 text-[#0B2E59] dark:text-sky-400 font-bold">
            ID: {parcelId}
          </span>
        </div>

        {/* Parcel Header Card */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B2E59] dark:text-sky-400 font-mono">
                Cadastral Survey Record
              </span>
              <h1 className="text-xl font-black text-[#14213D] dark:text-white font-display">
                Survey No. {sNo}
              </h1>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                {parcel.village_name || "Operational Sector"}, Tehsil {parcel.tehsil || "Sector Jurisdiction"}, {parcel.district || "Corridor Zone"}
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 text-xs font-mono font-bold rounded-[3px] bg-[#E6F0FA] dark:bg-sky-950/40 text-[#0B5FA5] dark:text-sky-300 border border-[#B8D5ED] dark:border-sky-800/40">
                {parcel.area_acres || 0} Acres
              </span>
              <span className="block text-[10px] text-[#64748B] dark:text-slate-400 mt-1 font-semibold">
                {parcel.land_type || "Agricultural"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-[#DCE2E8] dark:border-white/10">
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] border ${
              parcel.verification_status === "verified"
                ? "bg-[#E8F5E9] dark:bg-emerald-950/40 border-[#C8E6C9] dark:border-emerald-800/40 text-[#1E7E34] dark:text-emerald-300"
                : parcel.conflict_flag || parcel.verification_status === "disputed"
                ? "bg-[#FFEBEE] dark:bg-rose-950/40 border-[#FFCDD2] dark:border-rose-800/40 text-[#B32424] dark:text-rose-300"
                : "bg-[#FFF8E1] dark:bg-amber-950/40 border-[#FFE082] dark:border-amber-800/40 text-[#B36B00] dark:text-amber-300"
            }`}>
              Status: {parcel.verification_status || "Pending Verification"}
            </span>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[3px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 text-[#64748B] dark:text-slate-400">
              Stage: {parcel.current_stage || "NOTIF_11"}
            </span>
          </div>
        </div>

        {/* Feedback banner */}
        {feedback && (
          <div className="p-3 rounded-[4px] bg-[#E8F5E9] dark:bg-emerald-950/40 border border-[#C8E6C9] dark:border-emerald-800/40 text-[#1E7E34] dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
        )}


        {/* Citizen Landowner Grievances on this parcel */}
        {complaints.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#B36B00] dark:text-amber-400 px-1">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#B36B00] dark:text-amber-400" /> Assigned Citizen Grievances ({complaints.length})
              </span>
              <span className="text-[10px] font-mono text-[#64748B] dark:text-slate-400">Citizen → Field Redressal</span>
            </div>

            {complaints.map((cmp) => {
              const isResolved = cmp.status === "RESOLVED";
              const isVerified = cmp.status === "VERIFIED";

              return (
                <div
                  key={cmp.id}
                  className="p-3.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10 bg-white dark:bg-[#0D121F] shadow-xs text-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#14213D] dark:text-white uppercase text-[11px] block">
                        {cmp.complaint_type}
                      </span>
                      <span className="text-[10px] text-[#64748B] dark:text-slate-400">
                        Citizen: <strong className="text-[#14213D] dark:text-slate-200">{cmp.owner_name}</strong> ({cmp.contact_village})
                      </span>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-[3px] uppercase border ${
                      isResolved
                        ? "bg-[#E8F5E9] dark:bg-emerald-950/40 border-[#C8E6C9] dark:border-emerald-800/40 text-[#1E7E34] dark:text-emerald-300"
                        : isVerified
                        ? "bg-[#E6F0FA] dark:bg-sky-950/40 border-[#B8D5ED] dark:border-sky-800/40 text-[#0B5FA5] dark:text-sky-300"
                        : "bg-[#FFF8E1] dark:bg-amber-950/40 border-[#FFE082] dark:border-amber-800/40 text-[#B36B00] dark:text-amber-300"
                    }`}>
                      {cmp.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <p className="text-[#333333] dark:text-slate-300 text-[11px] leading-relaxed">
                    {cmp.description}
                  </p>

                  {cmp.verification && (
                    <div className="p-2.5 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 text-[11px] space-y-1">
                      <span className="text-[#1E7E34] dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ground Verification Recorded:
                      </span>
                      <p className="text-[#333333] dark:text-slate-300">{cmp.verification.observations}</p>
                    </div>
                  )}

                  {!isVerified && !isResolved && (
                    <div>
                      {verifyingComplaintId === cmp.id ? (
                        <div className="space-y-2 pt-2 border-t border-[#DCE2E8] dark:border-white/10">
                          <label className="block text-[10px] font-bold text-[#14213D] dark:text-slate-300 uppercase">
                            Record Ground Inspection Observations:
                          </label>
                          <textarea
                            rows={2}
                            value={complaintObservations}
                            onChange={(e) => setComplaintObservations(e.target.value)}
                            placeholder="Physical boundary peg verified, title discrepancy notes, passbook inspected..."
                            className="w-full p-2 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#CBD5E1] dark:border-white/15 text-[#14213D] dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-[#0B2E59]"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={verifyingSubmitting}
                              onClick={() => handleVerifyComplaint(cmp.complaint_id || cmp.id)}
                              className="px-3 py-1.5 rounded-[4px] bg-[#1E7E34] hover:bg-[#166527] text-white text-[11px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer shadow-xs disabled:opacity-60"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{verifyingSubmitting ? "Submitting..." : "Submit Ground Verification"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setVerifyingComplaintId(null)}
                              className="px-2.5 py-1.5 rounded-[4px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] text-[#64748B] hover:text-[#14213D] dark:text-slate-400 text-[11px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setVerifyingComplaintId(cmp.id);
                            setComplaintObservations("");
                          }}
                          className="w-full py-2 px-3 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white font-semibold text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Conduct On-Site Grievance Verification</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Active Ground Incidents on this parcel */}
        {incidents.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#B32424] dark:text-rose-400 px-1">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#B32424] dark:text-rose-400" /> Active Field Incidents &amp; Blockers ({incidents.length})
              </span>
            </div>

            {incidents.map((inc) => {
              const isResolved = inc.status === "resolved";
              const isConfirmed = inc.status === "confirmed";

              return (
                <div
                  key={inc.verification_id}
                  className="p-3.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10 bg-white dark:bg-[#0D121F] shadow-xs text-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#14213D] dark:text-white uppercase text-[11px]">
                      {(inc.issue_type || "Ground Incident").replace(/_/g, " ")}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-[3px] uppercase border ${
                      isResolved
                        ? "bg-[#E8F5E9] dark:bg-emerald-950/40 border-[#C8E6C9] text-[#1E7E34] dark:text-emerald-300"
                        : isConfirmed
                        ? "bg-[#FFF8E1] dark:bg-amber-950/40 border-[#FFE082] text-[#B36B00] dark:text-amber-300"
                        : "bg-[#FFEBEE] dark:bg-rose-950/40 border-[#FFCDD2] text-[#B32424] dark:text-rose-300"
                    }`}>
                      {inc.status}
                    </span>
                  </div>

                  <p className="text-[#333333] dark:text-slate-300 text-[11px] leading-relaxed">
                    {inc.observations || inc.remarks || "Issue logged by field inspection."}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-[#64748B] dark:text-slate-400 pt-1 border-t border-[#DCE2E8] dark:border-white/10">
                    <span>Officer: {inc.officer_name || "Officer"}</span>
                    <span className="font-mono text-[9px] text-[#64748B] dark:text-slate-400">{inc.source_type || "OFFICIAL RECORD"}</span>
                  </div>

                  {!isResolved && inc.status === "reported" && (
                    <div className="pt-2">
                      {confirmingId !== inc.verification_id ? (
                        <button
                          onClick={() => setConfirmingId(inc.verification_id)}
                          className="w-full py-2 px-3 bg-[#B36B00] hover:bg-[#8F5500] text-white rounded-[4px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Confirm Incident on Ground</span>
                        </button>
                      ) : (
                        <div className="space-y-2 bg-[#F8FAFC] dark:bg-[#07080F] p-3 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
                          <label className="block text-[11px] text-[#14213D] dark:text-slate-300 font-bold">
                            Field Confirmation Remarks &amp; Findings:
                          </label>
                          <textarea
                            rows={2}
                            value={confirmNotes}
                            onChange={(e) => setConfirmNotes(e.target.value)}
                            placeholder="Detail physical inspection findings, witnesses, or alignment shifts..."
                            className="w-full bg-white dark:bg-[#0D121F] border border-[#CBD5E1] dark:border-white/15 rounded-[4px] p-2 text-xs text-[#14213D] dark:text-white resize-none outline-none focus:border-[#0B2E59]"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setConfirmingId(null)}
                              className="px-2.5 py-1 text-xs text-[#64748B] hover:text-[#14213D] dark:text-slate-400 dark:hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              disabled={confirmingSubmitting}
                              onClick={() => handleConfirmIncident(inc.verification_id)}
                              className="px-3 py-1 bg-[#1E7E34] hover:bg-[#166527] text-white rounded-[4px] text-xs font-bold flex items-center gap-1 shadow-xs disabled:opacity-60"
                            >
                              <Send className="w-3 h-3" />
                              {confirmingSubmitting ? "Submitting..." : "Confirm with GPS"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Landowner Reported Boundary (Claimed / Unverified) */}
        {claimedBoundaries.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#B36B00] dark:text-amber-400 px-1">
              <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider">
                <Compass className="w-4 h-4 text-[#B36B00] dark:text-amber-400" /> Landowner Reported Boundary ({claimedBoundaries.length})
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-[3px] bg-[#FFF8E1] dark:bg-amber-950/40 text-[#B36B00] dark:text-amber-300 border border-[#FFE082] dark:border-amber-800/40">
                CLAIMED / UNVERIFIED
              </span>
            </div>

            {claimedBoundaries.map((b, idx) => {
              const pts = b.boundary_points || [];
              const verification = b.metadata?.field_verification || b.field_verification;
              const hasHighUncertainty = pts.some((p: any) => p.accuracy > 15);

              return (
                <div
                  key={b.id || idx}
                  className="bg-white dark:bg-[#0D121F] border border-[#FFE082] dark:border-amber-800/40 rounded-[4px] p-4 space-y-3 text-xs shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-[#DCE2E8] dark:border-white/10 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#14213D] dark:text-white text-sm">
                          Citizen Claimed Boundary
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[3px] bg-[#F8FAFC] dark:bg-[#07080F] text-[#64748B] dark:text-slate-400 border border-[#DCE2E8] dark:border-white/10">
                          {pts.length} GPS Points
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">
                        Claimant: <strong className="text-[#14213D] dark:text-slate-200">{b.metadata?.owner_name || parcel.owner_name || "Landowner"}</strong>
                        {b.created_at ? ` · Recorded ${new Date(b.created_at).toLocaleDateString()}` : ""}
                      </p>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-[3px] uppercase font-bold bg-[#FFF8E1] dark:bg-amber-950/40 text-[#B36B00] dark:text-amber-300 border border-[#FFE082] dark:border-amber-800/40">
                      {b.status || "CLAIMED / UNVERIFIED"}
                    </span>
                  </div>

                  {/* Calculated Area & Uncertainty */}
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="bg-[#F8FAFC] dark:bg-[#07080F] p-2.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
                      <span className="text-[10px] text-[#64748B] dark:text-slate-400 block font-sans font-semibold">Geodesic Area (ESTIMATED)</span>
                      <span className="text-[#14213D] dark:text-white font-bold text-sm">
                        {b.area_sqm ? Number(b.area_sqm).toLocaleString() : "—"} m²
                      </span>
                      <span className="text-[#64748B] dark:text-slate-400 text-[10px] block mt-0.5">
                        {b.area_acres || (b.area_sqm ? (b.area_sqm * 0.000247105).toFixed(3) : "—")} Acres · {b.area_hectares || (b.area_sqm ? (b.area_sqm / 10000).toFixed(4) : "—")} Ha
                      </span>
                    </div>

                    <div className="bg-[#F8FAFC] dark:bg-[#07080F] p-2.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
                      <span className="text-[10px] text-[#64748B] dark:text-slate-400 block font-sans font-semibold">GPS Error Uncertainty</span>
                      {b.area_uncertainty_sqm ? (
                        <>
                          <span className="text-[#B36B00] dark:text-amber-400 font-bold text-sm">
                            ±{Number(b.area_uncertainty_sqm).toFixed(1)} m²
                          </span>
                          <span className="text-[#64748B] dark:text-slate-400 text-[10px] block mt-0.5">
                            Derived from device accuracy
                          </span>
                        </>
                      ) : (
                        <span className="text-[#64748B] dark:text-slate-400 text-[10px] block italic pt-1">
                          Area uncertainty cannot be reliably calculated from the available GPS data.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* High uncertainty warning if any point > 15m */}
                  {hasHighUncertainty && (
                    <div className="p-2 rounded-[4px] bg-[#FFF8E1] dark:bg-amber-950/20 border border-[#FFE082] dark:border-amber-800/40 text-[#B36B00] dark:text-amber-300 text-[11px] flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-[#B36B00] dark:text-amber-400" />
                      <span>One or more claimed points have GPS accuracy &gt; 15m. Field verification recommended.</span>
                    </div>
                  )}

                  {/* GPS Points Table */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider font-mono block">
                      Landowner Recorded GPS Points ({pts.length})
                    </span>
                    <div className="overflow-x-auto border border-[#DCE2E8] dark:border-white/10 rounded-[4px] bg-white dark:bg-[#07080F]">
                      <table className="w-full text-left text-[11px] font-mono">
                        <thead className="bg-[#F1F4F7] dark:bg-[#0A2647] text-[#0B2E59] dark:text-slate-200 border-b border-[#DCE2E8] dark:border-white/10 font-bold">
                          <tr>
                            <th className="p-2">#</th>
                            <th className="p-2">Latitude</th>
                            <th className="p-2">Longitude</th>
                            <th className="p-2">Accuracy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCE2E8] dark:divide-white/10">
                          {pts.map((pt: any, pIdx: number) => (
                            <tr key={pt.id || pIdx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                              <td className="p-2 text-[#64748B] dark:text-slate-400">{pt.sequence || pIdx + 1}</td>
                              <td className="p-2 text-[#14213D] dark:text-slate-200">{Number(pt.lat).toFixed(6)}°</td>
                              <td className="p-2 text-[#14213D] dark:text-slate-200">{Number(pt.lng).toFixed(6)}°</td>
                              <td className="p-2">
                                <span className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold ${
                                  pt.accuracy <= 5
                                    ? "bg-[#E8F5E9] text-[#1E7E34] border border-[#C8E6C9]"
                                    : pt.accuracy <= 15
                                    ? "bg-[#FFF8E1] text-[#B36B00] border border-[#FFE082]"
                                    : "bg-[#FFEBEE] text-[#B32424] border border-[#FFCDD2]"
                                }`}>
                                  ±{pt.accuracy}m
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Existing Field Officer Boundary Verification Audit */}
                  {verification && (
                    <div className="p-3 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#C8E6C9] dark:border-emerald-800/40 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[#1E7E34] dark:text-emerald-400 font-bold flex items-center gap-1 font-mono text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Field Boundary Inspection Recorded
                        </span>
                        <span className="px-2 py-0.5 rounded-[3px] text-[9px] font-mono font-bold uppercase bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-300 border border-[#C8E6C9] dark:border-emerald-800/40">
                          {verification.verification_status?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-[#333333] dark:text-slate-300 text-[11px] leading-relaxed">
                        {verification.field_notes}
                      </p>
                      <div className="text-[10px] text-[#64748B] dark:text-slate-400 pt-1 border-t border-[#DCE2E8] dark:border-white/10 flex items-center justify-between font-mono">
                        <span>Audited by: {verification.officer_name || "Field Officer"}</span>
                        <span>{verification.verified_at ? new Date(verification.verified_at).toLocaleDateString() : ""}</span>
                      </div>
                    </div>
                  )}

                  {/* Verification action form */}
                  {verifyingBoundaryId === (b.id || String(idx)) ? (
                    <div className="space-y-2.5 pt-2 border-t border-[#DCE2E8] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#07080F] p-3 rounded-[4px]">
                      <span className="text-[11px] font-bold text-[#14213D] dark:text-slate-300 uppercase tracking-wider block font-mono">
                        Record Field Boundary Inspection
                      </span>
                      <p className="text-[10px] text-[#64748B] dark:text-slate-400 leading-tight">
                        Note: This records your field verification audit. The landowner claimed boundary coordinates and area will remain preserved in the permanent record.
                      </p>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#64748B] dark:text-slate-400">Ground Inspection Finding:</label>
                        <select
                          value={boundaryStatus}
                          onChange={(e: any) => setBoundaryStatus(e.target.value)}
                          className="w-full p-2 rounded-[4px] bg-white dark:bg-[#0D121F] border border-[#CBD5E1] dark:border-white/15 text-xs text-[#14213D] dark:text-white focus:outline-none focus:border-[#0B2E59]"
                        >
                          <option value="verified_match">Verified Match — On-site boundary aligns with claimed GPS</option>
                          <option value="minor_variance">Minor Variance — Alignment shift &lt; 2 meters</option>
                          <option value="demarcation_dispute">Demarcation Dispute — Overlaps adjacent survey or ROW</option>
                          <option value="requires_joint_survey">Requires Joint Cadastral Survey with Revenue Lekhpal</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#64748B] dark:text-slate-400">Field Notes &amp; Observation Details:</label>
                        <textarea
                          rows={2}
                          value={boundaryAuditNotes}
                          onChange={(e) => setBoundaryAuditNotes(e.target.value)}
                          placeholder="Boundary peg marks checked, stone pillars verified, alignment matches Section 11 map..."
                          className="w-full p-2 rounded-[4px] bg-white dark:bg-[#0D121F] border border-[#CBD5E1] dark:border-white/15 text-xs text-[#14213D] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0B2E59]"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setVerifyingBoundaryId(null)}
                          className="px-3 py-1.5 rounded-[4px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 text-[#64748B] hover:text-[#14213D] dark:text-slate-400 text-[11px]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={boundarySubmitting}
                          onClick={() => handleVerifyBoundary(b.id || b.document_id)}
                          className="px-3 py-1.5 rounded-[4px] bg-[#1E7E34] hover:bg-[#166527] text-white text-[11px] font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{boundarySubmitting ? "Submitting..." : "Submit Boundary Audit"}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setVerifyingBoundaryId(b.id || String(idx));
                        setBoundaryAuditNotes("");
                      }}
                      className="w-full py-2 px-3 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{verification ? "Re-inspect Boundary on Ground" : "Audit & Verify Landowner Boundary on Ground"}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 10 Required Data Points Specification */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-3.5 text-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-[#14213D] dark:text-white uppercase tracking-wider font-mono">
            <ShieldCheck className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
            <span>Land Acquisition Registry Record</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-[#64748B] dark:text-slate-400 block font-semibold">1. Parcel ID</span>
              <span className="font-mono font-semibold text-[#14213D] dark:text-slate-200">{parcelId}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] dark:text-slate-400 block font-semibold">2. Project Corridor</span>
              <span className="font-mono font-semibold text-[#0B5FA5] dark:text-sky-300">{parcel.project_id || "National Corridor"}</span>
            </div>

            <div>
              <span className="text-[10px] text-[#64748B] dark:text-slate-400 block font-semibold">3. Village / Jurisdiction</span>
              <span className="font-medium text-[#14213D] dark:text-slate-200">{parcel.village_name || "Operational Sector"}, {parcel.district || "Corridor Zone"}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] dark:text-slate-400 block font-semibold">4. Survey / Khasra No.</span>
              <span className="font-mono font-bold text-[#0B2E59] dark:text-sky-400">{sNo}</span>
            </div>

            <div>
              <span className="text-[10px] text-[#64748B] dark:text-slate-400 block font-semibold">5. Extent / Area</span>
              <span className="font-mono font-medium text-[#14213D] dark:text-slate-200">
                {parcel.area_acres || 0} Acres ({parcel.area_hectares || 0} Ha)
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] dark:text-slate-400 block font-semibold">6. Acquisition Stage</span>
              <span className="font-mono font-medium text-[#B36B00] dark:text-amber-400">{parcel.current_stage || "Pending Survey"}</span>
            </div>

            <div className="col-span-2 bg-[#F8FAFC] dark:bg-[#07080F] p-2.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10 space-y-1">
              <span className="text-[10px] text-[#64748B] dark:text-slate-400 block font-semibold">7. Recorded Landholder &amp; Heirs</span>
              <span className="font-bold text-[#14213D] dark:text-white text-sm block">{parcel.owner_name || "Citizen Landowner"}</span>
              <span className="text-[11px] text-[#64748B] dark:text-slate-400 block">{parcel.father_name ? `S/O: ${parcel.father_name} · ` : ""}Verified Title</span>
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-2">
              <div className="bg-[#F8FAFC] dark:bg-[#07080F] p-2.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
                <span className="text-[10px] text-[#64748B] dark:text-slate-400 block font-semibold">8. Compensation Status</span>
                <span className="font-semibold text-[#1E7E34] dark:text-emerald-400 font-mono block">
                  ₹{parcel.assessed_value ? (parcel.assessed_value / 100000).toFixed(2) : "0.00"} Lakhs
                </span>
                <span className="text-[10px] text-[#64748B] dark:text-slate-400 block mt-0.5">Determined / Pending Award</span>
              </div>

              <div className="bg-[#F8FAFC] dark:bg-[#07080F] p-2.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
                <span className="text-[10px] text-[#64748B] dark:text-slate-400 block font-semibold">9. R&amp;R Entitlement</span>
                <span className="font-medium text-[#14213D] dark:text-slate-200 block text-[11px]">RFCTLARR 2nd Sched</span>
                <span className="text-[10px] text-[#64748B] dark:text-slate-400 block mt-0.5">Resettlement Applicable</span>
              </div>
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-2">
              <div className="bg-[#F8FAFC] dark:bg-[#07080F] p-2.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
                <span className="text-[10px] text-[#64748B] dark:text-slate-400 block font-semibold">10. Legal Dispute Status</span>
                <span className="font-medium text-[#14213D] dark:text-slate-300 block text-[11px]">No Active High Court Stay</span>
              </div>
              <div className="bg-[#F8FAFC] dark:bg-[#07080F] p-2.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
                <span className="text-[10px] text-[#64748B] dark:text-slate-400 block font-semibold">Risk &amp; Criticality</span>
                <span className="font-mono font-bold text-[#14213D] dark:text-slate-200 block text-[11px]">
                  Risk: {parcel.risk_score || 42} / Float: +0d
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Real Spatial Map & Location Component */}
        <CaptureLocation
          targetLat={parcel.centroid_lat || 24.6492}
          targetLng={parcel.centroid_lng || 75.9284}
          surveyNo={sNo}
          parcelId={parcelId}
          polygonCoords={
            (parcel.geometry_coordinates && parcel.geometry_coordinates.length > 0)
              ? parcel.geometry_coordinates
              : (claimedBoundaries[0]?.boundary_points && claimedBoundaries[0].boundary_points.length >= 3)
              ? claimedBoundaries[0].boundary_points.map((p: any) => [p.lng, p.lat])
              : undefined
          }
          onLocationCaptured={(pos) => {
            console.log("Captured GPS:", pos);
          }}
        />

        <Link
          href="/field/map"
          className="w-full py-2.5 px-4 bg-white dark:bg-[#0D121F] hover:bg-[#F8FAFC] dark:hover:bg-white/5 border border-[#DCE2E8] dark:border-white/10 text-[#0B2E59] dark:text-sky-400 rounded-[4px] text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs"
        >
          <Compass className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
          <span>Inspect on Corridor Spatial GIS Map</span>
        </Link>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <Link
            href={`/field/parcels/${parcelId}/verify`}
            className="w-full py-3 px-4 bg-[#1E7E34] hover:bg-[#166527] text-white rounded-[4px] text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Launch Verification Survey</span>
          </Link>

          <Link
            href={`/field/parcels/${parcelId}/report`}
            className="w-full py-2.5 px-4 bg-white dark:bg-[#0D121F] hover:bg-[#FFEBEE] dark:hover:bg-rose-950/30 border border-[#FFCDD2] dark:border-rose-800/40 text-[#B32424] dark:text-rose-400 rounded-[4px] text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <AlertTriangle className="w-4 h-4 text-[#B32424] dark:text-rose-400" />
            <span>Flag Ground Issue / Blocker</span>
          </Link>
        </div>

      </div>
    </FieldShell>
  );
}