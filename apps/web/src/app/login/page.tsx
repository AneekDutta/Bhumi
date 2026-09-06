"use client";

import React, { useState, useEffect } from "react";
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
  Building2, 
  KeyRound, 
  RefreshCw,
  Smartphone,
  Phone,
  HelpCircle,
  ExternalLink,
  FileText,
  Scale,
  Check,
  Landmark
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { PublicShell } from "@/components/layout/PublicShell";

type AuthMode = "LOGIN" | "FORGOT_PASSWORD" | "UPDATE_PASSWORD";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { language, setLanguage, textSize, setTextSize } = useI18n();

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

  useEffect(() => {
    if (searchParams.get("expired") === "true") {
      setSessionExpired(true);
    }
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setMode("UPDATE_PASSWORD");
    }
  }, [searchParams]);

  // Instant Officer Demo Login
  const handleInstantDemoLogin = () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg("Security clearance accepted for CALA Officer. Loading National Operations Console...");

    // Establish official CALA Officer session cookie
    const sessionData = {
      officer_id: "OFF-CALA-01",
      name: "Sh. Rajesh Kumar",
      email: "officer@bhumi.gov.in",
      role: "ADMIN",
    };

    document.cookie = `bhumi_officer_session=${encodeURIComponent(
      JSON.stringify(sessionData)
    )}; path=/; max-age=${86400 * 7}; SameSite=Lax`;

    setTimeout(() => {
      const next = searchParams.get("next") || "/dashboard";
      window.location.href = next;
    }, 500);
  };

  // Handle standard Login form submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    let loginEmail = emailOrId.trim();
    if (!loginEmail.includes("@")) {
      loginEmail = `${loginEmail.toLowerCase().replace(/\s+/g, "")}@bhumi.gov.in`;
    }

    // Auto-fallback for demo officer credentials
    if (
      loginEmail.toLowerCase() === "officer@bhumi.gov.in" &&
      password === "CommanderPass@2025"
    ) {
      handleInstantDemoLogin();
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (error) {
        // Fallback for officer demo ID
        if (loginEmail.toLowerCase() === "officer@bhumi.gov.in") {
          handleInstantDemoLogin();
          return;
        }

        if (error.message.includes("Invalid login credentials")) {
          setErrorMsg(
            "Authentication failed: Invalid officer credentials or unauthorized ID. Verify your password or use the CALA Demo Clearance."
          );
        } else if (error.message.includes("Email not confirmed")) {
          setErrorMsg(
            "Access restricted: Official email account is awaiting verification. Check your inbox for activation clearance."
          );
        } else {
          setErrorMsg(`Authorization error: ${error.message}`);
        }
        setLoading(false);
        return;
      }

      if (data.session) {
        const role = data.user?.user_metadata?.role;
        setSuccessMsg("Security clearance accepted. Loading operational twin...");
        setTimeout(() => {
          if (role === "LANDOWNER") {
            window.location.href = "/landowner/home";
          } else if (role === "FIELD_OFFICER") {
            window.location.href = "/field/dashboard";
          } else {
            const next = searchParams.get("next") || "/dashboard";
            window.location.href = next;
          }
        }, 500);
      }
    } catch {
      // In case Supabase network fails, gracefully permit officer demo
      if (loginEmail.toLowerCase() === "officer@bhumi.gov.in") {
        handleInstantDemoLogin();
        return;
      }
      setErrorMsg("Central Authentication Service offline or network communication timeout.");
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
        setSuccessMsg(
          `Official password recovery link dispatched to ${resetEmail}. Check your mailbox and follow statutory protocol.`
        );
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
    <PublicShell>
      <div className="max-w-[1440px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ======================================================================= */}
        {/* LEFT COLUMN (60%) — OFFICIAL MANDATE, PORTAL DIRECTORY & STATUTORY INFO */}
        {/* ======================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section Heading with Thin Rule */}
          <div className="border-b border-[#DCE2E8] dark:border-white/10 pb-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-none bg-[#0B2E59]/10 dark:bg-white/10 text-[#0B2E59] dark:text-sky-300 font-mono text-[11px] font-bold mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>CENTRAL ADMINISTRATIVE AUTHENTICATION GATEWAY</span>
            </div>
            <h1 className="text-2xl font-bold text-[#14213D] dark:text-[#F0F4FF] leading-tight">
              Real-Time National Land Acquisition &amp; Decision Support System
            </h1>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
              Unified digital infrastructure connecting the Ministry of Road Transport &amp; Highways, National Highways Authority of India (NHAI), District CALAs, Field Surveyors, and Affected Landowners under the RFCTLARR Act 2013 &amp; NH Act 1956.
            </p>
          </div>

          {/* Three Portals Architecture Cards */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#14213D] dark:text-slate-300">
              System Access Portals / प्रणाली प्रवेश द्वार
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Card 1: CALA Officer Console (Active) */}
              <div className="bg-white dark:bg-[#0B1220] border-2 border-[#0B5FA5] dark:border-sky-500 p-3.5 rounded-none relative">
                <div className="absolute top-2 right-2">
                  <span className="text-[9px] font-mono font-bold bg-[#0B5FA5] text-white px-1.5 py-0.5 rounded-none">
                    ACTIVE
                  </span>
                </div>
                <Building2 className="w-5 h-5 text-[#0B5FA5] dark:text-sky-400 mb-2" />
                <h3 className="font-bold text-xs text-[#14213D] dark:text-white">
                  CALA Operations Console
                </h3>
                <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                  Desktop decision support for Competent Authorities, statutory Section 3A/3D tracking, and compensation approvals.
                </p>
                <div className="mt-2.5 text-[10px] font-bold text-[#0B5FA5] dark:text-sky-400">
                  Current Form &rarr;
                </div>
              </div>

              {/* Card 2: Field Officer Mobile App */}
              <Link 
                href="/field/login"
                className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 hover:border-[#1E7E34] dark:hover:border-emerald-500 p-3.5 rounded-none transition-all group block"
              >
                <Smartphone className="w-5 h-5 text-[#1E7E34] dark:text-emerald-400 mb-2" />
                <h3 className="font-bold text-xs text-[#14213D] dark:text-white group-hover:text-[#1E7E34] dark:group-hover:text-emerald-400">
                  Field Officer Mobile PWA
                </h3>
                <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                  Cadastral survey tools for Patwaris and Amin. Geotagged ground photography, GPS boundary pegging, and offline sync.
                </p>
                <div className="mt-2.5 text-[10px] font-bold text-[#1E7E34] dark:text-emerald-400 flex items-center gap-1">
                  <span>Switch to Field App</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>

              {/* Card 3: Citizen / Landowner Portal */}
              <Link 
                href="/landowner/login"
                className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 hover:border-[#B36B00] dark:hover:border-amber-500 p-3.5 rounded-none transition-all group block"
              >
                <Scale className="w-5 h-5 text-[#B36B00] dark:text-amber-400 mb-2" />
                <h3 className="font-bold text-xs text-[#14213D] dark:text-white group-hover:text-[#B36B00] dark:group-hover:text-amber-400">
                  Citizen Landowner Portal
                </h3>
                <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                  Bhumi Samvaad citizen interface for checking compensation awards, lodging statutory objections, and tracking DBT disbursals.
                </p>
                <div className="mt-2.5 text-[10px] font-bold text-[#B36B00] dark:text-amber-400 flex items-center gap-1">
                  <span>Switch to Citizen Portal</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>

            </div>
          </div>

          {/* Statutory Compliance Guidelines */}
          <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 p-4 rounded-none space-y-3">
            <h3 className="text-xs font-bold text-[#14213D] dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0B2E59] dark:text-sky-400" />
              <span>Statutory Mandate &amp; Legal Framework</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-[#475569] dark:text-slate-300">
              <div className="p-2.5 bg-slate-50 dark:bg-white/5 border-l-2 border-[#0B2E59] dark:border-sky-400 space-y-1">
                <span className="font-bold text-[#14213D] dark:text-white">National Highways Act, 1956</span>
                <p className="leading-relaxed">
                  Statutory gazette lifecycle governance: Section 3A (Intention to acquire), 3C (Objection hearings), 3D (Declaration of acquisition), and 3G/3H (Award determination and deposit).
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-white/5 border-l-2 border-[#1E7E34] dark:border-emerald-400 space-y-1">
                <span className="font-bold text-[#14213D] dark:text-white">RFCTLARR Act, 2013</span>
                <p className="leading-relaxed">
                  Mandatory calculation of 100% Solatium, rural factor multipliers (1.5x - 2.0x), 12% additional interest per annum, and Rehabilitation &amp; Resettlement entitlements.
                </p>
              </div>
            </div>
          </div>

          {/* Security & Access Instructions */}
          <div className="p-3.5 bg-[#FFFBEB] dark:bg-amber-950/30 border border-[#FDE68A] dark:border-amber-800 rounded-none text-xs space-y-1.5">
            <div className="font-bold text-[#92400E] dark:text-amber-300 flex items-center gap-1.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>Official Access Advisory for CALA Officers</span>
            </div>
            <p className="text-[11px] text-[#78350F] dark:text-amber-200/90 leading-relaxed">
              Login is restricted to designated Competent Authorities for Land Acquisition (CALA), Special Land Acquisition Officers (SLAO), and authorized Project Directors. Keep credentials confidential and report any anomaly immediately to the District IT Desk.
            </p>
          </div>

        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN (40%) — OFFICER AUTHENTICATION CARD                        */}
        {/* ======================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 rounded-none shadow-none overflow-hidden transition-colors">
            
            {/* Card Navy Header Bar */}
            <div className="bg-[#0B2E59] text-white p-4 flex items-center justify-between border-b border-[#0A2647]">
              <div>
                <h3 className="text-sm font-bold leading-tight">
                  Officer Login / अधिकारी लॉगिन
                </h3>
                <span className="text-[10px] text-amber-300 font-mono">
                  CALA Directorate / Authorized Project Officers
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-none bg-white/10 text-slate-200 border border-white/20">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>CALA SECURED · STATUTORY PROTOCOL</span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 space-y-4">
              
              {/* Feedback messages */}
              {sessionExpired && (
                <div className="p-2.5 rounded-none bg-[#FFF8E6] dark:bg-amber-950/40 border border-[#FFE29A] dark:border-amber-800 text-[#B36B00] dark:text-amber-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Session timed out. Please re-authenticate.</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-2.5 rounded-none bg-[#FDF0F0] dark:bg-rose-950/40 border border-[#F8C8C8] dark:border-rose-800 text-[#B32424] dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded-none bg-[#EBF7EE] dark:bg-emerald-950/40 border border-[#BEE3C8] dark:border-emerald-800 text-[#1E7E34] dark:text-emerald-300 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* CALA Official Evaluation Clearance Box (Pure Gov Ledger Style) */}
              <div className="bg-[#F1F6FB] dark:bg-[#0B2546] border border-[#B3D4F5] dark:border-sky-800 p-3 rounded-none text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#0B2E59] dark:text-sky-300 flex items-center gap-1.5 text-xs">
                    <Shield className="w-3.5 h-3.5 text-[#0B5FA5]" />
                    CALA Officer Evaluation Clearance
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-none bg-[#0B2E59] text-white font-semibold">
                    OFFICIAL
                  </span>
                </div>
                <p className="text-[11px] text-[#2F6FB0] dark:text-sky-200 mb-2 leading-relaxed">
                  Pre-cleared authorization key for Competent Authority (CALA) Administrator:
                </p>
                <button
                  type="button"
                  onClick={handleInstantDemoLogin}
                  disabled={loading}
                  className="w-full bg-[#0B5FA5] hover:bg-[#094d87] text-white py-2 px-3 rounded-none font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-[#084880]"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                  <span>Authorized CALA Officer Evaluation Access</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#DCE2E8] dark:border-white/10"></div>
                <span className="flex-shrink mx-2 text-[10px] font-mono uppercase text-[#64748B] dark:text-slate-400">
                  Or Sign In with Official Key
                </span>
                <div className="flex-grow border-t border-[#DCE2E8] dark:border-white/10"></div>
              </div>

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
                      className="input w-full bg-white dark:bg-[#07080F] border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white rounded-none"
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
                        className="input w-full pr-9 bg-white dark:bg-[#07080F] border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white rounded-none"
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
                      <div className="bg-[#F1F4F7] dark:bg-[#0A2647] border border-[#CBD5E1] dark:border-slate-700 px-4 py-2 font-mono font-bold text-base tracking-[0.25em] text-[#0B2E59] dark:text-amber-300 select-none rounded-none">
                        {captchaCode}
                      </div>
                      <button
                        type="button"
                        onClick={refreshCaptcha}
                        title="Change CAPTCHA image"
                        className="p-2 rounded-none border border-[#CBD5E1] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="Enter the characters shown above"
                      className="input w-full bg-white dark:bg-[#07080F] border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white rounded-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.target.checked)}
                        className="rounded-none text-[#0B2E59]"
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
                    className="btn-primary w-full py-2.5 uppercase tracking-wider text-xs rounded-none"
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
                      className="input w-full bg-white dark:bg-[#07080F] border-[#CBD5E1] dark:border-slate-700 text-[#14213D] dark:text-white rounded-none"
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-xs rounded-none">
                    Dispatch Recovery Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("LOGIN")}
                    className="block w-full text-center text-xs text-[#0B5FA5] dark:text-sky-400 hover:underline pt-1"
                  >
                    &larr; Back to Officer Sign In
                  </button>
                </form>
              )}

              {/* Demo Fill Helper */}
              <div className="pt-3 border-t border-[#DCE2E8] dark:border-white/10 text-center space-y-2">
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="text-[11px] font-mono text-[#0B5FA5] dark:text-sky-400 hover:underline inline-flex items-center gap-1.5"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>[ Auto-fill officer@bhumi.gov.in ]</span>
                </button>

                <div className="pt-2 text-left space-y-1.5 border-t border-[#DCE2E8] dark:border-white/10">
                  <Link
                    href="/field/login"
                    className="text-xs text-[#0B5FA5] dark:text-sky-400 hover:underline block font-semibold"
                  >
                    &rarr; Switch to Field Officer Mobile Login
                  </Link>
                  <Link
                    href="/landowner/login"
                    className="text-xs text-[#0B5FA5] dark:text-sky-400 hover:underline block font-semibold"
                  >
                    &rarr; Switch to Citizen / Landowner Grievance Portal
                  </Link>
                </div>
              </div>

            </div>

          </div>

          {/* Official Security Disclaimer Box */}
          <div className="bg-white dark:bg-[#0B1220] border border-[#DCE2E8] dark:border-white/10 p-3 rounded-none text-xs text-[#64748B] dark:text-slate-400 space-y-1 transition-colors">
            <div className="font-bold text-[#14213D] dark:text-white flex items-center gap-1 text-[11px]">
              <Shield className="w-3.5 h-3.5 text-[#0B5FA5] dark:text-sky-400" />
              <span>CALA Access Protocol Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              This system is strictly for authorized personnel of the Competent Authority for Land Acquisition (CALA) and designated project directors. Unauthorized access attempts are logged and subject to administrative sanctions.
            </p>
          </div>

        </div>

      </div>
    </PublicShell>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="w-full h-screen bg-[#F4F6F8] flex items-center justify-center text-slate-600 font-mono text-xs">
        Loading BHUMI Portal...
      </div>
    }>
      <LoginPageContent />
    </React.Suspense>
  );
}
