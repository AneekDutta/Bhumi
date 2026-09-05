'use client';

import React from 'react';
import {
  X,
  MapPin,
  User,
  Scale,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Coins,
  Home,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  GitBranch,
  Info
} from 'lucide-react';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';

interface ParcelDetailModalProps {
  parcel: any;
  onClose: () => void;
  onSimulate?: (parcelId: string) => void;
}

export function ParcelDetailModal({ parcel, onClose, onSimulate }: ParcelDetailModalProps) {
  if (!parcel) return null;

  const sqM = Number(parcel.area_sqm || 0).toLocaleString();
  const ha = Number(parcel.area_hectares || (parcel.area_sqm ? parcel.area_sqm / 10000 : 0)).toFixed(3);
  const critScore = Number(parcel.criticality_score || 0).toFixed(1);
  const riskScore = Number(parcel.risk_score || 0).toFixed(1);

  const comp = parcel.compensation || {};
  const rr = parcel.rr || {};
  const legals = parcel.legal_cases || [];
  const docs = parcel.documents || [];
  const verifs = parcel.verifications || [];
  const upstream = parcel.upstream_blockers || [];
  const downstream = parcel.downstream_dependencies || [];
  const breakdown = parcel.criticality_breakdown || {};

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        maxWidth: 580,
        background: '#090d16',
        borderLeft: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.85)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}
    >
      {/* Modal Header */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(15,23,42,0.6)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(10px)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: '#818cf8',
                fontWeight: 700
              }}
            >
              CADASTRAL PARCEL DOSSIER
            </span>
            <ProvenanceBadge sourceType={parcel.source_type || 'SYNTHETIC'} size="xs" />
          </div>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            Survey No. {parcel.survey_number || parcel.survey_no}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: 12, color: '#94a3b8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin style={{ width: 12, height: 12, color: '#38bdf8' }} />
              {parcel.village_name || 'Kanhera Kalan'}, {parcel.tehsil || 'Ramganj Mandi'}
            </span>
            <span>•</span>
            <span>{ha} ha ({sqM} sq.m)</span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: 6,
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X style={{ width: 18, height: 18 }} />
        </button>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Section 13 Prominent MODEL_DERIVED Recommended Action */}
        <div
          style={{
            padding: '16px 18px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(99,102,241,0.12) 100%)',
            border: '1px solid rgba(16,185,129,0.35)',
            boxShadow: '0 4px 20px rgba(16,185,129,0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles style={{ width: 15, height: 15, color: '#34d399' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#34d399', letterSpacing: '0.05em', fontFamily: 'JetBrains Mono, monospace' }}>
                MODEL-DERIVED RECOMMENDED ACTION
              </span>
            </div>
            <ProvenanceBadge sourceType="MODEL_DERIVED" size="xs" />
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#e2e8f0', fontWeight: 600, lineHeight: 1.5 }}>
            {parcel.recommended_action || 'Proceed with statutory land record mutation and joint verification.'}
          </p>
          {onSimulate && (
            <button
              onClick={() => onSimulate(parcel.parcel_id)}
              style={{
                marginTop: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 7,
                background: 'rgba(16,185,129,0.2)',
                border: '1px solid rgba(16,185,129,0.4)',
                color: '#34d399',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Simulate Intervention Effect <ArrowRight style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>

        {/* Section 10 Composite Intelligence KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>CRITICALITY SCORE</span>
              <ProvenanceBadge sourceType="MODEL_DERIVED" size="xs" />
            </div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#818cf8', marginTop: 4 }}>
              {critScore} <span style={{ fontSize: 13, color: '#64748b' }}>/ 100</span>
            </div>
            {breakdown.w1_downstream_segments !== undefined && (
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6, lineHeight: 1.4 }}>
                Seg: {breakdown.w1_downstream_segments} • MS: {breakdown.w2_downstream_milestones} • SPOF: {breakdown.w3_single_point_failure}
              </div>
            )}
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>RISK SCORE</span>
              <ProvenanceBadge sourceType="MODEL_DERIVED" size="xs" />
            </div>
            <div
              style={{
                fontFamily: 'Sora, sans-serif',
                fontSize: 26,
                fontWeight: 800,
                color: Number(riskScore) >= 60 ? '#f43f5e' : Number(riskScore) >= 30 ? '#f59e0b' : '#10b981',
                marginTop: 4
              }}
            >
              {riskScore} <span style={{ fontSize: 13, color: '#64748b' }}>/ 100</span>
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
              {Number(riskScore) >= 60 ? 'High Risk Injunction' : Number(riskScore) >= 30 ? 'Moderate Statutory Delay' : 'Low Impedance'}
            </div>
          </div>
        </div>

        {/* Ownership & Classification */}
        <div style={{ padding: '16px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
            <User style={{ width: 13, height: 13, color: '#38bdf8' }} /> Landholder & Tenure
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
            <div>
              <span style={{ color: '#64748b' }}>Owner Name:</span>{' '}
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{parcel.owner?.name || parcel.owner_name || 'Geeta Yadav'}</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Tenure Type:</span>{' '}
              <span style={{ color: '#e2e8f0' }}>{parcel.owner?.owner_type || 'individual'}</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Land Classification:</span>{' '}
              <span style={{ color: '#e2e8f0', textTransform: 'capitalize' }}>{parcel.land_use || 'agricultural'}</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Acquisition Stage:</span>{' '}
              <span style={{ color: parcel.acquisition_status === 'possessed' ? '#34d399' : '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>
                {parcel.acquisition_status || 'not_started'}
              </span>
            </div>
          </div>
          {parcel.ownership_conflict && (
            <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 6, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle style={{ width: 13, height: 13 }} />
              Active Conflict: {parcel.conflict_type?.replace('_', ' ')}
            </div>
          )}
        </div>

        {/* Section 26-30 Statutory Compensation Breakdown */}
        <div style={{ padding: '16px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Coins style={{ width: 13, height: 13, color: '#fbbf24' }} /> RFCTLARR Act Sec 26–30 Compensation
            </h4>
            <ProvenanceBadge sourceType={comp.source_type || 'MODEL_DERIVED'} size="xs" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Base Market Value (Sec 26):</span>
              <span style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace' }}>₹{(comp.market_value_base || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Rural Multiplier Factor:</span>
              <span style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace' }}>{comp.multiplier_factor || 1.5}x</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Asset & Tree Value (Sec 29):</span>
              <span style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace' }}>₹{(comp.asset_value || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>100% Solatium (Sec 30(1)):</span>
              <span style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace' }}>₹{(comp.solatium_amount || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>12% Additional Interest (Sec 30(3)):</span>
              <span style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace' }}>₹{(comp.interest_12pct_amount || 0).toLocaleString()}</span>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span style={{ color: '#cbd5e1' }}>Total Compensation Award:</span>
              <span style={{ color: '#34d399', fontFamily: 'JetBrains Mono, monospace', fontSize: 14 }}>
                ₹{(comp.total_compensation || 0).toLocaleString()}
              </span>
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
              Status: <span style={{ color: comp.compensation_status === 'disbursed' ? '#34d399' : '#f59e0b', textTransform: 'uppercase' }}>{comp.compensation_status || 'pending'}</span>
            </div>
          </div>
        </div>

        {/* Legal Injunctions / Disputes */}
        {legals.length > 0 && (
          <div style={{ padding: '16px', borderRadius: 10, background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h4 style={{ margin: 0, fontSize: 12, color: '#f43f5e', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Scale style={{ width: 13, height: 13 }} /> Judicial Proceedings
              </h4>
              <ProvenanceBadge sourceType={legals[0].source_type || 'SYNTHETIC'} size="xs" />
            </div>
            {legals.map((l: any, i: number) => (
              <div key={i} style={{ fontSize: 11, color: '#e2e8f0', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: '#f43f5e' }}>{l.case_name} ({l.court})</div>
                <div style={{ color: '#94a3b8' }}>Issue: {l.legal_issue} • Status: <span style={{ color: '#fbbf24', textTransform: 'uppercase' }}>{l.legal_status}</span></div>
              </div>
            ))}
          </div>
        )}

        {/* Documents & Verifications */}
        <div style={{ padding: '16px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText style={{ width: 13, height: 13, color: '#38bdf8' }} /> Land Records & Documents ({docs.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {docs.map((d: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, padding: '6px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.02)' }}>
                <span style={{ color: '#e2e8f0', textTransform: 'capitalize' }}>{d.document_type?.replace('_', ' ')}</span>
                <span style={{ color: d.document_status === 'verified' ? '#34d399' : d.document_status === 'missing' ? '#f43f5e' : '#fbbf24', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, textTransform: 'uppercase' }}>
                  {d.document_status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 11 Dependency Graph Connections */}
        <div style={{ padding: '16px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
            <GitBranch style={{ width: 13, height: 13, color: '#818cf8' }} /> Critical Chain Dependencies
          </h4>
          <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div>
              <span style={{ color: '#64748b' }}>Upstream Direct Blockers:</span>{' '}
              <span style={{ color: upstream.length > 0 ? '#f43f5e' : '#34d399', fontWeight: 700 }}>
                {upstream.length} Active Blocker(s)
              </span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Downstream Segments Impacted:</span>{' '}
              <span style={{ color: '#818cf8', fontWeight: 700 }}>{downstream.length || 2} Segments</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Critical Path Membership:</span>{' '}
              <span style={{ color: parcel.is_critical_path ? '#f43f5e' : '#34d399', fontWeight: 700 }}>
                {parcel.is_critical_path ? 'YES (Zero-Float Corridor Bottleneck)' : 'NO (Has Float)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
