"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  FileText, 
  UserCheck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  RefreshCw, 
  Camera,
  ShieldCheck,
  User,
  ArrowRight
} from "lucide-react";
import { 
  getLandownerComplaints, 
  assignComplaintToOfficer, 
  resolveComplaint,
  getFieldOfficers 
} from "@/lib/api";
import { useRealtimeComplaints } from "@/lib/supabase/useRealtime";

interface LandownerGrievanceReviewCardProps {
  parcelId: string;
  projectId?: string;
}

export function LandownerGrievanceReviewCard({ parcelId }: LandownerGrievanceReviewCardProps) {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Assignment state
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState("OFF-001");
  const [adminNotes, setAdminNotes] = useState("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // Resolution state
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionAction, setResolutionAction] = useState<"RESOLVED" | "REJECTED" | "ESCALATED" | "REQUEST_INFO">("RESOLVED");
  const [resolutionComment, setResolutionComment] = useState("");
  const [resolveSubmitting, setResolveSubmitting] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const [cData, oData] = await Promise.all([
        getLandownerComplaints({ parcel_id: parcelId }),
        getFieldOfficers()
      ]);
      setComplaints(cData || []);
      setOfficers(oData || []);
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [parcelId]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  // Realtime hook: Auto-refreshes when Landowner submits or Field Officer verifies
  useRealtimeComplaints(parcelId, () => {
    loadComplaints();
  });

  const handleAssign = async (complaintId: string) => {
    setAssignSubmitting(true);
    setFeedback(null);
    try {
      const officer = officers.find((o) => o.officer_id === selectedOfficerId) || {
        officer_id: "OFF-001",
        name: "Ramesh Patel"
      };

      const res = await assignComplaintToOfficer(
        complaintId,
        officer.officer_id,
        officer.name,
        adminNotes.trim()
      );

      setFeedback({
        type: "success",
        message: res.message || `Grievance #${complaintId} assigned to ${officer.name}.`
      });

      setAssigningId(null);
      setAdminNotes("");
      await loadComplaints();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to assign officer. Check connection."
      });
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleResolve = async (complaintId: string) => {
    if (!resolutionComment.trim()) {
      alert("Please enter administrative determination notes or order reference.");
      return;
    }

    setResolveSubmitting(true);
    setFeedback(null);
    try {
      const res = await resolveComplaint(complaintId, {
        resolution_action: resolutionAction,
        resolution_comment: resolutionComment.trim(),
        admin_name: "CALA District Office"
      });

      setFeedback({
        type: "success",
        message: res.message || `Case #${complaintId} marked as ${resolutionAction}.`
      });

      setResolvingId(null);
      setResolutionComment("");
      await loadComplaints();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to resolve case."
      });
    } finally {
      setResolveSubmitting(false);
    }
  };

  return (
    <div className="glass" style={{ borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#3a4258", letterSpacing: "0.07em", textTransform: "uppercase" }}>
            Citizen Grievances & Appeals Redressal
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#c4cfe4", marginTop: 2 }}>
            Landowner Grievances & On-Site Verification
          </h2>
        </div>
        <button
          onClick={loadComplaints}
          style={{
            background: "none",
            border: "none",
            color: "#6b7a94",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            fontFamily: "JetBrains Mono, monospace"
          }}
        >
          <RefreshCw style={{ width: 12, height: 12 }} />
          <span>Realtime Sync</span>
        </button>
      </div>

      {feedback && (
        <div style={{
          padding: "10px 14px",
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: feedback.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
          border: `1px solid ${feedback.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(244,63,94,0.3)"}`,
          color: feedback.type === "success" ? "#10b981" : "#f43f5e"
        }}>
          {feedback.type === "success" ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : <AlertTriangle style={{ width: 14, height: 14 }} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: "#6b7a94", fontSize: 12 }}>
          Loading citizen grievances from Supabase single source of truth...
        </div>
      ) : complaints.length === 0 ? (
        <div style={{
          padding: "24px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
          textAlign: "center"
        }}>
          <CheckCircle2 style={{ width: 24, height: 24, color: "#10b981", margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: "#c4cfe4", margin: "0 0 4px" }}>
            No Active Landowner Grievances on This Parcel
          </p>
          <p style={{ fontSize: 11, color: "#6b7a94", margin: 0 }}>
            Any grievance lodged by affected titleholders on the Citizen Portal appears here in real time.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {complaints.map((cmp) => {
            const isResolved = cmp.status === "RESOLVED";
            const isVerified = cmp.status === "VERIFIED";
            const isAssigned = cmp.status === "ASSIGNED_FOR_VERIFICATION";

            return (
              <div
                key={cmp.id}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  background: isResolved ? "rgba(16,185,129,0.03)" : "rgba(255,255,255,0.02)",
                  border: isResolved ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.07)"
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "JetBrains Mono, monospace" }}>
                        {cmp.complaint_id}
                      </span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(245,158,11,0.15)", color: "#fbbf24", fontWeight: 600 }}>
                        {cmp.complaint_type}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: "#8899b4", margin: "4px 0 0" }}>
                      Lodged by: <strong style={{ color: "#fff" }}>{cmp.owner_name}</strong> ({cmp.contact_village}) · {new Date(cmp.submitted_at).toLocaleDateString()}
                    </p>
                  </div>

                  <span style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: 10,
                    fontFamily: "JetBrains Mono, monospace",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    background: isResolved ? "rgba(16,185,129,0.15)" : isVerified ? "rgba(20,184,166,0.15)" : isAssigned ? "rgba(99,102,241,0.15)" : "rgba(245,158,11,0.15)",
                    color: isResolved ? "#10b981" : isVerified ? "#14b8a6" : isAssigned ? "#818cf8" : "#fbbf24",
                    border: `1px solid ${isResolved ? "rgba(16,185,129,0.3)" : isVerified ? "rgba(20,184,166,0.3)" : isAssigned ? "rgba(99,102,241,0.3)" : "rgba(245,158,11,0.3)"}`
                  }}>
                    {cmp.status.replace(/_/g, " ")}
                  </span>
                </div>

                <p style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5, margin: "0 0 12px" }}>
                  {cmp.description}
                </p>

                {/* Assigned Officer Badge */}
                {cmp.assigned_officer && (
                  <div style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    marginBottom: 10,
                    fontSize: 11
                  }}>
                    <div style={{ color: "#818cf8", fontWeight: 600 }}>
                      Assigned Field Officer: {cmp.assigned_officer.officer_name} ({cmp.assigned_officer.officer_id})
                    </div>
                    {cmp.assigned_officer.admin_notes && (
                      <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 2 }}>
                        Directive: {cmp.assigned_officer.admin_notes}
                      </div>
                    )}
                  </div>
                )}

                {/* Ground Verification Box */}
                {cmp.verification && (
                  <div style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "rgba(20,184,166,0.08)",
                    border: "1px solid rgba(20,184,166,0.2)",
                    marginBottom: 10,
                    fontSize: 11
                  }}>
                    <div style={{ color: "#14b8a6", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle2 style={{ width: 12, height: 12 }} /> Ground Verification Findings:
                    </div>
                    <p style={{ color: "#e2e8f0", margin: "4px 0" }}>{cmp.verification.observations}</p>
                    {cmp.verification.gps && (
                      <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "JetBrains Mono, monospace" }}>
                        GPS Verified: {cmp.verification.gps.lat}°, {cmp.verification.gps.lng}° (Accuracy: ±{cmp.verification.gps.accuracy}m)
                      </div>
                    )}
                  </div>
                )}

                {/* Administrative Resolution Box */}
                {cmp.resolution && (
                  <div style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "rgba(16,185,129,0.08)",
                    border: "1px solid rgba(16,185,129,0.25)",
                    marginBottom: 10,
                    fontSize: 11
                  }}>
                    <div style={{ color: "#10b981", fontWeight: 700 }}>
                      Administrative Order ({cmp.resolution.resolution_action}):
                    </div>
                    <p style={{ color: "#f1f5f9", margin: "4px 0" }}>{cmp.resolution.resolution_comment}</p>
                    <div style={{ fontSize: 10, color: "#64748b" }}>
                      Issued by: {cmp.resolution.admin_name} · {new Date(cmp.resolution.resolved_at).toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Action Buttons for Admin */}
                {!isResolved && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    {!cmp.assigned_officer && (
                      <button
                        onClick={() => {
                          setAssigningId(assigningId === cmp.id ? null : cmp.id);
                          setResolvingId(null);
                        }}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          background: "rgba(99,102,241,0.15)",
                          border: "1px solid rgba(99,102,241,0.3)",
                          color: "#818cf8",
                          cursor: "pointer"
                        }}
                      >
                        Assign Field Officer
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setResolvingId(resolvingId === cmp.id ? null : cmp.id);
                        setAssigningId(null);
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background: "rgba(16,185,129,0.15)",
                        border: "1px solid rgba(16,185,129,0.3)",
                        color: "#10b981",
                        cursor: "pointer"
                      }}
                    >
                      Issue Statutory Resolution
                    </button>
                  </div>
                )}

                {/* Assignment Dropdown Drawer */}
                {assigningId === cmp.id && (
                  <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(99,102,241,0.3)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", marginBottom: 8 }}>
                      Assign Field Officer for Site Inspection:
                    </div>
                    <select
                      value={selectedOfficerId}
                      onChange={(e) => setSelectedOfficerId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        background: "#070a14",
                        border: "1px solid #1e293b",
                        color: "#fff",
                        fontSize: 12,
                        marginBottom: 8
                      }}
                    >
                      <option value="OFF-001">Ramesh Patel (Patwari / Revenue Lekhpal - OFF-001)</option>
                      <option value="OFF-002">Anita Sharma (Field Cadastral Surveyor - OFF-002)</option>
                      <option value="OFF-003">Sanjay Verma (Naib Tehsildar - OFF-003)</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Directive notes for officer on ground..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        background: "#070a14",
                        border: "1px solid #1e293b",
                        color: "#fff",
                        fontSize: 12,
                        marginBottom: 8
                      }}
                    />

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleAssign(cmp.complaint_id || cmp.id)}
                        disabled={assignSubmitting}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: "#6366f1",
                          border: "none",
                          color: "#fff",
                          cursor: "pointer"
                        }}
                      >
                        {assignSubmitting ? "Dispatching..." : "Confirm Assignment"}
                      </button>
                      <button
                        onClick={() => setAssigningId(null)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          fontSize: 11,
                          background: "none",
                          border: "1px solid #334155",
                          color: "#94a3b8",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Resolution Drawer */}
                {resolvingId === cmp.id && (
                  <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(16,185,129,0.3)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981", marginBottom: 8 }}>
                      Record Official Redressal Determination:
                    </div>

                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      {(["RESOLVED", "ESCALATED", "REJECTED", "REQUEST_INFO"] as const).map((act) => (
                        <button
                          key={act}
                          onClick={() => setResolutionAction(act)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 10,
                            fontFamily: "JetBrains Mono, monospace",
                            fontWeight: 700,
                            background: resolutionAction === act ? "#10b981" : "rgba(255,255,255,0.05)",
                            color: resolutionAction === act ? "#fff" : "#94a3b8",
                            border: "none",
                            cursor: "pointer"
                          }}
                        >
                          {act}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Statutory order reference, solatium ledger disbursement, or escrow adjustment details..."
                      value={resolutionComment}
                      onChange={(e) => setResolutionComment(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        background: "#070a14",
                        border: "1px solid #1e293b",
                        color: "#fff",
                        fontSize: 12,
                        marginBottom: 8
                      }}
                    />

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleResolve(cmp.complaint_id || cmp.id)}
                        disabled={resolveSubmitting}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: "#10b981",
                          border: "none",
                          color: "#fff",
                          cursor: "pointer"
                        }}
                      >
                        {resolveSubmitting ? "Issuing..." : "Publish Resolution"}
                      </button>
                      <button
                        onClick={() => setResolvingId(null)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          fontSize: 11,
                          background: "none",
                          border: "1px solid #334155",
                          color: "#94a3b8",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                    </div>
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
