import { apiClient } from '@/lib/api';

import Link from 'next/link';

import { notFound } from 'next/navigation';

import type { Metadata } from 'next';
import { DocumentRegister } from '@/components/documents/DocumentRegister';



export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {

  const { id } = await params;

  try {

    const project = await apiClient.getProject(id);

    return {

      title: `${project.name} | Project Operations`,

      description: `Operational details, parcel acquisition status, and corridor alignment for ${project.name}.`,

    };

  } catch {

    return {

      title: 'Project Overview | BHUMI',

    };

  }

}



export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;



  let project: any = null;

  let parcels: any[] = [];



  try {

    project = await apiClient.getProject(id);

    parcels = await apiClient.getProjectParcels(id);

  } catch {

    notFound();

  }



  if (!project) {

    notFound();

  }



  return (

    <div className="space-y-6">

      {/* Breadcrumbs */}

      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500">

        <Link href="/" className="hover:text-indigo-600">Dashboard</Link>

        <span>/</span>

        <Link href="/projects" className="hover:text-indigo-600">Projects</Link>

        <span>/</span>

        <span className="text-slate-800 font-medium truncate max-w-[200px] sm:max-w-none">{project.name}</span>

      </nav>



      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">

        <div>

          <div className="flex flex-wrap items-center gap-3">

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">

              {project.name}

            </h1>

            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded border border-amber-300 font-medium">

              Synthetic Demo Data

            </span>

          </div>

          <p className="mt-1 text-sm text-slate-600">

            Corridor Length: <span className="font-mono font-medium">{project.total_length_km ? `${project.total_length_km} km` : 'Unspecified'}</span>

            <span className="mx-2 text-slate-300">|</span>

            Project ID: <span className="font-mono text-xs text-slate-500">{project.id}</span>

          </p>

        </div>



        {/* Operational Actions */}

        <div className="flex flex-wrap items-center gap-2">

          <Link

            href={`/projects/${project.id}/spatial`}

            className="px-3.5 py-2 bg-emerald-600 text-white text-xs sm:text-sm font-semibold rounded shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"

          >

            Spatial Map View

          </Link>

          <Link

            href={`/projects/${project.id}/impact`}

            className="px-3.5 py-2 bg-indigo-600 text-white text-xs sm:text-sm font-semibold rounded shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"

          >

            Impact & Simulation

          </Link>

          <Link

            href={`/projects/${project.id}/intelligence`}

            className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold rounded shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors"

          >

            Bottlenecks

          </Link>

        </div>

      </div>



      {/* Parcels Card */}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">

        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">

          <div>

            <h2 className="text-base font-semibold text-slate-900">Mapped Land Parcels</h2>

            <p className="text-xs text-slate-500 mt-0.5">Individual survey numbers registered along the alignment corridor</p>

          </div>

          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-200 text-slate-700">

            {parcels.length} Parcel{parcels.length === 1 ? '' : 's'}

          </span>

        </div>



        <div className="overflow-x-auto">

          <table className="w-full text-sm text-left border-collapse">

            <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider">

              <tr>

                <th scope="col" className="px-6 py-3">Survey Number</th>

                <th scope="col" className="px-6 py-3 text-right">Area (Ha)</th>

                <th scope="col" className="px-6 py-3">Classification</th>

                <th scope="col" className="px-6 py-3 text-center">Status</th>

                <th scope="col" className="px-6 py-3 text-right">Details</th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {parcels.map((p: any) => (

                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">

                  <td className="px-6 py-3.5 font-medium text-slate-900">

                    <Link href={`/parcels/${p.id}`} className="text-indigo-600 hover:underline font-mono">

                      Survey No. {p.survey_no}

                    </Link>

                  </td>

                  <td className="px-6 py-3.5 text-right font-mono text-slate-700">

                    {p.area_hectares}

                  </td>

                  <td className="px-6 py-3.5 text-slate-600 text-xs">

                    {p.classification || 'Standard'}

                  </td>

                  <td className="px-6 py-3.5 text-center">

                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${

                      p.status === 'POSSESSION' || p.status === 'RESOLVED'

                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'

                        : 'bg-amber-50 text-amber-800 border-amber-200'

                    }`}>

                      {p.status}

                    </span>

                  </td>

                  <td className="px-6 py-3.5 text-right">

                    <Link

                      href={`/parcels/${p.id}`}

                      className="text-xs font-medium text-indigo-600 hover:text-indigo-900"

                    >

                      Inspect Parcel →

                    </Link>

                  </td>

                </tr>

              ))}

              {parcels.length === 0 && (

                <tr>

                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">

                    No land parcels currently mapped to this project alignment.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      <div className="pt-8 border-t border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Document Register</h2>
        <DocumentRegister projectId={project.id} />
      </div>

    </div>

  );

}
