import Link from 'next/link';
import type { Metadata } from 'next';
import { AlertTriangle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Acquisition Timeline | BHUMI',
  description: 'RFCTLARR statutory pipeline funnel, time-limit grid, and filterable cases table.',
};

import { MOCK_PARCELS, NATIONAL_PROJECTS } from '@/lib/api';

const getPipelineStages = () => {
  const total = MOCK_PARCELS.length;
  const calcPct = (cnt: number) => total > 0 ? Math.round((cnt / total) * 100) : 0;
  
  // Real dataset counts for NH-927A (181 parcels)
  const notifiedCount = MOCK_PARCELS.filter(p => p.current_stage === 'notified').length;
  const objectionsCount = MOCK_PARCELS.filter(p => p.current_stage === 'notified' && (p.blocker || p.status === 'UNRESOLVED')).length;
  const declaredCount = MOCK_PARCELS.filter(p => p.current_stage === 'compensation_pending' || p.current_stage === 'possessed').length;
  const awardCount = MOCK_PARCELS.filter(p => p.current_stage === 'compensation_pending').length;
  const possessionCount = MOCK_PARCELS.filter(p => p.current_stage === 'possessed').length;

  return [
    { stage: 'Sec 3A / Sec 11 Notification', cases: notifiedCount, limit: '12 months', color: '#0B5FA5', pct: calcPct(notifiedCount) },
    { stage: 'Sec 3C / Sec 15 Objections', cases: objectionsCount, limit: '21–60 days', color: '#B36B00', pct: calcPct(objectionsCount) },
    { stage: 'Sec 3D / Sec 19 Declaration', cases: declaredCount, limit: '12 months', color: '#2F6FB0', pct: calcPct(declaredCount) },
    { stage: 'Sec 3G / Sec 23 Award Enquiry', cases: awardCount, limit: '12 months', color: '#C2410C', pct: calcPct(awardCount) },
    { stage: 'Sec 3E / Sec 38 Possession', cases: possessionCount, limit: '60 days', color: '#1E7E34', pct: calcPct(possessionCount) },
  ];
};

const RFCTLARR_LIMITS = [
  { section: 'Sec 4', trigger: 'SIA Commencement', limit: '6 months', consequence: 'Study deemed complete', severity: 'low' },
  { section: 'Sec 11(1)', trigger: 'Preliminary Notification', limit: 'Gazette Publication', consequence: 'Starts 12-month clock', severity: 'medium' },
  { section: 'Sec 15', trigger: 'Objections Hearing', limit: '60 days', consequence: 'Auto-closure of objections', severity: 'medium' },
  { section: 'Sec 19(7)', trigger: 'Declaration deadline', limit: '12 months from Sec 11', consequence: 'LAPSE — entire acquisition void', severity: 'critical' },
  { section: 'Sec 21', trigger: 'Claims Notice publication', limit: '30 days', consequence: 'Claims auto-barred', severity: 'medium' },
  { section: 'Sec 23(1)', trigger: 'Collector enquiry', limit: '12 months from Sec 19', consequence: 'Award deemed passed', severity: 'medium' },
  { section: 'Sec 38', trigger: 'Possession post-award', limit: '60 days', consequence: 'Landowner can seek relief', severity: 'high' },
];

const MOCK_CASES = MOCK_PARCELS.map((p, idx) => {
  const proj = NATIONAL_PROJECTS.find(pr => pr.id === p.project_id);
  const isLapsed = Boolean(p.is_lapsed || (p.current_stage === 'notified' && p.blocker && p.blocker.assumed_resolution_days > 180));
  return {
    id: `c${(idx + 1).toString().padStart(3, '0')}`,
    parcel_id: p.id,
    survey_no: p.survey_no,
    project: proj ? proj.name : 'NH-927A Kota–Jhalawar Bypass',
    stage: p.current_stage,
    days_in_stage: isLapsed ? 340 : (idx * 17) % 120 + 20,
    lapsed: isLapsed,
    owner: p.owner_name || 'Landholder'
  };
});

const SEVERITY_STYLE: Record<string, { badgeClass: string }> = {
  critical: { badgeClass: 'bg-[#FFEBEE] dark:bg-rose-950/40 text-[#B32424] dark:text-rose-400 border-[#FFCDD2] dark:border-rose-800/50' },
  high: { badgeClass: 'bg-[#FFF3E0] dark:bg-orange-950/40 text-[#C2410C] dark:text-orange-400 border-[#FFE0B2] dark:border-orange-800/50' },
  medium: { badgeClass: 'bg-[#FFF8E1] dark:bg-amber-950/40 text-[#B36B00] dark:text-amber-400 border-[#FFE082] dark:border-amber-800/50' },
  low: { badgeClass: 'bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-400 border-[#C8E6C9] dark:border-emerald-800/50' },
};

