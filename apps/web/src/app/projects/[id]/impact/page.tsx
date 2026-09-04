"use client";



import React, { useState, useEffect } from "react";

import { useParams } from "next/navigation";

import Link from "next/link";

import { apiClient } from "@/lib/api";



type ScheduleForecast = {

  project_finish: string;

  critical_path: string[];

  project_delay_days: number | null;

  impact_status: "NO_BLOCKING_CONSTRAINT" | "QUANTIFIED_IMPACT" | "UNQUANTIFIED_IMPACT";

};



type CausalHop = {

  source_type: string;

  source_id: string;

  source_label: string;

  relationship: string;

  target_type: string;

  target_id: string;

  target_label: string;

};



type BottleneckEvidence = {

  parcel_id: string;

  delay_days: number | null;

  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

  reason: string;

  is_critical_path: boolean;

  project_delay_days: number | null;

  impact_status: "NO_BLOCKING_CONSTRAINT" | "QUANTIFIED_IMPACT" | "UNQUANTIFIED_IMPACT";

  causal_path: CausalHop[];

};



type ProjectImpact = {

  baseline: ScheduleForecast;

  current_forecast: ScheduleForecast;

  bottlenecks: BottleneckEvidence[];

};



type SimulationResult = {

  before: ScheduleForecast;

  after: ScheduleForecast;

  days_recovered: number;

};



