"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/navigation/Sidebar";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ExitButton } from "@/components/common/ExitButton";
import { Activity, ChevronDown, User } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

import { CalaSealLogo } from "@/components/common/CalaSealLogo";
import { useI18n } from "@/lib/i18n/I18nContext";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { language, setLanguage, t } = useLanguage();
  const { textSize, setTextSize } = useI18n();

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }: { data: any }) => {
        if (data?.user?.email) {
          setUserEmail(data.user.email);
        } else {
          // Check if officer session cookie exists
          const match = typeof document !== "undefined" ? document.cookie.match(/(?:kosh_officer_session|bhumi_officer_session)=([^;]+)/) : null;
          if (match) {
            try {
              const parsed = JSON.parse(decodeURIComponent(match[1]));
              if (parsed.email) setUserEmail(parsed.email);
              else if (parsed.officer_id) setUserEmail(`${parsed.officer_id.toLowerCase()}@kosh.sih2026.org`);
            } catch {}
          }
        }
      });
    });
  }, []);

  const isPublicPage =
    pathname === "/" ||
    pathname === "/highway-register" ||
    pathname.startsWith("/highway-register/") ||
    pathname === "/gazette" ||
    pathname.startsWith("/gazette/") ||
    pathname === "/calculator" ||
    pathname.startsWith("/calculator/") ||
    pathname === "/grievance" ||
    pathname.startsWith("/grievance/");
  const isAuthPage =
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/auth/");
  const isFieldPage =
    pathname === "/field" || pathname.startsWith("/field/");
  const isLandownerPage =
    (pathname === "/landowner" || pathname.startsWith("/landowner/")) &&
    !pathname.startsWith("/landowner-");

  if (isPublicPage) {
    return (
      <div className="w-full min-h-screen bg-[#F4F6F8] dark:bg-[#07080F] text-[#14213D] dark:text-[#F0F4FF] antialiased">
        {children}
      </div>
    );
  }

  if (isAuthPage) {
    return (
      <div className="w-full min-h-screen bg-[#F4F6F8] dark:bg-[#07080F] text-[#14213D] dark:text-[#F0F4FF] transition-colors duration-150">
        {children}
      </div>
    );
  }

  if (isFieldPage) {
    return (
      <div className="w-full min-h-screen bg-[#F4F6F8] dark:bg-[#07080F] text-[#14213D] dark:text-[#F0F4FF] antialiased selection:bg-emerald-500/30 overflow-x-hidden">
        {children}
      </div>
    );
  }

  if (isLandownerPage) {
    return (
      <div className="w-full min-h-screen bg-[#F4F6F8] dark:bg-[#07080F] text-[#14213D] dark:text-[#F0F4FF] antialiased selection:bg-[#0B2E59]/20 overflow-x-hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#F4F6F8] dark:bg-[#07080F] text-[#14213D] dark:text-[#F0F4FF] font-sans antialiased flex flex-col overflow-hidden transition-colors duration-200">
      
      {/* ================================================================
          STICKY TOP ADMINISTRATIVE BAR (Utility Strip + Header)
          ================================================================ */}
      <div className="sticky top-0 z-40 w-full flex-shrink-0">
        {/* Top Utility Strip (Toll-Free Helpline, Language, Font Size) */}
        <div className="bg-[#071A32] text-white text-[11px] px-4 sm:px-6 lg:px-8 py-1.5 border-b border-white/10">
          <div className="w-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="text-slate-200">
                Emergency Helpline: <strong>7595093196</strong> / <strong>6202346942</strong>
              </span>
              <span className="text-white/30 hidden sm:inline">|</span>
              <span className="text-slate-300 hidden sm:inline">helpdesk@cala.gov.in</span>
              <span className="text-white/30 hidden md:inline">|</span>
              <span className="text-amber-300/80 font-mono hidden md:inline">CALA Competent Authority</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`cursor-pointer transition-colors px-1.5 py-0.5 rounded text-[11px] ${language === "en" ? "text-white font-bold bg-white/15 underline" : "text-slate-300 hover:text-white"}`}
                >
                  English
                </button>
                <span className="text-white/40">|</span>
                <button
                  type="button"
                  onClick={() => setLanguage("hi")}
                  className={`cursor-pointer transition-colors font-devanagari px-1.5 py-0.5 rounded text-[11px] ${language === "hi" ? "text-white font-bold bg-white/15 underline" : "text-slate-300 hover:text-white"}`}
                >
                  हिन्दी
                </button>
              </div>
              <span className="text-white/30">|</span>
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => setTextSize("sm")}
                  className={`px-1.5 py-0.5 rounded cursor-pointer font-bold transition-colors ${textSize === "sm" ? "bg-white/30 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}
                  title="Decrease font size"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setTextSize("base")}
                  className={`px-1.5 py-0.5 rounded cursor-pointer font-bold transition-colors ${textSize === "base" ? "bg-white/30 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}
                  title="Normal font size"
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setTextSize("lg")}
                  className={`px-1.5 py-0.5 rounded cursor-pointer font-bold transition-colors ${textSize === "lg" ? "bg-white/30 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}
                  title="Increase font size"
                >
                  A+
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Administrative Header (KOSH / CALA Directorate) */}
        <header className="w-full bg-[#0B2E59] text-white shadow-md">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">

            {/* LEFT: Administrative Seal + Bilingual Title */}
            <Link href="/dashboard" className="flex items-center gap-3 group min-w-0" title="KOSH Console">
              <CalaSealLogo size={36} className="w-9 h-9 flex-shrink-0 drop-shadow-xs" variant="light" />

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-amber-300 font-mono tracking-wider font-bold uppercase leading-tight">
                    KOSH · CALA DIRECTORATE
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold">
                    OFFICER CONSOLE
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-white font-sans tracking-tight leading-tight">
                  {language === "hi" ? "कोष — राष्ट्रीय भूमि अधिग्रहण एवं प्रबंधन प्रणाली" : "KOSH — National Land Acquisition Operations"}
                </span>
              </div>
            </Link>

            {/* RIGHT: User Profile & Actions */}
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              {/* What-If Workbench Link */}
              <Link
                href="/intelligence/what-if"
                className="hidden xl:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-xs transition-colors"
              >
                <Activity className="w-3.5 h-3.5 text-amber-300" />
                <span>{t("app.whatif_workbench")}</span>
              </Link>

              {/* Authority Officer Profile Card */}
              <div className="flex items-center gap-2.5 pl-2 sm:pl-3 sm:border-l sm:border-white/20">
                <div className="w-8 h-8 rounded bg-white/10 border border-white/20 flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-xs">
                  <User className="w-4 h-4 text-amber-300" />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <div className="text-xs font-medium text-white flex items-center gap-1">
                    <span>{t("app.welcome")}</span>
                    <span className="font-bold truncate max-w-[200px]" title={userEmail || "officer@cala.gov.in"}>
                      {userEmail || "officer@cala.gov.in"}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-300 ml-0.5 flex-shrink-0" />
                  </div>
                  <div className="text-[10px] text-slate-300 font-sans tracking-tight">
                    CALA Kota (NH-927A) · Rajasthan Benchmark
                  </div>
                </div>
              </div>

              {/* Theme Toggle & Sign Out */}
              <div className="flex items-center gap-1.5">
                <ThemeToggle variant="icon" className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !rounded" />
                <ExitButton variant="header" className="!bg-white/10 !border-white/20 !text-rose-200 hover:!bg-white/20 !rounded" />
              </div>
            </div>
          </div>

          {/* National Tricolor Hairline Band */}
          <div className="flex h-[2px] w-full">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-[#138808]" />
          </div>
        </header>
      </div>

      {/* ================================================================
          MAIN WORKSPACE LAYOUT: Independent Scroll Sidebar & Main Body
          ================================================================ */}
      <div className="flex-1 flex min-h-0 w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between bg-[#F4F6F8] dark:bg-[#07080F]">
          {/* Page Content Container */}
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
            {children}
          </div>

          {/* Official SIH Hackathon Prototype Footer */}
          <footer className="w-full bg-[#0A2647] text-white py-3 px-6 text-center text-xs flex-shrink-0 border-t border-[#071A32] space-y-0.5">
            <div className="font-semibold text-slate-200">
              KOSH — Smart India Hackathon Prototype (SIH26016). Not an official government system.
            </div>
            <div className="text-[11px] text-slate-400">
              Designed and Developed for CALA — Central Authority for Land Acquisition Directorate Evaluation
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Deterministic Statutory Engine (RFCTLARR Act 2013 &amp; NH Act 1956) · PostGIS Spatial Twin · Critical Path Method
            </div>
          </footer>
        </main>
      </div>

    </div>
  );
}
