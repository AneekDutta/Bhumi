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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Official Spatial Map Banner */}
      <div style={{
        padding: '10px 16px',
        borderRadius: 10,
        background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.25)',
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
            background: '#6366f1',
            color: '#fff',
            textTransform: 'uppercase'
          }}>
            STRATEGIC CORRIDORS
          </span>
          <span style={{ fontSize: 12, color: '#c7d2fe', fontWeight: 600 }}>
            National Infrastructure Spatial Alignment Map &bull; Linear Corridors &amp; Macro-Bottlenecks
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
            Domain: National Project Planning
          </span>
          <Link
            href="/landowner-gis"
            style={{
              fontSize: 11,
              color: '#38bdf8',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontWeight: 600
            }}
          >
            <span>Switch to Land Parcel Map</span>
            <ArrowRight style={{ width: 12, height: 12 }} />
          </Link>
        </div>
      </div>

      {/* Header & Sector Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
            Project Spatial Map
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Visualizing macro infrastructure centerlines, planned RoW acquisitions, and projected cadastral pinch-points
          </p>
        </div>

        {/* Sector Filter Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {sectors.map(sec => {
            const isSelected = selectedSector === sec;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => setSelectedSector(sec)}
                style={{
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono, monospace',
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                  background: isSelected ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.02)',
                  color: isSelected ? '#a5b4fc' : '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 500,
                  transition: 'all 0.15s ease'
                }}
              >
                {sec}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column GIS Interface */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: 18, alignItems: 'start' }}>
        
        {/* Left Side: Corridor Explorer & Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* Corridor Cards List */}
          <div style={{
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(15,23,42,0.6)',
            padding: 14,
            maxHeight: 280,
            overflowY: 'auto'
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', marginBottom: 10 }}>
              National Corridors ({filteredProjects.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredProjects.map(p => {
                const isSelected = selectedProject?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProject(p)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.06)',
                      background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#818cf8', fontWeight: 700 }}>
                        {p.code}
                      </span>
                      <span style={{
                        fontSize: 9,
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: p.status === 'DELAYED' ? 'rgba(245,158,11,0.2)' : p.status === 'CRITICAL_BLOCKER' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                        color: p.status === 'DELAYED' ? '#f59e0b' : p.status === 'CRITICAL_BLOCKER' ? '#ef4444' : '#10b981'
                      }}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2 }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                      {p.state} &middot; {p.acquisition_progress_pct}% Acquired
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Selected Corridor Inspector */}
          {selectedProject && (
            <div style={{
              borderRadius: 12,
              border: '1px solid rgba(99,102,241,0.3)',
              background: 'rgba(99,102,241,0.04)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div>
                <span style={{
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(99,102,241,0.2)',
                  color: '#a5b4fc',
                  textTransform: 'uppercase'
                }}>
                  {selectedProject.sector}
                </span>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0', margin: '6px 0 2px' }}>
                  {selectedProject.name}
                </h3>
                <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                  Nodal: {selectedProject.department}
                </div>
              </div>

              {/* Progress & Corridor Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: 10, color: '#64748b' }}>Planned Acquisition</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>
                    {selectedProject.planned_acquisition_ha} Ha
                  </div>
                </div>
                <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: 10, color: '#64748b' }}>Corridor Length</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#818cf8', fontFamily: 'JetBrains Mono, monospace' }}>
                    {selectedProject.total_length_km || '—'} km
                  </div>
                </div>
              </div>

              {/* Macro Bottlenecks Alert */}
              <div style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: selectedProject.statistics.unresolved_bottlenecks > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                border: selectedProject.statistics.unresolved_bottlenecks > 0 ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(16,185,129,0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <AlertTriangle style={{ width: 16, height: 16, color: selectedProject.statistics.unresolved_bottlenecks > 0 ? '#f59e0b' : '#10b981', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: selectedProject.statistics.unresolved_bottlenecks > 0 ? '#fcd34d' : '#6ee7b7' }}>
                    {selectedProject.statistics.unresolved_bottlenecks} Projected Alignment Bottlenecks
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>
                    {selectedProject.statistics.contiguous_clusters} contiguous land dispute clusters identified
                  </div>
                </div>
              </div>

              {/* Statutory Milestones */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', marginBottom: 6 }}>
                  Statutory RoW Milestones
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedProject.milestones.map((m, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: '#cbd5e1' }}>{m.name}</span>
                      <span style={{
                        fontSize: 9,
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 3,
                        background: m.status === 'COMPLETED' ? 'rgba(16,185,129,0.2)' : m.status === 'IN_PROGRESS' ? 'rgba(56,189,248,0.2)' : 'rgba(100,116,139,0.2)',
                        color: m.status === 'COMPLETED' ? '#34d399' : m.status === 'IN_PROGRESS' ? '#38bdf8' : '#94a3b8'
                      }}>
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Link
                  href="/projects"
                  style={{
                    fontSize: 11,
                    color: '#818cf8',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 600
                  }}
                >
                  <span>View All Project Specifications in Directory</span>
                  <ArrowRight style={{ width: 12, height: 12 }} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Large Interactive Map Canvas */}
        <div style={{
          height: 560,
          borderRadius: 14,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
          background: '#0f172a'
        }}>
          {/* Top Floating Badge */}
          <div style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 10,
            background: 'rgba(15,23,42,0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '6px 12px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#e2e8f0',
            fontSize: 11,
            fontWeight: 600
          }}>
            <Navigation style={{ width: 14, height: 14, color: '#818cf8' }} />
            <span>National Infrastructure Alignment Corridors</span>
            <span style={{ color: '#64748b' }}>|</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#818cf8', fontSize: 10 }}>
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
                    'line-color': '#000',
                    'line-width': 5,
                    'line-opacity': 0.4
                  }}
                />
                <Layer
                  id="corridors-line"
                  type="line"
                  paint={{
                    'line-color': '#6366f1',
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
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative'
                    }}
                    onMouseEnter={() => setHoveredProject(p)}
                    onMouseLeave={() => setHoveredProject(null)}
                  >
                    <div style={{
                      padding: 6,
                      borderRadius: '50%',
                      background: isSelected ? '#f59e0b' : '#6366f1',
                      color: '#fff',
                      boxShadow: isSelected ? '0 0 16px rgba(245,158,11,0.6)' : '0 0 10px rgba(99,102,241,0.5)',
                      transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                      transition: 'transform 0.15s ease'
                    }}>
                      <Building2 style={{ width: 14, height: 14 }} />
                    </div>

                    <div style={{
                      marginTop: 3,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(15,23,42,0.9)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: 700,
                      fontFamily: 'JetBrains Mono, monospace',
                      whiteSpace: 'nowrap'
                    }}>
                      {p.code}
                    </div>
                  </div>
                </Marker>
              );
            })}
          </Map>

          {/* Bottom Right Map Legend */}
          <div style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            background: 'rgba(15,23,42,0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 10,
            color: '#94a3b8',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <div style={{ fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
              Project GIS Legend
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 16, height: 3, background: '#6366f1', borderRadius: 2 }} />
              <span>Corridor Right-of-Way Alignment</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />
              <span>Project Nodal Headquarters</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
              <span>Selected Project Focus</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
