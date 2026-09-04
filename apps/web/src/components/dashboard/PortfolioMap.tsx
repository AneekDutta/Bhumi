"use client";

import React from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRouter } from 'next/navigation';

export function PortfolioMap({ projects }: { projects: any[] }) {
  const router = useRouter();

  // Find center of all projects, fallback to India center
  const validProjects = projects.filter(p => p.centroid && p.centroid.coordinates);

  let longitude = 78.9629;
  let latitude = 20.5937;
  let zoom = 4;

  if (validProjects.length > 0) {
    const sumLng = validProjects.reduce((sum, p) => sum + p.centroid.coordinates[0], 0);
    const sumLat = validProjects.reduce((sum, p) => sum + p.centroid.coordinates[1], 0);
    longitude = sumLng / validProjects.length;
    latitude = sumLat / validProjects.length;
    zoom = 5.5;
  }

  const mapKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (!mapKey) {
    return (
      <div className="h-[320px] sm:h-[400px] w-full bg-slate-50 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-6 text-center">
        <svg className="w-10 h-10 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <h3 className="text-sm font-semibold text-slate-900">Map Configuration Missing</h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-md">
          Provide a valid NEXT_PUBLIC_MAPTILER_KEY environment variable to render the portfolio map.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[320px] sm:h-[420px] w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-sm relative">
      <Map
        initialViewState={{
          longitude,
          latitude,
          zoom
        }}
        mapStyle={`https://api.maptiler.com/maps/basic-v2/style.json?key=${mapKey}`}
      >
        <NavigationControl position="top-right" />

        {validProjects.map((p) => {
          const hasDelay = p.project_delay_days > 0;
          return (
            <Marker
              key={p.project_id}
              longitude={p.centroid.coordinates[0]}
              latitude={p.centroid.coordinates[1]}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                router.push(`/projects/${p.project_id}/spatial`);
              }}
            >
              <div
                className="group relative cursor-pointer flex flex-col items-center focus:outline-none"
                tabIndex={0}
                role="button"
                aria-label={`View spatial map for ${p.name}. Delay: ${p.project_delay_days} days.`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    router.push(`/projects/${p.project_id}/spatial`);
                  }
                }}
              >
                <div className={`w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                  hasDelay ? 'bg-red-600' : 'bg-emerald-600'
                }`} />

                <div className="absolute bottom-full mb-2 hidden group-hover:flex group-focus:flex flex-col w-max bg-slate-900 text-white px-3 py-2 rounded shadow-md text-xs pointer-events-none z-50">
                  <div className="font-semibold text-white">{p.name}</div>
                  <div className="text-slate-300">Delay: {p.project_delay_days}d | Clusters: {p.spatial_cluster_count}</div>
                  <div className="text-indigo-300 text-[11px] font-medium mt-0.5">Click to view spatial detail →</div>
                </div>
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
