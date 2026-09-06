/**
 * BHUMI PLATFORM — AUTHORITATIVE DATASET REPOSITORY
 * Clean operational state: zero synthetic/larped records.
 * Real parcels are registered dynamically via Supabase or Officer Cadastre Ingestion.
 */

export interface RealProject {
  id: string;
  name: string;
  state_id?: string;
  state_name: string;
  district_name: string;
  total_length_km: number;
  lat?: number;
  lng?: number;
  centroid?: {
    type: 'Point';
    coordinates: [number, number];
  };
  progress?: number;
  unresolved_parcel_count?: number;
  total_parcels?: number;
  project_delay_days?: number;
  critical_path_blocked?: boolean;
  highest_urgency?: 'CRITICAL' | 'HIGH' | 'LOW' | 'NORMAL';
  stage?: string;
  spatial_cluster_count?: number;
  created_at?: string;
}

export interface RealParcel {
  id: string;
  project_id: string;
  project_name?: string;
  survey_no: string;
  village_name: string;
  area_hectares: number;
  classification: string;
  status: 'UNRESOLVED' | 'POSSESSION' | 'RESOLVED' | 'UNDER_REVIEW';
  statutory_act?: string;
  current_stage: string;
  is_lapsed?: boolean;
  assumed_lapse_recovery_days?: number;
  owner_name?: string;
  blocker?: {
    type: string;
    status: string;
    description: string;
    assumed_resolution_days: number;
  };
  geom?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface RealCase {
  id: string;
  parcel_id: string;
  survey_no: string;
  project_name: string;
  stage: string;
  days_in_stage: number;
  lapsed: boolean;
  owner_name: string;
  statutory_act?: string;
  computed_deadline?: string;
}

export interface RealBlocker {
  id: string;
  parcel_id: string;
  survey_no: string;
  blocker_type: string;
  status: string;
  description: string;
  delay_days: number;
  forum?: string;
}

export const REAL_PROJECTS: RealProject[] = [
  {
    id: "P-NH927A",
    name: "NH-927A Kota-Jhalawar Bypass Widening",
    state_id: "RJ",
    state_name: "Rajasthan",
    district_name: "Kota",
    total_length_km: 48.5,
    lat: 24.69,
    lng: 75.98,
    centroid: {
      type: "Point",
      coordinates: [75.98, 24.69]
    },
    progress: 0,
    unresolved_parcel_count: 0,
    total_parcels: 0,
    project_delay_days: 0,
    critical_path_blocked: false,
    highest_urgency: "NORMAL",
    stage: "Sec 3A Intention Notified",
    spatial_cluster_count: 0,
    created_at: "2026-01-01T00:00:00Z"
  }
];

// ZERO LARPED DATA: Empty array awaiting real user data ingestion
export const REAL_PARCELS: RealParcel[] = [];
export const REAL_CASES: RealCase[] = [];
export const REAL_BLOCKERS: RealBlocker[] = [];
