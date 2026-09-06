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
  ArrowRight,
  Layers,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { 
  getLandownerComplaints, 
  assignComplaintToOfficer, 
  resolveComplaint,
  getFieldOfficers,
  linkOfficialParcelToComplaint,
  adminDecisionOnComplaint
} from "@/lib/api";
import { useRealtimeComplaints } from "@/lib/supabase/useRealtime";

interface LandownerGrievanceReviewCardProps {
  parcelId?: string;
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
  const [resolutionAction, setResolutionAction] = useState<"RESOLVED" | "ESCALATED" | "REQUEST_VERIFICATION" | "REQUEST_INFO" | "REJECTED">("RESOLVED");
  const [resolutionComment, setResolutionComment] = useState("");
  const [resolveSubmitting, setResolveSubmitting] = useState(false);

  // Linking state
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [targetParcelId, setTargetParcelId] = useState("");
  const [linkSubmitting, setLinkSubmitting] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const filters = (!parcelId || parcelId === "all") ? {} : { parcel_id: parcelId };
      const [cData, oData] = await Promise.all([
        getLandownerComplaints(filters),
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
  useRealtimeComplaints(parcelId || undefined, () => {
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

  const handleDecision = async (complaintId: string) => {
    if (!resolutionComment.trim()) {
      alert("Please enter administrative determination notes or reason.");
      return;
    }

    setResolveSubmitting(true);
    setFeedback(null);
    try {
      const res = await adminDecisionOnComplaint(complaintId, {
        action: resolutionAction,
        comments: resolutionComment.trim(),
        order_reference: `CALA-ORDER-${Date.now().toString().slice(-6)}`,
        admin_name: "CALA District Competent Authority"
      });

      setFeedback({
        type: "success",
        message: res.message || `Case #${complaintId} recorded as ${resolutionAction}.`
      });

      setResolvingId(null);
      setResolutionComment("");
      await loadComplaints();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to record determination."
      });
    } finally {
      setResolveSubmitting(false);
    }
  };

  const handleLinkParcel = async (complaintId: string) => {
    if (!targetParcelId.trim()) {
      alert("Please enter or select the official parcel ID.");
      return;
    }

    setLinkSubmitting(true);
    setFeedback(null);
    try {
      const res = await linkOfficialParcelToComplaint(complaintId, targetParcelId.trim(), "CALA Admin");
      setFeedback({
        type: "success",
        message: res.message || `Linked complaint #${complaintId} to parcel #${targetParcelId}.`
      });
      setLinkingId(null);
      setTargetParcelId("");
      await loadComplaints();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to link parcel."
      });
    } finally {
      setLinkSubmitting(false);
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
          <RefreshCw style={{ width: 12, height: 12, animation: loading ? "spin 1s linear infinite" : "none" }} />
          <span>Sync</span>
        </button>
      </div>

      {feedback && (
        <div style={{
          padding: "10px 14px",
          borderRadius: 8,
          marginBottom: 14,
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: feedback.type === "success" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
          border: `1px solid ${feedback.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
          color: feedback.type === "success" ? "#10b981" : "#ef4444"
        }}>
          {feedback.type === "success" ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : <AlertTriangle style={{ width: 14, height: 14 }} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "30px 0", textAlign: "center", color: "#6b7a94", fontSize: 12 }}>
          <RefreshCw style={{ width: 18, height: 18, margin: "0 auto 8px", animation: "spin 1s linear infinite", color: "#10b981" }} />
          <span>Querying Grievance Registry...</span>
        </div>
      ) : complaints.length === 0 ? (
        <div style={{
          padding: "24px 16px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.015)",
          border: "1px dashed rgba(255,255,255,0.08)",
          textAlign: "center"
        }}>
          <CheckCircle2 style={{ width: 24, height: 24, color: "#10b981", margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: "#c4cfe4", margin: "0 0 4px" }}>
            No Active Landowner Grievances
          </p>
          <p style={{ fontSize: 11, color: "#6b7a94", margin: 0 }}>
            Any grievance lodged by affected titleholders or unregistered claimants on the Citizen Portal appears here in real time.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {complaints.map((cmp) => {
            const status = cmp.status || "SUBMITTED";
            const isResolved = status === "RESOLVED";
            const isRejected = status === "REJECTED";
            const isVerified = status.includes("VERIFIED") && !status.includes("AWAITING");
            const isAssigned = status.includes("SITE VISIT") || status.includes("ASSIGNED");
            const isUnregistered = !cmp.parcel_id || cmp.parcel_id === "null";
            const isDemo = cmp.is_demo_simulation;

            return (
              <div
                key={cmp.id}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  background: isResolved ? "rgba(16,185,129,0.03)" : isRejected ? "rgba(239,68,68,0.03)" : "rgba(255,255,255,0.02)",
                  border: isResolved ? "1px solid rgba(16,185,129,0.2)" : isRejected ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.07)"
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "JetBrains Mono, monospace" }}>
                        {cmp.complaint_id}
                      </span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(245,158,11,0.15)", color: "#fbbf24", fontWeight: 600 }}>
                        {cmp.complaint_type}
                      </span>
                      {isUnregistered && (
                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(245,158,11,0.2)", color: "#f59e0b", fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
                          UNREGISTERED CLAIM
                        </span>
                      )}
                      {isDemo && (
                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(168,85,247,0.2)", color: "#c084fc", fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
                          DEMO SIMULATION
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: "#8899b4", margin: "4px 0 0" }}>
                      Lodged by: <strong style={{ color: "#fff" }}>{cmp.owner_name}</strong> ({cmp.contact_village}) · {new Date(cmp.submitted_at).toLocaleDateString()}
                      {cmp.parcel_id ? ` · Parcel: #${cmp.parcel_id}` : " · No Parcel Linked"}
                    </p>
                  </div>

                  <span style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: 10,
                    fontFamily: "JetBrains Mono, monospace",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    background: isResolved ? "rgba(16,185,129,0.15)" : isRejected ? "rgba(239,68,68,0.15)" : isVerified ? "rgba(20,184,166,0.15)" : isAssigned ? "rgba(99,102,241,0.15)" : "rgba(245,158,11,0.15)",
                    color: isResolved ? "#10b981" : isRejected ? "#ef4444" : isVerified ? "#14b8a6" : isAssigned ? "#818cf8" : "#fbbf24",
                    border: `1px solid ${isResolved ? "rgba(16,185,129,0.3)" : isRejected ? "rgba(239,68,68,0.3)" : isVerified ? "rgba(20,184,166,0.3)" : isAssigned ? "rgba(99,102,241,0.3)" : "rgba(245,158,11,0.3)"}`
                  }}>
                    {status.replace(/_/g, " ")}
                  </span>
                </div>

                <p style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5, margin: "0 0 10px" }}>
                  {cmp.description}
                </p>

                {/* Citizen GPS & Document Evidence Metadata */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {(cmp.landowner_reported_location || cmp.gps) && (
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 8px",
                      borderRadius: 6,
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.2)",
                      fontSize: 10,
                      fontFamily: "JetBrains Mono, monospace",
                      color: "#fbbf24"
                    }}>
                      <MapPin style={{ width: 11, height: 11 }} />
                      <span>GPS: {(cmp.landowner_reported_location?.lat || cmp.gps?.lat)}°, {(cmp.landowner_reported_location?.lng || cmp.gps?.lng)}° (±{(cmp.landowner_reported_location?.accuracy || cmp.gps?.accuracy)}m)</span>
                    </div>
                  )}

