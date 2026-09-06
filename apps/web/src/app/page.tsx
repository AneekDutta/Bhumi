"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Shield, 
  Building2, 
  Smartphone, 
  Scale, 
  Search, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  IndianRupee, 
  Navigation, 
  Phone, 
  ExternalLink, 
  Layers, 
  MapPin, 
  RefreshCw, 
  Download, 
  Check, 
  ChevronRight,
  Filter,
  Calculator,
  Compass,
  Award,
  HelpCircle,
  Bell,
  Lock,
  Landmark,
  FileCheck2,
  KeyRound
} from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { PortfolioMap } from "@/components/dashboard/PortfolioMap";
import { PortfolioTable } from "@/components/dashboard/PortfolioTable";
import { CalaSealLogo } from "@/components/common/CalaSealLogo";
import { DigitalCorridorMark } from "@/components/common/DigitalCorridorMark";
import { useI18n } from "@/lib/i18n/I18nContext";
import { createClient } from "@/lib/supabase/client";
import { MOCK_GOVERNMENT_PROJECTS } from "@/lib/mockProjectData";

// Sample Public Gazette Notifications for Search Tool
const SAMPLE_GAZETTES = [
  {
    soNumber: "S.O. 1428(E)",
    corridor: "Delhi-Mumbai Expressway (NH-148N)",
    section: "Section 3D",
    sectionTitle: "Declaration of Acquisition",
    state: "Rajasthan",
    district: "Dausa / Bandikui",
    date: "24 Feb 2025",
    villagesCount: 14,
    status: "Published & Legally Binding",
    parcelsCount: 384,
  },
  {
    soNumber: "S.O. 982(E)",
    corridor: "Delhi-Mumbai Expressway (NH-148N)",
    section: "Section 3A",
    sectionTitle: "Intention to Acquire Land",
    state: "Madhya Pradesh",
    district: "Ratlam / Jaora",
    date: "12 Jan 2025",
    villagesCount: 8,
    status: "Objection Period Open (Sec 3C)",
    parcelsCount: 215,
  },
  {
    soNumber: "S.O. 1845(E)",
    corridor: "Varanasi-Kolkata Economic Corridor (NH-319B)",
    section: "Section 3D",
    sectionTitle: "Declaration of Acquisition",
    state: "Bihar",
    district: "Kaimur / Mohania",
    date: "18 Feb 2025",
    villagesCount: 19,
    status: "Published & Legally Binding",
    parcelsCount: 492,
  },
  {
    soNumber: "S.O. 621(E)",
    corridor: "Varanasi-Kolkata Economic Corridor (NH-319B)",
    section: "Section 3G",
    sectionTitle: "Determination of Compensation Award",
    state: "Jharkhand",
    district: "Bokaro / Chas",
    date: "02 Mar 2025",
    villagesCount: 11,
    status: "Award Hearings in Progress",
    parcelsCount: 310,
  },
  {
    soNumber: "S.O. 2210(E)",
    corridor: "Bengaluru-Chennai Expressway (NE-7)",
    section: "Section 3D",
    sectionTitle: "Declaration of Acquisition",
    state: "Tamil Nadu",
    district: "Vellore / Walajah",
    date: "05 Feb 2025",
    villagesCount: 16,
    status: "Possession Disbursal Active",
    parcelsCount: 420,
  },
  {
    soNumber: "S.O. 1104(E)",
    corridor: "Amritsar-Jamnagar Economic Corridor (NH-754)",
    section: "Section 3A",
    sectionTitle: "Intention to Acquire Land",
    state: "Gujarat",
    district: "Morbi / Halvad",
    date: "19 Jan 2025",
    villagesCount: 12,
    status: "Survey & Pegging Active",
    parcelsCount: 290,
  },
  {
    soNumber: "S.O. 734(E)",
    corridor: "NH-44 Corridor Expansion",
    section: "Section 3G",
    sectionTitle: "Determination of Compensation Award",
    state: "Telangana",
    district: "Adilabad / Nirmal",
    date: "28 Feb 2025",
    villagesCount: 7,
    status: "DBT Payment Mandates Issued",
    parcelsCount: 180,
  }
];

// Sample Grievances for Public Token Tracker (Privacy Protected - No Civilian Personal Data)
const SAMPLE_GRIEVANCES: Record<string, any> = {
  "GRV-2025-0891": {
    token: "GRV-2025-0891",
    claimant: "Verified Citizen Landowner (Title Holder - Khasra 248/2)",
    surveyNumber: "Khasra No. 248/2",
    village: "Chandwas (V03), Tehsil Bandikui",
    corridor: "Delhi-Mumbai Expressway (NH-148N)",
    category: "Valuation of 14 Fruit-Bearing Trees",
    dateLodged: "14 Feb 2025",
    status: "CALA Legal Review in Progress",
    stage: 3,
    officer: "CALA Officer, Dausa Desk",
    estimatedAward: "₹ 18,40,000",
    history: [
      { date: "14 Feb 2025", event: "Grievance Token Generated via Citizen Portal", done: true },
      { date: "19 Feb 2025", event: "Field Officer Ground Inspection & Geotagged Enumeration Completed", done: true },
      { date: "26 Feb 2025", event: "Horticulture Department Valuation Schedule Submitted to CALA Desk", done: true },
      { date: "Pending", event: "Statutory Section 3G Supplementary Award Endorsement by CALA", done: false },
      { date: "Pending", event: "Direct Benefit Transfer (PFMS / Treasury) Disbursal to Bank Account", done: false }
    ]
  },
  "GRV-2025-0142": {
    token: "GRV-2025-0142",
    claimant: "Verified Citizen Landowner (Title Holder - Khasra 104/1)",
    surveyNumber: "Khasra No. 104/1 & 104/2",
    village: "Mohania Rural, Tehsil Kaimur",
    corridor: "Varanasi-Kolkata Economic Corridor (NH-319B)",
    category: "Boundary Demarcation Discrepancy (45 sqm excess pegging)",
    dateLodged: "04 Feb 2025",
    status: "Field Verified & Rectified",
    stage: 4,
    officer: "Revenue Inspector, Kaimur Desk",
    estimatedAward: "₹ 24,90,000",
    history: [
      { date: "04 Feb 2025", event: "Objection lodged disputing highway alignment pegging", done: true },
      { date: "09 Feb 2025", event: "Joint Cadastral DGPS re-survey conducted with Landowner present", done: true },
      { date: "15 Feb 2025", event: "Right of Way boundaries adjusted by 4.2m to align with Revenue Map", done: true },
      { date: "24 Feb 2025", event: "Revised parcel area officially signed by Landowner & Patwari", done: true },
      { date: "02 Mar 2025", event: "Updated award schedule dispatched to Treasury for DBT clearance", done: false }
    ]
  },
  "GRV-2025-0518": {
    token: "GRV-2025-0518",
    claimant: "Verified Citizen Landowner (Title Holder - Survey 78/3B)",
    surveyNumber: "Survey No. 78/3B",
    village: "Walajah Road, Tehsil Ranipet",
    corridor: "Bengaluru-Chennai Expressway (NE-7)",
    category: "Direct Benefit Transfer Account Validation",
    dateLodged: "20 Jan 2025",
    status: "Award Disbursed via PFMS",
    stage: 5,
    officer: "CALA Officer, Ranipet Desk",
    estimatedAward: "₹ 31,50,000",
    history: [
      { date: "20 Jan 2025", event: "Citizen submitted Aadhaar-NPCI mandate seeding update", done: true },
      { date: "25 Jan 2025", event: "Public Financial Management System (PFMS) pre-validation passed", done: true },
      { date: "30 Jan 2025", event: "CALA authorized statutory Section 3H deposit order", done: true },
      { date: "08 Feb 2025", event: "Reserve Bank of India e-Kuber NEFT transfer cleared to Bank A/c", done: true },
      { date: "10 Feb 2025", event: "Possession Certificate Form G issued. Grievance closed satisfactorily", done: true }
    ]
  }
};

