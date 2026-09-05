"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Map, { Source, Layer, NavigationControl, Marker, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { 
  MapPin, 
  Navigation, 
  Crosshair, 
  AlertTriangle, 
  ShieldCheck, 
  Layers, 
  Sparkles, 
  RefreshCw,
  Locate,
  CheckCircle2,
  Maximize2
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const DARK_MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const LIGHT_MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export interface FieldSpatialMapProps {
  geojson: any;
  incidents?: any[];
  selectedParcelId?: string | null;
  onParcelSelect?: (parcelProps: any) => void;
  onIncidentSelect?: (incident: any) => void;
  locationPicker?: boolean;
  pickedLocation?: { lat: number; lng: number } | null;
  onLocationPick?: (loc: { lat: number; lng: number }) => void;
  height?: string | number;
  initialCenter?: [number, number];
  initialZoom?: number;
  showControls?: boolean;
  interactive?: boolean;
}

export function computeGeoJSONBounds(geojson: any): [[number, number], [number, number]] | null {
  if (!geojson || !geojson.features || geojson.features.length === 0) return null;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  function processCoords(coords: any) {
    if (Array.isArray(coords) && typeof coords[0] === "number" && typeof coords[1] === "number") {
      const lng = coords[0];
      const lat = coords[1];
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    } else if (Array.isArray(coords)) {
      for (const item of coords) {
        processCoords(item);
      }
    }
  }

  for (const feature of geojson.features) {
    if (feature.geometry && feature.geometry.coordinates) {
      processCoords(feature.geometry.coordinates);
    }
  }

  if (minLng === Infinity || minLat === Infinity) return null;
  return [[minLng, minLat], [maxLng, maxLat]];
}

