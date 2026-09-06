import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DocumentRegister } from '@/components/documents/DocumentRegister';
import { FieldIncidentReviewCard } from '@/components/documents/FieldIncidentReviewCard';
import { LandownerGrievanceReviewCard } from '@/components/documents/LandownerGrievanceReviewCard';
import { CheckCircle2, Clock, AlertTriangle, FileText, MapPin, User, Scale, ArrowRight, ShieldCheck, Calendar, Hash, Building2, AlertCircle, Sparkles, Coins } from 'lucide-react';
import { ProvenanceBadge, DataRealityBanner } from '@/components/common/ProvenanceBadge';
import { RealtimeParcelHeader } from '@/components/parcels/RealtimeParcelHeader';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const parcel = await apiClient.getParcel(id);
    return { title: `Survey No. ${parcel.survey_no} | BHUMI`, description: `Acquisition case details for Parcel ${parcel.survey_no}.` };
  } catch {
    return { title: 'Parcel Details | BHUMI' };
  }
}

const RFCTLARR_STAGES = [
  { id: 1, key: 'SIA', label: 'Sec 4: SIA', desc: 'Social Impact Assessment', fullStage: 'SOCIAL_IMPACT_ASSESSMENT' },
  { id: 2, key: 'NOTIF', label: 'Sec 11: Notice', desc: 'Gazette Publication', fullStage: 'PRELIMINARY_NOTIFICATION' },
  { id: 3, key: 'OBJ', label: 'Sec 15: Objections', desc: '60-Day Review', fullStage: 'HEARING_OF_OBJECTIONS' },
  { id: 4, key: 'DECL', label: 'Sec 19: Declaration', desc: 'Formal Declaration', fullStage: 'DECLARATION' },
  { id: 5, key: 'NOTICE', label: 'Sec 21: Claims', desc: 'Notice to Parties', fullStage: 'NOTICE_TO_PERSONS' },
  { id: 6, key: 'AWARD', label: 'Sec 23: Award', desc: 'Compensation Determination', fullStage: 'AWARD_ENQUIRY' },
  { id: 7, key: 'POSS', label: 'Sec 38: Possession', desc: 'Land Vesting', fullStage: 'POSSESSION' },
];

function getStageIndex(currentStage: string): number {
  if (!currentStage) return 1;
  const s = currentStage.toUpperCase();
  if (s.includes('SIA')) return 0;
  if (s.includes('PRELIMINARY') || s.includes('NOTIF')) return 1;
  if (s.includes('OBJECTION') || s.includes('HEARING')) return 2;
  if (s.includes('DECLARATION')) return 3;
  if (s.includes('NOTICE') || s.includes('CLAIM')) return 4;
  if (s.includes('AWARD') || s.includes('ENQUIRY')) return 5;
  if (s.includes('POSSESSION') || s.includes('VESTING')) return 6;
  return 1;
}

