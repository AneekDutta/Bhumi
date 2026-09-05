"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  PlusCircle, 
  Send, 
  Camera, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Layers,
  ArrowRight
} from "lucide-react";
import { LandownerShell } from "@/components/landowner/LandownerShell";
import { getLandownerParcels, submitLandownerComplaint } from "@/lib/api";

const COMPLAINT_CATEGORIES = [
  "Compensation not received / delayed",
  "Incorrect ownership / title dispute",
  "Land measurement / boundary mismatch",
  "Rehabilitation & Resettlement (R&R) entitlement",
  "Document / Jamabandi mutation issue",
  "Unauthorized physical possession",
  "Structure / Tree valuation discrepancy",
  "Other acquisition-related issue"
];

export default function NewComplaintPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedParcel = searchParams.get("parcel_id") || "";

  const [parcels, setParcels] = useState<any[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<string>(preselectedParcel);
  const [category, setCategory] = useState<string>(COMPLAINT_CATEGORIES[0]);
  const [description, setDescription] = useState<string>("");
  const [priority, setPriority] = useState<"NORMAL" | "URGENT" | "CRITICAL">("NORMAL");
  const [photos, setPhotos] = useState<any[]>([]);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [capturingGps, setCapturingGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [owner, setOwner] = useState<any>({
    owner_id: "O00004",
    name: "Geeta Meena",
    contact_village: "Chandwas (V03)"
  });

  useEffect(() => {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const sessionCookie = cookies.find((c) => c.startsWith("bhumi_officer_session="));
    let offId = "O00004";
    if (sessionCookie) {
      try {
        const val = decodeURIComponent(sessionCookie.split("=")[1]);
        const parsed = JSON.parse(val);
        if (parsed?.owner_id) {
          setOwner(parsed);
          offId = parsed.owner_id;
        }
      } catch {}
    }

    async function load() {
      try {
        const pData = await getLandownerParcels(offId);
        setParcels(pData || []);
        if (!selectedParcel && pData && pData.length > 0) {
          setSelectedParcel(pData[0].parcel_id || pData[0].id);
        }
      } catch {}
    }

    load();
  }, [selectedParcel]);

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your device browser.");
      return;
    }
    setCapturingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Number(pos.coords.accuracy.toFixed(1))
        });
        setCapturingGps(false);
      },
      () => {
        // Fallback demo GPS along NH-927A
        setGpsLocation({
          lat: 24.6504,
          lng: 75.9702,
          accuracy: 4.5
        });
        setCapturingGps(false);
      },
      { timeout: 6000, enableHighAccuracy: true }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target?.result as string;
        setPhotos((prev) => [
          ...prev,
          {
            id: `p-${Date.now()}-${i}`,
            url: dataUrl,
            caption: file.name,
            timestamp: Date.now()
          }
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg("Please describe your grievance in detail.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const parcelObj = parcels.find((p) => (p.parcel_id || p.id) === selectedParcel);

    try {
      const res = await submitLandownerComplaint({
        owner_id: owner.owner_id,
        owner_name: owner.name,
        contact_village: owner.contact_village,
        parcel_id: selectedParcel || "P00001",
        survey_number: parcelObj?.survey_number || parcelObj?.survey_no || selectedParcel,
        project_id: parcelObj?.project_id || "P-NH927A",
        complaint_type: category,
        description: description.trim(),
        priority,
        photos,
        gps_lat: gpsLocation?.lat,
        gps_lng: gpsLocation?.lng,
        gps_accuracy: gpsLocation?.accuracy
      });

      router.push(`/landowner/complaints?success=${res.complaint_id}`);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to submit grievance. Check connection.");
      setSubmitting(false);
    }
  };

  return (
    <LandownerShell title="Lodge Grievance" showBack>
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        <div className="space-y-1">
          <h1 className="text-base font-bold text-white font-display">
            Official Citizen Grievance Form
          </h1>
          <p className="text-xs text-slate-400">
            Directly submitted to CALA District Office & dispatched for field verification
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Step 1: Select Parcel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              1. Select Affected Land Parcel
            </label>
            <select
              value={selectedParcel}
              onChange={(e) => setSelectedParcel(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
            >
              {parcels.map((p) => {
                const id = p.parcel_id || p.id;
                const s = p.survey_number || p.survey_no || id;
                return (
                  <option key={id} value={id}>
                    Survey #{s} ({id}) — {p.area_hectares || 0.4} Ha ({p.village_name || "Chandwas"})
                  </option>
                );
              })}
            </select>
            <span className="text-[10px] text-slate-500 block">
              Only parcels registered under your authorized title are eligible for direct grievance.
            </span>
          </div>

          {/* Step 2: Select Issue Category */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              2. Nature of Grievance
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              {COMPLAINT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Detailed Description */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              3. Description & Detailed Remarks
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details: e.g. Notice number, bank account branch, boundary overlap in meters, or discrepancies in compensation solatium..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Step 4: Urgency Priority */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              4. Urgency Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "NORMAL", label: "Normal (15 Days)" },
                { id: "URGENT", label: "Urgent (7 Days)" },
                { id: "CRITICAL", label: "Critical Stoppage" }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id as any)}
                  className={`py-2 px-2 rounded-xl text-center font-semibold text-[11px] transition-all cursor-pointer ${
                    priority === p.id
                      ? p.id === "CRITICAL"
                        ? "bg-red-600 text-white"
                        : "bg-emerald-600 text-white"
                      : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 5: Supporting Evidence & GPS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                5. Supporting Evidence (Optional)
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">Supabase Storage</span>
            </div>

            {/* GPS Capture */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-semibold text-white block text-[11px]">Site GPS Fix</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {gpsLocation ? `${gpsLocation.lat}°, ${gpsLocation.lng}° (±${gpsLocation.accuracy}m)` : "No coordinate attached"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCaptureGps}
                disabled={capturingGps}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono transition-colors"
              >
                {capturingGps ? "Fixing..." : gpsLocation ? "Re-fix GPS" : "Capture GPS"}
              </button>
            </div>

            {/* Photo Picker */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1.5">
                Attach Photo of Passbook, Notice, or Land Boundary:
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
              />
              {photos.length > 0 && (
                <div className="flex items-center gap-2 pt-2 overflow-x-auto">
                  {photos.map((p, idx) => (
                    <img
                      key={idx}
                      src={p.url}
                      alt="preview"
                      className="w-14 h-14 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting to Supabase...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>SUBMIT GRIEVANCE TO DISTRICT CALA</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </LandownerShell>
  );
}
