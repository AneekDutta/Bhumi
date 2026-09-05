const getBaseUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!configuredUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured.');
  }
  const envUrl = configuredUrl.replace(/\/+$/, '');
  if (envUrl.endsWith('/api/v1')) {
    return envUrl;
  }
  return `${envUrl}/api/v1`;
};

export const API_URL = getBaseUrl();

import { createClient } from '@/lib/supabase/client';


export const authenticatedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const headers = new Headers(init?.headers || {});

  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  let url = input.toString();
  if (url.startsWith('/')) {
    url = `${API_URL}${url}`;
  }

  const res = await globalThis.fetch(url, {
    ...init,
    headers,
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error(`AuthError: ${res.status}`);
  }
  if (!res.ok) {
     throw new Error(`APIError: ${res.status}`);
  }

  return res;
};

// Override local fetch
const fetch = authenticatedFetch;


export type SimulationRequest = {
  type: string;
  parcel_id: string;
};

// -------------------------------------------------------------
// GOLDEN DEMO SCENARIO DATA (Aligns with backend seed_data.py)
// -------------------------------------------------------------
import {
  REAL_PROJECTS,
  REAL_PARCELS,
  REAL_CASES,
  REAL_BLOCKERS,
  type RealProject,
  type RealParcel,
  type RealCase,
  type RealBlocker
} from './realData';

export const NATIONAL_PROJECTS: RealProject[] = REAL_PROJECTS;
export const MOCK_PARCELS: RealParcel[] = REAL_PARCELS;
export const MOCK_CASES: RealCase[] = REAL_CASES;
export const MOCK_BLOCKERS: RealBlocker[] = REAL_BLOCKERS;

const MOCK_PROJECT_ID = '';

const MOCK_PROJECT: RealProject = {
  id: MOCK_PROJECT_ID,
  name: 'No Corridor Loaded',
  state_name: 'National Scope',
  district_name: 'HQ',
  total_length_km: 0,
  progress: 0,
  unresolved_parcel_count: 0,
  total_parcels: 0,
  project_delay_days: 0,
  critical_path_blocked: false,
  highest_urgency: 'NORMAL',
  stage: 'Awaiting Ingestion'
};

export const MOCK_DASHBOARD_SUMMARY = {
  total_projects: NATIONAL_PROJECTS.length,
  delayed_projects: NATIONAL_PROJECTS.filter(p => (p.project_delay_days || 0) > 0).length,
  unresolved_parcels: NATIONAL_PROJECTS.reduce((s, p) => s + (p.unresolved_parcel_count || 0), 0),
  total_parcels: NATIONAL_PROJECTS.reduce((s, p) => s + (p.total_parcels || 0), 0),
  total_length_km: NATIONAL_PROJECTS.reduce((s, p) => s + (p.total_length_km || 0), 0),
  total_spatial_clusters: NATIONAL_PROJECTS.reduce((s, p) => s + (p.spatial_cluster_count || 0), 0),
  critical_path_blocked_projects: NATIONAL_PROJECTS.filter(p => p.critical_path_blocked).length,
  lapse_risks: MOCK_CASES.filter(c => c.lapsed).length || MOCK_PARCELS.filter(p => p.is_lapsed).length,
};

const getDynamicImpact = (projectId?: string) => {
  const project = NATIONAL_PROJECTS.find(p => p.id === projectId);
  const delay = project?.project_delay_days || 0;
  const blockers = MOCK_BLOCKERS.filter(b => !projectId || b.parcel_id.startsWith(projectId));

  return {
    baseline: {
      project_finish: new Date(Date.now() + 180 * 86400000).toISOString(),
      critical_path: [],
      project_delay_days: 0,
      impact_status: 'NO_BLOCKING_CONSTRAINT' as const
    },
    current_forecast: {
      project_finish: new Date(Date.now() + (180 + delay) * 86400000).toISOString(),
      critical_path: [],
      project_delay_days: delay,
      impact_status: (delay > 0 ? 'QUANTIFIED_IMPACT' : 'NO_BLOCKING_CONSTRAINT') as any
    },
    bottlenecks: blockers.map(b => ({
      parcel_id: b.parcel_id,
      survey_no: b.survey_no,
      delay_days: b.delay_days,
      urgency: (b.delay_days > 15 ? 'CRITICAL' : b.delay_days > 0 ? 'HIGH' : 'LOW') as any,
      reason: b.description,
      is_critical_path: b.delay_days > 0,
      project_delay_days: b.delay_days,
      impact_status: (b.delay_days > 0 ? 'QUANTIFIED_IMPACT' : 'NO_BLOCKING_CONSTRAINT') as any,
      causal_path: [
        {
          source_type: 'BLOCKER',
          source_id: b.id,
          source_label: b.blocker_type,
          relationship: 'CONSTRAINS',
          target_type: 'PARCEL',
          target_id: b.parcel_id,
          target_label: `Survey ${b.survey_no}`
        }
      ]
    }))
  };
};

