"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, 
  ShieldCheck, 
  MapPin, 
  ArrowRight, 
  FileText, 
  Layers, 
  Monitor, 
  Smartphone, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  AlertTriangle,
  Building2,
  KeyRound
} from "lucide-react";
import { getLandowners, Landowner } from "@/lib/supabase/supabaseService";

export default function LandownerLoginPage() {
  const router = useRouter();
  const [landowners, setLandowners] = useState<Landowner[]>([]);
  const [loading, setLoading] = useState(false);
  const [ownerIdInput, setOwnerIdInput] = useState("O00004");
  const [otpInput, setOtpInput] = useState("123456");
  const [loginMode, setLoginMode] = useState<"DEMO" | "CREDENTIALS">("DEMO");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getLandowners();
        if (data && data.length > 0) {
          setLandowners(data);
        }
      } catch {}
    }
    load();
  }, []);

  const loginAsLandowner = (owner: Landowner) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(`Signing in as ${owner.name} (Citizen ID: ${owner.owner_id})...`);

    const sessionData = {
      owner_id: owner.owner_id,
      name: owner.name,
      contact_village: owner.contact_village,
      owner_type: owner.owner_type,
      role: "LANDOWNER"
    };

    document.cookie = `bhumi_officer_session=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=604800; SameSite=Lax`;

    setTimeout(() => {
      router.push("/landowner/home");
      router.refresh();
    }, 500);
  };

  const handleInstantDemoLogin = () => {
    const defaultOwner = landowners[0] || {
      id: "O00004",
      owner_id: "O00004",
      name: "Geeta Meena",
      owner_type: "individual",
      contact_village: "Chandwas (V03)",
      parcels_count: 3
    };
    loginAsLandowner(defaultOwner);
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const match = landowners.find(
      (o) => o.owner_id.toUpperCase() === ownerIdInput.trim().toUpperCase()
    );

    if (!match && !ownerIdInput.toUpperCase().startsWith("O")) {
      setErrorMsg("Landowner ID not recognized. Use demo ID O00004 or select from the demo profiles.");
      return;
    }

    const ownerToLogin: Landowner = match || {
      id: ownerIdInput.trim().toUpperCase(),
      owner_id: ownerIdInput.trim().toUpperCase(),
      name: "Citizen Landowner (Verified)",
      owner_type: "individual",
      contact_village: "Ramganj Mandi (V02)",
      parcels_count: 2
    };

    loginAsLandowner(ownerToLogin);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 selection:bg-emerald-500/30">
      <div className="w-full max-w-md mx-auto space-y-5 pt-4 pb-12">
        
        {/* Institutional Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-950/60 mb-1 border border-emerald-400/30">
            <span className="text-2xl font-bold font-display">भ</span>
          </div>
          <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            PM GatiShakti · Citizen Grievance Portal
          </div>
          <h1 className="text-2xl font-black font-display tracking-tight text-white">
            Landowner Portal
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Direct citizen access for land records, compensation tracking & grievance escalation
          </p>
        </div>

        {/* Feedback Messages */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1-TAP DEMO CITIZEN ACCESS                                                */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-2 border-emerald-500/40 rounded-2xl p-4 shadow-xl shadow-emerald-950/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <Sparkles className="w-3 h-3 text-emerald-400" /> 1-Tap Citizen Access
            </span>
            <span className="text-[10px] font-mono text-slate-400">NH-927A Corridor</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">
              Instant Citizen Demo
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Login immediately as <strong className="text-emerald-300">Geeta Meena (O00004)</strong> with 3 authorized land parcels in Chandwas, award ledger details, and 1 active compensation grievance.
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleInstantDemoLogin}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authenticating Citizen...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Enter Citizen Portal as Geeta Meena</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Tab switcher: Quick Profiles vs ID + OTP */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setLoginMode("DEMO")}
            className={`flex-1 py-2 rounded-lg transition-all text-center ${
              loginMode === "DEMO"
                ? "bg-slate-800 text-white shadow-sm font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Registered Citizens ({landowners.length})
          </button>
          <button
            type="button"
            onClick={() => setLoginMode("CREDENTIALS")}
            className={`flex-1 py-2 rounded-lg transition-all text-center ${
              loginMode === "CREDENTIALS"
                ? "bg-slate-800 text-white shadow-sm font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Owner ID & OTP
          </button>
        </div>

        {/* MODE 1: SELECT CITIZEN PROFILE */}
        {loginMode === "DEMO" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
              <span>Select Citizen Record</span>
              <span className="text-[10px] font-mono text-emerald-400">1-Tap Login</span>
            </div>

            <div className="space-y-2">
              {landowners.map((owner) => (
                <button
                  key={owner.owner_id}
                  type="button"
                  disabled={loading}
                  onClick={() => loginAsLandowner(owner)}
                  className="w-full text-left p-3.5 rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-800/90 hover:border-emerald-500/50 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                        {owner.name}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-300">
                        {owner.owner_id}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                      <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                      <span>{owner.contact_village}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      {owner.parcels_count || 2} Parcels
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MODE 2: OWNER ID + OTP */}
        {loginMode === "CREDENTIALS" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">
                Citizen Identity Verification
              </h3>
              <p className="text-xs text-slate-400">
                Enter your assigned Landowner ID or Aadhar-linked mobile number.
              </p>
            </div>

            <form onSubmit={handleFormLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                  Landowner ID / Khasra Ref
                </label>
                <input
                  type="text"
                  required
                  value={ownerIdInput}
                  onChange={(e) => setOwnerIdInput(e.target.value)}
                  placeholder="e.g. O00004 or O00002"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                  Verification OTP (Demo PIN)
                </label>
                <input
                  type="password"
                  required
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="6-digit OTP (demo: 123456)"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Identity...</span>
                  </>
                ) : (
                  <>
                    <span>SIGN IN TO CITIZEN PORTAL</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Role Switchers at Bottom */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2 text-center text-xs">
          <div>
            <Link
              href="/field/login"
              className="text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Are you a Field Officer? Switch to Field Ops Login →</span>
            </Link>
          </div>
          <div>
            <Link
              href="/login"
              className="text-slate-400 hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5"
            >
              <Monitor className="w-3.5 h-3.5 text-indigo-400" />
              <span>Are you a CALA Administrator? Go to Command Portal →</span>
            </Link>
          </div>
        </div>

      </div>

      <div className="text-center text-[10px] font-mono text-slate-500 py-3 border-t border-slate-900">
        RFCTLARR Act 2013 · Citizen Rights & Grievance Redressal
      </div>
    </div>
  );
}
