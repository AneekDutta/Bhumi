'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Map, { Marker, NavigationControl, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useSearchParams } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Layers, 
  Navigation, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Compass, 
  Info,
  ShieldAlert,
  Train,
  Zap,
  Droplet,
  ExternalLink
} from 'lucide-react';
import { MOCK_GOVERNMENT_PROJECTS, GovernmentProject } from '@/lib/mockProjectData';
import { useTheme } from '@/context/ThemeContext';

export default function GovernmentProjectGISPage() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<GovernmentProject | null>(
    MOCK_GOVERNMENT_PROJECTS.find(p => p.id === initialId) || MOCK_GOVERNMENT_PROJECTS[0]
  );
  const [hoveredProject, setHoveredProject] = useState<GovernmentProject | null>(null);

  const filteredProjects = useMemo(() => {
    if (selectedSector === 'ALL') return MOCK_GOVERNMENT_PROJECTS;
    return MOCK_GOVERNMENT_PROJECTS.filter(p => p.sector === selectedSector);
  }, [selectedSector]);

  // GeoJSON LineString Features for project corridors
  const corridorGeojson = useMemo(() => {
    const features = filteredProjects
      .filter(p => p.corridor_path && p.corridor_path.length >= 2)
      .map(p => ({
        type: 'Feature' as const,
        id: p.id,
        properties: {
          id: p.id,
          name: p.name,
          sector: p.sector,
          status: p.status,
          isSelected: selectedProject?.id === p.id
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: p.corridor_path as [number, number][]
        }
      }));

    return {
      type: 'FeatureCollection' as const,
      features
    };
  }, [filteredProjects, selectedProject]);

  const mapKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  const mapStyle = mapKey 
    ? `https://api.maptiler.com/maps/basic-v2/style.json?key=${mapKey}` 
    : isLight
      ? 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
      : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

  const [viewState, setViewState] = useState({
    longitude: selectedProject ? selectedProject.centroid.coordinates[0] : 75.8362,
    latitude: selectedProject ? selectedProject.centroid.coordinates[1] : 24.5854,
    zoom: 6.0
  });

  const handleSelectProject = (project: GovernmentProject) => {
    setSelectedProject(project);
    setViewState({
      longitude: project.centroid.coordinates[0],
      latitude: project.centroid.coordinates[1],
      zoom: 8.5
    });
  };

  const sectors = [
    'ALL',
    'Highways',
    'Railways',
    'Industrial Corridors',
    'Irrigation',
    'Renewable Energy',
    'Urban Development'
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Official Spatial Map Banner */}
      <div className="p-3 rounded-[4px] bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 flex items-center justify-between flex-wrap gap-2 shadow-xs transition-colors">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-[3px] bg-[#0B2E59] text-white uppercase tracking-wider">
            STRATEGIC CORRIDORS
          </span>
          <span className="text-xs font-bold text-[#14213D] dark:text-[#F0F4FF]">
            National Infrastructure Spatial Alignment Map &bull; Linear Corridors &amp; Macro-Bottlenecks
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#5A6A80] dark:text-slate-400 font-mono">
            Domain: National Project Planning
          </span>
          <Link
            href="/landowner-gis"
            className="text-xs font-bold text-[#0B2E59] dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>Switch to Land Parcel Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Header & Sector Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#14213D] dark:text-[#F0F4FF] m-0 font-display">
            Project Spatial Map
          </h1>
          <p className="text-xs text-[#5A6A80] dark:text-slate-400 mt-1">
            Visualizing macro infrastructure centerlines, planned RoW acquisitions, and projected cadastral pinch-points
          </p>
        </div>

        {/* Sector Filter Chips */}
        <div className="flex flex-wrap gap-1.5">
          {sectors.map(sec => {
            const isSelected = selectedSector === sec;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => setSelectedSector(sec)}
                className={`text-xs font-mono px-3 py-1 rounded-[3px] border transition-all cursor-pointer font-bold ${
                  isSelected
                    ? "bg-[#0B2E59] text-white border-[#0B2E59] shadow-xs"
                    : "bg-white dark:bg-[#0D121F] text-[#5A6A80] dark:text-slate-300 border-[#DCE2E8] dark:border-white/10 hover:border-[#CBD5E1]"
                }`}
              >
                {sec}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column GIS Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 items-start">
        
        {/* Left Side: Corridor Explorer & Inspector */}
        <div className="flex flex-col gap-3.5">
          
          {/* Corridor Cards List */}
          <div className="rounded-[4px] border border-[#DCE2E8] dark:border-white/10 bg-white dark:bg-[#0D121F] p-3 shadow-xs max-h-[280px] overflow-y-auto space-y-2">
            <div className="text-[10px] font-bold text-[#5A6A80] dark:text-slate-400 uppercase font-mono tracking-wider mb-2">
              National Corridors ({filteredProjects.length})
            </div>
            <div className="flex flex-col gap-2">
              {filteredProjects.map(p => {
                const isSelected = selectedProject?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProject(p)}
                    className={`p-2.5 rounded-[3px] border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#F0F4F9] dark:bg-sky-950/30 border-[#0B2E59] dark:border-sky-600 shadow-xs"
                        : "bg-[#F8FAFC] dark:bg-[#07080F] border-[#DCE2E8] dark:border-white/10 hover:border-[#CBD5E1]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-[#0B2E59] dark:text-sky-400">
                        {p.code}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-[3px] border ${
                        p.status === 'DELAYED'
                          ? 'bg-[#FFF8E1] text-[#B36B00] border-[#FFE082] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                          : p.status === 'CRITICAL_BLOCKER'
                          ? 'bg-[#FFEBEE] text-[#B32424] border-[#FFCDD2] dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                          : 'bg-[#E8F5E9] text-[#1E7E34] border-[#C8E6C9] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      }`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[#14213D] dark:text-white leading-snug">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-1">
                      {p.state} &middot; <span className="font-semibold text-[#1E7E34] dark:text-emerald-400">{p.acquisition_progress_pct}%</span> Acquired
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Selected Corridor Inspector */}
          {selectedProject && (
            <div className="rounded-[4px] border border-[#DCE2E8] dark:border-white/10 bg-white dark:bg-[#0D121F] p-4 shadow-xs flex flex-col gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] bg-[#E6F0FA] dark:bg-sky-950/40 text-[#0B2E59] dark:text-sky-300 border border-[#B8D5ED] dark:border-sky-800/40 uppercase">
                  {selectedProject.sector}
                </span>
                <h3 className="text-sm font-bold text-[#14213D] dark:text-white mt-1.5 mb-0.5">
                  {selectedProject.name}
                </h3>
                <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 font-mono">
                  Nodal: {selectedProject.department}
                </div>
              </div>

              {/* Progress & Corridor Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-[3px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10">
                  <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 font-semibold">Planned Acquisition</div>
                  <div className="text-sm font-bold text-[#0B2E59] dark:text-sky-400 font-mono mt-0.5">
                    {selectedProject.planned_acquisition_ha} Ha
                  </div>
                </div>
                <div className="p-2.5 rounded-[3px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10">
                  <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 font-semibold">Corridor Length</div>
                  <div className="text-sm font-bold text-[#14213D] dark:text-white font-mono mt-0.5">
                    {selectedProject.total_length_km || '—'} km
                  </div>
                </div>
              </div>

              {/* Macro Bottlenecks Alert */}
              <div className={`p-2.5 rounded-[3px] border flex items-center gap-2.5 ${
                selectedProject.statistics.unresolved_bottlenecks > 0
                  ? 'bg-[#FFF8E1] dark:bg-amber-950/30 border-[#FFE082] dark:border-amber-800/40 text-[#B36B00] dark:text-amber-300'
                  : 'bg-[#E8F5E9] dark:bg-emerald-950/30 border-[#C8E6C9] dark:border-emerald-800/40 text-[#1E7E34] dark:text-emerald-300'
              }`}>
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${
                  selectedProject.statistics.unresolved_bottlenecks > 0 ? 'text-[#B36B00] dark:text-amber-400' : 'text-[#1E7E34] dark:text-emerald-400'
                }`} />
                <div>
                  <div className="text-xs font-bold">
                    {selectedProject.statistics.unresolved_bottlenecks} Projected Alignment Bottlenecks
                  </div>
                  <div className="text-[11px] opacity-85">
                    {selectedProject.statistics.contiguous_clusters} contiguous dispute clusters identified
                  </div>
                </div>
              </div>

              {/* Statutory Milestones */}
              <div>
                <div className="text-[10px] font-bold text-[#5A6A80] dark:text-slate-400 uppercase font-mono tracking-wider mb-1.5">
                  Statutory RoW Milestones
                </div>
                <div className="flex flex-col gap-1.5">
                  {selectedProject.milestones.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-0.5 border-b border-[#DCE2E8]/60 dark:border-white/5 last:border-0">
                      <span className="text-[#14213D] dark:text-slate-300">{m.name}</span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-[3px] border ${
                        m.status === 'COMPLETED'
                          ? 'bg-[#E8F5E9] text-[#1E7E34] border-[#C8E6C9] dark:bg-emerald-950/40 dark:text-emerald-300'
                          : m.status === 'IN_PROGRESS'
                          ? 'bg-[#E6F0FA] text-[#0B2E59] border-[#B8D5ED] dark:bg-sky-950/40 dark:text-sky-300'
                          : 'bg-[#F1F4F7] text-[#5A6A80] border-[#CBD5E1] dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[#DCE2E8] dark:border-white/10">
                <Link
                  href={`/projects/${selectedProject.id}`}
                  className="text-xs font-bold text-[#0B2E59] dark:text-sky-400 hover:underline flex items-center gap-1.5"
                >
                  <span>View Project Dossier &amp; Intelligence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Large Interactive Map Canvas */}
        <div className="h-[580px] rounded-[4px] overflow-hidden border border-[#DCE2E8] dark:border-white/10 relative bg-[#EBF0F5] dark:bg-[#07080F] shadow-xs">
          {/* Top Floating Badge */}
          <div className="absolute top-3 left-3 z-10 bg-white/95 dark:bg-[#0D121F]/95 backdrop-blur-xs border border-[#DCE2E8] dark:border-white/10 px-3 py-1.5 rounded-[4px] flex items-center gap-2 text-xs font-bold text-[#14213D] dark:text-white shadow-xs">
            <Navigation className="w-3.5 h-3.5 text-[#0B2E59] dark:text-sky-400" />
            <span>National Infrastructure Alignment Corridors</span>
            <span className="text-[#5A6A80] dark:text-slate-500">|</span>
            <span className="font-mono text-[#0B2E59] dark:text-sky-400 text-[10px]">
              Active Alignments
            </span>
          </div>

          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            mapStyle={mapStyle}
          >
            <NavigationControl position="top-right" />

            {/* LineString Layer for Corridor Paths */}
            {corridorGeojson.features.length > 0 && (
              <Source id="corridors-source" type="geojson" data={corridorGeojson}>
                <Layer
                  id="corridors-casing"
                  type="line"
                  paint={{
                    'line-color': '#0B2E59',
                    'line-width': 5,
                    'line-opacity': 0.3
                  }}
                />
                <Layer
                  id="corridors-line"
                  type="line"
                  paint={{
                    'line-color': '#0B2E59',
                    'line-width': 3,
                    'line-dasharray': [2, 1]
                  }}
                />
              </Source>
            )}

            {/* Centroid Markers */}
            {filteredProjects.map(p => {
              const isSelected = selectedProject?.id === p.id;
              return (
                <Marker
                  key={p.id}
                  longitude={p.centroid.coordinates[0]}
                  latitude={p.centroid.coordinates[1]}
                  anchor="bottom"
                  onClick={e => {
                    e.originalEvent.stopPropagation();
                    handleSelectProject(p);
                  }}
                >
                  <div
                    className="cursor-pointer flex flex-col items-center relative"
                    onMouseEnter={() => setHoveredProject(p)}
                    onMouseLeave={() => setHoveredProject(null)}
                  >
                    <div className={`p-1.5 rounded-full text-white transition-transform ${
                      isSelected 
                        ? 'bg-[#FF9933] shadow-md ring-2 ring-white scale-110' 
                        : 'bg-[#0B2E59] shadow-xs'
                    }`}>
                      <Building2 className="w-3.5 h-3.5" />
                    </div>

                    <div className="mt-1 px-1.5 py-0.5 rounded-[3px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 text-[#14213D] dark:text-white text-[9px] font-bold font-mono whitespace-nowrap shadow-xs">
                      {p.code}
                    </div>
                  </div>
                </Marker>
              );
            })}
          </Map>

          {/* Bottom Right Map Legend */}
          <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-[#0D121F]/95 backdrop-blur-xs border border-[#DCE2E8] dark:border-white/10 p-3 rounded-[4px] text-[10px] text-[#5A6A80] dark:text-slate-300 flex flex-col gap-1.5 shadow-xs">
            <div className="font-bold text-[#14213D] dark:text-white uppercase font-mono tracking-wider">
              Project GIS Legend
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-[#0B2E59] rounded-[1px]" />
              <span>Corridor Right-of-Way Alignment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0B2E59]" />
              <span>Project Nodal Headquarters</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF9933]" />
              <span>Selected Project Focus</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
