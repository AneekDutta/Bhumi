"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Layers, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  PlusCircle, 
  ShieldCheck, 
  FileText, 
  Sparkles,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { LandownerShell } from "@/components/landowner/LandownerShell";
import { getLandownerParcels, getLandownerComplaints } from "@/lib/api";
import { useRealtimeComplaints } from "@/lib/supabase/useRealtime";

export default function LandownerHomePage() {
  const [parcels, setParcels] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState<any>({
    owner_id: "O00004",
    name: "Geeta Meena",
    contact_village: "Chandwas (V03)"
  });

  useEffect(() => {
    // Read session
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

    async function fetchData() {
      setLoading(true);
      try {
        const [pData, cData] = await Promise.all([
          getLandownerParcels(offId),
          getLandownerComplaints({ owner_id: offId })
        ]);
        setParcels(pData || []);
        setComplaints(cData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Supabase Realtime for instant grievance status updates
  useRealtimeComplaints(owner.owner_id, async () => {
    try {
      const cData = await getLandownerComplaints({ owner_id: owner.owner_id });
      setComplaints(cData || []);
    } catch {}
  });

  const totalAreaHectares = parcels.reduce((sum, p) => sum + (p.area_hectares || 0.4), 0).toFixed(2);
  const activeComplaints = complaints.filter((c) => c.status !== "RESOLVED" && c.status !== "REJECTED").length;
  const resolvedComplaints = complaints.filter((c) => c.status === "RESOLVED").length;

  return (
    <LandownerShell title="My Land & Rights">
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Welcome Profile Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base flex-shrink-0">
                {owner.name.slice(0, 1)}
              </div>
              <div>
                <h1 className="font-bold text-white text-base font-display">
                  {owner.name}
                </h1>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>{owner.contact_village} · ID: {owner.owner_id}</span>
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Verified Titleholder
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Registered Land</span>
              <span className="text-base font-bold text-white font-mono">{parcels.length} Parcels</span>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Total Area</span>
              <span className="text-base font-bold text-emerald-400 font-mono">{totalAreaHectares} Ha</span>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Grievances</span>
              <span className="text-base font-bold text-amber-400 font-mono">{activeComplaints} Active</span>
            </div>
          </div>
        </div>

        {/* Hero CTA: Lodge Complaint */}
        <Link
          href="/landowner/complaints/new"
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-950/40 border border-emerald-400/30 flex items-center justify-between transition-all group"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-emerald-100 text-xs font-bold uppercase tracking-wider font-mono">
              <PlusCircle className="w-4 h-4 text-white" />
              <span>Need Assistance or Facing an Issue?</span>
            </div>
            <h2 className="text-sm font-extrabold text-white">
              Lodge a Grievance or Complaint
            </h2>
            <p className="text-[11px] text-emerald-100/90 leading-tight">
              Report compensation delays, boundary disputes, or title mismatches for immediate on-site field verification.
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-3">
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Section: My Land Parcels */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>My Authorized Land Parcels ({parcels.length})</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-500">PostGIS Authentic</span>
          </div>

          <div className="space-y-2.5">
            {parcels.map((parcel) => {
              const pId = parcel.parcel_id || parcel.id;
              const survey = parcel.survey_number || parcel.survey_no || pId;
              const village = parcel.village_name || owner.contact_village;
              const area = parcel.area_hectares || (parcel.area_sqm ? (parcel.area_sqm / 10000).toFixed(2) : "0.50");
              const stage = parcel.acquisition_status || "award_declared";

              return (
                <div
                  key={pId}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          Survey #{survey}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400">
                          {pId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>Village: {village} · NH-927A Corridor</span>
                      </p>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {stage.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800/60 font-mono">
                    <div>
                      <span className="text-slate-500 block text-[9px]">Acquired Area</span>
                      <span className="text-slate-200 font-semibold">{area} Hectares (~{(Number(area) * 2.471).toFixed(2)} Acres)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Land Classification</span>
                      <span className="text-slate-200 font-semibold capitalize">{parcel.classification || "Agricultural"}</span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Title Deed Registered in CALA Records</span>
                    </span>
                    <Link
                      href={`/landowner/complaints/new?parcel_id=${pId}`}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>Report Issue →</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Recent Grievances */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Recent Grievances & Appeals ({complaints.length})</span>
            </h2>
            <Link
              href="/landowner/complaints"
              className="text-[11px] text-emerald-400 hover:underline font-medium"
            >
              View All
            </Link>
          </div>

          {complaints.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto" />
              <p className="text-xs text-slate-300 font-medium">No complaints lodged</p>
              <p className="text-[11px] text-slate-500">
                You have no active disputes or grievance appeals on record.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {complaints.slice(0, 3).map((cmp) => {
                const isResolved = cmp.status === "RESOLVED";
                const isVerified = cmp.status === "VERIFIED";

                return (
                  <Link
                    key={cmp.id}
                    href={`/landowner/complaints/${cmp.id}`}
                    className="block bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3 space-y-2 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">
                            {cmp.complaint_id}
                          </span>
                          <span className="text-[10px] text-slate-500">·</span>
                          <span className="text-xs font-bold text-white">
                            {cmp.complaint_type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {cmp.description}
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase flex-shrink-0 border ${
                          isResolved
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : isVerified
                            ? "bg-teal-500/15 text-teal-300 border-teal-500/30"
                            : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {cmp.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                      <span>Parcel: {cmp.parcel_id}</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <span>Track Status</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </LandownerShell>
  );
}
