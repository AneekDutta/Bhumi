import Link from 'next/link';
import type { Metadata } from 'next';
import { 
  Briefcase, 
  MapPin, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  Building2, 
  Layers, 
  Train, 
  Zap, 
  Droplet 
} from 'lucide-react';
import { MOCK_GOVERNMENT_PROJECTS } from '@/lib/mockProjectData';

export const metadata: Metadata = {
  title: 'Project Portfolio | BHUMI',
  description: 'National infrastructure project portfolio overview across Highways, Railways, Industrial, and Energy sectors.',
};

export default function ProjectsPage() {
  const projects = MOCK_GOVERNMENT_PROJECTS;

  const totalLength = projects.reduce((sum, p) => sum + (p.total_length_km || 0), 0);
  const totalPlannedAcq = projects.reduce((sum, p) => sum + p.planned_acquisition_ha, 0);
  const totalAcquired = projects.reduce((sum, p) => sum + p.acquired_area_ha, 0);
  const avgProgress = Math.round((totalAcquired / (totalPlannedAcq || 1)) * 100);

  return (
    <div className="space-y-6">
      
      {/* Official Government Portfolio Banner */}
      <div className="p-3 rounded-[4px] bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 flex items-center justify-between flex-wrap gap-2 shadow-sm transition-colors">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-[3px] bg-[#0B2E59] text-white uppercase tracking-wider">
            NATIONAL INFRASTRUCTURE PORTFOLIO
          </span>
          <span className="text-xs font-bold text-[#14213D] dark:text-[#F0F4FF]">
            Inter-Ministerial Strategic Infrastructure Alignments &bull; CALA Oversight
          </span>
        </div>
        <span className="text-xs text-[#64748B] dark:text-slate-400 font-mono">
          Priority Capital Projects
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#DCE2E8] dark:border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-[3px] bg-[#E6F0FA] dark:bg-sky-950/50 text-[#0B5FA5] dark:text-sky-400 border border-[#BDD7EE] dark:border-sky-800">
              {projects.length} National Corridors
            </span>
            <span className="text-xs text-[#64748B] dark:text-slate-400 font-mono">
              Highways &middot; Railways &middot; Industrial &middot; Energy &middot; Urban
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#14213D] dark:text-[#F0F4FF] m-0 leading-tight">
            Government Infrastructure Project Portfolio
          </h1>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
            Strategic alignment directory for linear corridors and land acquisition milestones across Central &amp; State departments
          </p>
        </div>

        <Link
          href="/projects/gis"
          className="btn-primary px-3.5 py-2 text-xs flex items-center gap-1.5"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Open Project Spatial Map</span>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-[4px] bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 shadow-sm transition-colors">
          <div className="text-[10px] text-[#64748B] dark:text-slate-400 uppercase font-mono font-semibold">Total Length</div>
          <div className="text-2xl font-extrabold text-[#14213D] dark:text-[#F0F4FF] mt-1">
            {totalLength.toFixed(1)} <span className="text-xs font-medium text-[#64748B]">km</span>
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-1">Linear corridor alignments</div>
        </div>

        <div className="p-3.5 rounded-[4px] bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 shadow-sm transition-colors">
          <div className="text-[10px] text-[#64748B] dark:text-slate-400 uppercase font-mono font-semibold">Planned Acquisition</div>
          <div className="text-2xl font-extrabold text-[#0B5FA5] dark:text-sky-400 mt-1">
            {totalPlannedAcq.toLocaleString()} <span className="text-xs font-medium text-[#64748B]">Ha</span>
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-1">Across 6 strategic sectors</div>
        </div>

        <div className="p-3.5 rounded-[4px] bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 shadow-sm transition-colors">
          <div className="text-[10px] text-[#64748B] dark:text-slate-400 uppercase font-mono font-semibold">Acquired to Date</div>
          <div className="text-2xl font-extrabold text-[#1E7E34] dark:text-emerald-400 mt-1">
            {totalAcquired.toLocaleString()} <span className="text-xs font-medium text-[#64748B]">Ha</span>
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-1">{avgProgress}% Portfolio throughput</div>
        </div>

        <div className="p-3.5 rounded-[4px] bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 shadow-sm transition-colors">
          <div className="text-[10px] text-[#64748B] dark:text-slate-400 uppercase font-mono font-semibold">Macro Bottlenecks</div>
          <div className="text-2xl font-extrabold text-[#B36B00] dark:text-amber-400 mt-1">
            {projects.reduce((s, p) => s + p.statistics.unresolved_bottlenecks, 0)}
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-1">Projected corridor clusters</div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => {
          const isDelayed = p.status === 'DELAYED' || p.status === 'CRITICAL_BLOCKER';
          return (
            <div
              key={p.id}
              className="p-4 rounded-[4px] bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 shadow-sm flex flex-col justify-between gap-3.5 transition-colors"
            >
              <div>
                {/* Sector and Status */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] bg-[#E6F0FA] dark:bg-sky-950/50 text-[#0B5FA5] dark:text-sky-400 border border-[#BDD7EE] dark:border-sky-800">
                    {p.sector.toUpperCase()}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] border ${
                    p.status === 'DELAYED'
                      ? 'bg-[#FFF8E6] text-[#B36B00] border-[#FFE29A] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                      : p.status === 'CRITICAL_BLOCKER'
                      ? 'bg-[#FDF0F0] text-[#B32424] border-[#F8C8C8] dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                      : 'bg-[#EBF7EE] text-[#1E7E34] border-[#BEE3C8] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  }`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Project Title */}
                <h3 className="text-sm font-bold text-[#14213D] dark:text-[#F0F4FF] m-0 leading-snug">
                  {p.name}
                </h3>
                <div className="text-xs text-[#64748B] dark:text-slate-400 font-mono mt-1 mb-2">
                  {p.code} &middot; {p.state} ({p.district})
                </div>

                {/* Department */}
                <div className="text-[11px] text-[#333333] dark:text-slate-300 bg-[#F1F4F7] dark:bg-[#07080F] px-2.5 py-1.5 rounded-[3px] border border-[#DCE2E8] dark:border-white/10 mb-3">
                  {p.department}
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#64748B] dark:text-slate-400">Acquisition Progress</span>
                    <span className="text-[#1E7E34] dark:text-emerald-400 font-bold font-mono">
                      {p.acquisition_progress_pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-[2px] bg-[#F1F4F7] dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-[#1E7E34] dark:bg-emerald-500 rounded-[2px]"
                      style={{ width: `${p.acquisition_progress_pct}%` }}
                    />
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-[3px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10">
                    <span className="text-[10px] text-[#64748B] dark:text-slate-400 block font-mono">Planned Area</span>
                    <span className="text-xs font-bold text-[#14213D] dark:text-[#F0F4FF] font-mono">
                      {p.planned_acquisition_ha} Ha
                    </span>
                  </div>
                  <div className="p-2 rounded-[3px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10">
                    <span className="text-[10px] text-[#64748B] dark:text-slate-400 block font-mono">Delay Impact</span>
                    <span className={`text-xs font-bold font-mono ${isDelayed ? 'text-[#B36B00] dark:text-amber-400' : 'text-[#1E7E34] dark:text-emerald-400'}`}>
                      +{p.project_delay_days} Days
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Link */}
              <div className="pt-2.5 border-t border-[#DCE2E8] dark:border-white/10 flex justify-between items-center text-xs">
                <span className="text-[#64748B] dark:text-slate-400 font-mono">
                  Target: {p.timeline_target}
                </span>
                <Link
                  href={`/projects/gis?id=${p.id}`}
                  className="font-bold text-[#0B5FA5] dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  <span>Inspect Spatial Corridor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
