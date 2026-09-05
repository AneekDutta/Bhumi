/**
 * BHUMI PLATFORM — UNIFIED SUPABASE DATA SERVICE
 * Authoritative single source of truth for both Field Operations & Admin Web.
 * Connects directly to Supabase PostgREST, Storage, and Audit logs.
 * Strictly aligned with live Supabase schemas:
 *  - parcels: id (uuid), project_id (uuid), village_id (uuid), survey_no (text), status (text)
 *  - documents: id (uuid), parcel_id (uuid), title (text), description (text), document_type (text), status (text)
 *  - audit_logs: id (uuid), actor_id (text), actor_role (text), action (text), entity_type (text), entity_id (uuid), state_after (jsonb)
 */

import { createClient } from "./client";
import { REAL_PARCELS, RealParcel } from "../realData";
export interface Landowner {
  id: string;
  owner_id: string;
  name: string;
  owner_type: string;
  contact_village: string;
  mobile_number?: string;
  parcels_count?: number;
}

export interface DocumentEvidence {
  storage_path: string;
  public_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface LandownerProfile {
  id?: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  contact_village?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LandownerComplaintPayload {
  owner_id: string; // Supabase Auth user_id
  owner_name: string;
  contact_village?: string;
  mobile_number?: string;
  parcel_id: string;
  survey_number?: string;
  project_id?: string;
  complaint_type: string;
  description: string;
  priority?: "NORMAL" | "URGENT" | "CRITICAL";
  document_evidence: DocumentEvidence; // Compulsory
  gps: {
    lat: number;
    lng: number;
    accuracy?: number;
    captured_at?: string;
  }; // Compulsory
  photos?: Array<{
    id: string;
    url: string;
    caption?: string;
    timestamp?: number;
  }>;
  gps_lat?: number;
  gps_lng?: number;
  gps_accuracy?: number;
}

export const AUTHORITATIVE_LANDOWNERS: Landowner[] = [
  {
    "id": "O00001",
    "owner_id": "O00001",
    "name": "Geeta Yadav",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0000",
    "parcels_count": 1
  },
  {
    "id": "O00002",
    "owner_id": "O00002",
    "name": "Suresh Sharma",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0001",
    "parcels_count": 2
  },
  {
    "id": "O00003",
    "owner_id": "O00003",
    "name": "Ramesh Meena",
    "owner_type": "individual",
    "contact_village": "Village V03",
    "mobile_number": "+91 98290 0002",
    "parcels_count": 3
  },
  {
    "id": "O00004",
    "owner_id": "O00004",
    "name": "Geeta Meena",
    "owner_type": "individual",
    "contact_village": "Village V03",
    "mobile_number": "+91 98290 0003",
    "parcels_count": 3
  },
  {
    "id": "O00005",
    "owner_id": "O00005",
    "name": "Sita Jat",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0004",
    "parcels_count": 3
  },
  {
    "id": "O00006",
    "owner_id": "O00006",
    "name": "Kailash Suthar",
    "owner_type": "joint",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0005",
    "parcels_count": 4
  },
  {
    "id": "O00007",
    "owner_id": "O00007",
    "name": "Ramesh Gujjar",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0006",
    "parcels_count": 0
  },
  {
    "id": "O00008",
    "owner_id": "O00008",
    "name": "Radha Suthar",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0007",
    "parcels_count": 1
  },
  {
    "id": "O00009",
    "owner_id": "O00009",
    "name": "Girdhari Mali",
    "owner_type": "individual",
    "contact_village": "Village V02",
    "mobile_number": "+91 98290 0008",
    "parcels_count": 2
  },
  {
    "id": "O00010",
    "owner_id": "O00010",
    "name": "Om Prakash Sharma",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0009",
    "parcels_count": 2
  },
  {
    "id": "O00011",
    "owner_id": "O00011",
    "name": "Radha Suthar",
    "owner_type": "joint",
    "contact_village": "Village V03",
    "mobile_number": "+91 98290 0010",
    "parcels_count": 3
  },
  {
    "id": "O00012",
    "owner_id": "O00012",
    "name": "Sita Rathore",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0011",
    "parcels_count": 1
  },
  {
    "id": "O00013",
    "owner_id": "O00013",
    "name": "Om Prakash Sharma",
    "owner_type": "individual",
    "contact_village": "Village V02",
    "mobile_number": "+91 98290 0012",
    "parcels_count": 1
  },
  {
    "id": "O00014",
    "owner_id": "O00014",
    "name": "Champa Mali",
    "owner_type": "individual",
    "contact_village": "Village V03",
    "mobile_number": "+91 98290 0013",
    "parcels_count": 4
  },
  {
    "id": "O00015",
    "owner_id": "O00015",
    "name": "Sita Sharma",
    "owner_type": "individual",
    "contact_village": "Village V02",
    "mobile_number": "+91 98290 0014",
    "parcels_count": 3
  },
  {
    "id": "O00016",
    "owner_id": "O00016",
    "name": "Geeta Suthar",
    "owner_type": "institutional",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0015",
    "parcels_count": 3
  },
  {
    "id": "O00017",
    "owner_id": "O00017",
    "name": "Champa Yadav",
    "owner_type": "joint",
    "contact_village": "Village V03",
    "mobile_number": "+91 98290 0016",
    "parcels_count": 2
  },
  {
    "id": "O00018",
    "owner_id": "O00018",
    "name": "Om Prakash Suthar",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0017",
    "parcels_count": 2
  },
  {
    "id": "O00019",
    "owner_id": "O00019",
    "name": "Champa Mali",
    "owner_type": "individual",
    "contact_village": "Village V03",
    "mobile_number": "+91 98290 0018",
    "parcels_count": 3
  },
  {
    "id": "O00020",
    "owner_id": "O00020",
    "name": "Radha Yadav",
    "owner_type": "individual",
    "contact_village": "Village V03",
    "mobile_number": "+91 98290 0019",
    "parcels_count": 7
  },
  {
    "id": "O00021",
    "owner_id": "O00021",
    "name": "Sita Sharma",
    "owner_type": "individual",
    "contact_village": "Village V03",
    "mobile_number": "+91 98290 0020",
    "parcels_count": 3
  },
  {
    "id": "O00022",
    "owner_id": "O00022",
    "name": "Kamla Yadav",
    "owner_type": "individual",
    "contact_village": "Village V02",
    "mobile_number": "+91 98290 0021",
    "parcels_count": 4
  },
  {
    "id": "O00023",
    "owner_id": "O00023",
    "name": "Om Prakash Suthar",
    "owner_type": "institutional",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0022",
    "parcels_count": 1
  },
  {
    "id": "O00024",
    "owner_id": "O00024",
    "name": "Prem Yadav",
    "owner_type": "individual",
    "contact_village": "Village V02",
    "mobile_number": "+91 98290 0023",
    "parcels_count": 5
  },
  {
    "id": "O00025",
    "owner_id": "O00025",
    "name": "Champa Meena",
    "owner_type": "individual",
    "contact_village": "Village V02",
    "mobile_number": "+91 98290 0024",
    "parcels_count": 2
  },
  {
    "id": "O00026",
    "owner_id": "O00026",
    "name": "Ramesh Mali",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0025",
    "parcels_count": 5
  },
  {
    "id": "O00027",
    "owner_id": "O00027",
    "name": "Suresh Yadav",
    "owner_type": "joint",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0026",
    "parcels_count": 4
  },
  {
    "id": "O00028",
    "owner_id": "O00028",
    "name": "Kailash Mali",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0027",
    "parcels_count": 4
  },
  {
    "id": "O00029",
    "owner_id": "O00029",
    "name": "Shanti Jat",
    "owner_type": "joint",
    "contact_village": "Village V03",
    "mobile_number": "+91 98290 0028",
    "parcels_count": 3
  },
  {
    "id": "O00030",
    "owner_id": "O00030",
    "name": "Prem Rathore",
    "owner_type": "individual",
    "contact_village": "Village V02",
    "mobile_number": "+91 98290 0029",
    "parcels_count": 6
  },
  {
    "id": "O00031",
    "owner_id": "O00031",
    "name": "Kamla Yadav",
    "owner_type": "individual",
    "contact_village": "Village V02",
    "mobile_number": "+91 98290 0030",
    "parcels_count": 1
  },
  {
    "id": "O00032",
    "owner_id": "O00032",
    "name": "Bhanwar Suthar",
    "owner_type": "individual",
    "contact_village": "Village V02",
    "mobile_number": "+91 98290 0031",
    "parcels_count": 3
  },
  {
    "id": "O00033",
    "owner_id": "O00033",
    "name": "Om Prakash Jat",
    "owner_type": "individual",
    "contact_village": "Village V02",
    "mobile_number": "+91 98290 0032",
    "parcels_count": 4
  },
  {
    "id": "O00034",
    "owner_id": "O00034",
    "name": "Kamla Rathore",
    "owner_type": "individual",
    "contact_village": "Village V02",
    "mobile_number": "+91 98290 0033",
    "parcels_count": 0
  },
  {
    "id": "O00035",
    "owner_id": "O00035",
    "name": "Ramesh Sharma",
    "owner_type": "individual",
    "contact_village": "Village V03",
    "mobile_number": "+91 98290 0034",
    "parcels_count": 3
  },
  {
    "id": "O00036",
    "owner_id": "O00036",
    "name": "Kamla Jat",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0035",
    "parcels_count": 5
  },
  {
    "id": "O00037",
    "owner_id": "O00037",
    "name": "Om Prakash Jat",
    "owner_type": "individual",
    "contact_village": "Village V03",
    "mobile_number": "+91 98290 0036",
    "parcels_count": 0
  },
  {
    "id": "O00038",
    "owner_id": "O00038",
    "name": "Shanti Suthar",
    "owner_type": "joint",
    "contact_village": "Village V03",
    "mobile_number": "+91 98290 0037",
    "parcels_count": 5
  },
  {
    "id": "O00039",
    "owner_id": "O00039",
    "name": "Champa Meena",
    "owner_type": "individual",
    "contact_village": "Village V03",
    "mobile_number": "+91 98290 0038",
    "parcels_count": 4
  },
  {
    "id": "O00040",
    "owner_id": "O00040",
    "name": "Suresh Suthar",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0039",
    "parcels_count": 4
  },
  {
    "id": "O00041",
    "owner_id": "O00041",
    "name": "Radha Sharma",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0040",
    "parcels_count": 5
  },
  {
    "id": "O00042",
    "owner_id": "O00042",
    "name": "Kamla Rathore",
    "owner_type": "individual",
    "contact_village": "Village V02",
    "mobile_number": "+91 98290 0041",
    "parcels_count": 5
  },
  {
    "id": "O00043",
    "owner_id": "O00043",
    "name": "Sita Suthar",
    "owner_type": "joint",
    "contact_village": "Village V03",
    "mobile_number": "+91 98290 0042",
    "parcels_count": 2
  },
  {
    "id": "O00044",
    "owner_id": "O00044",
    "name": "Girdhari Gujjar",
    "owner_type": "individual",
    "contact_village": "Village V02",
    "mobile_number": "+91 98290 0043",
    "parcels_count": 5
  },
  {
    "id": "O00045",
    "owner_id": "O00045",
    "name": "Suresh Suthar",
    "owner_type": "joint",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0044",
    "parcels_count": 2
  },
  {
    "id": "O00046",
    "owner_id": "O00046",
    "name": "Bhanwar Yadav",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0045",
    "parcels_count": 1
  },
  {
    "id": "O00047",
    "owner_id": "O00047",
    "name": "Girdhari Gujjar",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0046",
    "parcels_count": 4
  },
  {
    "id": "O00048",
    "owner_id": "O00048",
    "name": "Girdhari Meena",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0047",
    "parcels_count": 3
  },
  {
    "id": "O00049",
    "owner_id": "O00049",
    "name": "Shanti Meena",
    "owner_type": "individual",
    "contact_village": "Village V03",
    "mobile_number": "+91 98290 0048",
    "parcels_count": 4
  },
  {
    "id": "O00050",
    "owner_id": "O00050",
    "name": "Radha Suthar",
    "owner_type": "individual",
    "contact_village": "Village V02",
    "mobile_number": "+91 98290 0049",
    "parcels_count": 3
  },
  {
    "id": "O00051",
    "owner_id": "O00051",
    "name": "Geeta Sharma",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0050",
    "parcels_count": 1
  },
  {
    "id": "O00052",
    "owner_id": "O00052",
    "name": "Shanti Sharma",
    "owner_type": "joint",
    "contact_village": "Village V02",
    "mobile_number": "+91 98290 0051",
    "parcels_count": 0
  },
  {
    "id": "O00053",
    "owner_id": "O00053",
    "name": "Bhanwar Gujjar",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0052",
    "parcels_count": 4
  },
  {
    "id": "O00054",
    "owner_id": "O00054",
    "name": "Shanti Gujjar",
    "owner_type": "individual",
    "contact_village": "Village V02",
    "mobile_number": "+91 98290 0053",
    "parcels_count": 4
  },
  {
    "id": "O00055",
    "owner_id": "O00055",
    "name": "Champa Jat",
    "owner_type": "joint",
    "contact_village": "Village V02",
    "mobile_number": "+91 98290 0054",
    "parcels_count": 4
  },
  {
    "id": "O00056",
    "owner_id": "O00056",
    "name": "Bhanwar Yadav",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0055",
    "parcels_count": 3
  },
  {
    "id": "O00057",
    "owner_id": "O00057",
    "name": "Om Prakash Mali",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0056",
    "parcels_count": 3
  },
  {
    "id": "O00058",
    "owner_id": "O00058",
    "name": "Bhanwar Rathore",
    "owner_type": "individual",
    "contact_village": "Village V02",
    "mobile_number": "+91 98290 0057",
    "parcels_count": 4
  },
  {
    "id": "O00059",
    "owner_id": "O00059",
    "name": "Geeta Sharma",
    "owner_type": "individual",
    "contact_village": "Village V03",
    "mobile_number": "+91 98290 0058",
    "parcels_count": 7
  },
  {
    "id": "O00060",
    "owner_id": "O00060",
    "name": "Kailash Yadav",
    "owner_type": "individual",
    "contact_village": "Village V01",
    "mobile_number": "+91 98290 0059",
    "parcels_count": 1
  }
];

const OWNER_PARCEL_MAPPING: Record<string, string[]> = {
  "O00004": [
    "P00001",
    "P00122",
    "P00154"
  ],
  "O00005": [
    "P00002",
    "P00032",
    "P00106"
  ],
  "O00060": [
    "P00003"
  ],
  "O00040": [
    "P00004",
    "P00029",
    "P00068",
    "P00074"
  ],
  "O00054": [
    "P00005",
    "P00031",
    "P00044",
    "P00091"
  ],
  "O00020": [
    "P00006",
    "P00017",
    "P00019",
    "P00052",
    "P00111",
    "P00145",
    "P00171"
  ],
  "O00006": [
    "P00007",
    "P00075",
    "P00108",
    "P00178"
  ],
  "O00057": [
    "P00008",
    "P00119",
    "P00167"
  ],
  "O00014": [
    "P00009",
    "P00049",
    "P00096",
    "P00099"
  ],
  "O00002": [
    "P00010",
    "P00038"
  ],
  "O00056": [
    "P00011",
    "P00045",
    "P00092"
  ],
  "O00018": [
    "P00012",
    "P00081"
  ],
  "O00038": [
    "P00013",
    "P00086",
    "P00102",
    "P00142",
    "P00170"
  ],
  "O00017": [
    "P00014",
    "P00121"
  ],
  "O00043": [
    "P00015",
    "P00018"
  ],
  "O00033": [
    "P00016",
    "P00065",
    "P00112",
    "P00151"
  ],
  "O00025": [
    "P00020",
    "P00025"
  ],
  "O00015": [
    "P00021",
    "P00041",
    "P00078"
  ],
  "O00009": [
    "P00022",
    "P00146"
  ],
  "O00053": [
    "P00023",
    "P00057",
    "P00143",
    "P00173"
  ],
  "O00050": [
    "P00024",
    "P00084",
    "P00113"
  ],
  "O00055": [
    "P00026",
    "P00064",
    "P00067",
    "P00072"
  ],
  "O00035": [
    "P00027",
    "P00123",
    "P00179"
  ],
  "O00028": [
    "P00028",
    "P00030",
    "P00048",
    "P00129"
  ],
  "O00030": [
    "P00033",
    "P00037",
    "P00060",
    "P00080",
    "P00168",
    "P00175"
  ],
  "O00059": [
    "P00034",
    "P00073",
    "P00076",
    "P00088",
    "P00100",
    "P00134",
    "P00140"
  ],
  "O00051": [
    "P00035"
  ],
  "O00058": [
    "P00036",
    "P00071",
    "P00160",
    "P00174"
  ],
  "O00045": [
    "P00039",
    "P00131"
  ],
  "O00036": [
    "P00040",
    "P00063",
    "P00107",
    "P00137",
    "P00158"
  ],
  "O00048": [
    "P00042",
    "P00053",
    "P00162"
  ],
  "O00021": [
    "P00043",
    "P00139",
    "P00169"
  ],
  "O00026": [
    "P00046",
    "P00101",
    "P00128",
    "P00132",
    "P00138"
  ],
  "O00039": [
    "P00047",
    "P00083",
    "P00109",
    "P00114"
  ],
  "O00019": [
    "P00050",
    "P00089",
    "P00130"
  ],
  "O00042": [
    "P00051",
    "P00079",
    "P00087",
    "P00094",
    "P00164"
  ],
  "O00003": [
    "P00054",
    "P00126",
    "P00177"
  ],
  "O00041": [
    "P00055",
    "P00125",
    "P00127",
    "P00141",
    "P00153"
  ],
  "O00022": [
    "P00056",
    "P00062",
    "P00110",
    "P00120"
  ],
  "O00024": [
    "P00058",
    "P00082",
    "P00124",
    "P00133",
    "P00172"
  ],
  "O00029": [
    "P00059",
    "P00069",
    "P00104"
  ],
  "O00010": [
    "P00061",
    "P00105"
  ],
  "O00031": [
    "P00066"
  ],
  "O00011": [
    "P00070",
    "P00117",
    "P00152"
  ],
  "O00047": [
    "P00077",
    "P00115",
    "P00156",
    "P00176"
  ],
  "O00023": [
    "P00085"
  ],
  "O00027": [
    "P00090",
    "P00163",
    "P00165",
    "P00181"
  ],
  "O00049": [
    "P00093",
    "P00095",
    "P00118",
    "P00150"
  ],
  "O00044": [
    "P00097",
    "P00116",
    "P00149",
    "P00157",
    "P00180"
  ],
  "O00008": [
    "P00098"
  ],
  "O00016": [
    "P00103",
    "P00147",
    "P00155"
  ],
  "O00012": [
    "P00135"
  ],
  "O00046": [
    "P00136"
  ],
  "O00032": [
    "P00144",
    "P00148",
    "P00159"
  ],
  "O00013": [
    "P00161"
  ],
  "O00001": [
    "P00166"
  ]
};


export interface FieldVerificationPayload {
  parcel_id: string;
  officer_id: string;
  officer_name?: string;
  verification_type: string;
  status: "verified" | "disputed" | "pending" | "rejected";
  has_issue?: boolean;
  issue_type?: string;
  issue_severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL_STOPPAGE";
  observations?: string;
  remarks?: string;
  gps_lat?: number;
  gps_lng?: number;
  gps_accuracy?: number;
  photos?: Array<{
    id: string;
    url: string;
    caption?: string;
    category?: string;
    timestamp?: number;
  }>;
}

export interface FieldIncidentPayload {
  parcel_id: string;
  officer_id: string;
  officer_name?: string;
  issue_type: string;
  issue_severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL_STOPPAGE";
  observations: string;
  remarks?: string;
  gps_lat: number;
  gps_lng: number;
  gps_accuracy?: number;
  photos?: Array<{
    id: string;
    url: string;
    caption?: string;
    category?: string;
    timestamp?: number;
  }>;
}

export function toUuid(str: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  let hex = "";
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16);
  }
  hex = hex.padEnd(32, "0").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

