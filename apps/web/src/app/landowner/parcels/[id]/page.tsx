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
        <div className="py-24 text-center text-xs text-[#5A6A80] dark:text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0B2E59] dark:text-amber-400" />
          <span>Retrieving registered parcel record...</span>
        </div>
      </LandownerShell>
    );
  }

  if (error || !parcel) {
    return (
      <LandownerShell title="Parcel Details">
        <div className="p-4 max-w-lg mx-auto space-y-4">
          <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-6 text-center space-y-3 shadow-xs">
            <AlertCircle className="w-10 h-10 text-[#B36B00] dark:text-amber-400 mx-auto" />
            <h2 className="text-base font-bold text-[#14213D] dark:text-white">Parcel Record Not Found</h2>
            <p className="text-xs text-[#5A6A80] dark:text-slate-400">{error || "No matching registered parcel found."}</p>
            <Link
              href="/landowner/home"
              className="inline-flex items-center gap-1.5 py-2 px-4 rounded-[4px] text-xs font-bold text-white bg-[#0B2E59] hover:bg-[#082242] transition-colors"
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
            className="text-xs text-[#0B2E59] dark:text-sky-400 hover:underline flex items-center gap-1 border border-[#DCE2E8] dark:border-white/10 px-3 py-1.5 rounded-[4px] bg-white dark:bg-[#0D121F] font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>My Registered Parcels</span>
          </Link>

          <span className="px-2.5 py-1 rounded-[3px] text-[10px] font-mono font-bold bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-400 border border-[#C8E6C9] dark:border-emerald-800/50">
            {parcel.registration_status || parcel.status || "Registered"}
          </span>
        </div>

        {/* 14-Digit Numeric Parcel ID Banner */}
        <div className="bg-white dark:bg-[#0D121F] border-2 border-[#0B2E59]/30 dark:border-white/15 rounded-[4px] p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#0B2E59] dark:text-sky-400 uppercase tracking-wider">
              OFFICIAL 14-DIGIT PARCEL IDENTIFIER
            </span>
            <span className="text-[10px] text-[#5A6A80] dark:text-slate-400">Unique Land Record</span>
          </div>

          <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#14213D] dark:text-white tracking-wider">
            {parcel.parcel_id || parcelId}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#DCE2E8] dark:border-white/10 text-xs">
            <div>
              <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] font-bold">REGISTERED OWNER</span>
              <span className="text-[#14213D] dark:text-white font-bold">{parcel.owner_legal_name || parcel.owner_name}</span>
            </div>
            <div>
              <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] font-bold">VILLAGE / REVENUE MAUZA</span>
              <span className="text-[#14213D] dark:text-slate-200">{parcel.village_name || parcel.contact_village || "Corridor Sector"}</span>
            </div>
          </div>
        </div>

        {/* Identity Verification Status */}
        {parcel.identity_verification && (
          <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-3.5 text-xs space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#14213D] dark:text-slate-200 flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-[#1E7E34] dark:text-emerald-400" />
                Identity Verification
              </span>
              <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-bold bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-400 border border-[#C8E6C9] dark:border-emerald-800/50">
                {parcel.identity_verification.status}
              </span>
            </div>
            <div className="text-[#5A6A80] dark:text-slate-300 font-mono text-[11px] pl-5 space-y-0.5">
              <p>Masked Aadhaar: <span className="text-[#14213D] dark:text-white font-bold">{parcel.identity_verification.masked_aadhaar}</span></p>
              <p>Reference: <span className="text-[#5A6A80] dark:text-slate-400">{parcel.identity_verification.reference_id}</span></p>
              {parcel.identity_verification.disclaimer && (
                <p className="text-[10px] text-[#B36B00] dark:text-amber-400 italic pt-1">{parcel.identity_verification.disclaimer}</p>
              )}
            </div>
          </div>
        )}

        {/* Interactive Map with Exact Polygon */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#14213D] dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
              <span>Exact Demarcated Boundary</span>
            </h2>
            <span className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400">
              {parcel.coordinates?.length || 4} Authoritative Corners
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full rounded-[4px] overflow-hidden border border-[#DCE2E8] dark:border-white/10 relative">
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
                  <div className="w-6 h-6 rounded-full bg-[#0B2E59] text-white font-bold font-mono text-[10px] flex items-center justify-center shadow-md border-2 border-white ring-2 ring-[#0B2E59]/40">
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
                      "fill-color": "#0B2E59",
                      "fill-opacity": 0.2
                    }}
                  />
                  <Layer
                    id="parcel-line"
                    type="line"
                    paint={{
                      "line-color": "#0B2E59",
                      "line-width": 3
                    }}
                  />
                </Source>
              )}
            </Map>
          </div>

          {/* Area Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
            <div className="bg-[#F8FAFC] dark:bg-[#07080F] p-2.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
              <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] font-bold">Square Meters</span>
              <span className="font-mono font-bold text-[#0B2E59] dark:text-sky-400 text-xs">
                {parcel.area_sqm?.toLocaleString(undefined, { maximumFractionDigits: 1 }) || "0"} m²
              </span>
            </div>
            <div className="bg-[#F8FAFC] dark:bg-[#07080F] p-2.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
              <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] font-bold">Hectares</span>
              <span className="font-mono font-bold text-[#14213D] dark:text-white text-xs">
                {parcel.area_hectares?.toFixed(4) || "0"} Ha
              </span>
            </div>
            <div className="bg-[#F8FAFC] dark:bg-[#07080F] p-2.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10">
              <span className="text-[#5A6A80] dark:text-slate-400 block text-[10px] font-bold">Acres</span>
              <span className="font-mono font-bold text-[#14213D] dark:text-white text-xs">
                {parcel.area_acres?.toFixed(3) || "0"} Ac
              </span>
            </div>
          </div>

          <p className="text-[10px] text-[#5A6A80] dark:text-slate-400 italic text-center">
            * Note: Area is a calculated value derived from applicant coordinates, not an officially recorded government registry value.
          </p>
        </div>

        {/* Coordinates Table */}
        {parcel.coordinates && parcel.coordinates.length > 0 && (
          <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-2 text-xs">
            <h3 className="font-bold text-[#14213D] dark:text-white text-xs">Authoritative Corner Coordinates</h3>
            <div className="space-y-1 font-mono">
              {parcel.coordinates.map((pt: any, idx: number) => (
                <div
                  key={idx}
                  className="p-2 bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] flex items-center justify-between"
                >
                  <span className="font-bold text-[#0B2E59] dark:text-sky-400">P{pt.sequence || idx + 1}</span>
                  <span className="text-[#14213D] dark:text-white font-bold">{pt.lat.toFixed(6)}, {pt.lng.toFixed(6)}</span>
                  <span className="text-[#5A6A80] dark:text-slate-400 text-[10px]">
                    {pt.accuracy ? `±${pt.accuracy}m` : "Exact"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Official Land Documents */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#14213D] dark:text-white text-xs flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
              <span>Official Documents ({parcel.documents?.length || 0})</span>
            </h3>
            <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-bold bg-[#EBF3FC] dark:bg-sky-950/40 text-[#0B2E59] dark:text-sky-400 border border-[#DCE2E8] dark:border-sky-800/50">
              {parcel.document_verification_status || "Submitted"}
            </span>
          </div>

          {(!parcel.documents || parcel.documents.length === 0) ? (
            <p className="text-[#5A6A80] dark:text-slate-400 text-xs py-2">No documents attached.</p>
          ) : (
            <div className="space-y-2">
              {parcel.documents.map((doc: any, idx: number) => (
                <div
                  key={doc.id || idx}
                  className="p-3 bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-[#0B2E59] dark:text-sky-400 flex-shrink-0" />
                    <div className="overflow-hidden">
                      <span className="font-bold text-[#14213D] dark:text-white block truncate">{doc.file_name}</span>
                      <span className="text-[10px] text-[#5A6A80] dark:text-slate-400 block">{doc.title}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-mono bg-white dark:bg-slate-800 text-[#14213D] dark:text-slate-300 border border-[#DCE2E8] dark:border-white/10">
                      {doc.status || "Submitted"}
                    </span>
                    {doc.public_url && (
                      <a
                        href={doc.public_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0B2E59] dark:text-sky-400 hover:underline p-1"
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
            className="w-full py-3 px-4 rounded-[4px] font-bold text-white bg-[#0B2E59] hover:bg-[#082242] transition-colors flex items-center justify-center gap-2 text-xs shadow-xs"
          >
            <FileText className="w-4 h-4" />
            <span>FILE COMPLAINT AGAINST THIS PARCEL</span>
          </Link>
        </div>

      </div>
    </LandownerShell>
  );
}