export function FieldSpatialMap({
  geojson,
  incidents = [],
  selectedParcelId,
  onParcelSelect,
  onIncidentSelect,
  locationPicker = false,
  pickedLocation,
  onLocationPick,
  height = "100%",
  initialCenter,
  initialZoom = 13.5,
  showControls = true,
  interactive = true
}: FieldSpatialMapProps) {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const mapRef = useRef<MapRef | null>(null);

  const [mapMode, setMapMode] = useState<"STATUS" | "RISK" | "CRITICAL">("STATUS");
  const [officerGPS, setOfficerGPS] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Default initial center: corridor benchmark [75.95, 24.66]
  const defaultCenter: [number, number] = useMemo(() => {
    if (initialCenter) return initialCenter;
    if (geojson?.properties?.center) return geojson.properties.center;
    if (geojson?.features?.[0]?.geometry?.coordinates) {
      const bounds = computeGeoJSONBounds(geojson);
      if (bounds) {
        return [
          (bounds[0][0] + bounds[1][0]) / 2,
          (bounds[0][1] + bounds[1][1]) / 2
        ];
      }
    }
    return [75.95, 24.66];
  }, [geojson, initialCenter]);

  // Dynamic parcel layer styles conforming to Admin GIS standard
  const parcelFillLayer: any = useMemo(() => {
    if (mapMode === "STATUS") {
      return {
        id: "field-parcels-fill",
        type: "fill",
        paint: {
          "fill-color": [
            "match",
            ["get", "acquisition_status"],
            "possessed", "#10b981",       // Green (Possession completed)
            "compensated", "#3b82f6",     // Blue (Compensation disbursed)
            "award_declared", "#f59e0b",  // Amber (Award declared)
            "notified", "#8b5cf6",        // Purple (Section 11 Gazette notified)
            "not_started", "#64748b",     // Grey (Pending initial survey)
            "#ef4444"                     // Red (Disputed / Blocked)
          ],
          "fill-opacity": [
            "case",
            ["==", ["get", "parcel_id"], selectedParcelId || ""],
            0.85,
            0.55
          ],
          "fill-outline-color": [
            "case",
            ["==", ["get", "parcel_id"], selectedParcelId || ""],
            "#38bdf8",
            "#ffffff"
          ]
        }
      };
    }

    if (mapMode === "RISK") {
      return {
        id: "field-parcels-fill",
        type: "fill",
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "risk_score"],
            0, "#10b981",
            30, "#f59e0b",
            60, "#f97316",
            80, "#ef4444"
          ],
          "fill-opacity": 0.65,
          "fill-outline-color": "#ffffff"
        }
      };
    }

    // CRITICAL PATH MODE
    return {
      id: "field-parcels-fill",
      type: "fill",
      paint: {
        "fill-color": [
          "case",
          ["get", "is_critical_path"],
          "#ef4444",
          "#334155"
        ],
        "fill-opacity": [
          "case",
          ["get", "is_critical_path"],
          0.85,
          0.2
        ],
        "fill-outline-color": [
          "case",
          ["get", "is_critical_path"],
          "#fca5a5",
          "rgba(255,255,255,0.15)"
        ]
      }
    };
  }, [mapMode, selectedParcelId]);

  const parcelOutlineLayer: any = useMemo(() => ({
    id: "field-parcels-outline",
    type: "line",
    paint: {
      "line-color": [
        "case",
        ["==", ["get", "parcel_id"], selectedParcelId || ""],
        "#38bdf8",
        "#ffffff"
      ],
      "line-width": [
        "case",
        ["==", ["get", "parcel_id"], selectedParcelId || ""],
        3,
        1.2
      ]
    }
  }), [selectedParcelId]);

  // Fit map to relevant geographic area bounds
  const fitToCorridorBounds = useCallback(() => {
    if (!mapRef.current) return;
    const bounds = computeGeoJSONBounds(geojson);
    if (bounds) {
      mapRef.current.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 40, right: 40 },
        maxZoom: 16,
        duration: 900
      });
    }
  }, [geojson]);

  // Fit bounds when geojson changes
  useEffect(() => {
    if (geojson && geojson.features && geojson.features.length > 0) {
      const timer = setTimeout(() => {
        fitToCorridorBounds();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [geojson, fitToCorridorBounds]);

  // If a specific parcel is selected, fly to its bounds or centroid
  useEffect(() => {
    if (selectedParcelId && geojson && mapRef.current) {
      const match = geojson.features?.find(
        (f: any) => f.properties?.parcel_id === selectedParcelId
      );
      if (match && match.geometry) {
        const bounds = computeGeoJSONBounds({ type: "FeatureCollection", features: [match] });
        if (bounds) {
          mapRef.current.fitBounds(bounds, {
            padding: 80,
            maxZoom: 17,
            duration: 800
          });
        }
      }
    }
  }, [selectedParcelId, geojson]);

  // Acquire actual device GPS coordinates ("Use My Location")
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser / device.");
      return;
    }

    setLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        setOfficerGPS({ lat, lng, accuracy });

        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [lng, lat],
            zoom: 16,
            duration: 1000
          });
        }

        if (locationPicker && onLocationPick) {
          onLocationPick({ lat, lng });
        }
      },
      (error) => {
        setLocating(false);
        setGpsError(error.message || "Failed to acquire device GPS position.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleMapClick = (event: any) => {
    if (!interactive) return;

    // If location picking mode is active, update picked position
    if (locationPicker && onLocationPick) {
      const { lng, lat } = event.lngLat;
      onLocationPick({ lat, lng });
      return;
    }

    // Check if clicked a parcel feature
    const feature = event.features && event.features[0];
    if (feature && feature.properties) {
      if (onParcelSelect) {
        onParcelSelect(feature.properties);
      }
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height, minHeight: 320, borderRadius: 16, overflow: "hidden" }} className="bg-slate-950 border border-slate-800 shadow-xl">
      
      {/* Map Control Bar Overlay (Top Left) */}
      {showControls && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-lg text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setMapMode("STATUS")}
            className={`px-2.5 py-1 rounded-lg transition-all font-bold ${
              mapMode === "STATUS"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Status
          </button>
          <button
            type="button"
            onClick={() => setMapMode("RISK")}
            className={`px-2.5 py-1 rounded-lg transition-all font-bold ${
              mapMode === "RISK"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Risk
          </button>
          <button
            type="button"
            onClick={() => setMapMode("CRITICAL")}
            className={`px-2.5 py-1 rounded-lg transition-all font-bold ${
              mapMode === "CRITICAL"
                ? "bg-red-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            CPM
          </button>
        </div>
      )}

      {/* Floating Action Buttons Overlay (Top Right) */}
      {showControls && (
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
          {/* Use My Location Button */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={locating}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-slate-700/80 shadow-lg transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Use My Real GPS Location"
          >
            {locating ? (
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <Locate className="w-4 h-4" />
            )}
            <span className="hidden sm:inline text-[10px] font-mono">My GPS</span>
          </button>

          {/* Fit Corridor Bounds Button */}
          <button
            type="button"
            onClick={fitToCorridorBounds}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-slate-700/80 shadow-lg transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Fit Corridor View"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline text-[10px] font-mono">Fit Bounds</span>
          </button>
        </div>
      )}

      {/* GPS Error Notification if permission denied */}
      {gpsError && (
        <div className="absolute top-16 left-3 right-3 z-20 p-2.5 rounded-xl bg-red-950/90 border border-red-500/50 text-red-200 text-xs flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-[11px] leading-tight">{gpsError}</span>
          </div>
          <button
            onClick={() => setGpsError(null)}
            className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-900 text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MapLibre GL Map Component */}
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: defaultCenter[0],
          latitude: defaultCenter[1],
          zoom: initialZoom,
          pitch: 15,
          bearing: 0
        }}
        mapStyle={isLight ? LIGHT_MAP_STYLE : DARK_MAP_STYLE}
        interactiveLayerIds={locationPicker ? [] : ["field-parcels-fill"]}
        onClick={handleMapClick}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="bottom-right" />

        {/* Parcels GeoJSON Layer */}
        {geojson && (
          <Source id="field-parcels-source" type="geojson" data={geojson}>
            <Layer {...parcelFillLayer} />
            <Layer {...parcelOutlineLayer} />
          </Source>
        )}

        {/* Real Ground Incident Markers */}
        {incidents.map((inc: any) => {
          if (!inc.gps_lat || !inc.gps_lng) return null;
          const isResolved = inc.status === "resolved";

          return (
            <Marker
              key={inc.verification_id}
              longitude={Number(inc.gps_lng)}
              latitude={Number(inc.gps_lat)}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                if (onIncidentSelect) onIncidentSelect(inc);
              }}
            >
              <div className="relative group cursor-pointer">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white transition-transform hover:scale-125 ${
                  isResolved
                    ? "bg-emerald-600"
                    : "bg-red-600 animate-pulse"
                }`}>
                  {isResolved ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                </div>
                {/* Tooltip Label */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[9px] font-mono text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
                  {inc.verification_id} · {(inc.issue_type || "Incident").replace(/_/g, " ")}
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Officer Live GPS Position Marker */}
        {officerGPS && (
          <Marker
            longitude={officerGPS.lng}
            latitude={officerGPS.lat}
            anchor="center"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-sky-500/30 animate-ping absolute" />
              <div className="w-5 h-5 rounded-full bg-sky-500 border-2 border-white shadow-md flex items-center justify-center z-10">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            </div>
          </Marker>
        )}

        {/* Location Picker Target Pin */}
        {locationPicker && pickedLocation && (
          <Marker
            longitude={pickedLocation.lng}
            latitude={pickedLocation.lat}
            anchor="bottom"
          >
            <div className="flex flex-col items-center animate-bounce">
              <div className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[9px] font-bold shadow-md">
                Selected Incident Point
              </div>
              <MapPin className="w-7 h-7 text-emerald-400 fill-emerald-500" />
            </div>
          </Marker>
        )}
      </Map>

      {/* Bottom Floating Legend Bar */}
      <div className="absolute bottom-2 left-3 z-10 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/85 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Possessed
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Compensated
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Award
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Dispute / Blocked
        </span>
      </div>

    </div>
  );
}