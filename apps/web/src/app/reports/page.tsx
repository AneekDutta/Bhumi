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
  { id: 'project_status', title: 'Corridor Progress & Schedule Variance', shortLabel: 'Project Status', description: 'National portfolio overview of corridor timelines, baseline vs forecast delivery, and statutory schedule overruns.', category: 'Corridor Delivery', color: '#0a2c5f' },
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
    { label: 'National Alignment', val: `${totalKm.toFixed(1)} km`, sub: `Across ${totalProjects} Active Corridor${totalProjects === 1 ? '' : 's'}`, color: '#0a2c5f', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.22)' },
    { label: 'RoW Clearance', val: `${rowClearance}%`, sub: `${possessedParcels} / ${totalParcels} Parcels Possessed`, color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.22)' },
    { label: 'Pending Parcels', val: `${unresolvedParcels}`, sub: `Across ${totalProjects} Corridor${totalProjects === 1 ? '' : 's'}`, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.22)' },
    { label: 'Delayed Corridors', val: `${delayedProjects}`, sub: delayedProjects > 0 ? `${delayedProjects} Corridors with Overrun` : 'All Corridors On Schedule', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.22)' },
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
    if (val === null || val === undefined) return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>N/A</span>;
    const str = String(val);
    if ((key.includes('urgency') || key.includes('severity') || key.includes('status'))) {
      if (['CRITICAL', 'LAPSED'].some(s => str.includes(s))) {
        return <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: 'rgba(244,63,94,0.15)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>{str}</span>;
      }
      if (['HIGH', 'WARNING', 'UNRESOLVED'].includes(str)) {
        return <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>{str}</span>;
      }
      if (['ON_TRACK', 'RESOLVED', 'ACTIVE', 'OK'].includes(str)) {
        return <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>{str}</span>;
      }
    }
    if (key.includes('delay') || key.includes('slippage') || key.includes('impact_days')) {
      const num = Number(val);
      if (!isNaN(num) && num > 0) return <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#f43f5e' }}>+{num} Days</span>;
    }
    if (key.includes('date') || key.includes('finish')) return <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#475569', fontSize: 11 }}>{str}</span>;
    return <span style={{ color: '#475569', fontSize: 12 }}>{str}</span>;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            National Infrastructure Analytics
          </span>
          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', padding: '2px 8px', borderRadius: 4, background: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
            RFCTLARR & NH Act Standard
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#0a2c5f', margin: 0 }}>
              National MIS Reports Hub
            </h1>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, maxWidth: 600 }}>
              Export official analytical reports, statutory gazette registers, and CPM critical path constraints for MoRTH, NHAI, and Competent Authorities.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={exportToCSV} disabled={loading || !rows.length || exporting === 'csv'} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', cursor: 'pointer', opacity: (loading || !rows.length) ? 0.5 : 1 }}>
              <FileSpreadsheet style={{ width: 14, height: 14 }} /> {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
            </button>
            <button onClick={exportToJSON} disabled={loading || !rows.length || exporting === 'json'} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#0a2c5f', cursor: 'pointer', opacity: (loading || !rows.length) ? 0.5 : 1 }}>
              <FileJson style={{ width: 14, height: 14 }} /> {exporting === 'json' ? 'Exporting...' : 'Export JSON'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
        {dynamicKpiCards.map((k) => (
          <div key={k.label} style={{ borderRadius: 13, padding: '18px 20px', background: k.bg, border: `1px solid ${k.border}` }}>
            <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>{k.label}</div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 30, fontWeight: 800, color: k.color, lineHeight: 1.1, marginTop: 4 }}>{k.val}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Notification */}
      {notification && (
        <div style={{ borderRadius: 10, padding: '12px 16px', background: notification.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)', border: `1px solid ${notification.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {notification.type === 'success' ? <CheckCircle2 style={{ width: 14, height: 14, color: '#10b981', flexShrink: 0 }} /> : <AlertTriangle style={{ width: 14, height: 14, color: '#f43f5e', flexShrink: 0 }} />}
            <span style={{ fontSize: 12, color: notification.type === 'success' ? '#10b981' : '#f43f5e' }}>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Report Selector */}
      <div className="glass" style={{ borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Report Category</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>Select Analytical Register</div>
          </div>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Active: <strong style={{ color: currentDef.color }}>{currentDef.shortLabel}</strong></span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {REPORT_DEFINITIONS.map((def) => {
            const sel = def.id === reportType;
            return (
              <button key={def.id} onClick={() => setReportType(def.id)} style={{
                textAlign: 'left', padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                background: sel ? `${def.color}18` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${sel ? def.color + '50' : 'rgba(255,255,255,0.07)'}`,
                transition: 'all 0.15s'
              }}>
                <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: sel ? def.color : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{def.category}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: sel ? def.color : '#1e293b', marginBottom: 4 }}>{def.title}</div>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>{def.description}</p>
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: sel ? def.color : '#94a3b8', fontWeight: 600 }}>View Preview</span>
                  <ChevronRight style={{ width: 12, height: 12, color: sel ? def.color : '#94a3b8' }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Data Table */}
      <div className="glass" style={{ borderRadius: 14, overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Live Record Preview</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>{currentDef.title}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Showing {filteredRows.length} of {rows.length} records · Real-time query</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ width: 13, height: 13, position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Filter rows..." style={{
                paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7, fontSize: 12,
                background: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, color: '#1e293b', outline: 'none', width: 200
              }} />
            </div>
            <button onClick={() => loadReportData(reportType)} disabled={loading} style={{ padding: '7px 10px', borderRadius: 8, background: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', cursor: 'pointer' }}>
              <RefreshCw style={{ width: 13, height: 13, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <RefreshCw style={{ width: 24, height: 24, color: '#0a2c5f', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 12 }}>Compiling statutory report data...</span>
          </div>
        ) : filteredRows.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
            {searchTerm ? 'No matching rows found.' : 'No records returned for this report type.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(7,8,15,0.95)' }}>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={{ padding: '10px 14px', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', width: 40, textAlign: 'center' }}>#</th>
                  {tableHeaders.map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', whiteSpace: 'nowrap' }}>
                      {formatHeader(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, i) => (
                  <tr key={i} className="tr-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#94a3b8' }}>{i + 1}</td>
                    {tableHeaders.map(h => (
                      <td key={h} style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{renderCell(h, row[h])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ padding: '10px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8' }}>
          <span>RFCTLARR Act 2013 · RFC 4180 Standard</span>
          <span suppressHydrationWarning>{mounted ? `Generated: ${new Date().toLocaleTimeString()}` : 'Generated: Ready'}</span>
        </div>
      </div>
    </div>
  );
}
