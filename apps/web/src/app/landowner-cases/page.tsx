'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  ShieldCheck, 
  MapPin, 
  ArrowRight, 
  Layers, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  Navigation
} from 'lucide-react';
import { getLandownerComplaints } from '@/lib/api';
import { LandownerGrievanceReviewCard } from '@/components/documents/LandownerGrievanceReviewCard';
import { PortfolioMap } from '@/components/dashboard/PortfolioMap';

export default function LandownerCasesPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);

  const fetchRealData = async () => {
    setLoading(true);
    try {
      const data = await getLandownerComplaints();
      setComplaints(data || []);
    } catch (err) {
      console.error('Failed to load landowner complaints:', err);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, []);

  // Filter verified complaints that have passed Field Officer verification
  const verifiedComplaints = complaints.filter(c => {
    const s = c.status || '';
    return (
      s === 'Verified by Field Officer' ||
      s === 'Field Verified' ||
      s === 'Implementation Initiated' ||
      s === 'Implementation Completed' ||
      s === 'RESOLVED'
    );
  });

  const pendingInitiation = verifiedComplaints.filter(c => 
    c.status === 'Verified by Field Officer' || c.status === 'Field Verified'
  ).length;

  const inProgress = verifiedComplaints.filter(c => 
    c.status === 'Implementation Initiated'
  ).length;

  const completed = verifiedComplaints.filter(c => 
    c.status === 'Implementation Completed' || c.status === 'RESOLVED'
  ).length;

  const totalAcres = verifiedComplaints.reduce((sum, c) => {
    const ac = c.landowner_declared_area?.acres || (c.area_sqm ? c.area_sqm / 4046.86 : 0);
    return sum + Number(ac);
  }, 0);

  const handleSelectParcel = (parcel: any) => {
    const id = parcel.map_id || parcel.id || parcel.parcel_id;
    setSelectedParcelId(id);

    const cardEl = document.getElementById(`complaint-card-${parcel.id}`) || document.getElementById(`complaint-card-${parcel.map_id}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Official Landowner Cases Banner */}
      <div className="bg-[#E8F1FA] dark:bg-[#0B2E59]/30 border border-[#B8D5E5] dark:border-[#0B2E59] px-4 py-2.5 rounded-[4px] flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-[#0B2E59] text-white uppercase">
            LANDOWNER GRIEVANCES
          </span>
          <span className="text-xs text-[#0B2E59] dark:text-[#93C5FD] font-semibold">
            Authoritative Citizen Land Records &bull; Field Verification Workflow
          </span>
        </div>
        <div className="flex items-center gap-3.5 text-xs text-[#555555] dark:text-slate-400">
          <span className="font-mono text-[11px]">Designated Field Officer: Ramesh Patel (OFF-001)</span>
          <button
            onClick={fetchRealData}
            className="text-[#0B5FA5] dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-emerald-100 dark:bg-emerald-950/50 text-[#1E7E34] dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 uppercase">
              {verifiedComplaints.length} Verified Landowner Grievances
            </span>
            <span className="text-xs text-[#64748B] dark:text-slate-400 font-mono">
              Statutory Resolution &bull; RFCTLARR 2013 First Schedule
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#14213D] dark:text-[#F0F4FF]">
            Landowner Grievances &amp; Acquisition Resolution
          </h1>
          <p className="text-xs text-[#555555] dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Direct administrative oversight for citizen disputes: review field officer findings, evaluate counterfactual What-If scenarios, and issue statutory determinations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/landowner-gis"
            className="px-3.5 py-2 rounded-[4px] bg-white dark:bg-white/5 border border-[#DCE2E8] dark:border-white/10 text-[#0B2E59] dark:text-sky-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/10 flex items-center gap-1.5 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open Real Landowner GIS</span>
          </Link>
          <Link
            href="/intelligence/what-if"
            className="px-3.5 py-2 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>What-If Workbench</span>
          </Link>
        </div>
      </div>

      {/* Real Statistics Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm">
          <div className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider">Verified Cases</div>
          <div className="text-2xl font-bold text-[#1E7E34] dark:text-emerald-400 mt-1">
            {verifiedComplaints.length}
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">Inspected by Field Officer</div>
        </div>

        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm">
          <div className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider">Pending Directives</div>
          <div className="text-2xl font-bold text-[#B36B00] dark:text-amber-400 mt-1">
            {pendingInitiation}
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">Awaiting admin order</div>
        </div>

        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm">
          <div className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider">Active Orders</div>
          <div className="text-2xl font-bold text-[#0B5FA5] dark:text-sky-400 mt-1">
            {inProgress}
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">Implementation in progress</div>
        </div>

        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm">
          <div className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider">Completed Awards</div>
          <div className="text-2xl font-bold text-[#0B2E59] dark:text-white mt-1">
            {completed}
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">Statutory awards disbursed</div>
        </div>

        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm">
          <div className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider">Disputed Area</div>
          <div className="text-2xl font-bold text-[#14213D] dark:text-white mt-1">
            {totalAcres.toFixed(2)} <span className="text-xs font-medium text-[#555555] dark:text-slate-400">Acres</span>
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">Cadastral geometry</div>
        </div>
      </div>

      {/* Main Admin Implementation Card (with What-If simulation modal) */}
      <LandownerGrievanceReviewCard
        selectedParcelId={selectedParcelId}
        onSelectParcel={handleSelectParcel}
      />

      {/* Spatial Real Cadastral Polygon Map */}
      <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#DCE2E8] dark:border-white/10 flex items-center justify-between flex-wrap gap-2 bg-slate-50/50 dark:bg-white/[0.02]">
          <div>
            <div className="text-[10px] font-mono text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
              Cadastral Spatial Map &bull; Ground Demarcated Boundaries
            </div>
            <div className="text-sm font-bold text-[#14213D] dark:text-white mt-0.5">
              Ground-Demarcated Polygon Geometry
            </div>
          </div>
          <div className="text-xs font-mono text-[#1E7E34] dark:text-emerald-400 font-bold">
            {verifiedComplaints.length} Verified Cadastral Polygon{verifiedComplaints.length === 1 ? '' : 's'}
          </div>
        </div>

        <PortfolioMap 
          verifiedParcels={verifiedComplaints}
          selectedParcelId={selectedParcelId}
          onSelectParcel={handleSelectParcel}
        />
      </div>
    </div>
  );
}