export default function ProjectImpactPage() {

  const { id } = useParams() as { id: string };

  const [impactData, setImpactData] = useState<ProjectImpact | null>(null);

  const [selectedBottleneck, setSelectedBottleneck] = useState<BottleneckEvidence | null>(null);

  const [simResult, setSimResult] = useState<SimulationResult | null>(null);

  const [loading, setLoading] = useState(true);

  const [simulating, setSimulating] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [simulationSuccess, setSimulationSuccess] = useState<string | null>(null);



  useEffect(() => {

    const fetchImpact = async () => {

      try {

        const data = await apiClient.getProjectImpact(id);

        setImpactData(data as ProjectImpact);

      } catch {

        setError('Failed to calculate deterministic schedule impact.');

      } finally {

        setLoading(false);

      }

    };

    if (id) {

      fetchImpact();

    }

  }, [id]);



  const runSimulation = async (parcelId: string) => {

    setSimulating(true);

    setError(null);

    setSimulationSuccess(null);

    try {

      const data = await apiClient.simulateIntervention(id, { type: "RESOLVE_BLOCKER", parcel_id: parcelId });

      setSimResult(data as SimulationResult);

      setSimulationSuccess(`Counterfactual model completed: ${data.days_recovered} schedule day(s) recoverable.`);

    } catch {

      setError('Simulation request could not be completed.');

    } finally {

      setSimulating(false);

    }

  };



  const formatDate = (ds: string) => {

    try {

      return new Date(ds).toLocaleDateString('en-IN', {

        year: 'numeric',

        month: 'short',

        day: 'numeric'

      });

    } catch {

      return ds;

    }

  };



  if (loading) {

    return (

      <div className="p-8 text-center text-slate-500 bg-white border border-slate-200 rounded-lg text-sm">

        Computing deterministic Critical Path Method (CPM) impact schedule...

      </div>

    );

  }



  if (error && !impactData) {

    return (

      <div className="p-5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">

        <p className="font-semibold">Schedule Engine Offline</p>

        <p className="text-xs text-red-700 mt-1">{error}</p>

      </div>

    );

  }



  if (!impactData) return null;



  return (

    <div className="space-y-6">

      {/* Breadcrumb Navigation */}

      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500">

        <Link href="/" className="hover:text-indigo-600">Dashboard</Link>

        <span>/</span>

        <Link href="/projects" className="hover:text-indigo-600">Projects</Link>

        <span>/</span>

        <Link href={`/projects/${id}`} className="hover:text-indigo-600 font-mono">

          {id.substring(0, 8)}

        </Link>

        <span>/</span>

        <span className="text-slate-800 font-medium">Impact & Simulation</span>

      </nav>



      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">

        <div>

          <div className="flex flex-wrap items-center gap-3">

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">

              Schedule Impact & Counterfactual Simulation

            </h1>

            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded border border-amber-300 font-medium">

              Synthetic Demo Data

            </span>

          </div>

          <p className="mt-1 text-sm text-slate-600">

            Deterministic CPM schedule analysis, attributable critical path delays, and what-if intervention modeling.

          </p>

        </div>



        <div className="flex items-center gap-2">

          <Link

            href={`/projects/${id}/spatial`}

            className="px-3.5 py-2 bg-emerald-600 text-white text-xs sm:text-sm font-semibold rounded shadow-sm hover:bg-emerald-700"

          >

            Spatial Map View

          </Link>

        </div>

      </div>



      {/* Forecast Comparison Cards */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-sm">

          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">

            Baseline Contract Finish

          </div>

          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900">

            {formatDate(impactData.baseline.project_finish)}

          </div>

          <p className="text-xs text-slate-500 mt-2 border-t border-slate-100 pt-2">

            Original zero-delay baseline schedule

          </p>

        </div>



        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-sm">

          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">

            Current Forecast Finish

          </div>

          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900">

            {formatDate(impactData.current_forecast.project_finish)}

          </div>

          <p className="text-xs text-slate-500 mt-2 border-t border-slate-100 pt-2">

            Recalculated with active land constraints

          </p>

        </div>



        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-sm">

          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">

            Attributable Project Delay

          </div>

          <div className="text-xl sm:text-2xl font-bold font-mono text-red-700">

            {impactData.current_forecast.impact_status === "UNQUANTIFIED_IMPACT"

              ? "Unquantified"

              : `+${impactData.current_forecast.project_delay_days || 0} Days`}

          </div>

          <p className="text-xs text-slate-500 mt-2 border-t border-slate-100 pt-2">

            Net delay pushed onto the critical path

          </p>

        </div>

      </div>



      {/* Bottlenecks Table */}

      <div className="space-y-3">

        <div className="flex items-center justify-between">

          <h2 className="text-lg font-semibold text-slate-900">

            Ranked Bottleneck Evidence

          </h2>

          <span className="text-xs text-slate-500">

            {impactData.bottlenecks.length} Critical Path Contributor{impactData.bottlenecks.length === 1 ? '' : 's'}

          </span>

        </div>



        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full text-sm text-left border-collapse">

              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">

                <tr>

                  <th scope="col" className="px-4 py-3">Parcel Identifier</th>

                  <th scope="col" className="px-4 py-3">Reason / Impediment</th>

                  <th scope="col" className="px-4 py-3 text-center">Urgency</th>

                  <th scope="col" className="px-4 py-3 text-right">Schedule Impact</th>

                  <th scope="col" className="px-4 py-3 text-right">Operation</th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {impactData.bottlenecks.map((b) => (

                  <tr key={b.parcel_id} className="hover:bg-slate-50/80 transition-colors">

                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">

                      <Link href={`/parcels/${b.parcel_id}`} className="text-indigo-600 hover:underline">

                        Parcel {b.parcel_id.substring(0, 8)}

                      </Link>

                    </td>

                    <td className="px-4 py-3 text-slate-800 text-xs sm:text-sm">

                      {b.reason}

                    </td>

                    <td className="px-4 py-3 text-center">

                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide border ${

                        b.urgency === 'CRITICAL'

                          ? 'bg-red-50 text-red-800 border-red-200'

                          : 'bg-amber-50 text-amber-800 border-amber-200'

                      }`}>

                        {b.urgency}

                      </span>

                    </td>

                    <td className="px-4 py-3 text-right font-mono font-semibold">

                      {b.project_delay_days === null ? (

                        <span className="text-amber-600">Unquantified</span>

                      ) : b.is_critical_path ? (

                        <span className="text-red-700">+{b.project_delay_days}d</span>

                      ) : (

                        <span className="text-slate-400">0d (Float)</span>

                      )}

                    </td>

                    <td className="px-4 py-3 text-right">

                      <button

                        onClick={() => {

                          setSelectedBottleneck(b);

                          setSimResult(null);

                          setError(null);

                          setSimulationSuccess(null);

                        }}

                        className={`text-xs font-semibold px-2.5 py-1 rounded border transition-colors ${

                          selectedBottleneck?.parcel_id === b.parcel_id

                            ? 'bg-indigo-600 text-white border-indigo-600'

                            : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'

                        }`}

                      >

                        Investigate

                      </button>

                    </td>

                  </tr>

                ))}

                {impactData.bottlenecks.length === 0 && (

                  <tr>

                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">

                      No acquisition bottlenecks currently constrain this project schedule.

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>



      {/* Investigation / Simulation Panel */}

      {selectedBottleneck && (

        <div className="bg-white border border-indigo-200 rounded-lg shadow-sm p-6 space-y-6">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">

            <div>

              <h3 className="text-lg font-bold text-slate-900">

                Investigation: Parcel {selectedBottleneck.parcel_id.substring(0, 8)}

              </h3>

              <p className="text-xs text-slate-500 mt-0.5">

                Status: {selectedBottleneck.is_critical_path ? (

                  <span className="text-red-700 font-semibold">Zero Float: Drives Project Completion Date</span>

                ) : (

                  <span className="text-slate-600">Possesses Schedule Float</span>

                )}

              </p>

            </div>

            <Link

              href={`/parcels/${selectedBottleneck.parcel_id}`}

              className="text-xs font-medium text-indigo-600 hover:underline"

            >

              Open Parcel Record →

            </Link>

          </div>



          {/* Causal Chain Trace */}

          <div>

            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">

              Deterministic Causal Path

            </h4>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-md text-xs space-y-2 font-mono">

              {selectedBottleneck.causal_path.map((hop, idx) => (

                <div key={idx} className="flex flex-wrap items-center gap-2">

                  <span className="font-semibold text-slate-900">{hop.source_label}</span>

                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-sans font-bold">

                    --{hop.relationship}→

                  </span>

                  <span className="font-semibold text-slate-900">{hop.target_label}</span>

                </div>

              ))}

            </div>

          </div>



          {/* Simulation Action */}

          <div>

            {!simResult ? (

              <div className="space-y-3">

                <button

                  type="button"

                  onClick={() => runSimulation(selectedBottleneck.parcel_id)}

                  disabled={simulating}

                  className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"

                >

                  {simulating ? 'Computing Counterfactual...' : 'Simulate Counterfactual: Resolve Blocker'}

                </button>

                <p className="text-xs text-slate-500">

                  Runs an in-memory recalculation to measure the exact schedule recovery if this blocker is cleared today.

                </p>

              </div>

            ) : (

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md space-y-4">

                <div className="flex items-center justify-between">

                  <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider">

                    Counterfactual Simulation Result

                  </div>

                  <button

                    onClick={() => setSimResult(null)}

                    className="text-xs text-slate-500 hover:text-slate-800 underline"

                  >

                    Reset Simulation

                  </button>

                </div>



                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div className="bg-white p-3 rounded border border-emerald-100">

                    <span className="text-xs text-slate-500">Current Forecast</span>

                    <p className="text-base font-bold font-mono text-slate-900">

                      {formatDate(simResult.before.project_finish)}

                    </p>

                  </div>

                  <div className="bg-white p-3 rounded border border-emerald-100">

                    <span className="text-xs text-slate-500">Counterfactual Forecast</span>

                    <p className="text-base font-bold font-mono text-emerald-700">

                      {formatDate(simResult.after.project_finish)}

                    </p>

                  </div>

                </div>



                <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded font-mono font-bold text-sm text-emerald-900">

                  Recoverable Schedule Delay: +{simResult.days_recovered} Day(s)

                </div>

              </div>

            )}

          </div>

        </div>

      )}

    </div>

  );

}
