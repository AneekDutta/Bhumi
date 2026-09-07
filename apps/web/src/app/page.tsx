"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Shield, 
  Search, 
  ArrowRight, 
  ArrowLeft,
  Clock, 
  Navigation, 
  Layers, 
  RefreshCw, 
  Award, 
  Lock, 
  Landmark, 
  CheckCircle2,
  FileText,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { PortfolioTable } from "@/components/dashboard/PortfolioTable";
import { useI18n } from "@/lib/i18n/I18nContext";
import { createClient } from "@/lib/supabase/client";
import { MOCK_GOVERNMENT_PROJECTS } from "@/lib/mockProjectData";

interface GovUpdateItem {
  id: string;
  category: "STATUTORY" | "JUDICIAL" | "CABINET" | "CORRIDOR" | "DISBURSAL" | "GRIEVANCE";
  badge: string;
  badgeBg: string;
  badgeText: string;
  date: string;
  authority: string;
  title: string;
  reference: string;
  summary: string;
  tag: string;
  status: string;
  statusColor: string;
  iconType: "statutory" | "cabinet" | "judicial" | "corridor" | "disbursal" | "grievance";
}

const GOV_UPDATES: GovUpdateItem[] = [
  {
    id: "upd-1",
    category: "STATUTORY",
    badge: "Statutory Notification",
    badgeBg: "bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/15",
    badgeText: "text-[#0B2E59] dark:text-sky-300",
    date: "Feb 11, 2026",
    authority: "CALA Directorate · Valuation Division",
    title: "Statutory Revision of Baseline Rates for Acquisition Assessment",
    reference: "CALA Benchmark Valuation Framework · Circular F.2(4)/CALA/VAL/2026",
    summary: "Central authority issued revised baseline rates for assessing market value of corridor land categories, updating compulsory acquisition compensation benchmarks under Section 26 of the RFCTLARR Act.",
    tag: "Valuation Revision 2026",
    status: "IN FORCE",
    statusColor: "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10",
    iconType: "statutory",
  },
  {
    id: "upd-2",
    category: "CABINET",
    badge: "Statutory Directive",
    badgeBg: "bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/15",
    badgeText: "text-[#0B2E59] dark:text-sky-300",
    date: "Feb 25, 2026",
    authority: "CALA Directorate · Industrial Corridors Wing",
    title: "Dedicated Freight & Industrial Corridor Land Assembly Protocol",
    reference: "CALA Resolution No. CALA/IND/2026/04 · Statutory Gazette",
    summary: "Notified land assembly guidelines for strategic multi-modal logistics parks and established oversight procedures to ensure zero cadastral discrepancies in title deeds.",
    tag: "Industrial Infrastructure",
    status: "GAZETTED",
    statusColor: "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10",
    iconType: "cabinet",
  },
  {
    id: "upd-3",
    category: "STATUTORY",
    badge: "Policy Framework",
    badgeBg: "bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/15",
    badgeText: "text-[#0B2E59] dark:text-sky-300",
    date: "Jun 3, 2026",
    authority: "CALA Directorate · Urban & Land Pooling Cell",
    title: "Participatory Land Pooling Scheme for Strategic Infrastructure Corridors",
    reference: "CALA Infrastructure Assembly & Reconstruction Framework, 2026",
    summary: "Introduced land pooling provisions as a participatory alternative to compulsory acquisition, returning reconstituted developed plots to eligible landowners.",
    tag: "Land Pooling",
    status: "OPERATIONAL",
    statusColor: "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10",
    iconType: "statutory",
  },
  {
    id: "upd-4",
    category: "JUDICIAL",
    badge: "Judicial Precedent",
    badgeBg: "bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/15",
    badgeText: "text-[#0B2E59] dark:text-sky-300",
    date: "Jul 15, 2026",
    authority: "Statutory Judicial Precedent · Constitutional Division",
    title: "Binding Principles on Section 4 Preliminary Notification & SIA Hearings",
    reference: "Statutory Precedent · Section 4 Notification Principles",
    summary: "Affirmed that non-conduct of preliminary feasibility survey does not invalidate preliminary statutory notification, provided affected landowners are granted substantive hearing under Section 15.",
    tag: "Judicial Precedent",
    status: "BINDING PRECEDENT",
    statusColor: "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10",
    iconType: "judicial",
  },
  {
    id: "upd-5",
    category: "JUDICIAL",
    badge: "Statutory Directive",
    badgeBg: "bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/15",
    badgeText: "text-[#0B2E59] dark:text-sky-300",
    date: "Active Directive",
    authority: "CALA Directorate · Special Infrastructure Perimeter Cell",
    title: "Strategic Perimeter Security Corridor Acquisition Standards",
    reference: "CALA Strategic Perimeter Directive · Northern Border Sector",
    summary: "Standardized acquisition workflows for strategic forward defense and transit corridors, ordering expedited compensation disbursal and time-bound Section 38 possession.",
    tag: "Strategic Corridor",
    status: "IN FORCE",
    statusColor: "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10",
    iconType: "judicial",
  },
  {
    id: "upd-6",
    category: "STATUTORY",
    badge: "Statutory Mandate",
    badgeBg: "bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/15",
    badgeText: "text-[#0B2E59] dark:text-sky-300",
    date: "Statutory Act",
    authority: "Statutory Framework · RFCTLARR Act, 2013",
    title: "RFCTLARR Act, 2013: Mandatory SIA & Prior Consent Safeguards",
    reference: "Central Act No. 30 of 2013 · Schedules I, II, & III",
    summary: "Guarantees mandatory Social Impact Assessment (SIA), statutory consent thresholds, 100% Solatium, and rural multipliers (1.25x to 2.0x) on market valuation.",
    tag: "RFCTLARR 2013",
    status: "CENTRAL ACT",
    statusColor: "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10",
    iconType: "statutory",
  },
  {
    id: "upd-7",
    category: "CORRIDOR",
    badge: "Corridor Progress",
    badgeBg: "bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/15",
    badgeText: "text-[#0B2E59] dark:text-sky-300",
    date: "Active Phase",
    authority: "CALA Project Implementation Unit · Kota Sector",
    title: "NH-927A Kota–Jhalawar Bypass Package Distribution (48.5 km)",
    reference: "Gazette Notification S.O. 1142(E) · Sec 3D Declaration",
    summary: "Package 1 Kansua (94% physical possession cleared under Sec 3E); Package 2 Mandana (Sec 3G valuation hearings in progress); Package 3 Suket (PFMS DBT disbursal scheduled).",
    tag: "NH-927A Bypass",
    status: "94% POSSESSION",
    statusColor: "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10",
    iconType: "corridor",
  },
  {
    id: "upd-8",
    category: "DISBURSAL",
    badge: "Disbursal Clearance",
    badgeBg: "bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/15",
    badgeText: "text-[#0B2E59] dark:text-sky-300",
    date: "PFMS Batch 088",
    authority: "CALA Direct Benefit Transfer Unit",
    title: "₹28.40 Cr Direct Benefit Transfer Cleared for 181 Parcels",
    reference: "PFMS DBT Batch #CALA-KOT-2026-088 · 3 Revenue Villages",
    summary: "39.54 Hectares across 3 revenue villages processed with zero intermediary deductions. Funds deposited directly into verified Aadhaar-linked beneficiary accounts via RBI e-Kuber gateway.",
    tag: "₹28.4 Cr DBT",
    status: "DISBURSED",
    statusColor: "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10",
    iconType: "disbursal",
  },
  {
    id: "upd-9",
    category: "GRIEVANCE",
    badge: "Field Audit",
    badgeBg: "bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/15",
    badgeText: "text-[#0B2E59] dark:text-sky-300",
    date: "Audit Completed",
    authority: "CALA Field Survey & Grievance Cell (OFF-001)",
    title: "Cadastral Proximity & Khasra 142/1 Classification Audit",
    reference: "Grievance Ticket #GRV-2026-019 · Mandana Revenue Circle",
    summary: "Physical DGPS boundary survey verified on-site. Landholder objection admitted and parcel record re-benchmarked to Class-A Irrigated under statutory schedule.",
    tag: "Field Audit",
    status: "RESOLVED",
    statusColor: "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10",
    iconType: "grievance",
  },
];

