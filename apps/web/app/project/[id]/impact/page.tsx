"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api";

// Real API Types
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

  useEffect(() => {
    const fetchImpact = async () => {
      try {
        const data = await apiClient.getProjectImpact(id);
        setImpactData(data as ProjectImpact);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchImpact();
  }, [id]);

  const runSimulation = async (parcelId: string) => {
    setSimulating(true);
    setError(null);
    try {
      const data = await apiClient.simulateIntervention(id, { type: "RESOLVE_BLOCKER", parcel_id: parcelId });
      setSimResult(data as SimulationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSimulating(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500 font-mono text-sm">Loading deterministic schedule model...</div>;
  if (error) return <div className="p-8 text-red-600 font-mono text-sm">Error: {error}</div>;
  if (!impactData) return null;

  const formatDate = (ds: string) => new Date(ds).toLocaleDateString();

  return (
    <div className="max-w-5xl mx-auto p-8 font-mono text-sm">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-2">Project Impact & Simulation</h1>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="p-4 bg-gray-50 border border-gray-200">
          <div className="text-xs text-gray-500 font-bold uppercase mb-1">Baseline Finish</div>
          <div className="text-lg">{formatDate(impactData.baseline.project_finish)}</div>
        </div>
        <div className="p-4 bg-red-50 border border-red-200">
          <div className="text-xs text-red-600 font-bold uppercase mb-1">Current Forecast</div>
          <div className="text-lg text-red-900">{formatDate(impactData.current_forecast.project_finish)}</div>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 flex flex-col justify-center">
          <div className="text-xs text-red-600 font-bold uppercase mb-1">Project Delay</div>
          <div className="text-2xl text-red-700 font-bold">{impactData.current_forecast.impact_status === "UNQUANTIFIED_IMPACT" ? "Unknown (Unquantifiable Delay)" : `${impactData.current_forecast.project_delay_days || 0} Days`}</div>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-4">Top Bottlenecks (Ranked by Project Impact)</h2>
      <div className="border border-gray-200 mb-8 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="p-3 font-semibold">Issue / Parcel ID</th>
              <th className="p-3 font-semibold">Reason</th>
              <th className="p-3 font-semibold">Statutory Urgency</th>
              <th className="p-3 font-semibold">Attributable Project Delay</th>
              <th className="p-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {impactData.bottlenecks.map((b) => (
              <tr key={b.parcel_id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3 font-mono text-xs">{b.parcel_id.substring(0, 8)}</td>
                <td className="p-3">{b.reason}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${b.urgency === 'CRITICAL' ? 'bg-red-200 text-red-900' : 'bg-yellow-200 text-yellow-900'}`}>
                    {b.urgency}
                  </span>
                </td>
                <td className="p-3">
                  {b.project_delay_days === null ? <span className="text-orange-500 font-bold">Unknown</span> : (b.is_critical_path ? <span className="text-red-600 font-bold">+{b.project_delay_days}d</span> : <span className="text-gray-400">0d (Float)</span>)}
                </td>
                <td className="p-3">
                  <button 
                    className="text-blue-600 hover:underline font-bold"
                    onClick={() => { setSelectedBottleneck(b); setSimResult(null); setError(null); }}
                  >
                    Investigate
                  </button>
                </td>
              </tr>
            ))}
            {impactData.bottlenecks.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">No acquisition bottlenecks currently impact this project.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedBottleneck && (
        <div className="border border-blue-200 bg-blue-50 p-6 mb-8">
          <h3 className="text-lg font-bold text-blue-900 mb-4">Investigation: Parcel {selectedBottleneck.parcel_id.substring(0, 8)}</h3>
          
          <div className="mb-6">
            <h4 className="text-xs uppercase font-bold text-blue-700 mb-2">Deterministic Causal Path</h4>
            <div className="bg-white border border-blue-100 p-4 rounded text-sm space-y-2">
              {selectedBottleneck.causal_path.map((hop, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="font-bold text-gray-800">{hop.source_label}</span>
                  <span className="text-blue-500 text-xs font-bold px-2 py-0.5 rounded bg-blue-50 border border-blue-100">
                    --{hop.relationship}&rarr;
                  </span>
                  <span className="font-bold text-gray-800">{hop.target_label}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-700">
              <strong>Critical Path Status:</strong> {selectedBottleneck.is_critical_path ? <span className="text-red-600 font-bold">Constrains Critical Path</span> : "Has Schedule Float (Does not dictate finish date)"}
            </p>
          </div>
          
          {!simResult ? (
            <button 
              onClick={() => runSimulation(selectedBottleneck.parcel_id)}
              disabled={simulating}
              className="bg-blue-600 text-white px-4 py-2 font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              {simulating ? "Simulating..." : "Simulate Counterfactual: Resolve Issue"}
            </button>
          ) : (
            <div className="bg-white border-l-4 border-green-500 p-4 mt-4 shadow-sm">
              <h4 className="text-green-800 font-bold mb-3 uppercase text-xs">Simulation Delta</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-xs">Project Finish (Before)</p>
                  <p className="font-bold text-gray-900">{formatDate(simResult.before.project_finish)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Project Finish (Counterfactual)</p>
                  <p className="font-bold text-green-700">{formatDate(simResult.after.project_finish)}</p>
                </div>
              </div>
              <p className="mt-4 text-green-700 font-bold text-lg bg-green-50 p-2 inline-block rounded">
                Days Recovered: {simResult.days_recovered}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
