import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DocumentRegister } from '@/components/documents/DocumentRegister';
import { Activity, Compass, AlertTriangle, CheckCircle2, Clock, ArrowRight, AlertOctagon, Sparkles } from 'lucide-react';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
        <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Dashboard</Link>
        <span style={{ color: '#2d3748' }}>/</span>
        <Link href="/projects" style={{ color: '#94a3b8', textDecoration: 'none' }}>Corridors</Link>
        <span style={{ color: '#2d3748' }}>/</span>
        <span style={{ color: '#1e293b' }}>{project.name}</span>
      </nav>

      {/* Provenance Matrix Banner */}
      <DataRealityBanner />

      {/* Project Hero Banner */}
      <div style={{
        borderRadius: 16, padding: '24px 28px', overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(8,9,20,0) 60%)',
        border: '1px solid rgba(99,102,241,0.25)',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 320, height: 320, borderRadius: '50%', background: 'rgba(99,102,241,0.06)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, position: 'relative' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#94a3b8', letterSpacing: '0.08em' }}>
                ID:{project.id.substring(0, 8).toUpperCase()}
              </span>
              {hasDelay && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                  background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e',
                  textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace'
                }}>
                  ⚠ +{project.project_delay_days}d Overrun
                </span>
              )}
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981',
                textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace'
              }}>Active Alignment</span>
            </div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#0a2c5f', margin: 0 }}>
              {project.name}
            </h1>
            <p style={{ marginTop: 8, fontSize: 12, color: '#94a3b8', display: 'flex', gap: 12 }}>
              <span>Length: <strong style={{ color: '#0a2c5f', fontFamily: 'JetBrains Mono, monospace' }}>{project.total_length_km ?? 0} km</strong></span>
              <span>Area: <strong style={{ color: '#0a2c5f', fontFamily: 'JetBrains Mono, monospace' }}>{totalAreaHa.toFixed(2)} Ha</strong></span>
              <span>State: <strong style={{ color: '#1e293b' }}>{project.state_name || 'National Scope'}</strong></span>
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href={`/projects/${project.id}/spatial`} style={{
              padding: '9px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700,
              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6
            }}>
              <Compass style={{ width: 13, height: 13 }} /> Spatial Map
            </Link>
            <Link href={`/projects/${project.id}/impact`} style={{
              padding: '9px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700,
              background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.35)', color: '#0a2c5f',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6
            }}>
              <Activity style={{ width: 13, height: 13 }} /> Impact & Simulation
            </Link>
            <Link href={`/projects/${project.id}/intelligence`} style={{
              padding: '9px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700,
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)', color: '#f59e0b',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6
            }}>
              <AlertOctagon style={{ width: 13, height: 13 }} /> Bottlenecks
            </Link>
          </div>
        </div>

        {/* RoW Progress */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 8, color: '#94a3b8' }}>
            <span>Right-of-Way (RoW) Possession Progress
              <strong style={{ color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace', marginLeft: 6 }}>{percentPossessed}%</strong>
            </span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{possessedParcels.length} / {parcels.length} Parcels</span>
          </div>
          <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${percentPossessed}%`, background: 'linear-gradient(90deg,#10b981,#6366f1)', height: '100%', borderRadius: '99px 0 0 99px', transition: 'width 0.5s' }} />
            <div style={{ flex: 1, background: 'rgba(245,158,11,0.3)', height: '100%' }} />
          </div>
        </div>
      </div>

      {/* Segments */}
      <div className="glass" style={{ borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 16 }}>
          Alignment Corridor Segments
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {parcels.length > 0 ? (
            Array.from(new Set(parcels.map(p => p.village_name || 'Alignment Corridor'))).map((village) => {
              const villageParcels = parcels.filter(p => (p.village_name || 'Alignment Corridor') === village);
              const unresolved = villageParcels.filter(p => p.status === 'UNRESOLVED');
              const hasDelay = unresolved.length > 0;
              return (
                <div key={village} style={{ borderRadius: 10, padding: '14px 16px', background: 'rgba(10,44,95,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{village} Segment</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                      background: hasDelay ? 'rgba(244,63,94,0.12)' : 'rgba(16,185,129,0.12)',
                      color: hasDelay ? '#f43f5e' : '#10b981',
                      border: `1px solid ${hasDelay ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)'}`,
                      whiteSpace: 'nowrap'
                    }}>
                      {hasDelay ? `${unresolved.length} Unresolved` : '100% Possessed'}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 8px' }}>
                    {villageParcels.length} Registered Parcels ({villageParcels.reduce((s, p) => s + (p.area_hectares || 0), 0).toFixed(2)} Ha)
                  </p>
                  <div style={{
                    fontSize: 11,
                    color: hasDelay ? '#f43f5e' : '#10b981',
                    padding: '8px 12px', borderRadius: 7,
                    background: hasDelay ? 'rgba(244,63,94,0.08)' : 'rgba(16,185,129,0.08)',
                    border: `1px solid ${hasDelay ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)'}`
                  }}>
                    {hasDelay ? `Parcels: ${unresolved.map(p => p.survey_no).join(', ')} pending acquisition` : 'Clear Right-of-Way secured for civil works'}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '20px', borderRadius: 10, background: 'rgba(10,44,95,0.04)', border: '1px solid #e2e8f0', color: '#94a3b8', fontSize: 12 }}>
              Awaiting parcel cadastral mapping for corridor alignment.
            </div>
          )}
        </div>
      </div>

      {/* Parcels Table */}
      <div className="glass" style={{ borderRadius: 14, overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Mapped Land Parcels</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>Cadastral Survey Register</div>
          </div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#0a2c5f' }}>
            {parcels.length} Parcels
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                {['Survey No.', 'Area (Ha)', 'Classification', 'Stage', 'Possession', ''].map((h) => (
                  <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', background: 'rgba(10,44,95,0.04)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parcels.map((p: any) => {
                const isPossessed = p.status === 'POSSESSION' || p.status === 'RESOLVED';
                const isLapsed = Boolean(p.is_lapsed);
                const stageCol = STAGE_COLOR[p.current_stage] || '#6b7a94';
                return (
                  <tr key={p.id} className="tr-hover" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 18px' }}>
                      <Link href={`/parcels/${p.id}`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: '#0a2c5f', textDecoration: 'none' }}>
                        Survey No. {p.survey_no}
                      </Link>
                      {isLapsed && (
                        <span style={{ marginLeft: 8, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: 'rgba(244,63,94,0.15)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', textTransform: 'uppercase' }}>
                          Sec 19(7) Lapsed
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 18px', fontFamily: 'JetBrains Mono, monospace', color: '#475569' }}>{p.area_hectares} Ha</td>
                    <td style={{ padding: '12px 18px', color: '#94a3b8' }}>{p.classification || 'Agricultural'}</td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: `${stageCol}18`, color: stageCol, border: `1px solid ${stageCol}35`, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>
                        {p.current_stage || 'PRELIMINARY_NOTIFICATION'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: isPossessed ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: isPossessed ? '#10b981' : '#f59e0b', border: `1px solid ${isPossessed ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                        {isPossessed ? <CheckCircle2 style={{ width: 11, height: 11 }} /> : <Clock style={{ width: 11, height: 11 }} />}
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <Link href={`/parcels/${p.id}`} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        Inspect <ArrowRight style={{ width: 11, height: 11 }} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {parcels.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                    No land parcels mapped to this project alignment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Register */}
      <div style={{ paddingTop: 8 }}>
        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>
          Corridor Document Register
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>
          Statutory Gazette Notifications & Awards
        </div>
        <DocumentRegister projectId={project.id} />
      </div>
    </div>
  );
}
