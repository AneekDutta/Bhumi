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
  Clock, 
  Building2, 
  KeyRound, 
  RefreshCw,
  Database,
  Radio,
  Server,
  Smartphone
} from "lucide-react";

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

  // Query Real-Time Aggregate Statistics from Supabase (Zero fabricated or hardcoded numbers)
  const fetchAggregateStats = useCallback(async () => {
    setStats((prev) => ({ ...prev, isLoading: true, error: null }));
    const startTime = performance.now();

    try {
      // Query non-sensitive count aggregates across public tables in parallel
      const [projectsRes, parcelsRes, segmentsRes, rulesRes] = await Promise.all([
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("parcels").select("*", { count: "exact", head: true }),
        supabase.from("project_segments").select("*", { count: "exact", head: true }),
        supabase.from("statutory_rules").select("*", { count: "exact", head: true }),
      ]);

      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      setStats({
        projectsCount: projectsRes.count ?? 0,
        parcelsCount: parcelsRes.count ?? 0,
        segmentsCount: segmentsRes.count ?? 0,
        rulesCount: rulesRes.count ?? 0,
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
    } catch (err: any) {
      setStats((prev) => ({
        ...prev,
        isLoading: false,
        error: "Real-time telemetry query offline",
        lastQueriedAt: new Date().toLocaleTimeString(),
      }));
    }
  }, [supabase]);

  useEffect(() => {
    // Initial real-time fetch from Supabase
    fetchAggregateStats();

    // Check for session expired query param
    if (searchParams.get("expired") === "true") {
      setSessionExpired(true);
    }
    // Check for password recovery hash
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

    // Sanitize input: convert officer ID to email format if user entered an ID
    let loginEmail = emailOrId.trim();
    if (!loginEmail.includes("@")) {
      loginEmail = `${loginEmail.toLowerCase().replace(/\s+/g, "")}@bhumi.gov.in`;
    }

    try {
      // 1. Attempt Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (error) {
        // Translate Supabase errors to institutional format
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
        // Successful official Supabase session; middleware owns its cookies.
        setSuccessMsg("Security clearance accepted. Loading operational twin...");
        setTimeout(() => {
          const next = searchParams.get("next") || "/";
          router.push(next);
          router.refresh();
        }, 500);
      }
    } catch (err: any) {
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
    setErrorMsg(null);
  };

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-[#070a14] text-[#e2e8f0] select-none font-sans">
      
      {/* ========================================================================= */}
      {/* LEFT SIDE — PRODUCT INTELLIGENCE PREVIEW (58% desktop width)              */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex lg:w-[58%] min-h-screen flex-col justify-between p-10 xl:p-14 relative overflow-hidden border-r border-[#1e293b]/70 bg-[#060811]">
        
        {/* Subtle GIS Background Grid Pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(56, 189, 248, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(56, 189, 248, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Abstract GIS Corridor Visualization (Non-Sensitive, Anonymous Geometries) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-25">
          <svg width="100%" height="100%" viewBox="0 0 1000 800" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full scale-105">
            {/* Alignment Axis Line */}
            <path d="M-50 450 C 250 420, 450 350, 750 380 S 1050 320, 1100 300" stroke="#0284c7" strokeWidth="4" strokeDasharray="8 6" opacity="0.7" />
            <path d="M-50 470 C 250 440, 450 370, 750 400 S 1050 340, 1100 320" stroke="#0ea5e9" strokeWidth="1.5" strokeOpacity="0.3" />
            <path d="M-50 430 C 250 400, 450 330, 750 360 S 1050 300, 1100 280" stroke="#0ea5e9" strokeWidth="1.5" strokeOpacity="0.3" />

            {/* Chainage Markers (Non-sensitive reference points) */}
            <circle cx="200" cy="425" r="5" fill="#38bdf8" />
            <text x="180" y="448" fill="#64748b" fontSize="11" fontFamily="JetBrains Mono, monospace">KM 110+000</text>

            <circle cx="480" cy="355" r="5" fill="#38bdf8" />
            <text x="460" y="340" fill="#64748b" fontSize="11" fontFamily="JetBrains Mono, monospace">KM 120+000</text>

            <circle cx="750" cy="380" r="5" fill="#38bdf8" />
            <text x="730" y="405" fill="#64748b" fontSize="11" fontFamily="JetBrains Mono, monospace">KM 130+000</text>

            {/* Abstract Cadastral Polygons (Anonymous, non-identifiable boundaries) */}
            <polygon points="120,380 190,370 195,430 115,435" fill="rgba(14, 165, 233, 0.04)" stroke="#1e293b" strokeWidth="1.5" />
            <polygon points="195,370 270,360 275,420 200,430" fill="rgba(16, 185, 129, 0.06)" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 3" />
            <polygon points="275,360 360,345 365,410 280,420" fill="rgba(14, 165, 233, 0.04)" stroke="#1e293b" strokeWidth="1.5" />
            <polygon points="365,345 440,330 445,395 370,410" fill="rgba(14, 165, 233, 0.06)" stroke="#38bdf8" strokeWidth="1.5" />
            <polygon points="445,330 520,325 525,390 450,395" fill="rgba(14, 165, 233, 0.04)" stroke="#1e293b" strokeWidth="1.5" />
            <polygon points="525,325 610,335 615,400 530,390" fill="rgba(14, 165, 233, 0.04)" stroke="#1e293b" strokeWidth="1.5" />
            <polygon points="615,335 690,345 695,415 620,400" fill="rgba(14, 165, 233, 0.06)" stroke="#38bdf8" strokeWidth="1.5" />
            <polygon points="695,345 770,355 775,425 700,415" fill="rgba(14, 165, 233, 0.04)" stroke="#1e293b" strokeWidth="1.5" />
            <polygon points="775,355 860,340 865,410 780,425" fill="rgba(16, 185, 129, 0.06)" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 3" />
            <polygon points="865,340 940,320 945,390 870,410" fill="rgba(14, 165, 233, 0.04)" stroke="#1e293b" strokeWidth="1.5" />

            {/* Geodetic Reference Coordinate Markers */}
            <path d="M300 200 L320 200 M310 190 L310 210" stroke="#334155" strokeWidth="1" />
            <text x="325" y="204" fill="#475569" fontSize="10" fontFamily="JetBrains Mono, monospace">18.5204° N, 73.8567° E</text>

            <path d="M700 550 L720 550 M710 540 L710 560" stroke="#334155" strokeWidth="1" />
            <text x="725" y="554" fill="#475569" fontSize="10" fontFamily="JetBrains Mono, monospace">18.5312° N, 73.9145° E</text>
          </svg>
        </div>

        {/* Top Header: Institutional Authority */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#0c1322] border border-[#1e293b] flex items-center justify-center text-[#38bdf8] shadow-sm">
              <Building2 className="w-5 h-5 text-[#38bdf8]" />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-[0.14em] uppercase text-[#64748b] font-semibold">
                Ministry of Road Transport & Highways · Govt of India
              </div>
              <div className="text-xs font-mono font-bold text-[#94a3b8] tracking-wider uppercase">
                BHUMI Digital Twin · PM GatiShakti NMP
              </div>
            </div>
          </div>

          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0284c7]/10 border border-[#0284c7]/30 text-[#38bdf8] text-[11px] font-mono font-semibold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
              National Land Operations Authority
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-[#f8fafc] tracking-tight leading-tight font-sans">
              LAND ACQUISITION<br />
              <span className="text-[#38bdf8]">INTELLIGENCE PLATFORM</span>
            </h1>
            <p className="text-sm xl:text-base text-[#94a3b8] font-medium tracking-wide">
              Monitor. Diagnose. Resolve. Execute.
            </p>
          </div>
        </div>

        {/* Central Component: Live Real-Time Non-Sensitive Aggregate Statistics */}
        <div className="relative z-10 my-auto py-6 max-w-xl w-full">
          <div className="rounded-xl bg-[#0b1021]/90 backdrop-blur-md border border-[#1e293b] p-6 shadow-2xl relative">
            
            {/* Top Bar of Live Aggregate Telemetry */}
            <div className="flex items-start justify-between pb-4 mb-4 border-b border-[#1e293b]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#38bdf8] font-bold block mb-1">
                  Operational Telemetry & System Status
                </span>
                <h3 className="text-base font-bold text-[#f8fafc] font-sans flex items-center gap-2">
                  <span>National Corridor Digital Twin</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0f172a] text-[#94a3b8] border border-[#334155]">
                    PROD-CLUSTER
                  </span>
                </h3>
              </div>

              {/* Live Connection Badge */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={fetchAggregateStats}
                  disabled={stats.isLoading}
                  title="Click to refresh Supabase aggregate statistics"
                  className="flex items-center justify-end gap-1.5 text-xs text-[#38bdf8] hover:text-[#7dd3fc] font-mono transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${stats.isLoading ? "animate-spin text-[#38bdf8]" : ""}`} />
                  <span className="text-[11px] font-semibold">{stats.isLoading ? "Querying..." : "Live Sync"}</span>
                </button>
                <div className="text-[10px] font-mono text-[#64748b] mt-0.5">
                  {stats.lastQueriedAt ? `Refreshed ${stats.lastQueriedAt}` : "Connecting..."}
                </div>
              </div>
            </div>

            {/* Real-Time Aggregate Database Metrics Grid (Direct from Supabase database) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
              
              {/* Metric 1: Registered Corridors / Projects */}
              <div className="bg-[#070a14] border border-[#1e293b] rounded-lg p-3 text-center transition-all hover:border-[#334155]">
                <div className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider">Corridors</div>
                <div className="text-xl font-extrabold text-[#f1f5f9] font-mono mt-1">
                  {stats.isLoading ? (
                    <span className="inline-block w-6 h-4 bg-[#1e293b] animate-pulse rounded" />
                  ) : (
                    stats.projectsCount ?? 0
                  )}
                </div>
                <div className="text-[9px] text-[#64748b] font-mono mt-0.5">Registered in DB</div>
              </div>

              {/* Metric 2: Cadastral Parcels */}
              <div className="bg-[#070a14] border border-[#1e293b] rounded-lg p-3 text-center transition-all hover:border-[#334155]">
                <div className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider">Parcels</div>
                <div className="text-xl font-extrabold text-[#38bdf8] font-mono mt-1">
                  {stats.isLoading ? (
                    <span className="inline-block w-6 h-4 bg-[#1e293b] animate-pulse rounded" />
                  ) : (
                    stats.parcelsCount ?? 0
                  )}
                </div>
                <div className="text-[9px] text-[#64748b] font-mono mt-0.5">Monitored Records</div>
              </div>

              {/* Metric 3: Project Segments */}
              <div className="bg-[#070a14] border border-[#1e293b] rounded-lg p-3 text-center transition-all hover:border-[#334155]">
                <div className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider">Segments</div>
                <div className="text-xl font-extrabold text-[#10b981] font-mono mt-1">
                  {stats.isLoading ? (
                    <span className="inline-block w-6 h-4 bg-[#1e293b] animate-pulse rounded" />
                  ) : (
                    stats.segmentsCount ?? 0
                  )}
                </div>
                <div className="text-[9px] text-[#64748b] font-mono mt-0.5">RoW Alignments</div>
              </div>

              {/* Metric 4: Statutory Rules Configured */}
              <div className="bg-[#070a14] border border-[#1e293b] rounded-lg p-3 text-center transition-all hover:border-[#334155]">
                <div className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider">Rulesets</div>
                <div className="text-xl font-extrabold text-[#f59e0b] font-mono mt-1">
                  {stats.isLoading ? (
                    <span className="inline-block w-6 h-4 bg-[#1e293b] animate-pulse rounded" />
                  ) : (
                    stats.rulesCount ?? 0
                  )}
                </div>
                <div className="text-[9px] text-[#64748b] font-mono mt-0.5">Statutory Rules</div>
              </div>

            </div>

            {/* Database Telemetry & Connection Health Banner */}
            <div className="bg-[#070a14] border border-[#1e293b] rounded-lg px-3.5 py-2.5 flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#10b981]" />
                <span className="text-xs font-semibold text-[#cbd5e1]">PostgREST Cloud Database</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
                <span className="text-xs font-mono font-bold text-[#10b981]">
                  {stats.latencyMs !== null ? `${stats.latencyMs}ms Ping` : "Live Query"}
                </span>
              </div>
            </div>

            {/* Security Boundary Notice: Protecting Confidential / Parcel / Legal Data */}
            <div className="p-3 rounded-lg bg-[#070a14]/90 border border-[#334155]/60 text-xs">
              <div className="flex items-center gap-2 text-[#94a3b8] font-mono text-[11px] font-bold uppercase mb-1">
                <Lock className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>Statutory Access Boundary Notice</span>
              </div>
              <p className="text-[11px] text-[#64748b] leading-relaxed">
                Survey parcel identifiers, landholder records, compensation ledgers, and court stay details are confidential and restricted prior to officer identity authentication.
              </p>
            </div>

          </div>
        </div>

        {/* Bottom Institutional Disclaimer */}
        <div className="relative z-10 pt-4 border-t border-[#1e293b]/60 flex items-center justify-between text-[11px] font-mono text-[#64748b]">
          <div className="flex items-center gap-4">
            <span>RFCTLARR Act 2013</span>
            <span className="text-[#334155]">|</span>
            <span>National Highways Act 1956</span>
          </div>
          <span>Confidential · Govt. of India</span>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* RIGHT SIDE — AUTHENTICATION PANEL (42% desktop width)                     */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[42%] min-h-screen lg:h-screen flex flex-col justify-between p-6 sm:p-10 xl:p-12 overflow-y-auto bg-[#070a14]">
        
        {/* Top Header / System Identification (Mobile & Desktop) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#0c1322] border border-[#1e293b] flex items-center justify-center font-bold text-[#38bdf8] font-mono text-base">
              भ
            </div>
            <div>
              <div className="font-bold text-sm text-[#f8fafc] tracking-tight">BHUMI PLATFORM</div>
              <div className="text-[9px] font-mono text-[#64748b] tracking-wider uppercase">Govt. Command Portal</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#0c1322] border border-[#1e293b] text-[10px] font-mono text-[#94a3b8]">
            <Lock className="w-3 h-3 text-[#10b981]" />
            <span>256-BIT SSL</span>
          </div>
        </div>

        {/* Central Auth Container */}
        <div className="my-auto max-w-md w-full mx-auto py-6">
          
          {/* Session Expired Banner */}
          {sessionExpired && (
            <div className="mb-6 p-3.5 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block uppercase tracking-wider text-[10px]">Session Terminated</span>
                <span>Your previous session has timed out due to security inactivity. Please re-authenticate.</span>
              </div>
            </div>
          )}

          {/* Authentication Error Banner */}
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/40 text-[#fca5a5] text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-[#ef4444] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block uppercase tracking-wider text-[10px] text-[#ef4444]">Authentication Alert</span>
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-6 p-3.5 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 text-[#6ee7b7] text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-[#10b981] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block uppercase tracking-wider text-[10px] text-[#10b981]">Authorization Status</span>
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            </div>
          )}

          {/* Card Frame */}
          <div className="rounded-2xl bg-[#0b1021] border border-[#1e293b] p-6 sm:p-8 shadow-xl">
            
            {/* =================================================================== */}
            {/* STATE 1: LOGIN FORM                                                 */}
            {/* =================================================================== */}
            {mode === "LOGIN" && (
              <>
                <div className="mb-6">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-[#38bdf8] font-bold block mb-1">
                    Officer Portal Access
                  </span>
                  <h2 className="text-2xl font-extrabold text-[#f8fafc] tracking-tight font-sans">
                    WELCOME BACK
                  </h2>
                  <p className="text-xs text-[#94a3b8] mt-1">
                    Sign in to your command dashboard.
                  </p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  
                  {/* Field: Official Email / Officer ID */}
                  <div>
                    <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5 uppercase tracking-wide text-[11px]">
                      Official Email / Officer ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={emailOrId}
                        onChange={(e) => setEmailOrId(e.target.value)}
                        placeholder="Enter your official email or officer ID"
                        disabled={loading}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#070a14] border border-[#1e293b] text-sm text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-colors disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* Field: Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-[#cbd5e1] uppercase tracking-wide text-[11px]">
                        Password
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        disabled={loading}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#070a14] border border-[#1e293b] text-sm text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-colors pr-10 disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8] transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Device Checkbox */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.target.checked)}
                        className="w-4 h-4 rounded bg-[#070a14] border-[#1e293b] text-[#0284c7] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-xs text-[#94a3b8] font-medium">Remember this device</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setMode("FORGOT_PASSWORD");
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs font-medium text-[#38bdf8] hover:text-[#7dd3fc] transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Primary Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Verifying Credentials...</span>
                        </>
                      ) : (
                        <>
                          <span>SIGN IN</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                </form>

                {/* Quick-Fill Demonstration Utility */}
                <div className="mt-4 pt-4 border-t border-[#1e293b] text-center space-y-2.5">
                  <button
                    type="button"
                    onClick={handleQuickFill}
                    className="text-[11px] font-mono text-[#64748b] hover:text-[#38bdf8] transition-colors inline-flex items-center gap-1.5"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>[ Load Authorized Admin Demo Credentials ]</span>
                  </button>

                  <div>
                    <Link
                      href="/field/login"
                      className="text-[11px] font-mono text-[#10b981] hover:text-[#34d399] hover:underline transition-colors inline-flex items-center gap-1.5"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Switch to Field Officer Mobile Login →</span>
                    </Link>
                  </div>

                  <div>
                    <Link
                      href="/landowner/login"
                      className="text-[11px] font-mono text-teal-400 hover:text-teal-300 hover:underline transition-colors inline-flex items-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Switch to Citizen / Landowner Portal →</span>
                    </Link>
                  </div>
                </div>
              </>
            )}

            {/* =================================================================== */}
            {/* STATE 2: FORGOT PASSWORD FORM                                       */}
            {/* =================================================================== */}
            {mode === "FORGOT_PASSWORD" && (
              <>
                <div className="mb-6">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-[#38bdf8] font-bold block mb-1">
                    Credential Recovery
                  </span>
                  <h2 className="text-xl font-extrabold text-[#f8fafc] tracking-tight font-sans">
                    RESET CREDENTIALS
                  </h2>
                  <p className="text-xs text-[#94a3b8] mt-1">
                    Enter your official government email to receive password recovery instructions.
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5 uppercase tracking-wide text-[11px]">
                      Official Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={emailOrId}
                      onChange={(e) => setEmailOrId(e.target.value)}
                      placeholder="e.g. officer@bhumi.gov.in"
                      disabled={loading}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#070a14] border border-[#1e293b] text-sm text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-colors disabled:opacity-60"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Dispatching Instructions...</span>
                        </>
                      ) : (
                        <>
                          <span>DISPATCH RECOVERY LINK</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("LOGIN");
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs font-medium text-[#94a3b8] hover:text-[#f8fafc] transition-colors"
                    >
                      ← Return to Officer Sign In
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* =================================================================== */}
            {/* STATE 3: UPDATE NEW PASSWORD FORM                                   */}
            {/* =================================================================== */}
            {mode === "UPDATE_PASSWORD" && (
              <>
                <div className="mb-6">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-[#38bdf8] font-bold block mb-1">
                    Statutory Protocol
                  </span>
                  <h2 className="text-xl font-extrabold text-[#f8fafc] tracking-tight font-sans">
                    SET NEW PASSWORD
                  </h2>
                  <p className="text-xs text-[#94a3b8] mt-1">
                    Establish updated access credentials for your command dashboard account.
                  </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5 uppercase tracking-wide text-[11px]">
                      New Security Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      disabled={loading}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#070a14] border border-[#1e293b] text-sm text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-colors disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5 uppercase tracking-wide text-[11px]">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      disabled={loading}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#070a14] border border-[#1e293b] text-sm text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-colors disabled:opacity-60"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Updating Credentials...</span>
                        </>
                      ) : (
                        <>
                          <span>UPDATE CREDENTIALS</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

          </div>

        </div>

        {/* Bottom Notice: Institutional Security Declaration */}
        <div className="pt-6 border-t border-[#1e293b]/60 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#cbd5e1] mb-1">
            <Shield className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Secure Government Access</span>
          </div>
          <div className="text-[10px] font-mono text-[#64748b] tracking-wider uppercase">
            Authorized Personnel Only · Audit Logged by NIC CISO
          </div>
        </div>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="w-full h-screen bg-[#070a14] flex items-center justify-center text-[#64748b] font-mono text-xs">
        Initializing secure terminal...
      </div>
    }>
      <LoginPageContent />
    </React.Suspense>
  );
}
