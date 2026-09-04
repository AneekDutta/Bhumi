import React from 'react';
import Link from 'next/link';

export function PortfolioTable({ projects }: { projects: any[] }) {
  if (!projects || projects.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 border border-dashed border-slate-300 rounded-lg bg-white text-sm">
        No projects registered in the current portfolio scope.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-xs tracking-wider uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 min-w-[200px]">Project Name</th>
              <th scope="col" className="px-4 py-3 text-right">Unresolved Parcels</th>
              <th scope="col" className="px-4 py-3 text-right">Spatial Clusters</th>
              <th scope="col" className="px-4 py-3 text-right">Delay (Days)</th>
              <th scope="col" className="px-4 py-3 text-center">Urgency</th>
              <th scope="col" className="px-4 py-3 text-right min-w-[140px]">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((p) => {
              const hasDelay = p.project_delay_days > 0;
              return (
                <tr key={p.project_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <div className="flex flex-col">
                      <Link
                        href={`/projects/${p.project_id}`}
                        className="hover:underline text-indigo-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
                      >
                        {p.name}
                      </Link>
                      {p.critical_path_blocked && (
                        <span className="mt-1 inline-flex items-center w-max px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          Critical Path Blocked
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {p.unresolved_parcel_count}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {p.spatial_cluster_count}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    <span className={hasDelay ? 'text-red-700' : 'text-emerald-700'}>
                      {hasDelay ? `+${p.project_delay_days}d` : '0d'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide border ${
                      p.highest_urgency === 'CRITICAL'
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : p.highest_urgency === 'HIGH'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {p.highest_urgency || 'NONE'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/projects/${p.project_id}/impact`}
                        className="text-xs font-medium px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                      >
                        Impact
                      </Link>
                      <Link
                        href={`/projects/${p.project_id}/spatial`}
                        className="text-xs font-medium px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                      >
                        Spatial
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
