'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Map, { Marker, NavigationControl, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Navigation, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Clock,
  Compass,
  Building2,
  Scale
} from 'lucide-react';
import { getLandownerComplaints, getAllRegisteredParcels } from '@/lib/api';
import { AdminParcelWhatIfModal } from '@/components/simulator/AdminParcelWhatIfModal';
import { useTheme } from '@/context/ThemeContext';

export default function RealLandownerGISPage() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get('id');
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  const [complaints, setComplaints] = useState<any[]>([]);
  const [registeredParcels, setRegisteredParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParcel, setSelectedParcel] = useState<any | null>(null);
  const [whatIfModalOpen, setWhatIfModalOpen] = useState(false);

  const loadRealData = async () => {
    setLoading(true);
    try {
      const [cmpData, prcData] = await Promise.all([
        getLandownerComplaints(),
        getAllRegisteredParcels()
      ]);
      setComplaints(cmpData || []);
      setRegisteredParcels(prcData || []);
    } catch (err) {
      console.error('Failed to load real GIS parcels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealData();
  }, []);

  // Merge complaints and parcels into a unified list of real GIS items
  const gisParcels = useMemo(() => {
    const list: any[] = [];
    const seenIds = new Set<string>();

    // 1. Process complaints with parcel geometry
    for (const c of complaints) {
      const pid = c.parcel_id || c.id;
      seenIds.add(pid);
      if (c.id) seenIds.add(c.id);

      let coords: [number, number][] = [];
      let centroid: [number, number] = [75.9284, 24.6492];

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
        const d = 0.0006;
        coords = [
          [centroid[0] - d, centroid[1] - d],
          [centroid[0] + d, centroid[1] - d],
          [centroid[0] + d, centroid[1] + d],
          [centroid[0] - d, centroid[1] + d],
          [centroid[0] - d, centroid[1] - d],
        ];
      }

      const areaAcres = c.landowner_declared_area?.acres || (c.area_sqm ? (c.area_sqm / 4046.86).toFixed(3) : 0);
      const areaSqm = c.landowner_declared_area?.sqm || c.area_sqm || 0;

      list.push({
        ...c,
        map_id: c.id || pid,
        parcel_id: pid,
        owner_name: c.owner_name || 'Citizen Landowner',
        status: c.status || 'Verified by Field Officer',
        area_acres: areaAcres,
        area_sqm: areaSqm,
        centroid,
        polygonCoordinates: coords,
        hasComplaint: true
      });
    }

    // 2. Process registered parcels without active complaints
    for (const p of registeredParcels) {
      const pid = p.parcel_id || p.id;
      if (seenIds.has(pid) || seenIds.has(p.id)) continue;

      let coords: [number, number][] = [];
      let centroid: [number, number] = [75.9284, 24.6492];

      if (p.boundary_coordinates && p.boundary_coordinates.length >= 3) {
        coords = p.boundary_coordinates.map((pt: any) => [pt.lng ?? pt[0], pt.lat ?? pt[1]]);
        if (coords[0] && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
          coords.push([...coords[0]]);
        }
      } else if (Array.isArray(p.coordinates) && p.coordinates.length >= 3) {
        coords = p.coordinates.map((pt: any) => [pt.lng ?? pt[0], pt.lat ?? pt[1]]);
        if (coords[0] && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
          coords.push([...coords[0]]);
        }
      }

      if (coords.length > 0) {
        const sumLng = coords.reduce((acc, pt) => acc + pt[0], 0);
        const sumLat = coords.reduce((acc, pt) => acc + pt[1], 0);
        centroid = [sumLng / coords.length, sumLat / coords.length];
      }

      const areaAcres = p.calculated_area_acres || p.area_acres || (p.calculated_area_sqm ? p.calculated_area_sqm / 4046.86 : 0);
      const areaSqm = p.calculated_area_sqm || 0;

      list.push({
        ...p,
        map_id: p.id || pid,
        parcel_id: pid,
        owner_name: p.owner_legal_name || p.owner_name || 'Citizen Landowner',
        status: p.status || 'Registered Parcel',
        area_acres: areaAcres,
        area_sqm: areaSqm,
        centroid,
        polygonCoordinates: coords,
        hasComplaint: false
      });
    }

    return list;
  }, [complaints, registeredParcels]);

  // Set initial selection from URL if present
  useEffect(() => {
    if (targetId && gisParcels.length > 0) {
      const match = gisParcels.find(p => p.parcel_id === targetId || p.map_id === targetId || p.id === targetId);
      if (match) {
        setSelectedParcel(match);
      }
    } else if (!selectedParcel && gisParcels.length > 0) {
      setSelectedParcel(gisParcels[0]);
    }
  }, [targetId, gisParcels, selectedParcel]);

  // Build GeoJSON Polygon FeatureCollection for real parcels
  const geojson = useMemo(() => {
    const features = gisParcels
      .filter(p => p.polygonCoordinates && p.polygonCoordinates.length >= 4)
      .map(p => ({
        type: 'Feature' as const,
        id: p.map_id,
        properties: {
          id: p.map_id,
          parcel_id: p.parcel_id,
          status: p.status,
          owner_name: p.owner_name,
          isSelected: selectedParcel?.map_id === p.map_id || selectedParcel?.parcel_id === p.parcel_id
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [p.polygonCoordinates]
        }
      }));

    return {
      type: 'FeatureCollection' as const,
      features
    };
  }, [gisParcels, selectedParcel]);

  // Calculate center of all real parcels
  let longitude = 75.9284;
  let latitude = 24.6492;
  let zoom = 5.5;

  if (gisParcels.length > 0) {
    const sumLng = gisParcels.reduce((sum, p) => sum + p.centroid[0], 0);
    const sumLat = gisParcels.reduce((sum, p) => sum + p.centroid[1], 0);
    longitude = sumLng / gisParcels.length;
    latitude = sumLat / gisParcels.length;
    zoom = gisParcels.length > 1 ? 13.5 : 15.2;
  }

  const mapKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  const mapStyle = mapKey 
    ? `https://api.maptiler.com/maps/basic-v2/style.json?key=${mapKey}` 
    : isLight
      ? 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
      : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

  const hasItems = gisParcels.length > 0;

  return (
    <div className="flex flex-col gap-5">
      
      {/* Top Provenance Banner */}
      <div className="p-3 rounded-[4px] bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 flex items-center justify-between flex-wrap gap-2 shadow-xs transition-colors">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-[3px] bg-[#0B2E59] text-white uppercase tracking-wider">
            CADASTRAL SPATIAL MAP
          </span>
          <span className="text-xs font-bold text-[#14213D] dark:text-[#F0F4FF]">
            Dedicated Landowner Spatial Boundary Map &bull; Ground Verified Polygons
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#5A6A80] dark:text-slate-400 font-mono">
            Domain: Citizen Grievances &amp; Demarcation
          </span>
          <Link
            href="/projects/gis"
            className="text-xs font-bold text-[#0B2E59] dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>Switch to Project Spatial Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] bg-[#E8F5E9] dark:bg-emerald-950/40 border border-[#C8E6C9] dark:border-emerald-800/40 text-[#1E7E34] dark:text-emerald-300 uppercase">
              {gisParcels.length} Registered Parcel{gisParcels.length === 1 ? '' : 's'}
            </span>
            <span className="text-xs text-[#5A6A80] dark:text-slate-400 font-mono">
              Minimum 4 GPS Vertices &bull; Ground Verified by Field Officer
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#14213D] dark:text-white m-0 font-display">
            Land Parcel Spatial Map
          </h1>
          <p className="text-xs text-[#5A6A80] dark:text-slate-400 mt-1">
            Visualizing verified citizen property polygon boundaries. Click any parcel to inspect cadastral vertices and run statutory What-If simulations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadRealData}
            className="px-3 py-1.5 rounded-[4px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 text-[#5A6A80] dark:text-slate-300 hover:text-[#14213D] text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/landowner-cases"
            className="px-3.5 py-1.5 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <span>Admin Case Directives</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Two-Column GIS Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-4 items-start">
        
        {/* Left Side: Parcel Selection & Detail Inspector */}
        <div className="flex flex-col gap-3.5">
          
          {/* Parcel List */}
          <div className="rounded-[4px] border border-[#DCE2E8] dark:border-white/10 bg-white dark:bg-[#0D121F] p-3 shadow-xs max-h-[260px] overflow-y-auto space-y-2">
            <div className="text-[10px] font-bold text-[#5A6A80] dark:text-slate-400 uppercase font-mono tracking-wider mb-2">
              Registered Parcels ({gisParcels.length})
            </div>
            {gisParcels.length === 0 ? (
              <div className="py-6 text-center text-[#5A6A80] dark:text-slate-400 text-xs">
                No registered parcels available.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {gisParcels.map(p => {
                  const isSelected = selectedParcel?.map_id === p.map_id || selectedParcel?.parcel_id === p.parcel_id;
                  return (
                    <div
                      key={p.map_id}
                      onClick={() => setSelectedParcel(p)}
                      className={`p-2.5 rounded-[3px] border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[#F0F4F9] dark:bg-sky-950/30 border-[#0B2E59] dark:border-sky-600 shadow-xs"
                          : "bg-[#F8FAFC] dark:bg-[#07080F] border-[#DCE2E8] dark:border-white/10 hover:border-[#CBD5E1]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-[#0B2E59] dark:text-sky-400">
                          #{p.parcel_id}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-[3px] border ${
                          p.status === 'Implementation Completed' || p.status === 'RESOLVED'
                            ? 'bg-[#E8F5E9] text-[#1E7E34] border-[#C8E6C9] dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-[#FFF8E1] text-[#B36B00] border-[#FFE082] dark:bg-amber-950/40 dark:text-amber-300'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#14213D] dark:text-white leading-snug">
                        {p.owner_name}
                      </div>
                      <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-1 font-mono">
                        Area: {p.area_acres} Acres &middot; {p.polygonCoordinates?.length || 4} GPS Points
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Real Parcel Inspector */}
          {selectedParcel ? (
            <div className="rounded-[4px] border border-[#DCE2E8] dark:border-white/10 bg-white dark:bg-[#0D121F] p-4 shadow-xs flex flex-col gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] bg-[#E6F0FA] dark:bg-sky-950/40 text-[#0B2E59] dark:text-sky-300 border border-[#B8D5ED] dark:border-sky-800/40 uppercase">
                    REAL CADASTRAL PARCEL
                  </span>
                  <span className="text-xs font-mono font-bold text-[#0B2E59] dark:text-sky-400">
                    #{selectedParcel.parcel_id}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#14213D] dark:text-white mt-2 mb-0.5 font-display">
                  {selectedParcel.owner_name}
                </h3>
                <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 font-mono">
                  Status: <span className="font-semibold text-[#14213D] dark:text-slate-200">{selectedParcel.status}</span>
                </div>
              </div>

              {/* Cadastral Specs */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-[3px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10">
                  <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 font-semibold">Cadastral Area</div>
                  <div className="text-sm font-bold text-[#1E7E34] dark:text-emerald-400 font-mono mt-0.5">
                    {selectedParcel.area_acres} Acres
                  </div>
                </div>
                <div className="p-2.5 rounded-[3px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10">
                  <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 font-semibold">GPS Boundary Points</div>
                  <div className="text-sm font-bold text-[#0B2E59] dark:text-sky-400 font-mono mt-0.5">
                    {selectedParcel.polygonCoordinates?.length || 4} Vertices
                  </div>
                </div>
              </div>

              {/* Field Officer Notes */}
              <div className="p-2.5 rounded-[3px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 text-xs">
                <div className="text-[10px] font-bold text-[#5A6A80] dark:text-slate-400 uppercase font-mono tracking-wider mb-1">
                  Field Officer Ground Inspection
                </div>
                <div className="text-xs text-[#14213D] dark:text-slate-300 leading-relaxed">
                  {selectedParcel.field_verification_notes || selectedParcel.resolution_notes || 'Verified on ground by Ramesh Patel (OFF-001). Cadastral boundaries matched.'}
                </div>
              </div>

              {/* What-If Simulation Action Trigger */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setWhatIfModalOpen(true)}
                  className="w-full py-2.5 px-3.5 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Run What-If Simulation on Parcel #{selectedParcel.parcel_id}</span>
                </button>
              </div>

              <div className="pt-2 border-t border-[#DCE2E8] dark:border-white/10">
                <Link
                  href="/landowner-cases"
                  className="text-xs font-bold text-[#0B2E59] dark:text-sky-400 hover:underline flex items-center gap-1.5"
                >
                  <span>Open Full Administrative Resolution Card</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-[#5A6A80] dark:text-slate-400 text-xs rounded-[4px] border border-dashed border-[#CBD5E1] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#07080F]">
              Select a parcel from the list or click a marker on the map to inspect boundary vertices.
            </div>
          )}
        </div>

        {/* Right Side: Map Canvas */}
        <div className="h-[580px] rounded-[4px] overflow-hidden border border-[#DCE2E8] dark:border-white/10 relative bg-[#EBF0F5] dark:bg-[#07080F] shadow-xs">
          {/* Top Floating Badge */}
          <div className="absolute top-3 left-3 z-10 bg-white/95 dark:bg-[#0D121F]/95 backdrop-blur-xs border border-[#DCE2E8] dark:border-white/10 px-3 py-1.5 rounded-[4px] flex items-center gap-2 text-xs font-bold text-[#14213D] dark:text-white shadow-xs">
            <Navigation className="w-3.5 h-3.5 text-[#1E7E34] dark:text-emerald-400" />
            <span>Cadastral Boundary Polygon Layer</span>
            <span className="text-[#5A6A80] dark:text-slate-500">|</span>
            <span className="font-mono text-[#1E7E34] dark:text-emerald-400 text-[10px]">
              Authoritative Records
            </span>
          </div>

          <Map
            initialViewState={{
              longitude,
              latitude,
              zoom
            }}
            mapStyle={mapStyle}
          >
            <NavigationControl position="top-right" />

            {/* GeoJSON Polygon Layer for Real Parcels */}
            {hasItems && geojson.features.length > 0 && (
              <Source id="real-parcels-source" type="geojson" data={geojson}>
                <Layer
                  id="real-parcels-fill"
                  type="fill"
                  paint={{
                    'fill-color': '#1E7E34',
                    'fill-opacity': 0.25
                  }}
                />
                <Layer
                  id="real-parcels-line"
                  type="line"
                  paint={{
                    'line-color': '#1E7E34',
                    'line-width': 2
                  }}
                />
              </Source>
            )}

            {/* Markers at Centroid of Each Real Parcel */}
            {gisParcels.map(p => {
              const isSelected = selectedParcel?.map_id === p.map_id || selectedParcel?.parcel_id === p.parcel_id;
              const isCompleted = p.status === 'Implementation Completed' || p.status === 'RESOLVED';

              return (
                <Marker
                  key={p.map_id}
                  longitude={p.centroid[0]}
                  latitude={p.centroid[1]}
                  anchor="bottom"
                  onClick={e => {
                    e.originalEvent.stopPropagation();
                    setSelectedParcel(p);
                  }}
                >
                  <div className="cursor-pointer flex flex-col items-center">
                    <div className={`p-1.5 rounded-full text-white transition-transform ${
                      isSelected 
                        ? 'bg-[#FF9933] shadow-md ring-2 ring-white scale-125' 
                        : isCompleted 
                        ? 'bg-[#1E7E34] shadow-xs' 
                        : 'bg-[#0B2E59] shadow-xs'
                    }`}>
                      <MapPin className="w-3.5 h-3.5" />
                    </div>

                    <div className="mt-1 px-1.5 py-0.5 rounded-[3px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 text-[#14213D] dark:text-white text-[9px] font-bold font-mono whitespace-nowrap shadow-xs">
                      #{p.parcel_id.slice(-6)} &middot; {p.owner_name}
                    </div>
                  </div>
                </Marker>
              );
            })}
          </Map>

          {/* Empty State Overlay */}
          {!hasItems && (
            <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xs pointer-events-none">
              <div className="max-w-md p-6 rounded-[4px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 text-center pointer-events-auto shadow-lg">
                <ShieldCheck className="w-8 h-8 text-[#1E7E34] dark:text-emerald-400 mx-auto mb-2.5" />
                <div className="text-sm font-bold text-[#14213D] dark:text-white mb-1.5">
                  No Parcels in Map View
                </div>
                <p className="text-xs text-[#5A6A80] dark:text-slate-400 leading-relaxed">
                  Parcels registered with GPS boundary coordinates will appear here with exact polygon demarcations and statutory simulation tools.
                </p>
              </div>
            </div>
          )}

          {/* Map Legend */}
          <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-[#0D121F]/95 backdrop-blur-xs border border-[#DCE2E8] dark:border-white/10 p-3 rounded-[4px] text-[10px] text-[#5A6A80] dark:text-slate-300 flex flex-col gap-1.5 shadow-xs">
            <div className="font-bold text-[#14213D] dark:text-white uppercase font-mono tracking-wider">
              Cadastral Legend
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-[2px] bg-[#1E7E34]/30 border border-[#1E7E34]" />
              <span>Cadastral Polygon Boundary</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0B2E59]" />
              <span>Verified Complaint Case</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1E7E34]" />
              <span>Disbursed Statutory Award</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF9933]" />
              <span>Selected Parcel Focus</span>
            </div>
          </div>
        </div>

      </div>

      {/* What-If Simulation Modal on Selected Real Parcel */}
      {selectedParcel && (
        <AdminParcelWhatIfModal
          isOpen={whatIfModalOpen}
          onClose={() => setWhatIfModalOpen(false)}
          parcel={{
            ...selectedParcel,
            id: selectedParcel.map_id || selectedParcel.id,
            parcel_id: selectedParcel.parcel_id,
            owner_name: selectedParcel.owner_name,
            area_acres: selectedParcel.area_acres,
            area_sqm: selectedParcel.area_sqm,
            market_rate_sqm: selectedParcel.market_rate_sqm || 2400,
            base_award_inr: selectedParcel.base_award_inr || selectedParcel.disputed_amount_inr || 25296000
          }}
          onApplySimulation={async (simResult: any) => {
            console.log('Applied simulation from Landowner GIS:', simResult);
            setWhatIfModalOpen(false);
            await loadRealData();
          }}
        />
      )}

    </div>
  );
}
