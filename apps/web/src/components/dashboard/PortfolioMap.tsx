"use client";

import React, { useState, useMemo } from 'react';
import Map, { Marker, NavigationControl, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, ArrowRight, Layers, ShieldCheck, Sparkles, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export interface PortfolioMapProps {
  projects?: any[];
  verifiedParcels?: any[];
  selectedParcelId?: string | null;
  onSelectParcel?: (parcel: any) => void;
}

export function PortfolioMap({ 
  projects = [], 
  verifiedParcels = [], 
  selectedParcelId,
  onSelectParcel 
}: PortfolioMapProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const [hoveredItem, setHoveredItem] = useState<any | null>(null);

  // Normalize verified parcels into map items with centroids and GeoJSON boundaries
  const parsedParcels = useMemo(() => {
    return (verifiedParcels || []).map((c) => {
      const pId = c.parcel_id || c.id || "CADASTRAL-PARCEL";
      let coords: [number, number][] = [];
      let centroid: [number, number] = [75.9284, 24.6492];

      // 1. Check GeoJSON polygon
      if (c.landowner_reported_boundary?.coordinates?.[0]) {
        coords = c.landowner_reported_boundary.coordinates[0];
      } else if (c.boundary?.coordinates?.[0]) {
        coords = c.boundary.coordinates[0];
      } else if (Array.isArray(c.coordinates) && c.coordinates.length >= 3) {
        coords = c.coordinates.map((pt: any) => [pt.lng ?? pt[0], pt.lat ?? pt[1]]);
        if (coords[0] && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
          coords.push([...coords[0]]);
        }
      }

      if (coords.length > 0) {
        const sumLng = coords.reduce((acc, pt) => acc + pt[0], 0);
        const sumLat = coords.reduce((acc, pt) => acc + pt[1], 0);
        centroid = [sumLng / coords.length, sumLat / coords.length];
      } else if (c.landowner_reported_location?.lng && c.landowner_reported_location?.lat) {
        centroid = [c.landowner_reported_location.lng, c.landowner_reported_location.lat];
        // Create small bounding box polygon around GPS point if no full polygon
        const d = 0.0005;
        coords = [
          [centroid[0] - d, centroid[1] - d],
          [centroid[0] + d, centroid[1] - d],
          [centroid[0] + d, centroid[1] + d],
          [centroid[0] - d, centroid[1] + d],
          [centroid[0] - d, centroid[1] - d],
        ];
      }

      return {
        ...c,
        map_id: c.id || pId,
        parcel_id: pId,
        centroid,
        polygonCoordinates: coords,
        area_acres: c.landowner_declared_area?.acres || (c.area_sqm ? (c.area_sqm / 4046.86).toFixed(3) : 0),
        area_sqm: c.landowner_declared_area?.sqm || c.area_sqm || 0,
        owner_name: c.owner_name || "Landowner",
        status: c.status || "Verified by Field Officer"
      };
    });
  }, [verifiedParcels]);

  // Build GeoJSON FeatureCollection from real parsed parcels
  const geojson = useMemo(() => {
    const features = parsedParcels
      .filter((p) => p.polygonCoordinates && p.polygonCoordinates.length >= 4)
      .map((p) => ({
        type: "Feature" as const,
        id: p.map_id,
        properties: {
          id: p.map_id,
          parcel_id: p.parcel_id,
          status: p.status,
          owner_name: p.owner_name,
          isSelected: selectedParcelId === p.map_id || selectedParcelId === p.parcel_id
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [p.polygonCoordinates]
        }
      }));

    return {
      type: "FeatureCollection" as const,
      features
    };
  }, [parsedParcels, selectedParcelId]);

  // Center map on verified parcels if available, otherwise default to sector coordinates
  let longitude = 75.9284;
  let latitude = 24.6492;
  let zoom = 5.2;

  if (parsedParcels.length > 0) {
    const sumLng = parsedParcels.reduce((sum, p) => sum + p.centroid[0], 0);
    const sumLat = parsedParcels.reduce((sum, p) => sum + p.centroid[1], 0);
    longitude = sumLng / parsedParcels.length;
    latitude = sumLat / parsedParcels.length;
    zoom = parsedParcels.length > 1 ? 13.5 : 15.2;
  }

  const mapKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  const mapStyle = mapKey 
    ? `https://api.maptiler.com/maps/hybrid/style.json?key=${mapKey}` 
    : isLight
      ? 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
      : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

  const hasItems = parsedParcels.length > 0;

  return (
    <div className="h-[380px] sm:h-[460px] w-full bg-[#F4F6F8] dark:bg-[#07080F] rounded-[4px] overflow-hidden border border-[#DCE2E8] dark:border-white/10 shadow-xs relative group transition-colors">
      {/* Top Map Status Bar */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 dark:bg-[#07080F]/95 backdrop-blur-md border border-[#DCE2E8] dark:border-white/10 text-slate-800 dark:text-white px-3 py-1.5 rounded-[3px] shadow-xs flex items-center gap-2 text-xs transition-colors">
        <Navigation className="w-3.5 h-3.5 text-[#0B2E59] dark:text-sky-400" />
        <span className="font-bold text-[11px] uppercase tracking-wider text-[#0B2E59] dark:text-slate-200">National Cadastral Spatial GIS</span>
        <span className="text-[#DCE2E8] dark:text-slate-700">|</span>
        <span className={`font-mono font-bold ${hasItems ? 'text-[#0B2E59] dark:text-sky-400' : 'text-slate-500'}`}>
          {parsedParcels.length} Verified Cadastral Parcel{parsedParcels.length === 1 ? '' : 's'}
        </span>
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

        {/* Real GeoJSON Polygon Layer for Verified Cadastral Parcels */}
        {hasItems && geojson.features.length > 0 && (
          <Source id="verified-parcels-source" type="geojson" data={geojson}>
            <Layer 
              id="verified-parcels-fill"
              type="fill"
              paint={{
                'fill-color': '#0B2E59',
                'fill-opacity': 0.25
              }}
            />
            <Layer 
              id="verified-parcels-line"
              type="line"
              paint={{
                'line-color': '#0B2E59',
                'line-width': 2
              }}
            />
          </Source>
        )}

        {/* Markers at Centroid of each verified parcel */}
        {parsedParcels.map((p) => {
          const isSelected = selectedParcelId === p.map_id || selectedParcelId === p.parcel_id;
          const isCompleted = p.status === "Implementation Completed" || p.status === "RESOLVED";
          const isInitiated = p.status === "Implementation Initiated";

          return (
            <Marker
              key={p.map_id}
              longitude={p.centroid[0]}
              latitude={p.centroid[1]}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                if (onSelectParcel) {
                  onSelectParcel(p);
                }
              }}
            >
              <div
                className="group/marker relative cursor-pointer flex flex-col items-center focus:outline-none"
                tabIndex={0}
                role="button"
                onMouseEnter={() => setHoveredItem(p)}
                onMouseLeave={() => setHoveredItem(null)}
                aria-label={`Verified parcel ${p.parcel_id}`}
              >
                {/* Animated Pin */}
                <div className={`relative flex items-center justify-center p-1.5 rounded-full shadow-md transition-transform group-hover/marker:scale-125 ${
                  isSelected 
                    ? 'bg-[#B36B00] text-white ring-2 ring-[#B36B00]/40' 
                    : isCompleted
                      ? 'bg-[#1E7E34] text-white'
                      : isInitiated
                        ? 'bg-[#0B2E59] text-white'
                        : 'bg-[#0B2E59] text-white'
                }`}>
                  <MapPin className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#0B2E59] dark:bg-sky-400 rounded-full animate-ping" />
                </div>

                {/* Parcel Tag Pill */}
                <div className="mt-1 px-2 py-0.5 rounded-[2px] bg-[#0B2E59] text-white border border-[#0B2E59]/40 text-[10px] font-mono font-bold whitespace-nowrap shadow-xs">
                  #{p.parcel_id.slice(-6)} &middot; {p.owner_name}
                </div>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-3 hidden group-hover/marker:flex flex-col w-64 bg-white/95 dark:bg-[#0D121F]/95 backdrop-blur-md text-slate-800 dark:text-white p-3 rounded-[4px] border border-[#DCE2E8] dark:border-white/10 shadow-lg pointer-events-none z-50 text-xs">
                  <div className="font-bold text-sm text-[#0B2E59] dark:text-white mb-1 flex items-center justify-between">
                    <span>Parcel #{p.parcel_id}</span>
                    <span className="text-[10px] text-[#1E7E34] dark:text-emerald-400 font-mono font-bold bg-[#E8F5E9] dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-[2px] border border-[#C8E6C9] dark:border-emerald-800/40">VERIFIED</span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Owner: <strong className="text-slate-900 dark:text-white">{p.owner_name}</strong>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 py-1.5 border-y border-[#DCE2E8] dark:border-white/10 my-1">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Cadastral Area</span>
                      <span className="font-mono font-bold text-[#1E7E34] dark:text-emerald-400">{p.area_acres} Acres</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Status</span>
                      <span className="font-mono font-bold text-[#B36B00] dark:text-amber-400 text-[10px] truncate block">{p.status}</span>
                    </div>
                  </div>
                  <div className="text-[#0B2E59] dark:text-sky-300 text-[11px] font-semibold flex items-center gap-1 mt-1">
                    <span>Click to inspect case &amp; run What-If simulation</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </Marker>
          );
        })}
      </Map>

      {/* Empty State Overlay when 0 verified parcels */}
      {!hasItems && (
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-950/20 backdrop-blur-[2px] pointer-events-none z-20">
          <div className="max-w-md p-5 rounded-[4px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 text-center shadow-lg space-y-2 pointer-events-auto">
            <div className="w-10 h-10 rounded-[4px] bg-[#E6F0FA] dark:bg-sky-950/40 border border-[#B8D5ED] dark:border-sky-800/40 text-[#0B2E59] dark:text-sky-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-[#0B2E59] dark:text-white">No Verified Parcels in GIS Scope</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Complaints verified by Field Officers on the ground will appear here with exact GPS boundary demarcations and interactive What-If simulation.
            </p>
          </div>
        </div>
      )}

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-[#07080F]/95 backdrop-blur-md border border-[#DCE2E8] dark:border-white/10 p-3 rounded-[3px] shadow-xs text-[11px] space-y-1.5 z-10 text-slate-700 dark:text-slate-300 font-medium">
        <div className="font-bold text-[#0B2E59] dark:text-white uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-1.5">
          <Layers className="w-3 h-3 text-[#0B2E59] dark:text-sky-400" />
          <span>Cadastral GIS Legend</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-[2px] bg-[#0B2E59]/20 border border-[#0B2E59]" />
          <span>Verified Cadastral Boundary (Polygon)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#0B2E59] shadow-xs" />
          <span>Verified by Field Officer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sky-600 shadow-xs" />
          <span>Implementation Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#1E7E34] shadow-xs" />
          <span>Implementation Completed</span>
        </div>
      </div>
    </div>
  );
}
