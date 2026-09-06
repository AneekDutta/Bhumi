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
    CRITICAL: { bg: 'rgba(244,63,94,0.08)', color: '#f43f5e', border: 'rgba(244,63,94,0.3)', barColor: '#f43f5e' },
    HIGH: { bg: 'rgba(249,115,22,0.08)', color: '#f97316', border: 'rgba(249,115,22,0.3)', barColor: '#f97316' },
    MEDIUM: { bg: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)', barColor: '#f59e0b' },
    LOW: { bg: 'rgba(16,185,129,0.08)', color: '#10b981', border: 'rgba(16,185,129,0.3)', barColor: '#10b981' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
        <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Dashboard</Link>
        <span>/</span>
        <Link href="/projects" style={{ color: '#94a3b8', textDecoration: 'none' }}>Corridors</Link>
        <span>/</span>
        <Link href={`/projects/${project.id}`} style={{ color: '#94a3b8', textDecoration: 'none' }}>{project.name}</Link>
        <span>/</span>
        <span style={{ color: '#1e293b' }}>Bottleneck Intelligence</span>
      </nav>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', padding: '2px 8px', borderRadius: 4, background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Critical Chain Analysis
            </span>
          </div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#0a2c5f', margin: 0 }}>
            Corridor Bottleneck Intelligence
          </h1>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
            Graph traversal of statutory milestones, parcel dependency chains, and active legal injunctions
          </p>
        </div>
        <Link href={`/projects/${project.id}/impact`} style={{ padding: '9px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#0a2c5f', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity style={{ width: 13, height: 13 }} /> Simulate Impact
        </Link>
      </div>

      {/* Summary KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Bottlenecks', val: `${bottlenecks.length} Detected`, color: '#0a2c5f', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.22)', sub: 'Across surveys & legal hearings' },
          { label: 'Zero-Float Blockers', val: `${criticalCount} Critical`, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.22)', sub: `Directly delaying completion +${project.project_delay_days || 0}d` },
          { label: 'Float Consumption', val: `${highCount} High`, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.22)', sub: 'Consuming activity float on corridor' },
        ].map((s) => (
          <div key={s.label} style={{ borderRadius: 13, padding: '18px 20px', background: s.bg, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>{s.label}</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.val}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Bottleneck Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {bottlenecks.map((b: any, idx: number) => {
          const u = URGENCY_STYLE[b.status] || URGENCY_STYLE.MEDIUM;
          return (
            <div key={idx} className="glass" style={{ borderRadius: 14, overflow: 'hidden', padding: 0, borderLeft: `4px solid ${u.barColor}` }}>
              {/* Card header */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: u.bg, color: u.color, border: `1px solid ${u.border}`, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'JetBrains Mono, monospace' }}>
                    {b.status} URGENCY
                  </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                    {b.entity_type}: {b.entity_id}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8' }}>
                  <GitBranch style={{ width: 12, height: 12, color: '#0a2c5f' }} />
                  Downstream: <strong style={{ color: '#0a2c5f', fontFamily: 'JetBrains Mono, monospace', marginLeft: 4 }}>{b.downstream_impact_count} CPM Activities</strong>
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <AlertTriangle style={{ width: 10, height: 10, color: '#f43f5e' }} /> Statutory Impediments
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {b.reasons?.map((r: string, i: number) => (
                      <li key={i} style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: u.color, flexShrink: 0, marginTop: 6 }} />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <AlertOctagon style={{ width: 10, height: 10, color: '#f59e0b' }} /> Contractual Milestones Exposed
                  </div>
                  {b.affected_milestones?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {b.affected_milestones.map((m: string, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(10,44,95,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7 }}>
                          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#475569' }}>Milestone: {m}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#f43f5e' }}>Penalties at Risk</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>No direct contractual milestone breaches recorded.</p>
                  )}
                </div>
              </div>

              {/* Recommendation footer */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', background: 'rgba(99,102,241,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <Scale style={{ width: 13, height: 13, color: '#0a2c5f', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
                    {b.status === 'CRITICAL'
                      ? 'Invoke RFCTLARR Section 40 urgency powers or fast-track SLAO awards to clear zero-float constraint.'
                      : 'Instruct District Collector counsel for urgent hearing to vacate Bombay HC interim stay order.'}
                  </span>
                </div>
                <Link href={`/projects/${project.id}/impact`} style={{ padding: '7px 14px', borderRadius: 7, fontSize: 11, fontWeight: 700, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.35)', color: '#0a2c5f', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                  Model Resolution <ArrowRight style={{ width: 11, height: 11 }} />
                </Link>
              </div>

              {/* Causal chain */}
              {b.blocking_chain?.length > 0 && (
                <div style={{ padding: '10px 20px', borderTop: '1px solid #e2e8f0', background: 'rgba(10,44,95,0.04)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>Causal Chain:</span>
                  {b.blocking_chain.map((node: string, nIdx: number) => (
                    <React.Fragment key={nIdx}>
                      <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#1e293b' }}>
                        {node}
                      </span>
                      {nIdx < b.blocking_chain.length - 1 && (
                        <span style={{ color: '#0a2c5f', fontWeight: 700 }}>→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {bottlenecks.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center', borderRadius: 14, border: '1px dashed rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 13 }}>
            No critical bottlenecks currently detected along this project corridor.
          </div>
        )}
      </div>
    </div>
  );
}
