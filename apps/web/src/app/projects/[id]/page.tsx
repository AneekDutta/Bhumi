import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DocumentRegister } from '@/components/documents/DocumentRegister';
import { Activity, Compass, AlertTriangle, CheckCircle2, Clock, ArrowRight, AlertOctagon } from 'lucide-react';
import { ProvenanceBadge, DataRealityBanner } from '@/components/common/ProvenanceBadge';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const project = await apiClient.getProject(id);
    return { title: `${project.name} | BHUMI`, description: `Operational details for ${project.name}.` };
  } catch {
    return { title: 'Project Overview | BHUMI' };
  }
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let project: any = null;
  let parcels: any[] = [];

  try {
    project = await apiClient.getProject(id);
    parcels = await apiClient.getProjectParcels(id);
  } catch {
    notFound();
  }
  if (!project) notFound();

  const totalAreaHa = parcels.reduce((sum: number, p: any) => sum + (Number(p.area_hectares) || 0), 0);
  const possessedParcels = parcels.filter((p: any) => p.status === 'POSSESSION' || p.status === 'RESOLVED');
  const percentPossessed = parcels.length > 0 ? Math.round((possessedParcels.length / parcels.length) * 100) : 0;
  const hasDelay = (project.project_delay_days || 0) > 0;

  const STAGE_COLOR: Record<string, string> = {
    PRELIMINARY_NOTIFICATION: '#6366f1',
    SIA_STUDY: '#8b5cf6',
    SOCIAL_IMPACT_ASSESSMENT: '#8b5cf6',
    OBJECTIONS_HEARING: '#f59e0b',
    DECLARATION: '#f97316',
    AWARD: '#10b981',
    POSSESSION: '#10b981',
    RESOLVED: '#10b981',
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[#5A6A80] dark:text-slate-400 font-mono">
        <Link href="/" className="hover:text-[#0B2E59] dark:hover:text-white transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/projects" className="hover:text-[#0B2E59] dark:hover:text-white transition-colors">Corridors</Link>
        <span>/</span>
        <span className="font-bold text-[#14213D] dark:text-white">{project.name}</span>
      </nav>

      {/* Provenance Matrix Banner */}
      <DataRealityBanner />

      {/* Project Hero Banner */}
      <div className="rounded-[4px] p-5 bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 shadow-xs relative space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider font-semibold">
                ID: {project.id.substring(0, 8).toUpperCase()}
              </span>
              {hasDelay && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] bg-[#FFEBEE] dark:bg-rose-950/40 border border-[#FFCDD2] dark:border-rose-800/40 text-[#B32424] dark:text-rose-300 uppercase">
                  ⚠ +{project.project_delay_days}d Overrun
                </span>
              )}
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] bg-[#E8F5E9] dark:bg-emerald-950/40 border border-[#C8E6C9] dark:border-emerald-800/40 text-[#1E7E34] dark:text-emerald-300 uppercase">
                Active Alignment
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#14213D] dark:text-white m-0 font-display">
              {project.name}
            </h1>
            <p className="mt-2 text-xs text-[#5A6A80] dark:text-slate-400 flex flex-wrap gap-4">
              <span>Length: <strong className="text-[#0B2E59] dark:text-sky-400 font-mono font-bold">{project.total_length_km ?? 0} km</strong></span>
              <span>Area: <strong className="text-[#0B2E59] dark:text-sky-400 font-mono font-bold">{totalAreaHa.toFixed(2)} Ha</strong></span>
              <span>State: <strong className="text-[#14213D] dark:text-white font-semibold">{project.state_name || 'National Scope'}</strong></span>
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/projects/${project.id}/spatial`}
              className="px-3.5 py-2 rounded-[4px] text-xs font-bold bg-[#E6F0FA] dark:bg-sky-950/40 text-[#0B2E59] dark:text-sky-300 border border-[#B8D5ED] dark:border-sky-800/40 hover:bg-[#D4E6F7] flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Compass className="w-3.5 h-3.5" /> Spatial Map
            </Link>
            <Link
              href={`/projects/${project.id}/impact`}
              className="px-3.5 py-2 rounded-[4px] text-xs font-bold bg-white dark:bg-[#0D121F] text-[#0B2E59] dark:text-sky-300 border border-[#DCE2E8] dark:border-white/10 hover:bg-[#F4F6F8] dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Activity className="w-3.5 h-3.5" /> Impact & Simulation
            </Link>
            <Link
              href={`/projects/${project.id}/intelligence`}
              className="px-3.5 py-2 rounded-[4px] text-xs font-bold bg-[#FFF8E1] dark:bg-amber-950/40 text-[#B36B00] dark:text-amber-300 border border-[#FFE082] dark:border-amber-800/40 hover:bg-[#FFF0C2] flex items-center gap-1.5 shadow-xs transition-all"
            >
              <AlertOctagon className="w-3.5 h-3.5" /> Bottlenecks
            </Link>
          </div>
        </div>

        {/* RoW Progress */}
        <div className="pt-3 border-t border-[#DCE2E8] dark:border-white/10 space-y-1.5">
          <div className="flex justify-between text-xs text-[#5A6A80] dark:text-slate-400">
            <span>
              Right-of-Way (RoW) Possession Progress:
              <strong className="text-[#1E7E34] dark:text-emerald-400 font-mono font-bold ml-1.5">{percentPossessed}%</strong>
            </span>
            <span className="font-mono text-[11px] font-semibold">{possessedParcels.length} / {parcels.length} Parcels</span>
          </div>
          <div className="w-full h-2 bg-[#F1F4F7] dark:bg-slate-800 rounded-[2px] overflow-hidden flex">
            <div
              className="h-full bg-[#1E7E34] dark:bg-emerald-500 rounded-[2px] transition-all duration-500"
              style={{ width: `${percentPossessed}%` }}
            />
          </div>
        </div>
      </div>

      {/* Segments */}
      <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-3">
        <div className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400 tracking-wider uppercase font-bold">
          Alignment Corridor Segments
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {parcels.length > 0 ? (
            Array.from(new Set(parcels.map(p => p.village_name || 'Alignment Corridor'))).map((village) => {
              const villageParcels = parcels.filter(p => (p.village_name || 'Alignment Corridor') === village);
              const unresolved = villageParcels.filter(p => p.status === 'UNRESOLVED');
              const hasDelay = unresolved.length > 0;
              return (
                <div key={village} className="rounded-[4px] p-3.5 bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#14213D] dark:text-white">{village} Segment</span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-[3px] border ${
                      hasDelay
                        ? 'bg-[#FFEBEE] text-[#B32424] border-[#FFCDD2] dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                        : 'bg-[#E8F5E9] text-[#1E7E34] border-[#C8E6C9] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    }`}>
                      {hasDelay ? `${unresolved.length} Unresolved` : '100% Possessed'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5A6A80] dark:text-slate-400 m-0">
                    {villageParcels.length} Registered Parcels ({villageParcels.reduce((s, p) => s + (p.area_hectares || 0), 0).toFixed(2)} Ha)
                  </p>
                  <div className={`text-[11px] p-2 rounded-[3px] border ${
                    hasDelay
                      ? 'bg-[#FFF5F5] dark:bg-rose-950/30 text-[#B32424] dark:text-rose-300 border-[#FFCDD2] dark:border-rose-800/40'
                      : 'bg-[#E8F5E9]/60 dark:bg-emerald-950/30 text-[#1E7E34] dark:text-emerald-300 border-[#C8E6C9] dark:border-emerald-800/40'
                  }`}>
                    {hasDelay ? `Parcels: ${unresolved.map(p => p.survey_no).join(', ')} pending acquisition` : 'Clear Right-of-Way secured for civil works'}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-dashed border-[#CBD5E1] dark:border-white/10 text-[#5A6A80] dark:text-slate-400 text-xs">
              Awaiting parcel cadastral mapping for corridor alignment.
            </div>
          )}
        </div>
      </div>

      {/* Parcels Table */}
      <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-[#DCE2E8] dark:border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider font-bold">Mapped Land Parcels</div>
            <div className="text-sm font-bold text-[#14213D] dark:text-white mt-0.5">Cadastral Survey Register</div>
          </div>
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-[3px] bg-[#E6F0FA] dark:bg-sky-950/40 border border-[#B8D5ED] dark:border-sky-800/40 text-[#0B2E59] dark:text-sky-300">
            {parcels.length} Parcels
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#DCE2E8] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#07080F]">
                {['Survey No.', 'Area (Ha)', 'Classification', 'Stage', 'Possession', ''].map((h) => (
                  <th key={h} className="py-2.5 px-4 text-left text-[10px] font-mono font-bold text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parcels.map((p: any) => {
                const isPossessed = p.status === 'POSSESSION' || p.status === 'RESOLVED';
                const isLapsed = Boolean(p.is_lapsed);
                return (
                  <tr key={p.id} className="border-b border-[#DCE2E8]/60 dark:border-white/5 hover:bg-[#F8FAFC] dark:hover:bg-[#07080F]/60 transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/parcels/${p.id}`} className="font-mono text-xs font-bold text-[#0B2E59] dark:text-sky-400 hover:underline">
                        Survey No. {p.survey_no}
                      </Link>
                      {isLapsed && (
                        <span className="ml-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-[3px] bg-[#FFEBEE] text-[#B32424] border border-[#FFCDD2] uppercase">
                          Sec 19(7) Lapsed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#14213D] dark:text-slate-300">{p.area_hectares} Ha</td>
                    <td className="py-3 px-4 text-[#5A6A80] dark:text-slate-400">{p.classification || 'Agricultural'}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] bg-[#E6F0FA] text-[#0B2E59] dark:bg-sky-950/40 dark:text-sky-300 border border-[#B8D5ED] dark:border-sky-800/40">
                        {p.current_stage || 'PRELIMINARY_NOTIFICATION'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-[3px] border ${
                        isPossessed
                          ? 'bg-[#E8F5E9] text-[#1E7E34] border-[#C8E6C9] dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-[#FFF8E1] text-[#B36B00] border-[#FFE082] dark:bg-amber-950/40 dark:text-amber-300'
                      }`}>
                        {isPossessed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/parcels/${p.id}`} className="text-xs font-bold text-[#0B2E59] dark:text-sky-400 hover:underline inline-flex items-center gap-1">
                        Inspect <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {parcels.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-xs text-[#5A6A80] dark:text-slate-400">
                    No land parcels mapped to this project alignment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Register */}
      <div className="pt-2">
        <div className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider font-bold mb-1">
          Corridor Document Register
        </div>
        <div className="text-base font-bold text-[#14213D] dark:text-white font-display mb-3">
          Statutory Gazette Notifications &amp; Awards
        </div>
        <DocumentRegister projectId={project.id} />
      </div>
    </div>
  );
}
