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
  FileCheck2
} from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { PortfolioMap } from "@/components/dashboard/PortfolioMap";
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
    corridor: "NH-44 Srinagar-Kanyakumari Corridor Expansion",
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

// Sample Grievances for Public Token Tracker
const SAMPLE_GRIEVANCES: Record<string, any> = {
  "GRV-2025-0891": {
    token: "GRV-2025-0891",
    claimant: "Smt. Shanti Devi & Sh. Ram Charan",
    surveyNumber: "Khasra No. 248/2",
    village: "Chandwas (V03), Tehsil Bandikui",
    corridor: "Delhi-Mumbai Expressway (NH-148N)",
    category: "Valuation of 14 Fruit-Bearing Mango Trees",
    dateLodged: "14 Feb 2025",
    status: "CALA Legal Review in Progress",
    stage: 3,
    officer: "Sh. Rajesh Kumar (CALA Officer, Dausa)",
    estimatedAward: "₹ 18,40,000",
    history: [
      { date: "14 Feb 2025", event: "Grievance Token Generated via Bhumi Samvaad Citizen Portal", done: true },
      { date: "19 Feb 2025", event: "Field Officer (Patwari) Ground Inspection & Geotagged Tree Enumeration Completed", done: true },
      { date: "26 Feb 2025", event: "Horticulture Department Tree Valuation Schedule Submitted to CALA Desk", done: true },
      { date: "Pending", event: "Statutory Section 3G Supplementary Award Endorsement by CALA", done: false },
      { date: "Pending", event: "Direct Benefit Transfer (PFMS / Treasury) Disbursal to Bank Account", done: false }
    ]
  },
  "GRV-2025-0142": {
    token: "GRV-2025-0142",
    claimant: "Sh. Vikramaditya Singh",
    surveyNumber: "Khasra No. 104/1 & 104/2",
    village: "Mohania Rural, Tehsil Kaimur",
    corridor: "Varanasi-Kolkata Economic Corridor (NH-319B)",
    category: "Boundary Demarcation Discrepancy (45 sqm excess pegging)",
    dateLodged: "04 Feb 2025",
    status: "Field Verified & Rectified",
    stage: 4,
    officer: "Mohd. Aslam (Revenue Inspector, Kaimur)",
    estimatedAward: "₹ 24,90,000",
    history: [
      { date: "04 Feb 2025", event: "Objection lodged disputing highway alignment pegging", done: true },
      { date: "09 Feb 2025", event: "Joint Cadastral DGPS re-survey conducted with Landowner present", done: true },
      { date: "15 Feb 2025", event: "Right of Way boundaries adjusted by 4.2m to align with Revenue Map", done: true },
      { date: "24 Feb 2025", event: "Revised parcel area officially signed by Landowner & Patwari", done: true },
      { date: "02 Mar 2025", event: "Updated award schedule dispatched to SBI Treasury for DBT clearance", done: false }
    ]
  },
  "GRV-2025-0518": {
    token: "GRV-2025-0518",
    claimant: "Sh. Ananthakrishnan M.",
    surveyNumber: "Survey No. 78/3B",
    village: "Walajah Road, Tehsil Ranipet",
    corridor: "Bengaluru-Chennai Expressway (NE-7)",
    category: "Direct Benefit Transfer Account Validation Mismatch",
    dateLodged: "20 Jan 2025",
    status: "Award Disbursed via PFMS",
    stage: 5,
    officer: "Sh. K. V. Ramanathan (SLAO, Ranipet)",
    estimatedAward: "₹ 31,50,000",
    history: [
      { date: "20 Jan 2025", event: "Citizen submitted Aadhaar-NPCI mandate seeding update", done: true },
      { date: "25 Jan 2025", event: "Public Financial Management System (PFMS) pre-validation passed", done: true },
      { date: "30 Jan 2025", event: "CALA authorized statutory Section 3H deposit order", done: true },
      { date: "08 Feb 2025", event: "Reserve Bank of India e-Kuber NEFT transfer cleared to Indian Bank A/c", done: true },
      { date: "10 Feb 2025", event: "Possession Certificate Form G issued. Grievance closed satisfactorily", done: true }
    ]
  }
};

