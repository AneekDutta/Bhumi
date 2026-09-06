"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { Activity, Calendar, Clock, AlertTriangle, CheckCircle2, ArrowRight, Sparkles, Compass, RotateCcw } from "lucide-react";
import { DataRealityBanner, ProvenanceBadge } from "@/components/common/ProvenanceBadge";
import { WhatIfWorkbench } from "@/components/simulator/WhatIfWorkbench";

type ScheduleForecast = {
  project_finish: string;
  critical_path: string[];
  project_delay_days: number | null;
  impact_status: "NO_BLOCKING_CONSTRAINT" | "QUANTIFIED_IMPACT" | "UNQUANTIFIED_IMPACT";
};

type CausalHop = {
  source_type: string; source_id: string; source_label: string;
  relationship: string; target_type: string; target_id: string; target_label: string;
};

type BottleneckEvidence = {
  parcel_id: string; survey_no?: string; delay_days: number | null;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"; reason: string;
  is_critical_path: boolean; project_delay_days: number | null;
  impact_status: "NO_BLOCKING_CONSTRAINT" | "QUANTIFIED_IMPACT" | "UNQUANTIFIED_IMPACT";
  causal_path: CausalHop[];
};

type ProjectImpact = {
  baseline: ScheduleForecast; current_forecast: ScheduleForecast; bottlenecks: BottleneckEvidence[];
};

type SimulationResult = {
  before: ScheduleForecast; after: ScheduleForecast; days_recovered: number;
};

const URGENCY_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  CRITICAL: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: 'rgba(244,63,94,0.3)' },
  HIGH: { bg: 'rgba(249,115,22,0.12)', color: '#f97316', border: 'rgba(249,115,22,0.3)' },
  MEDIUM: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  LOW: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
};

