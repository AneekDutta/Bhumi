'use client';

import React, { useEffect, useState } from 'react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useParams } from 'next/navigation';

export default function SpatialIntelligencePage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [geojson, setGeojson] = useState<any>(null);
  const [clusters, setClusters] = useState<any[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const geoRes = await fetch(`http://localhost:8000/api/v1/spatial/projects/${projectId}/geojson`);
      const geoData = await geoRes.json();
      setGeojson(geoData);

      const clusRes = await fetch(`http://localhost:8000/api/v1/spatial/projects/${projectId}/clusters`);
      const clusData = await clusRes.json();
      setClusters(clusData);
    }
    loadData();
  }, [projectId]);

  if (!geojson) {
    return <div className="p-8">Loading spatial data...</div>;
  }

  // Layer styles
  const segmentStyle: any = {
    id: 'segments',
    type: "line" as const,
    paint: {
      'line-color': '#1E40AF', // blue-800
      'line-width': 4
    }
  };

  const parcelResolvedStyle: any = {
    id: 'parcels-resolved',
    type: "fill" as const,
    filter: ['==', 'status', 'RESOLVED'],
    paint: {
      'fill-color': '#10B981', // green-500
      'fill-opacity': 0.4,
      'fill-outline-color': '#064E3B'
    }
  };

  const parcelUnresolvedStyle: any = {
    id: 'parcels-unresolved',
    type: "fill" as const,
    filter: ['==', 'status', 'UNRESOLVED'],
    paint: {
      'fill-color': '#EF4444', // red-500
      'fill-opacity': 0.4,
      'fill-outline-color': '#7F1D1D'
    }
  };

  // Convert clusters to geojson for highlights
  const clusterFeatures = clusters.map(c => ({
    type: 'Feature',
    geometry: c.geometry,
    properties: { cluster_id: c.cluster_id }
  })).filter(c => c.geometry);

  const clusterGeojson = {
    type: 'FeatureCollection',
    features: clusterFeatures
  };

  const clusterHighlightStyle = {
    id: 'cluster-highlight',
    type: "line" as const,
    paint: {
      'line-color': '#F59E0B', // amber-500
      'line-width': 4,
      'line-dasharray': [2, 2]
    }
  };

  const handleMapClick = (event: any) => {
    const feature = event.features?.[0];
    if (feature && feature.layer.id === 'cluster-highlight') {
      const cId = feature.properties.cluster_id;
      const cluster = clusters.find(c => c.cluster_id === cId);
      setSelectedCluster(cluster);
    } else {
      setSelectedCluster(null);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <div className="flex-1 relative">
        <Map
          initialViewState={{
            longitude: 73.85,
            latitude: 18.5,
            zoom: 12
          }}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          interactiveLayerIds={['cluster-highlight']}
          onClick={handleMapClick}
        >
          {/* Segments Layer */}
          <Source id="segments-src" type="geojson" data={geojson.segments}>
            <Layer {...segmentStyle} />
          </Source>

          {/* Parcels Layer */}
          <Source id="parcels-src" type="geojson" data={geojson.parcels}>
            <Layer {...parcelResolvedStyle} />
            <Layer {...parcelUnresolvedStyle} />
          </Source>

          {/* Clusters Layer */}
          <Source id="clusters-src" type="geojson" data={clusterGeojson}>
            <Layer {...clusterHighlightStyle} />
          </Source>
        </Map>
      </div>

      <div className="w-96 bg-white border-l border-slate-200 overflow-y-auto shadow-xl z-10 flex flex-col">
        <div className="p-6 border-b border-slate-200 bg-slate-900 text-white">
          <h1 className="text-xl font-bold tracking-tight">Spatial Intelligence</h1>
          <p className="text-sm text-slate-300 mt-1">Contiguous Land Blockage Analysis</p>
        </div>
        
        <div className="p-6 flex-1">
          {!selectedCluster ? (
            <div className="text-slate-500 text-sm">
              <p className="mb-4">Select a highlighted cluster (dashed orange border) on the map to view operational impact.</p>
              <div className="space-y-2 mt-8">
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 opacity-40 border border-red-900"></div> Unresolved Parcel</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 opacity-40 border border-green-900"></div> Resolved Parcel</div>
                <div className="flex items-center gap-2"><div className="w-4 h-0 border-t-4 border-dashed border-amber-500"></div> Contiguous Blockage</div>
                <div className="flex items-center gap-2"><div className="w-4 h-1 bg-blue-800"></div> Project Corridor</div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Cluster {selectedCluster.cluster_id}</h2>
                <p className="text-sm text-slate-500 mt-1">Intersecting <strong>{selectedCluster.segment.name}</strong></p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Parcels in Cluster</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCluster.survey_nos.map((s: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-mono rounded border border-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Schedule Impact</h3>
                <div className="space-y-3">
                  {selectedCluster.activities.map((act: any, i: number) => (
                    <div key={i} className={`p-3 rounded-md border ${act.delay_days > 0 ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="font-medium text-sm text-slate-900">{act.activity_name}</div>
                      <div className={`text-xs mt-1 ${act.delay_days > 0 ? 'text-red-700 font-semibold' : 'text-slate-500'}`}>
                        {act.delay_days > 0 ? `Critical Delay: +${act.delay_days} Days` : 'No Critical Impact'}
                      </div>
                      
                      {act.causal_path && act.causal_path.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-red-100">
                          <div className="text-[10px] uppercase text-red-800 font-semibold mb-1">Causal Path</div>
                          <div className="text-xs text-red-900 space-y-1">
                            {act.causal_path.map((hop: string, idx: number) => (
                              <div key={idx} className="flex gap-2">
                                <span className="text-red-400">↳</span>
                                <span>{hop}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
