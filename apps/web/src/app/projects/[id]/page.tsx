import { apiClient } from '@/lib/api'
import Link from 'next/link'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await apiClient.getProject(params.id)
  const parcels = await apiClient.getProjectParcels(params.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Link href="/projects">Projects</Link>
        <span>/</span>
        <span className="text-gray-900">{project.name}</span>
      </div>
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
        <Link href={`/projects/${project.id}/intelligence`} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700">View Intelligence</Link>
      </div>

      
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50"><h2 className="font-semibold">Parcels</h2></div>
        <div className="divide-y">
          {parcels.map((p: any) => (
            <Link href={`/parcels/${p.id}`} key={p.id} className="block px-6 py-4 hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Survey No. {p.survey_no}</div>
                  <div className="text-sm text-gray-500">{p.area_hectares} Ha</div>
                </div>
                <div className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {p.status}
                </div>
              </div>
            </Link>
          ))}
          {parcels.length === 0 && <div className="p-6 text-gray-500">No parcels found.</div>}
        </div>
      </div>
    </div>
  )
}
