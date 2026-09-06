"use client";

import React, { useState, useMemo } from "react";
import { PublicShell } from "@/components/layout/PublicShell";
import { useI18n } from "@/lib/i18n/I18nContext";
import { FileText, Search, Download, ExternalLink, Calendar, MapPin, CheckCircle2, ChevronRight, X } from "lucide-react";

interface GazetteNotice {
  soNumber: string;
  corridor: string;
  section: "Section 3A" | "Section 3D" | "Section 3G";
  sectionTitle: string;
  state: string;
  district: string;
  date: string;
  villagesCount: number;
  status: string;
  parcelsCount: number;
  publishedDateIso: string;
  statutorySummary: string;
}

const OFFICIAL_GAZETTES: GazetteNotice[] = [
  {
    soNumber: "S.O. 1642(E)",
    corridor: "NH-927A Kota–Jhalawar Bypass Widening",
    section: "Section 3D",
    sectionTitle: "Declaration of Land Acquisition",
    state: "Rajasthan",
    district: "Kota & Jhalawar",
    date: "14 Feb 2026",
    villagesCount: 3,
    status: "Published & Vested (Sec 3D)",
    parcelsCount: 99,
    publishedDateIso: "2026-02-14",
    statutorySummary: "Declaration under Section 3D of National Highways Act 1956. Land shall vest absolutely in Central Government free from all encumbrances across Suket, Bardoli Khera, and Chechat revenue divisions.",
  },
  {
    soNumber: "S.O. 1295(E)",
    corridor: "NH-927A Kota–Jhalawar Bypass Widening",
    section: "Section 3A",
    sectionTitle: "Notification of Intention to Acquire",
    state: "Rajasthan",
    district: "Kota & Jhalawar",
    date: "05 Nov 2025",
    villagesCount: 3,
    status: "Statutory Objections Concluded",
    parcelsCount: 181,
    publishedDateIso: "2025-11-05",
    statutorySummary: "Preliminary notification under Section 3A declaring intention to acquire land for 4-laning and bypass widening of NH-927A between km 24.000 to km 72.500.",
  },
  {
    soNumber: "S.O. 2018(E)",
    corridor: "NH-927A Kota–Jhalawar Bypass Widening",
    section: "Section 3G",
    sectionTitle: "Determination of Compensation Award",
    state: "Rajasthan",
    district: "Kota & Jhalawar",
    date: "02 Mar 2026",
    villagesCount: 3,
    status: "PFMS Direct Benefit Transfer Active",
    parcelsCount: 28,
    publishedDateIso: "2026-03-02",
    statutorySummary: "Competent Authority award determination pursuant to First Schedule of RFCTLARR Act 2013 with 100% Solatium and 12% statutory interest.",
  },
  {
    soNumber: "S.O. 1428(E)",
    corridor: "Delhi–Mumbai Expressway (NH-148N)",
    section: "Section 3D",
    sectionTitle: "Declaration of Land Acquisition",
    state: "Rajasthan",
    district: "Dausa & Bandikui",
    date: "24 Feb 2025",
    villagesCount: 14,
    status: "Published & Legally Binding",
    parcelsCount: 384,
    publishedDateIso: "2025-02-24",
    statutorySummary: "Acquisition declaration for greenfield 8-lane expressway package connecting Dausa interchange to Lalsot junction.",
  },
  {
    soNumber: "S.O. 982(E)",
    corridor: "Delhi–Mumbai Expressway (NH-148N)",
    section: "Section 3A",
    sectionTitle: "Notification of Intention to Acquire",
    state: "Madhya Pradesh",
    district: "Ratlam & Jaora",
    date: "12 Jan 2025",
    villagesCount: 8,
    status: "Objection Period Open (Sec 3C)",
    parcelsCount: 215,
    publishedDateIso: "2025-01-12",
    statutorySummary: "Notice of intention under Section 3A. Objections may be filed within 21 days before the Competent Authority (SDM Ratlam).",
  },
  {
    soNumber: "S.O. 1845(E)",
    corridor: "Varanasi–Kolkata Economic Corridor (NH-319B)",
    section: "Section 3D",
    sectionTitle: "Declaration of Land Acquisition",
    state: "Bihar",
    district: "Kaimur & Mohania",
    date: "18 Feb 2025",
    villagesCount: 19,
    status: "Published & Legally Binding",
    parcelsCount: 492,
    publishedDateIso: "2025-02-18",
    statutorySummary: "Right of Way declaration across Kaimur plateau sector for 6-lane access-controlled economic corridor.",
  },
  {
    soNumber: "S.O. 621(E)",
    corridor: "Varanasi–Kolkata Economic Corridor (NH-319B)",
    section: "Section 3G",
    sectionTitle: "Determination of Compensation Award",
    state: "Jharkhand",
    district: "Bokaro & Chas",
    date: "02 Mar 2025",
    villagesCount: 11,
    status: "Award Hearings in Progress",
    parcelsCount: 310,
    publishedDateIso: "2025-03-02",
    statutorySummary: "Determination of land value, structural assets, and tree counts under Section 3G of National Highways Act 1956.",
  },
  {
    soNumber: "S.O. 2210(E)",
    corridor: "Bengaluru–Chennai Expressway (NE-7)",
    section: "Section 3D",
    sectionTitle: "Declaration of Land Acquisition",
    state: "Tamil Nadu",
    district: "Vellore & Walajah",
    date: "05 Feb 2025",
    villagesCount: 16,
    status: "Possession Disbursal Active",
    parcelsCount: 420,
    publishedDateIso: "2025-02-05",
    statutorySummary: "Declaration under Section 3D. Authority takes possession upon award deposit into CALA dedicated treasury account.",
  },
  {
    soNumber: "S.O. 1104(E)",
    corridor: "Amritsar–Jamnagar Economic Corridor (NH-754)",
    section: "Section 3A",
    sectionTitle: "Notification of Intention to Acquire",
    state: "Gujarat",
    district: "Morbi & Halvad",
    date: "19 Jan 2025",
    villagesCount: 12,
    status: "Survey & Boundary Pegging Active",
    parcelsCount: 290,
    publishedDateIso: "2025-01-19",
    statutorySummary: "Initial notice for alignment demarcation through Morbi salt pan and agricultural parcels.",
  },
  {
    soNumber: "S.O. 734(E)",
    corridor: "NH-44 Corridor Expansion",
    section: "Section 3G",
    sectionTitle: "Determination of Compensation Award",
    state: "Telangana",
    district: "Adilabad & Nirmal",
    date: "28 Feb 2025",
    villagesCount: 7,
    status: "DBT Payment Mandates Issued",
    parcelsCount: 180,
    publishedDateIso: "2025-02-28",
    statutorySummary: "Section 3G award issued with DBT clearance directly to Aadhaar-linked savings accounts of authenticated titleholders.",
  }
];

