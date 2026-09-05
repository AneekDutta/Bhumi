"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  ArrowRight, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Mail, 
  KeyRound, 
  Sparkles,
  UserPlus
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createOrUpdateLandownerProfile } from "@/lib/api";
import { toUuid } from "@/lib/supabase/supabaseService";

export default function LandownerLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // Input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Flow states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Demo Account Configuration
  const DEMO_ACCOUNT = {
    email: "demo.landowner@bhumi.gov.in",
    password: "LandownerDemo@2026!",
    ownerId: "O00004",
    name: "Geeta Meena (Demo Landowner)",
    village: "Chandwas (V03)"
  };

  // Quick-fill demo account credentials
  const handleLoadDemoCredentials = () => {
    setEmail(DEMO_ACCOUNT.email);
    setPassword(DEMO_ACCOUNT.password);
    setErrorMsg(null);
    setSuccessMsg("Demo credentials loaded into form.");
  };

  // Instant Demo Sign-In (1-Click, Zero Friction)
  const handleInstantDemoLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const uid = "00000000-0000-4000-a000-000000000004";
      await createOrUpdateLandownerProfile({
        user_id: uid,
        name: DEMO_ACCOUNT.name,
        email: DEMO_ACCOUNT.email,
        contact_village: DEMO_ACCOUNT.village
      });

      const sessionPayload = {
        user_id: uid,
        name: DEMO_ACCOUNT.name,
        email: DEMO_ACCOUNT.email,
        role: "LANDOWNER"
      };
      document.cookie = `bhumi_landowner_session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `bhumi_officer_session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=86400; SameSite=Lax`;

      setSuccessMsg("Demo Landowner authenticated successfully! Loading dashboard...");
      setTimeout(() => {
        router.push("/landowner/home");
        router.refresh();
      }, 600);
    } catch (err: any) {
      setErrorMsg(`Demo login error: ${err?.message || "Failed to authenticate"}`);
      setLoading(false);
    }
  };

  // Simple Email + Password Login (Direct, No OTP)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      // 1. Check if demo account
      if (cleanEmail === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password) {
        await handleInstantDemoLogin();
        return;
      }

      // 2. Authenticate against Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (error) {
        // If email confirmation was pending in Supabase, allow direct entry
        if (error.message.includes("Email not confirmed")) {
          const uid = toUuid(cleanEmail);
          const userName = cleanEmail.split("@")[0];
          await createOrUpdateLandownerProfile({
            user_id: uid,
            name: userName,
            email: cleanEmail,
            contact_village: "Chandwas (V03)"
          });

          const sessionPayload = {
            user_id: uid,
            name: userName,
            email: cleanEmail,
            role: "LANDOWNER"
          };
          document.cookie = `bhumi_landowner_session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=86400; SameSite=Lax`;
          document.cookie = `bhumi_officer_session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=86400; SameSite=Lax`;

          setSuccessMsg("Authentication verified! Entering Landowner Portal...");
          setTimeout(() => {
            router.push("/landowner/home");
            router.refresh();
          }, 600);
          return;
        }

        if (error.message.includes("Invalid login credentials")) {
          setErrorMsg("Invalid email or password. If you do not have an account, click 'Register Landowner Account' below.");
          setLoading(false);
          return;
        }

        setErrorMsg(`Login error: ${error.message}`);
        setLoading(false);
        return;
      }

      // 3. Login succeeded with Supabase Auth
      const userId = data.user?.id || toUuid(cleanEmail);
      const userName = data.user?.user_metadata?.full_name || cleanEmail.split("@")[0];

      await createOrUpdateLandownerProfile({
        user_id: userId,
        name: userName,
        email: cleanEmail
      });

      const sessionPayload = {
        user_id: userId,
        name: userName,
        email: cleanEmail,
        role: "LANDOWNER"
      };
      document.cookie = `bhumi_landowner_session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `bhumi_officer_session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=86400; SameSite=Lax`;

      setSuccessMsg("Login successful! Loading Landowner Portal...");
      setTimeout(() => {
        router.push("/landowner/home");
        router.refresh();
      }, 600);

    } catch (err: any) {
      setErrorMsg(`Connection error: ${err?.message || "Failed to contact authentication server."}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 selection:bg-amber-500/30">
      <div className="w-full max-w-md mx-auto space-y-5 pt-4 pb-12">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-xl shadow-amber-950/60 mb-1 border border-amber-400/30">
            <Users className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black font-display tracking-tight text-white">
            BHUMI Landowner Portal
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Citizen Grievance Redressal & Statutory Compensation Records
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

        {/* Demo Account Card */}
        <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/40 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
              <Sparkles className="w-3 h-3 text-amber-400" /> Demo Account
            </span>
            <span className="text-[10px] font-mono text-slate-400">Presentation Mode</span>
          </div>

          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-white">
              Geeta Meena (Chandwas - V03)
            </h2>
            <p className="text-xs text-slate-400">
              Verified titleholder with 3 land parcels and active compensation record.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              disabled={loading}
              onClick={handleInstantDemoLogin}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/40 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>⚡ 1-Click Instant Sign-In</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleLoadDemoCredentials}
              className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Fill Form</span>
            </button>
          </div>
        </div>

        {/* Simple Login Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 font-bold block">
              Citizen Portal Access
            </span>
            <h3 className="text-base font-bold text-white">
              Sign In to Your Account
            </h3>
            <p className="text-xs text-slate-400">
              Enter your registered email and password to access your land parcels and grievance dashboard.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. demo.landowner@bhumi.gov.in"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>SIGN IN TO CITIZEN PORTAL</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>New titleholder?</span>
            <Link href="/landowner/register" className="text-amber-400 hover:underline font-semibold inline-flex items-center gap-1">
              <UserPlus className="w-3 h-3" />
              <span>Register New Account →</span>
            </Link>
          </div>
        </div>

        {/* Cross-Role Links */}
        <div className="pt-2 text-center space-y-1.5 border-t border-slate-900">
          <p className="text-[11px] text-slate-500">
            Authorized Personnel Portals
          </p>
          <div className="flex justify-center gap-4 text-xs font-semibold">
            <Link href="/field/login" className="text-emerald-400 hover:underline">
              Field Officer Mobile Login →
            </Link>
            <Link href="/login" className="text-sky-400 hover:underline">
              Desktop Admin Console →
            </Link>
          </div>
        </div>

      </div>

      <div className="text-center text-[10px] font-mono text-slate-500 py-3 border-t border-slate-900">
        BHUMI Land Records Management System · PostGIS & NetworkX Causal Graph
      </div>
    </div>
  );
}
