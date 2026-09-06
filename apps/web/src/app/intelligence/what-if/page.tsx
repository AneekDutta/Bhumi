'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  IndianRupee, 
  Scale, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Navigation,
  FileCheck,
  TrendingDown,
  TrendingUp,
  Percent
} from 'lucide-react';
import { getLandownerComplaints, getAllRegisteredParcels, adminCompleteImplementation } from '@/lib/api';

export default function WhatIfSimulationPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  
  // Interactive What-If Simulation Controls
  const [multiplier, setMultiplier] = useState<number>(1.5);
  const [solatiumPct, setSolatiumPct] = useState<number>(100);
  const [interestYears, setInterestYears] = useState<number>(1);
  const [selectedIntervention, setSelectedIntervention] = useState<string>('pfms_direct');
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getLandownerComplaints();
      const verified = (data || []).filter((c: any) => {
        const s = c.status || '';
        return (
          s === 'Verified by Field Officer' ||
          s === 'Field Verified' ||
          s === 'Implementation Initiated' ||
          s === 'Implementation Completed' ||
          s === 'RESOLVED' ||
          s === 'Submitted'
        );
      });
      setCases(verified);
      if (verified.length > 0 && !selectedCaseId) {
        setSelectedCaseId(verified[0].id);
      }
    } catch (err) {
      console.error('Failed to load cases for What-If:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedCase = useMemo(() => {
    return cases.find(c => c.id === selectedCaseId) || cases[0] || null;
  }, [cases, selectedCaseId]);

  // Derive parcel parameters from real database case
  const parcelMetrics = useMemo(() => {
    if (!selectedCase) return null;
    const areaAcres = Number(selectedCase.landowner_declared_area?.acres || (selectedCase.area_sqm ? selectedCase.area_sqm / 4046.86 : 0));
    const areaSqm = Number(selectedCase.landowner_declared_area?.sqm || selectedCase.area_sqm || 0);
    const ratePerSqm = Number(selectedCase.market_rate_sqm || 2400);
    const baseValue = areaSqm * ratePerSqm;

    // BEFORE: Standard statutory baseline
    const beforeMultiplier = 1.0;
    const beforeBaseWithMult = baseValue * beforeMultiplier;
    const beforeSolatium = beforeBaseWithMult * 1.0;
    const beforeTotal = beforeBaseWithMult + beforeSolatium;
    const beforeLitigationRisk = selectedCase.status === 'Implementation Completed' ? 'LOW (15%)' : 'HIGH (78%)';
    const beforeDelayDays = 120;

    // AFTER: Simulated Parameters
    const afterBaseWithMult = baseValue * multiplier;
    const afterSolatium = afterBaseWithMult * (solatiumPct / 100);
    const afterInterest = afterBaseWithMult * (0.12 * interestYears);
    const interventionBonus = selectedIntervention === 'pfms_direct' ? 50000 : selectedIntervention === 'lok_adalat' ? 100000 : 0;
    const afterTotal = afterBaseWithMult + afterSolatium + afterInterest + interventionBonus;

    const netDifference = afterTotal - beforeTotal;
    const estimatedDaysSaved = selectedIntervention === 'pfms_direct' ? 75 : selectedIntervention === 'joint_cadastral' ? 90 : 60;
    const afterLitigationRisk = 'LOW (< 10%)';

    return {
      areaAcres,
      areaSqm,
      ratePerSqm,
      baseValue,
      beforeTotal,
      beforeLitigationRisk,
      beforeDelayDays,
      afterTotal,
      afterInterest,
      afterSolatium,
      netDifference,
      estimatedDaysSaved,
      afterLitigationRisk
    };
  }, [selectedCase, multiplier, solatiumPct, interestYears, selectedIntervention]);

  const handleApplyToDatabase = async () => {
    if (!selectedCase || !parcelMetrics) return;
    setApplying(true);
    setApplySuccess(null);

    try {
      const notes = `Statutory What-If Counterfactual Applied: Multiplier=${multiplier}x, Solatium=${solatiumPct}%, InterestYears=${interestYears}y, Intervention=${selectedIntervention.toUpperCase()}. Revised Total Award=Rs. ${Math.round(parcelMetrics.afterTotal).toLocaleString('en-IN')}.`;
      await adminCompleteImplementation(selectedCase.id, 'Admin Directorate', notes, {
        multiplier_factor: multiplier,
        solatium_pct: solatiumPct,
        interest_years: interestYears,
        simulated_award_inr: Math.round(parcelMetrics.afterTotal),
        intervention: selectedIntervention
      });
      setApplySuccess(`Successfully applied revised statutory parameters (₹${Math.round(parcelMetrics.afterTotal).toLocaleString('en-IN')}) to Case #${selectedCase.parcel_id}!`);
      await loadData();
    } catch (err: any) {
      alert('Unable to save statutory determination. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Statutory Simulation Banner */}
      <div style={{
        padding: '10px 16px',
        borderRadius: 10,
        background: 'rgba(16,185,129,0.08)',
        border: '1px solid rgba(16,185,129,0.25)',
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
            background: '#10b981',
            color: '#000',
            textTransform: 'uppercase'
          }}>
            WHAT-IF SIMULATION
          </span>
          <span style={{ fontSize: 12, color: '#6ee7b7', fontWeight: 600 }}>
            RFCTLARR 2013 Statutory Compensation Assessment
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
            Statutory Parameter Workbench
          </span>
          <button
            onClick={loadData}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#34d399',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600
            }}
          >
            <RefreshCw style={{ width: 12, height: 12, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 10, fontFamily: 'JetBrains Mono, monospace', padding: '2px 8px', borderRadius: 4,
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8',
              textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>
              Decision Intelligence Workbench
            </span>
          </div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
            What-If Statutory Simulation Workbench
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Simulate the impact of adjusting statutory multipliers, solatium, and dispute interventions on real landowner compensation awards and court litigation risk.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            href="/landowner-cases"
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#cbd5e1',
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>Landowner Cases Queue</span>
            <ArrowRight style={{ width: 13, height: 13 }} />
          </Link>
          <Link
            href="/landowner-gis"
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#a5b4fc',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Navigation style={{ width: 14, height: 14 }} />
            <span>Real Landowner GIS</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px 16px', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw style={{ width: 24, height: 24, margin: '0 auto 12px', animation: 'spin 1s linear infinite', color: '#10b981' }} />
          <span>Loading real cases for simulation...</span>
        </div>
      ) : cases.length === 0 ? (
        <div style={{ padding: '60px 16px', textAlign: 'center', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <CheckCircle2 style={{ width: 36, height: 36, color: '#10b981', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
            No landowner grievances available.
          </div>
          <p style={{ fontSize: 12, color: '#64748b', maxWidth: 440, margin: '0 auto' }}>
            What-If simulation runs exclusively on verified citizen cases. When a landowner files a complaint and the Field Officer verifies it, you can simulate counterfactual awards here.
          </p>
        </div>
      ) : (
        /* Active Simulation Workbench */
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: 20, alignItems: 'start' }}>
          
          {/* Left Column: Target Case Selector & Parameter Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Case Picker Card */}
            <div className="glass" style={{ borderRadius: 14, padding: 18, border: '1px solid rgba(255,255,255,0.08)' }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 8 }}>
                Select Real Landowner Case
              </label>
              <select
                value={selectedCaseId}
                onChange={e => setSelectedCaseId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(15,23,42,0.8)',
                  color: '#e2e8f0',
                  fontSize: 13,
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {cases.map(c => (
                  <option key={c.id} value={c.id}>
                    Parcel #{c.parcel_id} &middot; {c.owner_name} ({c.status || 'Active'})
                  </option>
                ))}
              </select>

              {selectedCase && parcelMetrics && (
                <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: 'rgba(0,0,0,0.25)', fontSize: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#64748b' }}>Owner:</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{selectedCase.owner_name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#64748b' }}>Declared Area:</span>
                    <span style={{ color: '#10b981', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                      {parcelMetrics.areaAcres.toFixed(2)} Acres ({parcelMetrics.areaSqm.toLocaleString()} m&sup2;)
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Base Circle Rate:</span>
                    <span style={{ color: '#818cf8', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                      ₹{parcelMetrics.ratePerSqm.toLocaleString()}/m&sup2;
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Statutory Parameters Configurator */}
            <div className="glass" style={{ borderRadius: 14, padding: 18, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Scale style={{ width: 14, height: 14, color: '#10b981' }} />
                <span>RFCTLARR Statutory Parameters</span>
              </div>

              {/* Multiplier Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                  <span style={{ color: '#94a3b8' }}>Rural Multiplier Factor:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                    {multiplier.toFixed(2)}&times;
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.0"
                  step="0.05"
                  value={multiplier}
                  onChange={e => setMultiplier(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#64748b', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
                  <span>1.0x (Urban)</span>
                  <span>1.5x (Semi-rural)</span>
                  <span>2.0x (Rural Remote)</span>
                </div>
              </div>

              {/* Solatium Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                  <span style={{ color: '#94a3b8' }}>Mandatory Solatium (Sec 30):</span>
                  <span style={{ color: '#10b981', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                    {solatiumPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  step="10"
                  value={solatiumPct}
                  onChange={e => setSolatiumPct(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#64748b', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
                  <span>50%</span>
                  <span>100% (Statutory Norm)</span>
                  <span>150%</span>
                </div>
              </div>

              {/* Delay Interest */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                  <span style={{ color: '#94a3b8' }}>Delay Interest (12% p.a.):</span>
                  <span style={{ color: '#f59e0b', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                    {interestYears} Year{interestYears === 1 ? '' : 's'} (+{(interestYears * 12)}%)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="0.5"
                  value={interestYears}
                  onChange={e => setInterestYears(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
                />
              </div>

              {/* Administrative Intervention Option */}
              <div>
                <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                  Direct Administrative Intervention:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { id: 'pfms_direct', label: 'PFMS Direct Disbursal (+₹50k fast-track)' },
                    { id: 'joint_cadastral', label: 'Joint Cadastral Demarcation Order' },
                    { id: 'lok_adalat', label: 'Lok Adalat Pre-Litigation Settlement (+₹100k)' }
                  ].map(opt => (
                    <label
                      key={opt.id}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: selectedIntervention === opt.id ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.06)',
                        background: selectedIntervention === opt.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                        fontSize: 11,
                        color: selectedIntervention === opt.id ? '#c7d2fe' : '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <input
                        type="radio"
                        name="intervention"
                        value={opt.id}
                        checked={selectedIntervention === opt.id}
                        onChange={() => setSelectedIntervention(opt.id)}
                        style={{ accentColor: '#6366f1' }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Live Side-by-Side BEFORE vs AFTER Comparison */}
          {parcelMetrics && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {applySuccess && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'rgba(16,185,129,0.15)',
                  border: '1px solid rgba(16,185,129,0.35)',
                  color: '#34d399',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <span>{applySuccess}</span>
                </div>
              )}

              {/* Side-by-Side Comparison Container */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                
                {/* BEFORE / Current State */}
                <div className="glass" style={{
                  borderRadius: 14,
                  padding: 20,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.015)'
                }}>
                  <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 4 }}>
                    BEFORE &bull; CURRENT BASELINE
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#e2e8f0', marginBottom: 14 }}>
                    Standard Award
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
                    <div>
                      <div style={{ color: '#64748b', fontSize: 11 }}>Total Compensation</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                        ₹{Math.round(parcelMetrics.beforeTotal).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div style={{ paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ color: '#64748b', fontSize: 11 }}>Litigation Risk</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', marginTop: 2 }}>
                        {parcelMetrics.beforeLitigationRisk}
                      </div>
                    </div>

                    <div style={{ paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ color: '#64748b', fontSize: 11 }}>Projected Dispute Duration</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b', marginTop: 2 }}>
                        ~{parcelMetrics.beforeDelayDays} Days
                      </div>
                    </div>
                  </div>
                </div>

                {/* AFTER / Simulated State */}
                <div className="glass" style={{
                  borderRadius: 14,
                  padding: 20,
                  border: '1px solid rgba(16,185,129,0.3)',
                  background: 'rgba(16,185,129,0.04)'
                }}>
                  <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: 4 }}>
                    AFTER &bull; SIMULATED INTERVENTION
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399', marginBottom: 14 }}>
                    Revised Statutory Award
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
                    <div>
                      <div style={{ color: '#64748b', fontSize: 11 }}>Simulated Compensation</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                        ₹{Math.round(parcelMetrics.afterTotal).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <TrendingUp style={{ width: 12, height: 12 }} />
                        <span>+₹{Math.round(parcelMetrics.netDifference).toLocaleString('en-IN')} ({Math.round((parcelMetrics.netDifference / parcelMetrics.beforeTotal) * 100)}% uplift)</span>
                      </div>
                    </div>

                    <div style={{ paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ color: '#64748b', fontSize: 11 }}>Mitigated Litigation Risk</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#34d399', marginTop: 2 }}>
                        {parcelMetrics.afterLitigationRisk}
                      </div>
                    </div>

                    <div style={{ paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ color: '#64748b', fontSize: 11 }}>Time Saved to Handover</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', marginTop: 2 }}>
                        ~{parcelMetrics.estimatedDaysSaved} Days Saved
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Button: Save & Apply Determination */}
              <div className="glass" style={{ borderRadius: 14, padding: 18, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
                    Issue Statutory Determination Order
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    Will issue statutory determination orders and update citizen grievance #{selectedCase.parcel_id} records.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyToDatabase}
                  disabled={applying}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    border: 'none',
                    cursor: applying ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(16,185,129,0.35)'
                  }}
                >
                  <FileCheck style={{ width: 16, height: 16 }} />
                  <span>{applying ? 'Applying...' : 'Apply Statutory Determination'}</span>
                </button>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