const STAGE_STYLE: Record<string, { bg: string; color: string }> = {
  PRELIMINARY_NOTIFICATION: { bg: 'rgba(99,102,241,0.12)', color: '#818cf8' },
  HEARING_OF_OBJECTIONS: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  DECLARATION: { bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
  AWARD_ENQUIRY: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e' },
  POSSESSION: { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
};

export default function TimelinePage() {
  const pipelineStages = getPipelineStages();
  const totalCases = MOCK_CASES.length;
  const lapsedCases = MOCK_CASES.filter(c => c.lapsed).length;
  const activeCases = totalCases - lapsedCases;
  const avgDaysInStage = totalCases > 0 ? Math.round(MOCK_CASES.reduce((acc, c) => acc + c.days_in_stage, 0) / totalCases) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-[#0B2E59] text-white uppercase">
            RFCTLARR 2013 Compliance
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-[#14213D] dark:text-[#F0F4FF]">
          Acquisition Timeline Pipeline
        </h1>
        <p className="text-xs text-[#555555] dark:text-slate-400 mt-1">
          Stage-wise funnel analysis &bull; Statutory time-limit grid &bull; Lapse risk monitoring across all corridors
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm">
          <div className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider">Total Cases</div>
          <div className="text-2xl font-bold text-[#0B2E59] dark:text-sky-400 mt-1">{totalCases}</div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">Statutory pipeline cases</div>
        </div>

        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm">
          <div className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider">Active Cases</div>
          <div className="text-2xl font-bold text-[#1E7E34] dark:text-emerald-400 mt-1">{activeCases}</div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">Proceeding within limit</div>
        </div>

        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm">
          <div className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider">Lapsed Cases</div>
          <div className="text-2xl font-bold text-[#B32424] dark:text-rose-400 mt-1">{lapsedCases}</div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">Statutory breach alert</div>
        </div>

        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm">
          <div className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider">Avg Days in Stage</div>
          <div className="text-2xl font-bold text-[#B36B00] dark:text-amber-400 mt-1">{avgDaysInStage}d</div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">Turnaround duration</div>
        </div>
      </div>

      {/* Pipeline Funnel */}
      <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-5 shadow-sm">
        <div className="text-[10px] font-mono text-[#64748B] dark:text-slate-400 uppercase tracking-wider">Stage Funnel</div>
        <div className="text-sm font-bold text-[#14213D] dark:text-white mt-0.5 mb-4">Cases per RFCTLARR Stage</div>
        <div className="space-y-3">
          {pipelineStages.map((s) => (
            <div key={s.stage}>
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="font-semibold text-[#14213D] dark:text-slate-200">{s.stage}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-[#64748B] dark:text-slate-400">Limit: {s.limit}</span>
                  <span className="font-mono font-bold text-sm text-[#0B2E59] dark:text-sky-400">{s.cases}</span>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${s.pct}%`, backgroundColor: s.color || '#0B5FA5' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statutory Time Limits Grid */}
      <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#DCE2E8] dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="text-[10px] font-mono text-[#64748B] dark:text-slate-400 uppercase tracking-wider">Statutory Framework</div>
          <div className="text-sm font-bold text-[#14213D] dark:text-white mt-0.5">RFCTLARR Time Limit Reference</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[#F1F4F7] dark:bg-white/5 border-b border-[#DCE2E8] dark:border-white/10 text-[#555555] dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                {['Section', 'Trigger Event', 'Time Limit', 'Consequence on Lapse', 'Severity'].map(h => (
                  <th key={h} className="px-4 py-2.5 whitespace-nowrap font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE2E8] dark:divide-white/10">
              {RFCTLARR_LIMITS.map((r) => {
                const sev = SEVERITY_STYLE[r.severity] || SEVERITY_STYLE.medium;
                return (
                  <tr key={r.section} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#0B5FA5] dark:text-sky-400">{r.section}</td>
                    <td className="px-4 py-3 font-medium text-[#14213D] dark:text-white">{r.trigger}</td>
                    <td className="px-4 py-3 font-mono font-bold text-[#333333] dark:text-slate-200">{r.limit}</td>
                    <td className="px-4 py-3 text-[#555555] dark:text-slate-400">{r.consequence}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[3px] border uppercase font-mono ${sev.badgeClass}`}>
                        {r.severity}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#DCE2E8] dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="text-[10px] font-mono text-[#64748B] dark:text-slate-400 uppercase tracking-wider">Acquisition Cases</div>
          <div className="text-sm font-bold text-[#14213D] dark:text-white mt-0.5">Filterable Case Register</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[#F1F4F7] dark:bg-white/5 border-b border-[#DCE2E8] dark:border-white/10 text-[#555555] dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                {['Survey No.', 'Project', 'Stage', 'Days in Stage', 'Owner', 'Lapse Risk', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 whitespace-nowrap font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE2E8] dark:divide-white/10">
              {MOCK_CASES.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#64748B] text-xs">
                    No statutory acquisition cases registered. Awaiting operational data ingestion.
                  </td>
                </tr>
              ) : (
                MOCK_CASES.map((c) => {
                  const proj = NATIONAL_PROJECTS.find(pr => pr.name === c.project);
                  const projHref = proj ? `/projects/${proj.id}` : '/projects';
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#0B5FA5] dark:text-sky-400">
                        {c.survey_no}
                      </td>
                      <td className="px-4 py-3 text-[#333333] dark:text-slate-300 font-medium">{c.project}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] bg-slate-100 dark:bg-white/10 text-[#0B2E59] dark:text-sky-300 border border-slate-200 dark:border-white/10">
                          {c.stage.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">
                        <span className={c.days_in_stage > 300 ? 'text-[#B32424] dark:text-rose-400' : c.days_in_stage > 100 ? 'text-[#B36B00] dark:text-amber-400' : 'text-[#1E7E34] dark:text-emerald-400'}>
                          {c.days_in_stage}d
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#555555] dark:text-slate-400">{c.owner}</td>
                      <td className="px-4 py-3">
                        {c.lapsed ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-[3px] bg-[#FFEBEE] dark:bg-rose-950/40 text-[#B32424] dark:text-rose-400 border border-[#FFCDD2] dark:border-rose-800/50 uppercase">
                            <AlertTriangle className="w-2.5 h-2.5" /> LAPSED
                          </span>
                        ) : (
                          <span className="text-[#64748B] dark:text-slate-500 font-mono text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={projHref} className="font-bold text-[#0B5FA5] dark:text-sky-400 hover:underline flex items-center gap-1">
                          <span>Corridor</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
