import { apiClient } from '@/lib/api'
import Link from 'next/link'

export default async function ParcelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parcel = await apiClient.getParcel(id)
  
  // Fetch cases for this parcel
  const casesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/parcels/${id}/cases`, { cache: 'no-store' });
  const cases = casesResponse.ok ? await casesResponse.json() : [];
  
  // For the demo, just take the first case if any
  const acqCase = cases.length > 0 ? cases[0] : null;
  let deadlineInfo = null;
  let auditLogs = [];

  if (acqCase) {
    deadlineInfo = await apiClient.getCaseDeadline(acqCase.id);
    auditLogs = await apiClient.getCaseAudit(acqCase.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Link href={`/projects/${parcel.project_id}`}>Project {parcel.project_id.substring(0,8)}</Link>
        <span>/</span>
        <span className="text-gray-900">Parcel {parcel.survey_no}</span>
      </div>
      
      <h1 className="text-2xl font-bold tracking-tight">Survey No. {parcel.survey_no}</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Case Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="font-semibold mb-4 text-lg">Acquisition Case</h2>
          {acqCase ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Act</p>
                <p className="font-medium">{acqCase.statutory_act}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Stage</p>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mt-1">
                  {acqCase.current_stage}
                </span>
              </div>
              
              {/* Deadline Info */}
              {deadlineInfo && deadlineInfo.status !== 'NO_RULE_APPLICABLE' && (
                <div className={`mt-4 p-4 rounded-md border ${
                  deadlineInfo.status === 'LAPSED' ? 'bg-red-50 border-red-200' :
                  deadlineInfo.status === 'WARNING' ? 'bg-amber-50 border-amber-200' :
                  'bg-green-50 border-green-200'
                }`}>
                  <h3 className="font-semibold text-sm mb-2 uppercase">Statutory Clock</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Deadline:</span>
                      <p className="font-mono">{new Date(deadlineInfo.deadline).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <p className="font-bold">{deadlineInfo.status}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Remaining:</span>
                      <p>{deadlineInfo.days_remaining} days</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Rule: {deadlineInfo.rule} ({deadlineInfo.source})</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No active acquisition case.</p>
          )}
        </div>

        {/* Audit Log */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50"><h2 className="font-semibold">Audit Trail</h2></div>
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="px-6 py-4 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold">{log.action}</span>
                  <span className="text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <p className="text-gray-600">Actor: {log.actor_role} ({log.actor_id})</p>
                {log.state_after?.stage && (
                  <p className="text-gray-600 mt-1">
                    Stage updated to <span className="font-mono bg-gray-100 px-1">{log.state_after.stage}</span>
                  </p>
                )}
              </div>
            ))}
            {auditLogs.length === 0 && <div className="p-6 text-gray-500">No audit records found.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
