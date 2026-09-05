import { apiClient, NATIONAL_PROJECTS } from '@/lib/api';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Activity, Compass, ArrowRight, AlertTriangle, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Corridor Portfolio | BHUMI',
  description: 'National infrastructure project directory, linear corridor alignments, and land acquisition status.',
};

const STAGE_COLORS: Record<string, { bg: string; color: string }> = {
  CRITICAL: { bg: 'rgba(244,63,94,0.15)', color: '#f43f5e' },
  NORMAL: { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
  DELAYED: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
};

export default async function ProjectsPage() {
  let projects: any[] = [];
  let errorMsg: string | null = null;

  try {
    projects = await apiClient.getProjects();
  } catch {
    errorMsg = 'Failed to retrieve project portfolio from operational service';
    projects = NATIONAL_PROJECTS;
  }

  const totalLength = projects.reduce((sum: number, p: any) => sum + (p.total_length_km || 0), 0);
  const delayedCount = projects.filter((p: any) => (p.project_delay_days || 0) > 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{
            fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.07em', textTransform: 'uppercase',
            padding: '3px 10px', borderRadius: 5,
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8'
          }}>
            {projects.length} Active Corridors
          </span>
        </div>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
          Corridor Portfolio Directory
        </h1>
        <p style={{ fontSize: 12, color: '#4a5568', marginTop: 6 }}>
          Comprehensive directory of linear infrastructure projects, RoW acquisition status, and schedule constraints
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Linear Alignment', val: `${totalLength.toFixed(1)} km`, color: '#6366f1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.22)' },
          { label: 'CP Overruns', val: `${delayedCount} Impacted`, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.22)' },
          { label: 'Statutory Framework', val: 'RFCTLARR 2013', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.22)' },
        ].map((s) => (
          <div key={s.label} style={{ borderRadius: 13, padding: '16px 20px', background: s.bg, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 10, color: '#6b7a94', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
              {s.label}
            </div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: s.color, marginTop: 4 }}>
              {s.val}
            </div>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div style={{ borderRadius: 12, padding: '12px 16px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle style={{ width: 15, height: 15, color: '#f43f5e', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#f43f5e' }}>Backend offline — showing local dataset</span>
        </div>
      )}

      {/* Project Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {projects.map((p: any) => {
          const pId = p.id || p.project_id;
          const hasDelay = (p.project_delay_days || 0) > 0;
          const isCP = Boolean(p.critical_path_blocked);
          const urgency = isCP ? 'CRITICAL' : hasDelay ? 'DELAYED' : 'NORMAL';
          const urg = STAGE_COLORS[urgency];

          return (
            <div key={pId} className="glass tr-hover" style={{ borderRadius: 14, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Card top accent bar */}
              <div style={{
                height: 3,
                background: isCP
                  ? 'linear-gradient(90deg, #f43f5e, #f97316)'
                  : hasDelay
                    ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                    : 'linear-gradient(90deg, #10b981, #6366f1)'
              }} />

              <div style={{ padding: '18px 20px', flex: 1 }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#3a4258', letterSpacing: '0.05em' }}>
                    {pId.substring(0, 8).toUpperCase()}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                    background: urg.bg, color: urg.color, letterSpacing: '0.04em',
                    textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace'
                  }}>
                    {urgency}
                  </span>
                </div>

                <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, color: '#c4cfe4', margin: '0 0 6px' }}>
                  <Link href={`/projects/${pId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {p.name}
                  </Link>
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#4a5568' }}>
                  <MapPin style={{ width: 11, height: 11 }} />
                  {p.state_name || 'National Scope'}{p.district_name ? ` · ${p.district_name}` : ''}
                  {p.total_length_km && (
                    <span style={{ marginLeft: 6, fontFamily: 'JetBrains Mono, monospace', color: '#6366f1' }}>
                      {p.total_length_km} km
                    </span>
                  )}
                </div>

                {/* Stats bar */}
                <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Overrun', val: hasDelay ? `+${p.project_delay_days}d` : '0d', color: hasDelay ? '#f43f5e' : '#10b981' },
                    { label: 'Clusters', val: `${p.spatial_cluster_count || 0}`, color: '#f59e0b' },
                    { label: 'Parcels', val: `${p.parcel_count || p.total_parcels || 0}`, color: '#6366f1' },
                  ].map((stat) => (
                    <div key={stat.label} style={{ textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                      <div style={{ fontSize: 9, color: '#3a4258', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'JetBrains Mono, monospace' }}>
                        {stat.label}
                      </div>
                      <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700, color: stat.color, marginTop: 2 }}>
                        {stat.val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card footer actions */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8 }}>
                <Link href={`/projects/${pId}`} style={{
                  flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 7, fontSize: 11, fontWeight: 600,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8899b4', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                }}>
                  Overview <ArrowRight style={{ width: 11, height: 11 }} />
                </Link>
                <Link href={`/projects/${pId}/impact`} style={{
                  flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 7, fontSize: 11, fontWeight: 600,
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                }}>
                  <Activity style={{ width: 11, height: 11 }} /> Impact
                </Link>
                <Link href={`/projects/${pId}/spatial`} style={{
                  flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 7, fontSize: 11, fontWeight: 600,
                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                }}>
                  <Compass style={{ width: 11, height: 11 }} /> GIS
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {projects.length === 0 && !errorMsg && (
        <div style={{
          padding: '48px 24px', textAlign: 'center', borderRadius: 14,
          border: '1px dashed rgba(255,255,255,0.1)', color: '#4a5568', fontSize: 13
        }}>
          No active corridor alignments registered. Awaiting operational data ingestion.
        </div>
      )}
    </div>
  );
}
