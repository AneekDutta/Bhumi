"use client";

import React, { useState } from "react";
import { 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  IndianRupee, 
  TrendingDown, 
  ShieldCheck, 
  ArrowRight, 
  X, 
  Layers, 
  Scale,
  Calendar,
  Check,
  Building2
} from "lucide-react";

interface AdminParcelWhatIfModalProps {
  complaint?: any;
  parcel?: any;
  isOpen?: boolean;
  onClose: () => void;
  onInitiate?: (complaintId: string, notes: string) => void;
  onApplySimulation?: (simResult: any) => Promise<void> | void;
  onSaveSimulation?: (simulationRecord: any) => Promise<void> | void;
}

const INTERVENTIONS = [
  {
    id: "pfms_direct_disburse",
    name: "Fast-Track PFMS Direct Disbursement",
    section: "RFCTLARR 2013 Section 30(1)",
    desc: "Immediate direct electronic payment via PFMS e-Kuber into Aadhaar-linked landowner bank account.",
    processingDays: 5,
    scheduleRecoveryDays: 65,
    adminCost: 15000,
    impact: "Resolves compensation hold and releases statutory possession rights."
  },
  {
    id: "joint_cadastral_ratification",
    name: "Joint Cadastral Boundary Settlement Order",
    section: "RFCTLARR 2013 Section 21 and Section 23",
    desc: "Execute joint field pegging order ratifying the Field Officer-verified 4+ GPS corner demarcation.",
    processingDays: 7,
    scheduleRecoveryDays: 85,
    adminCost: 22000,
    impact: "Eliminates boundary overlap with adjacent survey plots."
  },
  {
    id: "lok_adalat_mediation",
    name: "Revenue Lok Adalat Fast-Track Accord",
    section: "RFCTLARR 2013 Section 64",
    desc: "Convene Special Land Acquisition Lok Adalat for expedited consensual mutual award settlement.",
    processingDays: 14,
    scheduleRecoveryDays: 120,
    adminCost: 45000,
    impact: "Completely neutralizes litigation risk and vacates stay orders."
  }
];