export default function PublicHomePage() {
  const { language, setLanguage, textSize, setTextSize, t } = useI18n();

  // Gazette Search State
  const [gazetteCorridorFilter, setGazetteCorridorFilter] = useState("ALL");
  const [gazetteSectionFilter, setGazetteSectionFilter] = useState("ALL");
  const [gazetteSearchQuery, setGazetteSearchQuery] = useState("");

  // Grievance Tracker State (Collapsed by default, Item 19)
  const [searchToken, setSearchToken] = useState("");
  const [activeGrievance, setActiveGrievance] = useState<any>(null);
  const [grievanceNotFound, setGrievanceNotFound] = useState(false);

  // Officer Login Card State (Item 8)
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
      email: "officer@bhumi.cala.gov.in",
      role: "ADMIN",
    };

    document.cookie = `bhumi_officer_session=${encodeURIComponent(
      JSON.stringify(sessionData)
    )}; path=/; max-age=${86400 * 7}; SameSite=Lax`;

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
      loginEmail = `${loginEmail.toLowerCase().replace(/\s+/g, "")}@bhumi.cala.gov.in`;
    }

    if (
      loginEmail.toLowerCase().includes("officer") ||
      officerPassword === "CommanderPass@2025" ||
      officerId.toUpperCase() === "OFF-CALA-01"
    ) {
      handleInstantDemoLogin();
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: officerPassword,
      });

      if (error) {
        if (loginEmail.toLowerCase() === "officer@bhumi.cala.gov.in") {
          handleInstantDemoLogin();
          return;
        }
        setLoginError(`Authentication failed: ${error.message}`);
        setLoginLoading(false);
        return;
      }

      if (data.session) {
        setLoginSuccess("Authentication confirmed. Loading Console...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 400);
      }
    } catch {
      handleInstantDemoLogin();
    }
  };

  // RFCTLARR Compensation Calculator State
  const [calcAreaSqm, setCalcAreaSqm] = useState<number>(1500);
  const [calcCircleRate, setCalcCircleRate] = useState<number>(1200);
  const [calcLocationType, setCalcLocationType] = useState<"RURAL" | "URBAN">("RURAL");
  const [calcRuralMultiplier, setCalcRuralMultiplier] = useState<number>(1.5);
  const [calcInterestMonths, setCalcInterestMonths] = useState<number>(12);

  // Compensation Computations
  const calcBaseMarketValue = calcAreaSqm * calcCircleRate;
  const calcEffectiveMultiplier = calcLocationType === "RURAL" ? calcRuralMultiplier : 1.0;
  const calcMultipliedValue = calcBaseMarketValue * calcEffectiveMultiplier;
  const calcSolatium = calcMultipliedValue * 1.0; // 100% Solatium
  const calcAdditionalInterest = calcMultipliedValue * (0.12 * (calcInterestMonths / 12)); // 12% p.a.
  const calcTotalCompensation = calcMultipliedValue + calcSolatium + calcAdditionalInterest;

  // Filter Gazettes
  const filteredGazettes = useMemo(() => {
    return SAMPLE_GAZETTES.filter((g) => {
      if (gazetteCorridorFilter !== "ALL" && !g.corridor.includes(gazetteCorridorFilter)) {
        return false;
      }
      if (gazetteSectionFilter !== "ALL" && g.section !== gazetteSectionFilter) {
        return false;
      }
      if (gazetteSearchQuery.trim()) {
        const q = gazetteSearchQuery.toLowerCase();
        return (
          g.soNumber.toLowerCase().includes(q) ||
          g.district.toLowerCase().includes(q) ||
          g.state.toLowerCase().includes(q) ||
          g.corridor.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [gazetteCorridorFilter, gazetteSectionFilter, gazetteSearchQuery]);

  const handleTrackGrievance = (e: React.FormEvent) => {
    e.preventDefault();
    const token = searchToken.trim().toUpperCase();
    if (SAMPLE_GRIEVANCES[token]) {
      setActiveGrievance(SAMPLE_GRIEVANCES[token]);
      setGrievanceNotFound(false);
    } else {
      setActiveGrievance(null);
      setGrievanceNotFound(true);
    }
  };

  const handleQuickLoadToken = (tok: string) => {
    setSearchToken(tok);
    setActiveGrievance(SAMPLE_GRIEVANCES[tok]);
    setGrievanceNotFound(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] dark:bg-[#07080F] text-[#333333] dark:text-[#CBD5E1] flex flex-col font-sans transition-colors duration-150">
      
      {/* ========================================================================= */}
      {/* 1. TOP UTILITY STRIP (Helpline, Language, Font Size)                      */}
      {/* ========================================================================= */}
      <div className="bg-[#071A32] text-white text-[11px] px-4 py-1.5 border-b border-white/10 flex-shrink-0">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          
          {/* Left: Emergency Helpline & Official Email */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-200">
              <Phone className="w-3 h-3 text-amber-400" />
              <span>{t("utility.helpline")}: <strong>7595093196</strong> / <strong>6202346942</strong></span>
            </span>
            <span className="text-white/30 hidden md:inline">|</span>
            <span className="text-slate-300 hidden md:inline">{t("utility.email")}</span>
          </div>

          {/* Right: Functional Language Switcher, Accessibility Font Size, Theme */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-300">
              <button 
                onClick={() => setLanguage('en')}
                className={`px-1 transition-colors ${language === 'en' ? 'text-white font-bold underline' : 'text-slate-300 hover:text-white'}`}
                aria-label="Switch to English"
              >
                English
              </button>
              <span className="text-white/40">|</span>
              <button 
                onClick={() => setLanguage('hi')}
                className={`px-1 font-devanagari transition-colors ${language === 'hi' ? 'text-white font-bold underline' : 'text-slate-300 hover:text-white'}`}
                aria-label="Switch to Hindi"
              >
                हिन्दी
              </button>
            </div>
            <span className="text-white/30">|</span>
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <button 
                onClick={() => setTextSize('sm')}
                className={`px-1.5 py-0.5 rounded-none font-bold cursor-pointer transition-colors ${textSize === 'sm' ? 'bg-white/30 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                aria-label="Decrease text size"
              >
                A-
              </button>
              <button 
                onClick={() => setTextSize('base')}
                className={`px-1.5 py-0.5 rounded-none font-bold cursor-pointer transition-colors ${textSize === 'base' ? 'bg-white/30 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                aria-label="Default text size"
              >
                A
              </button>
              <button 
                onClick={() => setTextSize('lg')}
                className={`px-1.5 py-0.5 rounded-none font-bold cursor-pointer transition-colors ${textSize === 'lg' ? 'bg-white/30 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                aria-label="Increase text size"
              >
                A+
              </button>
            </div>
            <span className="text-white/30">|</span>
            <ThemeToggle variant="icon" className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !rounded-none" />
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN CALA AUTHORITY BRANDING HEADER (Section 0 Compliance)             */}
      {/* ========================================================================= */}
      <header className="bg-[#0B2E59] text-white px-4 py-3 sm:px-8 border-b border-[#0A2647] flex-shrink-0">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          
          {/* Left: CALA Generic Administrative Seal + Bilingual Title */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <CalaSealLogo size={46} className="w-11 h-11 flex-shrink-0 drop-shadow-xs" variant="light" />

            <div className="flex flex-col">
              <span className="font-devanagari font-bold text-sm sm:text-base text-white/95 leading-tight">
                {t("brand.title_hi")}
              </span>
              <span className="font-bold text-sm sm:text-base text-white leading-tight">
                {t("brand.title_en")}
              </span>
              <span className="text-xs text-amber-300 font-semibold tracking-wide mt-0.5">
                {t("brand.subline")}
              </span>
            </div>
          </Link>

          {/* Right: CALA Directorate Program Mark */}
          <DigitalCorridorMark />

        </div>
      </header>

      {/* Clean Authority Hairline Rule */}
      <div className="h-[2px] w-full bg-[#0B5FA5] flex-shrink-0" />

      {/* ========================================================================= */}
      {/* 3. OFFICIAL BULLETIN TICKER STRIP                                         */}
      {/* ========================================================================= */}
      <div className="bg-[#EBF3FC] dark:bg-[#0A1A2E] text-xs border-b border-[#D0E2F2] dark:border-sky-950 px-4 py-1.5 flex items-center gap-3 overflow-hidden">
        <span className="bg-[#B32424] text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-none flex-shrink-0 flex items-center gap-1">
          <Bell className="w-3 h-3" />
          <span>{t("ticker.heading")}</span>
        </span>
        <div className="overflow-x-auto whitespace-nowrap text-[#14213D] dark:text-slate-200 text-[11px] font-medium no-scrollbar">
          <span className="font-bold text-[#0B2E59] dark:text-sky-300">{t("ticker.item1")}</span> &nbsp;&bull;&nbsp; 
          <span className="font-bold text-[#1E7E34] dark:text-emerald-400">{t("ticker.item2")}</span> &nbsp;&bull;&nbsp; 
          <span className="font-bold text-[#0B2E59] dark:text-sky-300">{t("ticker.item3")}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. HORIZONTAL NAVY NAVIGATION BAR (Section 4 & 8)                         */}
      {/* ========================================================================= */}
      <nav className="bg-[#123C6B] text-white text-xs font-semibold px-4 sm:px-8 border-b border-[#0A2647] sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between overflow-x-auto no-scrollbar">
          <div className="flex items-center">
            <a href="#overview" className="px-4 py-2.5 hover:bg-[#2F6FB0] transition-colors whitespace-nowrap">
              {t("nav.home")}
            </a>
            <a href="#overview" className="px-4 py-2.5 hover:bg-[#2F6FB0] transition-colors whitespace-nowrap">
              {t("nav.register")}
            </a>
            <a href="#gazette-search" className="px-4 py-2.5 hover:bg-[#2F6FB0] transition-colors whitespace-nowrap">
              {t("nav.statutory")}
            </a>
            <a href="#calculator" className="px-4 py-2.5 hover:bg-[#2F6FB0] transition-colors whitespace-nowrap">
              {t("nav.awards")}
            </a>
            <Link href="/reports" className="px-4 py-2.5 hover:bg-[#2F6FB0] transition-colors whitespace-nowrap">
              {t("nav.mis")}
            </Link>
            <a href="#track-grievance" className="px-4 py-2.5 hover:bg-[#2F6FB0] transition-colors whitespace-nowrap">
              {t("nav.grievance")}
            </a>
            <a href="#login-card" className="px-4 py-2.5 bg-[#2F6FB0] text-white font-bold transition-colors whitespace-nowrap">
              {t("nav.officer_login")}
            </a>
          </div>

          <a 
            href="#portals" 
            className="px-4 py-2.5 bg-[#0B2E59] hover:bg-[#071A32] text-amber-300 font-bold transition-colors whitespace-nowrap border-l border-white/20 hidden md:flex items-center gap-1.5"
          >
            <Landmark className="w-3.5 h-3.5 text-amber-400" />
            <span>{t("nav.portals")}</span>
          </a>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 5. HERO TWO-COLUMN COMMAND LAYOUT (Target Image 2 / Section 8)            */}
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

            {/* 4 Stat Tiles Flush with Vertical Dividers (Item 16) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#DCE2E8] dark:border-white/10 divide-x divide-[#DCE2E8] dark:divide-white/10 bg-white dark:bg-[#0B1220]">
              <div className="py-3 px-4">
                <div className="text-2xl font-bold text-[#14213D] dark:text-white tracking-tight">3,748</div>
                <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-bold tracking-wider mt-1">{t("kpi.active_projects")}</div>
                <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-0.5">{t("kpi.active_projects_sub")}</div>
              </div>
              <div className="py-3 px-4">
                <div className="text-2xl font-bold text-[#0B5FA5] dark:text-sky-400 tracking-tight">48,210 Ha</div>
                <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-bold tracking-wider mt-1">{t("kpi.area_acquired")}</div>
                <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-0.5">{t("kpi.area_acquired_sub")}</div>
              </div>
              <div className="py-3 px-4">
                <div className="text-2xl font-bold text-[#1E7E34] dark:text-emerald-400 tracking-tight">₹ 18,420 Cr</div>
                <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-bold tracking-wider mt-1">{t("kpi.compensation")}</div>
                <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-0.5">{t("kpi.compensation_sub")}</div>
              </div>
              <div className="py-3 px-4">
                <div className="text-2xl font-bold text-[#14213D] dark:text-white tracking-tight">342</div>
                <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-bold tracking-wider mt-1">{t("kpi.pending_notices")}</div>
                <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-0.5">{t("kpi.pending_notices_sub")}</div>
              </div>
            </div>

            {/* Interactive Corridor GIS Map (Item 9: Light Basemap Style) */}
            <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-[#DCE2E8] dark:border-white/10 pb-2">
                <div className="font-bold text-xs uppercase tracking-wide text-[#14213D] dark:text-white flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#0B5FA5]" />
                  <span>Interactive GIS Corridor Map &amp; Cadastral Alignments</span>
                </div>
                <span className="text-[11px] text-[#5A6A80] dark:text-slate-400 font-mono">Standard Carto Light Basemap</span>
              </div>
              <PortfolioMap projects={MOCK_GOVERNMENT_PROJECTS} />
            </div>

            {/* Government Data Table (Item 6: Classic Bordered Table) */}
            <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-[#DCE2E8] dark:border-white/10 pb-2">
                <div className="font-bold text-xs uppercase tracking-wide text-[#14213D] dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0B5FA5]" />
                  <span>Government Project Portfolio &bull; National Linear Corridors</span>
                </div>
                <Link href="/projects" className="text-xs font-bold text-[#0B5FA5] hover:underline flex items-center gap-1">
                  <span>View Full Directory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <PortfolioTable projects={MOCK_GOVERNMENT_PROJECTS} />
            </div>

          </div>

          {/* RIGHT COLUMN (35% / 4 Cols): Officer Login Card (Section 8) */}
          <div className="lg:col-span-4 space-y-4">
            
            <div id="login-card" className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 shadow-xs">
              <div className="bg-[#0B2E59] text-white px-4 py-3 border-b border-[#0A2647] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold font-devanagari text-slate-200">अधिकारी लॉगिन</div>
                  <div className="text-sm font-bold tracking-tight">Officer Authentication Gateway</div>
                </div>
                <Lock className="w-4 h-4 text-amber-300" />
              </div>

              <form onSubmit={handleOfficerSignIn} className="p-4 space-y-3.5">
                {loginError && (
                  <div className="p-2.5 text-xs text-[#B32424] bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-900">
                    {loginError}
                  </div>
                )}
                {loginSuccess && (
                  <div className="p-2.5 text-xs text-[#1E7E34] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
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
                    className="w-full text-xs p-2.5 bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white rounded-none focus:outline-none focus:border-[#0B5FA5]"
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
                    className="w-full text-xs p-2.5 bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white rounded-none focus:outline-none focus:border-[#0B5FA5]"
                  />
                </div>

                {/* CAPTCHA block */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14213D] dark:text-slate-300 mb-1">
                    Security Code / CAPTCHA
                  </label>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="px-3 py-1.5 bg-[#F1F4F7] dark:bg-white/10 border border-[#CBD5E1] dark:border-slate-700 font-mono font-bold text-sm tracking-widest text-[#0B2E59] dark:text-sky-300 select-none">
                      {captchaCode}
                    </div>
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="p-2 border border-[#CBD5E1] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 cursor-pointer"
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
                    className="w-full text-xs p-2 bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white rounded-none focus:outline-none focus:border-[#0B5FA5]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 px-4 bg-[#0B2E59] hover:bg-[#0A2647] text-white font-bold text-xs rounded-none transition-colors cursor-pointer"
                >
                  {loginLoading ? "Verifying Credentials..." : t("btn.sign_in")}
                </button>

                <button
                  type="button"
                  onClick={handleInstantDemoLogin}
                  className="w-full py-2 px-3 bg-[#EBF3FA] hover:bg-[#D9EAF7] text-[#0B2E59] border border-[#0B5FA5] font-bold text-xs rounded-none transition-colors cursor-pointer"
                >
                  {t("btn.demo_login")}
                </button>
              </form>

              {/* Portals alternative links below login card (Item 8) */}
              <div className="p-3.5 bg-[#F8FAFC] dark:bg-white/5 border-t border-[#DCE2E8] dark:border-white/10 space-y-2 text-xs">
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

            {/* Quick Public Services Box */}
            <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 p-4 space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#14213D] dark:text-slate-300 border-b border-[#DCE2E8] dark:border-white/10 pb-1.5">
                Citizen Public Services
              </div>
              <div className="space-y-1.5 text-xs">
                <a
                  href="#gazette-search"
                  className="p-2 bg-[#F8FAFC] dark:bg-white/5 border border-[#CBD5E1] dark:border-slate-800 hover:border-[#0B5FA5] text-[#0B2E59] dark:text-sky-300 font-semibold flex items-center justify-between rounded-none transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-[#0B5FA5]" />
                    <span>Search Statutory Gazettes</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <a
                  href="#track-grievance"
                  className="p-2 bg-[#F8FAFC] dark:bg-white/5 border border-[#CBD5E1] dark:border-slate-800 hover:border-[#0B5FA5] text-[#14213D] dark:text-white font-semibold flex items-center justify-between rounded-none transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#0B5FA5]" />
                    <span>Track Grievance Status</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <a
                  href="#calculator"
                  className="p-2 bg-[#F8FAFC] dark:bg-white/5 border border-[#CBD5E1] dark:border-slate-800 hover:border-[#1E7E34] text-[#1E7E34] dark:text-emerald-400 font-semibold flex items-center justify-between rounded-none transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-[#1E7E34]" />
                    <span>Compensation Estimator</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. DEFINITIVE STAKEHOLDER PORTAL GATEWAYS DIRECTORY                       */}
      {/* ========================================================================= */}
      <section id="portals" className="max-w-[1440px] mx-auto w-full p-4 sm:p-8 space-y-6">
        
        <div className="border-b border-[#DCE2E8] dark:border-white/10 pb-2">
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#0B5FA5] dark:text-sky-400">
            CENTRAL AUTHENTICATION DIRECTORY
          </div>
          <h2 className="text-xl font-bold text-[#14213D] dark:text-white flex items-center gap-2 mt-0.5">
            <Landmark className="w-5 h-5 text-[#0B2E59] dark:text-sky-400" />
            <span>आधिकारिक हितधारक प्रवेश द्वार / Official Stakeholder Portal Gateways</span>
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
            Single definitive access gateways providing strict role-based isolation between Central Authorities, Field Inspectors, and Citizen Claimants.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Gateway 1: CALA Console */}
          <div className="bg-white dark:bg-[#0A1220] border-2 border-[#0B2E59] dark:border-sky-600 rounded-none p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#DCE2E8] dark:border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#0B2E59] text-white flex items-center justify-center font-bold text-xs rounded-none">
                    01
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold uppercase text-[#0B5FA5] dark:text-sky-400 block">
                      EXECUTIVE LEVEL
                    </span>
                    <h3 className="text-sm font-bold text-[#14213D] dark:text-white">
                      CALA Operations Console
                    </h3>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-[#0B2E59] dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                  DESKTOP
                </span>
              </div>

              <div className="text-xs text-[#475569] dark:text-slate-300 space-y-1">
                <div className="font-semibold text-[#14213D] dark:text-white">Authorized Users:</div>
                <p className="text-[11px] leading-relaxed">
                  Competent Authorities for Land Acquisition (CALA), Special Land Acquisition Officers (SLAO), District Revenue Collectors, and NHAI Project Directors.
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-white/5 border-l-2 border-[#0B2E59] text-[11px] text-[#475569] dark:text-slate-300 space-y-1">
                <div className="font-bold text-[#14213D] dark:text-white">Core Administrative Powers:</div>
                <ul className="space-y-0.5 list-disc pl-4">
                  <li>Section 3A to 3H Gazette Lifecycle Management</li>
                  <li>Cadastral Right-of-Way Contiguity Analysis</li>
                  <li>First Schedule RFCTLARR 2013 Award Approvals</li>
                  <li>Citizen Grievance Adjudication &amp; Hearings</li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DCE2E8] dark:border-white/10">
              <Link
                href="/login"
                className="w-full bg-[#0B2E59] hover:bg-[#071A32] text-white py-2.5 px-3 rounded-none font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Proceed to CALA Officer Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Gateway 2: Field Officer Mobile App */}
          <div className="bg-white dark:bg-[#0A1220] border-2 border-[#1E7E34] dark:border-emerald-600 rounded-none p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#DCE2E8] dark:border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#1E7E34] text-white flex items-center justify-center font-bold text-xs rounded-none">
                    02
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold uppercase text-[#1E7E34] dark:text-emerald-400 block">
                      GROUND INSPECTION
                    </span>
                    <h3 className="text-sm font-bold text-[#14213D] dark:text-white">
                      Field Officer Mobile App
                    </h3>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  MOBILE PWA
                </span>
              </div>

              <div className="text-xs text-[#475569] dark:text-slate-300 space-y-1">
                <div className="font-semibold text-[#14213D] dark:text-white">Authorized Users:</div>
                <p className="text-[11px] leading-relaxed">
                  Revenue Patwaris, Amin, Revenue Inspectors (RI), and official GPS Cadastral Survey Teams operating in highway alignment zones.
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-white/5 border-l-2 border-[#1E7E34] text-[11px] text-[#475569] dark:text-slate-300 space-y-1">
                <div className="font-bold text-[#14213D] dark:text-white">Field Inspection Tools:</div>
                <ul className="space-y-0.5 list-disc pl-4">
                  <li>GPS-Demarcated Ground Boundary Pegging</li>
                  <li>Geotagged Camera Photos with Watermark</li>
                  <li>Tree, Crop &amp; Structural Valuation Surveys</li>
                  <li>Offline Data Cache with Automated Cloud Sync</li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DCE2E8] dark:border-white/10">
              <Link
                href="/field/login"
                className="w-full bg-[#1E7E34] hover:bg-[#166329] text-white py-2.5 px-3 rounded-none font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Launch Field Officer Mobile App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Gateway 3: Citizen Landowner Portal */}
          <div className="bg-white dark:bg-[#0A1220] border-2 border-[#B36B00] dark:border-amber-600 rounded-none p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#DCE2E8] dark:border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#B36B00] text-white flex items-center justify-center font-bold text-xs rounded-none">
                    03
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold uppercase text-[#B36B00] dark:text-amber-400 block">
                      CITIZEN INTERFACE
                    </span>
                    <h3 className="text-sm font-bold text-[#14213D] dark:text-white">
                      Bhumi Samvaad Citizen Portal
                    </h3>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-[#B36B00] dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  PUBLIC ACCESS
                </span>
              </div>

              <div className="text-xs text-[#475569] dark:text-slate-300 space-y-1">
                <div className="font-semibold text-[#14213D] dark:text-white">Authorized Users:</div>
                <p className="text-[11px] leading-relaxed">
                  Affected Landowners, Farmers, Titleholders, Joint Khatedars, and Nominees under Section 3D gazette notifications.
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-white/5 border-l-2 border-[#B36B00] text-[11px] text-[#475569] dark:text-slate-300 space-y-1">
                <div className="font-bold text-[#14213D] dark:text-white">Citizen Rights &amp; Services:</div>
                <ul className="space-y-0.5 list-disc pl-4">
                  <li>Instant Khasra / Survey Number Status Verification</li>
                  <li>Itemized Statutory Compensation Award Records</li>
                  <li>Online Section 3C Objection Filing &amp; Evidence</li>
                  <li>Direct Benefit Transfer (DBT) Bank Deposit Tracking</li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DCE2E8] dark:border-white/10">
              <Link
                href="/landowner/login"
                className="w-full bg-[#B36B00] hover:bg-[#8F5500] text-white py-2.5 px-3 rounded-none font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Access Citizen Grievance Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 8. PUBLIC CITIZEN SERVICES: GAZETTE SEARCH & GRIEVANCE TRACKER            */}
      {/* ========================================================================= */}
      <section className="bg-white dark:bg-[#0B1220] border-y border-[#DCE2E8] dark:border-white/10 py-8 px-4 sm:px-8">
        <div className="max-w-[1440px] mx-auto space-y-8">
          
          {/* Section A: Public Gazette Notification Search */}
          <div id="gazette-search" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DCE2E8] dark:border-white/10 pb-2">
              <div>
                <h2 className="text-xl font-bold text-[#14213D] dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#0B2E59] dark:text-sky-400" />
                  <span>Public Gazette Notification Search / ई-राजपत्र खोज</span>
                </h2>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                  Search statutory land acquisition notifications published in The Gazette of India under Sections 3A, 3D, and 3G of the National Highways Act, 1956.
                </p>
              </div>

              <span className="text-[11px] font-mono text-[#0B5FA5] dark:text-sky-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-none border border-slate-300 dark:border-slate-700 self-start sm:self-auto">
                {filteredGazettes.length} Notifications Found
              </span>
            </div>

            {/* Filter Controls Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50 dark:bg-white/5 p-3 rounded-none border border-[#CBD5E1] dark:border-slate-800 text-xs">
              
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-[#14213D] dark:text-slate-300 mb-1">
                  Corridor / Project Filter
                </label>
                <select
                  value={gazetteCorridorFilter}
                  onChange={(e) => setGazetteCorridorFilter(e.target.value)}
                  className="input w-full bg-white dark:bg-[#07080F] border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white text-xs py-1.5 rounded-none"
                >
                  <option value="ALL">All National Highway Corridors</option>
                  <option value="Delhi-Mumbai">Delhi-Mumbai Expressway (NH-148N)</option>
                  <option value="Varanasi-Kolkata">Varanasi-Kolkata Economic Corridor (NH-319B)</option>
                  <option value="Bengaluru-Chennai">Bengaluru-Chennai Expressway (NE-7)</option>
                  <option value="Amritsar-Jamnagar">Amritsar-Jamnagar Economic Corridor (NH-754)</option>
                  <option value="NH-44">NH-44 Corridor Expansion</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-[#14213D] dark:text-slate-300 mb-1">
                  Statutory Section
                </label>
                <select
                  value={gazetteSectionFilter}
                  onChange={(e) => setGazetteSectionFilter(e.target.value)}
                  className="input w-full bg-white dark:bg-[#07080F] border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white text-xs py-1.5 rounded-none"
                >
                  <option value="ALL">All Statutory Stages</option>
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
                    value={gazetteSearchQuery}
                    onChange={(e) => setGazetteSearchQuery(e.target.value)}
                    placeholder="e.g. Dausa, S.O. 1428, Rajasthan..."
                    className="input w-full pl-8 bg-white dark:bg-[#07080F] border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white text-xs py-1.5 rounded-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

            </div>

            {/* Gazette Search Results Table */}
            <div className="overflow-x-auto border border-[#CBD5E1] dark:border-slate-800 rounded-none">
              <table className="gov-table dark:border-white/10 w-full text-xs">
                <thead className="bg-[#0B2E59] text-white">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Gazette S.O. Ref</th>
                    <th className="py-2.5 px-3 text-left">Highway Project / Corridor</th>
                    <th className="py-2.5 px-3 text-left">Statutory Stage</th>
                    <th className="py-2.5 px-3 text-left">District / State</th>
                    <th className="py-2.5 px-3 text-center">Publication Date</th>
                    <th className="py-2.5 px-3 text-center">Villages</th>
                    <th className="py-2.5 px-3 text-left">Statutory Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE2E8] dark:divide-white/10 bg-white dark:bg-[#07080F]">
                  {filteredGazettes.map((g, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-[#0B5FA5] dark:text-sky-400">
                        {g.soNumber}
                      </td>
                      <td className="py-2 px-3 font-medium text-[#14213D] dark:text-white">
                        {g.corridor}
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-bold text-[#0B2E59] dark:text-sky-300">
                          {g.section}
                        </span>
                        <div className="text-[10px] text-[#64748B] dark:text-slate-400">
                          {g.sectionTitle}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-[#333333] dark:text-slate-300">
                        {g.district}, {g.state}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-[11px]">
                        {g.date}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold">
                        {g.villagesCount}
                      </td>
                      <td className="py-2 px-3">
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
                      <td className="py-2 px-3 text-right">
                        <a
                          href="#track-grievance"
                          className="text-[#0B5FA5] dark:text-sky-400 hover:underline font-semibold text-[11px] inline-flex items-center gap-1"
                        >
                          <span>Track Grievance / Parcels</span>
                          <ChevronRight className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                  {filteredGazettes.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-slate-500 text-xs">
                        No official gazette notices found matching your query criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section B: Public Grievance Token Tracker */}
          <div id="track-grievance" className="space-y-4 pt-6 border-t border-[#DCE2E8] dark:border-white/10">
            <div className="border-b border-[#DCE2E8] dark:border-white/10 pb-2">
              <h2 className="text-xl font-bold text-[#14213D] dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#B36B00] dark:text-amber-400" />
                <span>Track Citizen Grievance &amp; Claim Token / शिकायत स्थिति ट्रैकर</span>
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                Real-time tracking of land valuation disputes, boundary demarcation objections, and Direct Benefit Transfer (DBT) payment clearance.
              </p>
            </div>

            {/* Aggregate Metrics (Item 19) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 border border-[#DCE2E8] dark:border-white/10 divide-y sm:divide-y-0 sm:divide-x divide-[#DCE2E8] dark:divide-white/10 bg-white dark:bg-[#0A1220]">
              <div className="p-3.5">
                <div className="text-xl font-bold font-mono text-[#14213D] dark:text-white">1,284</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 mt-0.5">Total Registered / कुल दर्ज</div>
              </div>
              <div className="p-3.5">
                <div className="text-xl font-bold font-mono text-[#1E7E34] dark:text-emerald-400">1,042</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 mt-0.5">Resolved &amp; Closed / निस्तारित</div>
              </div>
              <div className="p-3.5">
                <div className="text-xl font-bold font-mono text-[#B36B00] dark:text-amber-400">242</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 mt-0.5">In Active Review / समीक्षा में</div>
              </div>
            </div>

            {/* Token Lookup Bar */}
            <form onSubmit={handleTrackGrievance} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  required
                  value={searchToken}
                  onChange={(e) => setSearchToken(e.target.value)}
                  placeholder="Enter Grievance Token (e.g. GRV-2025-0891)"
                  className="input w-full uppercase font-mono text-sm py-2.5 bg-white dark:bg-[#07080F] border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white rounded-none"
                />
              </div>

              <button
                type="submit"
                className="btn-primary py-2.5 px-6 font-bold text-xs uppercase tracking-wider rounded-none w-full sm:w-auto"
              >
                Track Status / स्थिति जांचें
              </button>
            </form>

            {/* Quick Demo Tokens */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#64748B] dark:text-slate-400 font-semibold text-[11px]">
                Try Sample Active Citizen Tokens:
              </span>
              <button
                type="button"
                onClick={() => handleQuickLoadToken("GRV-2025-0891")}
                className="font-mono text-[11px] px-2 py-0.5 rounded-none bg-slate-100 dark:bg-white/10 text-[#0B5FA5] dark:text-sky-300 hover:underline border border-slate-300 dark:border-slate-700"
              >
                GRV-2025-0891 (Tree Valuation)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLoadToken("GRV-2025-0142")}
                className="font-mono text-[11px] px-2 py-0.5 rounded-none bg-slate-100 dark:bg-white/10 text-[#0B5FA5] dark:text-sky-300 hover:underline border border-slate-300 dark:border-slate-700"
              >
                GRV-2025-0142 (Demarcation)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLoadToken("GRV-2025-0518")}
                className="font-mono text-[11px] px-2 py-0.5 rounded-none bg-slate-100 dark:bg-white/10 text-[#0B5FA5] dark:text-sky-300 hover:underline border border-slate-300 dark:border-slate-700"
              >
                GRV-2025-0518 (DBT Disbursed)
              </button>
            </div>

            {/* Grievance Result Card */}
            {activeGrievance && (
              <div className="bg-slate-50 dark:bg-white/5 border border-[#CBD5E1] dark:border-slate-800 rounded-none p-5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE2E8] dark:border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#0B5FA5] dark:text-sky-400 font-bold">
                      TOKEN: {activeGrievance.token}
                    </span>
                    <h3 className="text-base font-bold text-[#14213D] dark:text-white">
                      {activeGrievance.claimant}
                    </h3>
                    <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                      {activeGrievance.surveyNumber} · {activeGrievance.village} · {activeGrievance.corridor}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-none bg-[#EBF7EE] dark:bg-emerald-950/60 border border-[#BEE3C8] dark:border-emerald-800 text-[#1E7E34] dark:text-emerald-300 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{activeGrievance.status}</span>
                    </span>
                    <div className="text-[11px] font-mono text-[#64748B] dark:text-slate-400 mt-1">
                      Assigned CALA: {activeGrievance.officer}
                    </div>
                  </div>
                </div>

                {/* 5-Step Progress Timeline */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#14213D] dark:text-white">
                    Statutory Grievance Redressal Lifecycle
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                    {[
                      { step: 1, label: "1. Token Lodged", desc: "Citizen Registered" },
                      { step: 2, label: "2. Field Inspection", desc: "Patwari GPS Verified" },
                      { step: 3, label: "3. CALA Adjudication", desc: "Section 3C/3G Hearing" },
                      { step: 4, label: "4. Award Revision", desc: "Legal Endorsement" },
                      { step: 5, label: "5. DBT Settlement", desc: "Bank Account Deposit" }
                    ].map((st) => (
                      <div
                        key={st.step}
                        className={`p-2.5 rounded-none border ${
                          st.step <= activeGrievance.stage
                            ? "bg-white dark:bg-[#07080F] border-[#1E7E34] dark:border-emerald-500 text-[#1E7E34] dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-slate-800 text-slate-400"
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1">
                          {st.step <= activeGrievance.stage ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-none border border-current flex items-center justify-center text-[9px]">
                              {st.step}
                            </span>
                          )}
                          <span>{st.label}</span>
                        </div>
                        <div className="text-[10px] text-[#64748B] dark:text-slate-400 mt-0.5">
                          {st.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Audit Trail */}
                <div className="space-y-2 pt-2 border-t border-[#DCE2E8] dark:border-white/10">
                  <div className="text-xs font-bold text-[#14213D] dark:text-white">
                    Procedural History / प्रक्रिया विवरण
                  </div>

                  <div className="space-y-1.5">
                    {activeGrievance.history.map((h: any, i: number) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs">
                        <span className="font-mono text-[11px] text-[#64748B] dark:text-slate-400 w-24 flex-shrink-0">
                          {h.date}
                        </span>
                        <div className="flex-1 text-[#333333] dark:text-slate-300">
                          {h.event}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {grievanceNotFound && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-none text-xs text-[#B32424] dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Grievance Token not found in the national registry. Verify the token ID or log in to the Citizen Portal to file a new case.</span>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. STATUTORY RFCTLARR 2013 COMPENSATION ESTIMATOR                         */}
      {/* ========================================================================= */}
      <section id="calculator" className="max-w-[1440px] mx-auto w-full p-4 sm:p-8 space-y-6">
        
        <div className="border-b border-[#DCE2E8] dark:border-white/10 pb-2">
          <h2 className="text-xl font-bold text-[#14213D] dark:text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#1E7E34] dark:text-emerald-400" />
            <span>Indicative Statutory Compensation Estimator / मुआवजा गणक</span>
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
            Transparent calculation model pursuant to the First Schedule of the RFCTLARR Act, 2013 and Section 3G of the National Highways Act, 1956.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Input Controls Form */}
          <div className="lg:col-span-6 bg-white dark:bg-[#0A1220] border border-[#DCE2E8] dark:border-white/10 p-5 rounded-none space-y-4 shadow-none">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D] dark:text-slate-300 border-b border-[#DCE2E8] dark:border-white/10 pb-2">
              Parcel &amp; Location Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-[#14213D] dark:text-slate-200 mb-1">
                  Land Area in Square Metres (Sqm)
                </label>
                <input
                  type="number"
                  min="1"
                  value={calcAreaSqm}
                  onChange={(e) => setCalcAreaSqm(Number(e.target.value) || 0)}
                  className="input w-full font-mono bg-white dark:bg-[#07080F] border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white rounded-none"
                />
                <span className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1 block">
                  Approx. {(calcAreaSqm / 10000).toFixed(3)} Hectares ({(calcAreaSqm * 0.000247105).toFixed(2)} Acres)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14213D] dark:text-slate-200 mb-1">
                  Circle Rate / DLC Rate (₹ / Sqm)
                </label>
                <input
                  type="number"
                  min="1"
                  value={calcCircleRate}
                  onChange={(e) => setCalcCircleRate(Number(e.target.value) || 0)}
                  className="input w-full font-mono bg-white dark:bg-[#07080F] border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white rounded-none"
                />
                <span className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1 block">
                  As recorded in Sub-Registrar Gazette
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <label className="block text-xs font-bold text-[#14213D] dark:text-slate-200 mb-1">
                  Location Classification
                </label>
                <select
                  value={calcLocationType}
                  onChange={(e) => setCalcLocationType(e.target.value as any)}
                  className="input w-full bg-white dark:bg-[#07080F] border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white rounded-none"
                >
                  <option value="RURAL">Rural Area (Multiplier 1.5x - 2.0x applies)</option>
                  <option value="URBAN">Urban Area (Multiplier 1.0x applies)</option>
                </select>
              </div>

              {calcLocationType === "RURAL" && (
                <div>
                  <label className="block text-xs font-bold text-[#14213D] dark:text-slate-200 mb-1">
                    Rural Multiplier Factor (RFCTLARR Sec 26)
                  </label>
                  <select
                    value={calcRuralMultiplier}
                    onChange={(e) => setCalcRuralMultiplier(Number(e.target.value))}
                    className="input w-full font-mono bg-white dark:bg-[#07080F] border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white rounded-none"
                  >
                    <option value={1.5}>1.5x (Distance 0 to 10 km from urban limits)</option>
                    <option value={1.75}>1.75x (Distance 10 to 20 km from urban limits)</option>
                    <option value={2.0}>2.0x (Distance &gt; 20 km into rural territory)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-[#14213D] dark:text-slate-200 mb-1">
                Interest Duration (Months from Section 3A to Award)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={calcInterestMonths}
                onChange={(e) => setCalcInterestMonths(Number(e.target.value) || 0)}
                className="input w-full font-mono bg-white dark:bg-[#07080F] border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white rounded-none"
              />
              <span className="text-[10px] text-[#64748B] dark:text-slate-400 mt-1 block">
                12% per annum under Section 30(3) of RFCTLARR Act, 2013
              </span>
            </div>

          </div>

          {/* Statutory Breakdown Result Ledger */}
          <div className="lg:col-span-6 bg-white dark:bg-[#0A1220] border border-[#DCE2E8] dark:border-white/10 p-5 rounded-none space-y-4 shadow-none flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D] dark:text-slate-300 border-b border-[#DCE2E8] dark:border-white/10 pb-2 flex items-center justify-between">
                <span>Indicative Statutory Award Breakdown</span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">FIRST SCHEDULE</span>
              </h3>

              <div className="space-y-2 text-xs">
                
                {/* Line 1 */}
                <div className="flex items-center justify-between p-2 rounded-none bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="font-bold text-[#14213D] dark:text-white">Basic Market Value</span>
                    <div className="text-[10px] text-[#64748B] dark:text-slate-400">
                      {calcAreaSqm.toLocaleString()} sqm × ₹ {calcCircleRate.toLocaleString()}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-[#14213D] dark:text-white">
                    ₹ {calcBaseMarketValue.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Line 2 */}
                <div className="flex items-center justify-between p-2 rounded-none bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="font-bold text-[#14213D] dark:text-white">Multiplied Value (Factor: {calcEffectiveMultiplier}x)</span>
                    <div className="text-[10px] text-[#64748B] dark:text-slate-400">
                      Pursuant to Section 26(2) of RFCTLARR Act 2013
                    </div>
                  </div>
                  <span className="font-mono font-bold text-[#14213D] dark:text-white">
                    ₹ {calcMultipliedValue.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Line 3 */}
                <div className="flex items-center justify-between p-2 rounded-none bg-emerald-50/70 dark:bg-emerald-950/30 border-b-2 border-emerald-500">
                  <div>
                    <span className="font-bold text-[#1E7E34] dark:text-emerald-300">100% Mandatory Solatium</span>
                    <div className="text-[10px] text-[#1E7E34] dark:text-emerald-400">
                      Section 30(1) Statutory Solatium Allowance
                    </div>
                  </div>
                  <span className="font-mono font-bold text-[#1E7E34] dark:text-emerald-300">
                    + ₹ {calcSolatium.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Line 4 */}
                <div className="flex items-center justify-between p-2 rounded-none bg-blue-50/70 dark:bg-blue-950/30 border-b-2 border-blue-500">
                  <div>
                    <span className="font-bold text-[#0B5FA5] dark:text-sky-300">12% Additional Interest ({calcInterestMonths} Months)</span>
                    <div className="text-[10px] text-[#0B5FA5] dark:text-sky-400">
                      Section 30(3) Interest from Notification Date
                    </div>
                  </div>
                  <span className="font-mono font-bold text-[#0B5FA5] dark:text-sky-300">
                    + ₹ {calcAdditionalInterest.toLocaleString("en-IN")}
                  </span>
                </div>

              </div>

              {/* Grand Total Callout */}
              <div className="p-3.5 bg-[#0B2E59] text-white rounded-none flex items-center justify-between border-t-2 border-amber-400">
                <div>
                  <span className="text-[10px] font-mono text-amber-300 uppercase tracking-widest block">
                    TOTAL ESTIMATED COMPENSATION
                  </span>
                  <span className="text-xs text-slate-200">
                    Before Tree/Crop Assets &amp; R&amp;R Entitlements
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-white">
                  ₹ {calcTotalCompensation.toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-[#64748B] dark:text-slate-400 leading-tight italic pt-2">
              * Note: This calculation is indicative for citizen advisory. Final statutory award determinations are conducted by the Competent Authority for Land Acquisition (CALA) under Section 3G of the National Highways Act, 1956 following ground verification.
            </p>
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 10. NATIONAL HIGHWAY GIS CORRIDOR ALIGNMENT MAP                           */}
      {/* ========================================================================= */}
      <section id="map" className="border-t border-[#DCE2E8] dark:border-white/10 bg-white dark:bg-[#0A1220] py-8 px-4 sm:px-8">
        <div className="max-w-[1440px] mx-auto space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DCE2E8] dark:border-white/10 pb-2">
            <div>
              <h2 className="text-xl font-bold text-[#14213D] dark:text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-[#0B5FA5] dark:text-sky-400" />
                <span>National Highway Alignment &amp; Cadastral Contiguity Map</span>
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                Dynamic MapLibre GL cadastral visualization tracking 14 active priority national infrastructure expressways and economic corridors.
              </p>
            </div>

            <Link
              href="/projects/gis"
              className="bg-[#0B2E59] hover:bg-[#123C6B] text-white text-xs py-2 px-4 flex items-center gap-1.5 self-start sm:self-auto rounded-none transition-colors"
            >
              <span>Open Fullscreen GIS Viewer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-slate-100 dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-800 rounded-none p-2">
            <PortfolioMap projects={MOCK_GOVERNMENT_PROJECTS} />
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. STATUTORY MANDATE & CITIZEN CHARTER                                   */}
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
          
          <div className="bg-white dark:bg-[#0A1220] border border-[#DCE2E8] dark:border-white/10 p-4 rounded-none space-y-2 border-t-2 border-t-[#0B2E59]">
            <div className="font-bold text-[#0B2E59] dark:text-sky-300 text-sm flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Right to Fair Compensation</span>
            </div>
            <p className="text-[#64748B] dark:text-slate-400 leading-relaxed">
              Compensation is calculated on current market / circle rates with rural factor multipliers up to 2.0x, mandatory 100% Solatium, and 12% statutory interest, ensuring owners are generously compensated.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0A1220] border border-[#DCE2E8] dark:border-white/10 p-4 rounded-none space-y-2 border-t-2 border-t-[#0B5FA5]">
            <div className="font-bold text-[#0B2E59] dark:text-sky-300 text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>21-Day Objection Window</span>
            </div>
            <p className="text-[#64748B] dark:text-slate-400 leading-relaxed">
              Following Section 3A gazette notification, any person interested in the land has an absolute statutory right under Section 3C to object to the highway alignment and be heard in person by the CALA.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0A1220] border border-[#DCE2E8] dark:border-white/10 p-4 rounded-none space-y-2 border-t-2 border-t-[#1E7E34]">
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

      {/* ========================================================================= */}
      {/* 12. OFFICIAL CALA PROTOTYPE FOOTER                                        */}
      {/* ========================================================================= */}
      <footer className="bg-[#0A2647] text-white py-6 px-4 text-center text-xs border-t border-[#071A32] flex-shrink-0 space-y-3">
        <div className="max-w-[1440px] mx-auto space-y-2">
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-300 text-[11px] pb-2 border-b border-white/10">
            <a href="#overview" className="hover:underline">Home</a>
            <span>·</span>
            <a href="#portals" className="hover:underline">Portals Directory</a>
            <span>·</span>
            <a href="#gazette-search" className="hover:underline">Gazette Search</a>
            <span>·</span>
            <a href="#track-grievance" className="hover:underline">Track Grievance</a>
            <span>·</span>
            <a href="#calculator" className="hover:underline">Compensation Estimator</a>
            <span>·</span>
            <a href="#about" className="hover:underline">Citizen Charter</a>
            <span>·</span>
            <a href="#about" className="hover:underline">Website Policies</a>
            <span>·</span>
            <a href="#about" className="hover:underline">Right to Information (RTI)</a>
            <span>·</span>
            <a href="#about" className="hover:underline">Disclaimer</a>
            <span>·</span>
            <a href="#about" className="hover:underline">Terms of Use</a>
          </div>

          <p className="font-medium text-slate-200">
            Designed and Developed for CALA — Central Authority for Land Acquisition
          </p>
          <p className="text-[11px] text-slate-400">
            BHUMI Platform — Smart India Hackathon Prototype (SIH26016). Not an official government system.
          </p>
          <p className="text-[11px] text-slate-400">
            Emergency Helpline: <strong className="text-amber-300">7595093196</strong> / <strong className="text-amber-300">6202346942</strong> · Technical Support: <strong className="text-slate-200">support@bhumi.internal</strong>
          </p>
          <p className="text-[10px] text-slate-400 font-mono pt-1">
            BHUMI Portal Version 3.4.1 · Prototype Deployment (SIH26016)
          </p>
        </div>
      </footer>

    </div>
  );
}
