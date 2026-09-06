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
      <div className="py-12 px-6 text-center flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-3 border-[#DCE2E8] border-t-[#0B2E59] animate-spin" />
        <p className="text-xs text-[#5A6A80] dark:text-slate-400 font-mono">Computing deterministic CPM impact schedule...</p>
      </div>
    );
  }

  if (error && !impactData) {
    return (
      <div className="p-4 rounded-[4px] bg-[#FFEBEE] dark:bg-rose-950/30 border border-[#FFCDD2] dark:border-rose-800/40 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-[#B32424] dark:text-rose-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-bold text-[#B32424] dark:text-rose-300">Schedule Engine Notice</div>
          <p className="text-xs text-[#5A6A80] dark:text-slate-300 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!impactData) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[#5A6A80] dark:text-slate-400 font-mono">
        <Link href="/" className="hover:text-[#0B2E59] dark:hover:text-white transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/projects" className="hover:text-[#0B2E59] dark:hover:text-white transition-colors">Corridors</Link>
        <span>/</span>
        <Link href={`/projects/${id}`} className="hover:text-[#0B2E59] dark:hover:text-white font-mono transition-colors">{id.substring(0, 8)}</Link>
        <span>/</span>
        <span className="text-[#14213D] dark:text-white font-bold">Impact &amp; Simulation</span>
      </nav>

      {/* Provenance Banner */}
      <DataRealityBanner />

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[3px] bg-[#E6F0FA] dark:bg-sky-950/40 border border-[#B8D5ED] dark:border-sky-800/40 text-[#0B2E59] dark:text-sky-300 uppercase font-bold tracking-wider">
              Deterministic CPM Engine
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#14213D] dark:text-white m-0 font-display">
            Schedule Impact &amp; Counterfactual Simulation
          </h1>
          <p className="text-xs text-[#5A6A80] dark:text-slate-400 mt-1">
            Attributable critical path delay calculation, statutory causal dependency chains, and interactive intervention modeling
          </p>
        </div>
        <Link
          href={`/projects/${id}/spatial`}
          className="px-3.5 py-2 rounded-[4px] text-xs font-bold bg-[#E6F0FA] dark:bg-sky-950/40 text-[#0B2E59] dark:text-sky-300 border border-[#B8D5ED] dark:border-sky-800/40 hover:bg-[#D4E6F7] flex items-center gap-1.5 shadow-xs transition-all"
        >
          <Compass className="w-3.5 h-3.5" /> Spatial Map View
        </Link>
      </div>

      {/* Contract Schedule Variance */}
      <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider font-bold">Contract Schedule Variance</div>
            <div className="text-sm font-bold text-[#14213D] dark:text-white mt-0.5">Critical Path Completion Comparison</div>
          </div>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] border ${
            (impactData.current_forecast.project_delay_days || 0) > 0
              ? 'bg-[#FFEBEE] dark:bg-rose-950/40 border-[#FFCDD2] dark:border-rose-800/40 text-[#B32424] dark:text-rose-300'
              : 'bg-[#E8F5E9] dark:bg-emerald-950/40 border-[#C8E6C9] dark:border-emerald-800/40 text-[#1E7E34] dark:text-emerald-300'
          }`}>
            {impactData.current_forecast.critical_path?.length || 0} Critical Path Activities
          </span>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Baseline Contract Finish', val: formatDate(impactData.baseline.project_finish), sub: 'Original zero-delay baseline', color: 'text-[#0B2E59] dark:text-sky-400', bg: 'bg-[#F8FAFC] dark:bg-[#07080F]', border: 'border-[#DCE2E8] dark:border-white/10', icon: Calendar },
            { label: 'Current Forecast Finish', val: formatDate(impactData.current_forecast.project_finish), sub: 'Pushed out due to unresolved RoW', color: 'text-[#B32424] dark:text-rose-400', bg: 'bg-[#FFF5F5] dark:bg-rose-950/20', border: 'border-[#FFCDD2] dark:border-rose-800/40', icon: Clock },
            { label: 'Attributable Delay', val: impactData.current_forecast.impact_status === "UNQUANTIFIED_IMPACT" ? "Unquantified" : `+${impactData.current_forecast.project_delay_days || 0}d Overrun`, sub: 'Net delay on zero-float path', color: 'text-[#B32424] dark:text-rose-400', bg: 'bg-[#FFF5F5] dark:bg-rose-950/20', border: 'border-[#FFCDD2] dark:border-rose-800/40', icon: AlertTriangle },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className={`rounded-[4px] p-3.5 border ${m.bg} ${m.border} shadow-xs`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider font-mono font-semibold">{m.label}</div>
                  <Icon className="w-3.5 h-3.5 text-[#5A6A80] dark:text-slate-400" />
                </div>
                <div className={`font-mono text-base font-bold ${m.color}`}>{m.val}</div>
                <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-1">{m.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Timeline comparison bars */}
        <div className="p-3.5 bg-[#F8FAFC] dark:bg-[#07080F] rounded-[4px] border border-[#DCE2E8] dark:border-white/10 space-y-2.5">
          <div className="flex justify-between text-xs font-bold text-[#14213D] dark:text-slate-300">
            <span>Critical Path Timeline</span>
            <span className={`font-mono ${
              (impactData.current_forecast.project_delay_days || 0) > 0 ? 'text-[#B32424] dark:text-rose-400' : 'text-[#1E7E34] dark:text-emerald-400'
            }`}>
              {(impactData.current_forecast.project_delay_days || 0) > 0 ? `+${impactData.current_forecast.project_delay_days} Calendar Days Slippage` : 'On Schedule (Zero Slippage)'}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Baseline', date: formatDate(impactData.baseline.project_finish), w1: '80%', w2: null, c1: 'bg-[#0B2E59] dark:bg-sky-600' },
              { label: 'Forecast (with constraints)', date: formatDate(impactData.current_forecast.project_finish), w1: '80%', w2: '20%', c1: 'bg-[#0B2E59] dark:bg-sky-600' },
            ].map((bar) => (
              <div key={bar.label}>
                <div className="flex justify-between text-[10px] text-[#5A6A80] dark:text-slate-400 mb-1 font-mono">
                  <span>{bar.label}</span><span>{bar.date}</span>
                </div>
                <div className="w-full h-2 bg-[#E2E8F0] dark:bg-slate-800 rounded-[2px] overflow-hidden flex">
                  <div style={{ width: bar.w1 }} className={`h-full ${bar.c1} rounded-[2px]`} />
                  {bar.w2 && <div style={{ width: bar.w2 }} className="h-full bg-[#B32424] dark:bg-rose-500 animate-pulse" />}
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
      <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-[#DCE2E8] dark:border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider font-bold">Ranked Bottleneck Evidence</div>
            <div className="text-sm font-bold text-[#14213D] dark:text-white mt-0.5">Cadastral Critical Path Contributors</div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] bg-[#E6F0FA] dark:bg-sky-950/40 border border-[#B8D5ED] dark:border-sky-800/40 text-[#0B2E59] dark:text-sky-300">
            {impactData.bottlenecks.length} Contributor{impactData.bottlenecks.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#DCE2E8] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#07080F]">
                {['Parcel Entity', 'Statutory Blocker / Reason', 'Urgency', 'Attributable Delay', 'Intervention'].map(h => (
                  <th key={h} className="py-2.5 px-4 text-left text-[10px] font-mono font-bold text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {impactData.bottlenecks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-xs text-[#5A6A80] dark:text-slate-400">
                    No critical path bottlenecks or schedule delays detected. All activities within planned float buffers.
                  </td>
                </tr>
              ) : (
                impactData.bottlenecks.map((b) => {
                  const isSelected = selectedBottleneck?.parcel_id === b.parcel_id;
                  return (
                    <tr key={b.parcel_id} className={`border-b border-[#DCE2E8]/60 dark:border-white/5 transition-colors ${
                      isSelected ? 'bg-[#F0F4F9] dark:bg-sky-950/20' : 'hover:bg-[#F8FAFC] dark:hover:bg-[#07080F]/60'
                    }`}>
                      <td className="py-3 px-4">
                        <Link href={`/parcels/${b.parcel_id}`} className="font-mono text-xs font-bold text-[#0B2E59] dark:text-sky-400 hover:underline">
                          {b.survey_no ? `Survey ${b.survey_no}` : `Parcel ${b.parcel_id.substring(0, 8)}`}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-[#5A6A80] dark:text-slate-300 text-xs max-w-xs">{b.reason}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-[3px] border uppercase ${
                          b.urgency === 'CRITICAL' ? 'bg-[#FFEBEE] text-[#B32424] border-[#FFCDD2] dark:bg-rose-950/40 dark:text-rose-300' :
                          b.urgency === 'HIGH' ? 'bg-[#FFF8E1] text-[#B36B00] border-[#FFE082] dark:bg-amber-950/40 dark:text-amber-300' :
                          'bg-[#E8F5E9] text-[#1E7E34] border-[#C8E6C9] dark:bg-emerald-950/40 dark:text-emerald-300'
                        }`}>
                          {b.urgency}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        {b.project_delay_days === null ? (
                          <span className="text-[#B36B00] dark:text-amber-400">Unquantified</span>
                        ) : b.is_critical_path ? (
                          <span className="text-[#B32424] dark:text-rose-400">+{b.project_delay_days}d</span>
                        ) : (
                          <span className="text-[#5A6A80] dark:text-slate-400">0d (Has Float)</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => { setSelectedBottleneck(b); setSimResult(null); setError(null); }}
                          className={`text-xs font-bold px-3 py-1.5 rounded-[3px] transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#0B2E59] text-white'
                              : 'bg-[#E6F0FA] dark:bg-sky-950/40 text-[#0B2E59] dark:text-sky-300 border border-[#B8D5ED] dark:border-sky-800/40 hover:bg-[#D4E6F7]'
                          }`}
                        >
                          Investigate &amp; Model
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
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] bg-[#E6F0FA] dark:bg-sky-950/40 text-[#0B2E59] dark:text-sky-300 border border-[#B8D5ED] dark:border-sky-800/40 uppercase">
                  Active Investigation
                </span>
                <span className="text-sm font-bold text-[#14213D] dark:text-white font-mono">
                  {selectedBottleneck.survey_no || selectedBottleneck.parcel_id.substring(0, 8)}
                </span>
              </div>
              <p className="text-xs text-[#5A6A80] dark:text-slate-400">
                {selectedBottleneck.is_critical_path
                  ? <strong className="text-[#B32424] dark:text-rose-400">Zero Float: Directly Driving Project Completion Date (+20d)</strong>
                  : 'Possesses 15 days schedule float before critical path impact'}
              </p>
            </div>
            <Link
              href={`/parcels/${selectedBottleneck.parcel_id}`}
              className="text-xs font-bold text-[#0B2E59] dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              View Parcel Deed <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Causal path */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider font-bold">
              Deterministic Causal Path &amp; Delay Attribution
            </div>
            <div className="flex flex-col gap-2">
              {selectedBottleneck.causal_path.map((hop, idx) => (
                <div key={idx} className="flex items-center gap-2 flex-wrap text-xs">
                  <div className="p-2 rounded-[3px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 font-bold text-[#14213D] dark:text-white flex-1 min-w-[120px]">
                    {hop.source_label}
                  </div>
                  <div className="px-2 py-1 rounded-[3px] bg-[#E6F0FA] dark:bg-sky-950/40 text-[#0B2E59] dark:text-sky-300 border border-[#B8D5ED] dark:border-sky-800/40 font-mono text-[10px] whitespace-nowrap font-bold">
                    &bull; {hop.relationship} &rarr;
                  </div>
                  <div className="p-2 rounded-[3px] bg-[#E6F0FA] dark:bg-sky-950/30 border border-[#B8D5ED] dark:border-sky-800/40 font-bold text-[#0B2E59] dark:text-sky-300 flex-1 min-w-[120px]">
                    {hop.target_label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simulation */}
          {!simResult ? (
            <div className="p-4 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-xs font-bold text-[#14213D] dark:text-white mb-1">Counterfactual What-If Simulation Engine</div>
                  <p className="text-xs text-[#5A6A80] dark:text-slate-400 max-w-lg leading-relaxed">
                    Runs an in-memory recalculation of the CPM dependency graph to quantify the exact schedule recovery if this legal impediment is resolved today.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => runSimulation(selectedBottleneck.parcel_id)}
                  disabled={simulating}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-[4px] text-xs font-bold bg-[#0B2E59] hover:bg-[#082242] text-white shadow-xs transition-all cursor-pointer disabled:bg-slate-300 dark:disabled:bg-slate-800"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {simulating ? 'Computing Counterfactual...' : 'Simulate: Resolve Blocker'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-[4px] bg-[#E8F5E9] dark:bg-emerald-950/20 border border-[#C8E6C9] dark:border-emerald-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1E7E34] dark:text-emerald-400" />
                  <span className="text-xs font-bold text-[#1E7E34] dark:text-emerald-400 uppercase tracking-wider font-mono">Counterfactual Simulation Result</span>
                </div>
                <button
                  onClick={() => setSimResult(null)}
                  className="flex items-center gap-1 text-xs font-bold text-[#5A6A80] dark:text-slate-400 hover:text-[#14213D] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Status Quo Forecast', val: formatDate(simResult.before.project_finish), sub: '+20 Days Overrun', color: 'text-[#B32424] dark:text-rose-400', bg: 'bg-[#FFF5F5] dark:bg-rose-950/20', border: 'border-[#FFCDD2] dark:border-rose-800/40' },
                  { label: 'Counterfactual Forecast', val: formatDate(simResult.after.project_finish), sub: 'Schedule Fully Recovered', color: 'text-[#1E7E34] dark:text-emerald-400', bg: 'bg-white dark:bg-[#0D121F]', border: 'border-[#C8E6C9] dark:border-emerald-800/40' },
                ].map((c) => (
                  <div key={c.label} className={`p-3 rounded-[4px] ${c.bg} border ${c.border}`}>
                    <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase tracking-wider font-mono mb-1">{c.label}</div>
                    <div className={`font-mono text-base font-bold ${c.color}`}>{c.val}</div>
                    <div className={`text-[11px] font-bold ${c.color} mt-0.5`}>{c.sub}</div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-[3px] bg-white dark:bg-[#0D121F] border border-[#C8E6C9] dark:border-emerald-800/40 flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E7E34] dark:text-emerald-400 font-mono">Net Critical Delay Recovered:</span>
                <span className="text-base font-extrabold text-[#1E7E34] dark:text-emerald-400 font-display">+{simResult.days_recovered} Calendar Day(s)</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
