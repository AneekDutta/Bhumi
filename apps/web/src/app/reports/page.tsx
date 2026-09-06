"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Download, Search, FileSpreadsheet, FileJson, RefreshCw, Filter, CheckCircle2, AlertTriangle, Scale, Clock, ShieldCheck, Layers, ChevronRight } from 'lucide-react';

interface ReportDefinition {
  id: string;
  title: string;
  shortLabel: string;
  description: string;
  category: string;
  color: string;
}

const REPORT_DEFINITIONS: ReportDefinition[] = [
  { id: 'project_status', title: 'Corridor Progress & Schedule Variance', shortLabel: 'Project Status', description: 'National portfolio overview of corridor timelines, baseline vs forecast delivery, and statutory schedule overruns.', category: 'Corridor Delivery', color: '#6366f1' },
  { id: 'acquisition_status', title: 'RFCTLARR 2013 Statutory Stage Ledger', shortLabel: 'Acquisition Stages', description: 'Detailed revenue inventory of parcel stage transitions from Section 4 SIA through to Section 30/38 possession vesting.', category: 'Statutory Acquisition', color: '#f59e0b' },
  { id: 'delay_impact', title: 'Schedule Delay & CPM Impact Analysis', shortLabel: 'Delay & CPM Impact', description: 'Deterministic float consumption analysis linking land bottlenecks directly to affected contractor construction activities.', category: 'Critical Path', color: '#f43f5e' },
  { id: 'critical_blockers', title: 'Zero-Float Statutory Blockers & Injunctions', shortLabel: 'Critical Blockers', description: 'Active High Court stays, title ownership disputes, and Section 19(7) limitation clock lapses halting forward works.', category: 'Legal & Risk', color: '#ef4444' },
  { id: 'spatial_blockage', title: 'Contiguous Spatial Parcel Cluster Report', shortLabel: 'Spatial Clusters', description: 'Geospatial clusters of unresolved parcels creating continuous linear obstructions across the corridor chainage.', category: 'Geospatial RoW', color: '#10b981' },
  { id: 'milestone_exposure', title: 'Contractor Milestone Exposure & Financial Risk', shortLabel: 'Milestone Risk', description: 'Downstream EPC contractual penalty exposure and liquidity damages triggered by land acquisition handover slippages.', category: 'EPC Contracts', color: '#8b5cf6' },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState('project_status');
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    apiClient.getDashboardSummary().then(setSummary).catch(() => {});
  }, []);

  const totalKm = summary?.total_length_km || 0;
  const totalProjects = summary?.total_projects || 0;
  const totalParcels = summary?.total_parcels || 0;
  const unresolvedParcels = summary?.unresolved_parcels || 0;
  const possessedParcels = Math.max(0, totalParcels - unresolvedParcels);
  const rowClearance = totalParcels > 0 ? Math.round((possessedParcels / totalParcels) * 100) : 0;
  const delayedProjects = summary?.delayed_projects || 0;

  const dynamicKpiCards = [
    { label: 'National Alignment', val: `${totalKm.toFixed(1)} km`, sub: `Across ${totalProjects} Active Corridor${totalProjects === 1 ? '' : 's'}` },
    { label: 'RoW Clearance', val: `${rowClearance}%`, sub: `${possessedParcels} / ${totalParcels} Parcels Possessed` },
    { label: 'Pending Parcels', val: `${unresolvedParcels}`, sub: `Across ${totalProjects} Corridor${totalProjects === 1 ? '' : 's'}` },
    { label: 'Delayed Corridors', val: `${delayedProjects}`, sub: delayedProjects > 0 ? `${delayedProjects} Corridors with Overrun` : 'All Corridors On Schedule' },
  ];

  const loadReportData = async (type: string) => {
    setLoading(true);
    setNotification(null);
    try {
      const res = await apiClient.getDashboardReports(type);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(data.rows || []);
    } catch {
      setNotification({ type: 'error', message: 'Could not fetch live data. Using fallback dataset.' });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReportData(reportType); }, [reportType]);

  const currentDef = REPORT_DEFINITIONS.find(r => r.id === reportType) || REPORT_DEFINITIONS[0];
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(term)));
  }, [rows, searchTerm]);
  const tableHeaders = useMemo(() => rows.length > 0 ? Object.keys(rows[0]) : [], [rows]);

  const formatHeader = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const renderCell = (key: string, val: any) => {
    if (val === null || val === undefined) return <span className="text-[#64748B] italic">N/A</span>;
    const str = String(val);
    if (key.includes('urgency') || key.includes('severity') || key.includes('status')) {
      if (['CRITICAL', 'LAPSED'].some(s => str.includes(s))) {
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-[3px] bg-[#FFEBEE] dark:bg-rose-950/40 text-[#B32424] dark:text-rose-400 border border-[#FFCDD2] dark:border-rose-800/50 uppercase font-mono">{str}</span>;
      }
      if (['HIGH', 'WARNING', 'UNRESOLVED'].includes(str)) {
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-[3px] bg-[#FFF8E1] dark:bg-amber-950/40 text-[#B36B00] dark:text-amber-400 border border-[#FFE082] dark:border-amber-800/50 uppercase font-mono">{str}</span>;
      }
      if (['ON_TRACK', 'RESOLVED', 'ACTIVE', 'OK'].includes(str)) {
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-[3px] bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-400 border border-[#C8E6C9] dark:border-emerald-800/50 uppercase font-mono">{str}</span>;
      }
    }
    if (key.includes('delay') || key.includes('slippage') || key.includes('impact_days')) {
      const num = Number(val);
      if (!isNaN(num) && num > 0) return <span className="font-mono font-bold text-[#B32424] dark:text-rose-400">+{num} Days</span>;
    }
    if (key.includes('date') || key.includes('finish')) return <span className="font-mono text-[#333333] dark:text-slate-300 text-xs">{str}</span>;
    return <span className="text-[#333333] dark:text-slate-200 text-xs">{str}</span>;
  };

  const exportToCSV = () => {
    if (!rows.length) return;
    setExporting('csv');
    try {
      const headers = Object.keys(rows[0]);
      const csv = [headers.join(','), ...rows.map(row => headers.map(h => {
        const v = row[h] == null ? '' : String(row[h]);
        return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(','))].join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a'); a.href = url; a.download = `bhumi_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      setNotification({ type: 'success', message: `Exported ${rows.length} rows to CSV` });
    } catch { setNotification({ type: 'error', message: 'Export failed.' }); }
    finally { setExporting(null); }
  };

  const exportToJSON = () => {
    if (!rows.length) return;
    setExporting('json');
    try {
      const url = URL.createObjectURL(new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = `bhumi_${reportType}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      setNotification({ type: 'success', message: `Exported ${rows.length} records to JSON` });
    } catch { setNotification({ type: 'error', message: 'Export failed.' }); }
    finally { setExporting(null); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-[#0B2E59] text-white uppercase">
            National Infrastructure Analytics
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-slate-200 dark:bg-white/10 text-[#0B2E59] dark:text-slate-300">
            RFCTLARR & NH Act Standard
          </span>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-4 mt-2">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#14213D] dark:text-[#F0F4FF]">
              National MIS Reports Hub
            </h1>
            <p className="text-xs text-[#555555] dark:text-slate-400 mt-1 max-w-xl">
              Export official analytical reports, statutory gazette registers, and CPM critical path constraints for MoRTH, NHAI, and Competent Authorities.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              disabled={loading || !rows.length || exporting === 'csv'}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] text-xs font-semibold bg-[#1E7E34] hover:bg-[#166527] text-white transition-colors disabled:opacity-50 shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{exporting === 'csv' ? 'Exporting...' : 'Export CSV'}</span>
            </button>
            <button
              onClick={exportToJSON}
              disabled={loading || !rows.length || exporting === 'json'}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] text-xs font-semibold bg-[#0B2E59] hover:bg-[#082242] text-white transition-colors disabled:opacity-50 shadow-xs"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>{exporting === 'json' ? 'Exporting...' : 'Export JSON'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm">
          <div className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider">{dynamicKpiCards[0].label}</div>
          <div className="text-2xl font-bold text-[#0B2E59] dark:text-sky-400 mt-1">{dynamicKpiCards[0].val}</div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">{dynamicKpiCards[0].sub}</div>
        </div>
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm">
          <div className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider">{dynamicKpiCards[1].label}</div>
          <div className="text-2xl font-bold text-[#1E7E34] dark:text-emerald-400 mt-1">{dynamicKpiCards[1].val}</div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">{dynamicKpiCards[1].sub}</div>
        </div>
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm">
          <div className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider">{dynamicKpiCards[2].label}</div>
          <div className="text-2xl font-bold text-[#B32424] dark:text-rose-400 mt-1">{dynamicKpiCards[2].val}</div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">{dynamicKpiCards[2].sub}</div>
        </div>
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-sm">
          <div className="text-[11px] font-bold text-[#555555] dark:text-slate-400 uppercase tracking-wider">{dynamicKpiCards[3].label}</div>
          <div className="text-2xl font-bold text-[#B36B00] dark:text-amber-400 mt-1">{dynamicKpiCards[3].val}</div>
          <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">{dynamicKpiCards[3].sub}</div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-3 rounded-[4px] border flex items-center justify-between gap-3 text-xs ${
          notification.type === 'success'
            ? 'bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-300 border-[#C8E6C9] dark:border-emerald-800/50'
            : 'bg-[#FFEBEE] dark:bg-rose-950/40 text-[#B32424] dark:text-rose-300 border-[#FFCDD2] dark:border-rose-800/50'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#1E7E34] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#B32424] shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold">×</button>
        </div>
      )}

      {/* Report Selector */}
      <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="text-[10px] font-mono text-[#64748B] dark:text-slate-400 uppercase tracking-wider">Report Category</div>
            <div className="text-sm font-bold text-[#14213D] dark:text-white mt-0.5">Select Analytical Register</div>
          </div>
          <span className="text-xs text-[#555555] dark:text-slate-400">
            Active: <strong className="text-[#0B2E59] dark:text-sky-400 font-bold">{currentDef.shortLabel}</strong>
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {REPORT_DEFINITIONS.map((def) => {
            const sel = def.id === reportType;
            return (
              <button
                key={def.id}
                onClick={() => setReportType(def.id)}
                className={`text-left p-3.5 rounded-[4px] border transition-all cursor-pointer ${
                  sel
                    ? 'bg-[#E8F1FA] dark:bg-[#0B2E59]/30 border-[#0B2E59] dark:border-sky-500 shadow-xs'
                    : 'bg-[#F8FAFC] dark:bg-white/[0.02] border-[#DCE2E8] dark:border-white/10 hover:bg-slate-100/70 dark:hover:bg-white/5'
                }`}
              >
                <div className={`text-[10px] font-mono font-bold uppercase tracking-wider mb-1 ${
                  sel ? 'text-[#0B2E59] dark:text-sky-400' : 'text-[#64748B] dark:text-slate-400'
                }`}>
                  {def.category}
                </div>
                <div className={`text-xs font-bold mb-1.5 ${
                  sel ? 'text-[#0B2E59] dark:text-white' : 'text-[#14213D] dark:text-slate-200'
                }`}>
                  {def.title}
                </div>
                <p className="text-[11px] text-[#555555] dark:text-slate-400 leading-relaxed m-0">{def.description}</p>
                <div className="mt-3 pt-2 border-t border-[#DCE2E8] dark:border-white/10 flex items-center justify-between text-[11px] font-semibold">
                  <span className={sel ? 'text-[#0B2E59] dark:text-sky-400' : 'text-[#64748B]'}>View Preview</span>
                  <ChevronRight className={`w-3.5 h-3.5 ${sel ? 'text-[#0B2E59] dark:text-sky-400' : 'text-[#64748B]'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Data Table */}
      <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#DCE2E8] dark:border-white/10 flex items-center justify-between flex-wrap gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
          <div>
            <div className="text-[10px] font-mono text-[#64748B] dark:text-slate-400 uppercase tracking-wider">Live Record Preview</div>
            <div className="text-sm font-bold text-[#14213D] dark:text-white mt-0.5">{currentDef.title}</div>
            <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">Showing {filteredRows.length} of {rows.length} records &bull; Real-time query</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Filter rows..."
                className="pl-8 pr-2.5 py-1.5 text-xs bg-white dark:bg-[#0a0f1d] border border-[#CBD5E1] dark:border-white/15 rounded-[4px] text-[#14213D] dark:text-white outline-none w-48 focus:border-[#0B2E59]"
              />
            </div>
            <button
              onClick={() => loadReportData(reportType)}
              disabled={loading}
              className="p-1.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10 bg-white dark:bg-white/5 text-[#555555] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#64748B] flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#0B2E59] dark:text-sky-400 animate-spin" />
            <span className="text-xs">Compiling statutory report data...</span>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-12 text-center text-[#64748B] text-xs">
            {searchTerm ? 'No matching rows found.' : 'No records returned for this report type.'}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 z-10 bg-[#F1F4F7] dark:bg-[#131B2E]">
                <tr className="border-b border-[#DCE2E8] dark:border-white/10 text-[#555555] dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                  <th className="px-3.5 py-2.5 w-10 text-center">#</th>
                  {tableHeaders.map(h => (
                    <th key={h} className="px-3.5 py-2.5 whitespace-nowrap font-semibold">
                      {formatHeader(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE2E8] dark:divide-white/10">
                {filteredRows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-3.5 py-2.5 text-center font-mono text-[11px] text-[#64748B]">{i + 1}</td>
                    {tableHeaders.map(h => (
                      <td key={h} className="px-3.5 py-2.5 whitespace-nowrap">{renderCell(h, row[h])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-2.5 border-t border-[#DCE2E8] dark:border-white/10 flex justify-between items-center text-[11px] font-mono text-[#64748B] dark:text-slate-400 bg-slate-50/50 dark:bg-white/[0.01]">
          <span>RFCTLARR Act 2013 &bull; RFC 4180 Standard</span>
          <span suppressHydrationWarning>{mounted ? `Generated: ${new Date().toLocaleTimeString()}` : 'Generated: Ready'}</span>
        </div>
      </div>
    </div>
  );
}
