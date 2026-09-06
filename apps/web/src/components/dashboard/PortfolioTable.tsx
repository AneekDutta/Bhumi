"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, AlertTriangle, CheckCircle2, ChevronRight, Activity, MapPin } from 'lucide-react';

export function PortfolioTable({ projects }: { projects: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'CRITICAL' | 'DELAYED' | 'ON_SCHEDULE'>('ALL');

  if (!projects || projects.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 border border-dashed border-[#DCE2E8] dark:border-white/10 rounded-[4px] bg-white dark:bg-[#0D121F] text-xs">
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
    <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] shadow-xs overflow-hidden transition-colors">
      {/* Table Filter & Search Controls */}
      <div className="p-3 border-b border-[#DCE2E8] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#07080F] flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search corridor or project ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-white dark:bg-[#0D121F] text-slate-900 dark:text-slate-100 border border-[#DCE2E8] dark:border-white/15 rounded-[3px] focus:outline-none focus:border-[#0B2E59] shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'CRITICAL', 'DELAYED', 'ON_SCHEDULE'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-2.5 py-1 rounded-[3px] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterMode === mode
                  ? 'bg-[#0B2E59] text-white shadow-xs font-bold'
                  : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-[#DCE2E8] dark:border-white/10 hover:bg-[#F4F6F8] dark:hover:bg-white/10'
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
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-[#F8FAFC] dark:bg-[#07080F] border-b border-[#DCE2E8] dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold text-[10px] tracking-wider uppercase font-mono">
            <tr>
              <th scope="col" className="px-4 py-3 min-w-[240px]">Corridor Alignment</th>
              <th scope="col" className="px-3 py-3 text-right">Pending Parcels</th>
              <th scope="col" className="px-3 py-3 text-right">Contiguous Clusters</th>
              <th scope="col" className="px-3 py-3 text-right">Critical Overrun</th>
              <th scope="col" className="px-3 py-3 text-center">Urgency</th>
              <th scope="col" className="px-4 py-3 text-right min-w-[180px]">Operational Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE2E8] dark:divide-white/5">
            {filteredProjects.map((p) => {
              const pId = p.project_id || p.id;
              const hasDelay = (p.project_delay_days || 0) > 0;
              const isCP = Boolean(p.critical_path_blocked);

              return (
                <tr key={pId} className="hover:bg-[#F8FAFC] dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    <div className="flex flex-col">
                      <Link
                        href={`/projects/${pId}`}
                        className="hover:text-[#0B2E59] dark:hover:text-sky-400 font-bold text-slate-900 dark:text-slate-100 focus:outline-none transition-colors flex items-center gap-1.5"
                      >
                        <span>{p.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0B2E59] dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          ID: {pId.substring(0, 8)}
                        </span>
                        {p.total_length_km && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[2px] bg-[#E6F0FA] dark:bg-sky-950/40 text-[#0B2E59] dark:text-sky-300 border border-[#B8D5ED] dark:border-sky-800/40">
                            {p.total_length_km} km
                          </span>
                        )}
                        {isCP && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-bold bg-[#FFEBEE] dark:bg-rose-950/40 text-[#B32424] dark:text-rose-300 border border-[#FFCDD2] dark:border-rose-800/40">
                            <AlertTriangle className="w-3 h-3" /> CP Blocked
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {p.unresolved_parcel_count ?? 0}
                  </td>

                  <td className="px-3 py-3 text-right font-mono font-semibold text-[#B36B00] dark:text-amber-400">
                    {p.spatial_cluster_count ?? 0}
                  </td>

                  <td className="px-3 py-3 text-right font-mono font-bold">
                    <span className={hasDelay ? 'text-[#B32424] dark:text-rose-400' : 'text-[#1E7E34] dark:text-emerald-400'}>
                      {hasDelay ? `+${p.project_delay_days}d` : '0d (On Time)'}
                    </span>
                  </td>

                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold uppercase tracking-wide border ${
                      p.highest_urgency === 'CRITICAL'
                        ? 'bg-[#FFEBEE] dark:bg-rose-950/40 text-[#B32424] dark:text-rose-300 border-[#FFCDD2] dark:border-rose-800/40'
                        : p.highest_urgency === 'HIGH'
                        ? 'bg-[#FFF8E1] dark:bg-amber-950/40 text-[#B36B00] dark:text-amber-300 border-[#FFE082] dark:border-amber-800/40'
                        : 'bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-300 border-[#C8E6C9] dark:border-emerald-800/40'
                    }`}>
                      {p.highest_urgency || 'NORMAL'}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/projects/${pId}/impact`}
                        className="text-xs font-semibold px-2.5 py-1 rounded-[3px] bg-white dark:bg-white/5 hover:bg-[#F4F6F8] dark:hover:bg-white/10 text-[#0B2E59] dark:text-slate-200 border border-[#DCE2E8] dark:border-white/10 transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <Activity className="w-3 h-3" />
                        <span>Impact</span>
                      </Link>
                      <Link
                        href={`/projects/${pId}/spatial`}
                        className="text-xs font-semibold px-2.5 py-1 rounded-[3px] bg-white dark:bg-white/5 hover:bg-[#F4F6F8] dark:hover:bg-white/10 text-[#1E7E34] dark:text-emerald-300 border border-[#DCE2E8] dark:border-white/10 transition-colors flex items-center gap-1 shadow-xs"
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

