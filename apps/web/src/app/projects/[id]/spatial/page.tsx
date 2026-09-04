'use client';



import React, { useEffect, useState } from 'react';

import Map, { Source, Layer, NavigationControl } from 'react-map-gl/maplibre';

import 'maplibre-gl/dist/maplibre-gl.css';

import { useParams } from 'next/navigation';

import Link from 'next/link';

import { apiClient } from '@/lib/api';



export default function SpatialIntelligencePage() {

  const params = useParams();

  const projectId = params.id as string;



  const [geojson, setGeojson] = useState<any>(null);

  const [clusters, setClusters] = useState<any[]>([]);

  const [selectedCluster, setSelectedCluster] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);



  useEffect(() => {

    async function loadData() {

      setLoading(true);

      setError(null);

      try {

        const [geoData, clusData] = await Promise.all([

          apiClient.getSpatialGeojson(projectId),

          apiClient.getSpatialClusters(projectId),

        ]);

        setGeojson(geoData);

        setClusters(clusData || []);

      } catch {

        setError('Failed to load spatial corridor data. Verify service availability.');

      } finally {

        setLoading(false);

      }

    }

    if (projectId) {

      loadData();

    }

  }, [projectId]);



  // Layer styles

  const segmentStyle: any = {

    id: 'segments',

    type: "line" as const,

    paint: {

      'line-color': '#1E3A8A', // slate-900 / dark blue

      'line-width': 5

    }

  };



  const parcelResolvedStyle: any = {

    id: 'parcels-resolved',

    type: "fill" as const,

    filter: ['==', 'status', 'RESOLVED'],

    paint: {

      'fill-color': '#059669', // emerald-600

      'fill-opacity': 0.45,

      'fill-outline-color': '#064E3B'

    }

  };



  const parcelUnresolvedStyle: any = {

    id: 'parcels-unresolved',

    type: "fill" as const,

    filter: ['==', 'status', 'UNRESOLVED'],

    paint: {

      'fill-color': '#DC2626', // red-600

      'fill-opacity': 0.45,

      'fill-outline-color': '#7F1D1D'

    }

  };



  // Convert clusters to geojson for highlights

  const clusterFeatures = (clusters || []).map(c => ({

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

      'line-color': '#D97706', // amber-600

      'line-width': 3,

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

    <div className="space-y-6">

      {/* Breadcrumb Navigation */}

      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500">

        <Link href="/" className="hover:text-indigo-600">Dashboard</Link>

        <span>/</span>

        <Link href="/projects" className="hover:text-indigo-600">Projects</Link>

        <span>/</span>

        <Link href={`/projects/${projectId}`} className="hover:text-indigo-600 font-mono">

          {projectId.substring(0, 8)}

        </Link>

        <span>/</span>

        <span className="text-slate-800 font-medium">Spatial Intelligence</span>

      </nav>



      {/* Heading */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">

        <div>

          <div className="flex flex-wrap items-center gap-3">

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">

              Corridor Spatial Intelligence

            </h1>

            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded border border-amber-300 font-medium">

              Synthetic Demo Data

            </span>

          </div>

          <p className="mt-1 text-sm text-slate-600">

            Contiguous unresolved parcel clusters, alignment intersections, and attributable schedule blockages.

          </p>

        </div>



        <div className="flex items-center gap-2">

          <Link

            href={`/projects/${projectId}/impact`}

            className="px-3.5 py-2 bg-indigo-600 text-white text-xs sm:text-sm font-semibold rounded shadow-sm hover:bg-indigo-700"

          >

            Impact & Simulation →

          </Link>

        </div>

      </div>



      {loading && (

        <div className="p-8 text-center bg-white border border-slate-200 rounded-lg text-sm text-slate-500">

          Loading spatial GIS alignment layers...

        </div>

      )}



      {error && (

        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-start gap-2.5">

          <span className="font-bold text-red-600">!</span>

          <div>

            <p className="font-semibold">Failed to Load Spatial Data</p>

            <p className="text-xs text-red-700 mt-0.5">{error}</p>

          </div>

        </div>

      )}



      {!loading && !error && geojson && (

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Map View */}

          <div className="lg:col-span-2 h-[420px] sm:h-[540px] rounded-lg overflow-hidden border border-slate-200 shadow-sm relative bg-slate-100">

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

              <NavigationControl position="top-right" />



              {/* Segments Layer */}

              {geojson.segments && (

                <Source id="segments-src" type="geojson" data={geojson.segments}>

                  <Layer {...segmentStyle} />

                </Source>

              )}



              {/* Parcels Layer */}

              {geojson.parcels && (

                <Source id="parcels-src" type="geojson" data={geojson.parcels}>

                  <Layer {...parcelResolvedStyle} />

                  <Layer {...parcelUnresolvedStyle} />

                </Source>

              )}



              {/* Clusters Layer */}

              {clusterGeojson.features.length > 0 && (

                <Source id="clusters-src" type="geojson" data={clusterGeojson}>

                  <Layer {...clusterHighlightStyle} />

                </Source>

              )}

            </Map>



            {/* Map Legend Overlay */}

            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-slate-200 p-2.5 rounded shadow text-[11px] space-y-1.5 z-10 text-slate-700">

              <div className="font-semibold text-slate-900 uppercase tracking-wider text-[10px] mb-1">Legend</div>

              <div className="flex items-center gap-2">

                <div className="w-3.5 h-3.5 bg-red-600 opacity-60 border border-red-900 rounded-sm" />

                <span>Unresolved Parcel</span>

              </div>

              <div className="flex items-center gap-2">

                <div className="w-3.5 h-3.5 bg-emerald-600 opacity-60 border border-emerald-900 rounded-sm" />

                <span>Resolved Parcel</span>

              </div>

              <div className="flex items-center gap-2">

                <div className="w-3.5 h-1 border-t-2 border-dashed border-amber-600" />

                <span>Contiguous Cluster</span>

              </div>

              <div className="flex items-center gap-2">

                <div className="w-3.5 h-1 bg-blue-900 rounded-sm" />

                <span>Project Corridor</span>

              </div>

            </div>

          </div>



          {/* Cluster Details Panel */}

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">

            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white">

              <h2 className="text-base font-bold tracking-tight">Cluster Inspection</h2>

              <p className="text-xs text-slate-300 mt-0.5">Click any dashed orange cluster boundary to analyze</p>

            </div>



            <div className="p-5 flex-1 overflow-y-auto max-h-[480px]">

              {!selectedCluster ? (

                <div className="text-slate-500 text-sm space-y-3">

                  <p>

                    Select an identified spatial cluster on the map to inspect intersecting corridor segments, affected survey numbers, and attributable critical path delays.

                  </p>

                  <div className="pt-4 border-t border-slate-100 text-xs">

                    <span className="font-semibold text-slate-700">Total Clusters Detected:</span>{' '}

                    <span className="font-mono font-bold text-indigo-700">{clusters.length}</span>

                  </div>

                </div>

              ) : (

                <div className="space-y-5">

                  <div>

                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">Selected Entity</span>

                    <h3 className="text-lg font-bold text-slate-900">Cluster {selectedCluster.cluster_id}</h3>

                    <p className="text-xs text-slate-600 mt-0.5">

                      Intersecting Segment: <strong className="text-slate-800">{selectedCluster.segment.name}</strong>

                    </p>

                  </div>



                  <div>

                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">

                      Parcels in Cluster ({selectedCluster.survey_nos.length})

                    </h4>

                    <div className="flex flex-wrap gap-1.5">

                      {selectedCluster.survey_nos.map((s: string, i: number) => (

                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-800 text-xs font-mono rounded border border-slate-200">

                          {s}

                        </span>

                      ))}

                    </div>

                  </div>



                  <div>

                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">

                      Attributable Schedule Impact

                    </h4>

                    <div className="space-y-2.5">

                      {selectedCluster.activities.map((act: any, i: number) => (

                        <div

                          key={i}

                          className={`p-3 rounded border text-xs ${

                            act.delay_days > 0

                              ? 'border-red-200 bg-red-50 text-red-900'

                              : 'border-slate-200 bg-slate-50 text-slate-800'

                          }`}

                        >

                          <div className="font-semibold">{act.activity_name}</div>

                          <div className={`mt-1 font-mono ${act.delay_days > 0 ? 'text-red-700 font-bold' : 'text-slate-500'}`}>

                            {act.delay_days > 0 ? `Critical Delay: +${act.delay_days} Days` : 'Zero Path Delay'}

                          </div>



                          {act.causal_path && act.causal_path.length > 0 && (

                            <div className="mt-2.5 pt-2 border-t border-red-100 space-y-1">

                              <span className="text-[10px] uppercase font-bold text-red-700">Causal Path:</span>

                              {act.causal_path.map((hop: string, idx: number) => (

                                <div key={idx} className="text-[11px] text-red-950 flex items-start gap-1">

                                  <span className="text-red-400">↳</span>

                                  <span>{hop}</span>

                                </div>

                              ))}

                            </div>

                          )}

                        </div>

                      ))}

                      {selectedCluster.activities.length === 0 && (

                        <p className="text-xs text-slate-500 italic">No direct CPM activities constrained by this cluster.</p>

                      )}

                    </div>

                  </div>

                </div>

              )}

            </div>

          </div>

        </div>

      )}

    </div>

  );

}
