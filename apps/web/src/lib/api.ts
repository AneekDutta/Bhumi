const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export type SimulationRequest = {
  type: string;
  parcel_id: string;
};

export const apiClient = {
  getHealth: async () => {
    const res = await fetch(`${API_URL}/health`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    return res.json()
  },
  getProjects: async () => {
    const res = await fetch(`${API_URL}/projects`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch projects')
    return res.json()
  },
  getProject: async (id: string) => {
    const res = await fetch(`${API_URL}/projects/${id}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch project')
    return res.json()
  },
  getProjectParcels: async (id: string) => {
    const res = await fetch(`${API_URL}/projects/${id}/parcels`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  },
  getParcel: async (id: string) => {
    const res = await fetch(`${API_URL}/parcels/${id}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch parcel')
    return res.json()
  },
  getParcelCases: async (id: string) => {
    const res = await fetch(`${API_URL}/parcels/${id}/cases`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  },
  getCaseDeadline: async (id: string) => {
    const res = await fetch(`${API_URL}/acquisition-cases/${id}/deadline`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  },
  getCaseAudit: async (id: string) => {
    const res = await fetch(`${API_URL}/acquisition-cases/${id}/audit`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  },
  getProjectBottlenecks: async (id: string) => {
    const res = await fetch(`${API_URL}/projects/${id}/bottlenecks`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  },
  getProjectImpact: async (id: string) => {
    const res = await fetch(`${API_URL}/impact/${id}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch project impact')
    return res.json()
  },
  simulateIntervention: async (id: string, payload: SimulationRequest) => {
    const res = await fetch(`${API_URL}/impact/${id}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Simulation failed')
    }
    return res.json()
  },
  getSpatialGeojson: async (projectId: string) => {
    const res = await fetch(`${API_URL}/spatial/${projectId}/geojson`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch spatial GeoJSON')
    return res.json()
  },
  getSpatialClusters: async (projectId: string) => {
    const res = await fetch(`${API_URL}/spatial/${projectId}/clusters`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  }
}