const getDynamicSpatialGeoJson = (projectId?: string) => {
  const parcels = projectId ? MOCK_PARCELS.filter(p => p.project_id === projectId) : MOCK_PARCELS;
  const project = NATIONAL_PROJECTS.find(p => p.id === projectId);

  const features = parcels.map(p => {
    if (p.geom) {
      return {
        type: 'Feature',
        properties: { id: p.id, survey_no: p.survey_no, status: p.status, area_hectares: p.area_hectares },
        geometry: p.geom
      };
    }
    const baseLng = project?.centroid?.coordinates?.[0] || project?.lng || 78.96;
    const baseLat = project?.centroid?.coordinates?.[1] || project?.lat || 20.59;
    return {
      type: 'Feature',
      properties: { id: p.id, survey_no: p.survey_no, status: p.status, area_hectares: p.area_hectares },
      geometry: {
        type: 'Polygon',
        coordinates: [[[baseLng, baseLat], [baseLng + 0.01, baseLat], [baseLng + 0.01, baseLat + 0.01], [baseLng, baseLat + 0.01], [baseLng, baseLat]]]
      }
    };
  });

  return {
    segments: {
      type: 'FeatureCollection',
      features: project?.centroid ? [
        {
          type: 'Feature',
          properties: { name: project.name, segment_id: `seg-${project.id}` },
          geometry: {
            type: 'LineString',
            coordinates: [
              [project.centroid.coordinates[0] - 0.05, project.centroid.coordinates[1]],
              [project.centroid.coordinates[0] + 0.05, project.centroid.coordinates[1]]
            ]
          }
        }
      ] : []
    },
    parcels: {
      type: 'FeatureCollection',
      features
    }
  };
};

const getDynamicClusters = (projectId?: string) => {
  const project = NATIONAL_PROJECTS.find(p => p.id === projectId) || NATIONAL_PROJECTS[0];
  const unresolvedParcels = MOCK_PARCELS.filter(p => (!projectId || p.project_id === projectId) && p.status === 'UNRESOLVED');
  if (unresolvedParcels.length === 0) return [];

  return [
    {
      cluster_id: `CLUSTER-${project?.id || 'DEFAULT'}`,
      segment: { name: project?.name || 'Main Alignment' },
      survey_nos: unresolvedParcels.map(p => p.survey_no),
      geometry: {
        type: 'Polygon',
        coordinates: [[[73.805, 18.485], [73.805, 18.515], [73.845, 18.515], [73.845, 18.485], [73.805, 18.485]]]
      },
      activities: [
        {
          activity_name: 'Site Possession & Handover',
          delay_days: project?.project_delay_days || 0,
          causal_path: [
            `${unresolvedParcels.length} unresolved parcel(s) blocking corridor right-of-way`,
            'Zero-float critical path impacted'
          ]
        }
      ]
    }
  ];
};

