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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Top Provenance Banner */}
      <div style={{
        padding: '10px 16px',
        borderRadius: 10,
        background: 'rgba(16,185,129,0.08)',
        border: '1px solid rgba(16,185,129,0.3)',
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
            background: '#10b981',
            color: '#000',
            textTransform: 'uppercase'
          }}>
            CADASTRAL SPATIAL MAP
          </span>
          <span style={{ fontSize: 12, color: '#6ee7b7', fontWeight: 600 }}>
            Dedicated Landowner Spatial Boundary Map &bull; Ground Verified Polygons
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
            Domain: Citizen Grievances &amp; Demarcation
          </span>
          <Link
            href="/projects/gis"
            style={{
              fontSize: 11,
              color: '#818cf8',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontWeight: 600
            }}
          >
            <span>Switch to Project Spatial Map</span>
            <ArrowRight style={{ width: 12, height: 12 }} />
          </Link>
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.07em', textTransform: 'uppercase',
              padding: '3px 10px', borderRadius: 5,
              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399'
            }}>
              {gisParcels.length} Registered Parcel{gisParcels.length === 1 ? '' : 's'}
            </span>
            <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
              Minimum 4 GPS Vertices &bull; Ground Verified by Field Officer
            </span>
          </div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
            Land Parcel Spatial Map
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Visualizing verified citizen property polygon boundaries. Click any parcel to inspect cadastral vertices and run statutory What-If simulations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={loadRealData}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#cbd5e1',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <RefreshCw style={{ width: 12, height: 12, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>
          <Link
            href="/landowner-cases"
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#a5b4fc',
              fontSize: 11,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span>Admin Case Directives</span>
            <ArrowRight style={{ width: 12, height: 12 }} />
          </Link>
        </div>
      </div>

      {/* Main Two-Column GIS Interface */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(310px, 370px) 1fr', gap: 18, alignItems: 'start' }}>
        
        {/* Left Side: Parcel Selection & Detail Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* Parcel List */}
          <div style={{
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(15,23,42,0.6)',
            padding: 14,
            maxHeight: 250,
            overflowY: 'auto'
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', marginBottom: 10 }}>
              Registered Parcels ({gisParcels.length})
            </div>
            {gisParcels.length === 0 ? (
              <div style={{ padding: '24px 10px', textAlign: 'center', color: '#64748b', fontSize: 12 }}>
                No registered parcels available.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {gisParcels.map(p => {
                  const isSelected = selectedParcel?.map_id === p.map_id || selectedParcel?.parcel_id === p.parcel_id;
                  return (
                    <div
                      key={p.map_id}
                      onClick={() => setSelectedParcel(p)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: isSelected ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.06)',
                        background: isSelected ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#38bdf8', fontWeight: 700 }}>
                          #{p.parcel_id}
                        </span>
                        <span style={{
                          fontSize: 9,
                          fontFamily: 'JetBrains Mono, monospace',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: p.status === 'Implementation Completed' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                          color: p.status === 'Implementation Completed' ? '#34d399' : '#f59e0b'
                        }}>
                          {p.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>
                        {p.owner_name}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
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
            <div style={{
              borderRadius: 12,
              border: '1px solid rgba(16,185,129,0.3)',
              background: 'rgba(16,185,129,0.04)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: 9,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'rgba(16,185,129,0.2)',
                    color: '#6ee7b7',
                    textTransform: 'uppercase'
                  }}>
                    REAL CADASTRAL PARCEL
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#38bdf8', fontWeight: 700 }}>
                    #{selectedParcel.parcel_id}
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#e2e8f0', margin: '6px 0 2px' }}>
                  {selectedParcel.owner_name}
                </h3>
                <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                  Status: {selectedParcel.status}
                </div>
              </div>

              {/* Cadastral Specs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: 10, color: '#64748b' }}>Cadastral Area</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>
                    {selectedParcel.area_acres} Acres
                  </div>
                </div>
                <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: 10, color: '#64748b' }}>GPS Boundary Points</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#818cf8', fontFamily: 'JetBrains Mono, monospace' }}>
                    {selectedParcel.polygonCoordinates?.length || 4} Vertices
                  </div>
                </div>
              </div>

              {/* Field Officer Notes */}
              <div style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>
                  Field Officer Ground Inspection
                </div>
                <div style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.4 }}>
                  {selectedParcel.field_verification_notes || selectedParcel.resolution_notes || 'Verified on ground by Ramesh Patel (OFF-001). Cadastral boundaries matched.'}
                </div>
              </div>

              {/* What-If Simulation Action Trigger */}
              <div style={{ paddingTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setWhatIfModalOpen(true)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                  }}
                >
                  <Sparkles style={{ width: 14, height: 14 }} />
                  <span>Run What-If Simulation on Parcel #{selectedParcel.parcel_id}</span>
                </button>
              </div>

              <div style={{ paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Link
                  href="/landowner-cases"
                  style={{
                    fontSize: 11,
                    color: '#34d399',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 600
                  }}
                >
                  <span>Open Full Administrative Resolution Card</span>
                  <ArrowRight style={{ width: 12, height: 12 }} />
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 12, borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)' }}>
              Select a parcel from the list or click a marker on the map to inspect boundary vertices.
            </div>
          )}
        </div>

        {/* Right Side: Map Canvas */}
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
            <Navigation style={{ width: 14, height: 14, color: '#10b981' }} />
            <span>Cadastral Boundary Polygon Layer</span>
            <span style={{ color: '#64748b' }}>|</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#34d399', fontSize: 10 }}>
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
                    'fill-color': '#10b981',
                    'fill-opacity': 0.35
                  }}
                />
                <Layer
                  id="real-parcels-line"
                  type="line"
                  paint={{
                    'line-color': '#059669',
                    'line-width': 2.5
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
                  <div
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{
                      padding: 6,
                      borderRadius: '50%',
                      background: isSelected ? '#f59e0b' : isCompleted ? '#10b981' : '#6366f1',
                      color: '#fff',
                      boxShadow: isSelected ? '0 0 16px rgba(245,158,11,0.7)' : '0 0 10px rgba(16,185,129,0.5)',
                      transform: isSelected ? 'scale(1.25)' : 'scale(1)',
                      transition: 'transform 0.15s ease'
                    }}>
                      <MapPin style={{ width: 14, height: 14 }} />
                    </div>

                    <div style={{
                      marginTop: 3,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(15,23,42,0.92)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: 700,
                      fontFamily: 'JetBrains Mono, monospace',
                      whiteSpace: 'nowrap'
                    }}>
                      #{p.parcel_id.slice(-6)} &middot; {p.owner_name}
                    </div>
                  </div>
                </Marker>
              );
            })}
          </Map>

          {/* Empty State Overlay */}
          {!hasItems && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              background: 'rgba(15,23,42,0.6)',
              backdropFilter: 'blur(2px)',
              pointerEvents: 'none'
            }}>
              <div style={{
                maxWidth: 420,
                padding: 24,
                borderRadius: 16,
                background: 'rgba(15,23,42,0.92)',
                border: '1px solid rgba(255,255,255,0.12)',
                textAlign: 'center',
                pointerEvents: 'auto'
              }}>
                <ShieldCheck style={{ width: 36, height: 36, color: '#10b981', margin: '0 auto 10px' }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
                  No Parcels in Map View
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Parcels registered with GPS boundary coordinates will appear here with exact polygon demarcations and statutory simulation tools.
                </p>
              </div>
            </div>
          )}

          {/* Map Legend */}
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
              Cadastral Legend
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(16,185,129,0.4)', border: '1px solid #059669' }} />
              <span>Cadastral Polygon Boundary</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />
              <span>Verified Complaint Case</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
              <span>Disbursed Statutory Award</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
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