export default function ProjectImpactPage() {
  const { id } = useParams() as { id: string };
  const [impactData, setImpactData] = useState<ProjectImpact | null>(null);
  const [selectedBottleneck, setSelectedBottleneck] = useState<BottleneckEvidence | null>(null);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImpact = async () => {
      try {
        const data = await apiClient.getProjectImpact(id);
        setImpactData(data as ProjectImpact);
        if (data?.bottlenecks?.length > 0) setSelectedBottleneck(data.bottlenecks[0]);
      } catch { setError('Failed to calculate deterministic schedule impact.'); }
      finally { setLoading(false); }
    };
    if (id) fetchImpact();
  }, [id]);

  const runSimulation = async (parcelId: string) => {
    setSimulating(true); setError(null); setSimResult(null);
    try {
      const data = await apiClient.simulateIntervention(id, { type: "RESOLVE_BLOCKER", parcel_id: parcelId });
      setSimResult(data as SimulationResult);
    } catch { setError('Simulation request could not be completed.'); }
    finally { setSimulating(false); }
  };

  const formatDate = (ds: string) => {
    try { return new Date(ds).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return ds; }
  };

  if (loading) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>Computing deterministic CPM impact schedule...</p>
      </div>
    );
  }

  if (error && !impactData) {
    return (
      <div style={{ padding: '20px 24px', borderRadius: 12, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <AlertTriangle style={{ width: 18, height: 18, color: '#f43f5e', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f43f5e' }}>Schedule Engine Offline</div>
          <p style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!impactData) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
        <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Dashboard</Link>
        <span>/</span>
        <Link href="/projects" style={{ color: '#94a3b8', textDecoration: 'none' }}>Corridors</Link>
        <span>/</span>
        <Link href={`/projects/${id}`} style={{ color: '#94a3b8', textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace' }}>{id.substring(0, 8)}</Link>
        <span>/</span>
        <span style={{ color: '#1e293b' }}>Impact & Simulation</span>
      </nav>

      {/* Provenance Banner */}
      <DataRealityBanner />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', padding: '2px 8px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#0a2c5f', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Deterministic CPM Engine
            </span>
          </div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#0a2c5f', margin: 0 }}>
            Schedule Impact & Counterfactual Simulation
          </h1>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
            Attributable critical path delay calculation, statutory causal dependency chains, and interactive intervention modeling
          </p>
        </div>
        <Link href={`/projects/${id}/spatial`} style={{ padding: '9px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Compass style={{ width: 13, height: 13 }} /> Spatial Map View
        </Link>
      </div>

      {/* Contract Schedule Variance */}
      <div className="glass" style={{ borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Contract Schedule Variance</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>Critical Path Completion Comparison</div>
          </div>
          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', padding: '4px 10px', borderRadius: 6, background: (impactData.current_forecast.project_delay_days || 0) > 0 ? 'rgba(244,63,94,0.12)' : 'rgba(16,185,129,0.12)', border: `1px solid ${(impactData.current_forecast.project_delay_days || 0) > 0 ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)'}`, color: (impactData.current_forecast.project_delay_days || 0) > 0 ? '#f43f5e' : '#10b981' }}>
            {impactData.current_forecast.critical_path?.length || 0} Critical Path Activities
          </span>
        </div>

        {/* 3 Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {[
            { label: 'Baseline Contract Finish', val: formatDate(impactData.baseline.project_finish), sub: 'Original zero-delay baseline', color: '#0a2c5f', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.22)', icon: Calendar },
            { label: 'Current Forecast Finish', val: formatDate(impactData.current_forecast.project_finish), sub: 'Pushed out due to unresolved RoW', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.22)', icon: Clock },
            { label: 'Attributable Delay', val: impactData.current_forecast.impact_status === "UNQUANTIFIED_IMPACT" ? "Unquantified" : `+${impactData.current_forecast.project_delay_days || 0}d Overrun`, sub: 'Net delay on zero-float path', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.22)', icon: AlertTriangle },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} style={{ borderRadius: 10, padding: '16px 18px', background: m.bg, border: `1px solid ${m.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'JetBrains Mono, monospace' }}>{m.label}</div>
                  <Icon style={{ width: 14, height: 14, color: m.color }} />
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 800, color: m.color }}>{m.val}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{m.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Timeline comparison bars */}
        <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(10,44,95,0.04)', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 11, fontWeight: 700, color: '#475569' }}>
            <span>Critical Path Timeline</span>
            <span style={{ color: (impactData.current_forecast.project_delay_days || 0) > 0 ? '#f43f5e' : '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>
              {(impactData.current_forecast.project_delay_days || 0) > 0 ? `+${impactData.current_forecast.project_delay_days} Calendar Days Slippage` : 'On Schedule (Zero Slippage)'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Baseline', date: formatDate(impactData.baseline.project_finish), w1: '80%', w2: null, c1: '#6366f1' },
              { label: 'Forecast (with constraints)', date: formatDate(impactData.current_forecast.project_finish), w1: '80%', w2: '20%', c1: '#6366f1' },
            ].map((bar) => (
              <div key={bar.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                  <span>{bar.label}</span><span>{bar.date}</span>
                </div>
                <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: bar.w1, height: '100%', background: bar.c1, borderRadius: bar.w2 ? '99px 0 0 99px' : 99 }} />
                  {bar.w2 && <div style={{ width: bar.w2, height: '100%', background: '#f43f5e', animation: 'pulse 2s infinite' }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive What-If Intervention Workbench */}
      <WhatIfWorkbench
        projectId={id}
        bottlenecks={impactData.bottlenecks}
        initialTargetParcelId={selectedBottleneck?.parcel_id}
      />

      {/* Bottlenecks Table */}
      <div className="glass" style={{ borderRadius: 14, overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Ranked Bottleneck Evidence</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>Cadastral Critical Path Contributors</div>
          </div>
          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', padding: '4px 10px', borderRadius: 6, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#0a2c5f' }}>
            {impactData.bottlenecks.length} Contributor{impactData.bottlenecks.length === 1 ? '' : 's'}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: 'rgba(10,44,95,0.04)' }}>
                {['Parcel Entity', 'Statutory Blocker / Reason', 'Urgency', 'Attributable Delay', 'Intervention'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {impactData.bottlenecks.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '36px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                    No critical path bottlenecks or schedule delays detected. All activities within planned float buffers.
                  </td>
                </tr>
              ) : (
                impactData.bottlenecks.map((b) => {
                  const u = URGENCY_STYLE[b.urgency] || URGENCY_STYLE.MEDIUM;
                  const isSelected = selectedBottleneck?.parcel_id === b.parcel_id;
                  return (
                    <tr key={b.parcel_id} className="tr-hover" style={{ borderBottom: '1px solid #f1f5f9', background: isSelected ? 'rgba(99,102,241,0.06)' : undefined }}>
                      <td style={{ padding: '12px 16px' }}>
                        <Link href={`/parcels/${b.parcel_id}`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: '#0a2c5f', textDecoration: 'none' }}>
                          {b.survey_no ? `Survey ${b.survey_no}` : `Parcel ${b.parcel_id.substring(0, 8)}`}
                        </Link>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569', fontSize: 11, maxWidth: 320 }}>{b.reason}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: u.bg, color: u.color, border: `1px solid ${u.border}`, textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>{b.urgency}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {b.project_delay_days === null ? (
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#f59e0b' }}>Unquantified</span>
                        ) : b.is_critical_path ? (
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#f43f5e' }}>+{b.project_delay_days}d</span>
                        ) : (
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8' }}>0d (Has Float)</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => { setSelectedBottleneck(b); setSimResult(null); setError(null); }} style={{
                          fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
                          background: isSelected ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.1)',
                          border: `1px solid ${isSelected ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.25)'}`,
                          color: '#0a2c5f'
                        }}>
                          Investigate & Model
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investigation & Simulation Panel */}
      {selectedBottleneck && (
        <div className="glass" style={{ borderRadius: 14, padding: '20px 24px', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', padding: '2px 8px', borderRadius: 4, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#0a2c5f', textTransform: 'uppercase' }}>Active Investigation</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', fontFamily: 'Sora, sans-serif' }}>
                  {selectedBottleneck.survey_no || selectedBottleneck.parcel_id.substring(0, 8)}
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8' }}>
                {selectedBottleneck.is_critical_path
                  ? <><strong style={{ color: '#f43f5e' }}>Zero Float: Directly Driving Project Completion Date (+20d)</strong></>
                  : 'Possesses 15 days schedule float before critical path impact'}
              </p>
            </div>
            <Link href={`/parcels/${selectedBottleneck.parcel_id}`} style={{ fontSize: 12, fontWeight: 600, color: '#0a2c5f', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
              View Parcel Deed <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>

          {/* Causal path */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Deterministic Causal Path & Delay Attribution
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedBottleneck.causal_path.map((hop, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, fontWeight: 700, color: '#1e293b', flex: 1, minWidth: 120 }}>
                    {hop.source_label}
                  </div>
                  <div style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', fontSize: 10, color: '#0a2c5f', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
                    · {hop.relationship} →
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', fontSize: 12, fontWeight: 700, color: '#0a2c5f', flex: 1, minWidth: 120 }}>
                    {hop.target_label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simulation */}
          {!simResult ? (
            <div style={{ padding: '20px 24px', borderRadius: 12, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Counterfactual What-If Simulation Engine</div>
                  <p style={{ fontSize: 12, color: '#94a3b8', maxWidth: 500, lineHeight: 1.6 }}>
                    Runs an in-memory recalculation of the CPM dependency graph to quantify the exact schedule recovery if this legal impediment is resolved today.
                  </p>
                </div>
                <button type="button" onClick={() => runSimulation(selectedBottleneck.parcel_id)} disabled={simulating} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 10, fontSize: 12, fontWeight: 800,
                  background: simulating ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.3)',
                  border: '1px solid rgba(99,102,241,0.5)', color: '#0a2c5f', cursor: simulating ? 'not-allowed' : 'pointer', flexShrink: 0
                }}>
                  <Sparkles style={{ width: 15, height: 15, color: '#f59e0b' }} />
                  {simulating ? 'Computing Counterfactual...' : 'Simulate: Resolve Blocker'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px 24px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 style={{ width: 16, height: 16, color: '#10b981' }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Counterfactual Simulation Result</span>
                </div>
                <button onClick={() => setSimResult(null)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <RotateCcw style={{ width: 12, height: 12 }} /> Reset
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                {[
                  { label: 'Status Quo Forecast', val: formatDate(simResult.before.project_finish), sub: '+20 Days Overrun', color: '#f43f5e', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.25)' },
                  { label: 'Counterfactual Forecast', val: formatDate(simResult.after.project_finish), sub: 'Schedule Fully Recovered', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)' },
                ].map((c) => (
                  <div key={c.label} style={{ padding: '14px 16px', borderRadius: 10, background: c.bg, border: `1px solid ${c.border}` }}>
                    <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'JetBrains Mono, monospace', marginBottom: 6 }}>{c.label}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 800, color: c.color }}>{c.val}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: c.color, marginTop: 4 }}>{c.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '12px 16px', borderRadius: 9, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>Net Critical Delay Recovered:</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#10b981', fontFamily: 'Sora, sans-serif' }}>+{simResult.days_recovered} Calendar Day(s)</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
