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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      
      {/* Official Government Portfolio Banner */}
      <div style={{
        padding: '10px 16px',
        borderRadius: 10,
        background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10,
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 4,
            background: '#0a2c5f',
            color: '#fff',
            textTransform: 'uppercase'
          }}>
            NATIONAL INFRASTRUCTURE PORTFOLIO
          </span>
          <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>
            Inter-Ministerial Strategic Infrastructure Alignments &bull; CALA Oversight
          </span>
        </div>
        <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
          Priority Capital Projects
        </span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.07em', textTransform: 'uppercase',
              padding: '3px 10px', borderRadius: 5,
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#0a2c5f'
            }}>
              {projects.length} National Corridors
            </span>
            <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
              Highways &middot; Railways &middot; Industrial &middot; Energy &middot; Urban
            </span>
          </div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#0a2c5f', margin: 0 }}>
            Government Infrastructure Project Portfolio
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Strategic alignment directory for linear corridors and land acquisition milestones across Central &amp; State departments
          </p>
        </div>

        <Link
          href="/projects/gis"
          style={{
            padding: '9px 18px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #0a2c5f, #082449)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)'
          }}
        >
          <Navigation style={{ width: 14, height: 14 }} />
          <span>Open Project Spatial Map</span>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div style={{ borderRadius: 12, padding: '16px 18px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Total Length</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: '#0a2c5f', marginTop: 4 }}>
            {totalLength.toFixed(1)} <span style={{ fontSize: 13, fontWeight: 500 }}>km</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Linear corridor alignments</div>
        </div>

        <div style={{ borderRadius: 12, padding: '16px 18px', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Planned Acquisition</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: '#0284c7', marginTop: 4 }}>
            {totalPlannedAcq.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 500 }}>Ha</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Across 6 strategic sectors</div>
        </div>

        <div style={{ borderRadius: 12, padding: '16px 18px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Acquired to Date</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
            {totalAcquired.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 500 }}>Ha</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{avgProgress}% Portfolio throughput</div>
        </div>

        <div style={{ borderRadius: 12, padding: '16px 18px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Macro Bottlenecks</div>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
            {projects.reduce((s, p) => s + p.statistics.unresolved_bottlenecks, 0)}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Projected corridor clusters</div>
        </div>
      </div>

      {/* Projects Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {projects.map((p) => {
          const isDelayed = p.status === 'DELAYED' || p.status === 'CRITICAL_BLOCKER';
          return (
            <div
              key={p.id}
              className="glass"
              style={{
                borderRadius: 14,
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 16,
                border: isDelayed ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div>
                {/* Sector and Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{
                    fontSize: 10,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 5,
                    background: 'rgba(99,102,241,0.15)',
                    color: '#0a2c5f',
                    border: '1px solid rgba(99,102,241,0.3)'
                  }}>
                    {p.sector.toUpperCase()}
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 5,
                    background: isDelayed ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                    color: isDelayed ? '#f59e0b' : '#10b981',
                    border: `1px solid ${isDelayed ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`
                  }}>
                    {p.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Project Title */}
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0a2c5f', margin: '0 0 6px', lineHeight: 1.3 }}>
                  {p.name}
                </h3>
                <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'JetBrains Mono, monospace', marginBottom: 12 }}>
                  {p.code} &middot; {p.state} ({p.district})
                </div>

                {/* Department */}
                <div style={{ fontSize: 11, color: '#64748b', background: '#ffffff', padding: '6px 10px', borderRadius: 6, marginBottom: 14 }}>
                  {p.department}
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: '#64748b' }}>Acquisition Progress</span>
                    <span style={{ color: '#10b981', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                      {p.acquisition_progress_pct}%
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' }}>
                    <div style={{ width: `${p.acquisition_progress_pct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)' }} />
                  </div>
                </div>

                {/* Key Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                  <div style={{ padding: '6px 8px', borderRadius: 6, background: '#f8fafc' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>Planned Area</span>
                    <span style={{ color: '#0a2c5f', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                      {p.planned_acquisition_ha} Ha
                    </span>
                  </div>
                  <div style={{ padding: '6px 8px', borderRadius: 6, background: '#f8fafc' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: 10 }}>Delay Impact</span>
                    <span style={{ color: isDelayed ? '#f59e0b' : '#10b981', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                      +{p.project_delay_days} Days
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Link */}
              <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                  Target: {p.timeline_target}
                </span>
                <Link
                  href={`/projects/gis?id=${p.id}`}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#0a2c5f',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <span>Inspect Spatial Corridor</span>
                  <ArrowRight style={{ width: 12, height: 12 }} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
