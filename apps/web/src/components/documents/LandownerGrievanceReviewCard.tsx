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
    <div className="bg-white dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-5 mb-6 shadow-sm transition-colors">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <div className="text-[10px] font-mono text-[#64748B] dark:text-slate-400 tracking-wider uppercase font-semibold">
            CALA Command Operations &bull; Authoritative Records
          </div>
          <h2 className="text-sm font-bold text-[#14213D] dark:text-[#F0F4FF] mt-0.5">
            Admin Implementation Queue &amp; Redressal Directives
          </h2>
        </div>
        <button
          onClick={loadComplaints}
          className="bg-transparent border-0 text-[#0B5FA5] dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1.5 text-xs font-mono font-semibold"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-2.5 rounded-[3px] mb-3 text-xs flex items-center gap-2 ${
          feedback.type === "success"
            ? "bg-[#EBF7EE] dark:bg-emerald-950/40 border border-[#BEE3C8] dark:border-emerald-800 text-[#1E7E34] dark:text-emerald-300"
            : "bg-[#FDF0F0] dark:bg-rose-950/40 border border-[#F8C8C8] dark:border-rose-800 text-[#B32424] dark:text-rose-300"
        }`}>
          {feedback.type === "success" ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-[#64748B] dark:text-slate-400 text-xs space-y-2">
          <RefreshCw className="w-4 h-4 mx-auto animate-spin text-[#0B5FA5] dark:text-sky-400" />
          <span>Loading verified complaints queue...</span>
        </div>
      ) : verifiedComplaints.length === 0 ? (
        /* Empty State */
        <div className="p-8 rounded-[4px] bg-[#F8FAFC] dark:bg-[#0B1220] border border-dashed border-[#CBD5E1] dark:border-slate-800 text-center">
          <CheckCircle2 className="w-8 h-8 text-[#1E7E34] dark:text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-[#14213D] dark:text-[#F0F4FF] mb-1">
            No landowner grievances available.
          </p>
          <p className="text-xs text-[#64748B] dark:text-slate-400 m-0 max-w-md mx-auto leading-relaxed">
            Complaints submitted by landowners and verified by the Field Officer will appear here for administrative review, statutory What-If simulation, and implementation orders.
          </p>
        </div>
      ) : (
        /* Verified Implementation Queue */
        <div className="space-y-3.5">
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
                className={`p-4 rounded-[4px] transition-all border ${
                  isSelected
                    ? "border-[#0B5FA5] ring-2 ring-[#0B5FA5]/20 bg-white dark:bg-[#0B1220]"
                    : "bg-[#F8FAFC] dark:bg-[#0B1220] border-[#DCE2E8] dark:border-white/10"
                }`}
              >
                {/* Status Bar */}
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] border ${
                      isCompleted
                        ? "bg-[#EBF7EE] text-[#1E7E34] border-[#BEE3C8] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                        : isInitiated
                        ? "bg-[#E6F0FA] text-[#0B5FA5] border-[#BDD7EE] dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800"
                        : "bg-[#FFF8E6] text-[#B36B00] border-[#FFE29A] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                    }`}>
                      {status.toUpperCase()}
                    </span>
                    <span className="text-sm font-bold text-[#14213D] dark:text-[#F0F4FF]">
                      Case #{cmp.complaint_id || cmp.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span suppressHydrationWarning>{cmp.submitted_at ? new Date(cmp.submitted_at).toLocaleDateString() : "Verified"}</span>
                  </div>
                </div>

                {/* Primary Demarcation Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                  <div className="p-2.5 rounded-[3px] bg-white dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10">
                    <div className="text-[9px] text-[#64748B] dark:text-slate-400 uppercase font-mono font-semibold">14-Digit Parcel ID</div>
                    <div className="text-xs font-bold text-[#0B5FA5] dark:text-sky-400 font-mono mt-0.5">
                      {parcelId}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-[3px] bg-white dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10">
                    <div className="text-[9px] text-[#64748B] dark:text-slate-400 uppercase font-mono font-semibold">Verified Landowner</div>
                    <div className="text-xs font-bold text-[#14213D] dark:text-[#F0F4FF] mt-0.5">
                      {cmp.owner_name || "Landowner"}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-[3px] bg-white dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10">
                    <div className="text-[9px] text-[#64748B] dark:text-slate-400 uppercase font-mono font-semibold">Cadastral Demarcation</div>
                    <div className="text-xs font-bold text-[#1E7E34] dark:text-emerald-400 font-mono mt-0.5">
                      {areaAcres} Acres ({Number(areaSqm).toLocaleString()} m²)
                    </div>
                  </div>

                  <div className="p-2.5 rounded-[3px] bg-white dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10">
                    <div className="text-[9px] text-[#64748B] dark:text-slate-400 uppercase font-mono font-semibold">Operational Sector</div>
                    <div className="text-xs font-bold text-[#14213D] dark:text-[#F0F4FF] mt-0.5">
                      {cmp.contact_village || cmp.village || "Corridor Sector"}
                    </div>
                  </div>
                </div>

                {/* Grievance Description */}
                <div className="mb-3 text-xs text-[#333333] dark:text-slate-300 bg-white dark:bg-[#07080F] p-3 rounded-[3px] border border-[#DCE2E8] dark:border-white/10">
                  <strong className="text-[#14213D] dark:text-white">Grievance Claim: </strong>
                  {cmp.description || cmp.complaint_type || "Boundary demarcation adjustment claim against cadastral survey."}
                </div>

                {/* Field Officer Ground Verification Banner */}
                {cmp.field_verification && (
                  <div className="p-3 rounded-[3px] mb-3 bg-[#E6F0FA] dark:bg-sky-950/40 border border-[#BDD7EE] dark:border-sky-800">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B5FA5] dark:text-sky-300 mb-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>FIELD VERIFICATION ACCORD &bull; Verified by {cmp.field_verification.officer_name || "Ramesh Patel (Patwari)"}</span>
                    </div>
                    <div className="text-xs text-[#333333] dark:text-slate-200 italic">
                      &ldquo;{cmp.field_verification.notes}&rdquo;
                    </div>
                  </div>
                )}

                {/* Attached What-If Simulation Badge */}
                {(cmp.what_if_simulation || cmp.simulation_record) && (
                  <div className="p-2.5 rounded-[3px] mb-3 bg-[#FFF8E6] dark:bg-amber-950/40 border border-[#FFE29A] dark:border-amber-800 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#B36B00] dark:text-amber-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>SIMULATION ATTACHED: {(cmp.what_if_simulation || cmp.simulation_record).simulation_id || "SIM-RFCTLARR"}</span>
                    </div>
                    <div className="text-xs text-[#14213D] dark:text-slate-200 font-mono font-bold">
                      Statutory Award: ₹{Number((cmp.what_if_simulation || cmp.simulation_record).simulated?.award_breakdown?.total_statutory_award || 4850000).toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Administrative Actions Strip */}
                <div className="flex items-center gap-2 flex-wrap pt-2.5 border-t border-[#DCE2E8] dark:border-white/10">
                  
                  {/* Action 1: What-If Simulation */}
                  <button
                    onClick={() => setSimulatingComplaint(cmp)}
                    className="px-3 py-1.5 rounded-[3px] text-xs font-bold bg-[#E6F0FA] dark:bg-sky-950/50 border border-[#BDD7EE] dark:border-sky-800 text-[#0B5FA5] dark:text-sky-300 hover:bg-[#D4E6F8] dark:hover:bg-sky-900/50 transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#0B5FA5] dark:text-sky-300" />
                    <span>Run What-If Simulation</span>
                  </button>

                  {/* Action 2: Detailed What-If Case Report & PDF */}
                  <button
                    onClick={() => setSelectedReportComplaint(cmp)}
                    className="px-3 py-1.5 rounded-[3px] text-xs font-bold bg-[#EBF7EE] dark:bg-emerald-950/50 border border-[#BEE3C8] dark:border-emerald-800 text-[#1E7E34] dark:text-emerald-300 hover:bg-[#DCF2E2] dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#1E7E34] dark:text-emerald-300" />
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
                      className="px-3 py-1.5 rounded-[3px] text-xs font-bold bg-[#0B2E59] hover:bg-[#123C6B] text-white transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Scale className="w-3.5 h-3.5" />
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
                      className="px-3 py-1.5 rounded-[3px] text-xs font-bold bg-[#0B5FA5] hover:bg-[#094d87] text-white transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
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
                      className="px-3 py-1.5 rounded-[3px] text-xs font-bold bg-[#1E7E34] hover:bg-[#18662a] text-white transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Implementation</span>
                    </button>
                  )}

                  {/* Completed Badge */}
                  {isCompleted && (
                    <span className="text-xs text-[#1E7E34] dark:text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Statutory resolution completed &amp; recorded.
                    </span>
                  )}
                </div>

                {/* Initiate Implementation Drawer */}
                {initiatingId === cmp.id && (
                  <div className="mt-3 p-3.5 rounded-[4px] bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 space-y-2.5">
                    <div className="text-xs font-bold text-[#0B5FA5] dark:text-sky-300">
                      Issue Administrative Implementation Order:
                    </div>

                    <input
                      type="text"
                      placeholder="Administrative Order Reference (e.g. CALA-ORDER-2026-081)..."
                      value={orderRef}
                      onChange={(e) => setOrderRef(e.target.value)}
                      className="input w-full font-mono bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white"
                    />

                    <textarea
                      rows={2}
                      placeholder="Enter specific implementation directives (e.g., sanction boundary adjustment, order PFMS compensation calculation)..."
                      value={initiateNotes}
                      onChange={(e) => setInitiateNotes(e.target.value)}
                      className="input w-full bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleInitiate(cmp.complaint_id || cmp.id)}
                        disabled={initiateSubmitting}
                        className="btn-primary py-1.5 px-3 text-xs"
                      >
                        {initiateSubmitting ? "Initiating..." : "Confirm & Initiate Implementation"}
                      </button>
                      <button
                        onClick={() => setInitiatingId(null)}
                        className="px-3 py-1.5 rounded-[3px] text-xs font-semibold border border-[#CBD5E1] dark:border-slate-700 text-[#64748B] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Complete Implementation Drawer with Statutory Parameters */}
                {completingId === cmp.id && (
                  <div className="mt-3 p-3.5 rounded-[4px] bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 space-y-3">
                    <div className="text-xs font-bold text-[#1E7E34] dark:text-emerald-400">
                      Finalize Statutory Acquisition Record:
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="text-[10px] text-[#64748B] dark:text-slate-400 font-mono block mb-1">
                          Area Acquired (Acres)
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={statutoryAcqAcres}
                          onChange={(e) => setStatutoryAcqAcres(Number(e.target.value))}
                          className="input w-full font-mono text-xs bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#64748B] dark:text-slate-400 font-mono block mb-1">
                          Compensation Assessed (₹)
                        </label>
                        <input
                          type="number"
                          value={statutoryAssessed}
                          onChange={(e) => setStatutoryAssessed(Number(e.target.value))}
                          className="input w-full font-mono text-xs bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#64748B] dark:text-slate-400 font-mono block mb-1">
                          Compensation Paid (₹)
                        </label>
                        <input
                          type="number"
                          value={statutoryPaid}
                          onChange={(e) => setStatutoryPaid(Number(e.target.value))}
                          className="input w-full font-mono text-xs bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#64748B] dark:text-slate-400 font-mono block mb-1">
                          Possession Status
                        </label>
                        <select
                          value={statutoryPossession}
                          onChange={(e) => setStatutoryPossession(e.target.value)}
                          className="input w-full text-xs bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white"
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
                      className="input w-full bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white text-xs"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleComplete(cmp.complaint_id || cmp.id, Number(areaAcres))}
                        disabled={completeSubmitting}
                        className="px-3.5 py-1.5 rounded-[3px] text-xs font-bold bg-[#1E7E34] hover:bg-[#18662a] text-white transition-colors"
                      >
                        {completeSubmitting ? "Finalizing Order..." : "Finalize Acquisition & Close Case"}
                      </button>
                      <button
                        onClick={() => setCompletingId(null)}
                        className="px-3 py-1.5 rounded-[3px] text-xs font-semibold border border-[#CBD5E1] dark:border-slate-700 text-[#64748B] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Resolve Matter Drawer */}
                {resolvingId === cmp.id && (
                  <div className="mt-3 p-3.5 rounded-[4px] bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 space-y-2.5">
                    <div className="text-xs font-bold text-[#1E7E34] dark:text-emerald-400 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" />
                      <span>Issue Statutory Resolution &amp; Formal Notice (RFCTLARR Act 2013):</span>
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-slate-400 m-0 leading-relaxed">
                      Resolving this matter will finalize the administrative record, issue an official notice with a unique statutory reference number to the citizen landowner, and archive the counterfactual simulation.
                    </p>

                    <textarea
                      rows={3}
                      placeholder="Enter final administrative determination, boundary rectification findings, and compensation sanction details..."
                      value={resolveNotes}
                      onChange={(e) => setResolveNotes(e.target.value)}
                      className="input w-full bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white text-xs"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolveMatter(cmp.complaint_id || cmp.id)}
                        disabled={resolveSubmitting}
                        className="px-3.5 py-1.5 rounded-[3px] text-xs font-bold bg-[#0B2E59] hover:bg-[#123C6B] text-white transition-colors"
                      >
                        {resolveSubmitting ? "Issuing Statutory Determination..." : "Confirm Resolution & Issue Notice"}
                      </button>
                      <button
                        onClick={() => setResolvingId(null)}
                        className="px-3 py-1.5 rounded-[3px] text-xs font-semibold border border-[#CBD5E1] dark:border-slate-700 text-[#64748B] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Resolved Case Banner & Direct PDF Downloads */}
                {isCompleted && (
                  <div className="mt-3 p-3 rounded-[3px] bg-[#EBF7EE] dark:bg-emerald-950/40 border border-[#BEE3C8] dark:border-emerald-800 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E7E34] dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>MATTER RESOLVED &bull; STATUTORY NOTICE ISSUED</span>
                      </div>
                      <div className="text-[11px] text-[#64748B] dark:text-slate-300 font-mono mt-0.5">
                        Notice Ref: <strong className="text-[#B36B00] dark:text-amber-400">{cmp.notice_reference || cmp.resolution_notice?.notice_reference || `CALA/NOTICE/2026/${String(cmp.complaint_id || cmp.id || "101").slice(-4)}`}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => generateLandownerNoticePdf(buildLandownerNoticeData(cmp))}
                        className="px-3 py-1.5 rounded-[3px] text-xs font-bold bg-[#FFF8E6] dark:bg-amber-950/50 border border-[#FFE29A] dark:border-amber-800 text-[#B36B00] dark:text-amber-300 hover:bg-[#FEEFC3] transition-colors flex items-center gap-1.5"
                        title="Download Official Statutory Resolution Notice (PDF)"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Notice (PDF)</span>
                      </button>

                      <button
                        onClick={() => generateCaseReportPdf(buildCaseReportData(cmp))}
                        className="px-3 py-1.5 rounded-[3px] text-xs font-bold bg-[#E6F0FA] dark:bg-sky-950/50 border border-[#BDD7EE] dark:border-sky-800 text-[#0B5FA5] dark:text-sky-300 hover:bg-[#D4E6F8] transition-colors flex items-center gap-1.5"
                        title="Download Complete Case Report (PDF)"
                      >
                        <Download className="w-3.5 h-3.5" />
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
