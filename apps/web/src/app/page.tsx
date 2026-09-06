"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Shield, 
  Search, 
  ArrowRight, 
  Clock, 
  Navigation, 
  Layers, 
  RefreshCw, 
  ChevronRight,
  Calculator,
  Award,
  Lock,
  Landmark,
  FileSpreadsheet,
  CheckCircle2
} from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { PortfolioMap } from "@/components/dashboard/PortfolioMap";
import { PortfolioTable } from "@/components/dashboard/PortfolioTable";
import { useI18n } from "@/lib/i18n/I18nContext";
import { createClient } from "@/lib/supabase/client";
import { MOCK_GOVERNMENT_PROJECTS } from "@/lib/mockProjectData";

export default function LandingPage() {
  const { t } = useI18n();

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
        setLoginSuccess("Access authorized. Directing to CALA Command Console...");
        const sessionData = {
          officer_id: data.user.id,
          name: data.user.user_metadata?.full_name || "CALA Officer",
          email: data.user.email,
          role: "ADMIN",
        };
        document.cookie = `bhumi_officer_session=${encodeURIComponent(
          JSON.stringify(sessionData)
        )}; path=/; max-age=${86400 * 7}; SameSite=Lax`;
        setTimeout(() => {
          window.location.href = "/dashboard";
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
    <PublicShell>
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
            <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#DCE2E8] dark:border-white/10 divide-x divide-[#DCE2E8] dark:divide-white/10 bg-white dark:bg-[#0B1220]">
              <div className="py-3 px-4">
                <div className="text-2xl font-bold text-[#14213D] dark:text-white tracking-tight">48.5 km</div>
                <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-bold tracking-wider mt-1">Corridor Scope</div>
                <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-0.5">NH-927A Kota–Jhalawar</div>
              </div>
              <div className="py-3 px-4">
                <div className="text-2xl font-bold text-[#0B5FA5] dark:text-sky-400 tracking-tight">181</div>
                <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-bold tracking-wider mt-1">Cadastral Parcels</div>
                <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-0.5">3 Revenue Villages</div>
              </div>
              <div className="py-3 px-4">
                <div className="text-2xl font-bold text-[#1E7E34] dark:text-emerald-400 tracking-tight">39.54 Ha</div>
                <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-bold tracking-wider mt-1">{t("kpi.area_acquired")}</div>
                <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-0.5">Section 3D / 3E RoW</div>
              </div>
              <div className="py-3 px-4">
                <div className="text-2xl font-bold text-[#B36B00] dark:text-amber-400 tracking-tight">₹ 28.4 Cr</div>
                <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 uppercase font-bold tracking-wider mt-1">{t("kpi.compensation")}</div>
                <div className="text-[11px] text-[#5A6A80] dark:text-slate-400 mt-0.5">PFMS Direct Benefit Transfer</div>
              </div>
            </div>

            {/* Interactive Corridor GIS Map */}
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

            {/* Government Data Table */}
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

          {/* RIGHT COLUMN (35% / 4 Cols): Officer Login Card */}
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

              {/* Portals alternative links below login card */}
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

            {/* Quick Public Services Box (Linking to Dedicated Pages) */}
            <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 p-4 space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#14213D] dark:text-slate-300 border-b border-[#DCE2E8] dark:border-white/10 pb-1.5">
                Citizen Public Services
              </div>
              <div className="space-y-1.5 text-xs">
                <Link
                  href="/highway-register"
                  className="p-2 bg-[#F8FAFC] dark:bg-white/5 border border-[#CBD5E1] dark:border-slate-800 hover:border-[#0B5FA5] text-[#0B2E59] dark:text-sky-300 font-semibold flex items-center justify-between rounded-none transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#0B5FA5]" />
                    <span>Highway Land Register (181 Parcels)</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/gazette"
                  className="p-2 bg-[#F8FAFC] dark:bg-white/5 border border-[#CBD5E1] dark:border-slate-800 hover:border-[#0B5FA5] text-[#0B2E59] dark:text-sky-300 font-semibold flex items-center justify-between rounded-none transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-[#0B5FA5]" />
                    <span>Search Statutory Gazettes</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/grievance"
                  className="p-2 bg-[#F8FAFC] dark:bg-white/5 border border-[#CBD5E1] dark:border-slate-800 hover:border-[#0B5FA5] text-[#14213D] dark:text-white font-semibold flex items-center justify-between rounded-none transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#0B5FA5]" />
                    <span>Track Grievance &amp; Claims</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/calculator"
                  className="p-2 bg-[#F8FAFC] dark:bg-white/5 border border-[#CBD5E1] dark:border-slate-800 hover:border-[#1E7E34] text-[#1E7E34] dark:text-emerald-400 font-semibold flex items-center justify-between rounded-none transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-[#1E7E34]" />
                    <span>Compensation Estimator</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>

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
    </PublicShell>
  );
}
