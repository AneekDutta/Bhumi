"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, AlertTriangle, CheckCircle2, ChevronRight, Activity, MapPin } from 'lucide-react';

export function PortfolioTable({ projects }: { projects: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'CRITICAL' | 'DELAYED' | 'ON_SCHEDULE'>('ALL');

  if (!projects || projects.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/40 text-sm">
        No records available.
      </div>
    );
  }

  const filteredProjects = projects.filter((p) => {
    const name = (p.name || '').toLowerCase();
    const id = (p.project_id || p.id || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    const matchesSearch = name.includes(query) || id.includes(query);

    if (!matchesSearch) return false;

    if (filterMode === 'CRITICAL') return p.critical_path_blocked || p.highest_urgency === 'CRITICAL';
    if (filterMode === 'DELAYED') return (p.project_delay_days || 0) > 0;
    if (filterMode === 'ON_SCHEDULE') return (p.project_delay_days || 0) === 0;

    return true;
  });

  return (
    <div className="bg-white dark:bg-[#0c101d] border border-slate-200/90 dark:border-white/10 rounded-xl shadow-gov overflow-hidden transition-colors">
      {/* Table Filter & Search Controls */}
      <div className="p-4 border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search corridor or project ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'CRITICAL', 'DELAYED', 'ON_SCHEDULE'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterMode === mode
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {mode === 'ALL' && 'All Corridors'}
              {mode === 'CRITICAL' && 'Critical Blockers'}
              {mode === 'DELAYED' && 'Schedule Overrun'}
              {mode === 'ON_SCHEDULE' && 'On Track'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 font-bold text-[11px] tracking-wider uppercase">
            <tr>
              <th scope="col" className="px-5 py-3.5 min-w-[240px]">Corridor Alignment</th>
              <th scope="col" className="px-4 py-3.5 text-right">Pending Parcels</th>
              <th scope="col" className="px-4 py-3.5 text-right">Contiguous Clusters</th>
              <th scope="col" className="px-4 py-3.5 text-right">Critical Overrun</th>
              <th scope="col" className="px-4 py-3.5 text-center">Urgency</th>
              <th scope="col" className="px-5 py-3.5 text-right min-w-[180px]">Operational Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {filteredProjects.map((p) => {
              const pId = p.project_id || p.id;
              const hasDelay = (p.project_delay_days || 0) > 0;
              const isCP = Boolean(p.critical_path_blocked);

              return (
                <tr key={pId} className="hover:bg-slate-50/90 dark:hover:bg-white/[0.03] transition-colors group">
                  <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                    <div className="flex flex-col">
                      <Link
                        href={`/projects/${pId}`}
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-slate-900 dark:text-slate-100 focus:outline-none transition-colors flex items-center gap-1.5"
                      >
                        <span>{p.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                          ID: {pId.substring(0, 8)}
                        </span>
                        {p.total_length_km && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {p.total_length_km} km
                          </span>
                        )}
                        {isCP && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                            <AlertTriangle className="w-3 h-3" /> CP Blocked
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {p.unresolved_parcel_count ?? 0}
                  </td>

                  <td className="px-4 py-4 text-right font-mono font-semibold text-amber-700 dark:text-amber-400">
                    {p.spatial_cluster_count ?? 0}
                  </td>

                  <td className="px-4 py-4 text-right font-mono font-bold">
                    <span className={hasDelay ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}>
                      {hasDelay ? `+${p.project_delay_days}d` : '0d (On Time)'}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${
                      p.highest_urgency === 'CRITICAL'
                        ? 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                        : p.highest_urgency === 'HIGH'
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {p.highest_urgency || 'NORMAL'}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/projects/${pId}/impact`}
                        className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-600/20 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 focus:outline-none transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <Activity className="w-3 h-3" />
                        <span>Impact</span>
                      </Link>
                      <Link
                        href={`/projects/${pId}/spatial`}
                        className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 focus:outline-none transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>GIS</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredProjects.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            No projects match the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}

