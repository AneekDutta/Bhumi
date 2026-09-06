"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Clock,
  ShieldCheck,
  Send,
  RefreshCw
} from "lucide-react";
import { getFieldIncidents, resolveAdminIncident } from "@/lib/api";
import { useRealtimeIncidents } from "@/lib/supabase/useRealtime";

interface FieldIncidentReviewCardProps {
  parcelId: string;
  projectId?: string;
}

export function FieldIncidentReviewCard({ parcelId, projectId }: FieldIncidentReviewCardProps) {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [action, setAction] = useState<string>("RESOLVE");
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFieldIncidents({ parcel_id: parcelId });
      setIncidents(data || []);
    } catch {
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, [parcelId]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  // Supabase Realtime: automatically updates when Field Officer reports/updates ground incidents
  useRealtimeIncidents(parcelId, () => {
    loadIncidents();
  });

  const handleResolve = async (incidentId: string) => {
    if (!comment.trim()) {
      alert("Please provide an administrative resolution note or order reference.");
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await resolveAdminIncident(incidentId, {
        resolution_action: action,
        resolution_comment: comment.trim(),
        admin_name: "CALA Administrative Office",
        parcel_id: parcelId
      });

      setFeedback({
        type: "success",
        message: action === "RESOLVE"
          ? `Incident marked RESOLVED. CPM blocker edge cleared. Corridor delay revised to ${res.cpm_delay_days || 0} days.`
          : `Incident updated to status: ${action}. Audit entry registered.`
      });

      setResolvingId(null);
      setComment("");
      await loadIncidents();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Unable to submit resolution. Please try again."
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-5 mb-6 shadow-xs">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <div className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider font-semibold">
            Field Operations & Ground Verification
          </div>
          <h2 className="text-base font-bold text-[#14213D] dark:text-[#F0F4FF] mt-0.5">
            Reported Field Incidents & CPM Bottlenecks
          </h2>
        </div>
        <button
          onClick={loadIncidents}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-[4px] border border-[#DCE2E8] dark:border-white/10 bg-white dark:bg-[#07080F] text-[#5A6A80] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" /> Refresh Records
        </button>
      </div>

      {feedback && (
        <div
          className={`mb-4 p-3 rounded-[4px] text-xs font-semibold flex items-center gap-2 border ${
            feedback.type === "success"
              ? "bg-[#E8F5E9] dark:bg-emerald-950/30 border-[#C8E6C9] dark:border-emerald-800/40 text-[#1E7E34] dark:text-emerald-300"
              : "bg-[#FFEBEE] dark:bg-rose-950/30 border-[#FFCDD2] dark:border-rose-800/40 text-[#B32424] dark:text-rose-300"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {loading ? (
        <div className="py-6 text-center text-[#5A6A80] dark:text-slate-400 text-xs">
          Loading field ground verifications...
        </div>
      ) : incidents.length === 0 ? (
        <div className="p-6 text-center bg-[#F8FAFC] dark:bg-[#07080F] rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
          <CheckCircle2 className="w-5 h-5 text-[#1E7E34] mx-auto mb-2" />
          <div className="text-xs font-bold text-[#14213D] dark:text-[#F0F4FF]">No Ground Blockers Reported</div>
          <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-1">
            No unresolved boundary discrepancies, ownership disputes, or physical access impediments logged by field officers for this parcel.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {incidents.map((inc) => {
            const isResolved = inc.status === "resolved";
            const isEditing = resolvingId === inc.verification_id;

            return (
              <div
                key={inc.verification_id}
                className={`rounded-[4px] p-4 border flex flex-col gap-3 ${
                  isResolved
                    ? "bg-[#E8F5E9]/30 dark:bg-emerald-950/20 border-[#C8E6C9] dark:border-emerald-800/40"
                    : "bg-[#FFEBEE]/30 dark:bg-rose-950/20 border-[#FFCDD2] dark:border-rose-800/40"
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-[4px] flex items-center justify-center shrink-0 ${
                        isResolved
                          ? "bg-[#E8F5E9] dark:bg-emerald-900/40 text-[#1E7E34] dark:text-emerald-300"
                          : "bg-[#FFEBEE] dark:bg-rose-900/40 text-[#B32424] dark:text-rose-300"
                      }`}
                    >
                      {isResolved ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#14213D] dark:text-[#F0F4FF] capitalize">
                          {(inc.issue_type || "Ground Incident").replace(/_/g, " ")}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-[2px] uppercase ${
                            isResolved
                              ? "bg-[#E8F5E9] dark:bg-emerald-950/50 text-[#1E7E34] dark:text-emerald-300 border border-[#C8E6C9] dark:border-emerald-800/40"
                              : "bg-[#FFEBEE] dark:bg-rose-950/50 text-[#B32424] dark:text-rose-300 border border-[#FFCDD2] dark:border-rose-800/40"
                          }`}
                        >
                          {inc.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-0.5">
                        Ref: <span className="font-mono text-[#14213D] dark:text-slate-300 font-semibold">{inc.verification_id}</span> · Survey {inc.survey_number || parcelId}
                      </div>
                    </div>
                  </div>

                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-[#F8FAFC] dark:bg-white/5 border border-[#DCE2E8] dark:border-white/10 text-[#5A6A80] dark:text-slate-400 uppercase">
                    {inc.source_type || "OFFICIAL RECORD"}
                  </span>
                </div>

                {/* Observations and Details */}
                <div className="bg-white dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-3 text-xs leading-relaxed">
                  <p className="text-[#14213D] dark:text-[#F0F4FF] m-0 mb-1">
                    <strong className="text-[#0B2E59] dark:text-sky-300">Field Notes: </strong>
                    {inc.observations || inc.remarks || "Incident recorded during site visit."}
                  </p>
                  {inc.remarks && inc.remarks !== inc.observations && (
                    <p className="text-[#5A6A80] dark:text-slate-400 m-0 text-[11px]">
                      <strong>Remarks: </strong> {inc.remarks}
                    </p>
                  )}
                </div>

                {/* Meta details: Officer, GPS, Time */}
                <div className="flex flex-wrap gap-4 text-xs text-[#5A6A80] dark:text-slate-400">
                  <span>
                    Reported by: <strong className="text-[#14213D] dark:text-slate-200">{inc.officer_name || "Field Officer"}</strong> ({inc.officer_id || "OF001"})
                  </span>

                  {inc.gps_lat && inc.gps_lng && (
                    <span className="flex items-center gap-1 text-[#0B2E59] dark:text-sky-400">
                      <MapPin className="w-3 h-3" />
                      <span className="font-mono">
                        {inc.gps_lat.toFixed(4)}, {inc.gps_lng.toFixed(4)}
                      </span>
                      {inc.gps_accuracy && <span className="text-[#5A6A80] dark:text-slate-400">(±{inc.gps_accuracy}m)</span>}
                    </span>
                  )}

                  {inc.verified_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(inc.verified_at).toLocaleString()}</span>
                    </span>
                  )}
                </div>

                {/* Existing Admin Resolution if present */}
                {inc.admin_resolution && (
                  <div className="bg-[#E8F5E9]/60 dark:bg-emerald-950/30 border border-[#C8E6C9] dark:border-emerald-800/40 rounded-[4px] p-3 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#1E7E34] dark:text-emerald-300 uppercase">
                        Administrative Order: {inc.admin_resolution.action}
                      </span>
                      <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 font-mono">
                        {new Date(inc.admin_resolution.resolved_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[#14213D] dark:text-slate-200">{inc.admin_resolution.comments}</div>
                    <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-1">Authority: {inc.admin_resolution.resolved_by}</div>
                  </div>
                )}

                {/* Admin Action Form if not resolved */}
                {!isResolved && (
                  <div>
                    {!isEditing ? (
                      <button
                        onClick={() => {
                          setResolvingId(inc.verification_id);
                          setAction("RESOLVE");
                          setComment("");
                        }}
                        className="px-3.5 py-1.5 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Adjudicate / Resolve Blocker
                      </button>
                    ) : (
                      <div className="bg-white dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-3.5 flex flex-col gap-3">
                        <div className="text-xs font-bold text-[#14213D] dark:text-[#F0F4FF]">
                          Administrative Action for {inc.verification_id}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setAction("RESOLVE")}
                            className={`px-3 py-1.5 rounded-[4px] text-xs font-bold transition-colors cursor-pointer ${
                              action === "RESOLVE"
                                ? "bg-[#1E7E34] text-white"
                                : "bg-[#F8FAFC] dark:bg-white/5 border border-[#DCE2E8] dark:border-white/10 text-[#5A6A80] dark:text-slate-300 hover:bg-[#E2E8F0]/50"
                            }`}
                          >
                            Resolve Blocker (Unblocks CPM)
                          </button>
                          <button
                            type="button"
                            onClick={() => setAction("ESCALATE")}
                            className={`px-3 py-1.5 rounded-[4px] text-xs font-bold transition-colors cursor-pointer ${
                              action === "ESCALATE"
                                ? "bg-[#B36B00] text-white"
                                : "bg-[#F8FAFC] dark:bg-white/5 border border-[#DCE2E8] dark:border-white/10 text-[#5A6A80] dark:text-slate-300 hover:bg-[#E2E8F0]/50"
                            }`}
                          >
                            Escalate to Collector
                          </button>
                          <button
                            type="button"
                            onClick={() => setAction("REJECT")}
                            className={`px-3 py-1.5 rounded-[4px] text-xs font-bold transition-colors cursor-pointer ${
                              action === "REJECT"
                                ? "bg-[#B32424] text-white"
                                : "bg-[#F8FAFC] dark:bg-white/5 border border-[#DCE2E8] dark:border-white/10 text-[#5A6A80] dark:text-slate-300 hover:bg-[#E2E8F0]/50"
                            }`}
                          >
                            Reject (Non-blocking)
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#5A6A80] dark:text-slate-400 mb-1">
                            Administrative Resolution Order / Settlement Notes *
                          </label>
                          <textarea
                            rows={2}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Enter joint survey order number, settlement terms, or demarcation reference..."
                            className="w-full bg-[#F8FAFC] dark:bg-[#0D121F] border border-[#CBD5E1] dark:border-white/15 rounded-[4px] p-2 text-xs text-[#14213D] dark:text-white outline-none focus:border-[#0B2E59] resize-none"
                          />
                        </div>

                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => setResolvingId(null)}
                            className="px-3 py-1.5 rounded-[4px] bg-white dark:bg-white/5 border border-[#DCE2E8] dark:border-white/10 text-[#5A6A80] dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/10 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleResolve(inc.verification_id)}
                            className="px-3.5 py-1.5 rounded-[4px] bg-[#1E7E34] hover:bg-[#166527] text-white text-xs font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs"
                          >
                            <Send className="w-3 h-3" />
                            {submitting ? "Processing..." : "Commit Administrative Order"}
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
    </div>
  );
}