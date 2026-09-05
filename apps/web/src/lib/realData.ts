/**
 * BHUMI PLATFORM — AUTHORITATIVE SIH26016 DATASET REPOSITORY
 * Synchronized directly from data/sih26016/seed_data.json
 * Features: NH-927A Kota-Jhalawar Bypass Widening, 181 Parcels, 3 Villages
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
  "id": "P-NH927A",
  "name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
  "state_id": "RJ",
  "state_name": "Rajasthan",
  "district_name": "Kota",
  "total_length_km": 48.5,
  "lat": 24.69,
  "lng": 75.98,
  "centroid": {
    "type": "Point",
    "coordinates": [
      75.98,
      24.69
    ]
  },
  "progress": 39.2,
  "unresolved_parcel_count": 110,
  "total_parcels": 181,
  "project_delay_days": 229,
  "critical_path_blocked": true,
  "highest_urgency": "CRITICAL",
  "stage": "Sec 23 Award & Possession",
  "spatial_cluster_count": 3,
  "created_at": "2025-04-01T00:00:00Z"
}
];

export const REAL_PARCELS: RealParcel[] = [
  {
    "id": "P00001",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0001",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.2401,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Geeta Meena",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.97,
            24.65
          ],
          [
            75.970675,
            24.65
          ],
          [
            75.970675,
            24.650382
          ],
          [
            75.97,
            24.650382
          ],
          [
            75.97,
            24.65
          ]
        ]
      ]
    }
  },
  {
    "id": "P00002",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0002",
    "village_name": "Chandwas",
    "area_hectares": 0.2461,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Sita Jat",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.01,
            24.65045
          ],
          [
            76.010675,
            24.65045
          ],
          [
            76.010675,
            24.650832
          ],
          [
            76.01,
            24.650832
          ],
          [
            76.01,
            24.65045
          ]
        ]
      ]
    }
  },
  {
    "id": "P00003",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0003",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.1191,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Kailash Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.93075,
            24.650525
          ],
          [
            75.931425,
            24.650525
          ],
          [
            75.931425,
            24.650907
          ],
          [
            75.93075,
            24.650907
          ],
          [
            75.93075,
            24.650525
          ]
        ]
      ]
    }
  },
  {
    "id": "P00004",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0004",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.3994,
    "classification": "commercial",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Suresh Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.97075,
            24.650975
          ],
          [
            75.971425,
            24.650975
          ],
          [
            75.971425,
            24.651357
          ],
          [
            75.97075,
            24.651357
          ],
          [
            75.97075,
            24.650975
          ]
        ]
      ]
    }
  },
  {
    "id": "P00005",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0005",
    "village_name": "Chandwas",
    "area_hectares": 0.2264,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Shanti Gujjar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0115,
            24.65105
          ],
          [
            76.012175,
            24.65105
          ],
          [
            76.012175,
            24.651432
          ],
          [
            76.0115,
            24.651432
          ],
          [
            76.0115,
            24.65105
          ]
        ]
      ]
    }
  },
  {
    "id": "P00006",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0006",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3741,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Radha Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9315,
            24.6515
          ],
          [
            75.932175,
            24.6515
          ],
          [
            75.932175,
            24.651882
          ],
          [
            75.9315,
            24.651882
          ],
          [
            75.9315,
            24.6515
          ]
        ]
      ]
    }
  },
  {
    "id": "P00007",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0007",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.261,
    "classification": "residential",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Kailash Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.97225,
            24.651575
          ],
          [
            75.972925,
            24.651575
          ],
          [
            75.972925,
            24.651957
          ],
          [
            75.97225,
            24.651957
          ],
          [
            75.97225,
            24.651575
          ]
        ]
      ]
    }
  },
  {
    "id": "P00008",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0008",
    "village_name": "Chandwas",
    "area_hectares": 0.2826,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Om Prakash Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.01225,
            24.652025
          ],
          [
            76.012925,
            24.652025
          ],
          [
            76.012925,
            24.652407
          ],
          [
            76.01225,
            24.652407
          ],
          [
            76.01225,
            24.652025
          ]
        ]
      ]
    }
  },
  {
    "id": "P00009",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0009",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.2792,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Champa Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.933,
            24.6521
          ],
          [
            75.933675,
            24.6521
          ],
          [
            75.933675,
            24.652482
          ],
          [
            75.933,
            24.652482
          ],
          [
            75.933,
            24.6521
          ]
        ]
      ]
    }
  },
  {
    "id": "P00010",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0010",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.0882,
    "classification": "barren",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Suresh Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.973,
            24.65255
          ],
          [
            75.973675,
            24.65255
          ],
          [
            75.973675,
            24.652932
          ],
          [
            75.973,
            24.652932
          ],
          [
            75.973,
            24.65255
          ]
        ]
      ]
    }
  },
  {
    "id": "P00011",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0011",
    "village_name": "Chandwas",
    "area_hectares": 0.0347,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Bhanwar Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.01375,
            24.652625
          ],
          [
            76.014425,
            24.652625
          ],
          [
            76.014425,
            24.653007
          ],
          [
            76.01375,
            24.653007
          ],
          [
            76.01375,
            24.652625
          ]
        ]
      ]
    }
  },
  {
    "id": "P00012",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0012",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3484,
    "classification": "commercial",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Om Prakash Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.93375,
            24.653075
          ],
          [
            75.934425,
            24.653075
          ],
          [
            75.934425,
            24.653457
          ],
          [
            75.93375,
            24.653457
          ],
          [
            75.93375,
            24.653075
          ]
        ]
      ]
    }
  },
  {
    "id": "P00013",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0013",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.3858,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Shanti Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9745,
            24.65315
          ],
          [
            75.975175,
            24.65315
          ],
          [
            75.975175,
            24.653533
          ],
          [
            75.9745,
            24.653533
          ],
          [
            75.9745,
            24.65315
          ]
        ]
      ]
    }
  },
  {
    "id": "P00014",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0014",
    "village_name": "Chandwas",
    "area_hectares": 0.0369,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Champa Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0145,
            24.6536
          ],
          [
            76.015175,
            24.6536
          ],
          [
            76.015175,
            24.653983
          ],
          [
            76.0145,
            24.653983
          ],
          [
            76.0145,
            24.6536
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00015",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0015",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.0949,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Sita Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.93525,
            24.653675
          ],
          [
            75.935925,
            24.653675
          ],
          [
            75.935925,
            24.654058
          ],
          [
            75.93525,
            24.654058
          ],
          [
            75.93525,
            24.653675
          ]
        ]
      ]
    }
  },
  {
    "id": "P00016",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0016",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.1375,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Om Prakash Jat",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.97525,
            24.654125
          ],
          [
            75.975925,
            24.654125
          ],
          [
            75.975925,
            24.654508
          ],
          [
            75.97525,
            24.654508
          ],
          [
            75.97525,
            24.654125
          ]
        ]
      ]
    }
  },
  {
    "id": "P00017",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0017",
    "village_name": "Chandwas",
    "area_hectares": 0.1743,
    "classification": "residential",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Radha Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.016,
            24.6542
          ],
          [
            76.016675,
            24.6542
          ],
          [
            76.016675,
            24.654583
          ],
          [
            76.016,
            24.654583
          ],
          [
            76.016,
            24.6542
          ]
        ]
      ]
    }
  },
  {
    "id": "P00018",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0018",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.0522,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Sita Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.936,
            24.65465
          ],
          [
            75.936675,
            24.65465
          ],
          [
            75.936675,
            24.655033
          ],
          [
            75.936,
            24.655033
          ],
          [
            75.936,
            24.65465
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00019",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0019",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.1054,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Radha Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.97675,
            24.654725
          ],
          [
            75.977425,
            24.654725
          ],
          [
            75.977425,
            24.655107
          ],
          [
            75.97675,
            24.655107
          ],
          [
            75.97675,
            24.654725
          ]
        ]
      ]
    }
  },
  {
    "id": "P00020",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0020",
    "village_name": "Chandwas",
    "area_hectares": 0.2079,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Champa Meena",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.01675,
            24.655175
          ],
          [
            76.017425,
            24.655175
          ],
          [
            76.017425,
            24.655558
          ],
          [
            76.01675,
            24.655558
          ],
          [
            76.01675,
            24.655175
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00021",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0021",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.0868,
    "classification": "commercial",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Sita Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9375,
            24.65525
          ],
          [
            75.938175,
            24.65525
          ],
          [
            75.938175,
            24.655632
          ],
          [
            75.9375,
            24.655632
          ],
          [
            75.9375,
            24.65525
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00022",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0022",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.3245,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Girdhari Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9775,
            24.6557
          ],
          [
            75.978175,
            24.6557
          ],
          [
            75.978175,
            24.656083
          ],
          [
            75.9775,
            24.656083
          ],
          [
            75.9775,
            24.6557
          ]
        ]
      ]
    }
  },
  {
    "id": "P00023",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0023",
    "village_name": "Chandwas",
    "area_hectares": 0.2933,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Bhanwar Gujjar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.01825,
            24.655775
          ],
          [
            76.018925,
            24.655775
          ],
          [
            76.018925,
            24.656157
          ],
          [
            76.01825,
            24.656157
          ],
          [
            76.01825,
            24.655775
          ]
        ]
      ]
    }
  },
  {
    "id": "P00024",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0024",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3155,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Radha Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.93825,
            24.656225
          ],
          [
            75.938925,
            24.656225
          ],
          [
            75.938925,
            24.656607
          ],
          [
            75.93825,
            24.656607
          ],
          [
            75.93825,
            24.656225
          ]
        ]
      ]
    }
  },
  {
    "id": "P00025",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0025",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.2837,
    "classification": "residential",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Champa Meena",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.979,
            24.6563
          ],
          [
            75.979675,
            24.6563
          ],
          [
            75.979675,
            24.656682
          ],
          [
            75.979,
            24.656682
          ],
          [
            75.979,
            24.6563
          ]
        ]
      ]
    }
  },
  {
    "id": "P00026",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0026",
    "village_name": "Chandwas",
    "area_hectares": 0.3547,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Champa Jat",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.019,
            24.65675
          ],
          [
            76.019675,
            24.65675
          ],
          [
            76.019675,
            24.657132
          ],
          [
            76.019,
            24.657132
          ],
          [
            76.019,
            24.65675
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00027",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0027",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3041,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Ramesh Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.93975,
            24.656825
          ],
          [
            75.940425,
            24.656825
          ],
          [
            75.940425,
            24.657207
          ],
          [
            75.93975,
            24.657207
          ],
          [
            75.93975,
            24.656825
          ]
        ]
      ]
    }
  },
  {
    "id": "P00028",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0028",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.2045,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Kailash Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.97975,
            24.657275
          ],
          [
            75.980425,
            24.657275
          ],
          [
            75.980425,
            24.657657
          ],
          [
            75.97975,
            24.657657
          ],
          [
            75.97975,
            24.657275
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00029",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0029",
    "village_name": "Chandwas",
    "area_hectares": 0.223,
    "classification": "barren",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Suresh Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0205,
            24.65735
          ],
          [
            76.021175,
            24.65735
          ],
          [
            76.021175,
            24.657732
          ],
          [
            76.0205,
            24.657732
          ],
          [
            76.0205,
            24.65735
          ]
        ]
      ]
    }
  },
  {
    "id": "P00030",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0030",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.0716,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Kailash Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9405,
            24.6578
          ],
          [
            75.941175,
            24.6578
          ],
          [
            75.941175,
            24.658182
          ],
          [
            75.9405,
            24.658182
          ],
          [
            75.9405,
            24.6578
          ]
        ]
      ]
    }
  },
  {
    "id": "P00031",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0031",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.0511,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Shanti Gujjar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.98125,
            24.657875
          ],
          [
            75.981925,
            24.657875
          ],
          [
            75.981925,
            24.658257
          ],
          [
            75.98125,
            24.658257
          ],
          [
            75.98125,
            24.657875
          ]
        ]
      ]
    }
  },
  {
    "id": "P00032",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0032",
    "village_name": "Chandwas",
    "area_hectares": 0.3169,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Sita Jat",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.02125,
            24.658325
          ],
          [
            76.021925,
            24.658325
          ],
          [
            76.021925,
            24.658707
          ],
          [
            76.02125,
            24.658707
          ],
          [
            76.02125,
            24.658325
          ]
        ]
      ]
    }
  },
  {
    "id": "P00033",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0033",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.2858,
    "classification": "residential",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Prem Rathore",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.942,
            24.6584
          ],
          [
            75.942675,
            24.6584
          ],
          [
            75.942675,
            24.658783
          ],
          [
            75.942,
            24.658783
          ],
          [
            75.942,
            24.6584
          ]
        ]
      ]
    }
  },
  {
    "id": "P00034",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0034",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.3841,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Geeta Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.982,
            24.65885
          ],
          [
            75.982675,
            24.65885
          ],
          [
            75.982675,
            24.659233
          ],
          [
            75.982,
            24.659233
          ],
          [
            75.982,
            24.65885
          ]
        ]
      ]
    }
  },
  {
    "id": "P00035",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0035",
    "village_name": "Chandwas",
    "area_hectares": 0.3939,
    "classification": "residential",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Geeta Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.02275,
            24.658925
          ],
          [
            76.023425,
            24.658925
          ],
          [
            76.023425,
            24.659308
          ],
          [
            76.02275,
            24.659308
          ],
          [
            76.02275,
            24.658925
          ]
        ]
      ]
    }
  },
  {
    "id": "P00036",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0036",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3349,
    "classification": "residential",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Bhanwar Rathore",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.94275,
            24.659375
          ],
          [
            75.943425,
            24.659375
          ],
          [
            75.943425,
            24.659758
          ],
          [
            75.94275,
            24.659758
          ],
          [
            75.94275,
            24.659375
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00037",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0037",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.1855,
    "classification": "residential",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Prem Rathore",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9835,
            24.65945
          ],
          [
            75.984175,
            24.65945
          ],
          [
            75.984175,
            24.659833
          ],
          [
            75.9835,
            24.659833
          ],
          [
            75.9835,
            24.65945
          ]
        ]
      ]
    }
  },
  {
    "id": "P00038",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0038",
    "village_name": "Chandwas",
    "area_hectares": 0.2078,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Suresh Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0235,
            24.6599
          ],
          [
            76.024175,
            24.6599
          ],
          [
            76.024175,
            24.660283
          ],
          [
            76.0235,
            24.660283
          ],
          [
            76.0235,
            24.6599
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00039",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0039",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3544,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Suresh Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.94425,
            24.659975
          ],
          [
            75.944925,
            24.659975
          ],
          [
            75.944925,
            24.660357
          ],
          [
            75.94425,
            24.660357
          ],
          [
            75.94425,
            24.659975
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00040",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0040",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.3081,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Kamla Jat",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.98425,
            24.660425
          ],
          [
            75.984925,
            24.660425
          ],
          [
            75.984925,
            24.660808
          ],
          [
            75.98425,
            24.660808
          ],
          [
            75.98425,
            24.660425
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00041",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0041",
    "village_name": "Chandwas",
    "area_hectares": 0.1737,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Sita Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.025,
            24.6605
          ],
          [
            76.025675,
            24.6605
          ],
          [
            76.025675,
            24.660882
          ],
          [
            76.025,
            24.660882
          ],
          [
            76.025,
            24.6605
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00042",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0042",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.2291,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Girdhari Meena",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.945,
            24.66095
          ],
          [
            75.945675,
            24.66095
          ],
          [
            75.945675,
            24.661333
          ],
          [
            75.945,
            24.661333
          ],
          [
            75.945,
            24.66095
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00043",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0043",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.0654,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Sita Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.98575,
            24.661025
          ],
          [
            75.986425,
            24.661025
          ],
          [
            75.986425,
            24.661407
          ],
          [
            75.98575,
            24.661407
          ],
          [
            75.98575,
            24.661025
          ]
        ]
      ]
    }
  },
  {
    "id": "P00044",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0044",
    "village_name": "Chandwas",
    "area_hectares": 0.0938,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Shanti Gujjar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.02575,
            24.661475
          ],
          [
            76.026425,
            24.661475
          ],
          [
            76.026425,
            24.661857
          ],
          [
            76.02575,
            24.661857
          ],
          [
            76.02575,
            24.661475
          ]
        ]
      ]
    }
  },
  {
    "id": "P00045",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0045",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3061,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Bhanwar Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9465,
            24.66155
          ],
          [
            75.947175,
            24.66155
          ],
          [
            75.947175,
            24.661932
          ],
          [
            75.9465,
            24.661932
          ],
          [
            75.9465,
            24.66155
          ]
        ]
      ]
    }
  },
  {
    "id": "P00046",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0046",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.2069,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Ramesh Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9865,
            24.662
          ],
          [
            75.987175,
            24.662
          ],
          [
            75.987175,
            24.662382
          ],
          [
            75.9865,
            24.662382
          ],
          [
            75.9865,
            24.662
          ]
        ]
      ]
    }
  },
  {
    "id": "P00047",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0047",
    "village_name": "Chandwas",
    "area_hectares": 0.3205,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Champa Meena",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.02725,
            24.662075
          ],
          [
            76.027925,
            24.662075
          ],
          [
            76.027925,
            24.662457
          ],
          [
            76.02725,
            24.662457
          ],
          [
            76.02725,
            24.662075
          ]
        ]
      ]
    }
  },
  {
    "id": "P00048",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0048",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.136,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Kailash Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.94725,
            24.662525
          ],
          [
            75.947925,
            24.662525
          ],
          [
            75.947925,
            24.662907
          ],
          [
            75.94725,
            24.662907
          ],
          [
            75.94725,
            24.662525
          ]
        ]
      ]
    }
  },
  {
    "id": "P00049",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0049",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.1206,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Champa Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.988,
            24.6626
          ],
          [
            75.988675,
            24.6626
          ],
          [
            75.988675,
            24.662982
          ],
          [
            75.988,
            24.662982
          ],
          [
            75.988,
            24.6626
          ]
        ]
      ]
    }
  },
  {
    "id": "P00050",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0050",
    "village_name": "Chandwas",
    "area_hectares": 0.2871,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Champa Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.028,
            24.66305
          ],
          [
            76.028675,
            24.66305
          ],
          [
            76.028675,
            24.663432
          ],
          [
            76.028,
            24.663432
          ],
          [
            76.028,
            24.66305
          ]
        ]
      ]
    }
  },
  {
    "id": "P00051",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0051",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.0766,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Kamla Rathore",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.94875,
            24.663125
          ],
          [
            75.949425,
            24.663125
          ],
          [
            75.949425,
            24.663507
          ],
          [
            75.94875,
            24.663507
          ],
          [
            75.94875,
            24.663125
          ]
        ]
      ]
    }
  },
  {
    "id": "P00052",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0052",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.2859,
    "classification": "barren",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Radha Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.98875,
            24.663575
          ],
          [
            75.989425,
            24.663575
          ],
          [
            75.989425,
            24.663957
          ],
          [
            75.98875,
            24.663957
          ],
          [
            75.98875,
            24.663575
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00053",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0053",
    "village_name": "Chandwas",
    "area_hectares": 0.1425,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Girdhari Meena",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0295,
            24.66365
          ],
          [
            76.030175,
            24.66365
          ],
          [
            76.030175,
            24.664032
          ],
          [
            76.0295,
            24.664032
          ],
          [
            76.0295,
            24.66365
          ]
        ]
      ]
    }
  },
  {
    "id": "P00054",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0054",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.31,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Ramesh Meena",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9495,
            24.6641
          ],
          [
            75.950175,
            24.6641
          ],
          [
            75.950175,
            24.664482
          ],
          [
            75.9495,
            24.664482
          ],
          [
            75.9495,
            24.6641
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00055",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0055",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.3294,
    "classification": "commercial",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Radha Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.99025,
            24.664175
          ],
          [
            75.990925,
            24.664175
          ],
          [
            75.990925,
            24.664558
          ],
          [
            75.99025,
            24.664558
          ],
          [
            75.99025,
            24.664175
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00056",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0056",
    "village_name": "Chandwas",
    "area_hectares": 0.1764,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Kamla Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.03025,
            24.664625
          ],
          [
            76.030925,
            24.664625
          ],
          [
            76.030925,
            24.665008
          ],
          [
            76.03025,
            24.665008
          ],
          [
            76.03025,
            24.664625
          ]
        ]
      ]
    }
  },
  {
    "id": "P00057",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0057",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3955,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Bhanwar Gujjar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.951,
            24.6647
          ],
          [
            75.951675,
            24.6647
          ],
          [
            75.951675,
            24.665083
          ],
          [
            75.951,
            24.665083
          ],
          [
            75.951,
            24.6647
          ]
        ]
      ]
    }
  },
  {
    "id": "P00058",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0058",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.2566,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Prem Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.991,
            24.66515
          ],
          [
            75.991675,
            24.66515
          ],
          [
            75.991675,
            24.665533
          ],
          [
            75.991,
            24.665533
          ],
          [
            75.991,
            24.66515
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00059",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0059",
    "village_name": "Chandwas",
    "area_hectares": 0.3547,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Shanti Jat",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.03175,
            24.665225
          ],
          [
            76.032425,
            24.665225
          ],
          [
            76.032425,
            24.665608
          ],
          [
            76.03175,
            24.665608
          ],
          [
            76.03175,
            24.665225
          ]
        ]
      ]
    }
  },
  {
    "id": "P00060",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0060",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3799,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Prem Rathore",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.95175,
            24.665675
          ],
          [
            75.952425,
            24.665675
          ],
          [
            75.952425,
            24.666058
          ],
          [
            75.95175,
            24.666058
          ],
          [
            75.95175,
            24.665675
          ]
        ]
      ]
    }
  },
  {
    "id": "P00061",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0061",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.1658,
    "classification": "barren",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Om Prakash Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9925,
            24.66575
          ],
          [
            75.993175,
            24.66575
          ],
          [
            75.993175,
            24.666132
          ],
          [
            75.9925,
            24.666132
          ],
          [
            75.9925,
            24.66575
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00062",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0062",
    "village_name": "Chandwas",
    "area_hectares": 0.375,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Kamla Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0325,
            24.6662
          ],
          [
            76.033175,
            24.6662
          ],
          [
            76.033175,
            24.666583
          ],
          [
            76.0325,
            24.666583
          ],
          [
            76.0325,
            24.6662
          ]
        ]
      ]
    }
  },
  {
    "id": "P00063",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0063",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3099,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Kamla Jat",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.95325,
            24.666275
          ],
          [
            75.953925,
            24.666275
          ],
          [
            75.953925,
            24.666657
          ],
          [
            75.95325,
            24.666657
          ],
          [
            75.95325,
            24.666275
          ]
        ]
      ]
    }
  },
  {
    "id": "P00064",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0064",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.3147,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Champa Jat",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.99325,
            24.666725
          ],
          [
            75.993925,
            24.666725
          ],
          [
            75.993925,
            24.667108
          ],
          [
            75.99325,
            24.667108
          ],
          [
            75.99325,
            24.666725
          ]
        ]
      ]
    }
  },
  {
    "id": "P00065",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0065",
    "village_name": "Chandwas",
    "area_hectares": 0.3868,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Om Prakash Jat",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.034,
            24.6668
          ],
          [
            76.034675,
            24.6668
          ],
          [
            76.034675,
            24.667182
          ],
          [
            76.034,
            24.667182
          ],
          [
            76.034,
            24.6668
          ]
        ]
      ]
    }
  },
  {
    "id": "P00066",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0066",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.317,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Kamla Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.954,
            24.66725
          ],
          [
            75.954675,
            24.66725
          ],
          [
            75.954675,
            24.667632
          ],
          [
            75.954,
            24.667632
          ],
          [
            75.954,
            24.66725
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00067",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0067",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.2228,
    "classification": "commercial",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Champa Jat",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.99475,
            24.667325
          ],
          [
            75.995425,
            24.667325
          ],
          [
            75.995425,
            24.667707
          ],
          [
            75.99475,
            24.667707
          ],
          [
            75.99475,
            24.667325
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00068",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0068",
    "village_name": "Chandwas",
    "area_hectares": 0.046,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Suresh Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.03475,
            24.667775
          ],
          [
            76.035425,
            24.667775
          ],
          [
            76.035425,
            24.668157
          ],
          [
            76.03475,
            24.668157
          ],
          [
            76.03475,
            24.667775
          ]
        ]
      ]
    }
  },
  {
    "id": "P00069",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0069",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.0832,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Shanti Jat",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9555,
            24.66785
          ],
          [
            75.956175,
            24.66785
          ],
          [
            75.956175,
            24.668232
          ],
          [
            75.9555,
            24.668232
          ],
          [
            75.9555,
            24.66785
          ]
        ]
      ]
    }
  },
  {
    "id": "P00070",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0070",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.0865,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Radha Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9955,
            24.6683
          ],
          [
            75.996175,
            24.6683
          ],
          [
            75.996175,
            24.668682
          ],
          [
            75.9955,
            24.668682
          ],
          [
            75.9955,
            24.6683
          ]
        ]
      ]
    }
  },
  {
    "id": "P00071",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0071",
    "village_name": "Chandwas",
    "area_hectares": 0.3258,
    "classification": "barren",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Bhanwar Rathore",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.03625,
            24.668375
          ],
          [
            76.036925,
            24.668375
          ],
          [
            76.036925,
            24.668757
          ],
          [
            76.03625,
            24.668757
          ],
          [
            76.03625,
            24.668375
          ]
        ]
      ]
    }
  },
  {
    "id": "P00072",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0072",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.1348,
    "classification": "commercial",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Champa Jat",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.95625,
            24.668825
          ],
          [
            75.956925,
            24.668825
          ],
          [
            75.956925,
            24.669207
          ],
          [
            75.95625,
            24.669207
          ],
          [
            75.95625,
            24.668825
          ]
        ]
      ]
    }
  },
  {
    "id": "P00073",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0073",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.2504,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Geeta Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.997,
            24.6689
          ],
          [
            75.997675,
            24.6689
          ],
          [
            75.997675,
            24.669282
          ],
          [
            75.997,
            24.669282
          ],
          [
            75.997,
            24.6689
          ]
        ]
      ]
    }
  },
  {
    "id": "P00074",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0074",
    "village_name": "Chandwas",
    "area_hectares": 0.1152,
    "classification": "residential",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Suresh Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.037,
            24.66935
          ],
          [
            76.037675,
            24.66935
          ],
          [
            76.037675,
            24.669732
          ],
          [
            76.037,
            24.669732
          ],
          [
            76.037,
            24.66935
          ]
        ]
      ]
    }
  },
  {
    "id": "P00075",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0075",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3657,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Kailash Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.95775,
            24.669425
          ],
          [
            75.958425,
            24.669425
          ],
          [
            75.958425,
            24.669807
          ],
          [
            75.95775,
            24.669807
          ],
          [
            75.95775,
            24.669425
          ]
        ]
      ]
    }
  },
  {
    "id": "P00076",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0076",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.3334,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Geeta Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.99775,
            24.669875
          ],
          [
            75.998425,
            24.669875
          ],
          [
            75.998425,
            24.670257
          ],
          [
            75.99775,
            24.670257
          ],
          [
            75.99775,
            24.669875
          ]
        ]
      ]
    }
  },
  {
    "id": "P00077",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0077",
    "village_name": "Chandwas",
    "area_hectares": 0.2763,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Girdhari Gujjar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0385,
            24.66995
          ],
          [
            76.039175,
            24.66995
          ],
          [
            76.039175,
            24.670333
          ],
          [
            76.0385,
            24.670333
          ],
          [
            76.0385,
            24.66995
          ]
        ]
      ]
    }
  },
  {
    "id": "P00078",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0078",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.1992,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Sita Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9585,
            24.6704
          ],
          [
            75.959175,
            24.6704
          ],
          [
            75.959175,
            24.670783
          ],
          [
            75.9585,
            24.670783
          ],
          [
            75.9585,
            24.6704
          ]
        ]
      ]
    }
  },
  {
    "id": "P00079",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0079",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.1752,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Kamla Rathore",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.99925,
            24.670475
          ],
          [
            75.999925,
            24.670475
          ],
          [
            75.999925,
            24.670858
          ],
          [
            75.99925,
            24.670858
          ],
          [
            75.99925,
            24.670475
          ]
        ]
      ]
    }
  },
  {
    "id": "P00080",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0080",
    "village_name": "Chandwas",
    "area_hectares": 0.161,
    "classification": "barren",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Prem Rathore",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.03925,
            24.670925
          ],
          [
            76.039925,
            24.670925
          ],
          [
            76.039925,
            24.671308
          ],
          [
            76.03925,
            24.671308
          ],
          [
            76.03925,
            24.670925
          ]
        ]
      ]
    }
  },
  {
    "id": "P00081",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0081",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.0324,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Om Prakash Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.96,
            24.671
          ],
          [
            75.960675,
            24.671
          ],
          [
            75.960675,
            24.671382
          ],
          [
            75.96,
            24.671382
          ],
          [
            75.96,
            24.671
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00082",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0082",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.2269,
    "classification": "commercial",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Prem Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0,
            24.67145
          ],
          [
            76.000675,
            24.67145
          ],
          [
            76.000675,
            24.671833
          ],
          [
            76.0,
            24.671833
          ],
          [
            76.0,
            24.67145
          ]
        ]
      ]
    }
  },
  {
    "id": "P00083",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0083",
    "village_name": "Chandwas",
    "area_hectares": 0.389,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Champa Meena",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.04075,
            24.671525
          ],
          [
            76.041425,
            24.671525
          ],
          [
            76.041425,
            24.671907
          ],
          [
            76.04075,
            24.671907
          ],
          [
            76.04075,
            24.671525
          ]
        ]
      ]
    }
  },
  {
    "id": "P00084",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0084",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.0761,
    "classification": "barren",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Radha Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.96075,
            24.671975
          ],
          [
            75.961425,
            24.671975
          ],
          [
            75.961425,
            24.672358
          ],
          [
            75.96075,
            24.672358
          ],
          [
            75.96075,
            24.671975
          ]
        ]
      ]
    }
  },
  {
    "id": "P00085",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0085",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.3202,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Om Prakash Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0015,
            24.67205
          ],
          [
            76.002175,
            24.67205
          ],
          [
            76.002175,
            24.672432
          ],
          [
            76.0015,
            24.672432
          ],
          [
            76.0015,
            24.67205
          ]
        ]
      ]
    }
  },
  {
    "id": "P00086",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0086",
    "village_name": "Chandwas",
    "area_hectares": 0.0614,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Shanti Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0415,
            24.6725
          ],
          [
            76.042175,
            24.6725
          ],
          [
            76.042175,
            24.672883
          ],
          [
            76.0415,
            24.672883
          ],
          [
            76.0415,
            24.6725
          ]
        ]
      ]
    }
  },
  {
    "id": "P00087",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0087",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3863,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Kamla Rathore",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.96225,
            24.672575
          ],
          [
            75.962925,
            24.672575
          ],
          [
            75.962925,
            24.672957
          ],
          [
            75.96225,
            24.672957
          ],
          [
            75.96225,
            24.672575
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00088",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0088",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.1885,
    "classification": "barren",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Geeta Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.00225,
            24.673025
          ],
          [
            76.002925,
            24.673025
          ],
          [
            76.002925,
            24.673407
          ],
          [
            76.00225,
            24.673407
          ],
          [
            76.00225,
            24.673025
          ]
        ]
      ]
    }
  },
  {
    "id": "P00089",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0089",
    "village_name": "Chandwas",
    "area_hectares": 0.1924,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Champa Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.043,
            24.6731
          ],
          [
            76.043675,
            24.6731
          ],
          [
            76.043675,
            24.673482
          ],
          [
            76.043,
            24.673482
          ],
          [
            76.043,
            24.6731
          ]
        ]
      ]
    }
  },
  {
    "id": "P00090",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0090",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.1488,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Suresh Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.963,
            24.67355
          ],
          [
            75.963675,
            24.67355
          ],
          [
            75.963675,
            24.673932
          ],
          [
            75.963,
            24.673932
          ],
          [
            75.963,
            24.67355
          ]
        ]
      ]
    }
  },
  {
    "id": "P00091",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0091",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.0524,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Shanti Gujjar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.00375,
            24.673625
          ],
          [
            76.004425,
            24.673625
          ],
          [
            76.004425,
            24.674007
          ],
          [
            76.00375,
            24.674007
          ],
          [
            76.00375,
            24.673625
          ]
        ]
      ]
    }
  },
  {
    "id": "P00092",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0092",
    "village_name": "Chandwas",
    "area_hectares": 0.2728,
    "classification": "residential",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Bhanwar Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.04375,
            24.674075
          ],
          [
            76.044425,
            24.674075
          ],
          [
            76.044425,
            24.674457
          ],
          [
            76.04375,
            24.674457
          ],
          [
            76.04375,
            24.674075
          ]
        ]
      ]
    }
  },
  {
    "id": "P00093",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0093",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.1259,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Shanti Meena",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9645,
            24.67415
          ],
          [
            75.965175,
            24.67415
          ],
          [
            75.965175,
            24.674532
          ],
          [
            75.9645,
            24.674532
          ],
          [
            75.9645,
            24.67415
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00094",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0094",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.2316,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Kamla Rathore",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0045,
            24.6746
          ],
          [
            76.005175,
            24.6746
          ],
          [
            76.005175,
            24.674982
          ],
          [
            76.0045,
            24.674982
          ],
          [
            76.0045,
            24.6746
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00095",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0095",
    "village_name": "Chandwas",
    "area_hectares": 0.1374,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Shanti Meena",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.04525,
            24.674675
          ],
          [
            76.045925,
            24.674675
          ],
          [
            76.045925,
            24.675057
          ],
          [
            76.04525,
            24.675057
          ],
          [
            76.04525,
            24.674675
          ]
        ]
      ]
    }
  },
  {
    "id": "P00096",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0096",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.163,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Champa Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.96525,
            24.675125
          ],
          [
            75.965925,
            24.675125
          ],
          [
            75.965925,
            24.675507
          ],
          [
            75.96525,
            24.675507
          ],
          [
            75.96525,
            24.675125
          ]
        ]
      ]
    }
  },
  {
    "id": "P00097",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0097",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.051,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Girdhari Gujjar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.006,
            24.6752
          ],
          [
            76.006675,
            24.6752
          ],
          [
            76.006675,
            24.675583
          ],
          [
            76.006,
            24.675583
          ],
          [
            76.006,
            24.6752
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00098",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0098",
    "village_name": "Chandwas",
    "area_hectares": 0.1512,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Radha Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.046,
            24.67565
          ],
          [
            76.046675,
            24.67565
          ],
          [
            76.046675,
            24.676033
          ],
          [
            76.046,
            24.676033
          ],
          [
            76.046,
            24.67565
          ]
        ]
      ]
    }
  },
  {
    "id": "P00099",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0099",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3116,
    "classification": "residential",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Champa Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.96675,
            24.675725
          ],
          [
            75.967425,
            24.675725
          ],
          [
            75.967425,
            24.676108
          ],
          [
            75.96675,
            24.676108
          ],
          [
            75.96675,
            24.675725
          ]
        ]
      ]
    }
  },
  {
    "id": "P00100",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0100",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.0496,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Geeta Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.00675,
            24.676175
          ],
          [
            76.007425,
            24.676175
          ],
          [
            76.007425,
            24.676558
          ],
          [
            76.00675,
            24.676558
          ],
          [
            76.00675,
            24.676175
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00101",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0101",
    "village_name": "Chandwas",
    "area_hectares": 0.0279,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Ramesh Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0475,
            24.67625
          ],
          [
            76.048175,
            24.67625
          ],
          [
            76.048175,
            24.676633
          ],
          [
            76.0475,
            24.676633
          ],
          [
            76.0475,
            24.67625
          ]
        ]
      ]
    }
  },
  {
    "id": "P00102",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0102",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.1722,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Shanti Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9675,
            24.6767
          ],
          [
            75.968175,
            24.6767
          ],
          [
            75.968175,
            24.677083
          ],
          [
            75.9675,
            24.677083
          ],
          [
            75.9675,
            24.6767
          ]
        ]
      ]
    }
  },
  {
    "id": "P00103",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0103",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.0591,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Geeta Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.00825,
            24.676775
          ],
          [
            76.008925,
            24.676775
          ],
          [
            76.008925,
            24.677157
          ],
          [
            76.00825,
            24.677157
          ],
          [
            76.00825,
            24.676775
          ]
        ]
      ]
    }
  },
  {
    "id": "P00104",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0104",
    "village_name": "Chandwas",
    "area_hectares": 0.2788,
    "classification": "barren",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Shanti Jat",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.04825,
            24.677225
          ],
          [
            76.048925,
            24.677225
          ],
          [
            76.048925,
            24.677608
          ],
          [
            76.04825,
            24.677608
          ],
          [
            76.04825,
            24.677225
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00105",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0105",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.1871,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Om Prakash Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.969,
            24.6773
          ],
          [
            75.969675,
            24.6773
          ],
          [
            75.969675,
            24.677682
          ],
          [
            75.969,
            24.677682
          ],
          [
            75.969,
            24.6773
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00106",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0106",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.1379,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Sita Jat",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.009,
            24.67775
          ],
          [
            76.009675,
            24.67775
          ],
          [
            76.009675,
            24.678133
          ],
          [
            76.009,
            24.678133
          ],
          [
            76.009,
            24.67775
          ]
        ]
      ]
    }
  },
  {
    "id": "P00107",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0107",
    "village_name": "Chandwas",
    "area_hectares": 0.3826,
    "classification": "residential",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Kamla Jat",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.04975,
            24.677825
          ],
          [
            76.050425,
            24.677825
          ],
          [
            76.050425,
            24.678207
          ],
          [
            76.04975,
            24.678207
          ],
          [
            76.04975,
            24.677825
          ]
        ]
      ]
    }
  },
  {
    "id": "P00108",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0108",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.2117,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Kailash Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.96975,
            24.678275
          ],
          [
            75.970425,
            24.678275
          ],
          [
            75.970425,
            24.678657
          ],
          [
            75.96975,
            24.678657
          ],
          [
            75.96975,
            24.678275
          ]
        ]
      ]
    }
  },
  {
    "id": "P00109",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0109",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.0399,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Champa Meena",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0105,
            24.67835
          ],
          [
            76.011175,
            24.67835
          ],
          [
            76.011175,
            24.678732
          ],
          [
            76.0105,
            24.678732
          ],
          [
            76.0105,
            24.67835
          ]
        ]
      ]
    }
  },
  {
    "id": "P00110",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0110",
    "village_name": "Chandwas",
    "area_hectares": 0.051,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Kamla Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0505,
            24.6788
          ],
          [
            76.051175,
            24.6788
          ],
          [
            76.051175,
            24.679182
          ],
          [
            76.0505,
            24.679182
          ],
          [
            76.0505,
            24.6788
          ]
        ]
      ]
    }
  },
  {
    "id": "P00111",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0111",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.2324,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Radha Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.97125,
            24.678875
          ],
          [
            75.971925,
            24.678875
          ],
          [
            75.971925,
            24.679257
          ],
          [
            75.97125,
            24.679257
          ],
          [
            75.97125,
            24.678875
          ]
        ]
      ]
    }
  },
  {
    "id": "P00112",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0112",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.1575,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Om Prakash Jat",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.01125,
            24.679325
          ],
          [
            76.011925,
            24.679325
          ],
          [
            76.011925,
            24.679707
          ],
          [
            76.01125,
            24.679707
          ],
          [
            76.01125,
            24.679325
          ]
        ]
      ]
    }
  },
  {
    "id": "P00113",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0113",
    "village_name": "Chandwas",
    "area_hectares": 0.2251,
    "classification": "residential",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Radha Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.052,
            24.6794
          ],
          [
            76.052675,
            24.6794
          ],
          [
            76.052675,
            24.679782
          ],
          [
            76.052,
            24.679782
          ],
          [
            76.052,
            24.6794
          ]
        ]
      ]
    }
  },
  {
    "id": "P00114",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0114",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.1631,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Champa Meena",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.972,
            24.67985
          ],
          [
            75.972675,
            24.67985
          ],
          [
            75.972675,
            24.680232
          ],
          [
            75.972,
            24.680232
          ],
          [
            75.972,
            24.67985
          ]
        ]
      ]
    }
  },
  {
    "id": "P00115",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0115",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.1103,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Girdhari Gujjar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.01275,
            24.679925
          ],
          [
            76.013425,
            24.679925
          ],
          [
            76.013425,
            24.680307
          ],
          [
            76.01275,
            24.680307
          ],
          [
            76.01275,
            24.679925
          ]
        ]
      ]
    }
  },
  {
    "id": "P00116",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0116",
    "village_name": "Chandwas",
    "area_hectares": 0.3799,
    "classification": "commercial",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Girdhari Gujjar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.05275,
            24.680375
          ],
          [
            76.053425,
            24.680375
          ],
          [
            76.053425,
            24.680757
          ],
          [
            76.05275,
            24.680757
          ],
          [
            76.05275,
            24.680375
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00117",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0117",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3304,
    "classification": "residential",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Radha Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9735,
            24.68045
          ],
          [
            75.974175,
            24.68045
          ],
          [
            75.974175,
            24.680832
          ],
          [
            75.9735,
            24.680832
          ],
          [
            75.9735,
            24.68045
          ]
        ]
      ]
    }
  },
  {
    "id": "P00118",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0118",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.0809,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Shanti Meena",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0135,
            24.6809
          ],
          [
            76.014175,
            24.6809
          ],
          [
            76.014175,
            24.681282
          ],
          [
            76.0135,
            24.681282
          ],
          [
            76.0135,
            24.6809
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00119",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0119",
    "village_name": "Chandwas",
    "area_hectares": 0.1528,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Om Prakash Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.05425,
            24.680975
          ],
          [
            76.054925,
            24.680975
          ],
          [
            76.054925,
            24.681358
          ],
          [
            76.05425,
            24.681358
          ],
          [
            76.05425,
            24.680975
          ]
        ]
      ]
    }
  },
  {
    "id": "P00120",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0120",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3207,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Kamla Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.97425,
            24.681425
          ],
          [
            75.974925,
            24.681425
          ],
          [
            75.974925,
            24.681808
          ],
          [
            75.97425,
            24.681808
          ],
          [
            75.97425,
            24.681425
          ]
        ]
      ]
    }
  },
  {
    "id": "P00121",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0121",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.1019,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Champa Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.015,
            24.6815
          ],
          [
            76.015675,
            24.6815
          ],
          [
            76.015675,
            24.681883
          ],
          [
            76.015,
            24.681883
          ],
          [
            76.015,
            24.6815
          ]
        ]
      ]
    }
  },
  {
    "id": "P00122",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0122",
    "village_name": "Chandwas",
    "area_hectares": 0.1106,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Geeta Meena",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.055,
            24.68195
          ],
          [
            76.055675,
            24.68195
          ],
          [
            76.055675,
            24.682333
          ],
          [
            76.055,
            24.682333
          ],
          [
            76.055,
            24.68195
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00123",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0123",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.0262,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Ramesh Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.97575,
            24.682025
          ],
          [
            75.976425,
            24.682025
          ],
          [
            75.976425,
            24.682408
          ],
          [
            75.97575,
            24.682408
          ],
          [
            75.97575,
            24.682025
          ]
        ]
      ]
    }
  },
  {
    "id": "P00124",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0124",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.0457,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Prem Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.01575,
            24.682475
          ],
          [
            76.016425,
            24.682475
          ],
          [
            76.016425,
            24.682858
          ],
          [
            76.01575,
            24.682858
          ],
          [
            76.01575,
            24.682475
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00125",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0125",
    "village_name": "Chandwas",
    "area_hectares": 0.167,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Radha Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0565,
            24.68255
          ],
          [
            76.057175,
            24.68255
          ],
          [
            76.057175,
            24.682932
          ],
          [
            76.0565,
            24.682932
          ],
          [
            76.0565,
            24.68255
          ]
        ]
      ]
    }
  },
  {
    "id": "P00126",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0126",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.1539,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Ramesh Meena",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9765,
            24.683
          ],
          [
            75.977175,
            24.683
          ],
          [
            75.977175,
            24.683383
          ],
          [
            75.9765,
            24.683383
          ],
          [
            75.9765,
            24.683
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00127",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0127",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.0893,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Radha Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.01725,
            24.683075
          ],
          [
            76.017925,
            24.683075
          ],
          [
            76.017925,
            24.683457
          ],
          [
            76.01725,
            24.683457
          ],
          [
            76.01725,
            24.683075
          ]
        ]
      ]
    }
  },
  {
    "id": "P00128",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0128",
    "village_name": "Chandwas",
    "area_hectares": 0.3959,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Ramesh Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.05725,
            24.683525
          ],
          [
            76.057925,
            24.683525
          ],
          [
            76.057925,
            24.683908
          ],
          [
            76.05725,
            24.683908
          ],
          [
            76.05725,
            24.683525
          ]
        ]
      ]
    }
  },
  {
    "id": "P00129",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0129",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.358,
    "classification": "residential",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Kailash Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.978,
            24.6836
          ],
          [
            75.978675,
            24.6836
          ],
          [
            75.978675,
            24.683982
          ],
          [
            75.978,
            24.683982
          ],
          [
            75.978,
            24.6836
          ]
        ]
      ]
    }
  },
  {
    "id": "P00130",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0130",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.1421,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Champa Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.018,
            24.68405
          ],
          [
            76.018675,
            24.68405
          ],
          [
            76.018675,
            24.684432
          ],
          [
            76.018,
            24.684432
          ],
          [
            76.018,
            24.68405
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00131",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0131",
    "village_name": "Chandwas",
    "area_hectares": 0.1887,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Suresh Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.05875,
            24.684125
          ],
          [
            76.059425,
            24.684125
          ],
          [
            76.059425,
            24.684507
          ],
          [
            76.05875,
            24.684507
          ],
          [
            76.05875,
            24.684125
          ]
        ]
      ]
    }
  },
  {
    "id": "P00132",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0132",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.1581,
    "classification": "residential",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Ramesh Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.97875,
            24.684575
          ],
          [
            75.979425,
            24.684575
          ],
          [
            75.979425,
            24.684957
          ],
          [
            75.97875,
            24.684957
          ],
          [
            75.97875,
            24.684575
          ]
        ]
      ]
    }
  },
  {
    "id": "P00133",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0133",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.1887,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Prem Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0195,
            24.68465
          ],
          [
            76.020175,
            24.68465
          ],
          [
            76.020175,
            24.685032
          ],
          [
            76.0195,
            24.685032
          ],
          [
            76.0195,
            24.68465
          ]
        ]
      ]
    }
  },
  {
    "id": "P00134",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0134",
    "village_name": "Chandwas",
    "area_hectares": 0.2334,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Geeta Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0595,
            24.6851
          ],
          [
            76.060175,
            24.6851
          ],
          [
            76.060175,
            24.685482
          ],
          [
            76.0595,
            24.685482
          ],
          [
            76.0595,
            24.6851
          ]
        ]
      ]
    }
  },
  {
    "id": "P00135",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0135",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3615,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Sita Rathore",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.98025,
            24.685175
          ],
          [
            75.980925,
            24.685175
          ],
          [
            75.980925,
            24.685557
          ],
          [
            75.98025,
            24.685557
          ],
          [
            75.98025,
            24.685175
          ]
        ]
      ]
    }
  },
  {
    "id": "P00136",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0136",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.3724,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Bhanwar Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.02025,
            24.685625
          ],
          [
            76.020925,
            24.685625
          ],
          [
            76.020925,
            24.686007
          ],
          [
            76.02025,
            24.686007
          ],
          [
            76.02025,
            24.685625
          ]
        ]
      ]
    }
  },
  {
    "id": "P00137",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0137",
    "village_name": "Chandwas",
    "area_hectares": 0.2375,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Kamla Jat",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.061,
            24.6857
          ],
          [
            76.061675,
            24.6857
          ],
          [
            76.061675,
            24.686082
          ],
          [
            76.061,
            24.686082
          ],
          [
            76.061,
            24.6857
          ]
        ]
      ]
    }
  },
  {
    "id": "P00138",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0138",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3998,
    "classification": "residential",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Ramesh Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.981,
            24.68615
          ],
          [
            75.981675,
            24.68615
          ],
          [
            75.981675,
            24.686532
          ],
          [
            75.981,
            24.686532
          ],
          [
            75.981,
            24.68615
          ]
        ]
      ]
    }
  },
  {
    "id": "P00139",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0139",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.2641,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Sita Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.02175,
            24.686225
          ],
          [
            76.022425,
            24.686225
          ],
          [
            76.022425,
            24.686608
          ],
          [
            76.02175,
            24.686608
          ],
          [
            76.02175,
            24.686225
          ]
        ]
      ]
    }
  },
  {
    "id": "P00140",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0140",
    "village_name": "Chandwas",
    "area_hectares": 0.3499,
    "classification": "residential",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Geeta Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.06175,
            24.686675
          ],
          [
            76.062425,
            24.686675
          ],
          [
            76.062425,
            24.687058
          ],
          [
            76.06175,
            24.687058
          ],
          [
            76.06175,
            24.686675
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00141",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0141",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3834,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Radha Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9825,
            24.68675
          ],
          [
            75.983175,
            24.68675
          ],
          [
            75.983175,
            24.687133
          ],
          [
            75.9825,
            24.687133
          ],
          [
            75.9825,
            24.68675
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00142",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0142",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.3778,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Shanti Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0225,
            24.6872
          ],
          [
            76.023175,
            24.6872
          ],
          [
            76.023175,
            24.687583
          ],
          [
            76.0225,
            24.687583
          ],
          [
            76.0225,
            24.6872
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00143",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0143",
    "village_name": "Chandwas",
    "area_hectares": 0.3482,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Bhanwar Gujjar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.06325,
            24.687275
          ],
          [
            76.063925,
            24.687275
          ],
          [
            76.063925,
            24.687658
          ],
          [
            76.06325,
            24.687658
          ],
          [
            76.06325,
            24.687275
          ]
        ]
      ]
    }
  },
  {
    "id": "P00144",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0144",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3578,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Bhanwar Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.98325,
            24.687725
          ],
          [
            75.983925,
            24.687725
          ],
          [
            75.983925,
            24.688108
          ],
          [
            75.98325,
            24.688108
          ],
          [
            75.98325,
            24.687725
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00145",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0145",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.1923,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Radha Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.024,
            24.6878
          ],
          [
            76.024675,
            24.6878
          ],
          [
            76.024675,
            24.688182
          ],
          [
            76.024,
            24.688182
          ],
          [
            76.024,
            24.6878
          ]
        ]
      ]
    }
  },
  {
    "id": "P00146",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0146",
    "village_name": "Chandwas",
    "area_hectares": 0.309,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Girdhari Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.064,
            24.68825
          ],
          [
            76.064675,
            24.68825
          ],
          [
            76.064675,
            24.688633
          ],
          [
            76.064,
            24.688633
          ],
          [
            76.064,
            24.68825
          ]
        ]
      ]
    }
  },
  {
    "id": "P00147",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0147",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3858,
    "classification": "barren",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Geeta Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.98475,
            24.688325
          ],
          [
            75.985425,
            24.688325
          ],
          [
            75.985425,
            24.688707
          ],
          [
            75.98475,
            24.688707
          ],
          [
            75.98475,
            24.688325
          ]
        ]
      ]
    }
  },
  {
    "id": "P00148",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0148",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.354,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Bhanwar Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.02475,
            24.688775
          ],
          [
            76.025425,
            24.688775
          ],
          [
            76.025425,
            24.689158
          ],
          [
            76.02475,
            24.689158
          ],
          [
            76.02475,
            24.688775
          ]
        ]
      ]
    }
  },
  {
    "id": "P00149",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0149",
    "village_name": "Chandwas",
    "area_hectares": 0.1988,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Girdhari Gujjar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0655,
            24.68885
          ],
          [
            76.066175,
            24.68885
          ],
          [
            76.066175,
            24.689232
          ],
          [
            76.0655,
            24.689232
          ],
          [
            76.0655,
            24.68885
          ]
        ]
      ]
    }
  },
  {
    "id": "P00150",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0150",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.2289,
    "classification": "residential",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Shanti Meena",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9855,
            24.6893
          ],
          [
            75.986175,
            24.6893
          ],
          [
            75.986175,
            24.689682
          ],
          [
            75.9855,
            24.689682
          ],
          [
            75.9855,
            24.6893
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00151",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0151",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.1725,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Om Prakash Jat",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.02625,
            24.689375
          ],
          [
            76.026925,
            24.689375
          ],
          [
            76.026925,
            24.689757
          ],
          [
            76.02625,
            24.689757
          ],
          [
            76.02625,
            24.689375
          ]
        ]
      ]
    }
  },
  {
    "id": "P00152",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0152",
    "village_name": "Chandwas",
    "area_hectares": 0.1693,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Radha Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.06625,
            24.689825
          ],
          [
            76.066925,
            24.689825
          ],
          [
            76.066925,
            24.690207
          ],
          [
            76.06625,
            24.690207
          ],
          [
            76.06625,
            24.689825
          ]
        ]
      ]
    }
  },
  {
    "id": "P00153",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0153",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.0301,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Radha Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.987,
            24.6899
          ],
          [
            75.987675,
            24.6899
          ],
          [
            75.987675,
            24.690282
          ],
          [
            75.987,
            24.690282
          ],
          [
            75.987,
            24.6899
          ]
        ]
      ]
    }
  },
  {
    "id": "P00154",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0154",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.2417,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Geeta Meena",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.027,
            24.69035
          ],
          [
            76.027675,
            24.69035
          ],
          [
            76.027675,
            24.690732
          ],
          [
            76.027,
            24.690732
          ],
          [
            76.027,
            24.69035
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00155",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0155",
    "village_name": "Chandwas",
    "area_hectares": 0.032,
    "classification": "barren",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Geeta Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.06775,
            24.690425
          ],
          [
            76.068425,
            24.690425
          ],
          [
            76.068425,
            24.690807
          ],
          [
            76.06775,
            24.690807
          ],
          [
            76.06775,
            24.690425
          ]
        ]
      ]
    }
  },
  {
    "id": "P00156",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0156",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.0437,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Girdhari Gujjar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.98775,
            24.690875
          ],
          [
            75.988425,
            24.690875
          ],
          [
            75.988425,
            24.691257
          ],
          [
            75.98775,
            24.691257
          ],
          [
            75.98775,
            24.690875
          ]
        ]
      ]
    }
  },
  {
    "id": "P00157",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0157",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.3134,
    "classification": "residential",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Girdhari Gujjar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0285,
            24.69095
          ],
          [
            76.029175,
            24.69095
          ],
          [
            76.029175,
            24.691332
          ],
          [
            76.0285,
            24.691332
          ],
          [
            76.0285,
            24.69095
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00158",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0158",
    "village_name": "Chandwas",
    "area_hectares": 0.1334,
    "classification": "barren",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Kamla Jat",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0685,
            24.6914
          ],
          [
            76.069175,
            24.6914
          ],
          [
            76.069175,
            24.691782
          ],
          [
            76.0685,
            24.691782
          ],
          [
            76.0685,
            24.6914
          ]
        ]
      ]
    }
  },
  {
    "id": "P00159",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0159",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.1405,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Bhanwar Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.98925,
            24.691475
          ],
          [
            75.989925,
            24.691475
          ],
          [
            75.989925,
            24.691857
          ],
          [
            75.98925,
            24.691857
          ],
          [
            75.98925,
            24.691475
          ]
        ]
      ]
    }
  },
  {
    "id": "P00160",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0160",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.3925,
    "classification": "residential",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Bhanwar Rathore",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.02925,
            24.691925
          ],
          [
            76.029925,
            24.691925
          ],
          [
            76.029925,
            24.692307
          ],
          [
            76.02925,
            24.692307
          ],
          [
            76.02925,
            24.691925
          ]
        ]
      ]
    }
  },
  {
    "id": "P00161",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0161",
    "village_name": "Chandwas",
    "area_hectares": 0.3346,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Om Prakash Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.07,
            24.692
          ],
          [
            76.070675,
            24.692
          ],
          [
            76.070675,
            24.692383
          ],
          [
            76.07,
            24.692383
          ],
          [
            76.07,
            24.692
          ]
        ]
      ]
    }
  },
  {
    "id": "P00162",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0162",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.243,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Girdhari Meena",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.99,
            24.69245
          ],
          [
            75.990675,
            24.69245
          ],
          [
            75.990675,
            24.692833
          ],
          [
            75.99,
            24.692833
          ],
          [
            75.99,
            24.69245
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00163",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0163",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.1455,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Suresh Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.03075,
            24.692525
          ],
          [
            76.031425,
            24.692525
          ],
          [
            76.031425,
            24.692908
          ],
          [
            76.03075,
            24.692908
          ],
          [
            76.03075,
            24.692525
          ]
        ]
      ]
    }
  },
  {
    "id": "P00164",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0164",
    "village_name": "Chandwas",
    "area_hectares": 0.0958,
    "classification": "commercial",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Kamla Rathore",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.07075,
            24.692975
          ],
          [
            76.071425,
            24.692975
          ],
          [
            76.071425,
            24.693358
          ],
          [
            76.07075,
            24.693358
          ],
          [
            76.07075,
            24.692975
          ]
        ]
      ]
    }
  },
  {
    "id": "P00165",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0165",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.3553,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Suresh Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9915,
            24.69305
          ],
          [
            75.992175,
            24.69305
          ],
          [
            75.992175,
            24.693433
          ],
          [
            75.9915,
            24.693433
          ],
          [
            75.9915,
            24.69305
          ]
        ]
      ]
    }
  },
  {
    "id": "P00166",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0166",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.1334,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Geeta Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0315,
            24.6935
          ],
          [
            76.032175,
            24.6935
          ],
          [
            76.032175,
            24.693883
          ],
          [
            76.0315,
            24.693883
          ],
          [
            76.0315,
            24.6935
          ]
        ]
      ]
    }
  },
  {
    "id": "P00167",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0167",
    "village_name": "Chandwas",
    "area_hectares": 0.3766,
    "classification": "barren",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Om Prakash Mali",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.07225,
            24.693575
          ],
          [
            76.072925,
            24.693575
          ],
          [
            76.072925,
            24.693957
          ],
          [
            76.07225,
            24.693957
          ],
          [
            76.07225,
            24.693575
          ]
        ]
      ]
    },
    "blocker": {
      "type": "boundary_dispute",
      "status": "ACTIVE",
      "description": "Active boundary_dispute blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00168",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0168",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.2663,
    "classification": "residential",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Prem Rathore",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.99225,
            24.694025
          ],
          [
            75.992925,
            24.694025
          ],
          [
            75.992925,
            24.694408
          ],
          [
            75.99225,
            24.694408
          ],
          [
            75.99225,
            24.694025
          ]
        ]
      ]
    }
  },
  {
    "id": "P00169",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0169",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.053,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Sita Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.033,
            24.6941
          ],
          [
            76.033675,
            24.6941
          ],
          [
            76.033675,
            24.694482
          ],
          [
            76.033,
            24.694482
          ],
          [
            76.033,
            24.6941
          ]
        ]
      ]
    }
  },
  {
    "id": "P00170",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0170",
    "village_name": "Chandwas",
    "area_hectares": 0.2947,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Shanti Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.073,
            24.69455
          ],
          [
            76.073675,
            24.69455
          ],
          [
            76.073675,
            24.694933
          ],
          [
            76.073,
            24.694933
          ],
          [
            76.073,
            24.69455
          ]
        ]
      ]
    },
    "blocker": {
      "type": "duplicate_claim",
      "status": "ACTIVE",
      "description": "Active duplicate_claim blocking Right-of-Way possession",
      "assumed_resolution_days": 45
    }
  },
  {
    "id": "P00171",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0171",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.0807,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Radha Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.99375,
            24.694625
          ],
          [
            75.994425,
            24.694625
          ],
          [
            75.994425,
            24.695007
          ],
          [
            75.99375,
            24.695007
          ],
          [
            75.99375,
            24.694625
          ]
        ]
      ]
    }
  },
  {
    "id": "P00172",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0172",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.2536,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Prem Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.03375,
            24.695075
          ],
          [
            76.034425,
            24.695075
          ],
          [
            76.034425,
            24.695457
          ],
          [
            76.03375,
            24.695457
          ],
          [
            76.03375,
            24.695075
          ]
        ]
      ]
    }
  },
  {
    "id": "P00173",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0173",
    "village_name": "Chandwas",
    "area_hectares": 0.103,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Bhanwar Gujjar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0745,
            24.69515
          ],
          [
            76.075175,
            24.69515
          ],
          [
            76.075175,
            24.695532
          ],
          [
            76.0745,
            24.695532
          ],
          [
            76.0745,
            24.69515
          ]
        ]
      ]
    }
  },
  {
    "id": "P00174",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0174",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.2121,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Bhanwar Rathore",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.9945,
            24.6956
          ],
          [
            75.995175,
            24.6956
          ],
          [
            75.995175,
            24.695982
          ],
          [
            75.9945,
            24.695982
          ],
          [
            75.9945,
            24.6956
          ]
        ]
      ]
    }
  },
  {
    "id": "P00175",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0175",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.0701,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Prem Rathore",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.03525,
            24.695675
          ],
          [
            76.035925,
            24.695675
          ],
          [
            76.035925,
            24.696057
          ],
          [
            76.03525,
            24.696057
          ],
          [
            76.03525,
            24.695675
          ]
        ]
      ]
    }
  },
  {
    "id": "P00176",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0176",
    "village_name": "Chandwas",
    "area_hectares": 0.0283,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Girdhari Gujjar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.07525,
            24.696125
          ],
          [
            76.075925,
            24.696125
          ],
          [
            76.075925,
            24.696507
          ],
          [
            76.07525,
            24.696507
          ],
          [
            76.07525,
            24.696125
          ]
        ]
      ]
    }
  },
  {
    "id": "P00177",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0177",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.1291,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Ramesh Meena",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.996,
            24.6962
          ],
          [
            75.996675,
            24.6962
          ],
          [
            75.996675,
            24.696582
          ],
          [
            75.996,
            24.696582
          ],
          [
            75.996,
            24.6962
          ]
        ]
      ]
    }
  },
  {
    "id": "P00178",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0178",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.2794,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Kailash Suthar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.036,
            24.69665
          ],
          [
            76.036675,
            24.69665
          ],
          [
            76.036675,
            24.697032
          ],
          [
            76.036,
            24.697032
          ],
          [
            76.036,
            24.69665
          ]
        ]
      ]
    }
  },
  {
    "id": "P00179",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V03-KH-0179",
    "village_name": "Chandwas",
    "area_hectares": 0.1694,
    "classification": "agricultural",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "notified",
    "is_lapsed": false,
    "owner_name": "Ramesh Sharma",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.07675,
            24.696725
          ],
          [
            76.077425,
            24.696725
          ],
          [
            76.077425,
            24.697107
          ],
          [
            76.07675,
            24.697107
          ],
          [
            76.07675,
            24.696725
          ]
        ]
      ]
    }
  },
  {
    "id": "P00180",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V01-KH-0180",
    "village_name": "Kanhera Kalan",
    "area_hectares": 0.2933,
    "classification": "agricultural",
    "status": "POSSESSION",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "possessed",
    "is_lapsed": false,
    "owner_name": "Girdhari Gujjar",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            75.99675,
            24.697175
          ],
          [
            75.997425,
            24.697175
          ],
          [
            75.997425,
            24.697557
          ],
          [
            75.99675,
            24.697557
          ],
          [
            75.99675,
            24.697175
          ]
        ]
      ]
    }
  },
  {
    "id": "P00181",
    "project_id": "P-NH927A",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "survey_no": "V02-KH-0181",
    "village_name": "Bardoli Khera",
    "area_hectares": 0.2537,
    "classification": "barren",
    "status": "UNRESOLVED",
    "statutory_act": "RFCTLARR_2013",
    "current_stage": "compensation_pending",
    "is_lapsed": false,
    "owner_name": "Suresh Yadav",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            76.0375,
            24.69725
          ],
          [
            76.038175,
            24.69725
          ],
          [
            76.038175,
            24.697632
          ],
          [
            76.0375,
            24.697632
          ],
          [
            76.0375,
            24.69725
          ]
        ]
      ]
    }
  }
];

export const REAL_CASES: RealCase[] = [
  {
    "id": "AC00001",
    "parcel_id": "P00001",
    "survey_no": "V02-KH-0001",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Geeta Meena",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00002",
    "parcel_id": "P00002",
    "survey_no": "V03-KH-0002",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Sita Jat",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00003",
    "parcel_id": "P00003",
    "survey_no": "V01-KH-0003",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kailash Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00004",
    "parcel_id": "P00004",
    "survey_no": "V02-KH-0004",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Suresh Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00005",
    "parcel_id": "P00005",
    "survey_no": "V03-KH-0005",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Shanti Gujjar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00006",
    "parcel_id": "P00006",
    "survey_no": "V01-KH-0006",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Radha Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00007",
    "parcel_id": "P00007",
    "survey_no": "V02-KH-0007",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kailash Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00008",
    "parcel_id": "P00008",
    "survey_no": "V03-KH-0008",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Om Prakash Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00009",
    "parcel_id": "P00009",
    "survey_no": "V01-KH-0009",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Champa Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00010",
    "parcel_id": "P00010",
    "survey_no": "V02-KH-0010",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Suresh Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00011",
    "parcel_id": "P00011",
    "survey_no": "V03-KH-0011",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Bhanwar Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00012",
    "parcel_id": "P00012",
    "survey_no": "V01-KH-0012",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Om Prakash Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00013",
    "parcel_id": "P00013",
    "survey_no": "V02-KH-0013",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Shanti Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00014",
    "parcel_id": "P00014",
    "survey_no": "V03-KH-0014",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Champa Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00015",
    "parcel_id": "P00015",
    "survey_no": "V01-KH-0015",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Sita Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00016",
    "parcel_id": "P00016",
    "survey_no": "V02-KH-0016",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Om Prakash Jat",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00017",
    "parcel_id": "P00017",
    "survey_no": "V03-KH-0017",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Radha Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00018",
    "parcel_id": "P00018",
    "survey_no": "V01-KH-0018",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Sita Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00019",
    "parcel_id": "P00019",
    "survey_no": "V02-KH-0019",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Radha Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00020",
    "parcel_id": "P00020",
    "survey_no": "V03-KH-0020",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Champa Meena",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00021",
    "parcel_id": "P00021",
    "survey_no": "V01-KH-0021",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Sita Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00022",
    "parcel_id": "P00022",
    "survey_no": "V02-KH-0022",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Girdhari Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00023",
    "parcel_id": "P00023",
    "survey_no": "V03-KH-0023",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Bhanwar Gujjar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00024",
    "parcel_id": "P00024",
    "survey_no": "V01-KH-0024",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Radha Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00025",
    "parcel_id": "P00025",
    "survey_no": "V02-KH-0025",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Champa Meena",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00026",
    "parcel_id": "P00026",
    "survey_no": "V03-KH-0026",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Champa Jat",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00027",
    "parcel_id": "P00027",
    "survey_no": "V01-KH-0027",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Ramesh Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00028",
    "parcel_id": "P00028",
    "survey_no": "V02-KH-0028",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kailash Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00029",
    "parcel_id": "P00029",
    "survey_no": "V03-KH-0029",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Suresh Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00030",
    "parcel_id": "P00030",
    "survey_no": "V01-KH-0030",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kailash Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00031",
    "parcel_id": "P00031",
    "survey_no": "V02-KH-0031",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Shanti Gujjar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00032",
    "parcel_id": "P00032",
    "survey_no": "V03-KH-0032",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Sita Jat",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00033",
    "parcel_id": "P00033",
    "survey_no": "V01-KH-0033",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Prem Rathore",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00034",
    "parcel_id": "P00034",
    "survey_no": "V02-KH-0034",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Geeta Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00035",
    "parcel_id": "P00035",
    "survey_no": "V03-KH-0035",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Geeta Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00036",
    "parcel_id": "P00036",
    "survey_no": "V01-KH-0036",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Bhanwar Rathore",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00037",
    "parcel_id": "P00037",
    "survey_no": "V02-KH-0037",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Prem Rathore",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00038",
    "parcel_id": "P00038",
    "survey_no": "V03-KH-0038",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Suresh Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00039",
    "parcel_id": "P00039",
    "survey_no": "V01-KH-0039",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Suresh Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00040",
    "parcel_id": "P00040",
    "survey_no": "V02-KH-0040",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kamla Jat",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00041",
    "parcel_id": "P00041",
    "survey_no": "V03-KH-0041",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Sita Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00042",
    "parcel_id": "P00042",
    "survey_no": "V01-KH-0042",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Girdhari Meena",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00043",
    "parcel_id": "P00043",
    "survey_no": "V02-KH-0043",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Sita Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00044",
    "parcel_id": "P00044",
    "survey_no": "V03-KH-0044",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Shanti Gujjar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00045",
    "parcel_id": "P00045",
    "survey_no": "V01-KH-0045",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Bhanwar Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00046",
    "parcel_id": "P00046",
    "survey_no": "V02-KH-0046",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Ramesh Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00047",
    "parcel_id": "P00047",
    "survey_no": "V03-KH-0047",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Champa Meena",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00048",
    "parcel_id": "P00048",
    "survey_no": "V01-KH-0048",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kailash Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00049",
    "parcel_id": "P00049",
    "survey_no": "V02-KH-0049",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Champa Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00050",
    "parcel_id": "P00050",
    "survey_no": "V03-KH-0050",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Champa Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00051",
    "parcel_id": "P00051",
    "survey_no": "V01-KH-0051",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kamla Rathore",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00052",
    "parcel_id": "P00052",
    "survey_no": "V02-KH-0052",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Radha Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00053",
    "parcel_id": "P00053",
    "survey_no": "V03-KH-0053",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Girdhari Meena",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00054",
    "parcel_id": "P00054",
    "survey_no": "V01-KH-0054",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Ramesh Meena",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00055",
    "parcel_id": "P00055",
    "survey_no": "V02-KH-0055",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Radha Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00056",
    "parcel_id": "P00056",
    "survey_no": "V03-KH-0056",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kamla Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00057",
    "parcel_id": "P00057",
    "survey_no": "V01-KH-0057",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Bhanwar Gujjar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00058",
    "parcel_id": "P00058",
    "survey_no": "V02-KH-0058",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Prem Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00059",
    "parcel_id": "P00059",
    "survey_no": "V03-KH-0059",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Shanti Jat",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00060",
    "parcel_id": "P00060",
    "survey_no": "V01-KH-0060",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Prem Rathore",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00061",
    "parcel_id": "P00061",
    "survey_no": "V02-KH-0061",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Om Prakash Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00062",
    "parcel_id": "P00062",
    "survey_no": "V03-KH-0062",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kamla Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00063",
    "parcel_id": "P00063",
    "survey_no": "V01-KH-0063",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kamla Jat",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00064",
    "parcel_id": "P00064",
    "survey_no": "V02-KH-0064",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Champa Jat",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00065",
    "parcel_id": "P00065",
    "survey_no": "V03-KH-0065",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Om Prakash Jat",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00066",
    "parcel_id": "P00066",
    "survey_no": "V01-KH-0066",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kamla Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00067",
    "parcel_id": "P00067",
    "survey_no": "V02-KH-0067",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Champa Jat",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00068",
    "parcel_id": "P00068",
    "survey_no": "V03-KH-0068",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Suresh Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00069",
    "parcel_id": "P00069",
    "survey_no": "V01-KH-0069",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Shanti Jat",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00070",
    "parcel_id": "P00070",
    "survey_no": "V02-KH-0070",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Radha Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00071",
    "parcel_id": "P00071",
    "survey_no": "V03-KH-0071",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Bhanwar Rathore",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00072",
    "parcel_id": "P00072",
    "survey_no": "V01-KH-0072",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Champa Jat",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00073",
    "parcel_id": "P00073",
    "survey_no": "V02-KH-0073",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Geeta Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00074",
    "parcel_id": "P00074",
    "survey_no": "V03-KH-0074",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Suresh Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00075",
    "parcel_id": "P00075",
    "survey_no": "V01-KH-0075",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kailash Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00076",
    "parcel_id": "P00076",
    "survey_no": "V02-KH-0076",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Geeta Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00077",
    "parcel_id": "P00077",
    "survey_no": "V03-KH-0077",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Girdhari Gujjar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00078",
    "parcel_id": "P00078",
    "survey_no": "V01-KH-0078",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Sita Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00079",
    "parcel_id": "P00079",
    "survey_no": "V02-KH-0079",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kamla Rathore",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00080",
    "parcel_id": "P00080",
    "survey_no": "V03-KH-0080",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Prem Rathore",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00081",
    "parcel_id": "P00081",
    "survey_no": "V01-KH-0081",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Om Prakash Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00082",
    "parcel_id": "P00082",
    "survey_no": "V02-KH-0082",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Prem Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00083",
    "parcel_id": "P00083",
    "survey_no": "V03-KH-0083",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Champa Meena",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00084",
    "parcel_id": "P00084",
    "survey_no": "V01-KH-0084",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Radha Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00085",
    "parcel_id": "P00085",
    "survey_no": "V02-KH-0085",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Om Prakash Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00086",
    "parcel_id": "P00086",
    "survey_no": "V03-KH-0086",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Shanti Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00087",
    "parcel_id": "P00087",
    "survey_no": "V01-KH-0087",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kamla Rathore",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00088",
    "parcel_id": "P00088",
    "survey_no": "V02-KH-0088",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Geeta Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00089",
    "parcel_id": "P00089",
    "survey_no": "V03-KH-0089",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Champa Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00090",
    "parcel_id": "P00090",
    "survey_no": "V01-KH-0090",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Suresh Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00091",
    "parcel_id": "P00091",
    "survey_no": "V02-KH-0091",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Shanti Gujjar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00092",
    "parcel_id": "P00092",
    "survey_no": "V03-KH-0092",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Bhanwar Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00093",
    "parcel_id": "P00093",
    "survey_no": "V01-KH-0093",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Shanti Meena",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00094",
    "parcel_id": "P00094",
    "survey_no": "V02-KH-0094",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kamla Rathore",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00095",
    "parcel_id": "P00095",
    "survey_no": "V03-KH-0095",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Shanti Meena",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00096",
    "parcel_id": "P00096",
    "survey_no": "V01-KH-0096",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Champa Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00097",
    "parcel_id": "P00097",
    "survey_no": "V02-KH-0097",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Girdhari Gujjar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00098",
    "parcel_id": "P00098",
    "survey_no": "V03-KH-0098",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Radha Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00099",
    "parcel_id": "P00099",
    "survey_no": "V01-KH-0099",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Champa Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00100",
    "parcel_id": "P00100",
    "survey_no": "V02-KH-0100",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Geeta Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00101",
    "parcel_id": "P00101",
    "survey_no": "V03-KH-0101",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Ramesh Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00102",
    "parcel_id": "P00102",
    "survey_no": "V01-KH-0102",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Shanti Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00103",
    "parcel_id": "P00103",
    "survey_no": "V02-KH-0103",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Geeta Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00104",
    "parcel_id": "P00104",
    "survey_no": "V03-KH-0104",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Shanti Jat",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00105",
    "parcel_id": "P00105",
    "survey_no": "V01-KH-0105",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Om Prakash Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00106",
    "parcel_id": "P00106",
    "survey_no": "V02-KH-0106",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Sita Jat",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00107",
    "parcel_id": "P00107",
    "survey_no": "V03-KH-0107",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kamla Jat",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00108",
    "parcel_id": "P00108",
    "survey_no": "V01-KH-0108",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kailash Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00109",
    "parcel_id": "P00109",
    "survey_no": "V02-KH-0109",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Champa Meena",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00110",
    "parcel_id": "P00110",
    "survey_no": "V03-KH-0110",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kamla Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00111",
    "parcel_id": "P00111",
    "survey_no": "V01-KH-0111",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Radha Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00112",
    "parcel_id": "P00112",
    "survey_no": "V02-KH-0112",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Om Prakash Jat",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00113",
    "parcel_id": "P00113",
    "survey_no": "V03-KH-0113",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Radha Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00114",
    "parcel_id": "P00114",
    "survey_no": "V01-KH-0114",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Champa Meena",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00115",
    "parcel_id": "P00115",
    "survey_no": "V02-KH-0115",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Girdhari Gujjar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00116",
    "parcel_id": "P00116",
    "survey_no": "V03-KH-0116",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Girdhari Gujjar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00117",
    "parcel_id": "P00117",
    "survey_no": "V01-KH-0117",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Radha Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00118",
    "parcel_id": "P00118",
    "survey_no": "V02-KH-0118",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Shanti Meena",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00119",
    "parcel_id": "P00119",
    "survey_no": "V03-KH-0119",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Om Prakash Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00120",
    "parcel_id": "P00120",
    "survey_no": "V01-KH-0120",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kamla Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00121",
    "parcel_id": "P00121",
    "survey_no": "V02-KH-0121",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Champa Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00122",
    "parcel_id": "P00122",
    "survey_no": "V03-KH-0122",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Geeta Meena",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00123",
    "parcel_id": "P00123",
    "survey_no": "V01-KH-0123",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Ramesh Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00124",
    "parcel_id": "P00124",
    "survey_no": "V02-KH-0124",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Prem Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00125",
    "parcel_id": "P00125",
    "survey_no": "V03-KH-0125",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Radha Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00126",
    "parcel_id": "P00126",
    "survey_no": "V01-KH-0126",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Ramesh Meena",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00127",
    "parcel_id": "P00127",
    "survey_no": "V02-KH-0127",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Radha Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00128",
    "parcel_id": "P00128",
    "survey_no": "V03-KH-0128",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Ramesh Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00129",
    "parcel_id": "P00129",
    "survey_no": "V01-KH-0129",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kailash Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00130",
    "parcel_id": "P00130",
    "survey_no": "V02-KH-0130",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Champa Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00131",
    "parcel_id": "P00131",
    "survey_no": "V03-KH-0131",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Suresh Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00132",
    "parcel_id": "P00132",
    "survey_no": "V01-KH-0132",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Ramesh Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00133",
    "parcel_id": "P00133",
    "survey_no": "V02-KH-0133",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Prem Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00134",
    "parcel_id": "P00134",
    "survey_no": "V03-KH-0134",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Geeta Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00135",
    "parcel_id": "P00135",
    "survey_no": "V01-KH-0135",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Sita Rathore",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00136",
    "parcel_id": "P00136",
    "survey_no": "V02-KH-0136",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Bhanwar Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00137",
    "parcel_id": "P00137",
    "survey_no": "V03-KH-0137",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kamla Jat",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00138",
    "parcel_id": "P00138",
    "survey_no": "V01-KH-0138",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Ramesh Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00139",
    "parcel_id": "P00139",
    "survey_no": "V02-KH-0139",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Sita Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00140",
    "parcel_id": "P00140",
    "survey_no": "V03-KH-0140",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Geeta Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00141",
    "parcel_id": "P00141",
    "survey_no": "V01-KH-0141",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Radha Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00142",
    "parcel_id": "P00142",
    "survey_no": "V02-KH-0142",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Shanti Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00143",
    "parcel_id": "P00143",
    "survey_no": "V03-KH-0143",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Bhanwar Gujjar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00144",
    "parcel_id": "P00144",
    "survey_no": "V01-KH-0144",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Bhanwar Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00145",
    "parcel_id": "P00145",
    "survey_no": "V02-KH-0145",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Radha Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00146",
    "parcel_id": "P00146",
    "survey_no": "V03-KH-0146",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Girdhari Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00147",
    "parcel_id": "P00147",
    "survey_no": "V01-KH-0147",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Geeta Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00148",
    "parcel_id": "P00148",
    "survey_no": "V02-KH-0148",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Bhanwar Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00149",
    "parcel_id": "P00149",
    "survey_no": "V03-KH-0149",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Girdhari Gujjar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00150",
    "parcel_id": "P00150",
    "survey_no": "V01-KH-0150",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Shanti Meena",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00151",
    "parcel_id": "P00151",
    "survey_no": "V02-KH-0151",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Om Prakash Jat",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00152",
    "parcel_id": "P00152",
    "survey_no": "V03-KH-0152",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Radha Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00153",
    "parcel_id": "P00153",
    "survey_no": "V01-KH-0153",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Radha Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00154",
    "parcel_id": "P00154",
    "survey_no": "V02-KH-0154",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Geeta Meena",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00155",
    "parcel_id": "P00155",
    "survey_no": "V03-KH-0155",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Geeta Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00156",
    "parcel_id": "P00156",
    "survey_no": "V01-KH-0156",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Girdhari Gujjar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00157",
    "parcel_id": "P00157",
    "survey_no": "V02-KH-0157",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Girdhari Gujjar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00158",
    "parcel_id": "P00158",
    "survey_no": "V03-KH-0158",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kamla Jat",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00159",
    "parcel_id": "P00159",
    "survey_no": "V01-KH-0159",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Bhanwar Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00160",
    "parcel_id": "P00160",
    "survey_no": "V02-KH-0160",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Bhanwar Rathore",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00161",
    "parcel_id": "P00161",
    "survey_no": "V03-KH-0161",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Om Prakash Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00162",
    "parcel_id": "P00162",
    "survey_no": "V01-KH-0162",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Girdhari Meena",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00163",
    "parcel_id": "P00163",
    "survey_no": "V02-KH-0163",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Suresh Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00164",
    "parcel_id": "P00164",
    "survey_no": "V03-KH-0164",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kamla Rathore",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00165",
    "parcel_id": "P00165",
    "survey_no": "V01-KH-0165",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Suresh Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00166",
    "parcel_id": "P00166",
    "survey_no": "V02-KH-0166",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Geeta Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00167",
    "parcel_id": "P00167",
    "survey_no": "V03-KH-0167",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Om Prakash Mali",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00168",
    "parcel_id": "P00168",
    "survey_no": "V01-KH-0168",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Prem Rathore",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00169",
    "parcel_id": "P00169",
    "survey_no": "V02-KH-0169",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Sita Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00170",
    "parcel_id": "P00170",
    "survey_no": "V03-KH-0170",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Shanti Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00171",
    "parcel_id": "P00171",
    "survey_no": "V01-KH-0171",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Radha Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00172",
    "parcel_id": "P00172",
    "survey_no": "V02-KH-0172",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Prem Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00173",
    "parcel_id": "P00173",
    "survey_no": "V03-KH-0173",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Bhanwar Gujjar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00174",
    "parcel_id": "P00174",
    "survey_no": "V01-KH-0174",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Bhanwar Rathore",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00175",
    "parcel_id": "P00175",
    "survey_no": "V02-KH-0175",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Prem Rathore",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00176",
    "parcel_id": "P00176",
    "survey_no": "V03-KH-0176",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Girdhari Gujjar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00177",
    "parcel_id": "P00177",
    "survey_no": "V01-KH-0177",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Ramesh Meena",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00178",
    "parcel_id": "P00178",
    "survey_no": "V02-KH-0178",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Kailash Suthar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00179",
    "parcel_id": "P00179",
    "survey_no": "V03-KH-0179",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "notified",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Ramesh Sharma",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00180",
    "parcel_id": "P00180",
    "survey_no": "V01-KH-0180",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "possessed",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Girdhari Gujjar",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  },
  {
    "id": "AC00181",
    "parcel_id": "P00181",
    "survey_no": "V02-KH-0181",
    "project_name": "NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)",
    "stage": "compensation_pending",
    "days_in_stage": 42,
    "lapsed": false,
    "owner_name": "Suresh Yadav",
    "statutory_act": "RFCTLARR_2013",
    "computed_deadline": "2026-12-31"
  }
];

export const REAL_BLOCKERS: RealBlocker[] = [
  {
    "id": "B-P00014",
    "parcel_id": "P00014",
    "survey_no": "V03-KH-0014",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V03-KH-0014",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00018",
    "parcel_id": "P00018",
    "survey_no": "V01-KH-0018",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V01-KH-0018",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00020",
    "parcel_id": "P00020",
    "survey_no": "V03-KH-0020",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V03-KH-0020",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00021",
    "parcel_id": "P00021",
    "survey_no": "V01-KH-0021",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V01-KH-0021",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00026",
    "parcel_id": "P00026",
    "survey_no": "V03-KH-0026",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V03-KH-0026",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00028",
    "parcel_id": "P00028",
    "survey_no": "V02-KH-0028",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V02-KH-0028",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00036",
    "parcel_id": "P00036",
    "survey_no": "V01-KH-0036",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V01-KH-0036",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00038",
    "parcel_id": "P00038",
    "survey_no": "V03-KH-0038",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V03-KH-0038",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00039",
    "parcel_id": "P00039",
    "survey_no": "V01-KH-0039",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V01-KH-0039",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00040",
    "parcel_id": "P00040",
    "survey_no": "V02-KH-0040",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V02-KH-0040",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00041",
    "parcel_id": "P00041",
    "survey_no": "V03-KH-0041",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V03-KH-0041",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00042",
    "parcel_id": "P00042",
    "survey_no": "V01-KH-0042",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V01-KH-0042",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00052",
    "parcel_id": "P00052",
    "survey_no": "V02-KH-0052",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V02-KH-0052",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00054",
    "parcel_id": "P00054",
    "survey_no": "V01-KH-0054",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V01-KH-0054",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00055",
    "parcel_id": "P00055",
    "survey_no": "V02-KH-0055",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V02-KH-0055",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00058",
    "parcel_id": "P00058",
    "survey_no": "V02-KH-0058",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V02-KH-0058",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00061",
    "parcel_id": "P00061",
    "survey_no": "V02-KH-0061",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V02-KH-0061",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00066",
    "parcel_id": "P00066",
    "survey_no": "V01-KH-0066",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V01-KH-0066",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00067",
    "parcel_id": "P00067",
    "survey_no": "V02-KH-0067",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V02-KH-0067",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00081",
    "parcel_id": "P00081",
    "survey_no": "V01-KH-0081",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V01-KH-0081",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00087",
    "parcel_id": "P00087",
    "survey_no": "V01-KH-0087",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V01-KH-0087",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00093",
    "parcel_id": "P00093",
    "survey_no": "V01-KH-0093",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V01-KH-0093",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00094",
    "parcel_id": "P00094",
    "survey_no": "V02-KH-0094",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V02-KH-0094",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00097",
    "parcel_id": "P00097",
    "survey_no": "V02-KH-0097",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V02-KH-0097",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00100",
    "parcel_id": "P00100",
    "survey_no": "V02-KH-0100",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V02-KH-0100",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00104",
    "parcel_id": "P00104",
    "survey_no": "V03-KH-0104",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V03-KH-0104",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00105",
    "parcel_id": "P00105",
    "survey_no": "V01-KH-0105",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V01-KH-0105",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00116",
    "parcel_id": "P00116",
    "survey_no": "V03-KH-0116",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V03-KH-0116",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00118",
    "parcel_id": "P00118",
    "survey_no": "V02-KH-0118",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V02-KH-0118",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00122",
    "parcel_id": "P00122",
    "survey_no": "V03-KH-0122",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V03-KH-0122",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00124",
    "parcel_id": "P00124",
    "survey_no": "V02-KH-0124",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V02-KH-0124",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00126",
    "parcel_id": "P00126",
    "survey_no": "V01-KH-0126",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V01-KH-0126",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00130",
    "parcel_id": "P00130",
    "survey_no": "V02-KH-0130",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V02-KH-0130",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00140",
    "parcel_id": "P00140",
    "survey_no": "V03-KH-0140",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V03-KH-0140",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00141",
    "parcel_id": "P00141",
    "survey_no": "V01-KH-0141",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V01-KH-0141",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00142",
    "parcel_id": "P00142",
    "survey_no": "V02-KH-0142",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V02-KH-0142",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00144",
    "parcel_id": "P00144",
    "survey_no": "V01-KH-0144",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V01-KH-0144",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00150",
    "parcel_id": "P00150",
    "survey_no": "V01-KH-0150",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V01-KH-0150",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00154",
    "parcel_id": "P00154",
    "survey_no": "V02-KH-0154",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V02-KH-0154",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00157",
    "parcel_id": "P00157",
    "survey_no": "V02-KH-0157",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V02-KH-0157",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00162",
    "parcel_id": "P00162",
    "survey_no": "V01-KH-0162",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V01-KH-0162",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00167",
    "parcel_id": "P00167",
    "survey_no": "V03-KH-0167",
    "blocker_type": "boundary_dispute",
    "status": "ACTIVE",
    "description": "Ownership dispute (boundary_dispute) on Survey V03-KH-0167",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  },
  {
    "id": "B-P00170",
    "parcel_id": "P00170",
    "survey_no": "V03-KH-0170",
    "blocker_type": "duplicate_claim",
    "status": "ACTIVE",
    "description": "Ownership dispute (duplicate_claim) on Survey V03-KH-0170",
    "delay_days": 45,
    "forum": "Competent Authority Land Acquisition (CALA)"
  }
];
