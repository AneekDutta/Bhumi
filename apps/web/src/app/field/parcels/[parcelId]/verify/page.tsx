"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Send,
  Save,
  Clock
} from "lucide-react";
import { FieldShell } from "@/components/field/FieldShell";
import { CaptureLocation } from "@/components/field/CaptureLocation";
import { CapturePhoto } from "@/components/field/CapturePhoto";
import { DocumentUpload, FieldDocument } from "@/components/field/DocumentUpload";
import { ReportIssueForm } from "@/components/field/ReportIssueForm";
import { SubmissionStatusModal } from "@/components/field/SubmissionStatusModal";
import { getFieldParcels, submitFieldVerification } from "@/lib/api";
import { offlineStore, QueuedVerification } from "@/lib/offlineStore";
import { LocationCoordinates } from "@/lib/native/geolocation";
import { CapturedPhoto } from "@/lib/native/camera";

export default function ParcelVerificationPage() {
  const params = useParams();
  const router = useRouter();
  const parcelId = (params?.parcelId as string) || "";

  const [parcel, setParcel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [activeOfficer, setActiveOfficer] = useState<any>(null);

  // Verification Checklist State
  const [ownerPresent, setOwnerPresent] = useState(true);
  const [ownerVerifiedName, setOwnerVerifiedName] = useState("");
  const [boundaryConfirmed, setBoundaryConfirmed] = useState(true);
  const [possessionStatus, setPossessionStatus] = useState("cultivated");
  
  // GPS, Photos, Docs
  const [gpsCoords, setGpsCoords] = useState<LocationCoordinates | null>(null);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [documents, setDocuments] = useState<FieldDocument[]>([]);

  // Issue reporting
  const [hasIssue, setHasIssue] = useState(false);
  const [issueType, setIssueType] = useState("ownership_mismatch");
  const [issueSeverity, setIssueSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL_STOPPAGE">("HIGH");

  // Observations & Remarks
  const [observations, setObservations] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState<"verified" | "disputed" | "rejected">("verified");

  // Success response
  const [submissionResponse, setSubmissionResponse] = useState<any>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const off = offlineStore.getActiveOfficer();
    setActiveOfficer(off || { id: "OFF-001", name: "Ramesh Patel", designation: "Patwari" });

    async function load() {
      try {
        const list = await getFieldParcels();
        const found = list.find((p: any) => p.parcel_id === parcelId || p.id === parcelId);
        if (found) {
          setParcel(found);
          setOwnerVerifiedName(found.owner_name || "");
        } else {
          setParcel(null);
        }
      } catch {
        setParcel(null);
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [parcelId]);

  const handleSubmit = async (forceOffline = false) => {
    setSubmitting(true);

    const payload = {
      parcel_id: parcelId,
      officer_id: activeOfficer?.officer_id || activeOfficer?.id || "OFF-001",
      officer_name: activeOfficer?.name || "Field Officer",
      verification_type: "field",
      status,
      gps_lat: gpsCoords?.lat || parcel?.centroid_lat || 24.6492,
      gps_lng: gpsCoords?.lng || parcel?.centroid_lng || 75.9284,
      gps_accuracy: gpsCoords?.accuracy || 8,
      boundary_confirmed: boundaryConfirmed,
      possession_status: possessionStatus,
      owner_present: ownerPresent,
      owner_verified_name: ownerVerifiedName,
      has_issue: hasIssue,
      issue_type: hasIssue ? issueType : undefined,
      issue_severity: hasIssue ? issueSeverity : "LOW",
      observations,
      remarks,
      photos: photos.map((p) => ({
        id: p.id,
        url: p.dataUrl,
        caption: p.caption,
        category: p.category,
        timestamp: p.timestamp,
        gps_lat: p.lat,
        gps_lng: p.lng
      })),
      documents: documents.map((d) => ({
        id: d.id,
        name: d.name,
        size: d.sizeBytes,
        category: d.category,
        timestamp: d.timestamp
      }))
    };

    if (!isOnline || forceOffline) {
      const queued: QueuedVerification = {
        id: `queue_${Date.now()}`,
        timestamp: Date.now(),
        payload: payload as any,
        synced: false
      };
      offlineStore.add(queued);
      setSubmitting(false);
      setSubmissionResponse({
        success: true,
        offline: true,
        verification_id: queued.id,
        parcel_id: parcelId,
        message: "Stored offline in local device storage. Auto-sync will run when connection resumes."
      });
      return;
    }

    try {
      const res = await submitFieldVerification(payload);
      setSubmissionResponse(res);
    } catch (e) {
      console.warn("API failed, saving offline:", e);
      const queued: QueuedVerification = {
        id: `queue_${Date.now()}`,
        timestamp: Date.now(),
        payload: payload as any,
        synced: false
      };
      offlineStore.add(queued);
      setSubmissionResponse({
        success: true,
        offline: true,
        verification_id: queued.id,
        parcel_id: parcelId,
        message: "Network connection lost. Verified report securely queued offline."
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submissionResponse) {
    return (
      <FieldShell title="Verification Confirmed">
        <SubmissionStatusModal
          response={submissionResponse}
          parcelId={parcelId}
          surveyNo={parcel?.survey_no}
          villageName={parcel?.village_name}
          onDone={() => router.push("/field/parcels")}
        />
      </FieldShell>
    );
  }

  if (loading) {
    return (
      <FieldShell title="Loading Parcel...">
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Fetching cadastral record...</p>
        </div>
      </FieldShell>
    );
  }

  if (!parcel) {
    return (
      <FieldShell title="Verify Parcel" showBack>
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

  const sNo = parcel?.survey_no || parcel?.survey_number || parcel?.parcel_id || "-";

  return (
    <FieldShell title={`Verify: Survey ${sNo}`} showBack>
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={`/field/parcels/${parcelId}`}
            className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0B2E59] dark:text-slate-400 dark:hover:text-white transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Cancel &amp; Return
          </Link>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-[3px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 text-[#0B2E59] dark:text-sky-400 font-bold">
            ID: {parcelId}
          </span>
        </div>

        {/* 1. Ownership & Boundary Checklist */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#14213D] dark:text-white">
            <ShieldCheck className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
            <span>Title &amp; Physical Demarcation</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#14213D] dark:text-slate-300 font-bold block">Owner / Representative Presence</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOwnerPresent(true)}
                className={`py-2 px-3 rounded-[3px] text-xs font-bold border transition-all cursor-pointer ${
                  ownerPresent
                    ? "bg-[#E8F5E9] dark:bg-emerald-950/40 border-[#C8E6C9] dark:border-emerald-800/40 text-[#1E7E34] dark:text-emerald-300 shadow-xs"
                    : "bg-[#F8FAFC] dark:bg-[#07080F] border-[#DCE2E8] dark:border-white/10 text-[#64748B] dark:text-slate-400 hover:bg-slate-100"
                }`}
              >
                Present at Survey
              </button>
              <button
                type="button"
                onClick={() => setOwnerPresent(false)}
                className={`py-2 px-3 rounded-[3px] text-xs font-bold border transition-all cursor-pointer ${
                  !ownerPresent
                    ? "bg-[#FFF8E1] dark:bg-amber-950/40 border-[#FFE082] dark:border-amber-800/40 text-[#B36B00] dark:text-amber-300 shadow-xs"
                    : "bg-[#F8FAFC] dark:bg-[#07080F] border-[#DCE2E8] dark:border-white/10 text-[#64748B] dark:text-slate-400 hover:bg-slate-100"
                }`}
              >
                Absentee / Non-Responsive
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#14213D] dark:text-slate-300 font-bold block">Verified Claimant Name</label>
            <input
              type="text"
              value={ownerVerifiedName}
              onChange={(e) => setOwnerVerifiedName(e.target.value)}
              placeholder="Confirm legal landowner name"
              className="w-full bg-[#F8FAFC] dark:bg-[#07080F] border border-[#CBD5E1] dark:border-white/15 rounded-[4px] px-3 py-2 text-xs text-[#14213D] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0B2E59] font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#14213D] dark:text-slate-300 font-bold block">Boundary Pillars Intact</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBoundaryConfirmed(true)}
                className={`py-2 px-3 rounded-[3px] text-xs font-bold border transition-all cursor-pointer ${
                  boundaryConfirmed
                    ? "bg-[#E8F5E9] dark:bg-emerald-950/40 border-[#C8E6C9] dark:border-emerald-800/40 text-[#1E7E34] dark:text-emerald-300 shadow-xs"
                    : "bg-[#F8FAFC] dark:bg-[#07080F] border-[#DCE2E8] dark:border-white/10 text-[#64748B] dark:text-slate-400 hover:bg-slate-100"
                }`}
              >
                Pillars Match RoR
              </button>
              <button
                type="button"
                onClick={() => setBoundaryConfirmed(false)}
                className={`py-2 px-3 rounded-[3px] text-xs font-bold border transition-all cursor-pointer ${
                  !boundaryConfirmed
                    ? "bg-[#FFEBEE] dark:bg-rose-950/40 border-[#FFCDD2] dark:border-rose-800/40 text-[#B32424] dark:text-rose-300 shadow-xs"
                    : "bg-[#F8FAFC] dark:bg-[#07080F] border-[#DCE2E8] dark:border-white/10 text-[#64748B] dark:text-slate-400 hover:bg-slate-100"
                }`}
              >
                Discrepancy / Encroached
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#14213D] dark:text-slate-300 font-bold block">Physical Possession Status</label>
            <select
              value={possessionStatus}
              onChange={(e) => setPossessionStatus(e.target.value)}
              className="w-full bg-[#F8FAFC] dark:bg-[#07080F] border border-[#CBD5E1] dark:border-white/15 rounded-[4px] px-3 py-2 text-xs text-[#14213D] dark:text-white focus:outline-none focus:border-[#0B2E59] font-medium cursor-pointer"
            >
              <option value="cultivated">Active Agricultural Crop</option>
              <option value="vacant">Vacant / Fallow Open Land</option>
              <option value="residential_structure">Residential Pucca / Kuccha House</option>
              <option value="commercial_shed">Commercial Shed / Workshop</option>
              <option value="encroached">Encroached / Third-Party Claim</option>
            </select>
          </div>
        </div>

        {/* 2. GPS Location Capture */}
        <CaptureLocation
          targetLat={parcel?.centroid_lat || 25.321}
          targetLng={parcel?.centroid_lng || 82.987}
          surveyNo={sNo}
          onLocationCaptured={(pos) => setGpsCoords(pos)}
        />

        {/* 3. Photo Capture */}
        <CapturePhoto
          photos={photos}
          onAddPhoto={(p) => setPhotos((prev) => [...prev, p])}
          onRemovePhoto={(id) => setPhotos((prev) => prev.filter((p) => p.id !== id))}
          currentCoords={gpsCoords ? { lat: gpsCoords.lat, lng: gpsCoords.lng } : undefined}
        />

        {/* 4. Document Upload */}
        <DocumentUpload
          documents={documents}
          onAddDocument={(d) => setDocuments((prev) => [...prev, d])}
          onRemoveDocument={(id) => setDocuments((prev) => prev.filter((d) => d.id !== id))}
        />

        {/* 5. Issue Reporting Hook */}
        <ReportIssueForm
          hasIssue={hasIssue}
          issueType={issueType}
          issueSeverity={issueSeverity}
          onToggleIssue={(val) => {
            setHasIssue(val);
            if (val) setStatus("disputed");
            else setStatus("verified");
          }}
          onChangeType={(t) => setIssueType(t)}
          onChangeSeverity={(s) => setIssueSeverity(s)}
        />

        {/* 6. Observations & Remarks */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-3">
          <span className="text-xs font-bold text-[#14213D] dark:text-white block">Field Observations &amp; Officer Remarks</span>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={2}
            placeholder="Observed crop types, structures, boundary markers, borewells..."
            className="w-full bg-[#F8FAFC] dark:bg-[#07080F] border border-[#CBD5E1] dark:border-white/15 rounded-[4px] px-3 py-2 text-xs text-[#14213D] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0B2E59] resize-none"
          />
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            placeholder="Statutory remarks for Tehsildar / CALA legal review..."
            className="w-full bg-[#F8FAFC] dark:bg-[#07080F] border border-[#CBD5E1] dark:border-white/15 rounded-[4px] px-3 py-2 text-xs text-[#14213D] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0B2E59] resize-none"
          />
        </div>

        {/* 7. Final Decision Selector */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-3">
          <label className="text-xs font-bold text-[#14213D] dark:text-white block">Officer Statutory Recommendation</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setStatus("verified")}
              className={`py-2.5 px-2 rounded-[3px] text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                status === "verified"
                  ? "bg-[#E8F5E9] dark:bg-emerald-950/40 border-[#C8E6C9] dark:border-emerald-800/40 text-[#1E7E34] dark:text-emerald-300 shadow-xs"
                  : "bg-[#F8FAFC] dark:bg-[#07080F] border-[#DCE2E8] dark:border-white/10 text-[#64748B] dark:text-slate-400 hover:bg-slate-100"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified Clear</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus("disputed")}
              className={`py-2.5 px-2 rounded-[3px] text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                status === "disputed"
                  ? "bg-[#FFF8E1] dark:bg-amber-950/40 border-[#FFE082] dark:border-amber-800/40 text-[#B36B00] dark:text-amber-300 shadow-xs"
                  : "bg-[#F8FAFC] dark:bg-[#07080F] border-[#DCE2E8] dark:border-white/10 text-[#64748B] dark:text-slate-400 hover:bg-slate-100"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Contested</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus("rejected")}
              className={`py-2.5 px-2 rounded-[3px] text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                status === "rejected"
                  ? "bg-[#FFEBEE] dark:bg-rose-950/40 border-[#FFCDD2] dark:border-rose-800/40 text-[#B32424] dark:text-rose-300 shadow-xs"
                  : "bg-[#F8FAFC] dark:bg-[#07080F] border-[#DCE2E8] dark:border-white/10 text-[#64748B] dark:text-slate-400 hover:bg-slate-100"
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>Rejected</span>
            </button>
          </div>
        </div>

        {/* 8. Action Submission Buttons */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(false)}
            className="w-full py-3 px-4 bg-[#1E7E34] hover:bg-[#166527] disabled:bg-slate-400 text-white rounded-[4px] text-xs font-bold uppercase tracking-wider shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>
              {submitting ? "Propagating to Platform..." : isOnline ? "Submit Field Verification" : "Queue Offline Submission"}
            </span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(true)}
            className="w-full py-2.5 px-4 bg-white dark:bg-[#0D121F] hover:bg-[#F8FAFC] dark:hover:bg-white/5 border border-[#DCE2E8] dark:border-white/10 text-[#64748B] dark:text-slate-300 rounded-[4px] text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5 text-[#64748B] dark:text-slate-400" />
            <span>Save to Device (Force Offline Storage)</span>
          </button>
        </div>

      </div>
    </FieldShell>
  );
}