export function AdminParcelWhatIfModal({ 
  complaint, 
  parcel,
  isOpen = true,
  onClose, 
  onInitiate,
  onApplySimulation,
  onSaveSimulation
}: AdminParcelWhatIfModalProps) {
  const [selectedInterventionId, setSelectedInterventionId] = useState(INTERVENTIONS[0].id);
  const [ruralMultiplier, setRuralMultiplier] = useState<number>(1.25);
  const [baseRatePerSqm, setBaseRatePerSqm] = useState<number>(450);

  if (isOpen === false) return null;
  const target = complaint || parcel;
  if (!target) return null;

  // Extract REAL parcel geometry and area
  const parcelId = target.parcel_id || target.survey_number || target.id || "PARCEL-CADASTRAL";
  const ownerName = target.owner_name || "Landowner";
  const village = target.contact_village || target.village || "Corridor Sector";

  // Derive actual area from database record
  let areaSqm = 0;
  let areaAcres = 0;
  if (target.landowner_declared_area?.sqm) {
    areaSqm = Number(target.landowner_declared_area.sqm);
    areaAcres = Number(target.landowner_declared_area.acres || (areaSqm / 4046.86).toFixed(3));
  } else if (target.landowner_reported_boundary?.area_sqm) {
    areaSqm = Number(target.landowner_reported_boundary.area_sqm);
    areaAcres = Number(target.landowner_reported_boundary.area_acres || (areaSqm / 4046.86).toFixed(3));
  } else if (target.area_sqm) {
    areaSqm = Number(target.area_sqm);
    areaAcres = Number(target.area_acres || (areaSqm / 4046.86).toFixed(3));
  } else if (target.area_acres) {
    areaAcres = Number(target.area_acres);
    areaSqm = areaAcres * 4046.86;
  }

  // Exact statutory calculations under RFCTLARR 2013 First Schedule (Sections 26-30)
  const baseMarketValue = Math.round(areaSqm * baseRatePerSqm);
  const multipliedMarketValue = Math.round(baseMarketValue * ruralMultiplier);
  const solatium100Pct = multipliedMarketValue; // Section 30(1): 100% solatium on multiplied market value
  const interest12Pct = Math.round(baseMarketValue * 0.12); // Section 30(3): 12% per annum additional compensation
  const totalStatutoryCompensation = multipliedMarketValue + solatium100Pct + interest12Pct;

  const activeIntervention = INTERVENTIONS.find((i) => i.id === selectedInterventionId) || INTERVENTIONS[0];

  // Schedule impact
  const baselineDelayDays = 145; // Baseline critical path delay caused by unresolved dispute
  const projectedDelayDays = Math.max(10, baselineDelayDays - activeIntervention.scheduleRecoveryDays);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Statutory What-If Counterfactual Simulator</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  RFCTLARR 2013
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Evaluating real geometry for Parcel <strong className="text-slate-200">{parcelId}</strong> &middot; Owner: <strong className="text-slate-200">{ownerName}</strong> ({village})
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Real Cadastral Geometry Banner */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Official Cadastral Geometry</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {areaAcres.toFixed(3)} Acres <span className="text-slate-400 text-xs font-normal">({areaSqm.toLocaleString()} m²)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Circle Rate (₹/m²)</label>
                <input 
                  type="number"
                  value={baseRatePerSqm}
                  onChange={(e) => setBaseRatePerSqm(Number(e.target.value) || 100)}
                  className="w-24 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-white text-right"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Rural Factor (§ 26(2))</label>
                <select 
                  value={ruralMultiplier}
                  onChange={(e) => setRuralMultiplier(Number(e.target.value))}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                >
                  <option value={1.0}>1.00x (Urban)</option>
                  <option value={1.25}>1.25x (Peri-Urban)</option>
                  <option value={1.5}>1.50x (Rural Sector)</option>
                  <option value={2.0}>2.00x (Remote Rural)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Selectable Interventions */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-indigo-400" />
              <span>Select Administrative Intervention to Simulate</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {INTERVENTIONS.map((interv) => {
                const isSelected = interv.id === selectedInterventionId;
                return (
                  <button
                    key={interv.id}
                    type="button"
                    onClick={() => setSelectedInterventionId(interv.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected 
                        ? "bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/50" 
                        : "bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-950/60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-indigo-400 font-semibold">{interv.section}</span>
                        {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                      </div>
                      <div className="text-xs font-bold text-white mb-1.5">{interv.name}</div>
                      <p className="text-[11px] text-slate-400 leading-snug">{interv.desc}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-amber-400 font-semibold">+{interv.scheduleRecoveryDays}d Saved</span>
                      <span className="text-slate-400">₹{interv.adminCost.toLocaleString()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BEFORE vs AFTER Statutory Comparison */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Counterfactual Impact Analysis (Before vs After Intervention)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* BEFORE INTERVENTION */}
              <div className="p-4 rounded-xl bg-red-950/15 border border-red-500/30 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-red-500/20">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400" /> Before Intervention
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">
                    CRITICAL BOTTLENECK
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Critical Path Overrun:</span>
                    <span className="font-mono font-bold text-red-400">+{baselineDelayDays} Days Delay</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Dispute Status:</span>
                    <span className="font-semibold text-amber-300">Unresolved Grievance</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Compensation Status:</span>
                    <span className="text-slate-300">Disbursed: ₹0 (Frozen)</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Site Possession:</span>
                    <span className="font-semibold text-red-400">Possession Blocked</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-red-950/30 text-[11px] text-red-300/90 leading-relaxed">
                  Contested cadastral demarcation stalls contractor mobilization and increases escalation liability by ₹1.2L per week.
                </div>
              </div>

              {/* AFTER INTERVENTION */}
              <div className="p-4 rounded-xl bg-emerald-950/15 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> After Intervention
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    ORDER INITIATED
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Critical Path Impact:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      Recovered {activeIntervention.scheduleRecoveryDays} Days ({projectedDelayDays}d remaining)
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Statutory Award Package:</span>
                    <span className="font-mono font-bold text-white">₹{totalStatutoryCompensation.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">PFMS Disbursement Route:</span>
                    <span className="text-emerald-300 font-semibold">Direct e-Kuber Transfer</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Site Possession:</span>
                    <span className="font-semibold text-emerald-400">Clear Possession Accorded</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-950/30 text-[11px] text-emerald-300/90 leading-relaxed">
                  Execution of {activeIntervention.name} resolves statutory grievance and unblocks project alignment within {activeIntervention.processingDays} days.
                </div>
              </div>

            </div>
          </div>

          {/* Statutory Compensation Breakdown Table */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
                <span>Statutory RFCTLARR 2013 Compensation Breakdown (Computed from Actual Area)</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-normal">First Schedule Formula</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Base Market Value</span>
                <span className="font-mono font-bold text-white text-sm">₹{baseMarketValue.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{areaSqm.toLocaleString()} m² × ₹{baseRatePerSqm}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Multiplied Base (§ 26(2))</span>
                <span className="font-mono font-bold text-white text-sm">₹{multipliedMarketValue.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Factor {ruralMultiplier}x</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-mono block">100% Solatium (§ 30(1))</span>
                <span className="font-mono font-bold text-indigo-300 text-sm">₹{solatium100Pct.toLocaleString()}</span>
                <span className="text-[10px] text-indigo-400/80 block mt-0.5">Statutory 100% solatium</span>
              </div>
              <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/40">
                <span className="text-indigo-300 text-[10px] uppercase font-mono block font-semibold">Total Statutory Award</span>
                <span className="font-mono font-extrabold text-emerald-400 text-sm">₹{totalStatutoryCompensation.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Incl. 12% statutory interest</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Close Simulation
          </button>

          <div className="flex items-center gap-3">
            {onSaveSimulation && (
              <button
                type="button"
                onClick={() => {
                  const simPayload = {
                    simulation_id: `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
                    simulated_at: new Date().toISOString(),
                    simulated_by: "CALA District Competent Authority",
                    scenario: activeIntervention.name,
                    intervention: activeIntervention,
                    rural_multiplier: ruralMultiplier,
                    base_rate_per_sqm: baseRatePerSqm,
                    current_condition: {
                      status: "Unresolved Grievance / Critical Bottleneck",
                      delay_days: baselineDelayDays,
                      critical_path_impact: "Zero-Float Blocked",
                      award_status: "Pending Assessment",
                      site_possession: "Blocked"
                    },
                    simulated_condition: {
                      status: "Statutory Order Initiated",
                      projected_delay_days: projectedDelayDays,
                      total_award_inr: totalStatutoryCompensation,
                      delay_reduction_days: activeIntervention.scheduleRecoveryDays,
                      site_possession: "Clear Possession Accorded"
                    },
                    total_statutory_award_inr: totalStatutoryCompensation,
                    delay_reduction_days: activeIntervention.scheduleRecoveryDays,
                    projected_delay_days: projectedDelayDays,
                    affected_area_acres: Number(areaAcres),
                    affected_families: 1,
                    market_value_inr: baseMarketValue,
                    multiplied_market_value_inr: multipliedMarketValue,
                    solatium_inr: solatium100Pct,
                    interest_inr: interest12Pct
                  };
                  onSaveSimulation(simPayload);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-950/50 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span>Save Simulation &amp; Generate Detailed Report</span>
              </button>
            )}

            {onApplySimulation && (
              <button
                type="button"
                onClick={() => {
                  onApplySimulation({
                    intervention: activeIntervention,
                    totalStatutoryCompensation,
                    delayReductionDays: activeIntervention.scheduleRecoveryDays,
                    projectedDelayDays
                  });
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
              >
                <span>Apply Simulation Scenario</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onInitiate && (
              <button
                type="button"
                onClick={() => {
                  const notes = `Statutory implementation initiated under ${activeIntervention.section} (${activeIntervention.name}). Total assessed compensation: ₹${totalStatutoryCompensation.toLocaleString()} for ${areaAcres.toFixed(3)} acres. Estimated delay reduction: ${activeIntervention.scheduleRecoveryDays} days.`;
                  onInitiate(target.id || target.complaint_id, notes);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-700"
              >
                <span>Initiate Implementation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
