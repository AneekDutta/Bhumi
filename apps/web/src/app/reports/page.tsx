"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

const REPORT_DEFINITIONS: Record<string, { title: string; description: string }> = {
  project_status: {
    title: 'Project Status Report',
    description: 'Portfolio-level overview of project timelines, baseline vs forecast completion dates, and attributable delays.'
  },
  acquisition_status: {
    title: 'Acquisition Status',
    description: 'Summary of parcel acquisition progress across all project segments and statutory stages.'
  },
  delay_impact: {
    title: 'Delay & Impact Report',
    description: 'Detailed breakdown of schedule delays categorized by statutory causes and critical path constraints.'
  },
  critical_blockers: {
    title: 'Critical Blockers',
    description: 'Active litigation, disputed titles, and procedural impediments currently holding zero-float activities.'
  },
  spatial_blockage: {
    title: 'Spatial Blockage',
    description: 'Contiguous unresolved parcel clusters directly intersecting planned infrastructure alignment corridors.'
  },
  milestone_exposure: {
    title: 'Milestone Exposure',
    description: 'Forward-looking analysis of contract milestones at risk of breach due to unresolved land acquisition.'
  },
};

export default function ReportsPage() {
  const [reportType, setReportType] = useState('project_status');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const generateReport = async () => {
    setIsGenerating(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await apiClient.getDashboardReports(reportType);
      if (!res.ok) {
        throw new Error(`Report generation failed with status ${res.status}`);
      }

      const data = await res.json();

      if (!data.rows || data.rows.length === 0) {
        throw new Error('No records returned for the selected report configuration.');
      }

      const headers = Object.keys(data.rows[0]);
      const csvRows = [headers.join(',')];

      for (const row of data.rows) {
        const values = headers.map(header => {
          const val = row[header] === null || row[header] === undefined ? '' : String(row[header]);
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        });
        csvRows.push(values.join(','));
      }

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const filename = `bhumi_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMessage(`Successfully generated and exported ${data.rows.length} rows to ${filename}`);
    } catch {
      setError('An operational error occurred while generating the report. Verify service availability.');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentDef = REPORT_DEFINITIONS[reportType] || REPORT_DEFINITIONS.project_status;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-indigo-600">Dashboard</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">MIS Reports</span>
      </nav>

      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              MIS Operational Reports
            </h1>
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded border border-amber-300 font-medium">
              Synthetic Demo Data
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Export structured operational metrics, statutory timelines, and critical path analysis in standard CSV format.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="space-y-6">
          <div>
            <label htmlFor="report-select" className="block text-sm font-semibold text-slate-800 mb-2">
              Select Report Type
            </label>
            <select
              id="report-select"
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                setError('');
                setSuccessMessage('');
              }}
              className="mt-1 block w-full pl-3 pr-10 py-2.5 text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-md bg-white text-slate-900"
            >
              <option value="project_status">Project Status Report</option>
              <option value="acquisition_status">Acquisition Status</option>
              <option value="delay_impact">Delay & Impact Report</option>
              <option value="critical_blockers">Critical Blockers</option>
              <option value="spatial_blockage">Spatial Blockage</option>
              <option value="milestone_exposure">Milestone Exposure</option>
            </select>
          </div>

          {/* Report Scope Description */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Scope: {currentDef.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              {currentDef.description}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-md text-sm text-red-800 flex items-start gap-2.5" role="alert">
              <span className="font-bold text-red-600">!</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-md text-sm text-emerald-800 flex items-start gap-2.5" role="status">
              <span className="font-bold text-emerald-600">✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={generateReport}
              disabled={isGenerating}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating CSV...
                </>
              ) : (
                'Export to CSV'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
