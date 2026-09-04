import { apiClient } from '@/lib/api';

import Link from 'next/link';

import type { Metadata } from 'next';



export const metadata: Metadata = {

  title: 'Project Portfolio',

  description: 'National infrastructure project directory, linear corridor alignments, and land acquisition status.',

};



export default async function ProjectsPage() {

  let projects: any[] = [];

  let errorMsg: string | null = null;



  try {

    projects = await apiClient.getProjects();

  } catch {

    errorMsg = 'Failed to retrieve project portfolio from operational service';

  }



  return (

    <div className="space-y-6">

      {/* Breadcrumb */}

      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500">

        <Link href="/" className="hover:text-indigo-600">Dashboard</Link>

        <span>/</span>

        <span className="text-slate-800 font-medium">Projects</span>

      </nav>



      {/* Heading */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">

        <div>

          <div className="flex flex-wrap items-center gap-3">

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">

              Project Portfolio Directory

            </h1>

            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded border border-amber-300 font-medium">

              Synthetic Demo Data

            </span>

          </div>

          <p className="mt-1 text-sm text-slate-600">

            Active national corridor infrastructure projects, total lengths, and operational tracking.

          </p>

        </div>

      </div>



      {errorMsg && (

        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-start gap-2.5">

          <span className="font-bold text-red-600">!</span>

          <div>

            <p className="font-semibold">Unable to Load Projects</p>

            <p className="text-xs text-red-700 mt-0.5">{errorMsg}</p>

          </div>

        </div>

      )}



      {/* Project Grid */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {projects.map((p: any) => (

          <div

            key={p.id}

            className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-400 transition-colors flex flex-col justify-between"

          >

            <div>

              <div className="flex justify-between items-start mb-2">

                <span className="text-[11px] font-mono font-medium text-slate-500 uppercase tracking-wider">

                  Project ID: {p.id.substring(0, 8)}

                </span>

                {p.total_length_km && (

                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">

                    {p.total_length_km} km

                  </span>

                )}

              </div>

              <h2 className="text-lg font-bold text-slate-900 mb-1">

                <Link href={`/projects/${p.id}`} className="hover:text-indigo-600 hover:underline">

                  {p.name}

                </Link>

              </h2>

            </div>



            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">

              <Link

                href={`/projects/${p.id}`}

                className="text-indigo-600 hover:text-indigo-800 font-medium"

              >

                Overview →

              </Link>

              <div className="flex gap-2">

                <Link

                  href={`/projects/${p.id}/impact`}

                  className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-200 hover:bg-indigo-100"

                >

                  Impact

                </Link>

                <Link

                  href={`/projects/${p.id}/spatial`}

                  className="px-2 py-1 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 hover:bg-emerald-100"

                >

                  Spatial

                </Link>

              </div>

            </div>

          </div>

        ))}

      </div>



      {projects.length === 0 && !errorMsg && (

        <div className="p-8 text-center text-slate-500 border border-dashed border-slate-300 rounded-lg bg-white text-sm">

          No active infrastructure projects found in this portfolio scope.

        </div>

      )}

    </div>

  );

}
