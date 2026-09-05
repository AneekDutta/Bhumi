import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { apiClient, NATIONAL_PROJECTS } from '@/lib/api';
import { PortfolioMap } from '@/components/dashboard/PortfolioMap';
import { PortfolioTable } from '@/components/dashboard/PortfolioTable';
import { ArrowRight, Activity, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'National Operations | BHUMI',
  description: 'National infrastructure project portfolio overview, critical path delay analysis, and land acquisition bottlenecks.',
};

async function getDashboardSummary() {
  try { return await apiClient.getDashboardSummary(); } catch { return null; }
}
async function getDashboardProjects() {
  try { return await apiClient.getDashboardProjects(100); } catch { return { items: [] }; }
}

export default async function NationalDashboardPage() {
  const summary = await getDashboardSummary();
  const projectsData = await getDashboardProjects();

  const totalProjects = summary?.total_projects ?? NATIONAL_PROJECTS.length;
  const delayedProjects = summary?.delayed_projects ?? NATIONAL_PROJECTS.filter(p => (p.project_delay_days || 0) > 0).length;
  const unresolvedParcels = summary?.unresolved_parcels ?? NATIONAL_PROJECTS.reduce((s, p) => s + (p.unresolved_parcel_count || 0), 0);
  const cpBlocked = summary?.critical_path_blocked_projects ?? NATIONAL_PROJECTS.filter(p => p.critical_path_blocked).length;
  const lapseRisks = summary?.lapse_risks ?? 0;
  const firstProject = projectsData.items[0] || NATIONAL_PROJECTS[0];

  const kpis = [
    { label: 'Active Corridors', value: totalProjects, sub: `${totalProjects} national alignment${totalProjects === 1 ? '' : 's'}`, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)' },
    { label: 'CP Lapse Risks', value: lapseRisks, sub: 'Sec 19(7) exposure', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.25)' },
    { label: 'Unresolved Parcels', value: unresolvedParcels, sub: 'Pending possession', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
    { label: 'Delayed Corridors', value: delayedProjects, sub: 'Schedule overrun', color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)' },
    { label: 'CP Blocked', value: cpBlocked, sub: 'Zero-float halted', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* LIVE header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '4px 10px', borderRadius: 6,
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981'
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            LIVE
          </span>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#3a4258', letterSpacing: '0.05em' }}>
            SIH26016 · National Command View · IST
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/reports" style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#8899b4', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6
          }}>
            MIS Reports
          </Link>
          {firstProject && (
            <Link href={`/projects/${firstProject.id}/impact`} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
              color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6
            }}>
              <Activity style={{ width: 13, height: 13 }} />
              Simulate Interventions
            </Link>
          )}
        </div>
      </div>

      {/* Hero title */}
      <div>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 28, fontWeight: 800, color: '#e2e8f0', margin: 0, lineHeight: 1.15 }}>
          National Land Acquisition<br />
          <span style={{ color: '#6366f1' }}>& Project Operations</span>
        </h1>
        <p style={{ marginTop: 8, fontSize: 13, color: '#4a5568', lineHeight: 1.6 }}>
          Real-time corridor alignment monitoring · RFCTLARR 2013 statutory compliance · Deterministic CPM delay mitigation
        </p>
      </div>

      {/* Critical Alert Banner */}
      {delayedProjects > 0 || cpBlocked > 0 ? (
        <div style={{
          borderRadius: 12, padding: '14px 18px',
          background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle style={{ width: 16, height: 16, color: '#f43f5e', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f43f5e' }}>
                STATUTORY OVERRUN · {firstProject?.name || 'Active Alignment Corridor'}
              </div>
              <div style={{ fontSize: 11, color: '#6b7a94', marginTop: 2 }}>
                {firstProject?.project_delay_days || 0} days critical path slippage · {firstProject?.unresolved_parcel_count || unresolvedParcels} unresolved parcels pending possession
              </div>
            </div>
          </div>
          {firstProject && (
            <Link href={`/projects/${firstProject.id}/impact`} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: 'rgba(244,63,94,0.2)', border: '1px solid rgba(244,63,94,0.4)',
              color: '#f43f5e', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap'
            }}>
              Model Counterfactual <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          )}
        </div>
      ) : (
        <div style={{
          borderRadius: 12, padding: '12px 18px',
          background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            <div style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>
              {totalProjects > 0
                ? 'OPERATIONAL READINESS · All Active Corridors Within Scheduled Float Thresholds'
                : 'AWAITING DATA INGESTION · No Corridors Registered · Ingest real operational data to activate tracking'}
            </div>
          </div>
          {totalProjects > 0 && (
            <Link href="/projects" style={{ fontSize: 11, color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>
              View Corridor Portfolio →
            </Link>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{
            borderRadius: 13, padding: '18px 20px',
            background: k.bg, border: `1px solid ${k.border}`
          }}>
            <div style={{ fontSize: 10, color: '#6b7a94', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
              {k.label}
            </div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 38, fontWeight: 800, color: k.color, lineHeight: 1.1, marginTop: 4 }}>
              {k.value}
            </div>
            <div style={{ fontSize: 11, color: '#4a5568', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Stats strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1,
        borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)'
      }}>
        {[
          { label: 'Corridor Pipeline', val: `${summary?.total_length_km || 0} km Total Alignment`, col: '#e2e8f0' },
          { label: 'Acquisition Progress', val: `${(summary?.total_parcels || 0) > 0 ? Math.round(((summary!.total_parcels - unresolvedParcels) / summary!.total_parcels) * 100) : 0}% Possessed (${unresolvedParcels} Pending)`, col: '#f59e0b' },
          { label: 'CPM Schedule', val: delayedProjects > 0 ? `${delayedProjects} Corridors with Overrun` : 'Zero Schedule Variance', col: delayedProjects > 0 ? '#f43f5e' : '#10b981' },
          { label: 'Statutory Rule Clock', val: lapseRisks > 0 ? `${lapseRisks} Lapse Alert(s)` : 'All Timelines Compliant', col: lapseRisks > 0 ? '#f43f5e' : '#10b981' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px 20px' }}>
            <div style={{ fontSize: 10, color: '#3a4258', letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.col, fontFamily: 'JetBrains Mono, monospace' }}>
              {s.val}
            </div>
          </div>
        ))}
      </div>

      {/* Portfolio Map */}
      <div className="glass" style={{ borderRadius: 16, overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#3a4258', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Corridor Spatial GIS
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#c4cfe4', marginTop: 2 }}>
              National Alignment Overview
            </div>
          </div>
          <span style={{
            fontSize: 10, fontFamily: 'JetBrains Mono, monospace', padding: '4px 10px', borderRadius: 6,
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8'
          }}>
            {NATIONAL_PROJECTS.length} Active Corridors
          </span>
        </div>
        <PortfolioMap projects={projectsData.items} />
      </div>

      {/* Portfolio Table */}
      <div className="glass" style={{ borderRadius: 16, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#3a4258', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Project Corridor Directory
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#c4cfe4', marginTop: 2 }}>
              Ranked by Delay &amp; Statutory Severity
            </div>
          </div>
          <Link href="/projects" style={{
            fontSize: 12, fontWeight: 600, color: '#818cf8', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            View Full Directory <ArrowRight style={{ width: 13, height: 13 }} />
          </Link>
        </div>
        <PortfolioTable projects={projectsData.items} />
      </div>
    </div>
  );
}
