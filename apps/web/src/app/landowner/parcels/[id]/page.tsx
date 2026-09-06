"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Map, { Source, Layer, Marker, NavigationControl, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Layers,
  MapPin,
  ArrowLeft,
  ShieldCheck,
  FileText,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Calendar,
  CheckCircle2,
  FileCheck2,
  Share2,
  AlertTriangle
} from "lucide-react";
import { LandownerShell } from "@/components/landowner/LandownerShell";
import { getParcelById, getLandownerComplaints } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

const DARK_MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const LIGHT_MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export default function LandownerParcelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const parcelId = typeof params?.id === "string" ? params.id : "";
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const mapRef = useRef<MapRef | null>(null);

  const [parcel, setParcel] = useState<any | null>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!parcelId) return;

    async function loadParcelData() {
      setLoading(true);
      try {
        const data = await getParcelById(parcelId);
        if (!data) {
          setError(`Parcel record #${parcelId} could not be found in the registry.`);
        } else {
          setParcel(data);
          // Fetch complaints associated with this parcel
          const cData = await getLandownerComplaints({ parcel_id: parcelId });
          setComplaints(cData || []);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load parcel details.");
      } finally {
        setLoading(false);
      }
    }

    loadParcelData();
  }, [parcelId]);

  // GeoJSON Polygon for Map display
  const polygonGeoJson = useMemo(() => {
    if (!parcel?.geometry && !parcel?.geom && !parcel?.coordinates) return null;
    if (parcel?.geometry) {
      return {
        type: "Feature" as const,
        properties: {},
        geometry: parcel.geometry
      };
    }
    if (parcel?.coordinates && parcel.coordinates.length >= 3) {
      const ring = [
        ...parcel.coordinates.map((p: any) => [p.lng, p.lat]),
        [parcel.coordinates[0].lng, parcel.coordinates[0].lat]
      ];
      return {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "Polygon" as const,
          coordinates: [ring]
        }
      };
    }
    return null;
  }, [parcel]);

  const centroid = useMemo(() => {
    if (parcel?.coordinates && parcel.coordinates.length > 0) {
      const avgLat = parcel.coordinates.reduce((sum: number, p: any) => sum + p.lat, 0) / parcel.coordinates.length;
      const avgLng = parcel.coordinates.reduce((sum: number, p: any) => sum + p.lng, 0) / parcel.coordinates.length;
      return { lat: avgLat, lng: avgLng };
    }
    return { lat: 24.6492, lng: 75.9284 };
  }, [parcel]);

  if (loading) {
    return (
      <LandownerShell title="Parcel Details">
        <div className="py-24 text-center text-xs text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
          <span>Retrieving registered parcel record...</span>
        </div>
      </LandownerShell>
    );
  }

  if (error || !parcel) {
    return (
      <LandownerShell title="Parcel Details">
        <div className="p-4 max-w-lg mx-auto space-y-4">
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
            <h2 className="text-base font-bold text-slate-900">Parcel Record Not Found</h2>
            <p className="text-xs text-slate-400">{error || "No matching registered parcel found."}</p>
            <Link
              href="/landowner/home"
              className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </LandownerShell>
    );
  }

  return (
    <LandownerShell title={`Parcel #${parcel.parcel_id || parcelId}`}>
      <div className="p-4 space-y-4 max-w-lg mx-auto pb-28">

        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/landowner/home"
            className="text-xs text-slate-400 hover:text-slate-900 flex items-center gap-1 border border-[#e2e8f0] px-3 py-1.5 rounded-xl bg-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>My Registered Parcels</span>
          </Link>

          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            {parcel.registration_status || parcel.status || "Registered"}
          </span>
        </div>

        {/* 14-Digit Numeric Parcel ID Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-[#e2e8f0] rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              OFFICIAL 14-DIGIT PARCEL IDENTIFIER
            </span>
            <span className="text-[10px] text-slate-500">Unique Land Record</span>
          </div>

          <div className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-wider">
            {parcel.parcel_id || parcelId}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e2e8f0]/80 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">REGISTERED OWNER</span>
              <span className="text-slate-900 font-bold">{parcel.owner_legal_name || parcel.owner_name}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">VILLAGE / REVENUE MAUZA</span>
              <span className="text-slate-900">{parcel.village_name || parcel.contact_village || "Corridor Sector"}</span>
            </div>
          </div>
        </div>

        {/* Identity Verification Status */}
        {parcel.identity_verification && (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-3.5 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Identity Verification
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {parcel.identity_verification.status}
              </span>
            </div>
            <div className="text-slate-300 font-mono text-[11px] pl-5 space-y-0.5">
              <p>Masked Aadhaar: <span className="text-slate-900">{parcel.identity_verification.masked_aadhaar}</span></p>
              <p>Reference: <span className="text-slate-400">{parcel.identity_verification.reference_id}</span></p>
              {parcel.identity_verification.disclaimer && (
                <p className="text-[10px] text-amber-400/80 italic pt-1">{parcel.identity_verification.disclaimer}</p>
              )}
            </div>
          </div>
        )}

        {/* Interactive Map with Exact Polygon */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Exact Demarcated Boundary</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400">
              {parcel.coordinates?.length || 4} Authoritative Corners
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full rounded-xl overflow-hidden border border-[#e2e8f0] relative">
            <Map
              ref={mapRef}
              initialViewState={{
                longitude: centroid.lng,
                latitude: centroid.lat,
                zoom: 17
              }}
              mapStyle={isLight ? LIGHT_MAP_STYLE : DARK_MAP_STYLE}
              cooperativeGestures={true}
            >
              <NavigationControl position="top-right" showCompass={true} />

              {/* Numbered Corner Markers */}
              {parcel.coordinates?.map((pt: any, idx: number) => (
                <Marker key={idx} longitude={pt.lng} latitude={pt.lat} anchor="center">
                  <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-bold font-mono text-[10px] flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-amber-400/40">
                    P{pt.sequence || idx + 1}
                  </div>
                </Marker>
              ))}

              {/* Polygon Fill & Boundary Line */}
              {polygonGeoJson && (
                <Source type="geojson" data={polygonGeoJson}>
                  <Layer
                    id="parcel-fill"
                    type="fill"
                    paint={{
                      "fill-color": "#f59e0b",
                      "fill-opacity": 0.25
                    }}
                  />
                  <Layer
                    id="parcel-line"
                    type="line"
                    paint={{
                      "line-color": "#f59e0b",
                      "line-width": 3
                    }}
                  />
                </Source>
              )}
            </Map>
          </div>

          {/* Area Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
            <div className="bg-[#f4f6f9] p-2.5 rounded-xl border border-[#e2e8f0]">
              <span className="text-slate-500 block text-[10px]">Square Meters</span>
              <span className="font-mono font-bold text-amber-400 text-xs">
                {parcel.area_sqm?.toLocaleString(undefined, { maximumFractionDigits: 1 }) || "0"} m²
              </span>
            </div>
            <div className="bg-[#f4f6f9] p-2.5 rounded-xl border border-[#e2e8f0]">
              <span className="text-slate-500 block text-[10px]">Hectares</span>
              <span className="font-mono font-bold text-slate-900 text-xs">
                {parcel.area_hectares?.toFixed(4) || "0"} Ha
              </span>
            </div>
            <div className="bg-[#f4f6f9] p-2.5 rounded-xl border border-[#e2e8f0]">
              <span className="text-slate-500 block text-[10px]">Acres</span>
              <span className="font-mono font-bold text-slate-900 text-xs">
                {parcel.area_acres?.toFixed(3) || "0"} Ac
              </span>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 italic text-center">
            * Note: Area is a calculated value derived from applicant coordinates, not an officially recorded government registry value.
          </p>
        </div>

        {/* Coordinates Table */}
        {parcel.coordinates && parcel.coordinates.length > 0 && (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-xl space-y-2 text-xs">
            <h3 className="font-bold text-slate-900 text-xs">Authoritative Corner Coordinates</h3>
            <div className="space-y-1 font-mono">
              {parcel.coordinates.map((pt: any, idx: number) => (
                <div
                  key={idx}
                  className="p-2 bg-[#f4f6f9] border border-[#e2e8f0] rounded-lg flex items-center justify-between"
                >
                  <span className="font-bold text-amber-400">P{pt.sequence || idx + 1}</span>
                  <span className="text-slate-900">{pt.lat.toFixed(6)}, {pt.lng.toFixed(6)}</span>
                  <span className="text-slate-500 text-[10px]">
                    {pt.accuracy ? `±${pt.accuracy}m` : "Exact"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Official Land Documents */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-xl space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              <span>Official Documents ({parcel.documents?.length || 0})</span>
            </h3>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30">
              {parcel.document_verification_status || "Submitted"}
            </span>
          </div>

          {(!parcel.documents || parcel.documents.length === 0) ? (
            <p className="text-slate-500 text-xs py-2">No documents attached.</p>
          ) : (
            <div className="space-y-2">
              {parcel.documents.map((doc: any, idx: number) => (
                <div
                  key={doc.id || idx}
                  className="p-3 bg-[#f4f6f9] border border-[#e2e8f0] rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div className="overflow-hidden">
                      <span className="font-medium text-slate-900 block truncate">{doc.file_name}</span>
                      <span className="text-[10px] text-slate-400 block">{doc.title}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-300">
                      {doc.status || "Submitted"}
                    </span>
                    {doc.public_url && (
                      <a
                        href={doc.public_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 hover:text-amber-300 p-1"
                        title="View Document"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Existing Complaints / File Complaint CTA */}
        <div className="space-y-2 pt-2">
          <Link
            href={`/landowner/complaints/new?parcel_id=${parcel.parcel_id || parcelId}`}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 text-xs shadow-lg shadow-amber-400/20"
          >
            <FileText className="w-4 h-4" />
            <span>FILE COMPLAINT AGAINST THIS PARCEL</span>
          </Link>
        </div>

      </div>
    </LandownerShell>
  );
}
