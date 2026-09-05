import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { apiClient } from '@/lib/api';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PortfolioTable } from '@/components/dashboard/PortfolioTable';
import { PortfolioMap } from '@/components/dashboard/PortfolioMap';

export const metadata: Metadata = {
  title: 'National Project Operations',
  description: 'National infrastructure project portfolio overview, critical path delay analysis, and land acquisition bottlenecks.',
};

async function getDashboardSummary() {
  try {
    return await apiClient.getDashboardSummary();
  } catch {
    return null;
  }
}

async function getDashboardProjects() {
  try {
    return await apiClient.getDashboardProjects(100);
  } catch {
    return { items: [] };
  }
}

export default async function NationalDashboardPage() {
  const summary = await getDashboardSummary();
  const projectsData = await getDashboardProjects();

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              National Project Operations
            </h1>
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded border border-amber-300 font-medium">
              Synthetic Demo Data
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Portfolio-wide operational analytics, statutory timeline tracking, and critical path risk monitoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            className="w-full sm:w-auto text-center px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            MIS Reports
          </Link>
          <Link
            href="/projects"
            className="w-full sm:w-auto text-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            All Projects
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      {summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Active Projects"
            value={summary.total_projects}
            subtitle="Tracked in portfolio"
            colorClass="text-indigo-700"
          />
          <MetricCard
            title="Delayed Projects"
            value={summary.delayed_projects}
            subtitle={summary.delayed_projects > 0 ? "Schedule forecast overrun" : "On schedule"}
            colorClass={summary.delayed_projects > 0 ? "text-red-700" : "text-emerald-700"}
          />
          <MetricCard
            title="Unresolved Parcels"
            value={summary.unresolved_parcels}
            subtitle="Pending acquisition/possession"
            colorClass="text-amber-700"
          />
          <MetricCard
            title="Spatial Clusters"
            value={summary.total_spatial_clusters}
            subtitle="Contiguous land bottlenecks"
            colorClass="text-amber-700"
          />
          <MetricCard
            title="CP Blocked Projects"
            value={summary.critical_path_blocked_projects}
            subtitle="Zero-float path impacted"
            colorClass="text-red-700"
          />
        </div>
      ) : (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900 flex items-start gap-3">
          <span className="font-bold text-base leading-none">!</span>
          <div>
            <p className="font-semibold">Backend Analytics Offline</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Unable to reach the portfolio summary service at this time. Verify API availability on the System Status page.
            </p>
          </div>
        </div>
      )}

      {/* Portfolio Map */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
            Portfolio Spatial Overview
          </h2>
          <span className="text-xs text-slate-500">
            {projectsData.items.length} Project Centroid{projectsData.items.length === 1 ? '' : 's'}
          </span>
        </div>
        <PortfolioMap projects={projectsData.items} />
      </div>

      {/* Project Portfolio Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
            Project Corridor Directory
          </h2>
          <span className="text-xs text-slate-500">
            Ranked by Attributable Delay
          </span>
        </div>
        <PortfolioTable projects={projectsData.items} />
      </div>
    </div>
  );
}
