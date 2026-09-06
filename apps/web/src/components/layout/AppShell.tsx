"use client";

import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/navigation/Sidebar";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ExitButton } from "@/components/common/ExitButton";
import { Activity } from "lucide-react";
import Link from "next/link";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/auth/");
  const isFieldPage =
    pathname === "/field" || pathname.startsWith("/field/");
  const isLandownerPage =
    (pathname === "/landowner" || pathname.startsWith("/landowner/")) &&
    !pathname.startsWith("/landowner-");

  if (isAuthPage) {
    return (
      <div className="w-full min-h-screen bg-[#f4f6f9] dark:bg-[#070a14] text-slate-900 dark:text-[#f0f4ff] transition-colors duration-200">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle variant="icon" />
        </div>
        {children}
      </div>
    );
  }

  if (isFieldPage) {
    return (
      <div className="w-full min-h-screen bg-slate-900 text-slate-100 antialiased selection:bg-emerald-500/30 overflow-x-hidden">
        {children}
      </div>
    );
  }

  if (isLandownerPage) {
    return (
      <div className="w-full min-h-screen bg-[#f4f6f9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-[#0a2c5f]/20 overflow-x-hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#f4f6f9] dark:bg-[#07080f] text-slate-900 dark:text-[#f0f4ff] font-sans antialiased overflow-hidden flex transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col">

        {/* ================================================================
            GOVERNMENT HEADER — Emblem + Ministry Name | User Identity
            ================================================================ */}
        <header className="sticky top-0 z-20 w-full shadow-sm flex-shrink-0">
          {/* Main Navy Header Bar */}
          <div className="bg-[#0a2c5f] text-white px-4 sm:px-6 lg:px-8 py-2.5">
            <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">

              {/* LEFT — State Emblem + Ministry Name */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Sarnath Lion Capital Emblem */}
                <div className="flex-shrink-0 w-10 h-10">
                  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    {/* Base platform */}
                    <rect x="10" y="56" width="44" height="4" rx="1" fill="#FFD700" opacity="0.9"/>
                    {/* Dharma Chakra wheel */}
                    <circle cx="32" cy="50" r="5" fill="none" stroke="#FFD700" strokeWidth="1.5" opacity="0.9"/>
                    <line x1="32" y1="45" x2="32" y2="55" stroke="#FFD700" strokeWidth="0.8" opacity="0.8"/>
                    <line x1="27" y1="50" x2="37" y2="50" stroke="#FFD700" strokeWidth="0.8" opacity="0.8"/>
                    <line x1="28.5" y1="46.5" x2="35.5" y2="53.5" stroke="#FFD700" strokeWidth="0.8" opacity="0.8"/>
                    <line x1="35.5" y1="46.5" x2="28.5" y2="53.5" stroke="#FFD700" strokeWidth="0.8" opacity="0.8"/>
                    {/* Capital block */}
                    <rect x="16" y="42" width="32" height="6" rx="1" fill="#FFD700" opacity="0.8"/>
                    {/* Lions silhouette (simplified) */}
                    <path d="M18 42 C18 36 22 30 26 28 C24 26 22 22 24 18 C26 14 30 12 32 12 C34 12 38 14 40 18 C42 22 40 26 38 28 C42 30 46 36 46 42 Z" fill="#FFD700" opacity="0.9"/>
                    {/* Inner detail lines */}
                    <path d="M28 38 C28 34 30 30 32 28 C34 30 36 34 36 38" fill="none" stroke="#0a2c5f" strokeWidth="0.8" opacity="0.5"/>
                    {/* Crown/top detail */}
                    <path d="M27 12 L32 8 L37 12" fill="#FFD700" opacity="0.7"/>
                  </svg>
                </div>

                {/* Bilingual Ministry Name */}
                <div className="min-w-0">
                  <div className="text-[11px] leading-tight text-amber-200 font-medium font-sans tracking-wide">
                    सड़क परिवहन और राजमार्ग मंत्रालय
                  </div>
                  <div className="text-[13px] leading-tight font-bold text-white font-sans tracking-tight">
                    Ministry of Road Transport &amp; Highways — BHUMI
                  </div>
                </div>
              </div>

              {/* RIGHT — What-If Link + User Identity + Controls */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <Link
                  href="/projects/c0a80124-0001-4000-8000-000000000001/impact"
                  className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-amber-200 border border-white/20 transition-colors"
                >
                  <Activity className="w-3 h-3" />
                  <span>What-If Workbench</span>
                </Link>

                {/* User Identity Block */}
                <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-white/20">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-amber-400 text-[#0a2c5f] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    RK
                  </div>
                  <div className="leading-tight">
                    <div className="text-[12px] font-bold text-white whitespace-nowrap">
                      Welcome, Sh. Rajesh Kumar
                    </div>
                    <div className="text-[10px] text-amber-200 whitespace-nowrap">
                      CALA Varanasi&nbsp;|&nbsp;Role: Competent Authority
                    </div>
                  </div>
                </div>

                <ThemeToggle variant="icon" className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20 hover:!text-white" />
                <ExitButton variant="header" className="!bg-white/10 !border-white/20 !text-amber-200 hover:!bg-white/20 hover:!text-white" />
              </div>
            </div>
          </div>

          {/* Tricolor strip — saffron / white / green */}
          <div className="flex h-[3px] w-full">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-[#138808]" />
          </div>
        </header>

        {/* Page Content */}
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
          {children}
        </div>

        {/* Footer */}
        <footer className="w-full border-t border-[#e2e8f0] dark:border-white/[0.06] bg-white dark:bg-black/40 py-3 px-6 text-xs text-slate-500 dark:text-[#5a6680] flex flex-col sm:flex-row items-center justify-between gap-2 transition-colors duration-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-[10px] text-slate-500 dark:text-[#8892a4]">
              BHUMI Decision Intelligence Engine · SIH26016
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span>RFCTLARR Act 2013</span>
            <span className="text-slate-300 dark:text-white/20">|</span>
            <span>NH Act 1956</span>
            <span className="text-slate-300 dark:text-white/20">|</span>
            <span>PM GatiShakti Compliant</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
