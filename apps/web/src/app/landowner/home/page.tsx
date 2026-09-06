"use client";
import { createClient } from "@/lib/supabase/client";

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
  FileText,
  Eye,
  FileCheck2,
  CheckCircle2
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
    async function init() {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      let activeOwnerId = null;
      let activeOwnerName = "Citizen Titleholder";
      let activeVillage = "Corridor Sector";

      if (authData?.user) {
        activeOwnerId = authData.user.id;
        activeOwnerName = authData.user.user_metadata?.full_name || activeOwnerName;
        setOwner({
          owner_id: activeOwnerId,
          name: activeOwnerName,
          contact_village: activeVillage,
          email: authData.user.email
        });
      } else {
        router.push("/landowner/login");
        return;
      }

      try {
        const [pData, cData, bData] = await Promise.all([
          getLandownerParcels(activeOwnerId),
          getLandownerComplaints({ owner_id: activeOwnerId }),
          getLandownerBoundaries({ owner_id: activeOwnerId })
        ]);
        setParcels(pData || []);
        setComplaints(cData || []);
        setBoundaries(bData || []);
      } catch (err) {
        console.error("Error loading home data:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  // Realtime subscription for instant grievance status updates
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
          <span>Loading citizen land records...</span>
        </div>
      </LandownerShell>
    );
  }

  const totalAreaHectares = parcels.reduce((sum, p) => sum + (p.area_hectares || 0), 0).toFixed(2);
  const activeComplaints = complaints.filter((c) => c.status !== "RESOLVED" && c.status !== "REJECTED").length;

  return (
    <LandownerShell title="My Land & Rights">
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-28">
        
        {/* Welcome Profile Card */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[4px] bg-[#E8F1FA] dark:bg-sky-950/40 border border-[#B8D5E5] dark:border-sky-800/40 flex items-center justify-center text-[#0B2E59] dark:text-sky-300 font-bold text-base shrink-0">
                {owner.name.slice(0, 1)}
              </div>
              <div>
                <h1 className="font-bold text-[#14213D] dark:text-white text-base">
                  {owner.name}
                </h1>
                <p className="text-xs text-[#555555] dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-[#B36B00] dark:text-amber-400" />
                  <span>{owner.contact_village}</span>
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-bold bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-400 border border-[#C8E6C9] dark:border-emerald-800/50">
              Registered Citizen
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#DCE2E8] dark:border-white/10 text-center">
            <div className="bg-[#F8FAFC] dark:bg-white/[0.02] p-2.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
              <span className="text-[#64748B] dark:text-slate-400 block text-[10px]">Registered Land</span>
              <span className="text-sm font-bold text-[#14213D] dark:text-white font-mono">{parcels.length} Parcels</span>
            </div>
            <div className="bg-[#F8FAFC] dark:bg-white/[0.02] p-2.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
              <span className="text-[#64748B] dark:text-slate-400 block text-[10px]">Total Area</span>
              <span className="text-sm font-bold text-[#0B5FA5] dark:text-sky-400 font-mono">{totalAreaHectares} Ha</span>
            </div>
            <div className="bg-[#F8FAFC] dark:bg-white/[0.02] p-2.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
              <span className="text-[#64748B] dark:text-slate-400 block text-[10px]">Grievances</span>
              <span className="text-sm font-bold text-[#1E7E34] dark:text-emerald-400 font-mono">{activeComplaints} Active</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Hero CTA 1: Register New Parcel */}
          <Link
            href="/landowner/parcels/new"
            className="p-4 rounded-[4px] bg-white dark:bg-[#0D121F] hover:bg-slate-50 dark:hover:bg-white/5 border-2 border-[#0B2E59] dark:border-sky-500 shadow-sm flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-[#0B2E59] dark:text-sky-400 text-xs font-bold uppercase tracking-wider font-mono">
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Statutory Prerequisite</span>
              </div>
              <h2 className="text-sm font-bold text-[#14213D] dark:text-white">
                Register New Parcel
              </h2>
              <p className="text-[11px] text-[#555555] dark:text-slate-400 leading-tight">
                Demarcate corners, authenticate Aadhaar, and obtain your official 14-digit Parcel ID.
              </p>
            </div>
            <div className="w-7 h-7 rounded-[4px] bg-[#E8F1FA] dark:bg-sky-950/40 text-[#0B2E59] dark:text-sky-300 flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0 ml-3">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Hero CTA 2: Lodge Grievance / File Complaint */}
          <Link
            href="/landowner/complaints/new"
            className="p-4 rounded-[4px] bg-white dark:bg-[#0D121F] hover:bg-slate-50 dark:hover:bg-white/5 border-2 border-[#B36B00] dark:border-amber-500 shadow-sm flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-[#B36B00] dark:text-amber-400 text-xs font-bold uppercase tracking-wider font-mono">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>File Grievance</span>
              </div>
              <h2 className="text-sm font-bold text-[#14213D] dark:text-white">
                Lodge Land Complaint
              </h2>
              <p className="text-[11px] text-[#555555] dark:text-slate-400 leading-tight">
                Report compensation delays, boundary disputes, or title mismatches on your registered parcel.
              </p>
            </div>
            <div className="w-7 h-7 rounded-[4px] bg-[#FFF8E1] dark:bg-amber-950/40 text-[#B36B00] dark:text-amber-400 flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0 ml-3">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* Section: My Registered Land Parcels */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-[#14213D] dark:text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#0B2E59] dark:text-sky-400" />
              <span>My Registered Land Parcels ({parcels.length})</span>
            </h2>
            <Link
              href="/landowner/parcels/new"
              className="text-[11px] font-semibold text-[#0B5FA5] dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register Parcel</span>
            </Link>
          </div>

          <div className="space-y-3">
            {parcels.length === 0 ? (
              <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-6 text-center space-y-3 shadow-sm">
                <div className="w-10 h-10 rounded-[4px] bg-[#FFF8E1] dark:bg-amber-950/40 border border-[#FFE082] dark:border-amber-800/50 flex items-center justify-center text-[#B36B00] dark:text-amber-400 mx-auto">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-xs font-bold text-[#14213D] dark:text-white uppercase tracking-wide">
                    No registered parcels found.
                  </h3>
                  <p className="text-xs text-[#555555] dark:text-slate-400 leading-relaxed">
                    Under statutory grievance rules, you must first register your parcel of land before you can file a complaint against it.
                  </p>
                </div>
                <div className="pt-1">
                  <Link
                    href="/landowner/parcels/new"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white text-xs font-semibold transition-all shadow-xs"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Register New Parcel</span>
                  </Link>
                </div>
              </div>
            ) : (
              parcels.map((parcel) => {
                const pId = parcel.parcel_id || parcel.id;
                const ownerName = parcel.owner_legal_name || parcel.owner_name || owner.name;
                const village = parcel.village_name || parcel.contact_village || owner.contact_village;
                const areaSqm = parcel.area_sqm || (parcel.calculated_area?.sqm);
                const areaHa = parcel.area_hectares || (areaSqm ? (areaSqm / 10000).toFixed(2) : "0.50");
                const docCount = parcel.documents?.length || 0;
                const regStatus = parcel.registration_status || parcel.status || "Registered";

                return (
                  <div
                    key={pId}
                    className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 space-y-3 shadow-sm hover:border-[#0B2E59] transition-colors"
                  >
                    {/* Header with 14-Digit ID */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 font-mono uppercase tracking-wider">
                            PARCEL ID:
                          </span>
                          <span className="font-mono text-sm font-bold text-[#0B5FA5] dark:text-sky-400">
                            {pId}
                          </span>
                        </div>
                        <p className="text-xs text-[#555555] dark:text-slate-300 mt-0.5">
                          Owner: <span className="font-semibold text-[#14213D] dark:text-white">{ownerName}</span>
                        </p>
                        <p className="text-xs text-[#64748B] dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#B36B00] dark:text-amber-400 shrink-0" />
                          <span>Village: {village}</span>
                        </p>
                      </div>

                      <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-bold uppercase bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-400 border border-[#C8E6C9] dark:border-emerald-800/50">
                        {regStatus}
                      </span>
                    </div>

                    {/* Land Details Grid */}
                    <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-[#DCE2E8] dark:border-white/10 font-mono text-center">
                      <div className="bg-[#F8FAFC] dark:bg-white/[0.02] p-2 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
                        <span className="text-[#64748B] block text-[9px]">SURFACE AREA</span>
                        <span className="text-[#1E7E34] dark:text-emerald-400 font-bold text-xs">
                          {areaSqm ? `${Number(areaSqm).toLocaleString(undefined, { maximumFractionDigits: 1 })} m²` : `${areaHa} Ha`}
                        </span>
                      </div>
                      <div className="bg-[#F8FAFC] dark:bg-white/[0.02] p-2 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
                        <span className="text-[#64748B] block text-[9px]">CORNERS</span>
                        <span className="text-[#14213D] dark:text-white font-bold text-xs">
                          {parcel.coordinates?.length || 4} GPS Points
                        </span>
                      </div>
                      <div className="bg-[#F8FAFC] dark:bg-white/[0.02] p-2 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
                        <span className="text-[#64748B] block text-[9px]">DOCUMENTS</span>
                        <span className="text-[#333333] dark:text-slate-200 font-bold text-xs">
                          {docCount > 0 ? `${docCount} Verified` : "Submitted"}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: View Parcel & File Complaint */}
                    <div className="pt-1 flex items-center justify-between gap-2 border-t border-[#DCE2E8] dark:border-white/10">
                      <Link
                        href={`/landowner/parcels/${pId}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0B2E59] dark:text-sky-400 hover:bg-slate-50 dark:hover:bg-white/5 bg-white dark:bg-white/[0.02] py-2 px-3 rounded-[4px] border border-[#DCE2E8] dark:border-white/10 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#0B2E59] dark:text-sky-400" />
                        <span>View Parcel</span>
                      </Link>

                      <Link
                        href={`/landowner/complaints/new?parcel_id=${pId}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-[#0B2E59] hover:bg-[#082242] py-2 px-3 rounded-[4px] transition-colors shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>File Complaint</span>
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
            <h2 className="text-xs font-bold text-[#14213D] dark:text-slate-300 uppercase tracking-wider font-mono">
              My Grievances & Inquiries ({complaints.length})
            </h2>
            <Link href="/landowner/complaints" className="text-[11px] font-semibold text-[#0B5FA5] dark:text-sky-400 hover:underline">
              View All &rarr;
            </Link>
          </div>

          <div className="space-y-2">
            {complaints.length === 0 ? (
              <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 text-center text-xs text-[#64748B] shadow-sm">
                <span>No complaints lodged.</span>
              </div>
            ) : (
              complaints.slice(0, 3).map((comp) => {
                const cId = comp.complaint_id || comp.id;
                return (
                  <Link
                    key={cId}
                    href={`/landowner/complaints/${cId}`}
                    className="block bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-3 hover:border-[#0B2E59] transition-colors shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0B5FA5] dark:text-sky-400 text-xs font-mono">
                        #{comp.complaint_id || cId.slice(0, 8)}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] bg-[#FFF8E1] dark:bg-amber-950/40 text-[#B36B00] dark:text-amber-400 border border-[#FFE082] dark:border-amber-800/50">
                        {comp.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#333333] dark:text-slate-300 mt-1 line-clamp-1 font-medium">
                      {comp.complaint_type || comp.title}
                    </p>

                    {comp.parcel_id && (
                      <p className="text-[10px] text-[#64748B] font-mono mt-1">
                        Parcel ID: {comp.parcel_id}
                      </p>
                    )}
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
