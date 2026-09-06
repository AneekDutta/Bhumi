export interface GovernmentProject {
  id: string;
  name: string;
  code: string;
  sector: 'Highways' | 'Railways' | 'Industrial Corridors' | 'Irrigation' | 'Renewable Energy' | 'Urban Development';
  department: string;
  state: string;
  district: string;
  total_length_km?: number;
  total_project_area_ha: number;
  planned_acquisition_ha: number;
  acquired_area_ha: number;
  acquisition_progress_pct: number;
  project_delay_days: number;
  status: 'ON_TRACK' | 'DELAYED' | 'CRITICAL_BLOCKER';
  timeline_start: string;
  timeline_target: string;
  estimated_cost_cr: number;
  centroid: {
    coordinates: [number, number]; // [lng, lat]
  };
  corridor_path?: [number, number][];
  milestones: Array<{
    name: string;
    target_date: string;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  }>;
  statistics: {
    total_parcels_projected: number;
    unresolved_bottlenecks: number;
    contiguous_clusters: number;
  };
}

export const MOCK_GOVERNMENT_PROJECTS: GovernmentProject[] = [
  {
    id: "GOV-HW-01",
    name: "Delhi–Mumbai Expressway (Package 14)",
    code: "NHAI-DME-PKG14",
    sector: "Highways",
    department: "National Highways Authority of India (NHAI) · MoRTH",
    state: "Rajasthan / Madhya Pradesh",
    district: "Kota / Mandsaur",
    total_length_km: 244.5,
    total_project_area_ha: 3200,
    planned_acquisition_ha: 1450,
    acquired_area_ha: 1180,
    acquisition_progress_pct: 81.4,
    project_delay_days: 45,
    status: "DELAYED",
    timeline_start: "2023-01-15",
    timeline_target: "2027-03-31",
    estimated_cost_cr: 12450,
    centroid: {
      coordinates: [75.8362, 24.5854]
    },
    corridor_path: [
      [75.7500, 24.5000],
      [75.8000, 24.5500],
      [75.8362, 24.5854],
      [75.9000, 24.6500],
      [75.9500, 24.7200]
    ],
    milestones: [
      { name: "3A Preliminary Alignment Notification", target_date: "2023-04-10", status: "COMPLETED" },
      { name: "3D Cadastral Declaration", target_date: "2024-01-20", status: "COMPLETED" },
      { name: "3G Final Valuation Award", target_date: "2025-06-30", status: "IN_PROGRESS" },
      { name: "Section 3E Right-of-Way Possession", target_date: "2026-02-28", status: "PENDING" }
    ],
    statistics: {
      total_parcels_projected: 1420,
      unresolved_bottlenecks: 18,
      contiguous_clusters: 4
    }
  },
  {
    id: "GOV-RW-02",
    name: "Western Dedicated Freight Corridor (Phase II)",
    code: "DFCCIL-WDFC-PH2",
    sector: "Railways",
    department: "Dedicated Freight Corridor Corp of India · Ministry of Railways",
    state: "Gujarat / Rajasthan",
    district: "Palanpur / Sirohi",
    total_length_km: 186.0,
    total_project_area_ha: 2100,
    planned_acquisition_ha: 980,
    acquired_area_ha: 890,
    acquisition_progress_pct: 90.8,
    project_delay_days: 0,
    status: "ON_TRACK",
    timeline_start: "2022-08-01",
    timeline_target: "2026-11-30",
    estimated_cost_cr: 8750,
    centroid: {
      coordinates: [72.4333, 24.1724]
    },
    corridor_path: [
      [72.3500, 24.1000],
      [72.4333, 24.1724],
      [72.5200, 24.2600],
      [72.6100, 24.3500]
    ],
    milestones: [
      { name: "Special Railway Project Notification (20A)", target_date: "2022-11-15", status: "COMPLETED" },
      { name: "Declaration of Acquisition (20E)", target_date: "2023-09-30", status: "COMPLETED" },
      { name: "Compensation Determination (20F)", target_date: "2024-12-15", status: "COMPLETED" },
      { name: "Track Bed Handover (20H)", target_date: "2026-05-15", status: "IN_PROGRESS" }
    ],
    statistics: {
      total_parcels_projected: 890,
      unresolved_bottlenecks: 3,
      contiguous_clusters: 1
    }
  },
  {
    id: "GOV-IC-03",
    name: "Bengaluru–Chennai Industrial Corridor (Node B)",
    code: "NICDC-BCIC-KR02",
    sector: "Industrial Corridors",
    department: "National Industrial Corridor Dev Corp (NICDC) · DPIIT",
    state: "Karnataka / Tamil Nadu",
    district: "Kolar / Krishnagiri",
    total_length_km: 78.2,
    total_project_area_ha: 4500,
    planned_acquisition_ha: 2200,
    acquired_area_ha: 1420,
    acquisition_progress_pct: 64.5,
    project_delay_days: 85,
    status: "CRITICAL_BLOCKER",
    timeline_start: "2023-05-01",
    timeline_target: "2028-06-30",
    estimated_cost_cr: 16200,
    centroid: {
      coordinates: [78.1329, 12.9141]
    },
    corridor_path: [
      [78.0500, 12.8500],
      [78.1329, 12.9141],
      [78.2100, 12.9800],
      [78.3000, 13.0500]
    ],
    milestones: [
      { name: "Master Plan & SIA Clearance", target_date: "2023-09-15", status: "COMPLETED" },
      { name: "Section 11 Preliminary Notification", target_date: "2024-03-30", status: "COMPLETED" },
      { name: "Section 19 Declaration", target_date: "2025-01-15", status: "IN_PROGRESS" },
      { name: "Possession & Infrastructure Trunking", target_date: "2027-12-31", status: "PENDING" }
    ],
    statistics: {
      total_parcels_projected: 2150,
      unresolved_bottlenecks: 42,
      contiguous_clusters: 9
    }
  },
  {
    id: "GOV-IR-04",
    name: "Narmada Valley Left-Bank Irrigation Trunk Canal",
    code: "WRD-NVIR-MP05",
    sector: "Irrigation",
    department: "Water Resources Department · Narmada Valley Development Authority",
    state: "Madhya Pradesh",
    district: "Barwani / Khargone",
    total_length_km: 112.4,
    total_project_area_ha: 1850,
    planned_acquisition_ha: 760,
    acquired_area_ha: 695,
    acquisition_progress_pct: 91.4,
    project_delay_days: 12,
    status: "ON_TRACK",
    timeline_start: "2022-02-15",
    timeline_target: "2026-08-31",
    estimated_cost_cr: 4320,
    centroid: {
      coordinates: [75.6142, 22.0574]
    },
    corridor_path: [
      [75.5000, 22.0000],
      [75.6142, 22.0574],
      [75.7200, 22.1200]
    ],
    milestones: [
      { name: "Canal Alignment & Command Area Survey", target_date: "2022-06-30", status: "COMPLETED" },
      { name: "RFCTLARR Statutory Award Declaration", target_date: "2023-11-20", status: "COMPLETED" },
      { name: "Rehabilitation & Resettlement (R&R) Disbursal", target_date: "2025-04-30", status: "IN_PROGRESS" }
    ],
    statistics: {
      total_parcels_projected: 640,
      unresolved_bottlenecks: 5,
      contiguous_clusters: 2
    }
  },
  {
    id: "GOV-RE-05",
    name: "Bhadla Ultra-Mega Solar Power Park (Phase IV Expansion)",
    code: "MNRE-UMSP-RJ04",
    sector: "Renewable Energy",
    department: "Rajasthan Renewable Energy Corp (RRECL) · Ministry of New and Renewable Energy",
    state: "Rajasthan",
    district: "Jodhpur / Phalodi",
    total_project_area_ha: 5600,
    planned_acquisition_ha: 3800,
    acquired_area_ha: 3550,
    acquisition_progress_pct: 93.4,
    project_delay_days: 0,
    status: "ON_TRACK",
    timeline_start: "2023-10-01",
    timeline_target: "2026-06-30",
    estimated_cost_cr: 7850,
    centroid: {
      coordinates: [71.9167, 27.5333]
    },
    corridor_path: [
      [71.8500, 27.4800],
      [71.9167, 27.5333],
      [71.9800, 27.5900]
    ],
    milestones: [
      { name: "Government Revenue Wasteland Transfer", target_date: "2024-01-15", status: "COMPLETED" },
      { name: "Private Khatedari Land Direct Purchase", target_date: "2024-11-30", status: "COMPLETED" },
      { name: "Transmission Corridor Evacuation Lines", target_date: "2025-10-15", status: "IN_PROGRESS" }
    ],
    statistics: {
      total_parcels_projected: 480,
      unresolved_bottlenecks: 2,
      contiguous_clusters: 0
    }
  },
  {
    id: "GOV-UD-06",
    name: "Dholera Special Investment Region (Activation Area 1)",
    code: "DSIRDA-ACT1-GJ01",
    sector: "Urban Development",
    department: "Dholera Special Investment Region Development Authority · Govt of Gujarat",
    state: "Gujarat",
    district: "Ahmedabad",
    total_project_area_ha: 9200,
    planned_acquisition_ha: 4100,
    acquired_area_ha: 3150,
    acquisition_progress_pct: 76.8,
    project_delay_days: 60,
    status: "DELAYED",
    timeline_start: "2022-01-10",
    timeline_target: "2028-12-31",
    estimated_cost_cr: 22800,
    centroid: {
      coordinates: [72.1931, 22.2472]
    },
    corridor_path: [
      [72.1200, 22.1800],
      [72.1931, 22.2472],
      [72.2700, 22.3100]
    ],
    milestones: [
      { name: "Town Planning Scheme 1 Preliminary Sanction", target_date: "2022-09-30", status: "COMPLETED" },
      { name: "Land Pooling & Reconstitution Orders", target_date: "2024-02-15", status: "COMPLETED" },
      { name: "Trunk Utility Corridor Possession", target_date: "2025-08-31", status: "IN_PROGRESS" }
    ],
    statistics: {
      total_parcels_projected: 3200,
      unresolved_bottlenecks: 26,
      contiguous_clusters: 6
    }
  }
];