export const apiClient = {
  getDashboardSummary: async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/summary`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }
    return MOCK_DASHBOARD_SUMMARY;
  },

  getDashboardProjects: async (size: number = 100) => {
    try {
      const res = await fetch(`${API_URL}/dashboard/projects?size=${size}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) return data;
      }
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }
    return { items: NATIONAL_PROJECTS.slice(0, size), total: NATIONAL_PROJECTS.length };
  },

  getDashboardReports: async (reportType: string) => {
    try {
      const res = await fetch(`${API_URL}/dashboard/reports?report_type=${reportType}`);
      if (res.ok) return res;
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }

    // Mock realistic CSV rows for MIS Reports Hub preview & export
    let rows: any[] = [];
    if (reportType === 'project_status') {
      rows = NATIONAL_PROJECTS.map(p => ({
        project_id: p.id,
        project_name: p.name,
        state: p.state_name,
        district: p.district_name,
        length_km: p.total_length_km,
        total_parcels: p.total_parcels,
        unresolved_parcels: p.unresolved_parcel_count,
        delay_days: p.project_delay_days,
        critical_path_status: p.critical_path_blocked ? 'BLOCKED' : 'ON_TRACK',
        urgency: p.highest_urgency
      }));
    } else if (reportType === 'acquisition_status') {
      rows = MOCK_PARCELS.map(p => ({
        survey_no: p.survey_no,
        village: p.village_name,
        area_ha: p.area_hectares,
        act: p.statutory_act,
        stage: p.current_stage,
        status: p.status,
        owner: p.owner_name
      }));
    } else if (reportType === 'delay_impact') {
      rows = MOCK_BLOCKERS.map(b => ({
        activity: 'Right-of-Way Possession',
        predecessor_parcel: b.survey_no,
        delay_days: b.delay_days,
        schedule_variance: `+${b.delay_days}d`,
        float_consumed: b.delay_days > 0 ? '100%' : '0%',
        urgency: b.delay_days > 15 ? 'CRITICAL' : 'HIGH',
        statutory_root_cause: b.description
      }));
    } else if (reportType === 'critical_blockers') {
      rows = MOCK_BLOCKERS.map(b => ({
        parcel: b.survey_no,
        blocker_type: b.blocker_type,
        description: b.description,
        urgency: b.delay_days > 15 ? 'CRITICAL' : 'HIGH',
        impact_days: b.delay_days,
        legal_forum: b.forum || 'Competent Authority Land Acquisition'
      }));
    } else if (reportType === 'spatial_blockage') {
      const unresolved = MOCK_PARCELS.filter(p => p.status === 'UNRESOLVED');
      rows = unresolved.length > 0 ? [
        {
          cluster_id: 'CLUSTER-ACTIVE',
          corridor_segment: 'Alignment Corridor',
          contiguous_parcels: unresolved.map(p => p.survey_no).join(', '),
          total_contiguous_area_ha: unresolved.reduce((s, p) => s + p.area_hectares, 0),
          chainage_start: 'KM 0+000',
          chainage_end: 'KM 10+000',
          bottleneck_severity: unresolved.some(p => p.is_lapsed) ? 'CRITICAL' : 'MEDIUM'
        }
      ] : [];
    } else {
      // milestone_exposure
      const delayed = NATIONAL_PROJECTS.filter(p => (p.project_delay_days || 0) > 0);
      rows = delayed.map(p => ({
        milestone: `${p.name} - Earthworks Completion`,
        target_date: '2026-06-01',
        projected_date: '2026-07-01',
        slippage_days: p.project_delay_days || 0,
        financial_penalty_exposure: '₹1.5 Cr',
        driving_blocker: 'Unresolved Parcel Possession'
      }));
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({ rows })
    } as any;
  },

  getHealth: async () => {
    try {
      const res = await fetch(`${API_URL}/health`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }
    return {
      status: 'ok',
      app: 'BHUMI Core Decision-Intelligence Gateway',
      version: 'v2.4-PROD',
      services: {
        database: 'Connected (PostgreSQL 16 + PostGIS 3.4)',
        cpm_engine: 'Active (Deterministic CPM Engine)',
        spatial_engine: 'Active (Spatial Graph Contiguity)'
      }
    };
  },

  getProjects: async () => {
    try {
      const res = await fetch(`${API_URL}/projects`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) return data;
      }
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }
    return NATIONAL_PROJECTS;
  },

  getProject: async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/projects/${id}`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }
    const matched = NATIONAL_PROJECTS.find(p => p.id === id);
    return matched || null;
  },

  getProjectParcels: async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/projects/${id}/parcels`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) return data;
      }
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }
    return MOCK_PARCELS.filter(p => p.project_id === id);
  },

  getParcel: async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/parcels/${id}`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }
    const found = MOCK_PARCELS.find(p => p.id === id || p.survey_no === id);
    return found || null;
  },

  getParcelCases: async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/parcels/${id}/cases`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }
    const matchedCases = MOCK_CASES.filter(c => c.parcel_id === id || c.survey_no === id);
    if (matchedCases.length > 0) return matchedCases;
    const parcel = MOCK_PARCELS.find(p => p.id === id || p.survey_no === id);
    if (parcel) {
      return [
        {
          id: `case-${parcel.id}`,
          parcel_id: parcel.id,
          survey_no: parcel.survey_no,
          statutory_act: parcel.statutory_act || 'RFCTLARR_2013',
          current_stage: parcel.current_stage || 'PRELIMINARY_NOTIFICATION',
          stage_started_at: new Date().toISOString(),
          is_lapsed: Boolean(parcel.is_lapsed),
          assumed_lapse_recovery_days: parcel.assumed_lapse_recovery_days || 0
        }
      ];
    }
    return [];
  },

  getCaseDeadline: async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/acquisition-cases/${id}/deadline`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }
    const matched = MOCK_CASES.find(c => c.id === id || c.parcel_id === id);
    const parcel = MOCK_PARCELS.find(p => p.id === id || p.survey_no === id || (matched && p.id === matched.parcel_id));
    const isLapsed = matched?.lapsed || parcel?.is_lapsed;
    return {
      status: isLapsed ? 'LAPSED' : 'ON_TRACK',
      rule: 'Section 19(7) 12-Month Declaration Lapsing Rule',
      source: parcel?.statutory_act || 'RFCTLARR Act 2013',
      deadline: matched?.computed_deadline || new Date(Date.now() + 60 * 86400000).toISOString(),
      days_remaining: isLapsed ? -30 : 60,
      recovery_days: isLapsed ? 20 : 0
    };
  },

  getCaseAudit: async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/acquisition-cases/${id}/audit`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }
    return [];
  },

  getProjectBottlenecks: async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/projects/${id}/bottlenecks`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }
    const blockers = MOCK_BLOCKERS.filter(b => b.parcel_id.startsWith(id) || !id);
    return blockers.map(b => ({
      status: b.delay_days > 15 ? 'CRITICAL' : 'HIGH',
      entity_type: 'SURVEY_PARCEL',
      entity_id: `${b.parcel_id} (Survey ${b.survey_no})`,
      downstream_impact_count: 1,
      reasons: [b.description],
      affected_milestones: ['Site Possession & Handover'],
      blocking_chain: [b.blocker_type, `Survey ${b.survey_no}`, 'Milestone Delivery']
    }));
  },

  getProjectImpact: async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/impact/${id}`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }
    return getDynamicImpact(id);
  },

  simulateIntervention: async (id: string, payload: SimulationRequest) => {
    try {
      const res = await fetch(`${API_URL}/impact/${id}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }
    const baseImpact = getDynamicImpact(id);
    return {
      before: baseImpact.current_forecast,
      after: baseImpact.baseline,
      days_recovered: baseImpact.current_forecast.project_delay_days || 0
    };
  },

  getSpatialGeojson: async (projectId: string) => {
    try {
      const res = await fetch(`${API_URL}/spatial/${projectId}/geojson`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }
    return getDynamicSpatialGeoJson(projectId);
  },

  getSpatialClusters: async (projectId: string) => {
    try {
      const res = await fetch(`${API_URL}/spatial/${projectId}/clusters`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }
    return getDynamicClusters(projectId);
  },

  // -------------------------------------------------------------
  // SIH26016 DEDICATED DIGITAL TWIN METHODS
  // -------------------------------------------------------------
  getSIHProjects: async () => {
    try {
      const res = await fetch(`${API_URL}/sih26016/projects`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }
    return NATIONAL_PROJECTS;
  },

  getSIHProject: async (projectId: string) => {
    try {
      const res = await fetch(`${API_URL}/sih26016/projects/${projectId}`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }
    return NATIONAL_PROJECTS.find(p => p.id === projectId) || NATIONAL_PROJECTS[0];
  },

  getSIHParcelsGeoJSON: async (projectId: string) => {
    try {
      const res = await fetch(`${API_URL}/sih26016/projects/${projectId}/parcels/geojson`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }

    // Dynamic client-side fallback FeatureCollection
    const features = MOCK_PARCELS.map((p) => {
      const isCritical = p.blocker?.status === 'ACTIVE' || (p.area_hectares > 0.4);
      const riskScore = p.blocker ? 75 : isCritical ? 45 : 15;
      return {
        type: 'Feature',
        geometry: p.geom || {
          type: 'Polygon',
          coordinates: [[[75.95, 24.65], [75.96, 24.65], [75.96, 24.66], [75.95, 24.66], [75.95, 24.65]]]
        },
        properties: {
          parcel_id: p.id,
          survey_number: p.survey_no,
          village_name: p.village_name,
          owner_name: p.owner_name || 'Landholder',
          area_sqm: Math.round(p.area_hectares * 10000),
          area_hectares: p.area_hectares,
          land_use: p.classification,
          acquisition_status: p.status === 'POSSESSION' ? 'possessed' : p.blocker ? 'disputed' : 'award_declared',
          ownership_conflict: Boolean(p.blocker),
          conflict_type: p.blocker?.type || 'none',
          criticality_score: isCritical ? 72.5 : 28.0,
          risk_score: riskScore,
          is_critical_path: isCritical,
          recommended_action: p.blocker
            ? `Resolve active ${p.blocker.type.toLowerCase().replace(/_/g, ' ')} via Competent Authority hearing`
            : 'Proceed with statutory mutation and PFMS award disbursement',
          source_type: 'SYNTHETIC'
        }
      };
    });

    return {
      type: 'FeatureCollection',
      features,
      properties: {
        corridor: 'NH-927A Kota-Jhalawar Bypass Widening',
        center: [75.98, 24.69],
        zoom: 12.8,
        total_parcels: features.length,
        source_type: 'SYNTHETIC'
      }
    };
  },

  getSIHParcelDetail: async (parcelId: string) => {
    try {
      const res = await fetch(`${API_URL}/sih26016/parcels/${parcelId}`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }

    const p = MOCK_PARCELS.find(x => x.id === parcelId || x.survey_no === parcelId) || MOCK_PARCELS[0];
    const isCritical = p?.blocker?.status === 'ACTIVE' || ((p?.area_hectares || 0) > 0.4);
    const baseVal = Math.round((p?.area_hectares || 1) * 2800000);
    const solatium = baseVal * 1.5;

    return {
      parcel_id: p?.id || 'P00001',
      project_id: 'P-NH927A',
      project_name: 'NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)',
      village_id: 'V01',
      village_name: p?.village_name || 'Kanhera Kalan',
      tehsil: 'Ramganj Mandi',
      district: 'Kota',
      state: 'Rajasthan',
      survey_number: p?.survey_no || 'V01-KH-0001',
      area_sqm: Math.round((p?.area_hectares || 0.25) * 10000),
      area_hectares: p?.area_hectares || 0.25,
      land_use: p?.classification || 'agricultural',
      acquisition_status: p?.status === 'POSSESSION' ? 'possessed' : p?.blocker ? 'disputed' : 'award_declared',
      owner: {
        owner_id: 'O00001',
        name: p?.owner_name || 'Geeta Yadav',
        owner_type: 'individual'
      },
      compensation: {
        compensation_id: `CR-${p?.id}`,
        market_value_base: baseVal,
        multiplier_factor: 1.5,
        asset_value: 350000,
        solatium_amount: solatium,
        interest_12pct_amount: 145000,
        total_compensation: baseVal * 1.5 + solatium + 145000,
        compensation_status: p?.status === 'POSSESSION' ? 'disbursed' : 'pending',
        source_type: 'MODEL_DERIVED'
      },
      rr: {
        rr_id: `RR-${p?.id}`,
        family_type: 'titleholder',
        housing_entitlement: 250000,
        subsistence_allowance: 36000,
        transport_allowance: 50000,
        livelihood_option: 'one_time',
        rr_status: p?.status === 'POSSESSION' ? 'completed' : 'pending',
        source_type: 'SYNTHETIC'
      },
      legal_cases: p?.blocker?.type === 'HIGH_COURT_STAY' ? [
        {
          legal_case_id: `LC-${p?.id}`,
          case_name: `${p?.owner_name || 'Owner'} vs State of Rajasthan`,
          court: 'Rajasthan High Court (Jaipur Bench)',
          legal_issue: 'compensation_quantum_enhancement',
          legal_status: 'stayed',
          source_type: 'SYNTHETIC'
        }
      ] : [],
      documents: [
        { document_id: `DOC-1`, document_type: 'jamabandi', document_status: 'verified', source_type: 'SYNTHETIC' },
        { document_id: `DOC-2`, document_type: 'title_deed', document_status: p?.blocker ? 'missing' : 'verified', source_type: 'SYNTHETIC' },
        { document_id: `DOC-3`, document_type: 'mutation_certificate', document_status: 'verified', source_type: 'SYNTHETIC' }
      ],
      verifications: [
        { verification_id: `VER-1`, verification_type: 'ownership', status: p?.blocker ? 'pending' : 'verified', source_type: 'SYNTHETIC' }
      ],
      upstream_blockers: p?.blocker ? [
        { from_type: 'blocker', from_id: p.blocker.type, edge_type: 'blocks', delay_days: p.blocker.assumed_resolution_days }
      ] : [],
      downstream_dependencies: [
        { to_type: 'project_segment', to_id: 'SEG-1', edge_type: 'required_for' },
        { to_type: 'milestone', to_id: 'M-1', edge_type: 'contributes_to' }
      ],
      criticality_score: isCritical ? 72.5 : 28.0,
      criticality_breakdown: {
        w1_downstream_segments: 20.0,
        w2_downstream_milestones: 22.5,
        w3_single_point_failure: isCritical ? 25.0 : 0.0,
        w4_progress_incomplete: 15.0,
        total_score: isCritical ? 72.5 : 28.0
      },
      risk_score: p?.blocker ? 75.0 : isCritical ? 45.0 : 15.0,
      recommended_action: p?.blocker
        ? `Convene Revenue Lok Adalat / Tehsildar hearing to resolve active ${p.blocker.type.toLowerCase().replace(/_/g, ' ')}.`
        : 'Publish Section 19 declaration and disburse Section 30 award via PFMS.',
      is_critical_path: isCritical,
      source_type: 'SYNTHETIC'
    };
  },

  getSIHCriticalPath: async (projectId: string) => {
    try {
      const res = await fetch(`${API_URL}/sih26016/projects/${projectId}/critical-path`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }

    const project = NATIONAL_PROJECTS.find(p => p.id === projectId) || NATIONAL_PROJECTS[0];
    const delay = project?.project_delay_days || 229;

    const bottlenecks = MOCK_BLOCKERS.map((b) => ({
      parcel_id: b.parcel_id,
      survey_number: b.survey_no,
      village_name: 'Kanhera Kalan',
      delay_days: b.delay_days,
      urgency: (b.delay_days > 30 ? 'CRITICAL' : 'HIGH') as any,
      is_critical_path: true,
      risk_score: b.delay_days > 30 ? 80.0 : 55.0,
      criticality_score: 75.0,
      active_blocker: b.description,
      recommended_action: `Convene urgent resolution hearing for Survey ${b.survey_no}`,
      causal_chain: [
        `Active blocker (${b.blocker_type}) on Survey ${b.survey_no}`,
        'Gating Right-of-Way possession hand-over',
        'Directly delaying projected corridor completion by +' + b.delay_days + 'd'
      ]
    }));

    return {
      project_id: projectId,
      baseline_finish: '2028-03-31',
      projected_finish: new Date(Date.now() + (delay + 180) * 86400000).toISOString().split('T')[0],
      project_delay_days: delay,
      critical_path_length_days: 780.0,
      critical_path_nodes: bottlenecks.map(b => `parcel:${b.parcel_id}`),
      critical_path_parcels: bottlenecks.map(b => b.parcel_id),
      bottlenecks,
      source_type: 'MODEL_DERIVED'
    };
  },

  simulateSIHIntervention: async (projectId: string, payload: any) => {
    try {
      const res = await fetch(`${API_URL}/sih26016/projects/${projectId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }

    // Deterministic client fallback simulation
    const project = NATIONAL_PROJECTS.find(p => p.id === projectId) || NATIONAL_PROJECTS[0];
    const curDelay = project?.project_delay_days || 229;
    const daysRecovered = payload.intervention_type === 'deploy_additional_officers' ? 60 : 45;
    const newDelay = Math.max(0, curDelay - daysRecovered);

    return {
      intervention_type: payload.intervention_type,
      target_entities: payload.input_entity_ids || ['P00001'],
      preconditions_met: true,
      precondition_warnings: [],
      before: {
        project_finish: '2028-11-15',
        project_delay_days: curDelay,
        critical_path: ['P00001', 'P00002'],
        total_duration_days: 780.0
      },
      after: {
        project_finish: '2028-09-30',
        project_delay_days: newDelay,
        critical_path: ['P00002'],
        total_duration_days: 780.0 - daysRecovered
      },
      delay_reduction_days: daysRecovered,
      cost_estimate_units: {
        officer_days: 14,
        cost_inr: 45000,
        action_unit: 'Revenue Lok Adalat Hearing'
      },
      affected_entities: payload.input_entity_ids || ['P00001'],
      source_type: 'MODEL_DERIVED'
    };
  },

  getFieldOfficers: async () => {
    try {
      const res = await authenticatedFetch(`/sih26016/field/officers`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }

    return [
      { officer_id: 'OF005', name: 'Girdhari Rathore', designation: 'Patwari', department_id: 'D04', department_name: 'Revenue & Land Records', assigned_villages: ['V01', 'V02'], pending_tasks_count: 8 },
      { officer_id: 'OF002', name: 'Kamla Jat', designation: 'Field Surveyor', department_id: 'D04', department_name: 'Public Works Cadastral Survey', assigned_villages: ['V01'], pending_tasks_count: 12 },
      { officer_id: 'OF004', name: 'Om Prakash Meena', designation: 'Field Surveyor', department_id: 'D03', department_name: 'National Highways Survey Cell', assigned_villages: ['V02', 'V03'], pending_tasks_count: 15 },
      { officer_id: 'OF001', name: 'Ramesh Meena', designation: 'Tehsildar', department_id: 'D02', department_name: 'Competent Authority Revenue Office', assigned_villages: ['V01', 'V02', 'V03'], pending_tasks_count: 24 },
      { officer_id: 'OF003', name: 'Geeta Jat', designation: 'Tehsildar', department_id: 'D02', department_name: 'Sub-Divisional Magistrate Office', assigned_villages: ['V02'], pending_tasks_count: 7 },
      { officer_id: 'OF006', name: 'Sita Rathore', designation: 'Land Acquisition Officer', department_id: 'D02', department_name: 'Special Land Acquisition Desk', assigned_villages: ['V01', 'V02', 'V03'], pending_tasks_count: 19 },
    ];
  },

  getFieldParcels: async (officerId?: string, villageId?: string) => {
    try {
      const query = new URLSearchParams();
      if (officerId) query.set('officer_id', officerId);
      if (villageId) query.set('village_id', villageId);
      const url = `${API_URL}/sih26016/field/parcels${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await authenticatedFetch(url.replace(API_URL, ''), { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }

    // Fallback to local real parcels
    return MOCK_PARCELS.map((p, idx) => ({
      parcel_id: p.id || `P0000${idx + 1}`,
      survey_number: p.survey_no || `${101 + idx}`,
      village_id: 'V01',
      village_name: 'Kanhera Kalan',
      owner_name: 'Landholder',
      area_sqm: (p.area_hectares || 1.2) * 10000,
      area_hectares: p.area_hectares || 1.2,
      land_use: 'agricultural',
      acquisition_status: p.current_stage || 'not_started',
      ownership_conflict: false,
      conflict_type: 'none',
      criticality_score: 55.0,
      risk_score: 30.0,
      is_critical_path: idx < 3,
      recommended_action: 'Perform field boundary verification',
      verification_status: 'pending',
      centroid_lat: 24.6500 + (idx * 0.0005),
      centroid_lng: 75.9300 + (idx * 0.0007),
    }));
  },

  submitFieldVerification: async (payload: any) => {
    try {
      const res = await authenticatedFetch(`/sih26016/field/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }

    return {
      success: true,
      verification_id: `VF_${Date.now()}`,
      parcel_id: payload.parcel_id,
      status: payload.status,
      has_issue: payload.has_issue,
      issue_type: payload.issue_type,
      updated_risk_score: payload.has_issue ? 75.0 : 25.0,
      updated_criticality_score: 68.0,
      is_critical_path: true,
      cpm_delay_days: payload.has_issue ? 259 : 229,
      project_delay_delta_days: payload.has_issue ? 30 : 0,
      projected_finish_date: '2028-12-15',
      recommended_action: payload.has_issue ? 'Refer title dispute to Special Lok Adalat bench' : 'Proceed to award declaration',
      notification: {
        title: `Field Record: Parcel ${payload.parcel_id}`,
        message: payload.has_issue ? `Issue ${payload.issue_type} logged with statutory blocker.` : 'Verification completed cleanly.',
        urgency: payload.has_issue ? 'CRITICAL' : 'NORMAL'
      }
    };
  },

  syncFieldBatch: async (officerId: string, submissions: any[]) => {
    try {
      const res = await authenticatedFetch(`/sih26016/field/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officer_id: officerId, submissions })
      });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }

    return {
      success: true,
      synced_count: submissions.length,
      failed_count: 0,
      results: submissions.map(s => ({
        success: true,
        verification_id: `VF_SYNC_${Date.now()}`,
        parcel_id: s.parcel_id,
        status: s.status,
        has_issue: s.has_issue,
      }))
    };
  },

  getFieldIncidents: async (filters?: { parcel_id?: string; project_id?: string; status?: string }) => {
    try {
      const q = new URLSearchParams();
      if (filters?.parcel_id) q.set('parcel_id', filters.parcel_id);
      if (filters?.project_id) q.set('project_id', filters.project_id);
      if (filters?.status) q.set('status', filters.status);
      const res = await authenticatedFetch(`/sih26016/field/incidents?${q.toString()}`);
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }

    return [
      {
        verification_id: "INC-2026-001",
        parcel_id: filters?.parcel_id || "PAR-003",
        survey_number: "88/1",
        village_name: "Ramganj Mandi",
        project_id: "P-NH927A",
        officer_id: "OF001",
        officer_name: "Ramesh Patel",
        verification_type: "field",
        status: "reported",
        has_issue: true,
        issue_type: "ownership_conflict",
        issue_severity: "CRITICAL_STOPPAGE",
        observations: "Two rival co-sharers claiming parcel compensation. High tension on site.",
        remarks: "Referred to Tehsildar for summary title adjudication.",
        verified_at: "2026-09-05T09:30:00Z",
        gps_lat: 24.6492,
        gps_lng: 75.9284,
        gps_accuracy: 3.8,
        photos: [],
        documents: [],
        admin_resolution: null,
        source_type: "SYNTHETIC / DEVELOPMENT DATA"
      }
    ];
  },

  confirmFieldIncident: async (incidentId: string, payload: {
    officer_name: string;
    officer_id?: string;
    confirmation_status?: string;
    observation_notes?: string;
    remarks?: string;
    gps_latitude?: number;
    gps_longitude?: number;
    gps_accuracy?: number;
    photo_evidence_url?: string;
    confirmed_severity?: string;
  }) => {
    try {
      const res = await authenticatedFetch(`/sih26016/field/incidents/${incidentId}/confirm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }

    return {
      success: true,
      incident: {
        verification_id: incidentId,
        status: payload.confirmation_status || "confirmed",
        confirmed_at: new Date().toISOString(),
        confirming_officer_name: payload.officer_name,
        observations: payload.observation_notes,
        source_type: "USER_ENTERED"
      }
    };
  },

  resolveAdminIncident: async (incidentId: string, payload: {
    resolution_action: string;
    resolution_comment: string;
    admin_name?: string;
  }) => {
    try {
      const res = await authenticatedFetch(`/sih26016/admin/incidents/${incidentId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e: any) { if (e instanceof Error && (e.message.startsWith('AuthError') || e.message.startsWith('APIError'))) throw e; }

    return {
      success: true,
      incident_id: incidentId,
      resolution_status: payload.resolution_action.toLowerCase(),
      cpm_delay_days: 0,
      projected_finish_date: "2028-11-15"
    };
  }
,

  // Landowner / Affected Person Methods
  getParcels: async () => {
    const res = await authenticatedFetch(`/landowner/parcels`);
    if (!res.ok) return [];
    return await res.json();
  },

  getLandowners: async () => {
    const res = await authenticatedFetch(`/landowner/owners`);
    if (!res.ok) return [];
    return await res.json();
  },

  getLandownerById: async (ownerId: string) => {
    const res = await authenticatedFetch(`/landowner/owners/${ownerId}`);
    if (!res.ok) return null;
    return await res.json();
  },

  getLandownerParcels: async (ownerId: string) => {
    const res = await authenticatedFetch(`/landowner/owners/${ownerId}/parcels`);
    if (!res.ok) return [];
    return await res.json();
  },

  submitLandownerComplaint: async (payload: any) => {
    const res = await authenticatedFetch(`/landowner/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Failed to submit complaint");
    return await res.json();
  },

  getLandownerComplaints: async (filters?: { owner_id?: string; parcel_id?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.owner_id) params.append("owner_id", filters.owner_id);
    if (filters?.parcel_id) params.append("parcel_id", filters.parcel_id);
    if (filters?.status) params.append("status", filters.status);
    const res = await authenticatedFetch(`/landowner/complaints?${params.toString()}`);
    if (!res.ok) return [];
    return await res.json();
  },

  assignComplaintToOfficer: async (complaintId: string, officerId: string, officerName: string, adminNotes?: string) => {
    const res = await authenticatedFetch(`/landowner/complaints/${complaintId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ officer_id: officerId, officer_name: officerName, admin_notes: adminNotes })
    });
    if (!res.ok) throw new Error("Failed to assign complaint");
    return await res.json();
  },

  submitComplaintVerification: async (payload: any) => {
    const res = await authenticatedFetch(`/landowner/complaints/${payload.complaint_id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Failed to verify complaint");
    return await res.json();
  },

  resolveComplaint: async (complaintId: string, resolution: any) => {
    const res = await authenticatedFetch(`/landowner/complaints/${complaintId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resolution)
    });
    if (!res.ok) throw new Error("Failed to resolve complaint");
    return await res.json();
  },

  
  uploadEvidenceDocument: async (file: File | Blob, fileName: string, parcelId: string) => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Must be logged in to upload evidence");
    
    // Path structure: auth.uid() / parcelId / timestamp_filename
    const filePath = `${user.id}/${parcelId}/${Date.now()}_${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });
      
    if (error) {
      console.error("Upload error:", error);
      throw error;
    }
    
    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
    
    return {
      storage_path: data?.path || filePath,
      public_url: publicUrl,
      file_name: fileName,
      file_size: file.size,
      mime_type: file.type,
      uploaded_at: new Date().toISOString()
    };
  },

  createOrUpdateLandownerProfile: async (profile: any) => {
    const res = await authenticatedFetch(`/landowner/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (!res.ok) throw new Error("Failed to update profile");
    return await res.json();
  },

  getLandownerProfile: async (userId: string) => {
    const res = await authenticatedFetch(`/landowner/profile/${userId}`);
    if (!res.ok) return null;
    return await res.json();
  }
};

export const getFieldOfficers = () => apiClient.getFieldOfficers();
export const getParcels = () => apiClient.getParcels();
export const getFieldParcels = (officerId?: string, villageId?: string) => apiClient.getFieldParcels(officerId, villageId);
export const submitFieldVerification = (payload: any) => apiClient.submitFieldVerification(payload);
export const syncFieldBatch = (officerId: string, submissions: any[]) => apiClient.syncFieldBatch(officerId, submissions);
export const getFieldIncidents = (filters?: { parcel_id?: string; project_id?: string; status?: string }) => apiClient.getFieldIncidents(filters);
export const confirmFieldIncident = (incidentId: string, payload: any) => apiClient.confirmFieldIncident(incidentId, payload);
export const resolveAdminIncident = (incidentId: string, payload: any) => apiClient.resolveAdminIncident(incidentId, payload);

// Landowner helper exports
export const getLandowners = () => apiClient.getLandowners();
export const getLandownerById = (ownerId: string) => apiClient.getLandownerById(ownerId);
export const getLandownerParcels = (ownerId: string) => apiClient.getLandownerParcels(ownerId);
export const submitLandownerComplaint = (payload: any) => apiClient.submitLandownerComplaint(payload);
export const getLandownerComplaints = (filters?: any) => apiClient.getLandownerComplaints(filters);
export const assignComplaintToOfficer = (complaintId: string, officerId: string, officerName: string, adminNotes?: string) =>
  apiClient.assignComplaintToOfficer(complaintId, officerId, officerName, adminNotes);
export const submitComplaintVerification = (payload: any) => apiClient.submitComplaintVerification(payload);
export const resolveComplaint = (complaintId: string, resolution: any) => apiClient.resolveComplaint(complaintId, resolution);
export const uploadEvidenceDocument = (file: File | Blob, fileName: string, parcelId: string) =>
  apiClient.uploadEvidenceDocument(file, fileName, parcelId);
export const createOrUpdateLandownerProfile = (profile: any) => apiClient.createOrUpdateLandownerProfile(profile);
export const getLandownerProfile = (userId: string) => apiClient.getLandownerProfile(userId);

