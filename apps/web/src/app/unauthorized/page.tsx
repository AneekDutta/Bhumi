"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, ArrowLeft, KeyRound, Home, Lock, AlertTriangle } from "lucide-react";
import { CalaSealLogo } from "@/components/common/CalaSealLogo";
import { ROLE_DASHBOARDS, ROLE_LOGIN_PATHS, UserRole } from "@/lib/routes";

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const required = (searchParams.get("required")?.toUpperCase() as UserRole) || null;
  const current = (searchParams.get("current")?.toUpperCase() as UserRole) || null;
  const from = searchParams.get("from") || "/";

  const getRoleLabel = (role: UserRole | null) => {
    switch (role) {
      case "ADMIN":
        return "CALA Directorate / Administrator";
      case "FIELD_OFFICER":
        return "Cadastral Field Inspector / Patwari";
      case "LANDOWNER":
        return "Verified Citizen / Landowner";
      default:
        return "Public / Unauthenticated";
    }
  };

  const myDashboard = current && ROLE_DASHBOARDS[current] ? ROLE_DASHBOARDS[current] : "/";
  const requiredLogin = required && ROLE_LOGIN_PATHS[required] ? `${ROLE_LOGIN_PATHS[required]}?next=${encodeURIComponent(from)}` : "/login";

  return (
    <div className="min-h-screen bg-[#F4F6F8] dark:bg-[#07080F] text-[#14213D] dark:text-[#F0F4FF] flex flex-col justify-between p-4 transition-colors">
      {/* Top Bar */}
      <header className="w-full max-w-2xl mx-auto pt-6 flex items-center justify-between border-b border-[#DCE2E8] dark:border-white/10 pb-4">
        <Link href="/" className="flex items-center gap-2.5">
          <CalaSealLogo size={32} variant="navy" />
          <div>
            <div className="font-bold text-sm text-[#0B2E59] dark:text-sky-300 leading-tight">
              BHUMI Portal
            </div>
            <div className="text-[10px] text-[#5A6A80] dark:text-slate-400 font-mono">
              Central Authority for Land Acquisition
            </div>
          </div>
        </Link>
        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-[3px] bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800/40 uppercase">
          HTTP 403 · Access Denied
        </span>
      </header>

      {/* Main Card */}
      <main className="w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-white dark:bg-[#0D121F] border-2 border-red-300 dark:border-red-800/50 rounded-[4px] p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[4px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#14213D] dark:text-white leading-tight">
                Security Clearance Mismatch
              </h1>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400 font-mono mt-0.5">
                Statutory Role Access Control Policy Enforced
              </p>
            </div>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-white/[0.02] border border-[#DCE2E8] dark:border-white/10 rounded-[3px] p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Attempted Resource:</span>
              <span className="font-mono font-bold text-[#0B2E59] dark:text-sky-300 truncate max-w-[200px]" title={from}>
                {from}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Clearance Required:</span>
              <span className="font-bold text-red-700 dark:text-red-300">
                {getRoleLabel(required)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Active Clearance:</span>
              <span className="font-bold text-[#1E7E34] dark:text-emerald-400">
                {getRoleLabel(current)}
              </span>
            </div>
          </div>

          <p className="text-xs text-[#555555] dark:text-slate-400 leading-relaxed">
            You do not possess the statutory authorization required to access this operational console with your active credentials. To maintain audit compliance, unauthorized cross-portal navigation is restricted.
          </p>

          <div className="space-y-2.5 pt-2">
            {current && (
              <Link
                href={myDashboard}
                className="w-full py-2.5 px-4 rounded-[4px] bg-[#0B2E59] hover:bg-[#082242] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to My Designated Portal ({getRoleLabel(current)})</span>
              </Link>
            )}

            {required && (
              <Link
                href={requiredLogin}
                className="w-full py-2 px-4 rounded-[4px] bg-white dark:bg-white/5 hover:bg-[#F4F6F8] dark:hover:bg-white/10 text-[#0B2E59] dark:text-sky-300 border border-[#CBD5E1] dark:border-white/10 text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Sign In with {getRoleLabel(required)} Credentials</span>
              </Link>
            )}

            <Link
              href="/"
              className="w-full py-2 px-4 rounded-[4px] bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public BHUMI Home</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-2xl mx-auto py-4 text-center text-[10px] text-slate-400 font-mono border-t border-[#DCE2E8] dark:border-white/10">
        BHUMI CALA Security Layer &bull; Zero Silent Redirect Policy
      </footer>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-xs font-mono text-slate-400">
        Verifying security clearance...
      </div>
    }>
      <UnauthorizedContent />
    </Suspense>
  );
}
