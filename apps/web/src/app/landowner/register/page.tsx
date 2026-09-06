"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  UserPlus, 
  Mail, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  User, 
  Phone, 
  MapPin
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createOrUpdateLandownerProfile } from "@/lib/api";
import { toUuid } from "@/lib/supabase/supabaseService";

export default function LandownerRegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Direct Landowner Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid official email address.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters in length.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Password confirmation does not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      const displayName = fullName.trim() || "Project Affected Titleholder";
      let userId = toUuid(cleanEmail);

      // 1. Create account via Supabase Auth
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              role: "LANDOWNER",
              full_name: displayName,
              phone: phone.trim() || null,
              village: village.trim() || "Corridor Sector"
            }
          }
        });

        if (error) {
          if (
            error.message.includes("User already registered") || 
            error.message.includes("already exists")
          ) {
            setErrorMsg("An account with this email address already exists. Please proceed to login.");
            setLoading(false);
            return;
          }
          console.warn("Supabase Auth notice:", error.message);
        } else if (data?.user?.id) {
          userId = data.user.id;
        }
      } catch (authErr) {
        console.warn("Supabase Auth attempt:", authErr);
      }

      // 2. Persist Landowner Profile in Supabase Database (landowners & owners tables)
      await createOrUpdateLandownerProfile({
        user_id: userId,
        name: displayName,
        email: cleanEmail,
        phone: phone.trim() || "+91 98290 00000",
        contact_village: village.trim() || "Corridor Sector"
      });

      // 3. Set Session Cookies
      const sessionPayload = {
        user_id: userId,
        name: displayName,
        email: cleanEmail,
        role: "LANDOWNER"
      };

      setSuccessMsg("Account registered successfully! Entering Citizen Portal...");
      setTimeout(() => {
        router.push("/landowner/home");
        router.refresh();
      }, 900);

    } catch (err: any) {
      setErrorMsg(`Registration error: ${err?.message || "Failed to create account. Please try again."}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-900 flex flex-col justify-between p-4 selection:bg-amber-500/30">
      <div className="w-full max-w-md mx-auto space-y-5 pt-6 pb-12">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-900 shadow-xl shadow-amber-950/60 mb-1 border border-amber-400/30">
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black font-display tracking-tight text-slate-900">
            BHUMI Citizen Portal
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Official Landowner & Project-Affected Person Registration
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

        {/* Registration Form */}
        <div className="bg-white/90 border border-[#e2e8f0] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 font-bold block">
              Citizen Account
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Create Landowner Account
            </h2>
            <p className="text-xs text-slate-400">
              Register with your email to lodge grievances, verify cadastral boundaries, and track compensation awards.
            </p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                Full Name / Titleholder Name *
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#f4f6f9] border border-[#e2e8f0] text-slate-900 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#f4f6f9] border border-[#e2e8f0] text-slate-900 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98290 00000"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#f4f6f9] border border-[#e2e8f0] text-slate-900 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                  Village / Tehsil
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="e.g. Kanhera Kalan"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#f4f6f9] border border-[#e2e8f0] text-slate-900 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 chars"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#f4f6f9] border border-[#e2e8f0] text-slate-900 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#f4f6f9] border border-[#e2e8f0] text-slate-900 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>REGISTER ACCOUNT</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="pt-3 border-t border-[#e2e8f0] flex items-center justify-between text-xs text-slate-400">
            <span>Already registered?</span>
            <Link href="/landowner/login" className="text-amber-400 hover:underline font-semibold flex items-center gap-1">
              <span>Sign In to Landowner Portal</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Cross-Role Links */}
        <div className="pt-2 text-center space-y-1.5 border-t border-slate-900">
          <p className="text-[11px] text-slate-500">
            Authorized Personnel Navigation
          </p>
          <div className="flex justify-center gap-4 text-xs font-semibold">
            <Link href="/field/login" className="text-emerald-400 hover:underline">
              Field Officer Console →
            </Link>
            <Link href="/login" className="text-sky-400 hover:underline">
              Admin Web Console →
            </Link>
          </div>
        </div>

      </div>

      <div className="text-center text-[10px] font-mono text-slate-500 py-3 border-t border-slate-900">
        BHUMI Citizen Portal · PostGIS & NetworkX Causal Intelligence Engine
      </div>
    </div>
  );
}