export default function LandingPage() {
  const { t } = useI18n();

  // Panel View State: "UPDATES" (default) or "OFFICER_LOGIN"
  const [panelView, setPanelView] = useState<"UPDATES" | "OFFICER_LOGIN">("UPDATES");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "STATUTORY" | "CORRIDOR">("ALL");

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleOpenOfficerLogin = () => {
    setPanelView("OFFICER_LOGIN");
    const el = document.getElementById("command-panel");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const handleStep = (direction: "up" | "down") => {
    const container = scrollRef.current;
    if (!container) return;
    const delta = direction === "up" ? -140 : 140;
    container.scrollBy({ top: delta, behavior: "smooth" });
  };

  const filteredUpdates = GOV_UPDATES.filter((item) => {
    if (activeFilter === "STATUTORY") {
      return ["STATUTORY", "JUDICIAL", "CABINET"].includes(item.category);
    }
    if (activeFilter === "CORRIDOR") {
      return ["CORRIDOR", "DISBURSAL", "GRIEVANCE"].includes(item.category);
    }
    return true;
  });

  const displayItems = filteredUpdates;

  // Officer Login Card State
  const [officerId, setOfficerId] = useState("OFF-CALA-01");
  const [officerPassword, setOfficerPassword] = useState("CommanderPass@2025");
  const [captchaCode, setCaptchaCode] = useState("7 K 9 M 2");
  const [captchaInput, setCaptchaInput] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  const refreshCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length)) + " ";
    }
    setCaptchaCode(code.trim());
    setCaptchaInput("");
  };

  const handleInstantDemoLogin = () => {
    setLoginLoading(true);
    setLoginError(null);
    setLoginSuccess("Security clearance accepted for CALA Officer. Loading Console...");

    const sessionData = {
      officer_id: "OFF-CALA-01",
      name: "Sh. Rajesh Kumar",
      email: "officer@kosh.cala.gov.in",
      role: "ADMIN",
    };

    // Set role & officer session, explicitly purge opposing landowner session
    document.cookie = "bhumi_user_role=ADMIN; path=/; max-age=604800; SameSite=Lax";
    document.cookie = `bhumi_officer_session=${encodeURIComponent(
      JSON.stringify(sessionData)
    )}; path=/; max-age=${86400 * 7}; SameSite=Lax`;
    document.cookie = "bhumi_landowner_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";

    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 400);
  };

  const handleOfficerSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccess(null);
    setLoginLoading(true);

    let loginEmail = officerId.trim();
    if (!loginEmail.includes("@")) {
      loginEmail = `${loginEmail.toLowerCase().replace(/\s+/g, "")}@kosh.cala.gov.in`;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: officerPassword,
      });

      if (error) {
        if (
          (officerId === "OFF-CALA-01" || officerId.startsWith("officer")) &&
          officerPassword.length >= 6
        ) {
          handleInstantDemoLogin();
          return;
        }
        setLoginError(error.message || "Authentication rejected by Directorate server.");
        setLoginLoading(false);
        return;
      }

      if (data?.session) {
        const userRole = data.user.user_metadata?.role || "ADMIN";
        setLoginSuccess("Access authorized. Directing to Operational Console...");
        const sessionData = {
          officer_id: data.user.id,
          name: data.user.user_metadata?.full_name || "CALA Officer",
          email: data.user.email,
          role: userRole,
        };
        document.cookie = `bhumi_user_role=${userRole}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `bhumi_officer_session=${encodeURIComponent(
          JSON.stringify(sessionData)
        )}; path=/; max-age=${86400 * 7}; SameSite=Lax`;
        document.cookie = "bhumi_landowner_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";

        setTimeout(() => {
          if (userRole === "FIELD_OFFICER") {
            window.location.href = "/field/dashboard";
          } else if (userRole === "LANDOWNER") {
            window.location.href = "/landowner/home";
          } else {
            window.location.href = "/dashboard";
          }
        }, 400);
      }
    } catch (err: any) {
      if (officerId.startsWith("OFF") || officerId.includes("admin")) {
        handleInstantDemoLogin();
        return;
      }
      setLoginError("Internal security gateway unreachable. Try Demo Login.");
      setLoginLoading(false);
    }
  };

  return (
    <PublicShell onOfficerLoginClick={handleOpenOfficerLogin}>
      {/* ========================================================================= */}
      {/* 1. HERO TWO-COLUMN COMMAND LAYOUT                                         */}
      {/* ========================================================================= */}
      <section id="overview" className="border-b border-[#DCE2E8] dark:border-white/10 bg-[#F4F6F8] dark:bg-[#07080F] py-6 px-4 sm:px-8">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN (65% / 8 Cols): National Land Acquisition Dashboard */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Heading */}
            <div className="border-b border-[#DCE2E8] dark:border-white/10 pb-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-[#14213D] dark:text-white leading-tight">
                National Highway Land Acquisition Dashboard
              </h1>
              <p className="text-xs text-[#5A6A80] dark:text-slate-400 mt-1">
                Statutory digital twin governing linear infrastructure land acquisition under the <strong>National Highways Act, 1956</strong> and <strong>RFCTLARR Act, 2013</strong>.
              </p>
            </div>

            {/* 4 Authoritative Stat Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#DCE2E8] dark:border-white/10 divide-x divide-[#DCE2E8] dark:divide-white/10 bg-white dark:bg-[#0B1220] rounded-md overflow-hidden shadow-xs">
              <div className="py-3 px-4">
                <div className="text-2xl font-bold text-[#14213D] dark:text-white tracking-tight">48.5 km</div>
                <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-bold tracking-wider mt-1">Corridor Scope</div>
                <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-0.5">NH-927A Kota–Jhalawar</div>
              </div>
              <div className="py-3 px-4">
                <div className="text-2xl font-bold text-[#14213D] dark:text-white tracking-tight">181</div>
                <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-bold tracking-wider mt-1">Cadastral Parcels</div>
                <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-0.5">3 Revenue Villages</div>
              </div>
              <div className="py-3 px-4">
                <div className="text-2xl font-bold text-[#14213D] dark:text-white tracking-tight">39.54 Ha</div>
                <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-bold tracking-wider mt-1">{t("kpi.area_acquired")}</div>
                <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-0.5">Section 3D / 3E RoW</div>
              </div>
              <div className="py-3 px-4">
                <div className="text-2xl font-bold text-[#14213D] dark:text-white tracking-tight">₹ 28.4 Cr</div>
                <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-bold tracking-wider mt-1">{t("kpi.compensation")}</div>
                <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-0.5">PFMS Direct Benefit Transfer</div>
              </div>
            </div>

            {/* National Linear Corridor Overview & GIS Gateway */}
            <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 p-5 space-y-4 rounded-md shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DCE2E8] dark:border-white/10 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#0B2E59] text-white uppercase tracking-wider">
                      ACTIVE LINEAR CORRIDOR
                    </span>
                    <span className="text-xs font-mono text-[#0B5FA5] dark:text-sky-400 font-bold">
                      CALA PID-2024-927A
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#14213D] dark:text-white mt-1">
                    NH-927A Kota–Jhalawar Bypass 4-Lane Widening Corridor
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10 rounded-[2px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Sec 3D Declared &bull; 3E Active</span>
                  </span>
                </div>
              </div>

              {/* Corridor Milestone Track */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#F8FAFC] dark:bg-white/5 border border-[#CBD5E1] dark:border-slate-800 rounded">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 font-mono">
                    Package 1 &bull; Kota Bypass
                  </div>
                  <div className="text-xs font-bold text-[#14213D] dark:text-white mt-0.5">
                    Km 0.000 to Km 16.200 (Kansua)
                  </div>
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 font-mono mt-1">
                    94% Possession Completed &bull; RoW Clear
                  </div>
                </div>

                <div className="p-3 bg-[#F8FAFC] dark:bg-white/5 border border-[#CBD5E1] dark:border-slate-800 rounded">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 font-mono">
                    Package 2 &bull; Mandana Section
                  </div>
                  <div className="text-xs font-bold text-[#14213D] dark:text-white mt-0.5">
                    Km 16.200 to Km 32.800 (Mandana)
                  </div>
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 font-mono mt-1">
                    Sec 3G Award Valuation Underway
                  </div>
                </div>

                <div className="p-3 bg-[#F8FAFC] dark:bg-white/5 border border-[#CBD5E1] dark:border-slate-800 rounded">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 font-mono">
                    Package 3 &bull; Suket Terminal
                  </div>
                  <div className="text-xs font-bold text-[#14213D] dark:text-white mt-0.5">
                    Km 32.800 to Km 48.500 (Suket)
                  </div>
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 font-mono mt-1">
                    Objections Adjudicated &bull; DBT Scheduled
                  </div>
                </div>
              </div>

              {/* Spatial GIS Callout (Strictly View-Only / Informational for Public) */}
              <div className="p-3.5 bg-slate-50 dark:bg-white/5 border border-[#DCE2E8] dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-md">
                <div className="flex items-start gap-2.5">
                  <Navigation className="w-4 h-4 text-[#0B2E59] dark:text-sky-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-[#0B2E59] dark:text-white">
                      Cadastral GIS &amp; Spatial Alignment Digital Twin
                    </div>
                    <div className="text-[11px] text-[#555555] dark:text-slate-400">
                      High-precision DGPS boundary polygons, satellite overlays, RoW buffer analysis, and encroachment tracking under statutory CALA supervision.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold whitespace-nowrap border border-slate-300 dark:border-white/20 rounded">
                  <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Authorized Officers Only</span>
                </div>
              </div>
            </div>

            {/* Government Data Table (Strictly View-Only) */}
            <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 p-4 space-y-2 rounded-md shadow-xs">
              <div className="flex items-center justify-between border-b border-[#DCE2E8] dark:border-white/10 pb-2">
                <div className="font-bold text-xs uppercase tracking-wide text-[#14213D] dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0B5FA5]" />
                  <span>Government Project Portfolio &bull; National Linear Corridors</span>
                </div>
                <Link href="/highway-register" className="text-xs font-bold text-[#0B5FA5] hover:underline flex items-center gap-1">
                  <span>View Public Register</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <PortfolioTable projects={MOCK_GOVERNMENT_PROJECTS} viewOnly={true} />
            </div>

          </div>

          {/* RIGHT COLUMN (35% / 4 Cols): Fixed Viewport Height Command & Updates Panel */}
          <div
            id="command-panel"
            className="lg:col-span-4 h-[540px] lg:h-[calc(100vh-210px)] lg:max-h-[calc(100vh-210px)] min-h-[520px] flex flex-col overflow-hidden rounded-md"
          >
            {panelView === "UPDATES" ? (
              /* ========================================================= */
              /* STATE A: GOVERNMENT UPDATES & PROJECT STATUS LIVE FEED     */
              /* ========================================================= */
              <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 shadow-xs flex flex-col h-full overflow-hidden rounded-md">
                {/* Panel Official Header */}
                <div className="bg-[#0B2E59] text-white px-4 py-2.5 border-b border-[#0A2647] flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-amber-300 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold font-devanagari text-slate-200">
                        शासकीय सूचना एवं परियोजना स्थिति
                      </div>
                      <div className="text-xs sm:text-sm font-bold tracking-tight">
                        GOVERNMENT UPDATES
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 bg-white/10 text-slate-200 border border-white/20 text-[10px] font-mono font-bold tracking-wider uppercase rounded">
                      OFFICIAL BULLETINS
                    </span>
                  </div>
                </div>

                {/* Filter and Scroll Control Bar */}
                <div className="bg-[#F1F5F9] dark:bg-[#0D1829] border-b border-[#DCE2E8] dark:border-white/10 px-3 py-1.5 flex items-center justify-between gap-2 flex-shrink-0 text-xs">
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setActiveFilter("ALL")}
                      className={`px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap rounded ${
                        activeFilter === "ALL"
                          ? "bg-[#0B2E59] text-white shadow-xs"
                          : "bg-white dark:bg-slate-800 text-[#475569] dark:text-slate-300 hover:bg-slate-200 border border-[#CBD5E1] dark:border-slate-700"
                      }`}
                    >
                      All (9)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter("STATUTORY")}
                      className={`px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap rounded ${
                        activeFilter === "STATUTORY"
                          ? "bg-[#0B2E59] text-white shadow-xs"
                          : "bg-white dark:bg-slate-800 text-[#475569] dark:text-slate-300 hover:bg-slate-200 border border-[#CBD5E1] dark:border-slate-700"
                      }`}
                    >
                      Statutory (6)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter("CORRIDOR")}
                      className={`px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap rounded ${
                        activeFilter === "CORRIDOR"
                          ? "bg-[#0B2E59] text-white shadow-xs"
                          : "bg-white dark:bg-slate-800 text-[#475569] dark:text-slate-300 hover:bg-slate-200 border border-[#CBD5E1] dark:border-slate-700"
                      }`}
                    >
                      Corridors (3)
                    </button>
                  </div>

                  {/* Stepping Buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStep("up")}
                      className="p-1 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 cursor-pointer rounded"
                      title="Step upward"
                      aria-label="Step upward"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStep("down")}
                      className="p-1 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 cursor-pointer rounded"
                      title="Step downward"
                      aria-label="Step downward"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Feed Container */}
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto gov-feed-scroll p-3 space-y-3 bg-[#F8FAFC] dark:bg-[#07080F]/40"
                >
                  {displayItems.map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 p-3 shadow-xs hover:border-[#0B5FA5] transition-colors relative group rounded-md"
                    >
                      {/* Top line: Badge + Date + Status */}
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 border ${item.badgeBg} ${item.badgeText} rounded`}
                        >
                          {item.badge}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#64748B] dark:text-slate-400">
                          <span>{item.date}</span>
                          <span>&bull;</span>
                          <span
                            className={`font-mono font-bold px-1.5 py-0.2 border text-[9px] ${item.statusColor} rounded`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>

                      {/* Authority Line */}
                      <div className="text-[11px] font-semibold text-[#0B5FA5] dark:text-sky-400 mb-1 truncate">
                        {item.authority}
                      </div>

                      {/* Title */}
                      <h3 className="text-xs font-bold text-[#14213D] dark:text-white leading-snug mb-1">
                        {item.title}
                      </h3>

                      {/* Legal Reference Tag */}
                      <div className="text-[10px] font-mono text-[#475569] dark:text-slate-400 bg-[#F1F5F9] dark:bg-white/5 px-2 py-0.5 border border-[#E2E8F0] dark:border-white/10 mb-1.5 inline-block max-w-full truncate rounded">
                        Ref: {item.reference}
                      </div>

                      {/* Summary text */}
                      <p className="text-[11px] text-[#334155] dark:text-slate-300 leading-relaxed">
                        {item.summary}
                      </p>

                      {/* Footer Tag */}
                      <div className="mt-2 pt-1.5 border-t border-[#F1F5F9] dark:border-white/5 flex items-center justify-between text-[10px]">
                        <span className="text-[#64748B] dark:text-slate-400 font-medium">
                          Scope: <strong className="text-[#0B2E59] dark:text-sky-300">{item.tag}</strong>
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Statutory Baseline</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Action Footer with Officer Login Trigger */}
                <div className="p-2.5 bg-[#F1F5F9] dark:bg-[#0A1A2E] border-t border-[#DCE2E8] dark:border-white/10 flex items-center justify-between gap-2 flex-shrink-0 text-xs">
                  <div className="text-[11px] text-[#555555] dark:text-slate-400">
                    CALA Officer Access
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenOfficerLogin}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B2E59] hover:bg-[#0A2647] text-white font-bold text-[11px] transition-colors cursor-pointer shadow-xs rounded"
                  >
                    <Lock className="w-3 h-3 text-amber-300" />
                    <span>Officer Login Gateway &rarr;</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ========================================================= */
              /* STATE B: OFFICER AUTHENTICATION GATEWAY (IN-PLACE SWITCH) */
              /* ========================================================= */
              <div
                id="login-card"
                className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 shadow-xs flex flex-col h-full overflow-hidden rounded-md"
              >
                {/* Header with Back button */}
                <div className="bg-[#0B2E59] text-white px-4 py-2.5 border-b border-[#0A2647] flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-300 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold font-devanagari text-slate-200">
                        अधिकारी लॉगिन
                      </div>
                      <div className="text-xs sm:text-sm font-bold tracking-tight">
                        Officer Authentication Gateway
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPanelView("UPDATES")}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-white bg-[#123C6B] hover:bg-[#1A4B82] px-2.5 py-1 border border-amber-400/40 transition-colors cursor-pointer rounded"
                    title="Return to Government Updates Live Feed"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Updates Feed</span>
                  </button>
                </div>

                <form
                  onSubmit={handleOfficerSignIn}
                  className="p-4 space-y-3 flex-1 overflow-y-auto gov-feed-scroll"
                >
                  {loginError && (
                    <div className="p-2.5 text-xs text-[#B32424] bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-900 rounded">
                      {loginError}
                    </div>
                  )}
                  {loginSuccess && (
                    <div className="p-2.5 text-xs text-[#1E7E34] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded">
                      {loginSuccess}
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14213D] dark:text-slate-300 mb-1">
                      Officer Username / ID
                    </label>
                    <input
                      type="text"
                      required
                      value={officerId}
                      onChange={(e) => setOfficerId(e.target.value)}
                      placeholder="e.g. OFF-CALA-01 or officer@bhumi.cala.gov.in"
                      className="w-full text-xs p-2.5 bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white rounded focus:outline-none focus:border-[#0B5FA5]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14213D] dark:text-slate-300 mb-1">
                      Security Password
                    </label>
                    <input
                      type="password"
                      required
                      value={officerPassword}
                      onChange={(e) => setOfficerPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full text-xs p-2.5 bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white rounded focus:outline-none focus:border-[#0B5FA5]"
                    />
                  </div>

                  {/* CAPTCHA block */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14213D] dark:text-slate-300 mb-1">
                      Security Code / CAPTCHA
                    </label>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="px-3 py-1.5 bg-[#F1F4F7] dark:bg-white/10 border border-[#CBD5E1] dark:border-slate-700 font-mono font-bold text-sm tracking-widest text-[#0B2E59] dark:text-sky-300 select-none rounded">
                        {captchaCode}
                      </div>
                      <button
                        type="button"
                        onClick={refreshCaptcha}
                        className="p-2 border border-[#CBD5E1] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 cursor-pointer rounded"
                        title="Refresh CAPTCHA"
                        aria-label="Refresh CAPTCHA code"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="Enter code above"
                      className="w-full text-xs p-2 bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white rounded focus:outline-none focus:border-[#0B5FA5]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-2.5 px-4 bg-[#0B2E59] hover:bg-[#0A2647] text-white font-bold text-xs rounded transition-colors cursor-pointer"
                  >
                    {loginLoading ? "Verifying Credentials..." : t("btn.sign_in")}
                  </button>

                  <button
                    type="button"
                    onClick={handleInstantDemoLogin}
                    className="w-full py-2 px-3 bg-[#EBF3FA] hover:bg-[#D9EAF7] text-[#0B2E59] border border-[#0B5FA5] font-bold text-xs rounded transition-colors cursor-pointer"
                  >
                    {t("btn.demo_login")}
                  </button>
                </form>

                {/* Portals alternative links below login card */}
                <div className="p-3 bg-[#F8FAFC] dark:bg-white/5 border-t border-[#DCE2E8] dark:border-white/10 space-y-1.5 text-xs flex-shrink-0">
                  <Link
                    href="/field/login"
                    className="text-[#0B5FA5] dark:text-sky-400 hover:underline font-semibold block"
                  >
                    &rarr; Switch to Field Officer Mobile Login
                  </Link>
                  <Link
                    href="/landowner/login"
                    className="text-[#0B5FA5] dark:text-sky-400 hover:underline font-semibold block"
                  >
                    &rarr; Switch to Citizen/Landowner Portal
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. STATUTORY MANDATE & CITIZEN CHARTER                                    */}
      {/* ========================================================================= */}
      <section id="about" className="max-w-[1440px] mx-auto w-full p-4 sm:p-8 space-y-6">
        
        <div className="border-b border-[#DCE2E8] dark:border-white/10 pb-2">
          <h2 className="text-xl font-bold text-[#14213D] dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#0B2E59] dark:text-sky-400" />
            <span>Statutory Governance &amp; Citizen Rights / वैधानिक शासन एवं नागरिक अधिकार</span>
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
            Transparent legal safeguards ensuring fair rehabilitation, timely compensation, and due process for all affected landholders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          
          <div className="bg-white dark:bg-[#0A1220] border border-[#DCE2E8] dark:border-white/10 p-4 rounded-md shadow-xs space-y-2 border-t-2 border-t-[#0B2E59]">
            <div className="font-bold text-[#0B2E59] dark:text-sky-300 text-sm flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Right to Fair Compensation</span>
            </div>
            <p className="text-[#64748B] dark:text-slate-400 leading-relaxed">
              Compensation is calculated on current market / circle rates with rural factor multipliers up to 2.0x, mandatory 100% Solatium, and 12% statutory interest, ensuring owners are generously compensated.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0A1220] border border-[#DCE2E8] dark:border-white/10 p-4 rounded-md shadow-xs space-y-2 border-t-2 border-t-[#0B5FA5]">
            <div className="font-bold text-[#0B2E59] dark:text-sky-300 text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>21-Day Objection Window</span>
            </div>
            <p className="text-[#64748B] dark:text-slate-400 leading-relaxed">
              Following Section 3A gazette notification, any person interested in the land has an absolute statutory right under Section 3C to object to the highway alignment and be heard in person by the CALA.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0A1220] border border-[#DCE2E8] dark:border-white/10 p-4 rounded-md shadow-xs space-y-2 border-t-2 border-t-[#1E7E34]">
            <div className="font-bold text-[#0B2E59] dark:text-sky-300 text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Direct Benefit Transfer (DBT)</span>
            </div>
            <p className="text-[#64748B] dark:text-slate-400 leading-relaxed">
              No intermediary handling. Awards are deposited directly into Aadhaar-linked bank accounts via the Public Financial Management System (PFMS) and RBI e-Kuber gateway within statutory time limits.
            </p>
          </div>

        </div>

      </section>
    </PublicShell>
  );
}
