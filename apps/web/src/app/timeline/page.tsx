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
  const countStage = (s: string) => MOCK_PARCELS.filter(p => p.current_stage?.toUpperCase().includes(s)).length;
  const calcPct = (cnt: number) => total > 0 ? Math.round((cnt / total) * 100) : 0;
  return [
    { stage: 'SIA / Sec 4', cases: countStage('SIA'), limit: '6 months', color: '#6366f1', pct: calcPct(countStage('SIA')) },
    { stage: 'Sec 11 Notification', cases: countStage('PRELIMINARY') + countStage('NOTIF'), limit: '–', color: '#8b5cf6', pct: calcPct(countStage('PRELIMINARY') + countStage('NOTIF')) },
    { stage: 'Sec 15 Objections', cases: countStage('OBJECTION') + countStage('HEARING'), limit: '60 days', color: '#a78bfa', pct: calcPct(countStage('OBJECTION') + countStage('HEARING')) },
    { stage: 'Sec 19 Declaration', cases: countStage('DECLARATION'), limit: '12 months', color: '#f59e0b', pct: calcPct(countStage('DECLARATION')) },
    { stage: 'Sec 21 Claims Notice', cases: countStage('CLAIM') + countStage('NOTICE'), limit: '30 days', color: '#f97316', pct: calcPct(countStage('CLAIM') + countStage('NOTICE')) },
    { stage: 'Sec 23 Award', cases: countStage('AWARD') + countStage('ENQUIRY'), limit: '12 months', color: '#f43f5e', pct: calcPct(countStage('AWARD') + countStage('ENQUIRY')) },
    { stage: 'Sec 38 Possession', cases: countStage('POSSESSION'), limit: '60 days', color: '#10b981', pct: calcPct(countStage('POSSESSION')) },
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
  return {
    id: `c${(idx + 1).toString().padStart(3, '0')}`,
    parcel_id: p.id,
    survey_no: p.survey_no,
    project: proj ? proj.name : 'Operational Corridor',
    stage: p.current_stage,
    days_in_stage: p.is_lapsed ? 340 : (idx * 31) % 180 + 15,
    lapsed: Boolean(p.is_lapsed),
    owner: p.owner_name || 'Landholder'
  };
});

const SEVERITY_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  critical: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: 'rgba(244,63,94,0.3)' },
  high: { bg: 'rgba(249,115,22,0.12)', color: '#f97316', border: 'rgba(249,115,22,0.3)' },
  medium: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  low: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', padding: '2px 8px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            RFCTLARR 2013 Compliance
          </span>
        </div>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
          Acquisition Timeline Pipeline
        </h1>
        <p style={{ fontSize: 12, color: '#4a5568', marginTop: 6 }}>
          Stage-wise funnel analysis · Statutory time-limit grid · Lapse risk monitoring across all corridors
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Cases', val: totalCases, color: '#6366f1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.22)' },
          { label: 'Active Cases', val: activeCases, color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.22)' },
          { label: 'Lapsed Cases', val: lapsedCases, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.22)' },
          { label: 'Avg Days in Stage', val: avgDaysInStage, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.22)' },
        ].map((s) => (
          <div key={s.label} style={{ borderRadius: 13, padding: '16px 18px', background: s.bg, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 10, color: '#6b7a94', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>{s.label}</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 34, fontWeight: 800, color: s.color, lineHeight: 1.1, marginTop: 4 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Pipeline Funnel */}
      <div className="glass" style={{ borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#3a4258', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Stage Funnel</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#c4cfe4', marginBottom: 20 }}>Cases per RFCTLARR Stage</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pipelineStages.map((s) => (
            <div key={s.stage}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#c4cfe4' }}>{s.stage}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#4a5568' }}>Limit: {s.limit}</span>
                  <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 800, color: s.color }}>{s.cases}</span>
                </div>
              </div>
              <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${s.pct}%`, height: '100%', background: s.color, borderRadius: 99, opacity: 0.85 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statutory Time Limits Grid */}
      <div className="glass" style={{ borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#3a4258', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Statutory Framework</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#c4cfe4', marginBottom: 16 }}>RFCTLARR Time Limit Reference</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['Section', 'Trigger Event', 'Time Limit', 'Consequence on Lapse', 'Severity'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#3a4258', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RFCTLARR_LIMITS.map((r) => {
                const sev = SEVERITY_STYLE[r.severity];
                return (
                  <tr key={r.section} className="tr-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#818cf8' }}>{r.section}</td>
                    <td style={{ padding: '11px 14px', color: '#8899b4' }}>{r.trigger}</td>
                    <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#c4cfe4' }}>{r.limit}</td>
                    <td style={{ padding: '11px 14px', color: '#6b7a94', fontSize: 11 }}>{r.consequence}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`, textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
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
      <div className="glass" style={{ borderRadius: 14, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#3a4258', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Acquisition Cases</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#c4cfe4', marginTop: 2 }}>Filterable Case Register</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['Survey No.', 'Project', 'Stage', 'Days in Stage', 'Owner', 'Lapse Risk', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#3a4258', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_CASES.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', color: '#6b7a94', fontSize: 13 }}>
                    No statutory acquisition cases registered. Awaiting operational data ingestion.
                  </td>
                </tr>
              ) : (
                MOCK_CASES.map((c) => {
                  const stageStyle = STAGE_STYLE[c.stage] || { bg: 'rgba(99,102,241,0.1)', color: '#818cf8' };
                  const proj = NATIONAL_PROJECTS.find(pr => pr.name === c.project);
                  const projHref = proj ? `/projects/${proj.id}` : '/projects';
                  return (
                    <tr key={c.id} className="tr-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#818cf8' }}>{c.survey_no}</span>
                      </td>
                      <td style={{ padding: '11px 16px', color: '#8899b4', fontSize: 11 }}>{c.project}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: stageStyle.bg, color: stageStyle.color, fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
                          {c.stage.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, color: c.days_in_stage > 300 ? '#f43f5e' : c.days_in_stage > 100 ? '#f59e0b' : '#10b981' }}>
                          {c.days_in_stage}d
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', color: '#6b7a94', fontSize: 11 }}>{c.owner}</td>
                      <td style={{ padding: '11px 16px' }}>
                        {c.lapsed ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(244,63,94,0.15)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', textTransform: 'uppercase' }}>
                            <AlertTriangle style={{ width: 9, height: 9 }} /> LAPSED
                          </span>
                        ) : (
                          <span style={{ fontSize: 9, color: '#3a4258', fontFamily: 'JetBrains Mono, monospace' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <Link href={projHref} style={{ fontSize: 11, fontWeight: 600, color: '#6b7a94', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                          Corridor <ArrowRight style={{ width: 11, height: 11 }} />
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
