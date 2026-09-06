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
    <div className="glass" style={{ borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#3a4258", letterSpacing: "0.07em", textTransform: "uppercase" }}>
            Field Operations & Ground Verification
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#c4cfe4", marginTop: 2 }}>
            Reported Field Incidents & CPM Bottlenecks
          </h2>
        </div>
        <button
          onClick={loadIncidents}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            padding: "5px 10px",
            borderRadius: 6,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#8899b4",
            cursor: "pointer"
          }}
        >
          <RefreshCw style={{ width: 12, height: 12 }} /> Refresh Records
        </button>
      </div>

      {feedback && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: feedback.type === "success" ? "rgba(16,185,129,0.12)" : "rgba(244,63,94,0.12)",
            border: `1px solid ${feedback.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(244,63,94,0.3)"}`,
            color: feedback.type === "success" ? "#34d399" : "#f43f5e"
          }}
        >
          {feedback.type === "success" ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : <AlertTriangle style={{ width: 14, height: 14 }} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "24px 0", textAlign: "center", color: "#6b7a94", fontSize: 12 }}>
          Loading field ground verifications...
        </div>
      ) : incidents.length === 0 ? (
        <div style={{ padding: "24px 16px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
          <CheckCircle2 style={{ width: 22, height: 22, color: "#10b981", margin: "0 auto 8px" }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: "#c4cfe4" }}>No Ground Blockers Reported</div>
          <div style={{ fontSize: 11, color: "#6b7a94", marginTop: 4 }}>
            No unresolved boundary discrepancies, ownership disputes, or physical access impediments logged by field officers for this parcel.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {incidents.map((inc) => {
            const isResolved = inc.status === "resolved";
            const isEditing = resolvingId === inc.verification_id;

            return (
              <div
                key={inc.verification_id}
                style={{
                  borderRadius: 12,
                  padding: "16px 18px",
                  background: isResolved ? "rgba(16,185,129,0.04)" : "rgba(244,63,94,0.06)",
                  border: `1px solid ${isResolved ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.3)"}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}
              >
                {/* Header Row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: isResolved ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isResolved ? "#10b981" : "#f43f5e"
                      }}
                    >
                      {isResolved ? <ShieldCheck style={{ width: 18, height: 18 }} /> : <AlertTriangle style={{ width: 18, height: 18 }} />}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", textTransform: "capitalize" }}>
                          {(inc.issue_type || "Ground Incident").replace(/_/g, " ")}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontFamily: "JetBrains Mono, monospace",
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: isResolved ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)",
                            color: isResolved ? "#34d399" : "#f43f5e",
                            fontWeight: 700,
                            textTransform: "uppercase"
                          }}
                        >
                          {inc.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#6b7a94", marginTop: 2 }}>
                        Ref: <span style={{ fontFamily: "JetBrains Mono, monospace", color: "#8899b4" }}>{inc.verification_id}</span> · Survey {inc.survey_number || parcelId}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: "JetBrains Mono, monospace",
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#94a3b8"
                      }}
                    >
                      {inc.source_type || "OFFICIAL RECORD"}
                    </span>
                  </div>
                </div>

                {/* Observations and Details */}
                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "10px 12px", fontSize: 12, lineHeight: 1.5 }}>
                  <p style={{ color: "#c4cfe4", margin: "0 0 6px" }}>
                    <strong style={{ color: "#e2e8f0" }}>Field Notes: </strong>
                    {inc.observations || inc.remarks || "Incident recorded during site visit."}
                  </p>
                  {inc.remarks && inc.remarks !== inc.observations && (
                    <p style={{ color: "#94a3b8", margin: 0, fontSize: 11 }}>
                      <strong style={{ color: "#64748b" }}>Remarks: </strong> {inc.remarks}
                    </p>
                  )}
                </div>

                {/* Meta details: Officer, GPS, Time */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 11, color: "#6b7a94" }}>
                  <span>
                    Reported by: <strong style={{ color: "#8899b4" }}>{inc.officer_name || "Field Officer"}</strong> ({inc.officer_id || "OF001"})
                  </span>

                  {inc.gps_lat && inc.gps_lng && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin style={{ width: 11, height: 11, color: "#38bdf8" }} />
                      <span style={{ fontFamily: "JetBrains Mono, monospace", color: "#38bdf8" }}>
                        {inc.gps_lat.toFixed(4)}, {inc.gps_lng.toFixed(4)}
                      </span>
                      {inc.gps_accuracy && <span>(±{inc.gps_accuracy}m)</span>}
                    </span>
                  )}

                  {inc.verified_at && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock style={{ width: 11, height: 11 }} />
                      <span>{new Date(inc.verified_at).toLocaleString()}</span>
                    </span>
                  )}
                </div>

                {/* Existing Admin Resolution if present */}
                {inc.admin_resolution && (
                  <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "10px 12px", fontSize: 11 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: "#34d399", textTransform: "uppercase" }}>
                        Administrative Order: {inc.admin_resolution.action}
                      </span>
                      <span style={{ color: "#6b7a94", fontFamily: "JetBrains Mono, monospace" }}>
                        {new Date(inc.admin_resolution.resolved_at).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ color: "#c4cfe4" }}>{inc.admin_resolution.comments}</div>
                    <div style={{ color: "#6b7a94", marginTop: 4 }}>Authority: {inc.admin_resolution.resolved_by}</div>
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
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          background: "#6366f1",
                          color: "#fff",
                          border: "none",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <ShieldCheck style={{ width: 14, height: 14 }} /> Adjudicate / Resolve Blocker
                      </button>
                    ) : (
                      <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 14, border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                          Administrative Action for {inc.verification_id}
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => setAction("RESOLVE")}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              background: action === "RESOLVE" ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.05)",
                              border: `1px solid ${action === "RESOLVE" ? "#10b981" : "rgba(255,255,255,0.1)"}`,
                              color: action === "RESOLVE" ? "#34d399" : "#8899b4"
                            }}
                          >
                            Resolve Blocker (Unblocks CPM)
                          </button>
                          <button
                            type="button"
                            onClick={() => setAction("ESCALATE")}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              background: action === "ESCALATE" ? "rgba(234,179,8,0.25)" : "rgba(255,255,255,0.05)",
                              border: `1px solid ${action === "ESCALATE" ? "#eab308" : "rgba(255,255,255,0.1)"}`,
                              color: action === "ESCALATE" ? "#facc15" : "#8899b4"
                            }}
                          >
                            Escalate to Collector
                          </button>
                          <button
                            type="button"
                            onClick={() => setAction("REJECT")}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              background: action === "REJECT" ? "rgba(244,63,94,0.25)" : "rgba(255,255,255,0.05)",
                              border: `1px solid ${action === "REJECT" ? "#f43f5e" : "rgba(255,255,255,0.1)"}`,
                              color: action === "REJECT" ? "#f43f5e" : "#8899b4"
                            }}
                          >
                            Reject (Non-blocking)
                          </button>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "#8899b4", marginBottom: 4 }}>
                            Administrative Resolution Order / Settlement Notes *
                          </label>
                          <textarea
                            rows={2}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Enter joint survey order number, settlement terms, or demarcation reference..."
                            style={{
                              width: "100%",
                              background: "rgba(15,23,42,0.8)",
                              border: "1px solid rgba(255,255,255,0.12)",
                              borderRadius: 6,
                              padding: "8px 10px",
                              color: "#fff",
                              fontSize: 12,
                              resize: "none"
                            }}
                          />
                        </div>

                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => setResolvingId(null)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              background: "transparent",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#8899b4",
                              fontSize: 11,
                              cursor: "pointer"
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleResolve(inc.verification_id)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: 6,
                              background: "#10b981",
                              color: "#fff",
                              border: "none",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: submitting ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5
                            }}
                          >
                            <Send style={{ width: 11, height: 11 }} />
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