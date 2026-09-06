"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  AlertOctagon,
  Flame,
  Camera,
  Send,
  Save,
  CheckCircle2,
  MapPin,
  Locate,
  Crosshair,
  RefreshCw
} from "lucide-react";
import { FieldShell } from "@/components/field/FieldShell";
import { STRUCTURED_ISSUE_TYPES } from "@/components/field/ReportIssueForm";
import { CapturePhoto } from "@/components/field/CapturePhoto";
import { CapturedPhoto } from "@/lib/native/camera";
import { submitFieldVerification, getFieldParcels } from "@/lib/api";
import { offlineStore, QueuedVerification } from "@/lib/offlineStore";
import { SubmissionStatusModal } from "@/components/field/SubmissionStatusModal";
import { FieldSpatialMap } from "@/components/field/FieldSpatialMap";

export default function ReportIssuePage() {
  const params = useParams();
  const router = useRouter();
  const parcelId = (params?.parcelId as string) || "";

  const [parcel, setParcel] = useState<any>(null);
  const [issueType, setIssueType] = useState("ownership_mismatch");
  const [issueSeverity, setIssueSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL_STOPPAGE">("CRITICAL_STOPPAGE");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState<any>(null);

  // Real GPS & Map Anchor State
  const [incidentLocation, setIncidentLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const list = await getFieldParcels();
        const p = list.find((x: any) => x.parcel_id === parcelId || x.id === parcelId);
        if (p) {
          setParcel(p);
          if (p.centroid_lat && p.centroid_lng) {
            setIncidentLocation({
              lat: p.centroid_lat,
              lng: p.centroid_lng,
              accuracy: 5.0
            });
          }
        }
      } catch {}
    }
    load();
  }, [parcelId]);

  // Construct real GeoJSON polygon for this parcel
  const parcelGeoJSON = useMemo(() => {
    const lat = parcel?.centroid_lat || 24.6492;
    const lng = parcel?.centroid_lng || 75.9284;
    const coords = parcel?.geometry_coordinates;

    if (coords && coords.length > 0) {
      return {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [coords]
          },
          properties: {
            parcel_id: parcelId,
            survey_number: parcel?.survey_no || "-",
            acquisition_status: "disputed"
          }
        }],
        properties: { center: [lng, lat] }
      };
    }

    const dLng = 0.0006;
    const dLat = 0.0004;
    return {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [lng - dLng, lat - dLat],
            [lng + dLng, lat - dLat],
            [lng + dLng, lat + dLat],
            [lng - dLng, lat + dLat],
            [lng - dLng, lat - dLat],
          ]]
        },
        properties: {
          parcel_id: parcelId,
          survey_number: parcel?.survey_no || "-",
          acquisition_status: "disputed"
        }
      }],
      properties: { center: [lng, lat] }
    };
  }, [parcel, parcelId]);

  const handleAcquireDeviceGPS = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setIncidentLocation({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy)
        });
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (forceOffline = false) => {
    setSubmitting(true);
    const active = offlineStore.getActiveOfficer();

    const finalLat = incidentLocation?.lat || parcel?.centroid_lat || 24.6492;
    const finalLng = incidentLocation?.lng || parcel?.centroid_lng || 75.9284;
    const finalAccuracy = incidentLocation?.accuracy || 4.0;

    const payload = {
      parcel_id: parcelId,
      officer_id: active?.officer_id || active?.id || "OFF-001",
      officer_name: active?.name || "Field Officer",
      verification_type: "field",
      status: "disputed",
      has_issue: true,
      issue_type: issueType,
      issue_severity: issueSeverity,
      observations: description,
      remarks: `Urgent blocker escalation: ${issueType} (Severity: ${issueSeverity})`,
      gps_lat: finalLat,
      gps_lng: finalLng,
      gps_accuracy: finalAccuracy,
      photos: photos.map((p) => ({
        id: p.id,
        url: p.dataUrl,
        caption: p.caption,
        category: p.category,
        timestamp: p.timestamp
      }))
    };

    if (!navigator.onLine || forceOffline) {
      const queued: QueuedVerification = {
        id: `queue_${Date.now()}`,
        timestamp: Date.now(),
        payload: payload as any,
        synced: false
      };
      offlineStore.add(queued);
      setSubmitting(false);
      setResponse({
        success: true,
        offline: true,
        verification_id: queued.id,
        parcel_id: parcelId,
        message: "Issue logged offline. Will propagate to CPM graph as soon as connection is restored."
      });
      return;
    }

    try {
      const res = await submitFieldVerification(payload);
      setResponse(res);
    } catch {
      const queued: QueuedVerification = {
        id: `queue_${Date.now()}`,
        timestamp: Date.now(),
        payload: payload as any,
        synced: false
      };
      offlineStore.add(queued);
      setResponse({
        success: true,
        offline: true,
        verification_id: queued.id,
        parcel_id: parcelId,
        message: "Intermittent connectivity. Issue queued locally for auto-sync."
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (response) {
    return (
      <FieldShell title="Blocker Escalated">
        <SubmissionStatusModal
          response={response}
          parcelId={parcelId}
          surveyNo={parcel?.survey_no}
          villageName={parcel?.village_name}
          onDone={() => router.push("/field/parcels")}
        />
      </FieldShell>
    );
  }

  const sNo = parcel?.survey_no || parcel?.survey_number || "-";

  return (
    <FieldShell title={`Report Blocker: Survey ${sNo}`} showBack>
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        <div className="flex items-center justify-between">
          <Link
            href={`/field/parcels/${parcelId}`}
            className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0B2E59] dark:text-slate-400 dark:hover:text-white transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Parcel
          </Link>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] bg-[#FFEBEE] dark:bg-rose-950/40 border border-[#FFCDD2] dark:border-rose-800/40 text-[#B32424] dark:text-rose-300 uppercase">
            Statutory Escalation
          </span>
        </div>

        {/* Issue Type Selector */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-3">
          <label className="text-xs font-bold text-[#14213D] dark:text-white block">
            Select Issue / Dispute Type
          </label>
          <div className="space-y-2">
            {STRUCTURED_ISSUE_TYPES.map((t) => (
              <label
                key={t.key}
                onClick={() => setIssueType(t.key)}
                className={`p-3 rounded-[4px] border flex items-center justify-between cursor-pointer transition-all ${
                  issueType === t.key
                    ? "bg-[#FFEBEE] dark:bg-rose-950/30 border-[#B32424] text-[#14213D] dark:text-white shadow-xs"
                    : "bg-[#F8FAFC] dark:bg-[#07080F] border-[#DCE2E8] dark:border-white/10 text-[#333333] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <div>
                  <span className="font-bold text-xs block">{t.label}</span>
                  <span className="text-[10px] text-[#64748B] dark:text-slate-400 block">{t.desc}</span>
                </div>
                <input
                  type="radio"
                  name="issue_type"
                  checked={issueType === t.key}
                  onChange={() => setIssueType(t.key)}
                  className="text-[#B32424] focus:ring-[#B32424]"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Severity Selector */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-3">
          <label className="text-xs font-bold text-[#14213D] dark:text-white block">
            Impact Severity Level
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL_STOPPAGE'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setIssueSeverity(sev)}
                className={`py-2 px-1 text-center rounded-[3px] text-[10px] font-bold uppercase border transition-all cursor-pointer ${
                  issueSeverity === sev
                    ? sev === 'CRITICAL_STOPPAGE'
                      ? "bg-[#B32424] border-[#B32424] text-white shadow-xs"
                      : "bg-[#B36B00] border-[#B36B00] text-white shadow-xs"
                    : "bg-[#F8FAFC] dark:bg-[#07080F] border-[#DCE2E8] dark:border-white/10 text-[#64748B] dark:text-slate-400 hover:bg-slate-100"
                }`}
              >
                {sev === 'CRITICAL_STOPPAGE' ? 'CRITICAL' : sev}
              </button>
            ))}
          </div>

          <div className="bg-[#FFEBEE] dark:bg-rose-950/30 border border-[#FFCDD2] dark:border-rose-800/40 rounded-[4px] p-3 text-[11px] text-[#B32424] dark:text-rose-200 flex items-start gap-2">
            <Flame className="w-4 h-4 flex-shrink-0 text-[#B32424] dark:text-rose-400 mt-0.5" />
            <div>
              <strong className="block mb-0.5">Causal CPM Stoppage Warning:</strong>
              Escalating this blocker will immediately inject a blocking dependency edge into the project CPM Network, recalculate project completion float, and alert the CALA desktop dashboard.
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SPATIAL INCIDENT LOCATION ANCHOR (MapLibre GL Map Picker)                 */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#14213D] dark:text-white">
              <MapPin className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
              <span>Incident Geographic Position &amp; GPS Anchor</span>
            </div>

            <button
              type="button"
              onClick={handleAcquireDeviceGPS}
              disabled={locating}
              className="px-2.5 py-1 rounded-[3px] bg-[#E6F0FA] dark:bg-sky-950/40 border border-[#B8D5ED] dark:border-sky-800/40 text-[#0B5FA5] dark:text-sky-300 hover:bg-[#D4E8F8] text-[10px] font-mono flex items-center gap-1 transition-all"
            >
              {locating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Locate className="w-3 h-3" />}
              <span>Use My GPS</span>
            </button>
          </div>

          <p className="text-[11px] text-[#64748B] dark:text-slate-400">
            Tap anywhere on the map or use your device GPS to anchor the incident at its real geographic coordinates:
          </p>

          <div className="relative w-full h-48 rounded-[4px] border border-[#DCE2E8] dark:border-white/10 overflow-hidden shadow-inner">
            <FieldSpatialMap
              geojson={parcelGeoJSON}
              height="100%"
              initialCenter={incidentLocation ? [incidentLocation.lng, incidentLocation.lat] : [75.9284, 24.6492]}
              initialZoom={16}
              locationPicker={true}
              pickedLocation={incidentLocation}
              onLocationPick={(loc) => setIncidentLocation(loc)}
              showControls={false}
            />
          </div>

          {incidentLocation && (
            <div className="flex items-center justify-between text-[10px] font-mono text-[#14213D] dark:text-slate-300 bg-[#F8FAFC] dark:bg-[#07080F] p-2.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
              <span>Anchored: {incidentLocation.lat.toFixed(5)}°N, {incidentLocation.lng.toFixed(5)}°E</span>
              <span className="text-[#1E7E34] dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Real Spatial Coordinate
              </span>
            </div>
          )}
        </div>

        {/* Evidence Photos */}
        <CapturePhoto
          photos={photos}
          onAddPhoto={(p) => setPhotos((prev) => [...prev, p])}
          onRemovePhoto={(id) => setPhotos((prev) => prev.filter((p) => p.id !== id))}
        />

        {/* Issue Description */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-2">
          <label className="text-xs font-bold text-[#14213D] dark:text-white block">
            Ground Observations &amp; Evidence Notes
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Detail the exact nature of the dispute, parties involved, survey resistance, legal notice claims..."
            className="w-full bg-[#F8FAFC] dark:bg-[#07080F] border border-[#CBD5E1] dark:border-white/15 rounded-[4px] px-3 py-2 text-xs text-[#14213D] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#B32424] resize-none"
          />
        </div>

        {/* Submit Actions */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(false)}
            className="w-full py-3 px-4 bg-[#B32424] hover:bg-[#8B1A1A] disabled:bg-slate-400 text-white rounded-[4px] text-xs font-bold uppercase tracking-wider shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{submitting ? "Triggering Causal Propagation..." : "Escalate Blocker with GPS Coordinates"}</span>
          </button>
        </div>

      </div>
    </FieldShell>
  );
}