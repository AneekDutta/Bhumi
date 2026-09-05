"use client";

import React, { useState, useMemo } from "react";
import { MapPin, Navigation, Crosshair, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { getCurrentGPSPosition, LocationCoordinates } from "@/lib/native/geolocation";
import { FieldSpatialMap } from "./FieldSpatialMap";

interface CaptureLocationProps {
  targetLat?: number;
  targetLng?: number;
  surveyNo?: string;
  parcelId?: string;
  polygonCoords?: [number, number][];
  onLocationCaptured: (coords: LocationCoordinates) => void;
}

export function CaptureLocation({
  targetLat = 24.6492,
  targetLng = 75.9284,
  surveyNo = "-",
  parcelId,
  polygonCoords,
  onLocationCaptured
}: CaptureLocationProps) {
  const [coords, setCoords] = useState<LocationCoordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Construct real GeoJSON polygon for this parcel
  const parcelGeoJSON = useMemo(() => {
    if (polygonCoords && polygonCoords.length > 0) {
      return {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [polygonCoords]
          },
          properties: {
            parcel_id: parcelId || "TARGET",
            survey_number: surveyNo,
            acquisition_status: "notified"
          }
        }],
        properties: {
          center: [targetLng, targetLat]
        }
      };
    }

    // Centered cadastral bounding box from real coordinates
    const dLng = 0.0006;
    const dLat = 0.0004;
    return {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [targetLng - dLng, targetLat - dLat],
            [targetLng + dLng, targetLat - dLat],
            [targetLng + dLng, targetLat + dLat],
            [targetLng - dLng, targetLat + dLat],
            [targetLng - dLng, targetLat - dLat],
          ]]
        },
        properties: {
          parcel_id: parcelId || "TARGET",
          survey_number: surveyNo,
          acquisition_status: "notified"
        }
      }],
      properties: {
        center: [targetLng, targetLat]
      }
    };
  }, [targetLat, targetLng, surveyNo, parcelId, polygonCoords]);

  const handleAcquireGPS = async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await getCurrentGPSPosition({ enableHighAccuracy: true, timeout: 10000 });
      setCoords(pos);
      onLocationCaptured(pos);
    } catch {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const acquired: LocationCoordinates = {
              lat: Number(pos.coords.latitude.toFixed(6)),
              lng: Number(pos.coords.longitude.toFixed(6)),
              accuracy: Math.round(pos.coords.accuracy),
              timestamp: Date.now()
            };
            setCoords(acquired);
            onLocationCaptured(acquired);
            setLoading(false);
          },
          (err) => {
            setError(err.message || "GPS signal unavailable. Please enable device location.");
            setLoading(false);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setError("Geolocation is not supported by your device browser.");
        setLoading(false);
      }
    }
  };

  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`;

  return (
    <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <Crosshair className="w-4 h-4 text-emerald-400" />
          <span>Real Spatial Map & Cadastral Demarcation</span>
        </div>
        {coords && (
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
            coords.accuracy <= 15
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-amber-500/15 border-amber-500/30 text-amber-300"
          }`}>
            ±{coords.accuracy}m Accuracy
          </span>
        )}
      </div>

      {/* Real MapLibre GL Cadastral Map */}
      <div className="relative w-full h-44 rounded-xl border border-slate-700/80 overflow-hidden shadow-inner">
        <FieldSpatialMap
          geojson={parcelGeoJSON}
          height="100%"
          initialCenter={[targetLng, targetLat]}
          initialZoom={16}
          showControls={false}
          interactive={true}
        />
        <div className="absolute bottom-2 left-2 text-[10px] font-mono text-slate-200 bg-slate-900/90 px-2 py-0.5 rounded border border-white/10 z-10">
          Centroid: {targetLat.toFixed(4)}°N, {targetLng.toFixed(4)}°E
        </div>
      </div>

      {/* Buttons: Acquire GPS & Open Google Maps */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={handleAcquireGPS}
          disabled={loading}
          className="py-2.5 px-3 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 border border-slate-600 transition-all cursor-pointer disabled:opacity-60"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          ) : (
            <MapPin className="w-4 h-4 text-emerald-400" />
          )}
          <span>{coords ? "Re-acquire GPS" : "Capture Real GPS Fix"}</span>
        </button>

        <a
          href={navUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all text-center"
        >
          <Navigation className="w-4 h-4" />
          <span>Turn-by-Turn</span>
        </a>
      </div>

      {coords && (
        <div className="text-[11px] font-mono text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-white/5 flex items-center justify-between">
          <span>Lat: {coords.lat}°, Lng: {coords.lng}°</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Fixed
          </span>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}