export default function GazetteSearchPage() {
  const { t } = useI18n();

  const [corridorFilter, setCorridorFilter] = useState("ALL");
  const [sectionFilter, setSectionFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotice, setSelectedNotice] = useState<GazetteNotice | null>(null);

  const corridors = useMemo(() => {
    const set = new Set<string>();
    OFFICIAL_GAZETTES.forEach(g => set.add(g.corridor));
    return Array.from(set);
  }, []);

  const filteredGazettes = useMemo(() => {
    return OFFICIAL_GAZETTES.filter((g) => {
      if (corridorFilter !== "ALL" && g.corridor !== corridorFilter) return false;
      if (sectionFilter !== "ALL" && g.section !== sectionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSo = g.soNumber.toLowerCase().includes(q);
        const matchDist = g.district.toLowerCase().includes(q);
        const matchState = g.state.toLowerCase().includes(q);
        const matchCorridor = g.corridor.toLowerCase().includes(q);
        if (!matchSo && !matchDist && !matchState && !matchCorridor) return false;
      }
      return true;
    });
  }, [corridorFilter, sectionFilter, searchQuery]);

  return (
    <PublicShell>
      <div className="max-w-[1440px] mx-auto w-full p-4 sm:p-8 space-y-6">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-none bg-[#0B2E59] text-white uppercase">
              THE GAZETTE OF INDIA &bull; STATUTORY NOTICES
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#14213D] dark:text-white leading-tight">
            Public Gazette Notification Search / ई-राजपत्र खोज
          </h1>
          <p className="text-xs text-[#5A6A80] dark:text-slate-400 mt-1">
            Search published Extraordinary Gazette notifications issued under <strong>Sections 3A, 3D, and 3G of the National Highways Act, 1956</strong>.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#DCE2E8] dark:border-white/10 pb-2">
            <div className="font-bold text-xs uppercase tracking-wide text-[#14213D] dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0B5FA5]" />
              <span>Search Gazette Notices</span>
            </div>
            <span className="text-xs font-mono text-[#0B5FA5] dark:text-sky-400">
              {filteredGazettes.length} Notifications Found
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-[#14213D] dark:text-slate-300 mb-1">
                Corridor / Highway Project
              </label>
              <select
                value={corridorFilter}
                onChange={(e) => setCorridorFilter(e.target.value)}
                className="w-full py-1.5 px-2 bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white text-xs rounded-none focus:outline-none focus:border-[#0B5FA5]"
              >
                <option value="ALL">All National Highway Corridors ({corridors.length})</option>
                {corridors.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-[#14213D] dark:text-slate-300 mb-1">
                Statutory Section
              </label>
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="w-full py-1.5 px-2 bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white text-xs rounded-none focus:outline-none focus:border-[#0B5FA5]"
              >
                <option value="ALL">All Statutory Sections</option>
                <option value="Section 3A">Section 3A (Intention to Acquire)</option>
                <option value="Section 3D">Section 3D (Declaration of Acquisition)</option>
                <option value="Section 3G">Section 3G (Award Determination)</option>
              </select>
            </div>

            <div className="sm:col-span-5">
              <label className="block text-[11px] font-bold text-[#14213D] dark:text-slate-300 mb-1">
                Search by District, State, or S.O. Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Kota, S.O. 1642, Rajasthan, Dausa..."
                  className="w-full pl-8 py-1.5 px-2.5 bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white text-xs rounded-none focus:outline-none focus:border-[#0B5FA5]"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* Gazette Table */}
        <div className="overflow-x-auto border border-[#CBD5E1] dark:border-slate-800 bg-white dark:bg-[#0B1220] rounded-none">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0B2E59] text-white">
              <tr>
                <th className="py-2.5 px-3">Gazette S.O. Ref</th>
                <th className="py-2.5 px-3">Highway Project / Corridor</th>
                <th className="py-2.5 px-3">Statutory Stage</th>
                <th className="py-2.5 px-3">District / State</th>
                <th className="py-2.5 px-3 text-center">Publication Date</th>
                <th className="py-2.5 px-3 text-center">Villages</th>
                <th className="py-2.5 px-3">Statutory Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE2E8] dark:divide-white/10">
              {filteredGazettes.map((g, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-[#0B5FA5] dark:text-sky-400">
                    {g.soNumber}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-[#14213D] dark:text-white">
                    {g.corridor}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-[#0B2E59] dark:text-sky-300">
                      {g.section}
                    </span>
                    <div className="text-[10px] text-[#64748B] dark:text-slate-400">
                      {g.sectionTitle}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-[#333333] dark:text-slate-300">
                    {g.district}, {g.state}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-[11px]">
                    {g.date}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">
                    {g.villagesCount}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-none ${
                      g.section === "Section 3D" 
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                        : g.section === "Section 3G"
                        ? "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300"
                        : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                    }`}>
                      {g.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedNotice(g)}
                      className="text-[#0B5FA5] dark:text-sky-400 hover:underline font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Notice Details</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredGazettes.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500 text-xs">
                    No official gazette notices found matching your query criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal for Gazette Inspection */}
        {selectedNotice && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0A1220] border-2 border-[#0B2E59] max-w-2xl w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-start justify-between border-b border-[#DCE2E8] dark:border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#0B2E59] text-white uppercase">
                    THE GAZETTE OF INDIA &bull; EXTRAORDINARY
                  </span>
                  <h3 className="text-lg font-bold text-[#14213D] dark:text-white mt-1">
                    Notification {selectedNotice.soNumber}
                  </h3>
                  <div className="text-xs text-[#64748B] dark:text-slate-400">
                    {selectedNotice.corridor} &bull; {selectedNotice.section}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNotice(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Publication Date:</span>
                    <span className="font-semibold text-[#14213D] dark:text-white">{selectedNotice.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Territorial Jurisdiction:</span>
                    <span className="font-semibold text-[#14213D] dark:text-white">{selectedNotice.district}, {selectedNotice.state}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Impacted Villages:</span>
                    <span className="font-semibold text-[#14213D] dark:text-white">{selectedNotice.villagesCount} Revenue Villages</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Affected Parcels:</span>
                    <span className="font-semibold text-[#14213D] dark:text-white">{selectedNotice.parcelsCount} Cadastral Units</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-[#14213D] dark:text-white mb-1">
                    Statutory Executive Order Summary:
                  </h4>
                  <p className="p-3 bg-slate-100 dark:bg-[#07080F] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {selectedNotice.statutorySummary}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DCE2E8] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedNotice(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert(`Downloading statutory copy of ${selectedNotice.soNumber}`);
                  }}
                  className="px-4 py-2 bg-[#0B2E59] hover:bg-[#071A32] text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Official Gazette Copy</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </PublicShell>
  );
}