export default function PublicHomePage() {
  // Gazette Search State
  const [gazetteCorridorFilter, setGazetteCorridorFilter] = useState("ALL");
  const [gazetteSectionFilter, setGazetteSectionFilter] = useState("ALL");
  const [gazetteSearchQuery, setGazetteSearchQuery] = useState("");

  // Grievance Tracker State
  const [searchToken, setSearchToken] = useState("GRV-2025-0891");
  const [activeGrievance, setActiveGrievance] = useState<any>(SAMPLE_GRIEVANCES["GRV-2025-0891"]);
  const [grievanceNotFound, setGrievanceNotFound] = useState(false);

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
      {/* 1. TOP UTILITY STRIP (Strict Government Header)                           */}
      {/* ========================================================================= */}
      <div className="bg-[#071A32] text-white text-[11px] px-4 py-1.5 border-b border-white/10 flex-shrink-0">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          
          {/* Left: Emergency Helpline & Official Email */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-200">
              <Phone className="w-3 h-3 text-amber-400" />
              <span>Emergency Helpline: <strong>7595093196</strong> / <strong>6202346942</strong></span>
            </span>
            <span className="text-white/30 hidden md:inline">|</span>
            <span className="text-slate-300 hidden md:inline">helpdesk-bhumi@gov.in</span>
            <span className="text-white/30 hidden lg:inline">|</span>
            <span className="text-slate-300 hidden lg:inline">भारत सरकार | Government of India</span>
          </div>

          {/* Right: Language Switcher, Accessibility Font Size, Theme */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-300">
              <span className="text-white font-bold cursor-pointer hover:underline">English</span>
              <span className="text-white/40">|</span>
              <span className="text-slate-300 font-devanagari cursor-pointer hover:underline">हिन्दी</span>
            </div>
            <span className="text-white/30">|</span>
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <span className="px-1 py-0.5 rounded-none bg-white/10 hover:bg-white/20 cursor-pointer font-bold">A-</span>
              <span className="px-1 py-0.5 rounded-none bg-white/15 hover:bg-white/20 cursor-pointer font-bold">A</span>
              <span className="px-1 py-0.5 rounded-none bg-white/10 hover:bg-white/20 cursor-pointer font-bold">A+</span>
            </div>
            <span className="text-white/30">|</span>
            <ThemeToggle variant="icon" className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !rounded-none" />
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN MINISTRY BRANDING HEADER                                          */}
      {/* ========================================================================= */}
      <header className="bg-[#0B2E59] text-white px-4 py-3.5 sm:px-8 border-b border-[#0A2647] flex-shrink-0">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          
          {/* Left: State Lion Capital Emblem + Bilingual Ministry Name */}
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-12 h-14 flex-shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
                <rect x="12" y="64" width="40" height="4" rx="0" fill="#f8fafc" />
                <rect x="8" y="60" width="48" height="3" rx="0" fill="#e2e8f0" />
                <circle cx="32" cy="53" r="5.5" stroke="#f8fafc" strokeWidth="1.5" fill="none" />
                <circle cx="32" cy="53" r="1.5" fill="#f8fafc" />
                <line x1="32" y1="47.5" x2="32" y2="58.5" stroke="#f8fafc" strokeWidth="0.8" />
                <line x1="26.5" y1="53" x2="37.5" y2="53" stroke="#f8fafc" strokeWidth="0.8" />
                <line x1="28" y1="49" x2="36" y2="57" stroke="#f8fafc" strokeWidth="0.8" />
                <line x1="36" y1="49" x2="28" y2="57" stroke="#f8fafc" strokeWidth="0.8" />
                <rect x="14" y="52" width="6" height="3" fill="#cbd5e1" />
                <rect x="44" y="52" width="6" height="3" fill="#cbd5e1" />
                <rect x="10" y="46" width="44" height="4" fill="#f1f5f9" />
                <path d="M26 46 C26 38 27 28 32 20 C37 28 38 38 38 46 Z" fill="#f8fafc" />
                <path d="M28 20 C28 14 30 8 32 8 C34 8 36 14 36 20 Z" fill="#ffffff" />
                <circle cx="32" cy="14" r="2.5" fill="#0b2e59" opacity="0.2" />
                <path d="M16 46 C16 38 20 32 25 24 C23 20 21 15 23 11 C25 9 27 12 28 16 C25 24 26 34 26 46 Z" fill="#e2e8f0" />
                <path d="M48 46 C48 38 44 32 39 24 C41 20 43 15 41 11 C39 9 37 12 36 16 C39 24 38 34 38 46 Z" fill="#e2e8f0" />
                <circle cx="32" cy="5" r="1.5" fill="#f8fafc" />
              </svg>
            </div>

            <div className="flex flex-col">
              <span className="font-devanagari font-bold text-sm sm:text-base text-white/95 leading-tight">
                सड़क परिवहन और राजमार्ग मंत्रालय
              </span>
              <span className="font-bold text-sm sm:text-base text-white leading-tight">
                Ministry of Road Transport and Highways
              </span>
              <span className="text-xs text-amber-300 font-semibold tracking-wide mt-0.5">
                भूमि अधिग्रहण प्रबंधन प्रणाली - BHUMI · National Land Acquisition &amp; Management System
              </span>
            </div>
          </Link>

          {/* Right: Institutional Badges + Single Direct Officer Login Button */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <div className="text-[10px] uppercase font-mono tracking-widest text-slate-300">
                GOVERNMENT OF INDIA
              </div>
              <div className="text-xs font-bold text-white tracking-wide">
                PM GatiShakti National Master Plan
              </div>
            </div>

            <Link
              href="/login"
              className="bg-amber-400 hover:bg-amber-300 text-[#0B2E59] font-bold text-xs px-4 py-2 rounded-none transition-colors border border-amber-500 flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>अधिकारी लॉगिन / Officer Login</span>
            </Link>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. NATIONAL TRICOLOR RIBBON (3px)                                         */}
      {/* ========================================================================= */}
      <div className="flex h-[3px] w-full flex-shrink-0">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#128807]" />
      </div>

      {/* ========================================================================= */}
      {/* 4. OFFICIAL GOVERNMENT TICKER STRIP                                       */}
      {/* ========================================================================= */}
      <div className="bg-[#EBF3FC] dark:bg-[#0A1A2E] text-xs border-b border-[#D0E2F2] dark:border-sky-950 px-4 py-1.5 flex items-center gap-3 overflow-hidden">
        <span className="bg-[#B32424] text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-none flex-shrink-0 flex items-center gap-1">
          <Bell className="w-3 h-3" />
          <span>ताज़ा सूचनाएं / NOTICES</span>
        </span>
        <div className="overflow-x-auto whitespace-nowrap text-[#14213D] dark:text-slate-200 text-[11px] font-medium no-scrollbar">
          <span className="font-bold text-[#0B2E59] dark:text-sky-300">[GAZETTE S.O. 1428(E)]</span> Section 3D declared for Delhi-Mumbai Expressway (NH-148N) &nbsp;&bull;&nbsp; 
          <span className="font-bold text-[#1E7E34] dark:text-emerald-400">[DBT MANDATE]</span> Direct Benefit Transfer compensation clearance active for 14 corridors &nbsp;&bull;&nbsp; 
          <span className="font-bold text-[#B36B00] dark:text-amber-400">[HEARINGS]</span> Section 3C statutory objections window active for Kaimur &amp; Dausa districts.
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. HORIZONTAL STICKY NAVIGATION BAR (Pure Clean Navigation)              */}
      {/* ========================================================================= */}
      <nav className="bg-[#123C6B] text-white text-xs font-semibold px-4 sm:px-8 border-b border-[#0A2647] sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between overflow-x-auto no-scrollbar">
          <div className="flex items-center">
            <a href="#overview" className="px-4 py-2.5 hover:bg-[#2F6FB0] transition-colors whitespace-nowrap">
              National Overview
            </a>
            <a href="#portals" className="px-4 py-2.5 hover:bg-[#2F6FB0] transition-colors whitespace-nowrap">
              Stakeholder Portals Directory
            </a>
            <a href="#gazette-search" className="px-4 py-2.5 hover:bg-[#2F6FB0] transition-colors whitespace-nowrap">
              Gazette Notifications
            </a>
            <a href="#track-grievance" className="px-4 py-2.5 hover:bg-[#2F6FB0] transition-colors whitespace-nowrap">
              Track Grievance
            </a>
            <a href="#calculator" className="px-4 py-2.5 hover:bg-[#2F6FB0] transition-colors whitespace-nowrap">
              Compensation Estimator
            </a>
            <a href="#map" className="px-4 py-2.5 hover:bg-[#2F6FB0] transition-colors whitespace-nowrap">
              Corridor GIS Map
            </a>
            <a href="#about" className="px-4 py-2.5 hover:bg-[#2F6FB0] transition-colors whitespace-nowrap">
              Statutory Mandate
            </a>
          </div>

          <a 
            href="#portals" 
            className="px-4 py-2.5 bg-[#0B2E59] hover:bg-[#071A32] text-amber-300 font-bold transition-colors whitespace-nowrap border-l border-white/20 hidden md:flex items-center gap-1.5"
          >
            <Landmark className="w-3.5 h-3.5 text-amber-400" />
            <span>हितधारक पोर्टल / Portals Directory</span>
          </a>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 6. HERO SECTION & NATIONAL OPERATIONS OVERVIEW                           */}
      {/* ========================================================================= */}
      <section id="overview" className="border-b border-[#DCE2E8] dark:border-white/10 bg-white dark:bg-[#0A1220] py-8 px-4 sm:px-8">
        <div className="max-w-[1440px] mx-auto space-y-6">
          
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="max-w-3xl space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-none bg-[#0B2E59]/10 dark:bg-white/10 text-[#0B2E59] dark:text-sky-300 font-mono text-[11px] font-bold">
                <Shield className="w-3.5 h-3.5 text-[#0B2E59] dark:text-sky-400" />
                <span>MINISTRY OF ROAD TRANSPORT &amp; HIGHWAYS · GOI STATUTORY PORTAL</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14213D] dark:text-white leading-tight">
                National Land Acquisition &amp; Management System
              </h1>
              <p className="text-xs sm:text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
                Statutory digital decision support and monitoring platform governing the full lifecycle of linear infrastructure land acquisition under the <strong>National Highways Act, 1956</strong> and <strong>RFCTLARR Act, 2013</strong>. Unified coordination across the Ministry, National Highways Authority of India (NHAI), District CALAs, Revenue Surveyors, and Citizen Landowners.
              </p>
            </div>

            {/* Quick Citizen Jump Actions (Anchor links only, NO duplicate login buttons) */}
            <div className="p-4 bg-[#F8FAFC] dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-800 rounded-none space-y-2.5 min-w-[280px]">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 border-b border-[#CBD5E1] dark:border-slate-800 pb-1">
                Citizen Public Services / नागरिक सेवाएं
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                <a
                  href="#gazette-search"
                  className="px-3 py-1.5 bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-slate-700 hover:border-[#0B5FA5] text-[#0B2E59] dark:text-sky-300 font-bold flex items-center justify-between rounded-none transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-[#0B5FA5]" />
                    <span>Search Gazette Notices</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <a
                  href="#track-grievance"
                  className="px-3 py-1.5 bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-slate-700 hover:border-[#B36B00] text-[#14213D] dark:text-white font-bold flex items-center justify-between rounded-none transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#B36B00]" />
                    <span>Track Grievance Token</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <a
                  href="#calculator"
                  className="px-3 py-1.5 bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-slate-700 hover:border-[#1E7E34] text-[#1E7E34] dark:text-emerald-400 font-bold flex items-center justify-between rounded-none transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-[#1E7E34]" />
                    <span>Compensation Calculator</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <a
                  href="#map"
                  className="px-3 py-1.5 bg-white dark:bg-[#0B1220] border border-[#CBD5E1] dark:border-slate-700 hover:border-[#0B5FA5] text-[#0B5FA5] dark:text-sky-300 font-bold flex items-center justify-between rounded-none transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-[#0B5FA5]" />
                    <span>National Corridor GIS</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>

          {/* National Summary Ledger with Flat 2px Bottom Rules */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-[#DCE2E8] dark:border-white/10">
            
            {/* Metric 1 */}
            <div className="p-3 bg-transparent rounded-none border-b-2 border-[#0B2E59] dark:border-sky-500 space-y-0.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                Active Corridors
              </div>
              <div className="text-2xl font-black text-[#14213D] dark:text-white font-mono">
                14
              </div>
              <div className="text-[10px] text-[#0B5FA5] dark:text-sky-400 font-semibold">
                MoRTH / NHAI Projects
              </div>
            </div>

            {/* Metric 2 */}
            <div className="p-3 bg-transparent rounded-none border-b-2 border-[#1E7E34] dark:border-emerald-500 space-y-0.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                Land Acquired (Ha)
              </div>
              <div className="text-2xl font-black text-[#1E7E34] dark:text-emerald-400 font-mono">
                425,800
              </div>
              <div className="text-[10px] text-[#1E7E34] dark:text-emerald-400 font-semibold">
                Surveyed &amp; Demarcated
              </div>
            </div>

            {/* Metric 3 */}
            <div className="p-3 bg-transparent rounded-none border-b-2 border-[#0B5FA5] dark:border-blue-500 space-y-0.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                DBT Compensation
              </div>
              <div className="text-2xl font-black text-[#0B5FA5] dark:text-sky-300 font-mono">
                ₹ 1,842.50 Cr
              </div>
              <div className="text-[10px] text-[#0B5FA5] dark:text-sky-400 font-semibold">
                Disbursed to Bank A/cs
              </div>
            </div>

            {/* Metric 4 */}
            <div className="p-3 bg-transparent rounded-none border-b-2 border-[#128807] dark:border-green-500 space-y-0.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                DBT Success Rate
              </div>
              <div className="text-2xl font-black text-[#128807] dark:text-green-400 font-mono">
                94.6%
              </div>
              <div className="text-[10px] text-[#128807] dark:text-green-400 font-semibold">
                PFMS Aadhaar Seeded
              </div>
            </div>

            {/* Metric 5 */}
            <div className="p-3 bg-transparent rounded-none border-b-2 border-[#B36B00] dark:border-amber-500 space-y-0.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                Gazette Notices
              </div>
              <div className="text-2xl font-black text-[#B36B00] dark:text-amber-400 font-mono">
                28
              </div>
              <div className="text-[10px] text-[#B36B00] dark:text-amber-400 font-semibold">
                Active in Sec 3A/3D
              </div>
            </div>

            {/* Metric 6 */}
            <div className="p-3 bg-transparent rounded-none border-b-2 border-[#B32424] dark:border-rose-500 space-y-0.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                Grievance SLA
              </div>
              <div className="text-2xl font-black text-[#B32424] dark:text-rose-400 font-mono">
                30 Days
              </div>
              <div className="text-[10px] text-[#B32424] dark:text-rose-400 font-semibold">
                Mandatory Legal Window
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
      {/* 12. OFFICIAL NIC GOVERNMENT FOOTER                                        */}
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
            Designed, Developed and Hosted by National Informatics Centre (NIC), Ministry of Electronics &amp; Information Technology, Government of India
          </p>
          <p className="text-[11px] text-slate-400">
            Content Owned and Maintained by Ministry of Road Transport &amp; Highways (MoRTH), Government of India
          </p>
          <p className="text-[11px] text-slate-400">
            Emergency Helpline: <strong className="text-amber-300">7595093196</strong> / <strong className="text-amber-300">6202346942</strong> · Helpdesk: <strong className="text-slate-200">helpdesk-bhumi@gov.in</strong>
          </p>
          <p className="text-[10px] text-slate-400 font-mono pt-1">
            BHUMI Portal Version 3.4.1 · ISO 27001 Certified · Compliance with Guidelines for Indian Government Websites (GIGW)
          </p>
        </div>
      </footer>

    </div>
  );
}
