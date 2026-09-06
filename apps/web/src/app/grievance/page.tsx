"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PublicShell } from "@/components/layout/PublicShell";
import { useI18n } from "@/lib/i18n/I18nContext";
import { 
  Clock, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  FileText, 
  ShieldCheck, 
  UserCheck, 
  ChevronRight,
  ExternalLink 
} from "lucide-react";

interface GrievanceCase {
  token: string;
  claimant: string;
  surveyNumber: string;
  village: string;
  corridor: string;
  category: string;
  dateLodged: string;
  status: string;
  stage: number;
  officer: string;
  estimatedAward: string;
  history: Array<{ date: string; event: string; done: boolean }>;
}

const SAMPLE_GRIEVANCES: Record<string, GrievanceCase> = {
  "GRV-2026-0927": {
    token: "GRV-2026-0927",
    claimant: "Verified Khatedar (Khasra V02-KH-0001)",
    surveyNumber: "Survey No. V02-KH-0001",
    village: "Bardoli Khera, Tehsil Ramganj Mandi",
    corridor: "NH-927A Kota–Jhalawar Bypass Widening",
    category: "Agricultural Land Classification & Circle Rate Verification",
    dateLodged: "12 Feb 2026",
    status: "CALA Adjudication in Progress",
    stage: 3,
    officer: "CALA Officer, Kota Desk",
    estimatedAward: "₹ 14,80,000",
    history: [
      { date: "12 Feb 2026", event: "Grievance Token registered via Citizen Portal", done: true },
      { date: "18 Feb 2026", event: "Patwari Field GPS inspection completed & verified against revenue cadastre", done: true },
      { date: "25 Feb 2026", event: "Hearing scheduled before CALA under Section 3C/3G", done: true },
      { date: "Pending", event: "Final statutory award revision & supplementary compensation determination", done: false },
      { date: "Pending", event: "Direct Benefit Transfer (PFMS / Treasury) deposit to Bank Account", done: false }
    ]
  },
  "GRV-2025-0891": {
    token: "GRV-2025-0891",
    claimant: "Verified Citizen Landowner (Title Holder - Khasra 248/2)",
    surveyNumber: "Khasra No. 248/2",
    village: "Chandwas (V03), Tehsil Bandikui",
    corridor: "Delhi–Mumbai Expressway (NH-148N)",
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
    corridor: "Varanasi–Kolkata Economic Corridor (NH-319B)",
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
    corridor: "Bengaluru–Chennai Expressway (NE-7)",
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

export default function GrievanceTrackerPage() {
  const { t } = useI18n();

  const [searchToken, setSearchToken] = useState("");
  const [activeGrievance, setActiveGrievance] = useState<GrievanceCase | null>(null);
  const [grievanceNotFound, setGrievanceNotFound] = useState(false);

  const handleTrack = (tokenToFind?: string) => {
    const query = (tokenToFind || searchToken).trim().toUpperCase();
    if (!query) return;

    const found = SAMPLE_GRIEVANCES[query];
    if (found) {
      setActiveGrievance(found);
      setGrievanceNotFound(false);
    } else {
      setActiveGrievance(null);
      setGrievanceNotFound(true);
    }
  };

  const handleQuickLoad = (token: string) => {
    setSearchToken(token);
    handleTrack(token);
  };

  return (
    <PublicShell>
      <div className="max-w-[1440px] mx-auto w-full p-4 sm:p-8 space-y-6">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-none bg-[#B36B00] text-white uppercase">
              BHUMI SAMVAAD &bull; CITIZEN GRIEVANCE REDRESSAL
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#14213D] dark:text-white leading-tight">
            Track Citizen Grievance &amp; Claim Token / शिकायत स्थिति ट्रैकर
          </h1>
          <p className="text-xs text-[#5A6A80] dark:text-slate-400 mt-1">
            Statutory tracking of land valuation objections, ground boundary pegging disputes, and Direct Benefit Transfer (DBT) payment clearance.
          </p>
        </div>

        {/* Aggregate Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 border border-[#DCE2E8] dark:border-white/10 divide-y sm:divide-y-0 sm:divide-x divide-[#DCE2E8] dark:divide-white/10 bg-white dark:bg-[#0A1220]">
          <div className="p-4">
            <div className="text-2xl font-bold font-mono text-[#14213D] dark:text-white">1,284</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 mt-1">
              Total Registered / कुल दर्ज
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">
              Cumulative since corridor commencement
            </div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold font-mono text-[#1E7E34] dark:text-emerald-400">1,042</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 mt-1">
              Resolved &amp; Closed / निस्तारित
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">
              81.1% Redressal Clearance Ratio
            </div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold font-mono text-[#B36B00] dark:text-amber-400">242</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 mt-1">
              In Active Review / समीक्षा में
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">
              Under Section 3C/3G hearings
            </div>
          </div>
        </div>

        {/* Token Search Box */}
        <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 p-5 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrack();
            }}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <div className="relative flex-1 w-full">
              <input
                type="text"
                required
                value={searchToken}
                onChange={(e) => setSearchToken(e.target.value)}
                placeholder="Enter Grievance Token ID (e.g. GRV-2026-0927)"
                className="w-full uppercase font-mono text-sm p-2.5 bg-white dark:bg-[#07080F] border border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white rounded-none focus:outline-none focus:border-[#0B5FA5]"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 bg-[#0B2E59] hover:bg-[#0A2647] text-white font-bold text-xs uppercase tracking-wider rounded-none w-full sm:w-auto transition-colors cursor-pointer"
            >
              Track Status / स्थिति जांचें
            </button>
          </form>

          {/* Quick Demo Tokens */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            <span className="text-[#64748B] dark:text-slate-400 font-semibold text-[11px]">
              Sample Official Grievance Tokens:
            </span>
            <button
              type="button"
              onClick={() => handleQuickLoad("GRV-2026-0927")}
              className="font-mono text-[11px] px-2 py-1 rounded-none bg-slate-100 dark:bg-white/10 text-[#0B5FA5] dark:text-sky-300 hover:underline border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              GRV-2026-0927 (NH-927A Kota)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLoad("GRV-2025-0891")}
              className="font-mono text-[11px] px-2 py-1 rounded-none bg-slate-100 dark:bg-white/10 text-[#0B5FA5] dark:text-sky-300 hover:underline border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              GRV-2025-0891 (Tree Valuation)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLoad("GRV-2025-0142")}
              className="font-mono text-[11px] px-2 py-1 rounded-none bg-slate-100 dark:bg-white/10 text-[#0B5FA5] dark:text-sky-300 hover:underline border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              GRV-2025-0142 (Demarcation)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLoad("GRV-2025-0518")}
              className="font-mono text-[11px] px-2 py-1 rounded-none bg-slate-100 dark:bg-white/10 text-[#0B5FA5] dark:text-sky-300 hover:underline border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              GRV-2025-0518 (DBT Cleared)
            </button>
          </div>
        </div>

        {/* Empty State / Initial Instructions */}
        {!activeGrievance && !grievanceNotFound && (
          <div className="bg-white dark:bg-[#0A1220] border border-[#CBD5E1] dark:border-slate-800 rounded-none p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-none bg-[#EBF3FA] dark:bg-white/5 border border-[#0B5FA5]/30 mx-auto flex items-center justify-center text-[#0B5FA5] dark:text-sky-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#14213D] dark:text-white uppercase tracking-wider">
              Enter Grievance Token to Track Status
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              Please enter your 12-character statutory grievance token in the search box above (e.g., <span className="font-mono font-semibold text-[#0B5FA5] dark:text-sky-300">GRV-2026-0927</span>) or select one of the sample tokens to view case adjudication milestones, field verification reports, and DBT disbursal records.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#555555] dark:text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1E7E34]" />
                Section 3C Hearing Records
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1E7E34]" />
                Joint Measurement Survey (DGPS)
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1E7E34]" />
                PFMS Disbursal Authentication
              </span>
            </div>
          </div>
        )}

        {/* Grievance Result Card */}
        {activeGrievance && (
          <div className="bg-white dark:bg-[#0A1220] border border-[#CBD5E1] dark:border-slate-800 rounded-none p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE2E8] dark:border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#0B5FA5] dark:text-sky-400 font-bold">
                  OFFICIAL TOKEN: {activeGrievance.token}
                </span>
                <h2 className="text-base font-bold text-[#14213D] dark:text-white">
                  {activeGrievance.claimant}
                </h2>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                  {activeGrievance.surveyNumber} &bull; {activeGrievance.village} &bull; {activeGrievance.corridor}
                </p>
                <div className="text-xs text-[#14213D] dark:text-slate-200 mt-1 font-medium">
                  <strong>Subject:</strong> {activeGrievance.category}
                </div>
              </div>

              <div className="text-right flex flex-col items-start sm:items-end">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-none bg-[#EBF7EE] dark:bg-emerald-950/60 border border-[#BEE3C8] dark:border-emerald-800 text-[#1E7E34] dark:text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{activeGrievance.status}</span>
                </span>
                <div className="text-[11px] font-mono text-[#64748B] dark:text-slate-400 mt-1">
                  Desk: {activeGrievance.officer}
                </div>
                <div className="text-xs font-bold text-[#0B5FA5] dark:text-sky-400 mt-0.5">
                  Award Under Consideration: {activeGrievance.estimatedAward}
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
                        ? "bg-[#F0FDF4] dark:bg-emerald-950/20 border-[#1E7E34] dark:border-emerald-500 text-[#1E7E34] dark:text-emerald-400"
                        : "bg-slate-50 dark:bg-white/5 border-slate-300 dark:border-slate-800 text-slate-400"
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
                Procedural Record / प्रक्रिया विवरण
              </div>

              <div className="space-y-2">
                {activeGrievance.history.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs p-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800">
                    <span className="font-mono text-[11px] text-[#64748B] dark:text-slate-400 w-24 flex-shrink-0">
                      {h.date}
                    </span>
                    <div className="flex-1 text-[#333333] dark:text-slate-300 flex items-center gap-2">
                      {h.done ? (
                        <CheckCircle2 className="w-3 h-3 text-[#1E7E34] flex-shrink-0" />
                      ) : (
                        <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      )}
                      <span>{h.event}</span>
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

        {/* Bottom CTA to Citizen Portal */}
        <div className="bg-[#EBF3FA] dark:bg-white/5 border border-[#0B5FA5] dark:border-sky-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-[#0B2E59] dark:text-white uppercase tracking-wider">
              Need to lodge a new objection or compensation dispute?
            </h3>
            <p className="text-xs text-[#555555] dark:text-slate-300 mt-0.5">
              Authenticate via Aadhaar OTP on the dedicated Bhumi Samvaad Citizen Portal to submit supporting revenue records.
            </p>
          </div>
          <Link
            href="/landowner/login"
            className="px-4 py-2 bg-[#0B2E59] hover:bg-[#071A32] text-white text-xs font-bold rounded-none flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Proceed to Citizen Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </PublicShell>
  );
}
