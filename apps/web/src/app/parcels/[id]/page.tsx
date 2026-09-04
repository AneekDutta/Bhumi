import { apiClient } from '@/lib/api';

import Link from 'next/link';

import { notFound } from 'next/navigation';

import type { Metadata } from 'next';
import { DocumentRegister } from '@/components/documents/DocumentRegister';



export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {

  const { id } = await params;

  try {

    const parcel = await apiClient.getParcel(id);

    return {

      title: `Survey No. ${parcel.survey_no} | Parcel Operations`,

      description: `Acquisition case details and statutory audit timeline for Parcel ${parcel.survey_no}.`,

    };

  } catch {

    return {

      title: 'Parcel Details | BHUMI',

    };

  }

}



export default async function ParcelDetailPage({ params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;



  let parcel: any = null;

  let cases: any[] = [];



  try {

    parcel = await apiClient.getParcel(id);

    cases = await apiClient.getParcelCases(id);

  } catch {

    notFound();

  }



  if (!parcel) {

    notFound();

  }



  const acqCase = cases.length > 0 ? cases[0] : null;

  let deadlineInfo = null;

  let auditLogs: any[] = [];



  if (acqCase) {

    try {

      deadlineInfo = await apiClient.getCaseDeadline(acqCase.id);

      auditLogs = await apiClient.getCaseAudit(acqCase.id);

    } catch {

      // Degrade gracefully

    }

  }



  return (

    <div className="space-y-6">

      {/* Breadcrumb Navigation */}

      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500">

        <Link href="/" className="hover:text-indigo-600">Dashboard</Link>

        <span>/</span>

        <Link href="/projects" className="hover:text-indigo-600">Projects</Link>

        <span>/</span>

        <Link href={`/projects/${parcel.project_id}`} className="hover:text-indigo-600 font-mono">

          Project {parcel.project_id.substring(0, 8)}

        </Link>

        <span>/</span>

        <span className="text-slate-800 font-medium">Survey No. {parcel.survey_no}</span>

      </nav>



      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">

        <div>

          <div className="flex flex-wrap items-center gap-3">

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">

              Survey No. {parcel.survey_no}

            </h1>

            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded border border-amber-300 font-medium">

              Synthetic Demo Data

            </span>

          </div>

          <p className="mt-1 text-sm text-slate-600">

            Registered Area: <span className="font-mono font-semibold text-slate-900">{parcel.area_hectares} Ha</span>

            <span className="mx-2 text-slate-300">|</span>

            Classification: <span className="text-slate-700">{parcel.classification || 'Standard'}</span>

            <span className="mx-2 text-slate-300">|</span>

            Status: <span className="font-semibold text-slate-800">{parcel.status}</span>

          </p>

        </div>



        <div className="flex items-center gap-2">

          <Link

            href={`/projects/${parcel.project_id}/spatial`}

            className="px-3.5 py-2 bg-emerald-600 text-white text-xs sm:text-sm font-semibold rounded shadow-sm hover:bg-emerald-700"

          >

            Spatial View

          </Link>

        </div>

      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Acquisition Case Details */}

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-5">

          <div className="border-b border-slate-100 pb-3">

            <h2 className="text-base font-bold text-slate-900">Statutory Acquisition Case</h2>

            <p className="text-xs text-slate-500">Legal proceeding status under applicable land acquisition laws</p>

          </div>



          {acqCase ? (

            <div className="space-y-4">

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Applicable Act</span>

                  <p className="text-sm font-medium text-slate-900 mt-0.5">{acqCase.statutory_act}</p>

                </div>

                <div>

                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Current Stage</span>

                  <div className="mt-1">

                    <span className="inline-flex px-2.5 py-0.5 bg-indigo-50 text-indigo-800 rounded text-xs font-semibold border border-indigo-200">

                      {acqCase.current_stage}

                    </span>

                  </div>

                </div>

              </div>



              {/* Statutory Clock Widget */}

              {deadlineInfo && deadlineInfo.status !== 'NO_RULE_APPLICABLE' && (

                <div className={`p-4 rounded-lg border text-xs space-y-3 ${

                  deadlineInfo.status === 'LAPSED'

                    ? 'bg-red-50 border-red-200 text-red-950'

                    : deadlineInfo.status === 'WARNING'

                    ? 'bg-amber-50 border-amber-200 text-amber-950'

                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'

                }`}>

                  <div className="flex items-center justify-between font-semibold uppercase tracking-wider text-[10px]">

                    <span>Statutory Deadline Clock</span>

                    <span className={`px-2 py-0.5 rounded font-bold ${

                      deadlineInfo.status === 'LAPSED' ? 'bg-red-200 text-red-900' : 'bg-white text-slate-800'

                    }`}>

                      {deadlineInfo.status}

                    </span>

                  </div>



                  <div className="grid grid-cols-2 gap-2 text-xs">

                    <div>

                      <span className="text-slate-500">Statutory Deadline:</span>

                      <p className="font-mono font-semibold">

                        {new Date(deadlineInfo.deadline).toLocaleDateString()}

                      </p>

                    </div>

                    <div>

                      <span className="text-slate-500">Days Remaining:</span>

                      <p className="font-mono font-bold text-sm">

                        {deadlineInfo.days_remaining}d

                      </p>

                    </div>

                  </div>



                  <p className="text-[11px] text-slate-500 border-t border-slate-200/60 pt-2">

                    Rule: {deadlineInfo.rule} ({deadlineInfo.source})

                  </p>

                </div>

              )}

            </div>

          ) : (

            <p className="text-sm text-slate-500 py-4">No active statutory acquisition proceedings recorded for this parcel.</p>

          )}

        </div>



        {/* Immutable Audit Log */}

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">

          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">

            <h2 className="text-base font-bold text-slate-900">Statutory Audit Trail</h2>

            <p className="text-xs text-slate-500">Chronological verification of workflow transitions and officer actions</p>

          </div>



          <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto p-2">

            {auditLogs.map((log: any) => (

              <div key={log.id} className="p-4 text-xs space-y-1">

                <div className="flex items-center justify-between">

                  <span className="font-semibold text-slate-900">{log.action}</span>

                  <span className="text-slate-400 font-mono text-[11px]">

                    {new Date(log.created_at).toLocaleString()}

                  </span>

                </div>

                <p className="text-slate-600">

                  Actor: <span className="font-medium text-slate-800">{log.actor_role || 'SYSTEM'}</span> ({log.actor_id || 'automated'})

                </p>

                {log.state_after?.stage && (

                  <p className="text-slate-600">

                    Stage updated to: <span className="font-mono font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-900">{log.state_after.stage}</span>

                  </p>

                )}

              </div>

            ))}

            {auditLogs.length === 0 && (

              <div className="p-8 text-center text-slate-500 text-xs">

                No statutory audit trail entries recorded.

              </div>

            )}

          </div>

        </div>

      </div>

      <div className="pt-8 border-t border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Document Register</h2>
        <DocumentRegister parcelId={parcel.id} projectId={parcel.project_id} />
      </div>

    </div>

  );

}
