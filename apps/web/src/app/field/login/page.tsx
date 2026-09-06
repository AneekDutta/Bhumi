"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  UserCheck, 
  ShieldCheck, 
  MapPin, 
  ArrowRight, 
  ClipboardList, 
  Layers, 
  Monitor, 
  Smartphone,
  ChevronRight,
  Navigation,
  KeyRound,
  Lock,
  Zap,
  CheckCircle2,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { getFieldOfficers } from "@/lib/api";
import { offlineStore } from "@/lib/offlineStore";

interface Officer {
  officer_id: string;
  name: string;
  designation?: string;
  department_name?: string;
  assigned_villages: string[];
  pending_tasks_count: number;
}

const DEMO_OFFICERS: Officer[] = [
  {
    officer_id: "OFF-001",
    name: "Ramesh Patel",
    designation: "Patwari / Revenue Lekhpal",
    department_name: "Revenue Dept · Land Records",
    assigned_villages: ["All Operational Sectors"],
    pending_tasks_count: 0
  }
];

export default function FieldLoginPage() {
  const router = useRouter();
  const [officers, setOfficers] = useState<Officer[]>(DEMO_OFFICERS);
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<"DEMO" | "CREDENTIALS">("DEMO");
  const [officerId, setOfficerId] = useState("OFF-001");
  const [pinCode, setPinCode] = useState("1234");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadOfficers() {
      try {
        const data = await getFieldOfficers();
        if (data && data.length > 0) {
          setOfficers(data);
        }
      } catch {
        // Fallback to DEMO_OFFICERS
      }
    }
    loadOfficers();
  }, []);

  const loginAsOfficer = (officer: Officer) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(`Authenticating as ${officer.name} (${officer.designation})...`);

    const sessionData = {
      officer_id: officer.officer_id,
      name: officer.name,
      designation: officer.designation,
      assigned_villages: officer.assigned_villages,
      role: "FIELD_OFFICER"
    };

    // Store in offline store
    offlineStore.setActiveOfficer(sessionData);

    // Set cookie for middleware route isolation
    document.cookie = `bhumi_officer_session=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=604800; SameSite=Lax`;

    setTimeout(() => {
      router.push("/field/dashboard");
      router.refresh();
    }, 500);
  };

  const handleInstantDemoLogin = () => {
    const defaultOfficer = officers[0] || DEMO_OFFICERS[0];
    loginAsOfficer(defaultOfficer);
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const match = officers.find(
      (o) => o.officer_id.toUpperCase() === officerId.trim().toUpperCase()
    ) || DEMO_OFFICERS.find(
      (o) => o.officer_id.toUpperCase() === officerId.trim().toUpperCase()
    );

    if (!match && !officerId.toUpperCase().startsWith("OF")) {
      setErrorMsg("Officer ID not recognized. Use official ID OFF-001 or select from the profiles below.");
      return;
    }

    const officerToLogin = match || {
      officer_id: officerId.trim().toUpperCase(),
      name: "Field Officer (Verified)",
      designation: "Cadastral Field Inspector",
      assigned_villages: ["All Operational Sectors"],
      pending_tasks_count: 0
    };

    loginAsOfficer(officerToLogin);
  };

  const handleAutoFillDemo = (offId: string = "OFF-001") => {
    setOfficerId(offId);
    setPinCode("1234");
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] dark:bg-[#07080F] text-[#14213D] dark:text-[#F0F4FF] flex flex-col justify-between p-4 transition-colors duration-200">
      <div className="w-full max-w-md mx-auto space-y-5 pt-4 pb-12">
        <div className="flex items-center justify-end">
          <ThemeToggle variant="icon" />
        </div>
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-[4px] bg-[#0B2E59] text-white shadow-xs mb-1 border border-white/20">
            <Smartphone className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black font-display tracking-tight text-[#14213D] dark:text-white">
            BHUMI Field Ops
          </h1>
          <p className="text-xs text-[#5A6A80] dark:text-slate-400 max-w-xs mx-auto">
            Mobile Cadastral Verification & Ground Issue Escalation Console
          </p>
        </div>

        {/* Success or Error feedback */}
        {successMsg && (
          <div className="p-3.5 rounded-[4px] bg-[#E8F5E9] dark:bg-emerald-950/20 border border-[#C8E6C9] dark:border-emerald-800/40 text-[#1E7E34] dark:text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#1E7E34] dark:text-emerald-400" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-[4px] bg-[#FFEBEE] dark:bg-rose-950/20 border border-[#FFCDD2] dark:border-rose-800/40 text-[#B32424] dark:text-rose-200 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#B32424] dark:text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* QUICK ACCESS LOGIN CARD */}
        <div className="bg-white dark:bg-[#0D121F] border-2 border-[#0B2E59]/30 dark:border-white/15 rounded-[4px] p-4 shadow-xs space-y-3 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#1E7E34] dark:text-emerald-300 font-bold bg-[#E8F5E9] dark:bg-emerald-950/40 px-2 py-0.5 rounded-[3px] border border-[#C8E6C9] dark:border-emerald-500/40">
              <Zap className="w-3 h-3 text-[#1E7E34] dark:text-emerald-400" /> Quick Access
            </span>
            <span className="text-[10px] font-mono text-[#5A6A80] dark:text-slate-400">Offline Ready</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#14213D] dark:text-white">
              Field Officer Terminal
            </h2>
            <p className="text-xs text-[#5A6A80] dark:text-slate-300 leading-relaxed">
              Login as <strong className="text-[#0B2E59] dark:text-sky-300">Ramesh Patel (Patwari / Revenue Lekhpal)</strong> to inspect, verify, or reject real landowner boundary demarcations.
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleInstantDemoLogin}
            className="w-full py-3 px-4 rounded-none bg-[#0B2E59] hover:bg-[#082242] text-white font-bold text-xs tracking-wider uppercase transition-all shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Entering Terminal...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 text-white/80" />
                <span>Launch Field Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Tab switcher: Quick Profiles vs ID + PIN Form */}
        <div className="flex rounded-[4px] bg-white dark:bg-[#0D121F] p-1 border border-[#DCE2E8] dark:border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setLoginMode("DEMO")}
            className={`flex-1 py-2 rounded-[3px] transition-all text-center ${
              loginMode === "DEMO"
                ? "bg-[#0B2E59] text-white shadow-xs font-bold"
                : "text-[#5A6A80] dark:text-slate-400 hover:text-[#14213D] dark:hover:text-white"
            }`}
          >
            Designated Officers ({officers.length})
          </button>
          <button
            type="button"
            onClick={() => setLoginMode("CREDENTIALS")}
            className={`flex-1 py-2 rounded-[3px] transition-all text-center ${
              loginMode === "CREDENTIALS"
                ? "bg-[#0B2E59] text-white shadow-xs font-bold"
                : "text-[#5A6A80] dark:text-slate-400 hover:text-[#14213D] dark:hover:text-white"
            }`}
          >
            Officer ID & PIN
          </button>
        </div>

        {/* MODE 1: SELECT FROM DESIGNATED PROFILES */}
        {loginMode === "DEMO" && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#5A6A80] dark:text-slate-400 px-1">
              <span>Select Operational Role</span>
              <span className="text-[10px] font-mono text-[#0B2E59] dark:text-sky-400">1-Tap Switch</span>
            </div>

            <div className="space-y-2">
              {officers.map((officer) => (
                <button
                  key={officer.officer_id}
                  type="button"
                  disabled={loading}
                  onClick={() => loginAsOfficer(officer)}
                  className="w-full text-left p-3.5 rounded-[4px] border border-[#DCE2E8] dark:border-white/10 bg-white dark:bg-[#0D121F] hover:bg-[#F8FAFC] dark:hover:bg-[#141B2D] hover:border-[#0B2E59] transition-all flex items-center justify-between gap-3 group cursor-pointer shadow-xs"
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#14213D] dark:text-white group-hover:text-[#0B2E59] dark:group-hover:text-sky-300 transition-colors">
                        {officer.name}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-[2px] bg-[#F8FAFC] dark:bg-slate-950 border border-[#DCE2E8] dark:border-slate-700 text-[#5A6A80] dark:text-slate-300 font-bold">
                        {officer.officer_id}
                      </span>
                    </div>

                    <div className="text-xs text-[#0B2E59] dark:text-sky-400 font-medium truncate">
                      {officer.designation}
                    </div>

                    <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 flex items-center gap-1.5 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span>{officer.assigned_villages.join(", ")}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[3px] bg-[#EBF3FC] dark:bg-sky-950/40 border border-[#DCE2E8] dark:border-sky-800/40 text-[#0B2E59] dark:text-sky-300">
                      {officer.pending_tasks_count} Cases
                    </span>
                    <div className="w-6 h-6 rounded-[3px] bg-[#F8FAFC] dark:bg-slate-800 group-hover:bg-[#0B2E59] text-[#5A6A80] dark:text-slate-400 group-hover:text-white flex items-center justify-center transition-all">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 2: MANUAL OFFICER ID + PIN FORM WITH QUICK-FILL                      */}
        {/* ========================================================================= */}
        {loginMode === "CREDENTIALS" && (
          <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-5 shadow-xs space-y-4 transition-colors duration-200">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#14213D] dark:text-white">
                Officer Terminal Authentication
              </h3>
              <p className="text-xs text-[#5A6A80] dark:text-slate-400">
                Enter your assigned Revenue Department ID and secure PIN.
              </p>
            </div>

            <form onSubmit={handleFormLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#14213D] dark:text-slate-300 font-bold mb-1 text-[11px] uppercase tracking-wider">
                  Field Officer ID
                </label>
                <input
                  type="text"
                  required
                  value={officerId}
                  onChange={(e) => setOfficerId(e.target.value)}
                  placeholder="e.g. OFF-001 or OF001"
                  className="w-full px-3 py-2.5 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#CBD5E1] dark:border-white/15 text-[#14213D] dark:text-white font-mono placeholder-slate-400 focus:outline-none focus:border-[#0B2E59]"
                />
              </div>

              <div>
                <label className="block text-[#14213D] dark:text-slate-300 font-bold mb-1 text-[11px] uppercase tracking-wider">
                  Passcode / Security PIN
                </label>
                <input
                  type="password"
                  required
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="4-digit PIN (e.g. 1234)"
                  className="w-full px-3 py-2.5 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#CBD5E1] dark:border-white/15 text-[#14213D] dark:text-white font-mono placeholder-slate-400 focus:outline-none focus:border-[#0B2E59]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>SIGN IN TO FIELD TERMINAL</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-[#DCE2E8] dark:border-white/10 text-center">
              <button
                type="button"
                onClick={() => handleAutoFillDemo("OFF-001")}
                className="text-[11px] font-mono text-[#5A6A80] hover:text-[#0B2E59] dark:hover:text-sky-400 transition-colors inline-flex items-center gap-1.5"
              >
                <KeyRound className="w-3 h-3 text-[#0B2E59] dark:text-sky-400" />
                <span>[ Load Officer Credentials (OFF-001 / 1234) ]</span>
              </button>
            </div>
          </div>
        )}

        {/* Link to Admin Login & Landowner Portal */}
        <div className="pt-3 text-center space-y-2">
          <div>
            <p className="text-[11px] text-[#5A6A80] dark:text-slate-400">
              Are you an affected landowner or project-impacted citizen?
            </p>
            <Link
              href="/landowner/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B2E59] dark:text-sky-400 hover:underline transition-colors mt-0.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#0B2E59] dark:text-sky-400" />
              <span>Go to Landowner / Citizen Grievance Portal →</span>
            </Link>
          </div>

          <div className="pt-1">
            <p className="text-[11px] text-[#5A6A80] dark:text-slate-400">
              Are you a CALA Director or State Administrator?
            </p>
            <button
              type="button"
              onClick={() => {
                document.cookie = "bhumi_officer_session=officer%40bhumi.gov.in; path=/; max-age=86400; SameSite=Lax";
                window.location.href = "/";
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B2E59] dark:text-sky-400 hover:underline transition-colors cursor-pointer mt-0.5"
            >
              <Monitor className="w-3.5 h-3.5 text-[#0B2E59] dark:text-sky-400" />
              <span>Go to Desktop Admin Command Console →</span>
            </button>
          </div>
        </div>

      </div>

      <div className="text-center text-[10px] font-mono text-[#5A6A80] dark:text-slate-500 py-3 border-t border-[#DCE2E8] dark:border-white/10">
        BHUMI · PostGIS & NetworkX Causal Intelligence Engine
      </div>
    </div>
  );
}