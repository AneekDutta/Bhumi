'use client';

import React, { useState, useMemo } from 'react';
import Map, { Source, Layer, NavigationControl, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, Activity, AlertTriangle, ShieldCheck, Eye, Compass } from 'lucide-react';
import { ProvenanceBadge } from '@/components/common/ProvenanceBadge';
import { ParcelDetailModal } from '@/components/map/ParcelDetailModal';
import { useTheme } from '@/context/ThemeContext';

export type MapMode = 'NORMAL' | 'RISK' | 'CRITICAL_PATH';

interface CorridorTwinMapProps {
  geojson: any;
  onParcelSelect?: (parcel: any) => void;
  onSimulate?: (parcelId: string) => void;
  height?: string | number;
}

const DARK_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const LIGHT_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export function CorridorTwinMap({
  geojson,
  onParcelSelect,
  onSimulate,
  height = '620px'
}: CorridorTwinMapProps) {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const [mode, setMode] = useState<MapMode>('NORMAL');
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [hoveredFeature, setHoveredFeature] = useState<any>(null);

  // Derive dynamic map layer styles per mode (Section 13)
  const parcelLayerStyle: any = useMemo(() => {
    if (mode === 'NORMAL') {
      return {
        id: 'parcels-fill',
        type: 'fill',
        paint: {
          'fill-color': [
            'match',
            ['get', 'acquisition_status'],
            'possessed', '#10b981',      // Green
            'compensated', '#3b82f6',    // Blue
            'award_declared', '#f59e0b', // Amber
            'notified', '#8b5cf6',       // Purple
            'not_started', '#64748b',    // Grey
            '#ef4444'                    // Red (Disputed / Default)
          ],
          'fill-opacity': 0.65,
          'fill-outline-color': '#ffffff'
        }
      };
    }

    if (mode === 'RISK') {
      return {
        id: 'parcels-fill',
        type: 'fill',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'risk_score'],
            0, '#10b981',    // Low Risk: Green
            30, '#f59e0b',   // Medium Risk: Amber
            60, '#f97316',   // High Risk: Orange
            80, '#f43f5e'    // Critical Risk: Red
          ],
          'fill-opacity': 0.75,
          'fill-outline-color': '#ffffff'
        }
      };
    }

    // mode === 'CRITICAL_PATH'
    return {
      id: 'parcels-fill',
      type: 'fill',
      paint: {
        'fill-color': [
          'case',
          ['get', 'is_critical_path'],
          '#f43f5e', // Vibrant Crimson for zero-float critical path
          '#334155'  // Dim Slate for off-critical path
        ],
        'fill-opacity': [
          'case',
          ['get', 'is_critical_path'],
          0.85,
          0.15 // Dim non-critical parcels as requested in Section 13
        ],
        'fill-outline-color': [
          'case',
          ['get', 'is_critical_path'],
          '#fda4af',
          'rgba(255,255,255,0.1)'
        ]
      }
    };
  }, [mode]);

  const onMapClick = (event: any) => {
    const feature = event.features && event.features[0];
    if (feature && feature.properties) {
      setSelectedParcel(feature.properties);
      if (onParcelSelect) onParcelSelect(feature.properties);
    }
  };

  const onMouseMove = (event: any) => {
    const feature = event.features && event.features[0];
    if (feature && feature.properties) {
      setHoveredFeature({
        lngLat: event.lngLat,
        props: feature.properties
      });
    } else {
      setHoveredFeature(null);
    }
  };

  const centerCoordinates: [number, number] = geojson?.properties?.center || [75.98, 24.69];

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      {/* Mode Switcher Bar */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: 4,
          borderRadius: 10,
          background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(9, 13, 22, 0.85)',
          backdropFilter: 'blur(12px)',
          border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.12)',
          boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.08)' : '0 8px 32px rgba(0,0,0,0.6)'
        }}
      >
        <button
          onClick={() => setMode('NORMAL')}
          style={{
            padding: '6px 12px',
            borderRadius: 7,
            border: 'none',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'JetBrains Mono, monospace',
            cursor: 'pointer',
            background: mode === 'NORMAL' ? (isLight ? 'rgba(14, 165, 233, 0.15)' : 'rgba(56,189,248,0.2)') : 'transparent',
            color: mode === 'NORMAL' ? (isLight ? '#0284c7' : '#38bdf8') : (isLight ? '#64748b' : '#94a3b8'),
            transition: 'all 0.15s ease'
          }}
        >
          Normal Mode
        </button>

        <button
          onClick={() => setMode('RISK')}
          style={{
            padding: '6px 12px',
            borderRadius: 7,
            border: 'none',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'JetBrains Mono, monospace',
            cursor: 'pointer',
            background: mode === 'RISK' ? (isLight ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245,158,11,0.2)') : 'transparent',
            color: mode === 'RISK' ? (isLight ? '#d97706' : '#fbbf24') : (isLight ? '#64748b' : '#94a3b8'),
            transition: 'all 0.15s ease'
          }}
        >
          Risk Mode
        </button>

        <button
          onClick={() => setMode('CRITICAL_PATH')}
          style={{
            padding: '6px 12px',
            borderRadius: 7,
            border: 'none',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'JetBrains Mono, monospace',
            cursor: 'pointer',
            background: mode === 'CRITICAL_PATH' ? (isLight ? 'rgba(225, 29, 72, 0.12)' : 'rgba(244,63,94,0.2)') : 'transparent',
            color: mode === 'CRITICAL_PATH' ? (isLight ? '#e11d48' : '#f43f5e') : (isLight ? '#64748b' : '#94a3b8'),
            transition: 'all 0.15s ease'
          }}
        >
          Critical Path Mode
        </button>
      </div>

      {/* Top Right Reality / Corridor Badge */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 8,
          background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(9, 13, 22, 0.85)',
          backdropFilter: 'blur(12px)',
          border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.12)',
          boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
        }}
      >
        <span style={{ fontSize: 11, color: isLight ? '#0f172a' : '#e2e8f0', fontWeight: 600 }}>NH-927A Kota–Jhalawar Bypass</span>
        <ProvenanceBadge sourceType="SYNTHETIC" size="xs" />
      </div>

      {/* Map Canvas */}
      <Map
        initialViewState={{
          longitude: centerCoordinates[0],
          latitude: centerCoordinates[1],
          zoom: 12.8,
          pitch: 25,
          bearing: -15
        }}
        mapStyle={isLight ? LIGHT_MAP_STYLE : DARK_MAP_STYLE}
        interactiveLayerIds={['parcels-fill']}
        onClick={onMapClick}
        onMouseMove={onMouseMove}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="bottom-right" />

        {geojson && (
          <Source id="parcels-source" type="geojson" data={geojson}>
            <Layer {...parcelLayerStyle} />
          </Source>
        )}

        {/* Hover Tooltip */}
        {hoveredFeature && (
          <Popup
            longitude={hoveredFeature.lngLat.lng}
            latitude={hoveredFeature.lngLat.lat}
            closeButton={false}
            closeOnClick={false}
            offset={12}
            className="cadastral-popup"
          >
            <div style={{ padding: '4px 6px', fontSize: 11, color: '#0f172a' }}>
              <div style={{ fontWeight: 800, color: '#0f172a' }}>
                Survey {hoveredFeature.props.survey_number}
              </div>
              <div style={{ fontSize: 10, color: '#475569' }}>
                {hoveredFeature.props.village_name} • {hoveredFeature.props.area_hectares} ha
              </div>
              <div style={{ marginTop: 3, fontSize: 10 }}>
                Status:{' '}
                <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  {hoveredFeature.props.acquisition_status}
                </span>
              </div>
              {mode === 'RISK' && (
                <div style={{ marginTop: 2, fontSize: 10, color: '#dc2626', fontWeight: 700 }}>
                  Risk Score: {hoveredFeature.props.risk_score} / 100
                </div>
              )}
              {mode === 'CRITICAL_PATH' && (
                <div style={{ marginTop: 2, fontSize: 10, color: hoveredFeature.props.is_critical_path ? '#dc2626' : '#64748b', fontWeight: 700 }}>
                  {hoveredFeature.props.is_critical_path ? 'Zero-Float Blocker' : 'Off Critical Chain'}
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Legend Footer Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '8px 14px',
          borderRadius: 8,
          background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(9, 13, 22, 0.85)',
          backdropFilter: 'blur(10px)',
          border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
          boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
          fontSize: 11,
          color: isLight ? '#334155' : '#c4cfe4'
        }}
      >
        {mode === 'NORMAL' && (
          <>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> Possessed
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /> In Progress
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} /> Problem / Disputed
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#64748b' }} /> Not Started
            </span>
          </>
        )}

        {mode === 'RISK' && (
          <>
            <span style={{ color: '#94a3b8' }}>Risk Scale:</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> Low (&lt;25)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /> Medium (25–50)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }} /> High (50–75)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e' }} /> Critical (&ge;75)
            </span>
          </>
        )}

        {mode === 'CRITICAL_PATH' && (
          <>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f43f5e', fontWeight: 700 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 8px #f43f5e' }} />
              Critical Chain Parcels (Direct Gating Bottlenecks)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#334155' }} />
              Non-Critical (Dimmed)
            </span>
          </>
        )}
      </div>

      {/* Section 13 Parcel Detail Modal */}
      {selectedParcel && (
        <ParcelDetailModal
          parcel={selectedParcel}
          onClose={() => setSelectedParcel(null)}
          onSimulate={onSimulate}
        />
      )}
    </div>
  );
}
