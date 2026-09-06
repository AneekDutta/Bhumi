"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/navigation/Sidebar";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ExitButton } from "@/components/common/ExitButton";
import { Activity, ChevronDown, User } from "lucide-react";
import Link from "next/link";

import { CalaSealLogo } from "@/components/common/CalaSealLogo";
import { useI18n } from "@/lib/i18n/I18nContext";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { language, setLanguage, textSize, setTextSize, t } = useI18n();

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.email) {
          setUserEmail(data.user.email);
        } else {
          // Check if officer session cookie exists
          const match = typeof document !== "undefined" ? document.cookie.match(/bhumi_officer_session=([^;]+)/) : null;
          if (match) {
            try {
              const parsed = JSON.parse(decodeURIComponent(match[1]));
              if (parsed.email) setUserEmail(parsed.email);
              else if (parsed.officer_id) setUserEmail(`${parsed.officer_id.toLowerCase()}@bhumi.cala.gov.in`);
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
      
      {/* Top Utility Strip (Helpline, Language, Font Size) */}
      <div className="bg-[#071A32] text-white text-[11px] px-4 sm:px-6 lg:px-8 py-1.5 border-b border-white/10 flex-shrink-0 z-30">
        <div className="w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-slate-200">
              {t("utility.helpline")}: <strong>7595093196</strong> / <strong>6202346942</strong>
            </span>
            <span className="text-white/30 hidden sm:inline">|</span>
            <span className="text-slate-300 hidden sm:inline">{t("utility.email")}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-300">
              <button 
                onClick={() => setLanguage('en')}
                className={`px-1 transition-colors ${language === 'en' ? 'text-white font-bold underline' : 'text-slate-300 hover:text-white'}`}
                aria-label="Switch to English"
              >
                English
              </button>
              <span className="text-white/40">|</span>
              <button 
                onClick={() => setLanguage('hi')}
                className={`px-1 font-devanagari transition-colors ${language === 'hi' ? 'text-white font-bold underline' : 'text-slate-300 hover:text-white'}`}
                aria-label="Switch to Hindi"
              >
                हिन्दी
              </button>
            </div>
            <span className="text-white/30">|</span>
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <button 
                onClick={() => setTextSize('sm')}
                className={`px-1.5 py-0.5 rounded-none font-bold cursor-pointer transition-colors ${textSize === 'sm' ? 'bg-white/30 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                aria-label="Decrease text size"
              >
                A-
              </button>
              <button 
                onClick={() => setTextSize('base')}
                className={`px-1.5 py-0.5 rounded-none font-bold cursor-pointer transition-colors ${textSize === 'base' ? 'bg-white/30 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                aria-label="Default text size"
              >
                A
              </button>
              <button 
                onClick={() => setTextSize('lg')}
                className={`px-1.5 py-0.5 rounded-none font-bold cursor-pointer transition-colors ${textSize === 'lg' ? 'bg-white/30 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                aria-label="Increase text size"
              >
                A+
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          TOP OFFICIAL CALA AUTHORITY HEADER
          ================================================================ */}
      <header className="w-full bg-[#0B2E59] text-white shadow-xs flex-shrink-0 z-30">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
          
          {/* LEFT: CALA Generic Administrative Seal + Bilingual System Title */}
          <Link href="/" className="flex items-center gap-3.5 group min-w-0">
            <CalaSealLogo size={42} className="w-10 h-10 flex-shrink-0 drop-shadow-xs" variant="light" />

            {/* Bilingual Ministry / Authority Title */}
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] sm:text-xs text-slate-200 font-sans tracking-wide leading-tight">
                {t("brand.title_hi")}
              </span>
              <span className="text-xs sm:text-sm font-bold text-white font-sans tracking-tight leading-tight">
                {t("brand.title_en")}
              </span>
              <span className="text-[10px] text-amber-300 font-semibold tracking-wide leading-tight">
                {t("brand.subline")}
              </span>
            </div>
          </Link>

          {/* RIGHT: User Profile & Actions */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {/* What-If Workbench Link */}
            <Link
              href="/intelligence/what-if"
              className="hidden xl:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-none bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-amber-300" />
              <span>What-If Workbench</span>
            </Link>

            {/* Authority Officer Profile Card */}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 sm:border-l sm:border-white/20">
              <div className="w-8 h-8 rounded-none bg-white/10 border border-white/20 flex items-center justify-center text-white font-semibold flex-shrink-0">
                <User className="w-4 h-4 text-amber-300" />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <div className="text-xs font-medium text-white flex items-center gap-1">
                  <span>{t("utility.welcome")}, </span>
                  <span className="font-bold truncate max-w-[200px]" title={userEmail || "officer@bhumi.cala.gov.in"}>
                    {userEmail || "officer@bhumi.cala.gov.in"}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-300 ml-0.5 flex-shrink-0" />
                </div>
                <div className="text-[10px] text-slate-300 font-sans tracking-tight">
                  {t("utility.role_cala")}
                </div>
              </div>
            </div>

            {/* Theme Toggle & Sign Out */}
            <div className="flex items-center gap-1.5">
              <ThemeToggle variant="icon" className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20" />
              <ExitButton variant="header" className="!bg-white/10 !border-white/20 !text-rose-200 hover:!bg-white/20" />
            </div>
          </div>
        </div>

        {/* Clean Authority Hairline Rule */}
        <div className="h-[2px] w-full bg-[#0B5FA5] flex-shrink-0" />
      </header>

      {/* ================================================================
          MAIN WORKSPACE LAYOUT: Independent Scroll Sidebar & Main Body
          ================================================================ */}
      <div className="flex-1 flex w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between bg-[#F4F6F8] dark:bg-[#07080F]">
          {/* Page Content Container */}
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
            {children}
          </div>

          {/* Neutral Prototype Footer (Zero Real Government Marks) */}
          <footer className="w-full bg-[#0A2647] text-white py-3 px-6 text-center text-xs flex-shrink-0 border-t border-[#071A32] space-y-1">
            <div className="font-medium text-slate-200">
              {t("footer.disclaimer")}
            </div>
            <div className="text-[11px] text-slate-400">
              {t("footer.framework")} &bull; {t("footer.authority")}
            </div>
          </footer>
        </main>
      </div>

    </div>
  );
}
