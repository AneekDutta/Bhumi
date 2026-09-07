'use client';

import React, { useState } from 'react';
import {
  Coins,
  Shield,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Building2,
  Percent,
  Clock,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';
import { approveAward, updateAwardPaymentStatus, getParcelValuation } from '@/lib/api';

interface ValuationAwardCardProps {
  parcelId: string;
  initialCompensation?: any;
  onAwardUpdated?: (updatedComp: any) => void;
}

export function ValuationAwardCard({
  parcelId,
  initialCompensation,
  onAwardUpdated,
}: ValuationAwardCardProps) {
  const [comp, setComp] = useState<any>(initialCompensation || {});
  const [showTrace, setShowTrace] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rawStatus = (comp.payment_status || comp.compensation_status || 'CALCULATED').toUpperCase();
  const cid = comp.compensation_id || `CR-${parcelId}`;

  const traceSteps = comp.calculation_trace?.steps || [];

  const handleApprove = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await approveAward(cid, 'Collector Verification Approved');
      setMessage('Statutory award officially approved and marked ready for disbursement.');
      const refreshed = await getParcelValuation(parcelId);
      setComp(refreshed);
      if (onAwardUpdated) onAwardUpdated(refreshed);
    } catch (err: any) {
      setError(err.message || 'Failed to approve statutory award.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (targetStatus: string, notes: string) => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await updateAwardPaymentStatus(cid, targetStatus, notes);
      if (targetStatus === 'DISPUTED') {
        setMessage('Valuation dispute registered: CPM bottleneck activated (+40 days project delay on parcel).');
      } else if (targetStatus === 'PAID') {
        setMessage('Payment disbursed via PFMS Treasury: CPM blocking edge cleared.');
      } else {
        setMessage(`Status transitioned to ${targetStatus}.`);
      }
      const refreshed = await getParcelValuation(parcelId);
      setComp(refreshed);
      if (onAwardUpdated) onAwardUpdated(refreshed);
    } catch (err: any) {
      setError(err.message || `Failed to update status to ${targetStatus}.`);
    } finally {
      setLoading(false);
    }
  };

  // Status badge styling
  const getStatusBadge = () => {
    if (rawStatus === 'PAID' || rawStatus === 'DISBURSED') {
      return { label: 'DISBURSED / PAID', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', color: '#34d399' };
    }
    if (rawStatus === 'APPROVED') {
      return { label: 'OFFICER APPROVED', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.3)', color: '#38bdf8' };
    }
    if (rawStatus === 'DISPUTED') {
      return { label: 'DISPUTED (CPM BLOCKED)', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.4)', color: '#f43f5e' };
    }
    if (rawStatus === 'ON_HOLD') {
      return { label: 'ON HOLD', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' };
    }
    return { label: 'CALCULATED (DRAFT)', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)', color: '#94a3b8' };
  };

  const badge = getStatusBadge();

  return (
    <div style={{
      padding: '16px',
      borderRadius: 12,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Coins style={{ width: 16, height: 16, color: '#fbbf24' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            RFCTLARR Act Sec 26–30 Compensation
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 9,
              fontFamily: 'JetBrains Mono, monospace',
              padding: '2px 7px',
              borderRadius: 4,
              fontWeight: 700,
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.3)',
              color: '#fbbf24',
              letterSpacing: '0.04em',
            }}
            title="Synthetic demo parameters based on RFCTLARR Act 2013 statutory rules"
          >
            SYNTHETIC DEMO DATA
          </span>
          <ProvenanceBadge sourceType={comp.source_type || 'MODEL_DERIVED'} size="xs" />
        </div>
      </div>

      {/* Statutory Formula Breakdown Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8' }}>Base Market Value (Sec 26):</span>
          <span style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
            ₹{(comp.market_value_base || 0).toLocaleString()}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8' }}>Rural Distance Multiplier (Sec 26(2)):</span>
          <span style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
            {comp.multiplier_factor || 1.5}x
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8' }}>Attached Assets & Trees (Sec 29):</span>
          <span style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
            ₹{(comp.asset_value || 0).toLocaleString()}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8' }}>100% Solatium (Sec 30(1)):</span>
          <span style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
            ₹{(comp.solatium_amount || 0).toLocaleString()}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8' }} title="Additional statutory component calculated at 12% p.a. on base market value from Section 11 notice to award date (Section 30(3)). Note: this is distinct from Section 80 delay penal interest.">
            12% Additional Component (Sec 30(3)):
          </span>
          <span style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
            ₹{(comp.interest_12pct_amount || 0).toLocaleString()}
          </span>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

        {/* Total Compensation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: 13 }}>Total Statutory Award:</span>
          <span style={{ color: '#34d399', fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700 }}>
            ₹{(comp.total_compensation || 0).toLocaleString()}
          </span>
        </div>

        {/* Status Pill */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <span style={{ fontSize: 11, color: '#64748b' }}>Workflow Status:</span>
          <span
            style={{
              fontSize: 10,
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              background: badge.bg,
              border: `1px solid ${badge.border}`,
              color: badge.color,
            }}
          >
            {badge.label}
          </span>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div style={{
          padding: '8px 10px',
          borderRadius: 6,
          background: 'rgba(52,211,153,0.08)',
          border: '1px solid rgba(52,211,153,0.25)',
          color: '#34d399',
          fontSize: 11,
          lineHeight: 1.4,
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          padding: '8px 10px',
          borderRadius: 6,
          background: 'rgba(244,63,94,0.08)',
          border: '1px solid rgba(244,63,94,0.25)',
          color: '#f43f5e',
          fontSize: 11,
          lineHeight: 1.4,
        }}>
          {error}
        </div>
      )}

      {/* Operational Officer Action Controls */}
      <div style={{
        marginTop: 4,
        paddingTop: 10,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        {rawStatus === 'CALCULATED' && (
          <button
            onClick={handleApprove}
            disabled={loading}
            style={{
              flex: 1,
              padding: '7px 12px',
              borderRadius: 6,
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              opacity: loading ? 0.7 : 1,
            }}
          >
            <CheckCircle2 style={{ width: 13, height: 13 }} />
            {loading ? 'Processing...' : 'Approve Statutory Award'}
          </button>
        )}

        {rawStatus === 'APPROVED' && (
          <>
            <button
              onClick={() => handleStatusChange('PAID', 'Disbursed via PFMS Treasury')}
              disabled={loading}
              style={{
                flex: 1,
                padding: '7px 12px',
                borderRadius: 6,
                background: 'rgba(52,211,153,0.15)',
                border: '1px solid rgba(52,211,153,0.4)',
                color: '#34d399',
                fontSize: 11,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <CheckCircle2 style={{ width: 13, height: 13 }} />
              {loading ? 'Processing...' : 'Disburse via PFMS'}
            </button>

            <button
              onClick={() => handleStatusChange('DISPUTED', 'Titleholder contested tree valuation')}
              disabled={loading}
              style={{
                padding: '7px 12px',
                borderRadius: 6,
                background: 'rgba(244,63,94,0.1)',
                border: '1px solid rgba(244,63,94,0.3)',
                color: '#f43f5e',
                fontSize: 11,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
              title="Flags dispute and demonstrates dynamic CPM bottleneck recalculation"
            >
              <AlertTriangle style={{ width: 13, height: 13 }} />
              Flag Dispute (CPM Test)
            </button>
          </>
        )}

        {rawStatus === 'DISPUTED' && (
          <button
            onClick={() => handleStatusChange('PAID', 'Dispute settled by District Collector')}
            disabled={loading}
            style={{
              flex: 1,
              padding: '7px 12px',
              borderRadius: 6,
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <CheckCircle2 style={{ width: 13, height: 13 }} />
            {loading ? 'Processing...' : 'Settle Dispute & Disburse (Clear CPM Delay)'}
          </button>
        )}

        {(rawStatus === 'PAID' || rawStatus === 'DISBURSED') && (
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: '#34d399',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            <CheckCircle2 style={{ width: 13, height: 13 }} />
            Disbursed via Treasury Direct Transfer • Milestone Unblocked
          </div>
        )}
      </div>

      {/* Trace Accordion Toggle */}
      <div style={{ marginTop: 2 }}>
        <button
          onClick={() => setShowTrace(!showTrace)}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: '#38bdf8',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 0',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <FileCheck style={{ width: 13, height: 13 }} />
            Statutory Calculation Trace & Legal Basis ({traceSteps.length > 0 ? `${traceSteps.length} Steps` : 'RFCTLARR Sections 26–30'})
          </span>
          {showTrace ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
        </button>

        {showTrace && (
          <div style={{
            marginTop: 8,
            padding: '12px',
            borderRadius: 8,
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(56,189,248,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.4 }}>
              Deterministic statutory calculation with complete rule citations and audit trail.
            </div>

            {traceSteps.map((s: any, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 11,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: '#e2e8f0' }}>
                    Step {s.step_number || idx + 1}: {s.title}
                  </span>
                  <span style={{
                    fontSize: 9,
                    fontFamily: 'JetBrains Mono, monospace',
                    color: '#38bdf8',
                    padding: '1px 5px',
                    borderRadius: 4,
                    background: 'rgba(56,189,248,0.1)',
                  }}>
                    {s.statutory_citation}
                  </span>
                </div>

                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', marginBottom: 4 }}>
                  Formula: {s.formula}
                </div>

                <div style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.4 }}>
                  {s.explanation}
                </div>
              </div>
            ))}

            {/* Disclaimer box */}
            <div style={{
              padding: '8px 10px',
              borderRadius: 6,
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.25)',
              fontSize: 10,
              color: '#fde68a',
              lineHeight: 1.4,
            }}>
              <strong>DISCLAIMER:</strong> Statutory valuation computed using RFCTLARR Act 2013 (Sections 26–30) rules with Synthetic Demo parameters. Intended for BHUMI SIH26016 corridor digital twin simulation and decision support.
            </div>
          </div>
        )}
      </div>

      {/* Legal & Rights Knowledge Center Link */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 2 }}>
        <a
          href="/legal-rights"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: '#94a3b8',
            fontSize: 11,
            textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <span>Explore RFCTLARR Statutory Rights & Legal Guide</span>
          <ExternalLink style={{ width: 11, height: 11 }} />
        </a>
      </div>
    </div>
  );
}
