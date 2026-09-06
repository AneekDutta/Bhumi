import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { 
  ArrowRight, 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  IndianRupee, 
  Layers, 
  Users, 
  TrendingUp, 
  Scale,
  Navigation,
  Building2,
  Train,
  Zap,
  Droplet
} from 'lucide-react';
import { apiClient, getRealDashboardStats } from '@/lib/api';
import { AdminOperationsSection } from '@/components/dashboard/AdminOperationsSection';
import { MOCK_GOVERNMENT_PROJECTS } from '@/lib/mockProjectData';

export const metadata: Metadata = {
  title: 'National Operations Console | BHUMI',
  description: 'National land acquisition portfolio overview separated into Government Infrastructure Corridors and Real Citizen Grievances.',
};

async function getVerifiedComplaints() {
  try {
    const data = await apiClient.getLandownerComplaints({});
    return (data || []).filter((c: any) => {
      const s = c.status || "";
      return (
        s === "Verified by Field Officer" ||
        s === "Field Verified" ||
        s === "Implementation Initiated" ||
        s === "Implementation Completed" ||
        s === "RESOLVED"
      );
    });
  } catch {
    return [];
  }
}

export default async function NationalDashboardPage() {
  const verifiedComplaints = await getVerifiedComplaints();
  const stats = await getRealDashboardStats();

  const totalParcels = stats.total_parcels;
  const pendingVerification = stats.pending_field_verification;
  const verifiedCount = stats.verified_by_field_officer;
  const implementationInitiated = stats.implementation_initiated;
  const implementationCompleted = stats.implementation_completed;

  // Mock Government Projects data
  const mockProjects = MOCK_GOVERNMENT_PROJECTS;
  const mockTotalLength = mockProjects.reduce((sum, p) => sum + (p.total_length_km || 0), 0);
  const mockTotalPlannedAcq = mockProjects.reduce((sum, p) => sum + p.planned_acquisition_ha, 0);
  const mockTotalAcquired = mockProjects.reduce((sum, p) => sum + p.acquired_area_ha, 0);
  const mockAvgProgress = Math.round((mockTotalAcquired / (mockTotalPlannedAcq || 1)) * 100);
  const mockBottlenecks = mockProjects.reduce((s, p) => s + p.statistics.unresolved_bottlenecks, 0);

  return (
    <div className="space-y-6">

      {/* Main Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#DCE2E8] dark:border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-[3px] bg-[#E6F0FA] dark:bg-sky-950/50 text-[#0B5FA5] dark:text-sky-400 border border-[#BDD7EE] dark:border-sky-800">
              <span className="w-2 h-2 rounded-full bg-[#0B5FA5] dark:bg-sky-400 inline-block" />
              MoRTH / CALA Command Operations
            </span>
            <span className="text-xs text-[#64748B] dark:text-slate-400 font-mono">
              · Live Statutory Stream
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#14213D] dark:text-[#F0F4FF] m-0 leading-tight">
            National Land Acquisition Operations
          </h1>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
            National Infrastructure Corridors and Citizen Landowner Cases under RFCTLARR Act 2013 &amp; NH Act 1956.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/projects/gis"
            className="px-3.5 py-2 rounded-[4px] text-xs font-bold bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-white/10 text-[#0B2E59] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5 text-[#0B5FA5] dark:text-sky-400" />
            <span>Project Spatial Map</span>
          </Link>
          <Link
            href="/landowner-gis"
            className="px-3.5 py-2 rounded-[4px] text-xs font-bold bg-[#0B2E59] hover:bg-[#123C6B] text-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5 text-amber-300" />
            <span>Land Parcel Map</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: GOVERNMENT INFRASTRUCTURE PROJECT PORTFOLIO */}
      {/* ========================================================================= */}
      <section className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 rounded-none p-5 shadow-none space-y-4 transition-colors">
        {/* Section A Tag & Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#DCE2E8] dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-[2px] bg-[#0B2E59] text-white uppercase tracking-wider">
              SECTION A &bull; NATIONAL INFRASTRUCTURE PROJECTS
            </span>
            <h2 className="text-base font-bold text-[#14213D] dark:text-[#F0F4FF] m-0">
              Government Infrastructure Project Portfolio
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#5A6A80] dark:text-slate-400 font-mono">
              6 Strategic National Corridors
            </span>
            <Link
              href="/projects"
              className="text-xs text-[#0B5FA5] dark:text-sky-400 font-bold hover:underline flex items-center gap-1"
            >
              <span>View Full Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <p className="text-xs text-[#5A6A80] dark:text-slate-400 m-0 leading-relaxed">
          Multi-sector linear corridor footprints representing Highways, Railways, Industrial Corridors, Irrigation, Renewable Energy, and Urban Development. Isolated from citizen-submitted records.
        </p>

        {/* Section A Portfolio KPI Strip - Flat Government Form Ledger Style */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="pb-3 pt-1 px-1 bg-transparent rounded-none border-b-2 border-[#0B2E59] dark:border-sky-500">
            <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-mono font-bold tracking-wider">Total Length</div>
            <div className="text-2xl font-extrabold text-[#14213D] dark:text-[#F0F4FF] mt-1 font-mono tracking-tight">
              {mockTotalLength.toFixed(1)} <span className="text-xs font-semibold text-[#5A6A80]">km</span>
            </div>
            <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-1">Highways &amp; Railways</div>
          </div>

          <div className="pb-3 pt-1 px-1 bg-transparent rounded-none border-b-2 border-[#0B5FA5] dark:border-sky-400">
            <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-mono font-bold tracking-wider">Planned Acquisition</div>
            <div className="text-2xl font-extrabold text-[#0B5FA5] dark:text-sky-400 mt-1 font-mono tracking-tight">
              {mockTotalPlannedAcq.toLocaleString()} <span className="text-xs font-semibold text-[#5A6A80]">Ha</span>
            </div>
            <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-1">Projected corridor land</div>
          </div>

          <div className="pb-3 pt-1 px-1 bg-transparent rounded-none border-b-2 border-[#1E7E34] dark:border-emerald-400">
            <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-mono font-bold tracking-wider">Acquired to Date</div>
            <div className="text-2xl font-extrabold text-[#1E7E34] dark:text-emerald-400 mt-1 font-mono tracking-tight">
              {mockTotalAcquired.toLocaleString()} <span className="text-xs font-semibold text-[#5A6A80]">Ha</span>
            </div>
            <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-1">{mockAvgProgress}% Portfolio throughput</div>
          </div>

          <div className="pb-3 pt-1 px-1 bg-transparent rounded-none border-b-2 border-[#B36B00] dark:border-amber-400">
            <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-mono font-bold tracking-wider">Corridor Bottlenecks</div>
            <div className="text-2xl font-extrabold text-[#B36B00] dark:text-amber-400 mt-1 font-mono tracking-tight">
              {mockBottlenecks}
            </div>
            <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-1">Simulated risk clusters</div>
          </div>
        </div>

        {/* Corridor Preview Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {mockProjects.slice(0, 3).map(p => (
            <div
              key={p.id}
              className="p-3.5 rounded-[2px] bg-white dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 flex flex-col justify-between gap-2.5 transition-colors shadow-none"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-[#0B5FA5] dark:text-sky-400">
                    {p.code} &middot; {p.sector}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] border ${
                    p.status === 'DELAYED'
                      ? 'bg-[#FFF8E6] text-[#B36B00] border-[#FFE29A] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                      : p.status === 'CRITICAL_BLOCKER'
                      ? 'bg-[#FDF0F0] text-[#B32424] border-[#F8C8C8] dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                      : 'bg-[#EBF7EE] text-[#1E7E34] border-[#BEE3C8] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  }`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-sm font-bold text-[#14213D] dark:text-[#F0F4FF] leading-snug">
                  {p.name}
                </div>
                <div className="text-xs text-[#5A6A80] dark:text-slate-400 mt-1">
                  {p.state} &middot; {p.acquisition_progress_pct}% Acquired
                </div>
              </div>

              <div className="pt-2 border-t border-[#DCE2E8] dark:border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-[#5A6A80] dark:text-slate-400 font-mono">
                  Target: {p.timeline_target}
                </span>
                <Link
                  href={`/projects/gis?id=${p.id}`}
                  className="text-xs font-bold text-[#0B5FA5] dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  <span>Corridor GIS</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION B: CITIZEN LANDOWNER GRIEVANCES & ACQUISITION DIRECTIVES */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* SECTION B: CITIZEN LANDOWNER GRIEVANCES & ACQUISITION DIRECTIVES */}
      {/* ========================================================================= */}
      <section className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 rounded-none p-5 shadow-none space-y-4 transition-colors">
        {/* Section B Tag & Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#DCE2E8] dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-[2px] bg-[#128807] text-white uppercase tracking-wider">
              SECTION B &bull; LANDOWNER CASES &amp; DIRECTIVES
            </span>
            <h2 className="text-base font-bold text-[#14213D] dark:text-[#F0F4FF] m-0">
              Landowner Grievances &amp; Cadastral Acquisition Cases
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#5A6A80] dark:text-slate-400 font-mono">
              Field Officer: Ramesh Patel (OFF-001)
            </span>
            <Link
              href="/landowner-cases"
              className="text-xs text-[#0B5FA5] dark:text-sky-400 font-bold hover:underline flex items-center gap-1"
            >
              <span>View Full Cases Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <p className="text-xs text-[#5A6A80] dark:text-slate-400 m-0 leading-relaxed">
          Sole source of truth for citizen cases. Originates strictly from citizen parcel registrations (4+ GPS coordinates) &rarr; landowner complaints &rarr; Field Officer ground verification &rarr; Admin statutory determination.
        </p>

        {/* Real KPIs Cards - Flat Government Form Ledger Style */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="pb-3 pt-1 px-1 bg-transparent rounded-none border-b-2 border-[#0B2E59] dark:border-sky-500">
            <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-mono font-bold tracking-wider">Registered Parcels</div>
            <div className="text-2xl font-extrabold text-[#14213D] dark:text-[#F0F4FF] mt-1 font-mono tracking-tight">
              {totalParcels}
            </div>
            <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-1">{stats.area_proposed_acres || 0} Acres Proposed</div>
          </div>

          <div className="pb-3 pt-1 px-1 bg-transparent rounded-none border-b-2 border-[#B36B00] dark:border-amber-400">
            <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-mono font-bold tracking-wider">Pending Inspection</div>
            <div className="text-2xl font-extrabold text-[#B36B00] dark:text-amber-400 mt-1 font-mono tracking-tight">
              {pendingVerification}
            </div>
            <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-1">Ramesh Patel (OFF-001)</div>
          </div>

          <div className="pb-3 pt-1 px-1 bg-transparent rounded-none border-b-2 border-[#1E7E34] dark:border-emerald-400">
            <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-mono font-bold tracking-wider">Verified Cases</div>
            <div className="text-2xl font-extrabold text-[#1E7E34] dark:text-emerald-400 mt-1 font-mono tracking-tight">
              {verifiedCount}
            </div>
            <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-1">Passed ground check</div>
          </div>

          <div className="pb-3 pt-1 px-1 bg-transparent rounded-none border-b-2 border-[#0B5FA5] dark:border-sky-400">
            <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-mono font-bold tracking-wider">Active Orders</div>
            <div className="text-2xl font-extrabold text-[#0B5FA5] dark:text-sky-400 mt-1 font-mono tracking-tight">
              {implementationInitiated}
            </div>
            <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-1">Admin implementation</div>
          </div>

          <div className="pb-3 pt-1 px-1 bg-transparent rounded-none border-b-2 border-[#1E7E34] dark:border-emerald-400">
            <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-mono font-bold tracking-wider">Completed Awards</div>
            <div className="text-2xl font-extrabold text-[#1E7E34] dark:text-emerald-400 mt-1 font-mono tracking-tight">
              {implementationCompleted}
            </div>
            <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-1">Disbursed awards</div>
          </div>
        </div>

        {/* Statutory Aggregations Strip - Flat Government Pro-Forma Style */}
        <div className="pt-4 pb-2 border-t border-b border-[#DCE2E8] dark:border-white/10 bg-transparent space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#0B5FA5] dark:text-sky-400" />
              <span className="text-xs font-bold text-[#14213D] dark:text-[#F0F4FF] uppercase tracking-wide font-mono">
                RFCTLARR 2013 Statutory First Schedule Aggregations
              </span>
            </div>
            <span className="text-[11px] text-[#5A6A80] dark:text-slate-400 font-mono">
              Official Statutory Reconciliation
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="pb-2.5 pt-1 px-1 bg-transparent rounded-none border-b-2 border-[#0B5FA5] dark:border-sky-400">
              <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-mono font-bold tracking-wider">Compensation Assessed</span>
              <div className="text-lg font-extrabold text-[#0B5FA5] dark:text-sky-400 font-mono mt-0.5 tracking-tight">
                ₹{(stats.compensation_assessed_inr || 0).toLocaleString()}
              </div>
            </div>
            <div className="pb-2.5 pt-1 px-1 bg-transparent rounded-none border-b-2 border-[#1E7E34] dark:border-emerald-400">
              <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-mono font-bold tracking-wider">Compensation Paid</span>
              <div className="text-lg font-extrabold text-[#1E7E34] dark:text-emerald-400 font-mono mt-0.5 tracking-tight">
                ₹{(stats.compensation_paid_inr || 0).toLocaleString()}
              </div>
            </div>
            <div className="pb-2.5 pt-1 px-1 bg-transparent rounded-none border-b-2 border-[#0B2E59] dark:border-sky-500">
              <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-mono font-bold tracking-wider">Affected Families</span>
              <div className="text-lg font-extrabold text-[#14213D] dark:text-[#F0F4FF] font-mono mt-0.5 tracking-tight">
                {stats.affected_families_count || 0}
              </div>
            </div>
            <div className="pb-2.5 pt-1 px-1 bg-transparent rounded-none border-b-2 border-[#0B5FA5] dark:border-sky-400">
              <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-mono font-bold tracking-wider">Possession Complete</span>
              <div className="text-lg font-extrabold text-[#0B5FA5] dark:text-sky-400 font-mono mt-0.5 tracking-tight">
                {stats.possession_complete_count || 0} / {totalParcels || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Live Admin Implementation Operations & Real GIS Map */}
        <AdminOperationsSection 
          verifiedComplaints={verifiedComplaints}
          projects={[]}
        />
      </section>

    </div>
  );
}
