"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/navigation/Sidebar";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ExitButton } from "@/components/common/ExitButton";
import { Activity, ChevronDown, User } from "lucide-react";
import Link from "next/link";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);

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
              else if (parsed.officer_id) setUserEmail(`${parsed.officer_id.toLowerCase()}@bhumi.gov.in`);
            } catch {}
          }
        }
      });
    });
  }, []);

  const isHomePage = pathname === "/";
  const isAuthPage =
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/auth/");
  const isFieldPage =
    pathname === "/field" || pathname.startsWith("/field/");
  const isLandownerPage =
    (pathname === "/landowner" || pathname.startsWith("/landowner/")) &&
    !pathname.startsWith("/landowner-");

  if (isHomePage) {
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
    <div className="min-h-screen w-full bg-[#F4F6F8] dark:bg-[#07080F] text-[#14213D] dark:text-[#F0F4FF] font-sans antialiased flex flex-col transition-colors duration-200">
      
      {/* Top Utility Strip (Toll-Free Helpline, Language, Font Size) */}
      <div className="bg-[#071A32] text-white text-[11px] px-4 sm:px-6 lg:px-8 py-1.5 border-b border-white/10 flex-shrink-0">
        <div className="w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-slate-200">
              Emergency Helpline: <strong>7595093196</strong> / <strong>6202346942</strong>
            </span>
            <span className="text-white/30 hidden sm:inline">|</span>
            <span className="text-slate-300 hidden sm:inline">helpdesk-bhumi@gov.in</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-300">
              <span className="text-white font-bold cursor-pointer hover:underline">English</span>
              <span className="text-white/40">|</span>
              <span className="text-slate-300 font-devanagari cursor-pointer hover:underline">हिन्दी</span>
            </div>
            <span className="text-white/30">|</span>
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <span className="px-1 py-0.5 rounded bg-white/10 hover:bg-white/20 cursor-pointer font-bold">A-</span>
              <span className="px-1 py-0.5 rounded bg-white/15 hover:bg-white/20 cursor-pointer font-bold">A</span>
              <span className="px-1 py-0.5 rounded bg-white/10 hover:bg-white/20 cursor-pointer font-bold">A+</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          TOP OFFICIAL GOVERNMENT HEADER (MoRTH / GOVT. OF INDIA)
          ================================================================ */}
      <header className="sticky top-0 z-30 w-full bg-[#0B2E59] text-white shadow-md flex-shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
          
          {/* LEFT: State Lion Capital Emblem + Bilingual Ministry Title */}
          <Link href="/dashboard" className="flex items-center gap-3.5 group min-w-0">
            {/* Ashoka Sarnath Lion Capital Emblem Vector */}
            <div className="w-10 h-11 flex-shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
                {/* Platform Base */}
                <rect x="12" y="64" width="40" height="4" rx="1.5" fill="#f8fafc" />
                <rect x="8" y="60" width="48" height="3" rx="1" fill="#e2e8f0" />
                
                {/* Dharma Chakra Central Wheel */}
                <circle cx="32" cy="53" r="5.5" stroke="#f8fafc" strokeWidth="1.5" fill="none" />
                <circle cx="32" cy="53" r="1.5" fill="#f8fafc" />
                <line x1="32" y1="47.5" x2="32" y2="58.5" stroke="#f8fafc" strokeWidth="0.8" />
                <line x1="26.5" y1="53" x2="37.5" y2="53" stroke="#f8fafc" strokeWidth="0.8" />
                <line x1="28" y1="49" x2="36" y2="57" stroke="#f8fafc" strokeWidth="0.8" />
                <line x1="36" y1="49" x2="28" y2="57" stroke="#f8fafc" strokeWidth="0.8" />
                
                {/* Bull & Horse flanking silhouttes on abacus */}
                <rect x="14" y="52" width="6" height="3" rx="1" fill="#cbd5e1" />
                <rect x="44" y="52" width="6" height="3" rx="1" fill="#cbd5e1" />
                
                {/* Abacus frieze */}
                <rect x="10" y="46" width="44" height="4" rx="1" fill="#f1f5f9" />
                
                {/* Three Lions Silhouette */}
                {/* Center Lion */}
                <path d="M26 46 C26 38 27 28 32 20 C37 28 38 38 38 46 Z" fill="#f8fafc" />
                <path d="M28 20 C28 14 30 8 32 8 C34 8 36 14 36 20 Z" fill="#ffffff" />
                {/* Center Mane details */}
                <circle cx="32" cy="14" r="2.5" fill="#0b2545" opacity="0.15" />
                <path d="M30 26 C30 22 34 22 34 26" stroke="#0b2545" strokeWidth="1" strokeLinecap="round" />
                
                {/* Left Lion */}
                <path d="M16 46 C16 38 20 32 25 24 C23 20 21 15 23 11 C25 9 27 12 28 16 C25 24 26 34 26 46 Z" fill="#e2e8f0" />
                {/* Right Lion */}
                <path d="M48 46 C48 38 44 32 39 24 C41 20 43 15 41 11 C39 9 37 12 36 16 C39 24 38 34 38 46 Z" fill="#e2e8f0" />
                
                {/* Top Crown Accent */}
                <circle cx="32" cy="5" r="1.5" fill="#f8fafc" />
              </svg>
            </div>

            {/* Bilingual Ministry Title */}
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] sm:text-xs text-slate-200 font-sans tracking-wide leading-tight">
                सड़क परिवहन और राजमार्ग मंत्रालय /
              </span>
              <span className="text-xs sm:text-sm font-bold text-white font-sans tracking-tight leading-tight">
                Ministry of Road Transport and Highways - BHUMI
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
                  <span>Welcome, </span>
                  <span className="font-bold truncate max-w-[200px]" title={userEmail || "officer@bhumi.gov.in"}>
                    {userEmail || "officer@bhumi.gov.in"}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-300 ml-0.5 flex-shrink-0" />
                </div>
                <div className="text-[10px] text-slate-300 font-sans tracking-tight">
                  CALA Varanasi | Role: Competent Authority
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

        {/* National Tricolor Hairline Band */}
        <div className="flex h-[2px] w-full">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>
      </header>

      {/* ================================================================
          MAIN WORKSPACE LAYOUT: Sidebar (Left) + Content (Right)
          ================================================================ */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col justify-between bg-[#F4F6F8] dark:bg-[#07080F]">
          {/* Page Content Container */}
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
            {children}
          </div>

          {/* Official NIC Government Footer */}
          <footer className="w-full bg-[#0A2647] text-white py-3.5 px-6 text-center text-xs flex-shrink-0 border-t border-[#071A32] space-y-1">
            <div className="font-medium text-slate-200">
              Designed, Developed and Hosted by National Informatics Centre (NIC), Ministry of Electronics &amp; Information Technology, Government of India
            </div>
            <div className="text-[11px] text-slate-400">
              Content Owned and Maintained by Ministry of Road Transport &amp; Highways · Government of India
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              BHUMI Portal · RFCTLARR Act 2013 &amp; NH Act 1956
            </div>
          </footer>
        </main>
      </div>

    </div>
  );
}