                  {cmp.landowner_declared_area && (
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 8px",
                      borderRadius: 6,
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.2)",
                      fontSize: 10,
                      fontFamily: "JetBrains Mono, monospace",
                      color: "#fbbf24"
                    }}>
                      <span>Area Claim: {cmp.landowner_declared_area.acres || (cmp.landowner_declared_area.sqm * 0.000247105).toFixed(4)} acres (LANDOWNER-REPORTED / ESTIMATED)</span>
                    </div>
                  )}

                  {cmp.document_evidence && (
                    <a
                      href={cmp.document_evidence.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "4px 8px",
                        borderRadius: 6,
                        background: "rgba(56,189,248,0.08)",
                        border: "1px solid rgba(56,189,248,0.25)",
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#38bdf8",
                        textDecoration: "none"
                      }}
                    >
                      <FileText style={{ width: 11, height: 11 }} />
                      <span>Evidence: {cmp.document_evidence.file_name} (LANDOWNER-SUBMITTED / UNVERIFIED) ↗</span>
                    </a>
                  )}
                </div>

                {/* Ground Verification Box (if performed) */}
                {(cmp.field_verification || cmp.verification) && (
                  <div style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "rgba(20,184,166,0.08)",
                    border: "1px solid rgba(20,184,166,0.2)",
                    marginBottom: 10,
                    fontSize: 11
                  }}>
                    <div style={{ color: "#14b8a6", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                      <ShieldCheck style={{ width: 12, height: 12 }} /> Field Ground Verification ({(cmp.field_verification || cmp.verification).verification_status || "VERIFIED"}):
                    </div>
                    <p style={{ color: "#e2e8f0", margin: "4px 0" }}>{(cmp.field_verification || cmp.verification).observations}</p>
                    {(cmp.field_verification || cmp.verification).field_verified_area && (
                      <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "JetBrains Mono, monospace" }}>
                        Field Area: {(cmp.field_verification || cmp.verification).field_verified_area.acres || ((cmp.field_verification || cmp.verification).field_verified_area.sqm * 0.000247105).toFixed(4)} acres
                        ({(cmp.field_verification || cmp.verification).field_verified_area.sqm} m²)
                      </div>
                    )}
                  </div>
                )}

                {/* Administrative Determination Box */}
                {(cmp.resolution || cmp.admin_decision) && (
                  <div style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "rgba(16,185,129,0.08)",
                    border: "1px solid rgba(16,185,129,0.25)",
                    marginBottom: 10,
                    fontSize: 11
                  }}>
                    <div style={{ color: "#10b981", fontWeight: 700 }}>
                      Administrative Determination ({(cmp.admin_decision?.action || cmp.resolution?.resolution_action)}):
                    </div>
                    <p style={{ color: "#f1f5f9", margin: "4px 0" }}>{(cmp.admin_decision?.comments || cmp.resolution?.resolution_comment)}</p>
                    <div style={{ fontSize: 10, color: "#64748b" }}>
                      Issued by: {(cmp.admin_decision?.admin_name || cmp.resolution?.admin_name)} · Ref: {(cmp.admin_decision?.order_reference || "STATUTORY-ORDER")}
                    </div>
                  </div>
                )}

                {/* Action Buttons for Admin */}
                {!isResolved && !isRejected && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    {!cmp.assigned_officer && (
                      <button
                        onClick={() => {
                          setAssigningId(assigningId === cmp.id ? null : cmp.id);
                          setResolvingId(null);
                          setLinkingId(null);
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
                        Assign / Reassign Officer
                      </button>
                    )}

                    {isUnregistered && (
                      <button
                        onClick={() => {
                          setLinkingId(linkingId === cmp.id ? null : cmp.id);
                          setResolvingId(null);
                          setAssigningId(null);
                        }}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          background: "rgba(245,158,11,0.15)",
                          border: "1px solid rgba(245,158,11,0.3)",
                          color: "#fbbf24",
                          cursor: "pointer"
                        }}
                      >
                        Link Official Parcel
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setResolvingId(resolvingId === cmp.id ? null : cmp.id);
                        setAssigningId(null);
                        setLinkingId(null);
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
                      Admin Decision & Redressal
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

                {/* Link Parcel Drawer */}
                {linkingId === cmp.id && (
                  <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(245,158,11,0.3)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", marginBottom: 8 }}>
                      Link Official Cadastral Parcel to Claim:
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. PAR-003, P-102, Survey 88/1..."
                      value={targetParcelId}
                      onChange={(e) => setTargetParcelId(e.target.value)}
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
                        onClick={() => handleLinkParcel(cmp.complaint_id || cmp.id)}
                        disabled={linkSubmitting}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: "#f59e0b",
                          border: "none",
                          color: "#000",
                          cursor: "pointer"
                        }}
                      >
                        {linkSubmitting ? "Linking..." : "Confirm Parcel Link"}
                      </button>
                      <button
                        onClick={() => setLinkingId(null)}
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

                {/* Resolution / Admin Decision Drawer */}
                {resolvingId === cmp.id && (
                  <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(16,185,129,0.3)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981", marginBottom: 8 }}>
                      Record Official Redressal Determination:
                    </div>

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                      {(["RESOLVED", "ESCALATED", "REQUEST_VERIFICATION", "REQUEST_INFO", "REJECTED"] as const).map((act) => (
                        <button
                          key={act}
                          onClick={() => setResolutionAction(act)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 10,
                            fontFamily: "JetBrains Mono, monospace",
                            fontWeight: 700,
                            background: resolutionAction === act ? (act === "REJECTED" ? "#ef4444" : "#10b981") : "rgba(255,255,255,0.05)",
                            color: resolutionAction === act ? "#fff" : "#94a3b8",
                            border: "none",
                            cursor: "pointer"
                          }}
                        >
                          {act.replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={2}
                      placeholder={resolutionAction === "REJECTED" ? "Reason for rejection under statutory rules..." : "Statutory order reference, ground observations, or escrow adjustment..."}
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
                        onClick={() => handleDecision(cmp.complaint_id || cmp.id)}
                        disabled={resolveSubmitting}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: resolutionAction === "REJECTED" ? "#ef4444" : "#10b981",
                          border: "none",
                          color: "#fff",
                          cursor: "pointer"
                        }}
                      >
                        {resolveSubmitting ? "Recording..." : `Publish ${resolutionAction.replace(/_/g, " ")}`}
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
