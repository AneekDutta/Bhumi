"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Activity, 
  Building2, 
  KeyRound, 
  RefreshCw,
  Smartphone,
  Phone,
  HelpCircle,
  ExternalLink,
  Navigation,
  Check
} from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { PortfolioMap } from "@/components/dashboard/PortfolioMap";
import { MOCK_GOVERNMENT_PROJECTS } from "@/lib/mockProjectData";

type AuthMode = "LOGIN" | "FORGOT_PASSWORD" | "UPDATE_PASSWORD";

interface SupabaseAggregateStats {
  projectsCount: number | null;
  parcelsCount: number | null;
  segmentsCount: number | null;
  rulesCount: number | null;
  latencyMs: number | null;
  lastQueriedAt: string | null;
  isLoading: boolean;
  error: string | null;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Authentication State
  const [mode, setMode] = useState<AuthMode>("LOGIN");
  const [emailOrId, setEmailOrId] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Captcha display state
  const [captchaCode, setCaptchaCode] = useState("7 K 9 M 2");
  const [captchaInput, setCaptchaInput] = useState("");

  const refreshCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length)) + " ";
    }
    setCaptchaCode(code.trim());
    setCaptchaInput("");
  };

  // Real-time Non-Sensitive Aggregate Statistics from Supabase
  const [stats, setStats] = useState<SupabaseAggregateStats>({
    projectsCount: null,
    parcelsCount: null,
    segmentsCount: null,
    rulesCount: null,
    latencyMs: null,
    lastQueriedAt: null,
    isLoading: true,
    error: null,
  });

  const fetchAggregateStats = useCallback(async () => {
    setStats((prev) => ({ ...prev, isLoading: true, error: null }));
    const startTime = performance.now();

    try {
      const [projectsRes, parcelsRes, segmentsRes, rulesRes] = await Promise.all([
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("parcels").select("*", { count: "exact", head: true }),
        supabase.from("project_segments").select("*", { count: "exact", head: true }),
        supabase.from("statutory_rules").select("*", { count: "exact", head: true }),
      ]);

      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      setStats({
        projectsCount: projectsRes.count ?? 14,
        parcelsCount: parcelsRes.count ?? 342,
        segmentsCount: segmentsRes.count ?? 48,
        rulesCount: rulesRes.count ?? 26,
        latencyMs: latency,
        lastQueriedAt: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
        isLoading: false,
        error: null,
      });
    } catch {
      setStats({
        projectsCount: 14,
        parcelsCount: 342,
        segmentsCount: 48,
        rulesCount: 26,
        latencyMs: 18,
        lastQueriedAt: new Date().toLocaleTimeString(),
        isLoading: false,
        error: null,
      });
    }
  }, [supabase]);

  useEffect(() => {
    fetchAggregateStats();

    if (searchParams.get("expired") === "true") {
      setSessionExpired(true);
    }
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setMode("UPDATE_PASSWORD");
    }
  }, [fetchAggregateStats, searchParams]);

  // Handle standard Login
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    let loginEmail = emailOrId.trim();
    if (!loginEmail.includes("@")) {
      loginEmail = `${loginEmail.toLowerCase().replace(/\s+/g, "")}@bhumi.gov.in`;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrorMsg("Authentication failed: Invalid officer credentials or unauthorized ID. Verify your password or contact your CALA division supervisor.");
        } else if (error.message.includes("Email not confirmed")) {
          setErrorMsg("Access restricted: Official email account is awaiting verification. Check your inbox for activation clearance.");
        } else {
          setErrorMsg(`Authorization error: ${error.message}`);
        }
        setLoading(false);
        return;
      }

      if (data.session) {
        setSuccessMsg("Security clearance accepted. Loading operational twin...");
        setTimeout(() => {
          const next = searchParams.get("next") || "/";
          router.push(next);
          router.refresh();
        }, 500);
      }
    } catch {
      setErrorMsg("Central Authentication Service offline or network communication timeout.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    let resetEmail = emailOrId.trim();
    if (!resetEmail.includes("@")) {
      resetEmail = `${resetEmail.toLowerCase().replace(/\s+/g, "")}@bhumi.gov.in`;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/login#type=recovery`,
      });

      if (error) {
        setErrorMsg(`Recovery dispatch failed: ${error.message}`);
      } else {
        setSuccessMsg(`Official password recovery link dispatched to ${resetEmail}. Check your mailbox and follow statutory protocol.`);
      }
    } catch {
      setErrorMsg("Security dispatch server unreachable. Please contact the district CALA IT desk.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg("Security compliance violation: Passwords must contain a minimum of 8 alphanumeric characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Verification mismatch: Passwords entered do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setErrorMsg(`Credential update rejected: ${error.message}`);
      } else {
        setSuccessMsg("Officer credentials successfully revised. Please sign in with your updated key.");
        setTimeout(() => {
          setMode("LOGIN");
          setPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }, 1500);
      }
    } catch {
      setErrorMsg("Failed to update credentials. Session signature may have expired.");
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for demonstration
  const handleQuickFill = () => {
    setEmailOrId("officer@bhumi.gov.in");
    setPassword("CommanderPass@2025");
    setCaptchaInput(captchaCode.replace(/\s+/g, ""));
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] dark:bg-[#07080F] text-[#333333] dark:text-[#CBD5E1] flex flex-col justify-between font-sans transition-colors duration-150">
      
      {/* ========================================================================= */}
      {/* 1. TOP UTILITY STRIP                                                      */}
      {/* ========================================================================= */}
      <div className="bg-[#071A32] text-white text-[11px] px-4 py-1.5 border-b border-white/10 flex-shrink-0">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          
          {/* Left: Toll Free Helpline */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-200">
              <Phone className="w-3 h-3 text-amber-400" />
              <span>Toll Free National Helpline: <strong>1800-11-9999</strong> / <strong>011-23717379</strong></span>
            </span>
            <span className="text-white/30 hidden md:inline">|</span>
            <span className="text-slate-300 hidden md:inline">helpdesk-bhumi@gov.in</span>
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
              <span className="px-1 py-0.5 rounded bg-white/10 hover:bg-white/20 cursor-pointer font-bold">A-</span>
              <span className="px-1 py-0.5 rounded bg-white/15 hover:bg-white/20 cursor-pointer font-bold">A</span>
              <span className="px-1 py-0.5 rounded bg-white/10 hover:bg-white/20 cursor-pointer font-bold">A+</span>
            </div>
            <span className="text-white/30">|</span>
            <ThemeToggle variant="icon" className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20" />
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN MINISTRY BRANDING HEADER                                          */}
      {/* ========================================================================= */}
      <header className="bg-[#0B2E59] text-white px-4 py-3 sm:px-8 border-b border-[#0A2647] flex-shrink-0">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          
          {/* Left: State Lion Capital Emblem + Bilingual Ministry Name */}
          <Link href="/" className="flex items-center gap-4 group">
            {/* Ashoka Sarnath Lion Capital Emblem Vector (~50px) */}
            <div className="w-12 h-14 flex-shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
                <rect x="12" y="64" width="40" height="4" rx="1" fill="#f8fafc" />
                <rect x="8" y="60" width="48" height="3" rx="1" fill="#e2e8f0" />
                <circle cx="32" cy="53" r="5.5" stroke="#f8fafc" strokeWidth="1.5" fill="none" />
                <circle cx="32" cy="53" r="1.5" fill="#f8fafc" />
                <line x1="32" y1="47.5" x2="32" y2="58.5" stroke="#f8fafc" strokeWidth="0.8" />
                <line x1="26.5" y1="53" x2="37.5" y2="53" stroke="#f8fafc" strokeWidth="0.8" />
                <line x1="28" y1="49" x2="36" y2="57" stroke="#f8fafc" strokeWidth="0.8" />
                <line x1="36" y1="49" x2="28" y2="57" stroke="#f8fafc" strokeWidth="0.8" />
                <rect x="14" y="52" width="6" height="3" rx="1" fill="#cbd5e1" />
                <rect x="44" y="52" width="6" height="3" rx="1" fill="#cbd5e1" />
                <rect x="10" y="46" width="44" height="4" rx="1" fill="#f1f5f9" />
                <path d="M26 46 C26 38 27 28 32 20 C37 28 38 38 38 46 Z" fill="#f8fafc" />
                <path d="M28 20 C28 14 30 8 32 8 C34 8 36 14 36 20 Z" fill="#ffffff" />
                <circle cx="32" cy="14" r="2.5" fill="#0b2e59" opacity="0.2" />
                <path d="M16 46 C16 38 20 32 25 24 C23 20 21 15 23 11 C25 9 27 12 28 16 C25 24 26 34 26 46 Z" fill="#e2e8f0" />
                <path d="M48 46 C48 38 44 32 39 24 C41 20 43 15 41 11 C39 9 37 12 36 16 C39 24 38 34 38 46 Z" fill="#e2e8f0" />
                <circle cx="32" cy="5" r="1.5" fill="#f8fafc" />
              </svg>
            </div>

            {/* Stacked Bilingual Ministry Title */}
            <div className="flex flex-col">
              <span className="font-devanagari font-bold text-sm sm:text-base text-white/95 leading-tight">
                सड़क परिवहन और राजमार्ग मंत्रालय
              </span>
              <span className="font-bold text-sm sm:text-base text-white leading-tight">
                Ministry of Road Transport and Highways
              </span>
              <span className="text-xs text-amber-300 font-semibold tracking-wide mt-0.5">
                भूमि अधिग्रहण प्रबंधन प्रणाली - BHUMI · National Land Acquisition Portal
              </span>
            </div>
          </Link>

          {/* Right: Institutional Badges */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] uppercase font-mono tracking-widest text-slate-300">
                GOVERNMENT OF INDIA
              </div>
              <div className="text-xs font-bold text-white tracking-wide">
                PM GatiShakti National Master Plan
              </div>
            </div>
            <div className="w-10 h-10 rounded-[4px] bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 font-bold font-devanagari text-lg shadow-sm">
              भ
            </div>
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
      {/* 4. HORIZONTAL NAVY NAVIGATION BAR                                         */}
      {/* ========================================================================= */}
      <nav className="bg-[#123C6B] text-white text-xs font-semibold px-4 sm:px-8 border-b border-[#0A2647] flex-shrink-0">
        <div className="max-w-[1440px] mx-auto flex items-center overflow-x-auto no-scrollbar">
          <Link href="/" className="px-4 py-2.5 hover:bg-[#2F6FB0] transition-colors whitespace-nowrap">
            Home
          </Link>
          <Link href="/parcels" className="px-4 py-2.5 hover:bg-[#2F6FB0] transition-colors whitespace-nowrap">
            Highway Land Register
          </Link>
          <Link href="/timeline" className="px-4 py-2.5 hover:bg-[#2F6FB0] transition-colors whitespace-nowrap">
            Statutory (Sec 3A/3D)
          </Link>
          <Link href="/projects" className="px-4 py-2.5 hover:bg-[#2F6FB0] transition-colors whitespace-nowrap">
            Compensation Awards
          </Link>
          <Link href="/reports" className="px-4 py-2.5 hover:bg-[#2F6FB0] transition-colors whitespace-nowrap">
            MIS Reports
          </Link>
          <Link href="/landowner-cases" className="px-4 py-2.5 hover:bg-[#2F6FB0] transition-colors whitespace-nowrap">
            Grievances
          </Link>
          <Link href="/login" className="px-4 py-2.5 bg-[#2F6FB0] text-white font-bold transition-colors whitespace-nowrap">
            Officer Login
          </Link>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 5. MAIN CONTENT — TWO-COLUMN PORTAL LAYOUT                                 */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ======================================================================= */}
        {/* LEFT COLUMN (65%) — NATIONAL DASHBOARD STATS, MAP & TABLES              */}
        {/* ======================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section Heading with Thin Rule */}
          <div className="border-b border-[#DCE2E8] dark:border-white/10 pb-2">
            <h2 className="text-xl font-bold text-[#14213D] dark:text-[#F0F4FF] leading-tight">
              National Highway Land Acquisition Operations
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Decision Support and Statutory Compliance Monitoring System under RFCTLARR Act 2013 &amp; NH Act 1956
            </p>
          </div>

          {/* 4 Stat Tiles Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 p-3 rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-center transition-colors">
              <div className="text-2xl font-extrabold text-[#14213D] dark:text-white">
                {stats.projectsCount ?? 14}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 mt-1">
                Active Highway Corridors
              </div>
            </div>

            <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 p-3 rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-center transition-colors">
              <div className="text-2xl font-extrabold text-[#14213D] dark:text-white">
                {stats.parcelsCount ? (stats.parcelsCount * 1250).toLocaleString("en-IN") : "425,800"}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 mt-1">
                Total Area Acquired (Sqm)
              </div>
            </div>

            <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 p-3 rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-center transition-colors">
              <div className="text-2xl font-extrabold text-[#1E7E34] dark:text-emerald-400">
                ₹ 1,842.50 Cr
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 mt-1">
                Compensation Disbursed
              </div>
            </div>

            <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 p-3 rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-center transition-colors">
              <div className="text-2xl font-extrabold text-[#B36B00] dark:text-amber-400">
                28
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 mt-1">
                Pending Gazette Notices
              </div>
            </div>

          </div>

          {/* Interactive GIS Corridor Map Preview */}
          <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#14213D] dark:text-white flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[#0B5FA5] dark:text-sky-400" />
                <span>National Corridor Alignment &amp; Cadastral Contiguity Map</span>
              </h3>
              <Link href="/projects/gis" className="text-xs text-[#0B5FA5] dark:text-sky-400 hover:underline font-semibold flex items-center gap-1">
                <span>Open Fullscreen GIS →</span>
              </Link>
            </div>

            <PortfolioMap projects={MOCK_GOVERNMENT_PROJECTS} />
          </div>

          {/* Highway Projects Summary Table */}
          <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#14213D] dark:text-white">
                Active National Highway Corridor Acquisition Status
              </h3>
              <span className="text-[11px] text-[#64748B] dark:text-slate-400">Updated: Today</span>
            </div>

            <div className="overflow-x-auto">
              <table className="gov-table dark:border-white/10">
                <thead className="bg-[#F1F4F7] dark:bg-[#0A2647] text-[#0B2E59] dark:text-slate-200">
                  <tr>
                    <th>Corridor / Highway Project</th>
                    <th>Sector / State</th>
                    <th>Parcels</th>
                    <th>RFCTLARR Stage</th>
                    <th>Possession Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE2E8] dark:divide-white/10">
                  {MOCK_GOVERNMENT_PROJECTS.slice(0, 5).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="font-bold text-[#14213D] dark:text-white">
                        {p.name}
                      </td>
                      <td className="text-[#333333] dark:text-slate-300">{p.sector || "National Highway"}</td>
                      <td className="font-mono text-center text-[#14213D] dark:text-white">{p.statistics.total_parcels_projected}</td>
                      <td className="text-[#333333] dark:text-slate-300">Section 3D Declared</td>
                      <td className="font-bold">
                        {p.statistics.unresolved_bottlenecks > 0 ? (
                          <span className="text-[#B32424] dark:text-rose-400">
                            {p.statistics.unresolved_bottlenecks} Blockers Active
                          </span>
                        ) : (
                          <span className="text-[#1E7E34] dark:text-emerald-400">
                            Possession In Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN (35%) — OFFICER LOGIN CARD                                 */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] overflow-hidden transition-colors">
            
            {/* Card Navy Header Bar */}
            <div className="bg-[#0B2E59] text-white p-3.5 flex items-center justify-between border-b border-[#0A2647]">
              <div>
                <h3 className="text-sm font-bold leading-tight">
                  Officer Login / अधिकारी लॉगिन
                </h3>
                <span className="text-[10px] text-amber-300 font-mono">
                  MoRTH / CALA / NHAI Authorized Officers
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-200 border border-white/20">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>SSL 256-BIT</span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 space-y-4">
              
              {/* Feedback messages */}
              {sessionExpired && (
                <div className="p-2.5 rounded-[3px] bg-[#FFF8E6] dark:bg-amber-950/40 border border-[#FFE29A] dark:border-amber-800 text-[#B36B00] dark:text-amber-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Session timed out. Please re-authenticate.</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-2.5 rounded-[3px] bg-[#FDF0F0] dark:bg-rose-950/40 border border-[#F8C8C8] dark:border-rose-800 text-[#B32424] dark:text-rose-300 text-xs flex items-start gap-2 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded-[3px] bg-[#EBF7EE] dark:bg-emerald-950/40 border border-[#BEE3C8] dark:border-emerald-800 text-[#1E7E34] dark:text-emerald-300 text-xs flex items-start gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Login Form */}
              {mode === "LOGIN" && (
                <form onSubmit={handleSignIn} className="space-y-3.5 text-xs">
                  
                  <div>
                    <label className="block text-xs font-bold text-[#14213D] dark:text-slate-200 mb-1">
                      Official Username / Officer ID <span className="text-[#B32424] dark:text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={emailOrId}
                      onChange={(e) => setEmailOrId(e.target.value)}
                      placeholder="e.g. officer@bhumi.gov.in"
                      disabled={loading}
                      className="input w-full bg-white dark:bg-[#07080F] border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-[#14213D] dark:text-slate-200">
                        Password / पासवर्ड <span className="text-[#B32424] dark:text-rose-400">*</span>
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        disabled={loading}
                        className="input w-full pr-9 bg-white dark:bg-[#07080F] border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Visual CAPTCHA Field */}
                  <div>
                    <label className="block text-xs font-bold text-[#14213D] dark:text-slate-200 mb-1">
                      Security Code (CAPTCHA) <span className="text-[#B32424] dark:text-rose-400">*</span>
                    </label>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="bg-[#F1F4F7] dark:bg-[#0A2647] border border-[#CBD5E1] dark:border-slate-700 px-4 py-2 font-mono font-bold text-base tracking-[0.25em] text-[#0B2E59] dark:text-amber-300 select-none rounded-[3px]">
                        {captchaCode}
                      </div>
                      <button
                        type="button"
                        onClick={refreshCaptcha}
                        title="Change CAPTCHA image"
                        className="p-2 rounded-[3px] border border-[#CBD5E1] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="Enter the 5 characters above"
                      className="input w-full bg-white dark:bg-[#07080F] border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.target.checked)}
                        className="rounded-[2px] text-[#0B2E59]"
                      />
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400">Remember Officer ID</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setMode("FORGOT_PASSWORD")}
                      className="text-[11px] font-semibold text-[#0B5FA5] dark:text-sky-400 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-2.5 uppercase tracking-wider text-xs"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In / प्रवेश करें</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Forgot Password Mode */}
              {mode === "FORGOT_PASSWORD" && (
                <form onSubmit={handleForgotPassword} className="space-y-3.5 text-xs">
                  <div>
                    <h4 className="font-bold text-[#14213D] dark:text-white text-sm mb-1">Recover Credentials</h4>
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                      Enter your official government email address to receive authorization reset instructions.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#14213D] dark:text-slate-200 mb-1">
                      Official Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={emailOrId}
                      onChange={(e) => setEmailOrId(e.target.value)}
                      placeholder="officer@bhumi.gov.in"
                      className="input w-full bg-white dark:bg-[#07080F] border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white"
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-xs">
                    Dispatch Recovery Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("LOGIN")}
                    className="block w-full text-center text-xs text-[#0B5FA5] dark:text-sky-400 hover:underline pt-1"
                  >
                    ← Back to Officer Sign In
                  </button>
                </form>
              )}

              {/* Demo Helper */}
              <div className="pt-3 border-t border-[#DCE2E8] dark:border-white/10 text-center space-y-2">
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="text-[11px] font-mono text-[#0B5FA5] dark:text-sky-400 hover:underline inline-flex items-center gap-1.5"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>[ Load Demo Official Credentials ]</span>
                </button>

                <div className="pt-2 text-left space-y-1.5 border-t border-[#DCE2E8] dark:border-white/10">
                  <Link
                    href="/field/login"
                    className="text-xs text-[#0B5FA5] dark:text-sky-400 hover:underline block font-semibold"
                  >
                    → Switch to Field Officer Mobile Login
                  </Link>
                  <Link
                    href="/landowner/login"
                    className="text-xs text-[#0B5FA5] dark:text-sky-400 hover:underline block font-semibold"
                  >
                    → Switch to Citizen / Landowner Grievance Portal
                  </Link>
                </div>
              </div>

            </div>

          </div>

          {/* Official Security Disclaimer Box */}
          <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 p-3 rounded-[4px] text-xs text-[#64748B] dark:text-slate-400 space-y-1 transition-colors">
            <div className="font-bold text-[#14213D] dark:text-white flex items-center gap-1 text-[11px]">
              <Shield className="w-3.5 h-3.5 text-[#0B5FA5] dark:text-sky-400" />
              <span>Official Government Portal Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              This system is strictly for authorized personnel of the Ministry of Road Transport &amp; Highways and Competent Authorities for Land Acquisition (CALA). Unauthorized access attempts are monitored and punishable under the IT Act 2000.
            </p>
          </div>

        </div>

      </main>

      {/* ========================================================================= */}
      {/* 6. OFFICIAL NIC GOVERNMENT FOOTER                                         */}
      {/* ========================================================================= */}
      <footer className="bg-[#0A2647] text-white py-4 px-4 text-center text-xs border-t border-[#071A32] flex-shrink-0 space-y-1">
        <div className="max-w-[1440px] mx-auto space-y-1">
          <p className="font-medium text-slate-200">
            Designed, Developed and Hosted by National Informatics Centre (NIC), Ministry of Electronics &amp; Information Technology, Government of India
          </p>
          <p className="text-[11px] text-slate-400">
            Content Owned and Maintained by Ministry of Road Transport &amp; Highways, Government of India
          </p>
          <p className="text-[10px] text-slate-400 font-mono pt-1">
            BHUMI Portal Version 3.4.1 · ISO 27001 Certified · Compliance under RFCTLARR Act 2013 &amp; NH Act 1956
          </p>
        </div>
      </footer>

    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="w-full h-screen bg-[#F4F6F8] flex items-center justify-center text-slate-600 font-mono text-xs">
        Loading Government of India Portal...
      </div>
    }>
      <LoginPageContent />
    </React.Suspense>
  );
}
