import { apiClient } from '@/lib/api'
import Link from 'next/link'

export default async function IntelligencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await apiClient.getProject(id)
  const bottlenecks = await apiClient.getProjectBottlenecks(id)

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Link href="/projects">Projects</Link>
        <span>/</span>
        <Link href={`/projects/${project.id}`}>{project.name}</Link>
        <span>/</span>
        <span className="text-gray-900">Intelligence</span>
      </div>
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Bottleneck Intelligence</h1>
      </div>
      
      <div className="space-y-4">
        {bottlenecks.map((b: any, idx: number) => (
          <div key={idx} className={`bg-white rounded-lg shadow-sm border overflow-hidden ${
            b.status === 'CRITICAL' ? 'border-red-500 ring-1 ring-red-500' :
            b.status === 'HIGH' ? 'border-orange-500' : 'border-amber-400'
          }`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${
              b.status === 'CRITICAL' ? 'bg-red-50' :
              b.status === 'HIGH' ? 'bg-orange-50' : 'bg-amber-50'
            }`}>
              <div className="font-semibold text-lg flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs text-white ${
                  b.status === 'CRITICAL' ? 'bg-red-600' :
                  b.status === 'HIGH' ? 'bg-orange-600' : 'bg-amber-500'
                }`}>{b.status}</span>
                <span>{b.entity_type} {b.entity_id.substring(0,8)}</span>
              </div>
              <div className="text-sm font-medium text-gray-600">
                Downstream Impact: {b.downstream_impact_count} Entities
              </div>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wide mb-2">Reasons</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {b.reasons.map((r: string, i: number) => (
                    <li key={i} className="text-gray-800">{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wide mb-2">Affected Milestones</h3>
                {b.affected_milestones.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {b.affected_milestones.map((m: string, i: number) => (
                      <li key={i} className="text-gray-800 font-mono text-sm">Milestone {m.substring(0,8)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic text-sm">No direct milestone impact.</p>
                )}
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t text-sm">
              <span className="font-medium text-gray-500">Causal Chain: </span>
              <span className="text-gray-600 font-mono text-xs">
                {b.blocking_chain.join(" → ")}
              </span>
            </div>
          </div>
        ))}
        {bottlenecks.length === 0 && (
          <div className="p-8 text-center bg-white rounded-lg border text-gray-500">
            No critical bottlenecks detected for this project.
          </div>
        )}
      </div>
    </div>
  )
}
