import React from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { AlertOctagon, AlertTriangle, Activity, Scale, ArrowRight, GitBranch } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const project = await apiClient.getProject(id);
    return { title: `${project.name} | Bottleneck Intelligence`, description: `Dependency graph for ${project.name}.` };
  } catch { return { title: 'Bottleneck Intelligence | BHUMI' }; }
}

export default async function IntelligencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let project: any = null;
  let bottlenecks: any[] = [];

  try {
    project = await apiClient.getProject(id);
    bottlenecks = await apiClient.getProjectBottlenecks(id);
  } catch { notFound(); }
  if (!project) notFound();

  const criticalCount = bottlenecks.filter((b: any) => b.status === 'CRITICAL').length;
  const highCount = bottlenecks.filter((b: any) => b.status === 'HIGH').length;

  const URGENCY_STYLE: Record<string, { bg: string; color: string; border: string; barColor: string }> = {
    CRITICAL: { bg: 'bg-[#FFEBEE] dark:bg-rose-950/40', color: 'text-[#B32424] dark:text-rose-300', border: 'border-[#FFCDD2] dark:border-rose-800/40', barColor: 'border-l-[#B32424]' },
    HIGH: { bg: 'bg-[#FFF8E1] dark:bg-amber-950/40', color: 'text-[#B36B00] dark:text-amber-300', border: 'border-[#FFE082] dark:border-amber-800/40', barColor: 'border-l-amber-500' },
    MEDIUM: { bg: 'bg-[#FFF8E1] dark:bg-amber-950/40', color: 'text-[#B36B00] dark:text-amber-300', border: 'border-[#FFE082] dark:border-amber-800/40', barColor: 'border-l-amber-400' },
    LOW: { bg: 'bg-[#E8F5E9] dark:bg-emerald-950/40', color: 'text-[#1E7E34] dark:text-emerald-300', border: 'border-[#C8E6C9] dark:border-emerald-800/40', barColor: 'border-l-[#1E7E34]' },
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[#5A6A80] dark:text-slate-400 font-mono">
        <Link href="/" className="hover:text-[#0B2E59] dark:hover:text-white transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/projects" className="hover:text-[#0B2E59] dark:hover:text-white transition-colors">Corridors</Link>
        <span>/</span>
        <Link href={`/projects/${project.id}`} className="hover:text-[#0B2E59] dark:hover:text-white transition-colors">{project.name}</Link>
        <span>/</span>
        <span className="text-[#14213D] dark:text-white font-bold">Bottleneck Intelligence</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[3px] bg-[#FFEBEE] text-[#B32424] border border-[#FFCDD2] dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40 uppercase font-bold tracking-wider">
              Critical Chain Analysis
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#14213D] dark:text-white m-0 font-display">
            Corridor Bottleneck Intelligence
          </h1>
          <p className="text-xs text-[#5A6A80] dark:text-slate-400 mt-1">
            Graph traversal of statutory milestones, parcel dependency chains, and active legal injunctions
          </p>
        </div>
        <Link
          href={`/projects/${project.id}/impact`}
          className="px-3.5 py-2 rounded-[4px] text-xs font-bold bg-[#0B2E59] hover:bg-[#082242] text-white flex items-center gap-1.5 shadow-xs transition-all"
        >
          <Activity className="w-3.5 h-3.5" /> Simulate Impact
        </Link>
      </div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Bottlenecks', val: `${bottlenecks.length} Detected`, color: 'text-[#0B2E59] dark:text-sky-400', bg: 'bg-[#F8FAFC] dark:bg-[#07080F]', border: 'border-[#DCE2E8] dark:border-white/10', sub: 'Across surveys & legal hearings' },
          { label: 'Zero-Float Blockers', val: `${criticalCount} Critical`, color: 'text-[#B32424] dark:text-rose-400', bg: 'bg-[#FFF5F5] dark:bg-rose-950/20', border: 'border-[#FFCDD2] dark:border-rose-800/40', sub: `Directly delaying completion +${project.project_delay_days || 0}d` },
          { label: 'Float Consumption', val: `${highCount} High`, color: 'text-[#B36B00] dark:text-amber-400', bg: 'bg-[#FFF8E1] dark:bg-amber-950/20', border: 'border-[#FFE082] dark:border-amber-800/40', sub: 'Consuming activity float on corridor' },
        ].map((s) => (
          <div key={s.label} className={`rounded-[4px] p-3.5 border ${s.bg} ${s.border} shadow-xs`}>
            <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider font-mono font-semibold">{s.label}</div>
            <div className={`font-mono text-xl font-bold ${s.color} mt-1`}>{s.val}</div>
            <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Bottleneck Cards */}
      <div className="flex flex-col gap-3.5">
        {bottlenecks.map((b: any, idx: number) => {
          const u = URGENCY_STYLE[b.status] || URGENCY_STYLE.MEDIUM;
          return (
            <div key={idx} className={`bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] overflow-hidden shadow-xs ${u.barColor} border-l-4`}>
              {/* Card header */}
              <div className="p-3.5 border-b border-[#DCE2E8] dark:border-white/10 flex items-center justify-between flex-wrap gap-2.5">
                <div className="flex items-center gap-2.5">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-[3px] border uppercase font-mono tracking-wider ${u.bg} ${u.color} ${u.border}`}>
                    {b.status} URGENCY
                  </span>
                  <span className="font-mono text-xs font-bold text-[#14213D] dark:text-white">
                    {b.entity_type}: {b.entity_id}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#5A6A80] dark:text-slate-400">
                  <GitBranch className="w-3.5 h-3.5 text-[#0B2E59] dark:text-sky-400" />
                  <span>Downstream:</span>
                  <strong className="text-[#0B2E59] dark:text-sky-400 font-mono">{b.downstream_impact_count} CPM Activities</strong>
                </div>
              </div>

              {/* Card body */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-mono font-bold text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#B32424] dark:text-rose-400" /> Statutory Impediments
                  </div>
                  <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
                    {b.reasons?.map((r: string, i: number) => (
                      <li key={i} className="text-xs text-[#14213D] dark:text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B32424] dark:bg-rose-400 flex-shrink-0 mt-1.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Contractual Milestones Exposed
                  </div>
                  {b.affected_milestones?.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {b.affected_milestones.map((m: string, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 rounded-[3px]">
                          <span className="text-xs font-mono text-[#14213D] dark:text-slate-300">Milestone: {m}</span>
                          <span className="text-[10px] font-bold text-[#B32424] dark:text-rose-400 font-mono">Penalties at Risk</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#5A6A80] dark:text-slate-400 italic">No direct contractual milestone breaches recorded.</p>
                  )}
                </div>
              </div>

              {/* Recommendation footer */}
              <div className="p-3 px-4 border-t border-[#DCE2E8] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#07080F] flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-2 max-w-xl">
                  <Scale className="w-4 h-4 text-[#0B2E59] dark:text-sky-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-[#5A6A80] dark:text-slate-300 leading-relaxed">
                    {b.status === 'CRITICAL'
                      ? 'Invoke RFCTLARR Section 40 urgency powers or fast-track SLAO awards to clear zero-float constraint.'
                      : 'Instruct District Collector counsel for urgent hearing to vacate court interim stay order.'}
                  </span>
                </div>
                <Link
                  href={`/projects/${project.id}/impact`}
                  className="px-3 py-1.5 rounded-[3px] text-xs font-bold bg-[#E6F0FA] text-[#0B2E59] border border-[#B8D5ED] dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40 hover:bg-[#D4E6F7] inline-flex items-center gap-1.5 transition-all shadow-xs"
                >
                  Model Resolution <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Causal chain */}
              {b.blocking_chain?.length > 0 && (
                <div className="p-2.5 px-4 border-t border-[#DCE2E8]/60 dark:border-white/5 bg-[#F8FAFC]/50 dark:bg-[#07080F]/50 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[#5A6A80] dark:text-slate-400 font-mono uppercase tracking-wider">Causal Chain:</span>
                  {b.blocking_chain.map((node: string, nIdx: number) => (
                    <React.Fragment key={nIdx}>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 text-[#14213D] dark:text-white shadow-xs">
                        {node}
                      </span>
                      {nIdx < b.blocking_chain.length - 1 && (
                        <span className="text-[#0B2E59] dark:text-sky-400 font-bold text-xs">&rarr;</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {bottlenecks.length === 0 && (
          <div className="p-8 text-center rounded-[4px] border border-dashed border-[#CBD5E1] dark:border-white/10 text-[#5A6A80] dark:text-slate-400 text-xs bg-[#F8FAFC] dark:bg-[#07080F]">
            No critical bottlenecks currently detected along this project corridor.
          </div>
        )}
      </div>
    </div>
  );
}
