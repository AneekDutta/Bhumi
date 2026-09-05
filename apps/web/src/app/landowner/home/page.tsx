"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Layers, 
  MapPin, 
  ArrowRight, 
  PlusCircle, 
  ShieldCheck, 
  Clock,
  RefreshCw,
  AlertCircle,
  Compass,
  UploadCloud,
  FileText
} from "lucide-react";
import { LandownerShell } from "@/components/landowner/LandownerShell";
import { getLandownerParcels, getLandownerComplaints, getLandownerBoundaries } from "@/lib/api";
import { useRealtimeComplaints } from "@/lib/supabase/useRealtime";

export default function LandownerHomePage() {
  const router = useRouter();
  const [parcels, setParcels] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [boundaries, setBoundaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState<any>(null);

  useEffect(() => {
    // 1. Read authenticated session
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const sessionCookie = cookies.find((c) => c.startsWith("bhumi_landowner_session=") || c.startsWith("bhumi_officer_session="));
    
    let activeOwnerId: string | null = null;
    let activeOwnerName = "Citizen Titleholder";
    let activeVillage = "Corridor Sector";

    if (sessionCookie) {
      try {
        const val = decodeURIComponent(sessionCookie.split("=")[1]);
        const parsed = JSON.parse(val);
        if (parsed?.user_id || parsed?.owner_id) {
          activeOwnerId = parsed.user_id || parsed.owner_id;
          activeOwnerName = parsed.name || activeOwnerName;
          activeVillage = parsed.contact_village || parsed.village || activeVillage;
          setOwner({
            owner_id: activeOwnerId,
            name: activeOwnerName,
            contact_village: activeVillage,
            email: parsed.email
          });
        }
      } catch {}
    }

    if (!activeOwnerId) {
      // Redirect to login if unauthenticated
      router.push("/landowner/login");
      return;
    }

    async function fetchData() {
      setLoading(true);
      try {
        const [pData, cData, bData] = await Promise.all([
          getLandownerParcels(activeOwnerId!),
          getLandownerComplaints({ owner_id: activeOwnerId! }),
          getLandownerBoundaries({ owner_id: activeOwnerId! })
        ]);
        setParcels(pData || []);
        setComplaints(cData || []);
        setBoundaries(bData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  // Supabase Realtime for instant grievance status updates
  useRealtimeComplaints(owner?.owner_id || "", async () => {
    if (!owner?.owner_id) return;
    try {
      const cData = await getLandownerComplaints({ owner_id: owner.owner_id });
      setComplaints(cData || []);
    } catch {}
  });

  if (loading || !owner) {
    return (
      <LandownerShell title="My Land & Rights">
        <div className="py-24 text-center text-xs text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
          <span>Loading citizen land records from Supabase...</span>
        </div>
      </LandownerShell>
    );
  }

  const totalAreaHectares = parcels.reduce((sum, p) => sum + (p.area_hectares || 0), 0).toFixed(2);
  const activeComplaints = complaints.filter((c) => c.status !== "RESOLVED" && c.status !== "REJECTED").length;

  return (
    <LandownerShell title="My Land & Rights">
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        
        {/* Welcome Profile Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-base flex-shrink-0">
                {owner.name.slice(0, 1)}
              </div>
              <div>
                <h1 className="font-bold text-white text-base font-display">
                  {owner.name}
                </h1>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>{owner.contact_village}</span>
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Registered Citizen
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
              <span className="text-base font-bold text-amber-400 font-mono">{totalAreaHectares} Ha</span>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Grievances</span>
              <span className="text-base font-bold text-emerald-400 font-mono">{activeComplaints} Active</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Hero CTA 1: Mark Boundary */}
          <Link
            href="/landowner/boundary/new"
            className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/30 flex items-center justify-between transition-all group"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-emerald-100 text-xs font-bold uppercase tracking-wider font-mono">
                <Compass className="w-4 h-4 text-white" />
                <span>Mark Land Boundary</span>
              </div>
              <h2 className="text-sm font-extrabold text-white">
                Walk & Record GPS Corners
              </h2>
              <p className="text-[11px] text-emerald-100/90 leading-tight">
                Walk your parcel perimeter with your device to record real GPS corner points for field officer verification.
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-3">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Hero CTA 2: Lodge Complaint */}
          <Link
            href="/landowner/complaints/new"
            className="p-4 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-950/40 border border-amber-400/30 flex items-center justify-between transition-all group"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-amber-100 text-xs font-bold uppercase tracking-wider font-mono">
                <PlusCircle className="w-4 h-4 text-white" />
                <span>Facing a Problem?</span>
              </div>
              <h2 className="text-sm font-extrabold text-white">
                Lodge Grievance / Inquiry
              </h2>
              <p className="text-[11px] text-amber-100/90 leading-tight">
                Report compensation delays, demarcation issues, or title errors for immediate on-site field review.
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-3">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* Section: My Land Parcels */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>My Registered Land Parcels ({parcels.length})</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-500">PostGIS Authentic</span>
          </div>

          <div className="space-y-2.5">
            {parcels.length === 0 ? (
              <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                    No registered parcel linked to this account.
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    You can still report an issue by providing your documents and marking the approximate land boundary.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <Link
                    href="/landowner/boundary/new"
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Mark Land Boundary</span>
                  </Link>
                  <Link
                    href="/landowner/complaints/new#documents"
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Documents</span>
                  </Link>
                  <Link
                    href="/landowner/complaints/new"
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold transition-all shadow-md"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Submit Complaint</span>
                  </Link>
                </div>
              </div>
            ) : (
              parcels.map((parcel) => {
                const pId = parcel.parcel_id || parcel.id;
                const survey = parcel.survey_number || parcel.survey_no || pId;
                const village = parcel.village_name || owner.contact_village;
                const area = parcel.area_hectares || (parcel.area_sqm ? (parcel.area_sqm / 10000).toFixed(2) : "0.50");
                const stage = parcel.acquisition_status || "award_declared";
                const claimedBoundary = boundaries.find(
                  (b) => b.parcel_id === pId || b.metadata?.parcel_id === pId
                );

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
                        <span className="text-slate-200 font-semibold">{area} Hectares</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Land Classification</span>
                        <span className="text-slate-200 font-semibold capitalize">{parcel.classification || "Agricultural"}</span>
                      </div>
                    </div>

                    {/* Claimed Boundary Info if recorded */}
                    {claimedBoundary && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs space-y-1 font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                            <Compass className="w-3 h-3" />
                            <span>Claimed Boundary</span>
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40">
                            {claimedBoundary.status || "CLAIMED / UNVERIFIED"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-0.5">
                          <span className="text-slate-200 font-semibold">
                            {claimedBoundary.area_sqm
                              ? `${claimedBoundary.area_sqm.toLocaleString()} m² (${claimedBoundary.area_acres || (claimedBoundary.area_sqm * 0.000247105).toFixed(3)} ac)`
                              : "Area recorded"}
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            {claimedBoundary.boundary_points?.length || 0} GPS Points
                          </span>
                        </div>
                        {claimedBoundary.area_uncertainty_sqm ? (
                          <div className="text-[10px] text-slate-400">
                            Uncertainty: ±{claimedBoundary.area_uncertainty_sqm.toFixed(1)} m² (derived from device accuracy)
                          </div>
                        ) : null}
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/60">
                      <Link
                        href={`/landowner/boundary/new?parcel_id=${pId}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>{claimedBoundary ? "Re-mark GPS Boundary" : "Mark Land Boundary"}</span>
                      </Link>

                      <Link
                        href={`/landowner/complaints/new?parcel_id=${pId}`}
                        className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline font-semibold flex items-center gap-1"
                      >
                        <span>Report Issue →</span>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section: Recent Grievances */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              My Grievances & Inquiries ({complaints.length})
            </h2>
            <Link href="/landowner/complaints" className="text-[11px] text-amber-400 hover:underline">
              View All →
            </Link>
          </div>

          <div className="space-y-2">
            {complaints.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400">
                <span>No complaints lodged. Everything in order.</span>
              </div>
            ) : (
              complaints.slice(0, 3).map((comp) => {
                const cId = comp.complaint_id || comp.id;
                return (
                  <Link
                    key={cId}
                    href={`/landowner/complaints/${cId}`}
                    className="block bg-slate-900 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs font-mono">
                        #{comp.complaint_id || cId.slice(0, 8)}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {comp.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                      {comp.complaint_type || comp.title}
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </div>

      </div>
    </LandownerShell>
  );
}
