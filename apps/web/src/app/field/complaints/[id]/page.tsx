"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Map, { Source, Layer, Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { 
  FileText, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ArrowLeft,
  Compass,
  Layers,
  ShieldCheck,
  Send,
  ExternalLink,
  XCircle,
  Clock,
  UserCheck,
  Lock
} from "lucide-react";
import { FieldShell } from "@/components/field/FieldShell";
import { 
  getLandownerComplaints, 
  getParcelById,
  fieldVerifyComplaint,
  fieldRejectComplaint,
  getComplaintAuditTrail
} from "@/lib/api";
import { offlineStore } from "@/lib/offlineStore";
import { useRealtimeComplaints } from "@/lib/supabase/useRealtime";

const DARK_MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export default function FieldComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const complaintId = params.id as string;

  const [complaint, setComplaint] = useState<any>(null);
  const [parcel, setParcel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [officer, setOfficer] = useState<any>(null);

  // Field Officer Actions
  const [verificationNotes, setVerificationNotes] = useState("");
  const [verifying, setVerifying] = useState(false);

  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const allComplaints = await getLandownerComplaints();
      const match = allComplaints.find((c: any) => c.id === complaintId || c.complaint_id === complaintId);
      setComplaint(match || null);

      if (match?.parcel_id && match.parcel_id !== "null") {
        try {
          const p = await getParcelById(match.parcel_id);
          if (p) setParcel(p);
        } catch {}
      }

      try {
        const trail = await getComplaintAuditTrail(complaintId);
        setAuditTrail(trail || []);
      } catch {}
    } catch {
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const active = offlineStore.getActiveOfficer();
    setOfficer(active || { officer_id: "OFF-001", name: "Ramesh Patel", designation: "Patwari / Revenue Lekhpal" });
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaintId]);

  useRealtimeComplaints(complaintId, () => {
    loadData();
  });

  // Extract boundary coordinates from parcel or complaint
  const boundaryPoints: Array<{ lat: number; lng: number; sequence?: number }> = useMemo(() => {
    if (parcel?.coordinates && parcel.coordinates.length >= 3) {
      return parcel.coordinates;
    }
    if (complaint?.landowner_reported_boundary?.points && complaint.landowner_reported_boundary.points.length >= 3) {
      return complaint.landowner_reported_boundary.points;
    }
    return [];
  }, [parcel, complaint]);

  // Center coordinate for map
  const mapCenter = useMemo(() => {
    if (boundaryPoints.length > 0) {
      const avgLat = boundaryPoints.reduce((s, p) => s + p.lat, 0) / boundaryPoints.length;
      const avgLng = boundaryPoints.reduce((s, p) => s + p.lng, 0) / boundaryPoints.length;
      return { lat: avgLat, lng: avgLng };
    }
    if (complaint?.gps?.lat && complaint?.gps?.lng) {
      return { lat: complaint.gps.lat, lng: complaint.gps.lng };
    }
    return { lat: 24.6650, lng: 75.9520 };
  }, [boundaryPoints, complaint]);

  // Closed GeoJSON polygon
  const geojsonPolygon = useMemo(() => {
    if (boundaryPoints.length < 3) return null;
    const ring = boundaryPoints.map((p) => [p.lng, p.lat]);
    ring.push([boundaryPoints[0].lng, boundaryPoints[0].lat]);
    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "Polygon" as const,
        coordinates: [ring]
      }
    };
  }, [boundaryPoints]);

  // Action 1: Verify Complaint -> moves to Admin Queue
  const handleVerifyComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setFeedback(null);

    try {
      const notes = verificationNotes.trim() || "Field boundary demarcation and ownership verification completed on site.";
      const res = await fieldVerifyComplaint(
        complaintId,
        officer?.officer_id || "OFF-001",
        officer?.name || "Ramesh Patel",
        notes
      );
      setFeedback({
        type: "success",
        message: res?.message || "Complaint verified by Field Officer! Forwarded to Admin Implementation Queue."
      });
      setVerificationNotes("");
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to submit field verification."
      });
    } finally {
      setVerifying(false);
    }
  };

  // Action 2: Reject Complaint -> records reason, halts case
  const handleRejectComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert("Please enter the official reason for rejecting this complaint.");
      return;
    }

    setRejecting(true);
    setFeedback(null);

    try {
      const res = await fieldRejectComplaint(
        complaintId,
        officer?.officer_id || "OFF-001",
        officer?.name || "Ramesh Patel",
        rejectReason.trim()
      );
      setFeedback({
        type: "error",
        message: res?.message || "Complaint rejected by Field Officer. Case halted."
      });
      setRejectReason("");
      setShowRejectForm(false);
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Failed to reject complaint."
      });
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <FieldShell title="Review Grievance">
        <div className="py-20 text-center text-xs text-[#64748B] dark:text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0B2E59] dark:text-sky-400" />
          <span>Loading grievance record...</span>
        </div>
      </FieldShell>
    );
  }

  if (!complaint) {
    return (
      <FieldShell title="Review Grievance">
        <div className="p-4 text-center py-20 space-y-3">
          <AlertTriangle className="w-8 h-8 text-[#B36B00] dark:text-amber-400 mx-auto" />
          <h2 className="text-sm font-bold text-[#14213D] dark:text-white">Grievance Record Not Found</h2>
          <Link href="/field/complaints" className="inline-block px-4 py-2 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white text-xs font-semibold shadow-xs">
            &larr; Return to Grievance Queue
          </Link>
        </div>
      </FieldShell>
    );
  }

  const status = complaint.status || "Pending Field Verification";
  const isPending = status === "Pending Field Verification" || status.includes("SUBMITTED") || status.includes("AWAITING");
  const isVerified = status === "Verified by Field Officer" || status.includes("Implementation");
  const isRejected = status === "Rejected by Field Officer" || status === "REJECTED";
  const parcelId = complaint.parcel_id || parcel?.parcel_id || "N/A";
  const ownerLegalName = complaint.owner_name || parcel?.owner_legal_name || "Landowner";
  const documents = complaint.landowner_documents || (complaint.document_evidence ? [complaint.document_evidence] : parcel?.documents || []);

  return (
    <FieldShell title={`Review #${complaint.complaint_id || complaint.id}`} showBack>
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/field/complaints"
            className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0B2E59] dark:text-slate-400 dark:hover:text-white transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Queue</span>
          </Link>
          <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-[3px] border ${
            isVerified
              ? "bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-300 border-[#C8E6C9] dark:border-emerald-800/40"
              : isRejected
              ? "bg-[#FFEBEE] dark:bg-rose-950/40 text-[#B32424] dark:text-rose-300 border-[#FFCDD2] dark:border-rose-800/40"
              : "bg-[#FFF8E1] dark:bg-amber-950/40 text-[#B36B00] dark:text-amber-300 border-[#FFE082] dark:border-amber-800/40"
          }`}>
            {status}
          </span>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div className={`p-3 rounded-[4px] text-xs flex items-center gap-2.5 border ${
            feedback.type === "success" 
              ? "bg-[#E8F5E9] dark:bg-emerald-950/40 border-[#C8E6C9] dark:border-emerald-800/40 text-[#1E7E34] dark:text-emerald-300" 
              : "bg-[#FFEBEE] dark:bg-rose-950/40 border-[#FFCDD2] dark:border-rose-800/40 text-[#B32424] dark:text-rose-300"
          }`}>
            {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* SECTION 1: CITIZEN CLAIM OVERVIEW */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 space-y-3 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#0B2E59] dark:text-sky-400 uppercase tracking-wider font-bold block">
                Official Registered Land Parcel Grievance
              </span>
              <h1 className="text-base font-bold text-[#14213D] dark:text-white">
                {complaint.complaint_type}
              </h1>
            </div>

            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-[3px] bg-[#E6F0FA] dark:bg-sky-950/40 text-[#0B5FA5] dark:text-sky-300 border border-[#B8D5ED] dark:border-sky-800/40">
              #{parcelId}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#F8FAFC] dark:bg-[#07080F] p-3 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
            <div>
              <span className="text-[10px] text-[#64748B] dark:text-slate-400 uppercase block font-semibold">Landowner Legal Name:</span>
              <span className="text-[#14213D] dark:text-white font-bold">{ownerLegalName}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] dark:text-slate-400 uppercase block font-semibold">14-Digit Parcel ID:</span>
              <span className="text-[#0B5FA5] dark:text-sky-300 font-bold">{parcelId}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] dark:text-slate-400 uppercase block font-semibold">Sector / Village:</span>
              <span className="text-[#333333] dark:text-slate-300">{complaint.contact_village || parcel?.village_name || "Corridor Sector"}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] dark:text-slate-400 uppercase block font-semibold">Date Lodged:</span>
              <span className="text-[#333333] dark:text-slate-300">{new Date(complaint.submitted_at || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="p-3 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#64748B] dark:text-slate-400 font-bold block">Citizen Grievance Statement:</span>
            <p className="text-xs text-[#333333] dark:text-slate-200 leading-relaxed">{complaint.description}</p>
          </div>
        </div>

        {/* SECTION 2: BOUNDARY POLYGON (MARKED DURING PARCEL REGISTRATION) */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
              <h2 className="text-xs font-bold text-[#14213D] dark:text-white uppercase tracking-wider font-mono">
                Registered Parcel Demarcation
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[#64748B] dark:text-slate-400">
              {boundaryPoints.length} Corner Points
            </span>
          </div>

          <p className="text-xs text-[#64748B] dark:text-slate-300">
            Exact GPS polygon marked during parcel registration. Verify this boundary against physical boundary pillars on ground.
          </p>

          {/* Interactive Map */}
          {boundaryPoints.length >= 3 && (
            <div className="h-56 w-full rounded-[4px] overflow-hidden border border-[#DCE2E8] dark:border-white/10 relative shadow-inner">
              <Map
                initialViewState={{
                  longitude: mapCenter.lng,
                  latitude: mapCenter.lat,
                  zoom: 16
                }}
                mapStyle={DARK_MAP_STYLE}
                style={{ width: "100%", height: "100%" }}
              >
                <NavigationControl position="bottom-right" showCompass={false} />

                {geojsonPolygon && (
                  <Source id="parcel-boundary-source" type="geojson" data={geojsonPolygon}>
                    <Layer
                      id="parcel-fill"
                      type="fill"
                      paint={{
                        "fill-color": isVerified ? "#1E7E34" : isRejected ? "#B32424" : "#B36B00",
                        "fill-opacity": 0.25
                      }}
                    />
                    <Layer
                      id="parcel-outline"
                      type="line"
                      paint={{
                        "line-color": isVerified ? "#1E7E34" : isRejected ? "#B32424" : "#B36B00",
                        "line-width": 3
                      }}
                    />
                  </Source>
                )}

                {boundaryPoints.map((pt, idx) => (
                  <Marker key={idx} longitude={pt.lng} latitude={pt.lat} anchor="center">
                    <div className="w-5 h-5 rounded-full bg-[#1E7E34] border-2 border-white flex items-center justify-center text-[9px] font-bold text-white font-mono shadow-md">
                      {idx + 1}
                    </div>
                  </Marker>
                ))}
              </Map>
            </div>
          )}

          {/* Coordinates Table */}
          {boundaryPoints.length > 0 && (
            <div className="space-y-1 text-xs font-mono">
              <div className="grid grid-cols-3 text-[10px] uppercase text-[#64748B] dark:text-slate-400 px-2 py-1 bg-[#F1F4F7] dark:bg-[#07080F] rounded-[3px] font-bold">
                <span>Point</span>
                <span>Latitude</span>
                <span>Longitude</span>
              </div>
              {boundaryPoints.map((pt, idx) => (
                <div key={idx} className="grid grid-cols-3 text-[#14213D] dark:text-slate-300 px-2 py-1 rounded-[3px] bg-[#F8FAFC] dark:bg-[#07080F]/60 border border-[#DCE2E8] dark:border-white/10">
                  <span className="text-[#0B2E59] dark:text-sky-400 font-bold">P{idx + 1}</span>
                  <span>{pt.lat.toFixed(6)}°</span>
                  <span>{pt.lng.toFixed(6)}°</span>
                </div>
              ))}
            </div>
          )}

          {/* Declared / Calculated Area */}
          {(parcel?.calculated_area || complaint.landowner_declared_area) && (
            <div className="p-2.5 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 text-xs font-mono flex items-center justify-between">
              <span className="text-[#64748B] dark:text-slate-400">Calculated Area:</span>
              <span className="text-[#1E7E34] dark:text-emerald-400 font-bold">
                {parcel?.calculated_area?.acres || complaint.landowner_declared_area?.acres || 0} Acres ({parcel?.calculated_area?.sqm || complaint.landowner_declared_area?.sqm || 0} m²)
              </span>
            </div>
          )}
        </div>

        {/* SECTION 3: SUBMITTED OFFICIAL DOCUMENTS */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0B5FA5] dark:text-sky-400" />
              <h2 className="text-xs font-bold text-[#14213D] dark:text-white uppercase tracking-wider font-mono">
                Ownership &amp; Supporting Documents
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[#64748B] dark:text-slate-400">
              {documents.length} File(s)
            </span>
          </div>

          {documents.length === 0 ? (
            <p className="text-xs text-[#64748B] dark:text-slate-500 italic">No document files attached.</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <span className="text-[#14213D] dark:text-white font-medium block truncate">
                      {doc.file_name || `Document ${idx + 1}`}
                    </span>
                    <span className="text-[10px] text-[#64748B] dark:text-slate-400 font-mono">
                      {doc.classification || "Official Land Document"} · {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : "Stored"}
                    </span>
                  </div>

                  {doc.public_url && (
                    <a
                      href={doc.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white font-semibold text-[11px] flex items-center gap-1 flex-shrink-0 transition-colors shadow-xs"
                    >
                      <span>Inspect</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4 & 5: FIELD OFFICER FINAL GROUND DETERMINATION */}
        {(() => {
          const statusUpper = (complaint.status || "").toUpperCase();
          const isDecided = 
            statusUpper.includes("VERIFIED") || 
            statusUpper.includes("DECLINED") || 
            statusUpper.includes("REJECTED") || 
            statusUpper.includes("IMPLEMENTATION") || 
            statusUpper.includes("RESOLVED") || 
            !!complaint.field_verification || 
            !!complaint.rejection;

          const isApproved = statusUpper.includes("VERIFIED") || statusUpper.includes("IMPLEMENTATION") || statusUpper.includes("RESOLVED") || (complaint.field_verification && !complaint.rejection);
          const isDeclined = statusUpper.includes("DECLINED") || statusUpper.includes("REJECTED") || !!complaint.rejection;

          if (isDecided) {
            return (
              /* READ-ONLY FINAL GROUND DETERMINATION RECORD */
              <div className={`p-4 rounded-[4px] border space-y-3 bg-white dark:bg-[#0D121F] shadow-xs ${
                isApproved 
                  ? "border-[#C8E6C9] dark:border-emerald-800/40" 
                  : "border-[#FFCDD2] dark:border-rose-800/40"
              }`}>
                <div className="flex items-center justify-between border-b pb-2 border-[#DCE2E8] dark:border-white/10">
                  <div className="flex items-center gap-2">
                    {isApproved ? (
                      <CheckCircle2 className="w-5 h-5 text-[#1E7E34] dark:text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-[#B32424] dark:text-rose-400" />
                    )}
                    <span className={`text-xs font-bold uppercase tracking-wider font-mono ${
                      isApproved ? "text-[#1E7E34] dark:text-emerald-300" : "text-[#B32424] dark:text-rose-300"
                    }`}>
                      {isApproved ? "FIELD VERIFIED" : "FIELD DECLINED"}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-mono uppercase bg-[#F8FAFC] dark:bg-[#07080F] px-2 py-0.5 rounded-[3px] border border-[#DCE2E8] dark:border-white/10 text-[#64748B] dark:text-slate-300">
                    <Lock className="w-3 h-3 text-[#B36B00] dark:text-amber-400" /> Final &amp; Locked
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-[#333333] dark:text-slate-200">
                  <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-mono">
                    Statutory Decision: <strong className="text-[#14213D] dark:text-white">{isApproved ? "APPROVED (Ground Cadastral Claim Validated)" : "DECLINED (Ground Claim Disallowed)"}</strong>
                  </div>
                  <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-mono">
                    Designated Field Officer: <strong className="text-[#14213D] dark:text-white">
                      {complaint.field_verification?.officer_name || complaint.rejection?.officer_name || officer?.name || "Ramesh Patel"} 
                      {" "}({complaint.field_verification?.officer_id || complaint.rejection?.officer_id || "OFF-001"})
                    </strong>
                  </div>
                  <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-mono">
                    Decision Date &amp; Time: <strong className="text-[#14213D] dark:text-white">
                      {new Date(complaint.field_verification?.verified_at || complaint.rejection?.rejected_at || complaint.updated_at || Date.now()).toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <div className="p-3 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 space-y-1 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 block font-mono">
                      Official Inspection Remarks:
                    </span>
                    <p className="text-xs text-[#333333] dark:text-slate-200 italic">
                      &ldquo;{complaint.field_verification?.notes || complaint.rejection?.reason || "Field boundary demarcation and ownership verification completed on site."}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#DCE2E8] dark:border-white/10 flex items-center justify-between text-[11px]">
                  {isApproved ? (
                    <span className="text-[#1E7E34] dark:text-emerald-300 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Forwarded to CALA Admin Implementation Queue
                    </span>
                  ) : (
                    <span className="text-[#B32424] dark:text-rose-300 font-semibold flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      Case permanently halted. Not submitted to Admin.
                    </span>
                  )}
                  <span className="text-[10px] text-[#64748B] dark:text-slate-400 font-mono">Read-Only</span>
                </div>
              </div>
            );
          }

          // Case is still pending decision
          return (
            <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b border-[#DCE2E8] dark:border-white/10 pb-2">
                <ShieldCheck className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
                <h2 className="text-xs font-bold text-[#14213D] dark:text-white uppercase tracking-wider font-mono">
                  Field Officer Ground Determination
                </h2>
              </div>

              {/* Action 1: Verify Complaint Form */}
              <form onSubmit={handleVerifyComplaint} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#14213D] dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Field Verification Notes &amp; On-Site Findings
                  </label>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Enter physical inspection findings, boundary pillar verification, or title reconciliation notes..."
                    rows={3}
                    className="w-full bg-[#F8FAFC] dark:bg-[#07080F] border border-[#CBD5E1] dark:border-white/15 rounded-[4px] p-2.5 text-xs text-[#14213D] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0B2E59] font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full py-2.5 px-4 rounded-[4px] bg-[#1E7E34] hover:bg-[#166527] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Approve &amp; Mark Field Verified (Final)</span>
                </button>
              </form>

              {/* Action 2: Reject Complaint Trigger */}
              <div className="border-t border-[#DCE2E8] dark:border-white/10 pt-3">
                {!showRejectForm ? (
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(true)}
                    className="w-full py-2 px-4 rounded-[4px] bg-white dark:bg-[#0D121F] hover:bg-[#FFEBEE] dark:hover:bg-rose-950/30 border border-[#FFCDD2] dark:border-rose-800/40 text-[#B32424] dark:text-rose-400 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Decline / Reject Complaint (Final)</span>
                  </button>
                ) : (
                  <form onSubmit={handleRejectComplaint} className="space-y-3 p-3 rounded-[4px] bg-[#FFEBEE]/40 dark:bg-rose-950/20 border border-[#FFCDD2] dark:border-rose-800/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#B32424] dark:text-rose-400">Record Rejection Reason:</span>
                      <button
                        type="button"
                        onClick={() => setShowRejectForm(false)}
                        className="text-[10px] text-[#64748B] hover:text-[#14213D] dark:text-slate-400 dark:hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Provide specific statutory reason for rejection (e.g., ground demarcation overlaps with public right-of-way, document forged, boundary conflict)..."
                      rows={2}
                      required
                      className="w-full bg-[#F8FAFC] dark:bg-[#07080F] border border-[#CBD5E1] dark:border-white/15 rounded-[4px] p-2.5 text-xs text-[#14213D] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#B32424] font-sans"
                    />

                    <button
                      type="submit"
                      disabled={rejecting}
                      className="w-full py-2 px-4 rounded-[4px] bg-[#B32424] hover:bg-[#8B1A1A] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
                    >
                      {rejecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      <span>Confirm Decline &amp; Permanently Halt Case</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })()}

        {/* SECTION 6: STATUTORY AUDIT TRAIL TIMELINE */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 border-b border-[#DCE2E8] dark:border-white/10 pb-2">
            <Clock className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
            <h2 className="text-xs font-bold text-[#14213D] dark:text-white uppercase tracking-wider font-mono">
              Statutory Audit Trail &amp; Decision History
            </h2>
          </div>

          <div className="space-y-3 pl-4 border-l-2 border-[#DCE2E8] dark:border-white/15 text-xs">
            {auditTrail.length > 0 ? (
              auditTrail.map((log: any, idx: number) => (
                <div key={log.id || idx} className="relative space-y-0.5">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#0B2E59] dark:bg-sky-500 border-2 border-white dark:border-[#0D121F]" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#14213D] dark:text-white font-mono text-[11px]">
                      {log.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] font-mono text-[#64748B] dark:text-slate-400">
                      {new Date(log.created_at).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#64748B] dark:text-slate-300">
                    Actor: <span className="text-[#0B5FA5] dark:text-sky-300 font-semibold">{log.actor_role}</span> ({log.actor_id})
                  </div>
                  {log.state_after?.status && (
                    <div className="text-[10px] font-mono text-[#1E7E34] dark:text-emerald-400">
                      Status: {log.state_after.status}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-[11px] text-[#64748B] dark:text-slate-500 italic">
                Awaiting further statutory events. Initial lodging recorded.
              </div>
            )}
          </div>
        </div>

      </div>
    </FieldShell>
  );
}