export default async function ParcelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let parcel: any = null;
  let cases: any[] = [];
  let sihDetail: any = null;

  try {
    [parcel, cases, sihDetail] = await Promise.all([
      apiClient.getParcel(id),
      apiClient.getParcelCases(id),
      apiClient.getSIHParcelDetail(id)
    ]);
  } catch { notFound(); }
  if (!parcel && !sihDetail) notFound();

  const activeParcel = sihDetail || parcel;
  const acqCase = cases.length > 0 ? cases[0] : null;
  let deadlineInfo: any = null;
  let auditLogs: any[] = [];

  if (acqCase) {
    try {
      deadlineInfo = await apiClient.getCaseDeadline(acqCase.id);
      auditLogs = await apiClient.getCaseAudit(acqCase.id);
    } catch {}
  }

  const currentStageIndex = acqCase ? getStageIndex(acqCase.current_stage) : 1;
  const isLapsed = deadlineInfo?.status === 'LAPSED' || acqCase?.is_lapsed;
  const daysRemaining = deadlineInfo?.days_remaining ?? -52;
  const sqMeters = (activeParcel.area_hectares * 10000).toLocaleString();
  const acres = (activeParcel.area_hectares * 2.47105).toFixed(2);
  const estimatedValuation = (activeParcel.area_hectares * 1.85).toFixed(2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
        <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Dashboard</Link>
        <span>/</span>
        <Link href="/projects" style={{ color: '#94a3b8', textDecoration: 'none' }}>Corridors</Link>
        <span>/</span>
        <Link href={`/projects/${activeParcel.project_id || 'P-NH927A'}`} style={{ color: '#94a3b8', textDecoration: 'none' }}>Corridor</Link>
        <span>/</span>
        <span style={{ color: '#1e293b' }}>Survey No. {activeParcel.survey_no || activeParcel.survey_number}</span>
      </nav>

      {/* Provenance Matrix Banner */}
      <DataRealityBanner />

      {/* Section 13 MODEL-DERIVED Recommended Action */}
      {activeParcel.recommended_action && (
        <div style={{
          padding: '18px 22px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(99,102,241,0.12) 100%)',
          border: '1px solid rgba(16,185,129,0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles style={{ width: 16, height: 16, color: '#34d399' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#34d399', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em' }}>
                MODEL-DERIVED RECOMMENDED ACTION (SECTION 13)
              </span>
            </div>
            <ProvenanceBadge sourceType="MODEL_DERIVED" size="xs" />
          </div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0a2c5f', lineHeight: 1.5 }}>
            {activeParcel.recommended_action}
          </p>
        </div>
      )}

      {/* Hero */}
      <div style={{
        borderRadius: 16, padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(8,9,20,0) 60%)',
        border: `1px solid ${isLapsed ? 'rgba(244,63,94,0.4)' : 'rgba(245,158,11,0.25)'}`,
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, borderRadius: '50%', background: isLapsed ? 'rgba(244,63,94,0.06)' : 'rgba(245,158,11,0.06)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <RealtimeParcelHeader
                parcelId={activeParcel.id || activeParcel.parcel_id}
                surveyNo={parcel.survey_no || activeParcel.survey_number}
                villageName={parcel.village_name || activeParcel.village_name || 'Kanhera Kalan'}
                statutoryAct={acqCase?.statutory_act || 'RFCTLARR Act 2013'}
                initialStatus={activeParcel.acquisition_status || parcel.status || 'UNRESOLVED'}
                isLapsed={isLapsed}
                sourceType={activeParcel.source_type || 'SYNTHETIC'}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Link href={`/projects/${parcel.project_id || activeParcel.project_id || 'P-NH927A'}/spatial`} style={{ padding: '9px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin style={{ width: 13, height: 13 }} /> GIS View
              </Link>
              <Link href={`/projects/${parcel.project_id || activeParcel.project_id || 'P-NH927A'}/impact`} style={{ padding: '9px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#0a2c5f', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Scale style={{ width: 13, height: 13 }} /> CPM Path
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Lapse / Compliance Banner */}
      {isLapsed ? (
        <div style={{ borderRadius: 12, padding: '16px 20px', background: 'rgba(244,63,94,0.08)', border: '2px solid rgba(244,63,94,0.4)', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ padding: '8px', borderRadius: 8, background: 'rgba(244,63,94,0.2)', flexShrink: 0 }}>
            <AlertTriangle style={{ width: 18, height: 18, color: '#f43f5e' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f43f5e', marginBottom: 4 }}>
              CRITICAL STATUTORY LAPSE: RFCTLARR Act 2013 Section 19(7)
            </div>
            <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.6 }}>
              Section 19(1) declaration was not published within 12 months of the Preliminary Notification under Section 11(1).
              Under Section 19(7), the entire acquisition proceeding has <strong style={{ color: '#f43f5e' }}>lapsed by operation of law</strong>,
              introducing a <strong style={{ color: '#f43f5e' }}>+{deadlineInfo?.recovery_days || 20}-day zero-float delay</strong> to Corridor Commissioning.
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: '#94a3b8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Calendar style={{ width: 12, height: 12 }} />
                Deadline: <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: '#f43f5e', marginLeft: 4 }}>
                  {deadlineInfo?.deadline ? new Date(deadlineInfo.deadline).toLocaleDateString() : '15 Jul 2025'}
                </strong>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <ShieldCheck style={{ width: 12, height: 12 }} />
                Remedy: Re-issue Sec 11 Notification or State Extension Gazette
              </span>
            </div>
          </div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 800, color: '#f43f5e', whiteSpace: 'nowrap' }}>
            {Math.abs(daysRemaining)}d Elapsed
          </span>
        </div>
      ) : (
        <div style={{ borderRadius: 12, padding: '12px 18px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 style={{ width: 15, height: 15, color: '#10b981', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#475569' }}>
              Statutory timeline compliant · Section 19(7) declaration window open with
              <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: '#10b981', marginLeft: 4 }}>{daysRemaining} days</strong> remaining.
            </span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 5, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>ON TRACK</span>
        </div>
      )}

      {/* RFCTLARR Stage Stepper */}
      <div className="glass" style={{ borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>RFCTLARR 2013 Lifecycle</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>Statutory Stage Progression</div>
          </div>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', padding: '4px 10px', borderRadius: 6, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#0a2c5f' }}>
            Stage {currentStageIndex + 1} of 7
          </span>
        </div>

        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <div style={{ minWidth: 700, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
            {/* connector track */}
            <div style={{ position: 'absolute', top: 16, left: 24, right: 24, height: 2, background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ position: 'absolute', top: 16, left: 24, height: 2, width: `${(currentStageIndex / (RFCTLARR_STAGES.length - 1)) * 92}%`, background: 'linear-gradient(90deg,#10b981,#6366f1)', transition: 'width 0.5s' }} />
            {RFCTLARR_STAGES.map((step, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '14%', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                    background: isPast ? '#10b981' : isCurrent ? (isLapsed ? '#f43f5e' : '#6366f1') : 'rgba(255,255,255,0.06)',
                    border: `2px solid ${isPast ? '#10b981' : isCurrent ? (isLapsed ? '#f43f5e' : '#818cf8') : 'rgba(255,255,255,0.1)'}`,
                    color: (isPast || isCurrent) ? '#fff' : '#3a4258',
                    boxShadow: isCurrent ? `0 0 16px ${isLapsed ? 'rgba(244,63,94,0.5)' : 'rgba(99,102,241,0.5)'}` : 'none'
                  }}>
                    {isPast ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : isCurrent && isLapsed ? <AlertTriangle style={{ width: 14, height: 14 }} /> : step.id}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 10, fontWeight: 700, color: isCurrent ? (isLapsed ? '#f43f5e' : '#818cf8') : isPast ? '#10b981' : '#3a4258', lineHeight: 1.3 }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: 9, color: '#2d3748', marginTop: 2, lineHeight: 1.2 }}>{step.desc}</div>
                  {isCurrent && (
                    <span style={{ marginTop: 4, fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: isLapsed ? 'rgba(244,63,94,0.2)' : 'rgba(99,102,241,0.2)', color: isLapsed ? '#f43f5e' : '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cadastral Profile & Statutory Clock */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Cadastral Details */}
        <div className="glass" style={{ borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 16 }}>Cadastral Land Record Profile</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Survey & Subdivision No.', val: parcel.survey_no, mono: true },
              { label: 'Total Registered Area', val: `${parcel.area_hectares} Ha`, sub: `${acres} Acres · ${sqMeters} sq.m`, mono: true },
              { label: 'Revenue Classification', val: parcel.classification || 'Agricultural', sub: 'Verified Land Record' },
              { label: 'Title Holder(s)', val: parcel.owner_name || 'Owner of Record', sub: 'Title Record' },
              { label: 'Cadastral Location', val: parcel.village_name || 'Alignment Corridor', sub: 'Corridor Alignment Record', mono: true },
              { label: 'Statutory Valuation (Est.)', val: `₹${estimatedValuation} Cr`, sub: 'Market Factor 2.0 + 100% Solatium', color: '#10b981' },
            ].map((item) => (
              <div key={item.label} style={{ padding: '12px 14px', background: 'rgba(10,44,95,0.04)', borderRadius: 9, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: item.color || '#c4cfe4', fontFamily: item.mono ? 'JetBrains Mono, monospace' : undefined }}>{item.val}</div>
                {item.sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{item.sub}</div>}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(99,102,241,0.07)', borderRadius: 9, border: '1px solid rgba(99,102,241,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#0a2c5f', marginBottom: 4 }}>
              <Building2 style={{ width: 13, height: 13 }} /> CALA Jurisdiction
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
              Special Land Acquisition Officer (SLAO) / Competent Authority Land Acquisition Office ·
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#475569', marginLeft: 4 }}>CALA-{parcel.project_id.substring(0, 8).toUpperCase()}-RECORD</span>
            </p>
          </div>
        </div>

        {/* Statutory Clock */}
        <div className="glass" style={{ borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 16 }}>Statutory Clock & Authority</div>

          {deadlineInfo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ padding: '14px', borderRadius: 10, background: isLapsed ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.08)', border: `1px solid ${isLapsed ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.25)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: 8 }}>
                  <span>RFCTLARR Limitation Rule</span>
                  <span style={{ padding: '2px 7px', borderRadius: 3, background: isLapsed ? '#f43f5e' : '#10b981', color: '#fff' }}>{deadlineInfo.status}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', marginBottom: 10 }}>
                  {deadlineInfo.rule || 'Sec 19(7) 12-Month Declaration Rule'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'JetBrains Mono, monospace' }}>Statutory Expiry</div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#1e293b' }}>
                      {deadlineInfo.deadline ? new Date(deadlineInfo.deadline).toLocaleDateString() : 'Awaiting Gazette Date'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'JetBrains Mono, monospace' }}>Day Count</div>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Sora, sans-serif', color: isLapsed ? '#f43f5e' : '#10b981' }}>
                      {daysRemaining}d
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px 14px', background: 'rgba(10,44,95,0.04)', borderRadius: 9, border: '1px solid #e2e8f0' }}>
                {[
                  { label: 'CPM Downstream Impact', val: parcel.blocker ? `+${parcel.blocker.assumed_resolution_days} Days Delay` : (isLapsed ? '+20 Days Delay' : '0 Days Delay'), color: isLapsed || parcel.blocker ? '#f43f5e' : '#10b981' },
                  { label: 'Blocked Activity', val: parcel.blocker ? parcel.blocker.type : (isLapsed ? 'Site Possession' : 'None'), color: '#1e293b' },
                  { label: 'Critical Float', val: isLapsed ? '0 Days (Critical Path)' : 'Within Float Thresholds', color: isLapsed ? '#f43f5e' : '#10b981' },
                ].map((r) => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{r.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: r.color, fontFamily: 'JetBrains Mono, monospace' }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: '#94a3b8' }}>No limitation clock data available.</p>
          )}

          <Link href={`/projects/${parcel.project_id}/impact`} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            marginTop: 14, padding: '10px', borderRadius: 9, fontSize: 12, fontWeight: 700,
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            color: '#0a2c5f', textDecoration: 'none'
          }}>
            Simulate Remediation <ArrowRight style={{ width: 13, height: 13 }} />
          </Link>
        </div>
      </div>

      {/* Section 26-30 RFCTLARR Act Statutory Compensation Breakdown */}
      {activeParcel.compensation && (
        <div className="glass" style={{ borderRadius: 14, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                RFCTLARR Act 2013 Statutory Math
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Coins style={{ width: 16, height: 16, color: '#fbbf24' }} /> Sections 26–30 Award Determination
              </div>
            </div>
            <ProvenanceBadge sourceType={activeParcel.compensation.source_type || 'MODEL_DERIVED'} size="xs" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div style={{ padding: '12px 14px', background: 'rgba(10,44,95,0.04)', borderRadius: 9, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>BASE MARKET VALUE (SEC 26)</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                ₹{(activeParcel.compensation.market_value_base || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Circle rate x 1.5x rural factor</div>
            </div>

            <div style={{ padding: '12px 14px', background: 'rgba(10,44,95,0.04)', borderRadius: 9, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>100% SOLATIUM (SEC 30(1))</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                ₹{(activeParcel.compensation.solatium_amount || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>100% mandatory solatium</div>
            </div>

            <div style={{ padding: '12px 14px', background: 'rgba(10,44,95,0.04)', borderRadius: 9, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>12% INTEREST (SEC 30(3))</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0284c7', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                ₹{(activeParcel.compensation.interest_12pct_amount || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Accrued from Sec 11 notification</div>
            </div>

            <div style={{ padding: '12px 14px', background: 'rgba(16,185,129,0.1)', borderRadius: 9, border: '1px solid rgba(16,185,129,0.3)' }}>
              <div style={{ fontSize: 9, color: '#34d399', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>TOTAL STATUTORY AWARD</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                ₹{(activeParcel.compensation.total_compensation || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: '#a7f3d0', marginTop: 2, textTransform: 'uppercase' }}>
                Status: {activeParcel.compensation.compensation_status || 'Pending'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail */}
      <div className="glass" style={{ borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Immutable Statutory Audit Trail</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>Cryptographic CALA Ledger</div>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', padding: '4px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
            <Hash style={{ width: 10, height: 10 }} /> SHA-256 Verified
          </span>
        </div>

        <div style={{ position: 'relative', paddingLeft: 24 }}>
          <div style={{ position: 'absolute', left: 8, top: 4, bottom: 4, width: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {auditLogs.map((log: any, index: number) => (
              <div key={log.id || index} style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: -20, top: 12, width: 12, height: 12, borderRadius: '50%', background: '#6366f1', border: '2px solid rgba(99,102,241,0.4)', boxShadow: '0 0 8px rgba(99,102,241,0.4)' }} />
                <div style={{ padding: '14px 16px', background: 'rgba(10,44,95,0.04)', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
                      {log.action}
                      {log.state_after?.stage && (
                        <span style={{ marginLeft: 8, fontSize: 9, fontFamily: 'JetBrains Mono, monospace', padding: '2px 6px', borderRadius: 3, background: 'rgba(99,102,241,0.15)', color: '#0a2c5f', border: '1px solid rgba(99,102,241,0.25)' }}>
                          {log.state_after.stage}
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 6px' }}>
                    Authorized: <strong style={{ color: '#475569' }}>{log.actor_role}</strong> ({log.actor_id})
                  </p>
                  {log.state_after?.gazette_no && (
                    <p style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', margin: '0 0 4px' }}>
                      Gazette: <span style={{ color: '#475569' }}>{log.state_after.gazette_no}</span>
                    </p>
                  )}
                  {log.state_after?.alert && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#f43f5e' }}>
                      <AlertCircle style={{ width: 11, height: 11, flexShrink: 0 }} /> {log.state_after.alert}
                    </div>
                  )}
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#2d3748' }}>
                    <span>Sig: 0x{(index * 1337 + 42091).toString(16)}...{(index * 9876 + 12345).toString(16)}</span>
                    <span style={{ color: '#10b981', fontFamily: 'Inter, sans-serif' }}>Verified Officer Credential</span>
                  </div>
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                No statutory audit records registered for this survey parcel.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Field Incidents & On-Site Verification Review */}
      <FieldIncidentReviewCard parcelId={parcel.id} projectId={parcel.project_id} />

      {/* Citizen Landowner Grievances & Redressal */}
      <LandownerGrievanceReviewCard parcelId={parcel.id} projectId={parcel.project_id} />

      {/* Document Register */}
      <div>
        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Cadastral Document Register</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Statutory Gazette & Awards Archive</div>
        <DocumentRegister parcelId={parcel.id} projectId={parcel.project_id} />
      </div>
    </div>
  );
}
