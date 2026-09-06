"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nContext";
import { CalaSealLogo } from "@/components/common/CalaSealLogo";
import { DigitalCorridorMark } from "@/components/common/DigitalCorridorMark";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Phone, Bell, Landmark } from "lucide-react";

interface PublicShellProps {
  children: ReactNode;
}

export function PublicShell({ children }: PublicShellProps) {
  const pathname = usePathname();
  const { language, setLanguage, textSize, setTextSize, t } = useI18n();

  const navItems = [
    { href: "/", label: t("nav.home") },
    { href: "/highway-register", label: t("nav.register") },
    { href: "/gazette", label: t("nav.statutory") },
    { href: "/calculator", label: t("nav.calculator") },
    { href: "/grievance", label: t("nav.grievance") },
    { href: "/login", label: t("nav.officer_login"), highlight: true },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8] dark:bg-[#07080F] text-[#333333] dark:text-[#F0F4FF] transition-colors duration-200">
      
      {/* ========================================================================= */}
      {/* 1. TOP UTILITY STRIP                                                      */}
      {/* ========================================================================= */}
      <div className="bg-[#071A32] text-white text-[11px] px-4 py-1.5 border-b border-white/10 flex-shrink-0">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          
          {/* Left: Emergency Helpline & Official Email */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-200">
              <Phone className="w-3 h-3 text-amber-400" />
              <span>{t("utility.helpline")}: <strong>7595093196</strong> / <strong>6202346942</strong></span>
            </span>
            <span className="text-white/30 hidden md:inline">|</span>
            <span className="text-slate-300 hidden md:inline">{t("utility.email")}</span>
          </div>

          {/* Right: Functional Language Switcher, Accessibility Zoom, Theme */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-300">
              <button 
                onClick={() => setLanguage('en')}
                className={`px-1 transition-colors cursor-pointer ${language === 'en' ? 'text-white font-bold underline' : 'text-slate-300 hover:text-white'}`}
                aria-label="Switch to English"
              >
                English
              </button>
              <span className="text-white/40">|</span>
              <button 
                onClick={() => setLanguage('hi')}
                className={`px-1 font-devanagari transition-colors cursor-pointer ${language === 'hi' ? 'text-white font-bold underline' : 'text-slate-300 hover:text-white'}`}
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
                title="Decrease font scale"
              >
                A-
              </button>
              <button 
                onClick={() => setTextSize('base')}
                className={`px-1.5 py-0.5 rounded-none font-bold cursor-pointer transition-colors ${textSize === 'base' ? 'bg-white/30 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                aria-label="Default text size"
                title="Default font scale (100%)"
              >
                A
              </button>
              <button 
                onClick={() => setTextSize('lg')}
                className={`px-1.5 py-0.5 rounded-none font-bold cursor-pointer transition-colors ${textSize === 'lg' ? 'bg-white/30 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                aria-label="Increase text size"
                title="Increase font scale"
              >
                A+
              </button>
            </div>
            <span className="text-white/30">|</span>
            <ThemeToggle variant="icon" className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !rounded-none" />
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN CALA AUTHORITY BRANDING HEADER                                    */}
      {/* ========================================================================= */}
      <header className="bg-[#0B2E59] text-white px-4 py-3 sm:px-8 border-b border-[#0A2647] flex-shrink-0">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          
          {/* Left: CALA Generic Administrative Seal + Bilingual Title (Links to /) */}
          <Link href="/" className="flex items-center gap-3.5 group cursor-pointer" title="Go to BHUMI Home">
            <CalaSealLogo size={46} className="w-11 h-11 flex-shrink-0 drop-shadow-xs" variant="light" />

            <div className="flex flex-col">
              <span className="font-devanagari font-bold text-sm sm:text-base text-white/95 leading-tight">
                {t("brand.title_hi")}
              </span>
              <span className="font-bold text-sm sm:text-base text-white leading-tight">
                {t("brand.title_en")}
              </span>
              <span className="text-xs text-amber-300 font-semibold tracking-wide mt-0.5">
                {t("brand.subline")}
              </span>
            </div>
          </Link>

          {/* Right: CALA Directorate Program Mark (Links to /) */}
          <DigitalCorridorMark />

        </div>
      </header>

      {/* Clean Authority Hairline Rule */}
      <div className="h-[2px] w-full bg-[#0B5FA5] flex-shrink-0" />

      {/* ========================================================================= */}
      {/* 3. OFFICIAL BULLETIN TICKER STRIP                                         */}
      {/* ========================================================================= */}
      <div className="bg-[#EBF3FC] dark:bg-[#0A1A2E] text-xs border-b border-[#D0E2F2] dark:border-sky-950 px-4 py-1.5 flex items-center gap-3 overflow-hidden">
        <span className="bg-[#B32424] text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-none flex-shrink-0 flex items-center gap-1">
          <Bell className="w-3 h-3" />
          <span>{t("ticker.heading")}</span>
        </span>
        <div className="overflow-x-auto whitespace-nowrap text-[#14213D] dark:text-slate-200 text-[11px] font-medium no-scrollbar">
          <span className="font-bold text-[#0B2E59] dark:text-sky-300">{t("ticker.item1")}</span> &nbsp;&bull;&nbsp; 
          <span className="font-bold text-[#1E7E34] dark:text-emerald-400">{t("ticker.item2")}</span> &nbsp;&bull;&nbsp; 
          <span className="font-bold text-[#0B2E59] dark:text-sky-300">{t("ticker.item3")}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. HORIZONTAL NAVY NAVIGATION BAR (Dedicated Multi-Page Routing)          */}
      {/* ========================================================================= */}
      <nav className="bg-[#123C6B] text-white text-xs font-semibold px-4 sm:px-8 border-b border-[#0A2647] sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between overflow-x-auto no-scrollbar">
          <div className="flex items-center">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2.5 transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-[#0B2E59] text-amber-300 font-bold border-b-2 border-amber-400"
                      : item.highlight
                      ? "bg-[#2F6FB0] text-white font-bold hover:bg-[#255b94]"
                      : "hover:bg-[#2F6FB0] text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 5. MAIN CONTENT INJECTION                                                 */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* ========================================================================= */}
      {/* 6. OFFICIAL CALA PROTOTYPE FOOTER                                         */}
      {/* ========================================================================= */}
      <footer className="bg-[#0A2647] text-white py-6 px-4 text-center text-xs border-t border-[#071A32] flex-shrink-0 space-y-3 mt-auto">
        <div className="max-w-[1440px] mx-auto space-y-2">
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-300 text-[11px] pb-2 border-b border-white/10">
            <Link href="/" className="hover:underline">Home</Link>
            <span>·</span>
            <Link href="/highway-register" className="hover:underline">Highway Register</Link>
            <span>·</span>
            <Link href="/gazette" className="hover:underline">Gazette Search</Link>
            <span>·</span>
            <Link href="/grievance" className="hover:underline">Track Grievance</Link>
            <span>·</span>
            <Link href="/calculator" className="hover:underline">Compensation Estimator</Link>
            <span>·</span>
            <Link href="/login" className="hover:underline">Officer Login</Link>
          </div>

          <p className="font-medium text-slate-200">
            Designed and Developed for CALA — Central Authority for Land Acquisition
          </p>
          <p className="text-[11px] text-slate-400">
            BHUMI Platform — Smart India Hackathon Prototype (SIH26016). Not an official government system.
          </p>
          <p className="text-[11px] text-slate-400">
            Emergency Helpline: <strong className="text-amber-300">7595093196</strong> / <strong className="text-amber-300">6202346942</strong> · Technical Support: <strong className="text-slate-200">support@bhumi.internal</strong>
          </p>
          <p className="text-[10px] text-slate-400 font-mono pt-1">
            BHUMI Portal Version 3.4.1 · Prototype Deployment (SIH26016)
          </p>
        </div>
      </footer>

    </div>
  );
}
