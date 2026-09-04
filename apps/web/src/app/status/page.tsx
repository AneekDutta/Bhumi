import { apiClient } from '@/lib/api';

import Link from 'next/link';

import type { Metadata } from 'next';



export const metadata: Metadata = {

  title: 'System Status',

  description: 'Operational health status of BHUMI decision-intelligence services and database connectivity.',

};



export default async function StatusPage() {

  let backendHealth: any = null;

  let errorMsg: string | null = null;



  try {

    backendHealth = await apiClient.getHealth();

  } catch (error: any) {

    errorMsg = 'Unable to establish connection with core engine API';

  }



  const isHealthy = backendHealth && backendHealth.status === 'ok';



  return (

    <div className="space-y-6 max-w-4xl mx-auto py-2">

      {/* Breadcrumb Navigation */}

      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500">

        <Link href="/" className="hover:text-indigo-600">Dashboard</Link>

        <span>/</span>

        <span className="text-slate-800 font-medium">System Status</span>

      </nav>



      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">

        <div>

          <div className="flex flex-wrap items-center gap-3">

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">

              System Operational Status

            </h1>

            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded border border-amber-300 font-medium">

              Synthetic Demo Data

            </span>

          </div>

          <p className="mt-1 text-sm text-slate-600">

            Real-time verification of core decision-intelligence engines, PostgreSQL/PostGIS database, and API routing.

          </p>

        </div>

      </div>



      {/* Status Card */}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">

        <div className="p-6 sm:p-8 space-y-6">

          <div className="flex items-center justify-between pb-6 border-b border-slate-100">

            <div>

              <h2 className="text-lg font-bold text-slate-900">Core API & Engine Gateway</h2>

              <p className="text-xs text-slate-500 mt-0.5">FastAPI backend cluster endpoint connectivity</p>

            </div>

            <div>

              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${

                isHealthy

                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'

                  : 'bg-red-50 text-red-800 border-red-200'

              }`}>

                <span className={`w-2 h-2 rounded-full mr-2 ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`} />

                {isHealthy ? 'Operational' : 'Degraded / Offline'}

              </span>

            </div>

          </div>



          {backendHealth ? (

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">

              <div className="p-4 bg-slate-50 border border-slate-200 rounded">

                <span className="text-slate-500 uppercase text-[10px] font-bold block mb-1 font-sans">Service Status</span>

                <span className="text-sm font-bold text-emerald-700">{backendHealth.status}</span>

              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded">

                <span className="text-slate-500 uppercase text-[10px] font-bold block mb-1 font-sans">Application Name</span>

                <span className="text-sm font-semibold text-slate-900">{backendHealth.app || 'BHUMI Core'}</span>

              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded">

                <span className="text-slate-500 uppercase text-[10px] font-bold block mb-1 font-sans">Database Status</span>

                <span className="text-sm font-semibold text-slate-900">{backendHealth.services?.database || 'Connected'}</span>

              </div>

            </div>

          ) : (

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 space-y-1">

              <p className="font-semibold">Backend Unreachable</p>

              <p className="text-xs text-red-700 font-mono">{errorMsg}</p>

            </div>

          )}



          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">

            <span>Deterministic CPM Schedule Engine: <strong className="text-slate-700">Active (Phase 3 Frozen)</strong></span>

            <span>PostGIS Spatial Connectivity Engine: <strong className="text-slate-700">Active (Phase 4 Frozen)</strong></span>

          </div>

        </div>

      </div>

    </div>

  );

}
