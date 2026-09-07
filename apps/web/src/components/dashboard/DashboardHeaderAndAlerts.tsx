"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  Download,
  ShieldAlert,
  CheckCircle2,
  Navigation,
  Activity,
  FileSpreadsheet,
  Layers
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface DashboardHeaderAndAlertsProps {
  stats: {
    total_parcels: number;
    pending_field_verification: number;
    verified_by_field_officer: number;
    implementation_initiated: number;
    implementation_completed: number;
    compensation_assessed_inr: number;
    compensation_paid_inr: number;
    affected_families_count: number;
    possession_complete_count: number;
  };
}

export function DashboardHeaderAndAlerts({ stats }: DashboardHeaderAndAlertsProps) {
  const { language, t } = useLanguage();
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleExportCSV = () => {
    const headers = [
      "Metric",
      "Value",
      "Unit",
      "Statutory Reference",
      "Benchmark State"
    ];
    const rows = [
      ["Registered Parcels", stats.total_parcels, "Parcels", "RFCTLARR 2013 Sec 11", "Rajasthan (Kota)"],
      ["Pending Ground Inspection", stats.pending_field_verification, "Parcels", "Patwari Field Survey", "Rajasthan (Kota)"],
      ["Verified on Ground", stats.verified_by_field_officer, "Parcels", "Joint Inspection Signed", "Rajasthan (Kota)"],
      ["Implementation Initiated", stats.implementation_initiated, "Cases", "CALA Directive Sec 19", "Rajasthan (Kota)"],
      ["Completed Awards", stats.implementation_completed, "Awards", "Sec 25/38 Disbursed", "Rajasthan (Kota)"],
      ["Compensation Assessed", stats.compensation_assessed_inr, "INR", "First Schedule RFCTLARR", "Rajasthan (Kota)"],
      ["Compensation Disbursed", stats.compensation_paid_inr, "INR", "DBT Treasury Clearance", "Rajasthan (Kota)"],
      ["Affected Families", stats.affected_families_count, "Families", "SIA Rehabilitation Register", "Rajasthan (Kota)"],
      ["Possession Complete", `${stats.possession_complete_count}/${stats.total_parcels}`, "Parcels", "Sec 38 Form G Certificate", "Rajasthan (Kota)"]
    ];

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `BHUMI_National_MIS_Summary_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportNotice("CSV Export downloaded successfully.");
    setTimeout(() => setExportNotice(null), 3500);
  };

  const handleExportJSON = () => {
    const exportData = {
      platform: "BHUMI Decision Support System",
      problem_statement: "SIH26016",
      benchmark_corridor: "P-NH927A (Rajasthan)",
      generated_at: new Date().toISOString(),
      statutory_compliance: "RFCTLARR Act 2013 & NH Act 1956",
      metrics: stats
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `BHUMI_MIS_Snapshot_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportNotice("JSON Snapshot downloaded successfully.");
    setTimeout(() => setExportNotice(null), 3500);
  };

  const [lastUpdated, setLastUpdated] = useState<string>("07 Sep 2026, 14:05 IST");

  useEffect(() => {
    const now = new Date();
    setLastUpdated(`${now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}, ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST`);
  }, []);

  return (
    <div className="space-y-4">
      {/* Top Header Strip */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#DCE2E8] dark:border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-[3px] bg-[#E6F0FA] dark:bg-sky-950/50 text-[#0B2E59] dark:text-sky-300 border border-[#BDD7EE] dark:border-sky-800">
              CALA DIRECTORATE &bull; STRATEGIC CORRIDORS
            </span>
            <span className="text-xs text-[#64748B] dark:text-slate-400 font-mono">
              &bull; Official Ledger: {lastUpdated}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#14213D] dark:text-[#F0F4FF] m-0 leading-tight">
            {t("dash.title")}
          </h1>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
            {t("dash.subtitle")}
          </p>
        </div>

        {/* Quick Action & Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-[4px] text-xs font-bold bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-white/10 text-[#0B2E59] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Export Operational Summary as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#1E7E34] dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="px-3 py-1.5 rounded-[4px] text-xs font-bold bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-white/10 text-[#0B2E59] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Export Operational Snapshot as JSON"
          >
            <Download className="w-3.5 h-3.5 text-[#0B5FA5] dark:text-sky-400" />
            <span>Export JSON</span>
          </button>

          <Link
            href="/projects/gis"
            className="px-3 py-1.5 rounded-[4px] text-xs font-bold bg-[#0B2E59] hover:bg-[#123C6B] text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 text-amber-300" />
            <span>Spatial Corridor Map</span>
          </Link>
        </div>
      </div>

      {/* Export Toast Notification */}
      {exportNotice && (
        <div className="p-2.5 rounded-[3px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-[#1E7E34] dark:text-emerald-300 flex items-center justify-between transition-all">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#1E7E34] dark:text-emerald-400" />
            <span>{exportNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ================================================================
          IN-PRODUCT CRITICAL OPERATIONAL ALERTS BAR (CANONICAL P00001)
          ================================================================ */}
      {!alertDismissed && (
        <div className="p-3.5 rounded-[4px] bg-rose-50 dark:bg-rose-950/30 border-l-4 border-l-[#B32424] border-t border-r border-b border-rose-200 dark:border-rose-900/60 shadow-xs space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-[#B32424] dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] bg-[#B32424] text-white uppercase tracking-wider">
                    CRITICAL OPERATIONAL BOTTLENECK
                  </span>
                  <span className="text-xs font-bold text-[#14213D] dark:text-rose-200 font-mono">
                    PARCEL P00001 · CORRIDOR P-NH927A · ZERO FLOAT
                  </span>
                </div>
                <p className="text-xs text-[#B32424] dark:text-rose-300 mt-1 leading-relaxed">
                  <strong>Section 15 Hearing Clock Exceeded:</strong> 60-day statutory window elapsed without signed objection closure.
                  Digital Twin CPM indicates <strong>0 Days Float</strong>. Without immediate endorsement, Section 19 declaration risks statutory lapse under RFCTLARR Section 19(7).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAlertDismissed(true)}
              className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white px-1.5 py-0.5"
              aria-label="Dismiss alert"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap pt-1 border-t border-rose-200 dark:border-rose-900/40 text-xs">
            <span className="text-[11px] font-semibold text-[#5A6A80] dark:text-slate-400">
              Immediate Officer Action:
            </span>

            <Link
              href="/action-center"
              className="px-2.5 py-1 rounded-[3px] bg-[#B32424] hover:bg-[#8F1D1D] text-white font-bold flex items-center gap-1 transition-colors text-[11px]"
            >
              <span>Resolve in Action Center</span>
              <ArrowRight className="w-3 h-3" />
            </Link>

            <Link
              href="/parcels/P00001"
              className="px-2.5 py-1 rounded-[3px] bg-white dark:bg-rose-900/30 border border-rose-300 dark:border-rose-800 text-[#B32424] dark:text-rose-200 font-bold hover:bg-rose-100 transition-colors text-[11px]"
            >
              <span>Inspect Parcel P00001</span>
            </Link>

            <Link
              href="/projects/gis?id=P-NH927A"
              className="px-2.5 py-1 rounded-[3px] bg-white dark:bg-rose-900/30 border border-rose-300 dark:border-rose-800 text-[#0B5FA5] dark:text-sky-300 font-bold hover:bg-slate-50 transition-colors text-[11px]"
            >
              <span>Spatial Corridor GIS</span>
            </Link>

            <Link
              href="/intelligence/what-if"
              className="px-2.5 py-1 rounded-[3px] bg-white dark:bg-rose-900/30 border border-rose-300 dark:border-rose-800 text-amber-700 dark:text-amber-300 font-bold hover:bg-amber-50 transition-colors text-[11px]"
            >
              <span>Simulate Counterfactual What-If</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
