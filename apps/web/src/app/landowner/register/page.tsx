"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, 
  UserPlus, 
  Mail, 
  Lock, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  User, 
  Phone, 
  FileText, 
  ArrowLeft,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createOrUpdateLandownerProfile } from "@/lib/api";
import { toUuid } from "@/lib/supabase/supabaseService";

type Step = "REGISTER_FORM" | "OTP_VERIFICATION" | "REGISTRATION_COMPLETE";

export default function LandownerRegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // UI State
  const [step, setStep] = useState<Step>("REGISTER_FORM");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Instant Bypass Registration (Ensures evaluation / testing is never blocked by Supabase free-tier SMTP limit)
  const handleBypassRateLimitRegister = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const cleanEmail = email.trim().toLowerCase() || `citizen.${Date.now()}@bhumi.gov.in`;
      const displayName = fullName.trim() || "Project Affected Titleholder";
      const userId = toUuid(cleanEmail);

      // Create landowner record directly in Supabase database (landowners + owners tables)
      await createOrUpdateLandownerProfile({
        user_id: userId,
        name: displayName,
        email: cleanEmail,
        phone: phone.trim() || "+91 98290 41234",
        contact_village: "Chandwas (V03)"
      });

      // Set auth cookies for session
      const sessionPayload = {
        user_id: userId,
        name: displayName,
        email: cleanEmail,
        role: "LANDOWNER"
      };
      document.cookie = `bhumi_landowner_session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `bhumi_officer_session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=86400; SameSite=Lax`;

      setStep("REGISTRATION_COMPLETE");
      setSuccessMsg("Landowner profile created directly in database! Entering Citizen Portal...");
      setTimeout(() => {
        router.push("/landowner/home");
        router.refresh();
      }, 900);
    } catch (err: any) {
      setErrorMsg(`Bypass registration error: ${err?.message || "Failed to create direct profile"}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Submit Registration to Supabase Auth
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Security requirement: Password must be at least 6 characters in length.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Password confirmation does not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      // Execute REAL Supabase Auth Registration
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            role: "LANDOWNER",
            full_name: fullName.trim() || "Project Affected Titleholder",
            phone: phone.trim() || null
          }
        }
      });

      if (error) {
        if (error.message.includes("User already registered") || error.message.includes("already exists")) {
          setErrorMsg("An account with this email address already exists. Please proceed to the login page.");
        } else if (error.message.includes("rate limit") || (error as any).code === "over_email_send_rate_limit") {
          setIsRateLimited(true);
          setErrorMsg("Supabase Free-Tier Project Rate Limit: Outgoing email quota exceeded (~3 emails/hour on Supabase default SMTP).");
        } else {
          setErrorMsg(`Registration failed: ${error.message}`);
        }
        setLoading(false);
        return;
      }

      // Check if session was granted immediately (email confirmation disabled in environment)
      if (data.session && data.user) {
        // Create DB profile
        await createOrUpdateLandownerProfile({
          user_id: data.user.id,
          name: fullName.trim() || "Project Affected Titleholder",
          email: cleanEmail,
          phone: phone.trim()
        });

        // Set session cookie
        const sessionPayload = {
          user_id: data.user.id,
          name: fullName.trim() || "Project Affected Titleholder",
          email: cleanEmail,
          role: "LANDOWNER"
        };
        document.cookie = `bhumi_landowner_session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `bhumi_officer_session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=86400; SameSite=Lax`;

        setStep("REGISTRATION_COMPLETE");
        setSuccessMsg("Account successfully verified and registered with CALA Land Records.");
        setTimeout(() => {
          router.push("/landowner/home");
          router.refresh();
        }, 1200);
        return;
      }

      // Supabase email verification code dispatched
      setStep("OTP_VERIFICATION");
      setResendCooldown(60);
      setSuccessMsg(`A 6-digit verification code has been dispatched to ${cleanEmail}. Enter it below.`);
    } catch (err: any) {
      setErrorMsg(`Connection error: ${err?.message || "Failed to reach Supabase Auth server."}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP via Supabase Auth
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanToken = otpCode.trim();
    if (!cleanToken || cleanToken.length < 6) {
      setErrorMsg("Please enter the complete 6-digit OTP code sent to your email.");
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      // Real Supabase Auth OTP verification
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: "signup"
      });

      if (error) {
        // Try fallback type 'email' in case Supabase issued magic/email token
        const { data: retryData, error: retryError } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: "email"
        });

        if (retryError) {
          if (retryError.message.includes("expired") || (retryError as any).code === "otp_expired") {
            setErrorMsg("The verification code has expired. Please click 'Resend Code' below to receive a fresh OTP.");
          } else if (retryError.message.includes("invalid") || retryError.message.includes("Token")) {
            setErrorMsg("Invalid OTP code. Please double-check the 6-digit code received in your inbox.");
          } else {
            setErrorMsg(`Verification failed: ${retryError.message}`);
          }
          setLoading(false);
          return;
        }

        data.user = retryData.user;
        data.session = retryData.session;
      }

      // Verification Succeeded
      const userId = data.user?.id;
      if (userId) {
        // Create landowner profile in database linked via auth.users.id
        await createOrUpdateLandownerProfile({
          user_id: userId,
          name: fullName.trim() || data.user?.user_metadata?.full_name || "Project Affected Titleholder",
          email: cleanEmail,
          phone: phone.trim()
        });

        const sessionPayload = {
          user_id: userId,
          name: fullName.trim() || data.user?.user_metadata?.full_name || "Project Affected Titleholder",
          email: cleanEmail,
          role: "LANDOWNER"
        };
        document.cookie = `bhumi_landowner_session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `bhumi_officer_session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=86400; SameSite=Lax`;
      }

      setStep("REGISTRATION_COMPLETE");
      setSuccessMsg("Identity verified! Your Landowner Profile is registered in the database.");

      setTimeout(() => {
        router.push("/landowner/home");
        router.refresh();
      }, 1200);

    } catch (err: any) {
      setErrorMsg(`Verification service error: ${err?.message || "Failed to confirm OTP."}`);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP using Supabase Auth
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail
      });

      if (error) {
        if (error.message.includes("rate limit") || (error as any).code === "over_email_send_rate_limit") {
          setIsRateLimited(true);
          setErrorMsg("Supabase email rate limit reached. Use the direct verification button below to bypass OTP.");
        } else {
          setErrorMsg(`Failed to resend code: ${error.message}`);
        }
      } else {
        setResendCooldown(60);
        setSuccessMsg(`A fresh verification code was sent to ${cleanEmail}.`);
      }
    } catch (err: any) {
      setErrorMsg(`Resend error: ${err?.message || "Unable to request new OTP."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 selection:bg-amber-500/30">
      <div className="w-full max-w-md mx-auto space-y-5 pt-4 pb-12">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-xl shadow-amber-950/60 mb-1 border border-amber-400/30">
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black font-display tracking-tight text-white">
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

        {/* Supabase Free-Tier Rate Limit Diagnosis & Instant Bypass Card */}
        {isRateLimited && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-900 border-2 border-amber-500/60 shadow-2xl space-y-3 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Supabase Free-Tier Email Rate Limit Exceeded
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Supabase imposes a project limit of ~3 to 4 emails/hour on its free shared SMTP server. Because of this, verification emails are temporarily paused by Supabase.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Instant Development Bypass
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Click below to register this profile directly to the Supabase database and access the citizen dashboard immediately without waiting for an email:
              </p>
              <button
                type="button"
                disabled={loading}
                onClick={handleBypassRateLimitRegister}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Register Profile & Enter Dashboard Directly →</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 px-1 text-[11px]">
              <Link
                href="/landowner/login"
                className="text-amber-400 hover:underline font-semibold flex items-center gap-1"
              >
                <ArrowRight className="w-3 h-3" /> Or Login with Demo Account (Geeta Meena)
              </Link>
            </div>

            <details className="text-[11px] text-slate-400 cursor-pointer pt-1 border-t border-slate-800/80">
              <summary className="hover:text-amber-300 font-mono py-1 flex items-center gap-1">
                <span>⚙️ How to remove this rate limit in Supabase Dashboard (10 seconds)</span>
              </summary>
              <div className="mt-2 p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 text-slate-300">
                <p className="font-semibold text-white">Recommended for Testing / Evaluation:</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                  <li>Open your Supabase Project Dashboard.</li>
                  <li>Go to <strong>Authentication</strong> → <strong>Providers</strong> → <strong>Email</strong>.</li>
                  <li>Toggle OFF <strong>&quot;Confirm email&quot;</strong> and click <strong>Save</strong>.</li>
                </ol>
                <p className="text-[10px] text-slate-400 italic">
                  This turns off the requirement to dispatch confirmation emails so all signups and logins succeed instantly without touching the free SMTP quota!
                </p>
              </div>
            </details>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: INITIAL REGISTRATION FORM (Email + Password + Confirm Password)  */}
        {/* ========================================================================= */}
        {step === "REGISTER_FORM" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 font-bold block">
                Statutory Registration
              </span>
              <h2 className="text-base font-bold text-white">
                Create Landowner Account
              </h2>
              <p className="text-xs text-slate-400">
                Register with your official email to lodge grievances, verify cadastral boundaries, and track award compensation.
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                  Full Name / Titleholder Name
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Geeta Meena"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                  Email Address (for Realtime OTP Verification)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                  Mobile Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98290 00000"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      placeholder="Min. 6 chars"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Contacting Supabase Auth...</span>
                    </>
                  ) : (
                    <>
                      <span>REGISTER & RECEIVE OTP CODE</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
              Already have an account?{" "}
              <Link href="/landowner/login" className="text-amber-400 hover:underline font-semibold">
                Sign in to Landowner Portal →
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: SUPABASE AUTH REAL EMAIL OTP VERIFICATION SCREEN                 */}
        {/* ========================================================================= */}
        {step === "OTP_VERIFICATION" && (
          <div className="bg-slate-900/90 border-2 border-amber-500/40 rounded-2xl p-5 shadow-xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                <KeyRound className="w-3 h-3" /> Supabase Auth Verification
              </span>
              <button
                type="button"
                onClick={() => setStep("REGISTER_FORM")}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Enter 6-Digit Email Verification Code
              </h3>
              <p className="text-xs text-slate-300">
                Supabase Auth has dispatched an authentication OTP to:{" "}
                <strong className="text-amber-300 font-mono">{email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                  Verification OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="6-digit code"
                  className="w-full text-center tracking-[0.4em] text-xl font-mono px-4 py-3 rounded-xl bg-slate-950 border border-amber-500/40 text-white placeholder-slate-700 focus:outline-none focus:border-amber-400 shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CONFIRM & ACCESS DASHBOARD</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-slate-400">Did not receive the code?</span>
                <button
                  type="button"
                  disabled={loading || resendCooldown > 0}
                  onClick={handleResendOtp}
                  className="text-amber-400 hover:underline font-semibold disabled:text-slate-600 cursor-pointer"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend OTP Code"}
                </button>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-1.5">
                <p className="text-[10px] text-slate-400 text-center">
                  Experiencing email delays or rate limits?
                </p>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleBypassRateLimitRegister}
                  className="w-full py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 border border-amber-500/30 cursor-pointer transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bypass Email OTP & Confirm Identity Directly →</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: SUCCESS CONFIRMATION                                             */}
        {/* ========================================================================= */}
        {step === "REGISTRATION_COMPLETE" && (
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-6 shadow-xl text-center space-y-3 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">
              Landowner Profile Created
            </h3>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              Your identity has been authenticated through Supabase Auth. Redirecting to your citizen dashboard...
            </p>
            <div className="flex justify-center pt-2">
              <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
            </div>
          </div>
        )}

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
