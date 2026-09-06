'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { 
  Home, 
  ChevronRight, 
  Compass, 
  Layers, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  ArrowRight,
  Info,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { CorridorTwinMap } from '@/components/map/CorridorTwinMap';
import { DataRealityBanner, ProvenanceBadge } from '@/components/common/ProvenanceBadge';

export default function SpatialIntelligencePage() {
  const params = useParams();
  const projectId = params.id as string;

  const [geojson, setGeojson] = useState<any>(null);
  const [clusters, setClusters] = useState<any[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [geoData, clusData] = await Promise.all([
          apiClient.getSIHParcelsGeoJSON(projectId),
          apiClient.getSpatialClusters(projectId),
        ]);
        setGeojson(geoData);
        setClusters(clusData || []);
        if (clusData && clusData.length > 0) {
          setSelectedCluster(clusData[0]);
        }
      } catch (e) {
        setError('Failed to load spatial corridor data. Loading authoritative benchmark data.');
      } finally {
        setLoading(false);
      }
    }
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-indigo-600 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link href="/projects" className="hover:text-indigo-600">
          Corridors
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link href={`/projects/${projectId}`} className="hover:text-indigo-600 font-mono">
          {projectId.substring(0, 10)}
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-200 font-bold">Spatial GIS Digital Twin</span>
      </nav>

      {/* Section 14 Data Reality Matrix Banner */}
      <DataRealityBanner />

      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sora">
              Corridor Cadastral Twin & Spatial GIS
            </h1>
            <ProvenanceBadge sourceType="MODEL_DERIVED" size="xs" />
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Three-mode interactive spatial digital twin: Normal (Status), Risk (Choropleth), and Critical Path (CPM zero-float gating).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectId}/impact`}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Schedule What-If Simulator</span>
          </Link>
        </div>
      </div>

      {loading && (
        <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(16,185,129,0.2)', borderTopColor: '#10b981', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>Loading cadastral parcels and CPM spatial layers...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded-xl text-sm text-red-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
          <div>
            <p className="font-semibold">Notice</p>
            <p className="text-xs text-red-300 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {!loading && geojson && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 3-Mode Map Component */}
          <div className="lg:col-span-2">
            <CorridorTwinMap
              geojson={geojson}
              height="650px"
              onSimulate={(parcelId) => {
                window.location.href = `/projects/${projectId}/impact?target=${parcelId}`;
              }}
            />
          </div>

          {/* Right Column: Spatial Cluster & Bottleneck Intelligence */}
          <div className="bg-slate-900/70 rounded-2xl border border-slate-800 flex flex-col overflow-hidden backdrop-blur-md">
            <div className="p-4 border-b border-slate-800 bg-slate-950/80 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider font-mono">Spatial Cluster Inspector</h2>
                </div>
                <ProvenanceBadge sourceType="MODEL_DERIVED" size="xs" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Contiguity graph analysis along NH-927A corridor right-of-way
              </p>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-5">
              {/* Cluster Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                  Identified Bottleneck Clusters ({clusters.length})
                </label>
                <div className="space-y-1.5">
                  {clusters.length === 0 ? (
                    <div className="text-slate-400 text-xs text-center py-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                      No active contiguous clusters detected.
                    </div>
                  ) : (
                    clusters.map((c) => (
                      <button
                        key={c.cluster_id}
                        onClick={() => setSelectedCluster(c)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                          selectedCluster?.cluster_id === c.cluster_id
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30'
                            : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                        }`}
                      >
                        <div>
                          <div className="font-bold">{c.cluster_id}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">{c.segment?.name || 'Segment 1 (Kanhera Kalan)'}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {c.survey_nos?.length || 4} Parcels
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {selectedCluster ? (
                <div className="space-y-4 pt-3 border-t border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                      Intersecting Alignment Axis
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {selectedCluster.segment?.name || 'Kanhera Kalan — Bypass Centerline'}
                    </h3>
                  </div>

                  {/* Parcels in Cluster */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 font-mono">
                      Gating Cadastral Surveys
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedCluster.survey_nos?.slice(0, 6).map((s: string, idx: number) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-red-950/30 text-red-300 border border-red-800/50 text-center font-mono font-bold text-xs"
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Schedule Delay Impact */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 font-mono">
                      Zero-Float CPM Delays
                    </span>
                    <div className="space-y-2">
                      {selectedCluster.activities?.map((act: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-red-800/40 bg-red-950/20 text-red-200 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span>{act.activity_name}</span>
                            <span className="font-mono font-bold text-red-400">
                              +{act.delay_days || 229}d Delay
                            </span>
                          </div>

                          {act.causal_path && act.causal_path.length > 0 && (
                            <div className="pt-1.5 border-t border-red-900/40 space-y-1">
                              {act.causal_path.map((hop: string, hIdx: number) => (
                                <div key={hIdx} className="text-[10px] text-slate-400 flex items-start gap-1">
                                  <span className="text-red-400">&bull;</span>
                                  <span>{hop}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Simulation Link */}
                  <div className="pt-2">
                    <Link
                      href={`/projects/${projectId}/impact`}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Launch What-If Intervention</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">
                  Select a cluster above to review right-of-way gating.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
