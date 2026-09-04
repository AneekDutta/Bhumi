import { apiClient } from '@/lib/api';

import Link from 'next/link';

import { notFound } from 'next/navigation';

import type { Metadata } from 'next';



export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {

  const { id } = await params;

  try {

    const project = await apiClient.getProject(id);

    return {

      title: `${project.name} | Bottleneck Intelligence`,

      description: `Dependency graph and milestone exposure analysis for ${project.name}.`,

    };

  } catch {

    return {

      title: 'Bottleneck Intelligence | BHUMI',

    };

  }

}



export default async function IntelligencePage({ params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;



  let project: any = null;

  let bottlenecks: any[] = [];



  try {

    project = await apiClient.getProject(id);

    bottlenecks = await apiClient.getProjectBottlenecks(id);

  } catch {

    notFound();

  }



  if (!project) {

    notFound();

  }



  return (

    <div className="space-y-6">

      {/* Breadcrumb Navigation */}

      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500">

        <Link href="/" className="hover:text-indigo-600">Dashboard</Link>

        <span>/</span>

        <Link href="/projects" className="hover:text-indigo-600">Projects</Link>

        <span>/</span>

        <Link href={`/projects/${project.id}`} className="hover:text-indigo-600 font-mono">

          {project.name}

        </Link>

        <span>/</span>

        <span className="text-slate-800 font-medium">Bottlenecks</span>

      </nav>



      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">

        <div>

          <div className="flex flex-wrap items-center gap-3">

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">

              Corridor Bottleneck Intelligence

            </h1>

            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded border border-amber-300 font-medium">

              Synthetic Demo Data

            </span>

          </div>

          <p className="mt-1 text-sm text-slate-600">

            Graph traversal of statutory stages, downstream milestone dependencies, and critical chain blockages.

          </p>

        </div>



        <div className="flex items-center gap-2">

          <Link

            href={`/projects/${project.id}/impact`}

            className="px-3.5 py-2 bg-indigo-600 text-white text-xs sm:text-sm font-semibold rounded shadow-sm hover:bg-indigo-700"

          >

            Schedule Impact View →

          </Link>

        </div>

      </div>



      {/* Bottlenecks List */}

      <div className="space-y-4">

        {bottlenecks.map((b: any, idx: number) => {

          const isCritical = b.status === 'CRITICAL';

          const isHigh = b.status === 'HIGH';

          return (

            <div

              key={idx}

              className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"

            >

              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">

                <div className="flex items-center space-x-3">

                  <span className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${

                    isCritical

                      ? 'bg-red-50 text-red-800 border-red-200'

                      : isHigh

                      ? 'bg-amber-50 text-amber-800 border-amber-200'

                      : 'bg-slate-100 text-slate-700 border-slate-200'

                  }`}>

                    {b.status}

                  </span>

                  <span className="font-mono text-sm font-bold text-slate-900">

                    {b.entity_type} {b.entity_id.substring(0, 8)}

                  </span>

                </div>

                <div className="text-xs font-medium text-slate-600">

                  Downstream Impact: <span className="font-mono font-bold text-slate-900">{b.downstream_impact_count}</span> Entities

                </div>

              </div>



              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>

                  <h3 className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-2">

                    Identified Impediments

                  </h3>

                  <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-800">

                    {b.reasons.map((r: string, i: number) => (

                      <li key={i}>{r}</li>

                    ))}

                  </ul>

                </div>



                <div>

                  <h3 className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-2">

                    Affected Milestones

                  </h3>

                  {b.affected_milestones.length > 0 ? (

                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-800 font-mono">

                      {b.affected_milestones.map((m: string, i: number) => (

                        <li key={i}>Milestone {m.substring(0, 8)}</li>

                      ))}

                    </ul>

                  ) : (

                    <p className="text-sm text-slate-500 italic">No direct contractual milestone breaches recorded.</p>

                  )}

                </div>

              </div>



              {b.blocking_chain && b.blocking_chain.length > 0 && (

                <div className="bg-slate-50/70 px-6 py-3 border-t border-slate-100 text-xs">

                  <span className="font-semibold text-slate-600">Causal Chain: </span>

                  <span className="text-slate-800 font-mono">

                    {b.blocking_chain.join(" → ")}

                  </span>

                </div>

              )}

            </div>

          );

        })}



        {bottlenecks.length === 0 && (

          <div className="p-8 text-center bg-white rounded-lg border border-dashed border-slate-300 text-slate-500 text-sm">

            No critical bottlenecks currently detected along this project corridor.

          </div>

        )}

      </div>

    </div>

  );

}
