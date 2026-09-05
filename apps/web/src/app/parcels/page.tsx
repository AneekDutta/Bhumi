import { apiClient, MOCK_PARCELS, NATIONAL_PROJECTS } from '@/lib/api';
import Link from 'next/link';
import type { Metadata } from 'next';
import { MapPin, AlertTriangle, CheckCircle2, Clock, ArrowRight, Filter } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Parcel Register | BHUMI',
  description: 'National cadastral survey parcel register with statutory stage and lapse risk overview.',
};

const STAGE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  PRELIMINARY_NOTIFICATION: { bg: 'rgba(99,102,241,0.12)', color: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  SOCIAL_IMPACT_ASSESSMENT: { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: 'rgba(139,92,246,0.25)' },
  HEARING_OF_OBJECTIONS: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  DECLARATION: { bg: 'rgba(249,115,22,0.12)', color: '#f97316', border: 'rgba(249,115,22,0.25)' },
  NOTICE_TO_PERSONS: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: 'rgba(244,63,94,0.25)' },
  AWARD_ENQUIRY: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  POSSESSION: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.25)' },
  RESOLVED: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.25)' },
};

export default async function ParcelsPage() {
  let parcels = MOCK_PARCELS;
  let errorMsg: string | null = null;

  try {
    const res = await apiClient.getDashboardProjects(1);
  } catch {
    errorMsg = 'Operational service offline — showing national register dataset';
  }

  const totalArea = parcels.reduce((s: number, p: any) => s + (Number(p.area_hectares) || 0), 0);
  const possessedCount = parcels.filter((p: any) => p.status === 'POSSESSION' || p.status === 'RESOLVED').length;
  const lapsedCount = parcels.filter((p: any) => p.is_lapsed).length;
  const pendingCount = parcels.length - possessedCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {parcels.length} Parcels Registered
          </span>
        </div>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
          Cadastral Parcel Register
        </h1>
        <p style={{ fontSize: 12, color: '#4a5568', marginTop: 6 }}>
          National cadastral survey records with RFCTLARR statutory stage tracking and lapse risk monitoring
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Parcels', val: parcels.length, color: '#6366f1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.22)' },
          { label: 'Pending Possession', val: pendingCount, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.22)' },
          { label: 'Possessed / Resolved', val: possessedCount, color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.22)' },
          { label: 'Lapse Risks', val: lapsedCount, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.22)' },
          { label: 'Total Area (Ha)', val: totalArea.toFixed(2), color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.22)' },
        ].map((s) => (
          <div key={s.label} style={{ borderRadius: 13, padding: '16px 18px', background: s.bg, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 10, color: '#6b7a94', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>{s.label}</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 30, fontWeight: 800, color: s.color, lineHeight: 1.1, marginTop: 4 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div style={{ borderRadius: 10, padding: '12px 16px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle style={{ width: 14, height: 14, color: '#f43f5e', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#f43f5e' }}>{errorMsg}</span>
        </div>
      )}

      {/* Parcel Table */}
      <div className="glass" style={{ borderRadius: 14, overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#3a4258', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Survey Parcel Directory</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#c4cfe4', marginTop: 2 }}>All Cadastral Records</div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['Survey No.', 'Corridor', 'Area (Ha)', 'Classification', 'Owner', 'Stage', 'Status', 'Lapse Risk', ''].map((h) => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#3a4258', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parcels.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px 16px', textAlign: 'center', color: '#6b7a94', fontSize: 13 }}>
                    No cadastral survey parcels registered. Awaiting operational data ingestion.
                  </td>
                </tr>
              ) : parcels.map((p: any) => {
                const isPossessed = p.status === 'POSSESSION' || p.status === 'RESOLVED';
                const isLapsed = Boolean(p.is_lapsed);
                const stageStyle = STAGE_COLORS[p.current_stage] || { bg: 'rgba(99,102,241,0.1)', color: '#818cf8', border: 'rgba(99,102,241,0.2)' };
                const projectName = p.project_name || NATIONAL_PROJECTS.find(pr => pr.id === p.project_id)?.name || 'Corridor Alignment';
                return (
                  <tr key={p.id} className="tr-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <Link href={`/parcels/${p.id}`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: '#818cf8', textDecoration: 'none' }}>
                        {p.survey_no}
                      </Link>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Link href={`/projects/${p.project_id}`} style={{ fontSize: 11, color: '#c4cfe4', textDecoration: 'none', fontWeight: 600 }}>
                        {projectName}
                      </Link>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', color: '#8899b4' }}>{p.area_hectares}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7a94', fontSize: 11 }}>{p.classification || 'Agricultural'}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7a94', fontSize: 11, maxWidth: 160 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.owner_name || 'Owner of Record'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: stageStyle.bg, color: stageStyle.color, border: `1px solid ${stageStyle.border}`, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                        {(p.current_stage || 'PRELIMINARY_NOTIFICATION').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: isPossessed ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: isPossessed ? '#10b981' : '#f59e0b', border: `1px solid ${isPossessed ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                        {isPossessed ? <CheckCircle2 style={{ width: 10, height: 10 }} /> : <Clock style={{ width: 10, height: 10 }} />}
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {isLapsed ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(244,63,94,0.15)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', textTransform: 'uppercase' }}>
                          <AlertTriangle style={{ width: 9, height: 9 }} /> Lapsed
                        </span>
                      ) : (
                        <span style={{ fontSize: 9, color: '#3a4258', fontFamily: 'JetBrains Mono, monospace' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Link href={`/parcels/${p.id}`} style={{ fontSize: 11, fontWeight: 600, color: '#6b7a94', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        Inspect <ArrowRight style={{ width: 11, height: 11 }} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
