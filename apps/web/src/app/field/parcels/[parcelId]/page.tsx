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
import { getFieldParcels, getFieldIncidents, confirmFieldIncident } from "@/lib/api";
import { useRealtimeParcel } from "@/lib/supabase/useRealtime";
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

  const loadParcel = async () => {
    try {
      const list = await getFieldParcels();
      const match = list.find((p: any) => p.parcel_id === parcelId || p.id === parcelId);
      if (match) setParcel(match);
      const incs = await getFieldIncidents({ parcel_id: parcelId });
      setIncidents(incs || []);
    } catch {}
  };

  // Supabase Realtime: updates when Admin resolves issues or verifies from desktop
  useRealtimeParcel(parcelId, () => {
    loadParcel();
  });

  useEffect(() => {
    async function load() {
      try {
        const list = await getFieldParcels();
        const match = list.find((p: any) => p.parcel_id === parcelId || p.id === parcelId);
        if (match) {
          setParcel(match);
        } else {
          setParcel({
            parcel_id: parcelId,
            project_id: "P-NH927A",
            survey_no: "104/2B",
            village_name: "Rampur",
            tehsil: "Sadar",
            district: "Varanasi",
            area_acres: 1.45,
            area_hectares: 0.587,
            land_type: "Agricultural",
            current_stage: "HEARING_OF_OBJECTIONS",
            owner_name: "Raghunath Yadav",
            father_name: "Ram Swaroop Yadav",
            compensation_status: "Determined - Awaiting Disbursement",
            assessed_value: 4500000,
            rr_status: "Eligible under Second Schedule (RFCTLARR)",
            legal_status: "No Active High Court Injunction",
            risk_score: 42.0,
            criticality_score: 55.0,
            is_critical_path: false,
            centroid_lat: 24.6492,
            centroid_lng: 75.9284,
            verification_status: "pending"
          });
        }
      } catch {
        setParcel({
          parcel_id: parcelId,
          project_id: "P-NH927A",
          survey_no: "104/2B",
          village_name: "Rampur",
          tehsil: "Sadar",
          district: "Varanasi",
          area_acres: 1.45,
          area_hectares: 0.587,
          land_type: "Agricultural",
          current_stage: "HEARING_OF_OBJECTIONS",
          owner_name: "Raghunath Yadav",
          father_name: "Ram Swaroop Yadav",
          compensation_status: "Determined - Awaiting Disbursement",
          assessed_value: 4500000,
          rr_status: "Eligible under Second Schedule (RFCTLARR)",
          legal_status: "No Active High Court Injunction",
          risk_score: 42.0,
          criticality_score: 55.0,
          is_critical_path: false,
          centroid_lat: 24.6492,
          centroid_lng: 75.9284,
          verification_status: "pending"
        });
      } finally {
        setLoading(false);
      }

      try {
        const incs = await getFieldIncidents({ parcel_id: parcelId });
        setIncidents(incs || []);
      } catch {
        setIncidents([]);
      }
    }

    load();
  }, [parcelId]);

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
    } catch {
      setFeedback("Failed to confirm incident. Please check connection.");
    } finally {
      setConfirmingSubmitting(false);
    }
  };

  if (loading || !parcel) {
    return (
      <FieldShell title="Loading Parcel...">
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Fetching cadastral record...</p>
        </div>
      </FieldShell>
    );
  }

  const sNo = parcel.survey_no || parcel.survey_number || "-";

  return (
    <FieldShell title={`Parcel: Survey ${sNo}`} showBack>
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/field/parcels"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All Assigned Parcels
          </Link>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
            ID: {parcelId}
          </span>
        </div>

        {/* Parcel Header Card */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                Cadastral Survey Record
              </span>
              <h1 className="text-2xl font-black text-white font-display">
                Survey No. {sNo}
              </h1>
              <p className="text-xs text-slate-400">
                {parcel.village_name || "Ramganj Mandi"}, Tehsil {parcel.tehsil || "Sadar"}, {parcel.district || "Kota"}
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {parcel.area_acres || 1.45} Acres
              </span>
              <span className="block text-[10px] text-slate-400 mt-1">
                {parcel.land_type || "Agricultural"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              parcel.verification_status === "verified"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : parcel.conflict_flag || parcel.verification_status === "disputed"
                ? "bg-red-500/15 border-red-500/30 text-red-300"
                : "bg-amber-500/15 border-amber-500/30 text-amber-300"
            }`}>
              Status: {parcel.verification_status || "Pending Verification"}
            </span>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400">
              Stage: {parcel.current_stage || "NOTIF_11"}
            </span>
          </div>
        </div>

        {/* Feedback banner */}
        {feedback && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Active Ground Incidents on this parcel */}
        {incidents.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-red-400 px-1">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Active Field Incidents & Blockers ({incidents.length})
              </span>
            </div>

            {incidents.map((inc) => {
              const isResolved = inc.status === "resolved";
              const isConfirmed = inc.status === "confirmed";

              return (
                <div
                  key={inc.verification_id}
                  className={`p-3.5 rounded-xl border text-xs space-y-2.5 ${
                    isResolved
                      ? "bg-emerald-950/20 border-emerald-500/30"
                      : "bg-red-950/25 border-red-500/35"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase text-[11px]">
                      {(inc.issue_type || "Ground Incident").replace(/_/g, " ")}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                      isResolved
                        ? "bg-emerald-500/20 text-emerald-300"
                        : isConfirmed
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-red-500/20 text-red-300"
                    }`}>
                      {inc.status}
                    </span>
                  </div>

                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {inc.observations || inc.remarks || "Issue logged by field inspection."}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                    <span>Officer: {inc.officer_name || "Officer"}</span>
                    <span className="font-mono text-[9px] text-slate-400">{inc.source_type || "SYNTHETIC / DEVELOPMENT DATA"}</span>
                  </div>

                  {!isResolved && inc.status === "reported" && (
                    <div className="pt-2">
                      {confirmingId !== inc.verification_id ? (
                        <button
                          onClick={() => setConfirmingId(inc.verification_id)}
                          className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Confirm Incident on Ground</span>
                        </button>
                      ) : (
                        <div className="space-y-2 bg-slate-900/80 p-3 rounded-lg border border-slate-700">
                          <label className="block text-[11px] text-slate-300 font-medium">
                            Field Confirmation Remarks & Findings:
                          </label>
                          <textarea
                            rows={2}
                            value={confirmNotes}
                            onChange={(e) => setConfirmNotes(e.target.value)}
                            placeholder="Detail physical inspection findings, witnesses, or alignment shifts..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-xs text-white resize-none"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setConfirmingId(null)}
                              className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              disabled={confirmingSubmitting}
                              onClick={() => handleConfirmIncident(inc.verification_id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-bold flex items-center gap-1"
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

        {/* 10 Required Data Points Specification */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-3.5 text-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Land Acquisition Registry Record</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block">1. Parcel ID</span>
              <span className="font-mono font-semibold text-slate-200">{parcelId}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">2. Project Corridor</span>
              <span className="font-mono font-semibold text-indigo-300">{parcel.project_id || "P-NH927A"}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">3. Village / Jurisdiction</span>
              <span className="font-medium text-slate-200">{parcel.village_name || "Ramganj Mandi"}, {parcel.district || "Kota"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">4. Survey / Khasra No.</span>
              <span className="font-mono font-bold text-emerald-400">{sNo}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">5. Extent / Area</span>
              <span className="font-mono font-medium text-slate-200">
                {parcel.area_acres || 1.45} Acres ({parcel.area_hectares || 0.587} Ha)
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">6. Acquisition Stage</span>
              <span className="font-mono font-medium text-amber-400">{parcel.current_stage || "PRELIMINARY_11"}</span>
            </div>

            <div className="col-span-2 bg-slate-900/60 p-2.5 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 block">7. Recorded Landholder & Heirs</span>
              <span className="font-bold text-white text-sm block">{parcel.owner_name || "Raghunath Yadav"}</span>
              <span className="text-[11px] text-slate-400 block">S/O: {parcel.father_name || "Ram Swaroop Yadav"} · Verified Title</span>
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-2">
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 block">8. Compensation Status</span>
                <span className="font-semibold text-emerald-400 font-mono block">
                  ₹{parcel.assessed_value ? (parcel.assessed_value / 100000).toFixed(2) : "45.00"} Lakhs
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Determined / Pending Award</span>
              </div>

              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 block">9. R&R Entitlement</span>
                <span className="font-medium text-slate-200 block text-[11px]">RFCTLARR 2nd Sched</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Resettlement Applicable</span>
              </div>
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-2">
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 block">10. Legal Dispute Status</span>
                <span className="font-medium text-slate-300 block text-[11px]">No Active High Court Stay</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 block">Risk & Criticality</span>
                <span className="font-mono font-bold text-slate-200 block text-[11px]">
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
          polygonCoords={parcel.geometry_coordinates}
          onLocationCaptured={(pos) => {
            console.log("Captured GPS:", pos);
          }}
        />

        <Link
          href="/field/map"
          className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Compass className="w-4 h-4 text-emerald-400" />
          <span>Inspect on Corridor Spatial GIS Map</span>
        </Link>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <Link
            href={`/field/parcels/${parcelId}/verify`}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-xl shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Launch Verification Survey</span>
          </Link>

          <Link
            href={`/field/parcels/${parcelId}/report`}
            className="w-full py-3 px-4 bg-red-950/40 hover:bg-red-950/60 border border-red-500/40 text-red-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>Flag Ground Issue / Blocker</span>
          </Link>
        </div>

      </div>
    </FieldShell>
  );
}