"use client";

import React, { useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, ArrowRight, Layers } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export function PortfolioMap({ projects }: { projects: any[] }) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const [hoveredProject, setHoveredProject] = useState<any | null>(null);

  // Filter valid projects with centroids
  const validProjects = (projects || []).filter(p => p && p.centroid && Array.isArray(p.centroid.coordinates));

  let longitude = 78.9629;
  let latitude = 20.5937;
  let zoom = 4.2;

  if (validProjects.length > 0) {
    const sumLng = validProjects.reduce((sum, p) => sum + p.centroid.coordinates[0], 0);
    const sumLat = validProjects.reduce((sum, p) => sum + p.centroid.coordinates[1], 0);
    longitude = sumLng / validProjects.length;
    latitude = sumLat / validProjects.length;
    zoom = validProjects.length > 1 ? 4.8 : 8.5;
  }

  const mapKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  // Aerial imagery is the default operational view; retain a dependable
  // standard-map fallback when a MapTiler key is not configured.
  const mapStyle = mapKey
    ? `https://api.maptiler.com/maps/hybrid/style.json?key=${mapKey}`
    : {
        version: 8 as 8,
        sources: {
          imagery: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: 'Esri, Maxar, Earthstar Geographics',
          },
        },
        layers: [{ id: 'imagery', type: 'raster', source: 'imagery' }],
      };

  return (
    <div className="h-[380px] sm:h-[460px] w-full bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200/90 dark:border-white/10 shadow-gov relative group transition-colors">
      {/* Top Map Status Bar */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 dark:bg-slate-950/85 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2 text-xs transition-colors">
        <Navigation className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
        <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">National Corridor GIS</span>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{validProjects.length} Active Alignment{validProjects.length === 1 ? '' : 's'}</span>
      </div>

      <Map
        initialViewState={{
          longitude,
          latitude,
          zoom
        }}
        mapStyle={mapStyle as any}
      >
        <NavigationControl position="top-right" />

        {validProjects.map((p) => {
          const hasDelay = (p.project_delay_days || 0) > 0;
          const isCPBlocked = Boolean(p.critical_path_blocked);
          const pId = p.project_id || p.id;

          return (
            <Marker
              key={pId}
              longitude={p.centroid.coordinates[0]}
              latitude={p.centroid.coordinates[1]}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                router.push(`/projects/${pId}/spatial`);
              }}
            >
              <div
                className="group/marker relative cursor-pointer flex flex-col items-center focus:outline-none"
                tabIndex={0}
                role="button"
                onMouseEnter={() => setHoveredProject(p)}
                onMouseLeave={() => setHoveredProject(null)}
                aria-label={`View spatial map for ${p.name}. Delay: ${p.project_delay_days || 0} days.`}
              >
                {/* Animated Ring */}
                <div className={`relative flex items-center justify-center p-1.5 rounded-full shadow-lg transition-transform group-hover/marker:scale-125 ${
                  hasDelay ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  <MapPin className="w-4 h-4" />
                  {isCPBlocked && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
                  )}
                </div>

                {/* Project Tag Pill */}
                <div className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-950/90 text-white border border-slate-700 text-[10px] font-semibold whitespace-nowrap shadow-sm">
                  {p.name.length > 24 ? `${p.name.substring(0, 22)}...` : p.name}
                </div>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-3 hidden group-hover/marker:flex flex-col w-64 bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-xl border border-slate-700 shadow-2xl pointer-events-none z-50 text-xs">
                  <div className="font-bold text-sm text-white mb-1">{p.name}</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 py-1.5 border-y border-slate-800 my-1">
                    <div>
                      <span className="text-slate-500 block">Schedule Overrun</span>
                      <span className={`font-mono font-bold ${hasDelay ? 'text-red-400' : 'text-emerald-400'}`}>
                        {hasDelay ? `+${p.project_delay_days}d Delay` : 'On Schedule'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Spatial Clusters</span>
                      <span className="font-mono font-bold text-amber-400">{p.spatial_cluster_count || 0} Bottlenecks</span>
                    </div>
                  </div>
                  <div className="text-indigo-300 text-[11px] font-semibold flex items-center gap-1 mt-1">
                    <span>Click to inspect corridor GIS</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </Marker>
          );
        })}
      </Map>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md border border-slate-200/90 p-3 rounded-xl shadow-gov text-[11px] space-y-1.5 z-10 text-slate-700 font-medium">
        <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-1.5">
          <Layers className="w-3 h-3 text-indigo-600" />
          <span>Alignment Legend</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-600 shadow-sm" />
          <span>Critical Path Delayed (+Days)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-600 shadow-sm" />
          <span>On Schedule / Buffer Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
          <span>Active Contiguous Cluster</span>
        </div>
      </div>
    </div>
  );
}
