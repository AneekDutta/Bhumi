"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  FileText, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
  User, 
  ArrowRight, 
  Layers, 
  ExternalLink,
  Briefcase,
  Sparkles,
  FileCheck2,
  XCircle,
  IndianRupee,
  Scale,
  Download,
  Check
} from "lucide-react";
import { 
  getLandownerComplaints, 
  adminInitiateImplementation,
  adminCompleteImplementation,
  saveComplaintSimulation,
  resolveComplaintWithNotice
} from "@/lib/api";
import { useRealtimeComplaints } from "@/lib/supabase/useRealtime";
import { AdminParcelWhatIfModal } from "@/components/simulator/AdminParcelWhatIfModal";
import { CaseReportModal } from "@/components/documents/CaseReportModal";
import { 
  generateCaseReportPdf, 
  generateLandownerNoticePdf,
  buildCaseReportData,
  buildLandownerNoticeData 
} from "@/lib/pdf/caseReportPdfGenerator";

interface LandownerGrievanceReviewCardProps {
  parcelId?: string;
  projectId?: string;
  selectedParcelId?: string | null;
  onSelectParcel?: (parcel: any) => void;
}

export function LandownerGrievanceReviewCard({ 
  parcelId, 
  selectedParcelId,
  onSelectParcel 
}: LandownerGrievanceReviewCardProps) {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulation modal state
  const [simulatingComplaint, setSimulatingComplaint] = useState<any | null>(null);

  // Detailed case report modal state
  const [selectedReportComplaint, setSelectedReportComplaint] = useState<any | null>(null);

  // Resolve matter state
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [resolveSubmitting, setResolveSubmitting] = useState(false);

  // Implementation initiation state
  const [initiatingId, setInitiatingId] = useState<string | null>(null);
  const [orderRef, setOrderRef] = useState("");
  const [initiateNotes, setInitiateNotes] = useState("");
  const [initiateSubmitting, setInitiateSubmitting] = useState(false);

  // Implementation completion state
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completeNotes, setCompleteNotes] = useState("");
  const [statutoryAssessed, setStatutoryAssessed] = useState<number>(0);
  const [statutoryPaid, setStatutoryPaid] = useState<number>(0);
  const [statutoryAcqAcres, setStatutoryAcqAcres] = useState<number>(0);
  const [statutoryPossession, setStatutoryPossession] = useState<string>("Possession Handed Over");
  const [statutoryFamilies, setStatutoryFamilies] = useState<number>(1);
  const [statutoryRandr, setStatutoryRandr] = useState<string>("Entitlements Disbursed");
  const [completeSubmitting, setCompleteSubmitting] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const filters = (!parcelId || parcelId === "all") ? {} : { parcel_id: parcelId };
      const cData = await getLandownerComplaints(filters);
      setComplaints(cData || []);
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [parcelId]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  // Realtime synchronization
  useRealtimeComplaints(parcelId || undefined, () => {
    loadComplaints();
  });

  // STRICT FILTER: Admin Implementation Queue ONLY admits complaints that have been verified by Field Officer
  const verifiedComplaints = complaints.filter((c) => {
    const s = c.status || "";
    return (
      s === "Verified by Field Officer" ||
      s === "Field Verified" ||
      s === "Implementation Initiated" ||
      s === "Implementation Completed" ||
      s === "RESOLVED"
    );
  });

  const handleInitiate = async (complaintId: string, customNotes?: string) => {
    const notesToUse = customNotes || initiateNotes.trim();
    if (!notesToUse) {
      alert("Please enter administrative directives or implementation instructions.");
      return;
    }

    setInitiateSubmitting(true);
    setFeedback(null);
    try {
      const ref = orderRef.trim() || `CALA-IMP-${Date.now().toString().slice(-6)}`;
      const res = await adminInitiateImplementation(
        complaintId,
        "CALA District Competent Authority",
        notesToUse,
        ref
      );

      setFeedback({
        type: "success",
        message: res.message || `Implementation initiated for Case #${complaintId}.`
      });

      setInitiatingId(null);
      setOrderRef("");
      setInitiateNotes("");
      await loadComplaints();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to initiate implementation."
      });
    } finally {
      setInitiateSubmitting(false);
    }
  };

  const handleComplete = async (complaintId: string, defaultAcres: number = 0) => {
    if (!completeNotes.trim()) {
      alert("Please enter final redressal notes, compensation disbursement, or revenue record update details.");
      return;
    }

    setCompleteSubmitting(true);
    setFeedback(null);
    try {
      const acres = statutoryAcqAcres > 0 ? statutoryAcqAcres : defaultAcres;
      const assessed = statutoryAssessed > 0 ? statutoryAssessed : Math.round(acres * 1850000 * 2.24);
      const paid = statutoryPaid > 0 ? statutoryPaid : assessed;

      const statData = {
        compensation_assessed: assessed,
        compensation_paid: paid,
        area_acquired_acres: acres,
        possession_status: statutoryPossession || "Possession Handed Over",
        affected_families: statutoryFamilies || 1,
        randr_status: statutoryRandr || "Entitlements Disbursed"
      };

      const res = await adminCompleteImplementation(
        complaintId,
        "CALA District Competent Authority",
        completeNotes.trim(),
        statData
      );

      setFeedback({
        type: "success",
        message: res.message || `Implementation completed for Case #${complaintId}. Statutory record finalized.`
      });

      setCompletingId(null);
      setCompleteNotes("");
      await loadComplaints();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to complete implementation."
      });
    } finally {
      setCompleteSubmitting(false);
    }
  };

  const handleSaveSimulation = async (simData: any) => {
    if (!simulatingComplaint) return;
    const cId = simulatingComplaint.complaint_id || simulatingComplaint.id;
    try {
      const res = await saveComplaintSimulation(cId, simData);
      setFeedback({
        type: "success",
        message: `What-If Simulation attached to Case #${cId} (ID: ${res.simulation_id}). Detailed statutory report generated.`
      });
      setSimulatingComplaint(null);
      await loadComplaints();
      const updated = { ...simulatingComplaint, what_if_simulation: res.simulation };
      setSelectedReportComplaint(updated);
    } catch (err: any) {
      alert(err?.message || "Failed to attach simulation to case.");
    }
  };

  const handleResolveMatter = async (complaintId: string, customNotes?: string) => {
    const notes = customNotes || resolveNotes.trim();
    if (!notes) {
      alert("Please enter final statutory resolution directives and order details.");
      return;
    }

    setResolveSubmitting(true);
    setFeedback(null);
    try {
      const res = await resolveComplaintWithNotice(complaintId, {
        admin_name: "S. K. Verma, IAS",
        admin_role: "Competent Authority for Land Acquisition (CALA)",
        resolution_notes: notes,
        statutory_directives: "Sanctioned boundary rectification and compensation adjustment under RFCTLARR Act 2013 First Schedule."
      });

      setFeedback({
        type: "success",
        message: `Case #${complaintId} successfully resolved. Statutory Notice generated: ${res.notice_reference}`
      });

      setResolvingId(null);
      setResolveNotes("");
      setSelectedReportComplaint(null);
      await loadComplaints();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to resolve matter."
      });
    } finally {
      setResolveSubmitting(false);
    }
  };

  return (
    <div className="glass" style={{ borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#64748b", letterSpacing: "0.07em", textTransform: "uppercase" }}>
            CALA Command Operations &bull; Authoritative Records
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#c4cfe4", marginTop: 2 }}>
            Admin Implementation Queue &amp; Redressal Directives
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
          <span>Refresh</span>
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
          <span>Loading verified complaints queue...</span>
        </div>
      ) : verifiedComplaints.length === 0 ? (
        /* Empty State */
        <div style={{
          padding: "36px 16px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.015)",
          border: "1px dashed rgba(255,255,255,0.1)",
          textAlign: "center"
        }}>
          <CheckCircle2 style={{ width: 32, height: 32, color: "#10b981", margin: "0 auto 10px" }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", margin: "0 0 6px" }}>
            No landowner grievances available.
          </p>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0, maxWidth: 460, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
            Complaints submitted by landowners and verified by the Field Officer will appear here for administrative review, statutory What-If simulation, and implementation orders.
          </p>
        </div>
      ) : (
        /* Verified Implementation Queue */
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {verifiedComplaints.map((cmp) => {
            const status = cmp.status || "Verified by Field Officer";
            const isVerifiedPending = status === "Verified by Field Officer" || status === "Field Verified";
            const isInitiated = status === "Implementation Initiated";
            const isCompleted = status === "Implementation Completed" || status === "RESOLVED";
            const parcelId = cmp.parcel_id || "N/A";
            const isSelected = selectedParcelId === cmp.id || selectedParcelId === cmp.parcel_id;
            const docs = cmp.landowner_documents || (cmp.document_evidence ? [cmp.document_evidence] : []);

            // Real geometry attributes
            const areaAcres = cmp.landowner_declared_area?.acres || (cmp.area_sqm ? (cmp.area_sqm / 4046.86).toFixed(3) : 0);
            const areaSqm = cmp.landowner_declared_area?.sqm || cmp.area_sqm || 0;

            return (
              <div
                key={cmp.id}
                id={`complaint-card-${cmp.id}`}
                style={{
                  padding: 18,
                  borderRadius: 12,
                  background: isCompleted ? "rgba(16,185,129,0.03)" : isInitiated ? "rgba(99,102,241,0.04)" : "rgba(245,158,11,0.04)",
                  border: isSelected 
                    ? "2px solid #f59e0b" 
                    : isCompleted 
                      ? "1px solid rgba(16,185,129,0.25)" 
                      : isInitiated 
                        ? "1px solid rgba(99,102,241,0.3)" 
                        : "1px solid rgba(245,158,11,0.3)",
                  transition: "all 0.2s ease"
                }}
              >
                {/* Status Bar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: "JetBrains Mono, monospace",
                      background: isCompleted ? "rgba(16,185,129,0.15)" : isInitiated ? "rgba(99,102,241,0.15)" : "rgba(245,158,11,0.15)",
                      color: isCompleted ? "#10b981" : isInitiated ? "#818cf8" : "#f59e0b",
                      border: `1px solid ${isCompleted ? "rgba(16,185,129,0.3)" : isInitiated ? "rgba(99,102,241,0.3)" : "rgba(245,158,11,0.3)"}`
                    }}>
                      {status.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                      Case #{cmp.complaint_id || cmp.id}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b", fontFamily: "JetBrains Mono, monospace" }}>
                    <Clock style={{ width: 12, height: 12 }} />
                    <span suppressHydrationWarning>{cmp.submitted_at ? new Date(cmp.submitted_at).toLocaleDateString() : "Verified"}</span>
                  </div>
                </div>

                {/* Primary Demarcation Summary Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 14 }}>
                  <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontFamily: "JetBrains Mono, monospace" }}>14-Digit Parcel ID</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#818cf8", fontFamily: "JetBrains Mono, monospace", marginTop: 2 }}>
                      {parcelId}
                    </div>
                  </div>

                  <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontFamily: "JetBrains Mono, monospace" }}>Verified Landowner</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginTop: 2 }}>
                      {cmp.owner_name || "Landowner"}
                    </div>
                  </div>

                  <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontFamily: "JetBrains Mono, monospace" }}>Cadastral Demarcation</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981", fontFamily: "JetBrains Mono, monospace", marginTop: 2 }}>
                      {areaAcres} Acres ({Number(areaSqm).toLocaleString()} m²)
                    </div>
                  </div>

                  <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontFamily: "JetBrains Mono, monospace" }}>Operational Sector</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginTop: 2 }}>
                      {cmp.contact_village || cmp.village || "Corridor Sector"}
                    </div>
                  </div>
                </div>

                {/* Grievance Description */}
                <div style={{ marginBottom: 12, fontSize: 12, color: "#94a3b8", background: "rgba(0,0,0,0.2)", padding: "10px 12px", borderRadius: 8 }}>
                  <strong style={{ color: "#e2e8f0" }}>Grievance Claim: </strong>
                  {cmp.description || cmp.complaint_type || "Boundary demarcation adjustment claim against cadastral survey."}
                </div>

                {/* Field Officer Ground Verification Banner */}
                {cmp.field_verification && (
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    marginBottom: 14,
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.25)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#818cf8", marginBottom: 4 }}>
                      <ShieldCheck style={{ width: 14, height: 14 }} />
                      <span>FIELD VERIFICATION ACCORD &bull; Verified by {cmp.field_verification.officer_name || "Ramesh Patel (Patwari)"}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#c4cfe4" }}>
                      &ldquo;{cmp.field_verification.notes}&rdquo;
                    </div>
                  </div>
                )}

                {/* Attached What-If Simulation Badge */}
                {(cmp.what_if_simulation || cmp.simulation_record) && (
                  <div style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    marginBottom: 12,
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 8
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#818cf8" }}>
                      <Sparkles style={{ width: 13, height: 13 }} />
                      <span>SIMULATION ATTACHED: {(cmp.what_if_simulation || cmp.simulation_record).simulation_id || "SIM-RFCTLARR"}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#cbd5e1", fontFamily: "JetBrains Mono, monospace" }}>
                      Statutory Award: ₹{Number((cmp.what_if_simulation || cmp.simulation_record).simulated?.award_breakdown?.total_statutory_award || 4850000).toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Administrative Actions Strip */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  
                  {/* Action 1: What-If Simulation */}
                  <button
                    onClick={() => setSimulatingComplaint(cmp)}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      background: "rgba(99,102,241,0.15)",
                      border: "1px solid rgba(99,102,241,0.4)",
                      color: "#818cf8",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <Sparkles style={{ width: 13, height: 13, color: "#818cf8" }} />
                    <span>Run What-If Simulation</span>
                  </button>

                  {/* Action 2: Detailed What-If Case Report & PDF */}
                  <button
                    onClick={() => setSelectedReportComplaint(cmp)}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      background: "rgba(16,185,129,0.12)",
                      border: "1px solid rgba(16,185,129,0.35)",
                      color: "#10b981",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <FileText style={{ width: 13, height: 13, color: "#10b981" }} />
                    <span>Detailed Case Report &amp; PDF</span>
                  </button>

                  {/* Action 3: Resolve Matter (Statutory Finality) */}
                  {!isCompleted && (
                    <button
                      onClick={() => {
                        setResolvingId(resolvingId === cmp.id ? null : cmp.id);
                        setInitiatingId(null);
                        setCompletingId(null);
                      }}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                        border: "none",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <Scale style={{ width: 13, height: 13 }} />
                      <span>Resolve Matter</span>
                    </button>
                  )}

                  {/* Action 4: Initiate Implementation */}
                  {isVerifiedPending && (
                    <button
                      onClick={() => {
                        setInitiatingId(initiatingId === cmp.id ? null : cmp.id);
                        setCompletingId(null);
                        setResolvingId(null);
                      }}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        background: "#6366f1",
                        border: "none",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <Briefcase style={{ width: 13, height: 13 }} />
                      <span>Initiate Implementation</span>
                    </button>
                  )}

                  {/* Action 5: Complete Implementation */}
                  {isInitiated && (
                    <button
                      onClick={() => {
                        setCompletingId(completingId === cmp.id ? null : cmp.id);
                        setInitiatingId(null);
                        setResolvingId(null);
                        setStatutoryAcqAcres(Number(areaAcres));
                        setStatutoryAssessed(Math.round(Number(areaAcres) * 1850000 * 2.24));
                        setStatutoryPaid(Math.round(Number(areaAcres) * 1850000 * 2.24));
                      }}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        background: "#10b981",
                        border: "none",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <CheckCircle2 style={{ width: 13, height: 13 }} />
                      <span>Complete Implementation</span>
                    </button>
                  )}

                  {/* Completed Badge */}
                  {isCompleted && (
                    <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle2 style={{ width: 13, height: 13 }} />
                      Statutory resolution completed &amp; recorded.
                    </span>
                  )}
                </div>

                {/* Initiate Implementation Drawer */}
                {initiatingId === cmp.id && (
                  <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(99,102,241,0.4)" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", marginBottom: 8 }}>
                      Issue Administrative Implementation Order:
                    </div>

                    <input
                      type="text"
                      placeholder="Administrative Order Reference (e.g. CALA-ORDER-2026-081)..."
                      value={orderRef}
                      onChange={(e) => setOrderRef(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: "#070a14",
                        border: "1px solid #1e293b",
                        color: "#fff",
                        fontSize: 12,
                        marginBottom: 8,
                        fontFamily: "JetBrains Mono, monospace"
                      }}
                    />

                    <textarea
                      rows={2}
                      placeholder="Enter specific implementation directives (e.g., sanction boundary adjustment, order PFMS compensation calculation)..."
                      value={initiateNotes}
                      onChange={(e) => setInitiateNotes(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
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
                        onClick={() => handleInitiate(cmp.complaint_id || cmp.id)}
                        disabled={initiateSubmitting}
                        style={{
                          padding: "7px 16px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: "#6366f1",
                          border: "none",
                          color: "#fff",
                          cursor: "pointer"
                        }}
                      >
                        {initiateSubmitting ? "Initiating..." : "Confirm & Initiate Implementation"}
                      </button>
                      <button
                        onClick={() => setInitiatingId(null)}
                        style={{
                          padding: "7px 12px",
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

                {/* Complete Implementation Drawer with Statutory Parameters */}
                {completingId === cmp.id && (
                  <div style={{ marginTop: 12, padding: 16, borderRadius: 10, background: "rgba(0,0,0,0.45)", border: "1px solid rgba(16,185,129,0.4)", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>
                      Finalize Statutory Acquisition Record:
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 10, color: "#94a3b8", fontFamily: "JetBrains Mono, monospace", display: "block", marginBottom: 4 }}>
                          Area Acquired (Acres)
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={statutoryAcqAcres}
                          onChange={(e) => setStatutoryAcqAcres(Number(e.target.value))}
                          style={{ width: "100%", padding: "6px 10px", borderRadius: 6, background: "#070a14", border: "1px solid #1e293b", color: "#fff", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 10, color: "#94a3b8", fontFamily: "JetBrains Mono, monospace", display: "block", marginBottom: 4 }}>
                          Compensation Assessed (₹)
                        </label>
                        <input
                          type="number"
                          value={statutoryAssessed}
                          onChange={(e) => setStatutoryAssessed(Number(e.target.value))}
                          style={{ width: "100%", padding: "6px 10px", borderRadius: 6, background: "#070a14", border: "1px solid #1e293b", color: "#fff", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 10, color: "#94a3b8", fontFamily: "JetBrains Mono, monospace", display: "block", marginBottom: 4 }}>
                          Compensation Paid (₹)
                        </label>
                        <input
                          type="number"
                          value={statutoryPaid}
                          onChange={(e) => setStatutoryPaid(Number(e.target.value))}
                          style={{ width: "100%", padding: "6px 10px", borderRadius: 6, background: "#070a14", border: "1px solid #1e293b", color: "#fff", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 10, color: "#94a3b8", fontFamily: "JetBrains Mono, monospace", display: "block", marginBottom: 4 }}>
                          Possession Status
                        </label>
                        <select
                          value={statutoryPossession}
                          onChange={(e) => setStatutoryPossession(e.target.value)}
                          style={{ width: "100%", padding: "6px 10px", borderRadius: 6, background: "#070a14", border: "1px solid #1e293b", color: "#fff", fontSize: 12 }}
                        >
                          <option value="Possession Handed Over">Possession Handed Over</option>
                          <option value="Physical Possession Complete">Physical Possession Complete</option>
                          <option value="Right-of-Way Cleared">Right-of-Way Cleared</option>
                        </select>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Enter final resolution directives and revenue mutation reference..."
                      value={completeNotes}
                      onChange={(e) => setCompleteNotes(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: "#070a14",
                        border: "1px solid #1e293b",
                        color: "#fff",
                        fontSize: 12
                      }}
                    />

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleComplete(cmp.complaint_id || cmp.id, Number(areaAcres))}
                        disabled={completeSubmitting}
                        style={{
                          padding: "7px 16px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: "#10b981",
                          border: "none",
                          color: "#fff",
                          cursor: "pointer"
                        }}
                      >
                        {completeSubmitting ? "Finalizing Order..." : "Finalize Acquisition &amp; Close Case"}
                      </button>
                      <button
                        onClick={() => setCompletingId(null)}
                        style={{
                          padding: "7px 12px",
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

                {/* Resolve Matter Drawer */}
                {resolvingId === cmp.id && (
                  <div style={{ marginTop: 12, padding: 16, borderRadius: 10, background: "rgba(0,0,0,0.45)", border: "1px solid rgba(16,185,129,0.4)", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", display: "flex", alignItems: "center", gap: 6 }}>
                      <Scale style={{ width: 14, height: 14 }} />
                      <span>Issue Statutory Resolution &amp; Formal Notice (RFCTLARR Act 2013):</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                      Resolving this matter will finalize the administrative record, issue an official notice with a unique statutory reference number to the citizen landowner, and archive the counterfactual simulation.
                    </p>

                    <textarea
                      rows={3}
                      placeholder="Enter final administrative determination, boundary rectification findings, and compensation sanction details..."
                      value={resolveNotes}
                      onChange={(e) => setResolveNotes(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: "#070a14",
                        border: "1px solid #1e293b",
                        color: "#fff",
                        fontSize: 12
                      }}
                    />

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleResolveMatter(cmp.complaint_id || cmp.id)}
                        disabled={resolveSubmitting}
                        style={{
                          padding: "7px 16px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                          border: "none",
                          color: "#fff",
                          cursor: "pointer"
                        }}
                      >
                        {resolveSubmitting ? "Issuing Statutory Determination..." : "Confirm Resolution & Issue Notice"}
                      </button>
                      <button
                        onClick={() => setResolvingId(null)}
                        style={{
                          padding: "7px 12px",
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

                {/* Resolved Case Banner & Direct PDF Downloads */}
                {isCompleted && (
                  <div style={{
                    marginTop: 14,
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: "rgba(16,185,129,0.06)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#10b981" }}>
                        <CheckCircle2 style={{ width: 16, height: 16 }} />
                        <span>MATTER RESOLVED &bull; STATUTORY NOTICE ISSUED</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "JetBrains Mono, monospace", marginTop: 2 }}>
                        Notice Ref: <strong style={{ color: "#f59e0b" }}>{cmp.notice_reference || cmp.resolution_notice?.notice_reference || `CALA/NOTICE/2026/${String(cmp.complaint_id || cmp.id || "101").slice(-4)}`}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        onClick={() => generateLandownerNoticePdf(buildLandownerNoticeData(cmp))}
                        style={{
                          padding: "7px 12px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: "rgba(245,158,11,0.15)",
                          border: "1px solid rgba(245,158,11,0.4)",
                          color: "#f59e0b",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 5
                        }}
                        title="Download Official Statutory Resolution Notice (PDF)"
                      >
                        <Download style={{ width: 12, height: 12 }} />
                        <span>Notice (PDF)</span>
                      </button>

                      <button
                        onClick={() => generateCaseReportPdf(buildCaseReportData(cmp))}
                        style={{
                          padding: "7px 12px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: "rgba(99,102,241,0.15)",
                          border: "1px solid rgba(99,102,241,0.4)",
                          color: "#818cf8",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 5
                        }}
                        title="Download Complete Case Report (PDF)"
                      >
                        <Download style={{ width: 12, height: 12 }} />
                        <span>Case File (PDF)</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Counterfactual What-If Simulation Modal */}
      {simulatingComplaint && (
        <AdminParcelWhatIfModal
          complaint={simulatingComplaint}
          onClose={() => setSimulatingComplaint(null)}
          onInitiate={(cId, notes) => {
            handleInitiate(cId, notes);
          }}
          onSaveSimulation={handleSaveSimulation}
        />
      )}

      {/* Detailed What-If Case Report Modal (Sections A-G) */}
      {selectedReportComplaint && (
        <CaseReportModal
          isOpen={!!selectedReportComplaint}
          onClose={() => setSelectedReportComplaint(null)}
          reportData={buildCaseReportData(selectedReportComplaint)}
          isResolved={selectedReportComplaint.status === "RESOLVED" || selectedReportComplaint.status === "Implementation Completed"}
          onResolve={() => {
            setResolvingId(selectedReportComplaint.complaint_id || selectedReportComplaint.id);
          }}
        />
      )}
    </div>
  );
}
