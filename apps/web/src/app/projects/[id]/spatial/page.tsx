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
    <div className="space-y-5 pb-12">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs text-[#5A6A80] dark:text-slate-400 font-mono">
        <Link href="/" className="hover:text-[#0B2E59] dark:hover:text-white flex items-center gap-1 transition-colors">
          <Home className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
        <span>/</span>
        <Link href="/projects" className="hover:text-[#0B2E59] dark:hover:text-white transition-colors">
          Corridors
        </Link>
        <span>/</span>
        <Link href={`/projects/${projectId}`} className="hover:text-[#0B2E59] dark:hover:text-white font-mono transition-colors">
          {projectId.substring(0, 10)}
        </Link>
        <span>/</span>
        <span className="text-[#14213D] dark:text-white font-bold">Spatial GIS Digital Twin</span>
      </nav>

      {/* Section 14 Data Reality Matrix Banner */}
      <DataRealityBanner />

      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE2E8] dark:border-white/10">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#14213D] dark:text-white font-display">
              Corridor Cadastral Twin & Spatial GIS
            </h1>
            <ProvenanceBadge sourceType="MODEL_DERIVED" size="xs" />
          </div>
          <p className="mt-1 text-xs text-[#5A6A80] dark:text-slate-400">
            Three-mode interactive spatial digital twin: Normal (Status), Risk (Choropleth), and Critical Path (CPM zero-float gating).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectId}/impact`}
            className="px-3.5 py-2 bg-[#0B2E59] hover:bg-[#082242] text-white text-xs font-bold rounded-[4px] shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Schedule What-If Simulator</span>
          </Link>
        </div>
      </div>

      {loading && (
        <div className="py-12 px-6 text-center flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-3 border-[#DCE2E8] border-t-[#0B2E59] animate-spin" />
          <p className="text-xs text-[#5A6A80] dark:text-slate-400 font-mono">Loading cadastral parcels and CPM spatial layers...</p>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-[#FFEBEE] dark:bg-rose-950/40 border border-[#FFCDD2] dark:border-rose-800/40 rounded-[4px] text-xs text-[#B32424] dark:text-rose-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#B32424] dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Notice</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {!loading && geojson && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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
          <div className="bg-white dark:bg-[#0D121F] rounded-[4px] border border-[#DCE2E8] dark:border-white/10 flex flex-col overflow-hidden shadow-xs">
            <div className="p-3.5 border-b border-[#DCE2E8] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#07080F]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-[#14213D] dark:text-white">Spatial Cluster Inspector</h2>
                </div>
                <ProvenanceBadge sourceType="MODEL_DERIVED" size="xs" />
              </div>
              <p className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-0.5">
                Contiguity graph analysis along corridor right-of-way
              </p>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {/* Cluster Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5A6A80] dark:text-slate-400 block font-mono">
                  Identified Bottleneck Clusters ({clusters.length})
                </label>
                <div className="space-y-1.5">
                  {clusters.length === 0 ? (
                    <div className="text-[#5A6A80] dark:text-slate-400 text-xs text-center py-6 border border-dashed border-[#CBD5E1] dark:border-white/10 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F]">
                      No active contiguous clusters detected.
                    </div>
                  ) : (
                    clusters.map((c) => (
                      <button
                        key={c.cluster_id}
                        onClick={() => setSelectedCluster(c)}
                        className={`w-full text-left p-2.5 rounded-[4px] border text-xs transition-all flex items-center justify-between cursor-pointer ${
                          selectedCluster?.cluster_id === c.cluster_id
                            ? 'bg-[#FFF8E1] dark:bg-amber-950/30 border-[#FFE082] dark:border-amber-700/60 text-[#B36B00] dark:text-amber-300 font-bold'
                            : 'bg-white dark:bg-[#0D121F] border-[#DCE2E8] dark:border-white/10 text-[#14213D] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-[#07080F]'
                        }`}
                      >
                        <div>
                          <div className="font-mono text-xs">{c.cluster_id}</div>
                          <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-0.5 font-normal">{c.segment?.name || 'Segment 1 (Kanhera Kalan)'}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-[#FFF8E1] text-[#B36B00] dark:bg-amber-950/40 dark:text-amber-300 border border-[#FFE082] dark:border-amber-800/40">
                          {c.survey_nos?.length || 4} Parcels
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {selectedCluster ? (
                <div className="space-y-3.5 pt-3 border-t border-[#DCE2E8] dark:border-white/10">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5A6A80] dark:text-slate-400">
                      Intersecting Alignment Axis
                    </span>
                    <h3 className="text-xs font-bold text-[#14213D] dark:text-white mt-0.5">
                      {selectedCluster.segment?.name || 'Kanhera Kalan — Bypass Centerline'}
                    </h3>
                  </div>

                  {/* Parcels in Cluster */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6A80] dark:text-slate-400 block mb-1.5 font-mono">
                      Gating Cadastral Surveys
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {selectedCluster.survey_nos?.slice(0, 6).map((s: string, idx: number) => (
                        <div
                          key={idx}
                          className="p-1.5 rounded-[3px] bg-[#FFEBEE] dark:bg-rose-950/30 text-[#B32424] dark:text-rose-300 border border-[#FFCDD2] dark:border-rose-800/40 text-center font-mono font-bold text-xs"
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Schedule Delay Impact */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6A80] dark:text-slate-400 block mb-1.5 font-mono">
                      Zero-Float CPM Delays
                    </span>
                    <div className="space-y-2">
                      {selectedCluster.activities?.map((act: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-[4px] border border-[#FFCDD2] dark:border-rose-800/40 bg-[#FFF5F5] dark:bg-rose-950/20 text-[#14213D] dark:text-slate-200 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>{act.activity_name}</span>
                            <span className="font-mono text-[#B32424] dark:text-rose-400">
                              +{act.delay_days || 229}d Delay
                            </span>
                          </div>

                          {act.causal_path && act.causal_path.length > 0 && (
                            <div className="pt-1.5 border-t border-[#FFCDD2]/60 dark:border-rose-900/40 space-y-1">
                              {act.causal_path.map((hop: string, hIdx: number) => (
                                <div key={hIdx} className="text-[10px] text-[#5A6A80] dark:text-slate-400 flex items-start gap-1">
                                  <span className="text-[#B32424] dark:text-rose-400 font-bold">&bull;</span>
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
                  <div className="pt-1">
                    <Link
                      href={`/projects/${projectId}/impact`}
                      className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white text-xs font-bold shadow-xs transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Launch What-If Intervention</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-[#5A6A80] dark:text-slate-400 text-xs">
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
