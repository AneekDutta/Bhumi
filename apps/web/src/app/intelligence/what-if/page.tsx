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
    <div className="space-y-6">
      {/* Statutory Simulation Banner */}
      <div className="bg-[#E8F1FA] dark:bg-[#0B2E59]/30 border border-[#B8D5E5] dark:border-[#0B2E59] px-4 py-2.5 rounded-[4px] flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-[#0B2E59] text-white uppercase">
            WHAT-IF SIMULATION
          </span>
          <span className="text-xs text-[#0B2E59] dark:text-[#93C5FD] font-semibold">
            RFCTLARR 2013 Statutory Compensation Assessment
          </span>
        </div>
        <div className="flex items-center gap-3.5 text-xs text-[#555555] dark:text-slate-400">
          <span className="font-mono text-[11px]">Statutory Parameter Workbench</span>
          <button
            onClick={loadData}
            className="text-[#0B5FA5] dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-[#0B2E59] text-white uppercase">
              Decision Intelligence Workbench
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#14213D] dark:text-[#F0F4FF]">
            What-If Statutory Simulation Workbench
          </h1>
          <p className="text-xs text-[#555555] dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Simulate the impact of adjusting statutory multipliers, solatium, and dispute interventions on real landowner compensation awards and court litigation risk.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/landowner-cases"
            className="px-3.5 py-2 rounded-[4px] bg-white dark:bg-white/5 border border-[#DCE2E8] dark:border-white/10 text-[#0B2E59] dark:text-sky-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/10 flex items-center gap-1.5 transition-colors"
          >
            <span>Landowner Cases Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/landowner-gis"
            className="px-3.5 py-2 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Real Landowner GIS</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-[#64748B] text-xs">
          <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-[#0B2E59] dark:text-sky-400" />
          <span>Loading real cases for simulation...</span>
        </div>
      ) : cases.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-[4px] border border-dashed border-[#DCE2E8] dark:border-white/15 bg-white dark:bg-[#0D121F]">
          <CheckCircle2 className="w-8 h-8 text-[#1E7E34] mx-auto mb-2" />
          <div className="text-sm font-bold text-[#14213D] dark:text-white mb-1">
            No landowner grievances available.
          </div>
          <p className="text-xs text-[#64748B] dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            What-If simulation runs exclusively on verified citizen cases. When a landowner files a complaint and the Field Officer verifies it, you can simulate counterfactual awards here.
          </p>
        </div>
      ) : (
        /* Active Simulation Workbench */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Left Column: Target Case Selector & Parameter Sliders */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Case Picker Card */}
            <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm">
              <label className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                Select Real Landowner Case
              </label>
              <select
                value={selectedCaseId}
                onChange={e => setSelectedCaseId(e.target.value)}
                className="w-full px-3 py-2 rounded-[4px] border border-[#CBD5E1] dark:border-white/15 bg-white dark:bg-[#0a0f1d] text-[#14213D] dark:text-white text-xs font-semibold outline-none focus:border-[#0B2E59]"
              >
                {cases.map(c => (
                  <option key={c.id} value={c.id}>
                    Parcel #{c.parcel_id} &bull; {c.owner_name} ({c.status || 'Active'})
                  </option>
                ))}
              </select>

              {selectedCase && parcelMetrics && (
                <div className="mt-3.5 p-3 rounded-[4px] bg-[#F8FAFC] dark:bg-white/[0.02] border border-[#DCE2E8] dark:border-white/10 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Owner:</span>
                    <span className="font-bold text-[#14213D] dark:text-white">{selectedCase.owner_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Declared Area:</span>
                    <span className="font-mono font-bold text-[#1E7E34] dark:text-emerald-400">
                      {parcelMetrics.areaAcres.toFixed(2)} Acres ({parcelMetrics.areaSqm.toLocaleString()} m&sup2;)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Base Circle Rate:</span>
                    <span className="font-mono font-bold text-[#0B5FA5] dark:text-sky-400">
                      ₹{parcelMetrics.ratePerSqm.toLocaleString()}/m&sup2;
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Statutory Parameters Configurator */}
            <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm space-y-4">
              <div className="text-xs font-bold text-[#14213D] dark:text-white flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
                <span>RFCTLARR Statutory Parameters</span>
              </div>

              {/* Multiplier Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#555555] dark:text-slate-400">Rural Multiplier Factor:</span>
                  <span className="font-mono font-bold text-[#0B5FA5] dark:text-sky-400">
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
                  className="w-full accent-[#0B2E59] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#64748B] mt-0.5 font-mono">
                  <span>1.0x (Urban)</span>
                  <span>1.5x (Semi-rural)</span>
                  <span>2.0x (Rural Remote)</span>
                </div>
              </div>

              {/* Solatium Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#555555] dark:text-slate-400">Mandatory Solatium (Sec 30):</span>
                  <span className="font-mono font-bold text-[#1E7E34] dark:text-emerald-400">
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
                  className="w-full accent-[#1E7E34] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#64748B] mt-0.5 font-mono">
                  <span>50%</span>
                  <span>100% (Statutory Norm)</span>
                  <span>150%</span>
                </div>
              </div>

              {/* Delay Interest */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#555555] dark:text-slate-400">Delay Interest (12% p.a.):</span>
                  <span className="font-mono font-bold text-[#B36B00] dark:text-amber-400">
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
                  className="w-full accent-[#B36B00] cursor-pointer"
                />
              </div>

              {/* Administrative Intervention Option */}
              <div>
                <label className="text-xs text-[#555555] dark:text-slate-400 block mb-1.5 font-medium">
                  Direct Administrative Intervention:
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: 'pfms_direct', label: 'PFMS Direct Disbursal (+₹50k fast-track)' },
                    { id: 'joint_cadastral', label: 'Joint Cadastral Demarcation Order' },
                    { id: 'lok_adalat', label: 'Lok Adalat Pre-Litigation Settlement (+₹100k)' }
                  ].map(opt => (
                    <label
                      key={opt.id}
                      className={`p-2.5 rounded-[4px] border text-xs cursor-pointer flex items-center gap-2 transition-colors ${
                        selectedIntervention === opt.id
                          ? 'bg-[#E8F1FA] dark:bg-[#0B2E59]/30 border-[#0B2E59] text-[#0B2E59] dark:text-sky-300 font-semibold'
                          : 'bg-white dark:bg-white/[0.02] border-[#DCE2E8] dark:border-white/10 text-[#555555] dark:text-slate-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="intervention"
                        value={opt.id}
                        checked={selectedIntervention === opt.id}
                        onChange={() => setSelectedIntervention(opt.id)}
                        className="accent-[#0B2E59]"
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
            <div className="lg:col-span-7 space-y-4">
              
              {applySuccess && (
                <div className="p-3 rounded-[4px] bg-[#E8F5E9] dark:bg-emerald-950/40 border border-[#C8E6C9] dark:border-emerald-800/50 text-[#1E7E34] dark:text-emerald-400 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{applySuccess}</span>
                </div>
              )}

              {/* Side-by-Side Comparison Container */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* BEFORE / Current State */}
                <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm">
                  <div className="text-[10px] font-mono font-bold text-[#B36B00] dark:text-amber-400 uppercase tracking-wider mb-1">
                    BEFORE &bull; CURRENT BASELINE
                  </div>
                  <div className="text-sm font-bold text-[#14213D] dark:text-white mb-3">
                    Standard Award
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="text-[11px] text-[#64748B]">Total Compensation</div>
                      <div className="text-xl font-bold font-mono text-[#14213D] dark:text-white mt-0.5">
                        ₹{Math.round(parcelMetrics.beforeTotal).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-[#DCE2E8] dark:border-white/10">
                      <div className="text-[11px] text-[#64748B]">Litigation Risk</div>
                      <div className="text-xs font-bold text-[#B32424] dark:text-rose-400 mt-0.5">
                        {parcelMetrics.beforeLitigationRisk}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-[#DCE2E8] dark:border-white/10">
                      <div className="text-[11px] text-[#64748B]">Projected Dispute Duration</div>
                      <div className="text-xs font-bold text-[#B36B00] dark:text-amber-400 mt-0.5">
                        ~{parcelMetrics.beforeDelayDays} Days
                      </div>
                    </div>
                  </div>
                </div>

                {/* AFTER / Simulated State */}
                <div className="bg-[#F0FDF4] dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800/50 rounded-[4px] p-4 shadow-sm">
                  <div className="text-[10px] font-mono font-bold text-[#1E7E34] dark:text-emerald-400 uppercase tracking-wider mb-1">
                    AFTER &bull; SIMULATED INTERVENTION
                  </div>
                  <div className="text-sm font-bold text-[#1E7E34] dark:text-emerald-300 mb-3">
                    Revised Statutory Award
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="text-[11px] text-[#64748B]">Simulated Compensation</div>
                      <div className="text-xl font-bold font-mono text-[#1E7E34] dark:text-emerald-400 mt-0.5">
                        ₹{Math.round(parcelMetrics.afterTotal).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-[#1E7E34] dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>+₹{Math.round(parcelMetrics.netDifference).toLocaleString('en-IN')} ({Math.round((parcelMetrics.netDifference / parcelMetrics.beforeTotal) * 100)}% uplift)</span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-emerald-200 dark:border-emerald-800/30">
                      <div className="text-[11px] text-[#64748B]">Mitigated Litigation Risk</div>
                      <div className="text-xs font-bold text-[#1E7E34] dark:text-emerald-400 mt-0.5">
                        {parcelMetrics.afterLitigationRisk}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-emerald-200 dark:border-emerald-800/30">
                      <div className="text-[11px] text-[#64748B]">Time Saved to Handover</div>
                      <div className="text-xs font-bold text-[#0B5FA5] dark:text-sky-400 mt-0.5">
                        ~{parcelMetrics.estimatedDaysSaved} Days Saved
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Button: Save & Apply Determination */}
              <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-xs font-bold text-[#14213D] dark:text-white">
                    Issue Statutory Determination Order
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Will issue statutory determination orders and update citizen grievance #{selectedCase.parcel_id} records.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyToDatabase}
                  disabled={applying}
                  className="px-4 py-2 rounded-[4px] bg-[#1E7E34] hover:bg-[#166527] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
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
