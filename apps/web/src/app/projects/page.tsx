import { apiClient } from '@/lib/api'
import Link from 'next/link'

export default async function ProjectsPage() {
  const projects = await apiClient.getProjects();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p: any) => (
          <Link href={`/projects/${p.id}`} key={p.id}>
            <div className="bg-white p-6 rounded-lg shadow-sm border hover:border-blue-500 cursor-pointer transition">
              <h2 className="font-semibold">{p.name}</h2>
              <p className="text-sm text-gray-500 mt-2">{p.total_length_km} km</p>
            </div>
          </Link>
        ))}
        {projects.length === 0 && <p className="text-gray-500">No projects found.</p>}
      </div>
    </div>
  )
}
