"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSafeRedirectUrl } from "@/lib/routes";
import { 
  Users, 
  ArrowRight, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Mail, 
  UserPlus
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createOrUpdateLandownerProfile } from "@/lib/api";
import { toUuid } from "@/lib/supabase/supabaseService";
import { ThemeToggle } from "@/components/common/ThemeToggle";

function LandownerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Flow states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Instant Demo Citizen Login
  const handleInstantDemoLogin = () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg("Citizen verification accepted. Loading Landowner Grievance Portal...");

    const sessionPayload = {
      user_id: "O00004",
      owner_id: "O00004",
      name: "Geeta Meena",
      email: "geeta.meena@bhumi.in",
      contact_village: "Chandwas (V03)",
      role: "LANDOWNER"
    };

    document.cookie = "bhumi_user_role=LANDOWNER; path=/; max-age=604800; SameSite=Lax";
    document.cookie = `bhumi_landowner_session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=${86400 * 7}; SameSite=Lax`;
    document.cookie = "bhumi_officer_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";

    setTimeout(() => {
      const destination = getSafeRedirectUrl("LANDOWNER", searchParams.get("next"));
      window.location.href = destination;
    }, 500);
  };

  // Simple Email + Password Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid official email address.");
      return;
    }

    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      // 1. Authenticate against Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (error) {
        // If email confirmation was pending in Supabase, allow direct entry
        if (error.message.includes("Email not confirmed")) {
          const uid = toUuid(cleanEmail);
          const userName = cleanEmail.split("@")[0];
          try {
            await createOrUpdateLandownerProfile({
              user_id: uid,
              name: userName,
              email: cleanEmail,
              contact_village: "Corridor Sector"
            });
          } catch (profileErr) {
            console.warn("Could not sync profile to backend immediately:", profileErr);
          }

          const sessionPayload = {
            user_id: uid,
            owner_id: uid,
            name: userName,
            email: cleanEmail,
            role: "LANDOWNER"
          };
          const loCookieVal = encodeURIComponent(JSON.stringify(sessionPayload));
          document.cookie = "kosh_user_role=LANDOWNER; path=/; max-age=604800; SameSite=Lax";
          document.cookie = "bhumi_user_role=LANDOWNER; path=/; max-age=604800; SameSite=Lax";
          document.cookie = `kosh_landowner_session=${loCookieVal}; path=/; max-age=${86400 * 7}; SameSite=Lax`;
          document.cookie = `bhumi_landowner_session=${loCookieVal}; path=/; max-age=${86400 * 7}; SameSite=Lax`;
          document.cookie = "kosh_officer_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
          document.cookie = "bhumi_officer_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";

          setSuccessMsg("Authentication verified! Entering Landowner Portal...");
          setTimeout(() => {
            const destination = getSafeRedirectUrl("LANDOWNER", searchParams.get("next"));
            window.location.href = destination;
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

      // 2. Login succeeded with Supabase Auth
      const userId = data.user?.id || toUuid(cleanEmail);
      const userName = data.user?.user_metadata?.full_name || cleanEmail.split("@")[0];

      try {
        await createOrUpdateLandownerProfile({
          user_id: userId,
          name: userName,
          email: cleanEmail
        });
      } catch (profileErr) {
        console.warn("Could not sync profile to backend immediately:", profileErr);
      }

      const sessionPayload = {
        user_id: userId,
        owner_id: userId,
        name: userName,
        email: cleanEmail,
        role: "LANDOWNER"
      };
      const authLoCookie = encodeURIComponent(JSON.stringify(sessionPayload));
      document.cookie = "kosh_user_role=LANDOWNER; path=/; max-age=604800; SameSite=Lax";
      document.cookie = "bhumi_user_role=LANDOWNER; path=/; max-age=604800; SameSite=Lax";
      document.cookie = `kosh_landowner_session=${authLoCookie}; path=/; max-age=${86400 * 7}; SameSite=Lax`;
      document.cookie = `bhumi_landowner_session=${authLoCookie}; path=/; max-age=${86400 * 7}; SameSite=Lax`;
      document.cookie = "kosh_officer_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
      document.cookie = "bhumi_officer_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";

      setSuccessMsg("Login successful! Loading Landowner Portal...");
      setTimeout(() => {
        const destination = getSafeRedirectUrl("LANDOWNER", searchParams.get("next"));
        window.location.href = destination;
      }, 600);

    } catch (err: any) {
      setErrorMsg(`Connection error: ${err?.message || "Failed to contact authentication server."}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] dark:bg-[#07080F] text-[#14213D] dark:text-[#F0F4FF] flex flex-col justify-between p-4 transition-colors duration-200">
      <div className="w-full max-w-md mx-auto space-y-4 pt-6 pb-12">
        
        {/* Top bar with Theme Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[4px] bg-[#0B2E59] text-amber-400 flex items-center justify-center font-black text-xs border border-[#0B2E59]">
              क
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#5A6A80] dark:text-slate-400">
              CALA · Landowner Portal
            </span>
          </div>
          <ThemeToggle variant="icon" className="!rounded-[4px] border border-[#DCE2E8] dark:border-white/10" />
        </div>

        {/* Header Branding */}
        <div className="text-center space-y-1.5 pt-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[4px] bg-[#0B2E59] text-amber-400 shadow-sm mb-1 border border-[#082242]">
            <Users className="w-6 h-6" />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#B36B00] dark:text-amber-400">
            RFCTLARR 2013 Statutory Compliance
          </div>
          <h1 className="text-xl font-bold font-display tracking-tight text-[#0B2E59] dark:text-white">
            KOSH Landowner & Citizen Portal
          </h1>
          <p className="text-xs text-[#5A6A80] dark:text-slate-400 max-w-xs mx-auto">
            Grievance Redressal, Cadastral Boundary Registry & Compensation Tracking
          </p>
        </div>

        {/* Feedback Messages */}
        {successMsg && (
          <div className="p-3 rounded-[4px] bg-[#E8F5E9] dark:bg-emerald-950/40 border border-[#C8E6C9] dark:border-emerald-800/50 text-[#1E7E34] dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#1E7E34] dark:text-emerald-400" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-[4px] bg-[#FFEBEE] dark:bg-rose-950/40 border border-[#FFCDD2] dark:border-rose-800/50 text-[#B32424] dark:text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#B32424] dark:text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form Card */}
        <div className="bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 rounded-[4px] p-5 shadow-sm space-y-4 transition-colors duration-200">
          <div className="border-b border-[#DCE2E8] dark:border-white/10 pb-3 space-y-1">
            <span className="text-[10px] font-mono tracking-widest uppercase text-[#0B2E59] dark:text-sky-400 font-bold block">
              Citizen Portal Access
            </span>
            <h2 className="text-sm font-bold text-[#14213D] dark:text-white">
              Sign In to Your Account
            </h2>
            <p className="text-[11px] text-[#5A6A80] dark:text-slate-400">
              Enter your registered email and password to access your land parcels and grievance dashboard.
            </p>
          </div>

          {/* Instant Citizen Demo Access */}
          <div className="bg-[#FFF8E6] dark:bg-amber-950/30 border border-[#FFE29A] dark:border-amber-800 p-3 rounded-none text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#B36B00] dark:text-amber-300 text-[11px] uppercase tracking-wider">
                Titleholder Demo Access
              </span>
              <span className="text-[9px] font-mono bg-[#B36B00] text-white px-1 py-0.2 rounded-none font-bold">
                1-TAP
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
              Test citizen grievance submission & parcel tracking as <strong>Geeta Meena</strong>:
            </p>
            <button
              type="button"
              onClick={handleInstantDemoLogin}
              disabled={loading}
              className="w-full py-2 px-3 bg-[#B36B00] hover:bg-[#8F5500] text-white font-bold text-xs rounded-none transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Instant Citizen Portal Demo Login &rarr;</span>
            </button>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[#14213D] dark:text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#5A6A80] dark:text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#CBD5E1] dark:border-white/15 text-[#14213D] dark:text-white placeholder-[#5A6A80] dark:placeholder-slate-600 focus:outline-none focus:border-[#0B2E59] dark:focus:border-sky-400 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#14213D] dark:text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#5A6A80] dark:text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-3 py-2 rounded-[4px] bg-[#F8FAFC] dark:bg-[#07080F] border border-[#CBD5E1] dark:border-white/15 text-[#14213D] dark:text-white placeholder-[#5A6A80] dark:placeholder-slate-600 focus:outline-none focus:border-[#0B2E59] dark:focus:border-sky-400 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>SIGN IN TO CITIZEN PORTAL</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-[#DCE2E8] dark:border-white/10 flex items-center justify-between text-xs text-[#5A6A80] dark:text-slate-400">
            <span>New titleholder?</span>
            <Link href="/landowner/register" className="text-[#0B2E59] dark:text-sky-400 hover:underline font-bold inline-flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register New Account →</span>
            </Link>
          </div>
        </div>

        {/* Cross-Role Links */}
        <div className="pt-2 text-center space-y-1.5 border-t border-[#DCE2E8] dark:border-white/10">
          <p className="text-[11px] text-[#5A6A80] dark:text-slate-400">
            Authorized Personnel Navigation
          </p>
          <div className="flex justify-center gap-4 text-xs font-semibold">
            <Link href="/field/login" className="text-[#1E7E34] dark:text-emerald-400 hover:underline">
              Field Officer Console →
            </Link>
            <Link href="/login" className="text-[#0B2E59] dark:text-sky-400 hover:underline">
              Admin Web Console →
            </Link>
          </div>
        </div>

      </div>

      <div className="text-center text-[10px] font-mono text-[#5A6A80] dark:text-slate-400 py-3 border-t border-[#DCE2E8] dark:border-white/10">
        KOSH Land Records Management System · Prototype (SIH26016) · PostGIS & NetworkX Causal Graph
      </div>
    </div>
  );
}

export default function LandownerLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F4F6F8] dark:bg-[#07080F] flex items-center justify-center text-xs font-mono text-slate-400">
        Loading Landowner Authentication...
      </div>
    }>
      <LandownerLoginContent />
    </Suspense>
  );
}
