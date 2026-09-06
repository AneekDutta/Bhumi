"use client";

import React, { useState, useMemo } from "react";
import { PublicShell } from "@/components/layout/PublicShell";
import { REAL_PARCELS, REAL_PROJECTS } from "@/lib/realData";
import { useI18n } from "@/lib/i18n/I18nContext";
import { Search, FileSpreadsheet, MapPin, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function HighwayRegisterPage() {
  const { t } = useI18n();
  const project = REAL_PROJECTS[0];

  const [searchQuery, setSearchQuery] = useState("");
  const [villageFilter, setVillageFilter] = useState("ALL");
  const [stageFilter, setStageFilter] = useState("ALL");

  const villages = useMemo(() => {
    const set = new Set<string>();
    REAL_PARCELS.forEach(p => {
      if (p.village_name) set.add(p.village_name);
    });
    return Array.from(set).sort();
  }, []);

  const filteredParcels = useMemo(() => {
    return REAL_PARCELS.filter(p => {
      if (villageFilter !== "ALL" && p.village_name !== villageFilter) return false;
      if (stageFilter !== "ALL") {
        if (stageFilter === "POSSESSED" && p.current_stage !== "possessed") return false;
        if (stageFilter === "AWARD_PENDING" && p.current_stage !== "compensation_pending") return false;
        if (stageFilter === "NOTIFIED" && p.current_stage !== "notified") return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSurvey = p.survey_no.toLowerCase().includes(q);
        const matchOwner = (p.owner_name || "").toLowerCase().includes(q);
        const matchVillage = p.village_name.toLowerCase().includes(q);
        if (!matchSurvey && !matchOwner && !matchVillage) return false;
      }
      return true;
    });
  }, [villageFilter, stageFilter, searchQuery]);

  const totalAreaHa = useMemo(() => {
    return REAL_PARCELS.reduce((acc, p) => acc + (p.area_hectares || 0), 0);
  }, []);

  const possessedCount = useMemo(() => {
    return REAL_PARCELS.filter(p => p.current_stage === "possessed").length;
  }, []);

  const pendingCount = REAL_PARCELS.length - possessedCount;

  return (
    <PublicShell>
      <div className="max-w-[1440px] mx-auto w-full p-4 sm:p-8 space-y-6">
        
        {/* Breadcrumb and Statutory Section */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-none bg-[#0B2E59] text-white uppercase">
              STATUTORY CADASTRE &bull; FORM 3D/3G
            </span>
            <span className="text-xs text-[#64748B] dark:text-slate-400 font-mono">
              Project Code: {project?.id || "P-NH927A"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#14213D] dark:text-white leading-tight">
            National Highway Cadastral Land Register / राष्ट्रीय राजमार्ग भूमि रजिस्टर
          </h1>
          <p className="text-xs text-[#5A6A80] dark:text-slate-400 mt-1">
            Official statutory record of land parcels under acquisition for <strong>{project?.name || "NH-927A Kota-Jhalawar Bypass"}</strong> ({project?.total_length_km} km Corridor, {project?.district_name}, {project?.state_name}).
          </p>
        </div>

        {/* 4 Summary Stat Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#DCE2E8] dark:border-white/10 divide-x divide-[#DCE2E8] dark:divide-white/10 bg-white dark:bg-[#0B1220]">
          <div className="py-3 px-4">
            <div className="text-2xl font-bold text-[#14213D] dark:text-white tracking-tight">
              {REAL_PARCELS.length}
            </div>
            <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-bold tracking-wider mt-1">
              Cadastral Parcels
            </div>
            <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-0.5">
              Mapped survey units
            </div>
          </div>

          <div className="py-3 px-4">
            <div className="text-2xl font-bold text-[#0B5FA5] dark:text-sky-400 tracking-tight">
              {totalAreaHa.toFixed(2)} Ha
            </div>
            <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-bold tracking-wider mt-1">
              Total Corridor Area
            </div>
            <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-0.5">
              Approx. {(totalAreaHa * 2.47105).toFixed(1)} Acres
            </div>
          </div>

          <div className="py-3 px-4">
            <div className="text-2xl font-bold text-[#1E7E34] dark:text-emerald-400 tracking-tight">
              {possessedCount}
            </div>
            <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-bold tracking-wider mt-1">
              Possessed &amp; Vested
            </div>
            <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-0.5">
              Section 3E completed
            </div>
          </div>

          <div className="py-3 px-4">
            <div className="text-2xl font-bold text-[#B36B00] dark:text-amber-400 tracking-tight">
              {pendingCount}
            </div>
            <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-bold tracking-wider mt-1">
              Under Inquiry / Award
            </div>
            <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-0.5">
              Sections 3A &amp; 3G active
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE2E8] dark:border-white/10 pb-3">
            <div className="font-bold text-xs uppercase tracking-wide text-[#14213D] dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#0B5FA5]" />
              <span>Search and Filter Land Acquisition Records</span>
            </div>
            <div className="text-xs font-mono text-[#0B5FA5] dark:text-sky-400">
              Showing {filteredParcels.length} of {REAL_PARCELS.length} Parcels
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            {/* Search */}
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-bold text-[#14213D] dark:text-slate-300 mb-1">
                Khasra / Survey Number or Owner Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. V02-KH-0001 or Geeta Meena..."
                  className="w-full pl-8 py-1.5 px-2.5 bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white text-xs rounded-none focus:outline-none focus:border-[#0B5FA5]"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Village Filter */}
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-[#14213D] dark:text-slate-300 mb-1">
                Revenue Village
              </label>
              <select
                value={villageFilter}
                onChange={(e) => setVillageFilter(e.target.value)}
                className="w-full py-1.5 px-2 bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white text-xs rounded-none focus:outline-none focus:border-[#0B5FA5]"
              >
                <option value="ALL">All Revenue Villages ({villages.length})</option>
                {villages.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Stage Filter */}
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-[#14213D] dark:text-slate-300 mb-1">
                Acquisition Stage
              </label>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="w-full py-1.5 px-2 bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white text-xs rounded-none focus:outline-none focus:border-[#0B5FA5]"
              >
                <option value="ALL">All Stages</option>
                <option value="NOTIFIED">Sec 3A Notified (82)</option>
                <option value="AWARD_PENDING">Sec 3G Award Pending (28)</option>
                <option value="POSSESSED">Sec 3E Possessed (71)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Parcels Table */}
        <div className="overflow-x-auto border border-[#CBD5E1] dark:border-slate-800 bg-white dark:bg-[#0B1220] rounded-none">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0B2E59] text-white">
              <tr>
                <th className="py-2.5 px-3">Parcel ID</th>
                <th className="py-2.5 px-3">Survey / Khasra No.</th>
                <th className="py-2.5 px-3">Revenue Village</th>
                <th className="py-2.5 px-3 text-right">Area (Ha)</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3">Khatedar / Owner</th>
                <th className="py-2.5 px-3">Statutory Stage</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE2E8] dark:divide-white/10">
              {filteredParcels.slice(0, 100).map((p) => {
                const isPossessed = p.current_stage === "possessed";
                const isAwardPending = p.current_stage === "compensation_pending";
                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-[#0B5FA5] dark:text-sky-400">
                      {p.id}
                    </td>
                    <td className="py-2 px-3 font-mono font-semibold text-[#14213D] dark:text-white">
                      {p.survey_no}
                    </td>
                    <td className="py-2 px-3 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span>{p.village_name}</span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {p.area_hectares ? p.area_hectares.toFixed(4) : "—"}
                    </td>
                    <td className="py-2 px-3 capitalize text-[#64748B] dark:text-slate-400">
                      {p.classification || "Agricultural"}
                    </td>
                    <td className="py-2 px-3 font-medium text-[#14213D] dark:text-white">
                      {p.owner_name || "Record Awaiting Field Sync"}
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-semibold text-[11px]">
                        {isPossessed ? (
                          <span className="text-[#1E7E34] dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Sec 3E Possessed</span>
                          </span>
                        ) : isAwardPending ? (
                          <span className="text-[#B36B00] dark:text-amber-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Sec 3G Award Active</span>
                          </span>
                        ) : (
                          <span className="text-[#0B5FA5] dark:text-sky-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Sec 3A Intention Notified</span>
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-none ${
                        p.status === "POSSESSION" || isPossessed
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                          : p.status === "RESOLVED"
                          ? "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300"
                          : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredParcels.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500 text-xs">
                    No cadastral parcels match the selected village and filter parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredParcels.length > 100 && (
          <div className="text-center text-xs text-[#64748B] dark:text-slate-400 py-2 font-mono">
            Showing first 100 of {filteredParcels.length} matching records. Refine search criteria for specific Khasra numbers.
          </div>
        )}

      </div>
    </PublicShell>
  );
}
