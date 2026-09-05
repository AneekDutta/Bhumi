"use client";

import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/navigation/Sidebar";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ShieldCheck, Activity, Smartphone } from "lucide-react";
import Link from "next/link";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname.startsWith("/login/") || pathname.startsWith("/auth/");
  const isFieldPage = pathname.startsWith("/field");

  if (isAuthPage) {
    return (
      <div className="w-full h-screen overflow-hidden bg-slate-50 dark:bg-[#070a14] text-slate-900 dark:text-[#f0f4ff] transition-colors duration-200">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle variant="icon" />
        </div>
        {children}
      </div>
    );
  }

  if (isFieldPage) {
    return (
      <div className="w-full min-h-screen bg-slate-900 text-slate-100 antialiased selection:bg-emerald-500/30">
        {children}
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-[#07080f] text-slate-900 dark:text-[#f0f4ff] font-sans antialiased overflow-hidden flex transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col justify-between">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 w-full border-b border-slate-200/80 dark:border-white/[0.07] bg-white/80 dark:bg-[#07080f]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-2.5 transition-colors duration-200">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-md font-mono">
                <ShieldCheck className="w-3.5 h-3.5" /> PostGIS + CPM Active
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                BHUMI Land Acquisition Twin
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/field"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 transition-colors shadow-sm"
              >
                <Smartphone className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                <span>Field Ops (Mobile)</span>
              </Link>
              <Link
                href="/projects/P-NH927A/impact"
                className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-600/20 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 transition-colors shadow-sm"
              >
                <Activity className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                <span>What-If Workbench</span>
              </Link>
              <ThemeToggle variant="icon" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
          {children}
        </div>

        {/* Global Footer */}
        <footer className="w-full border-t border-slate-200/80 dark:border-white/[0.06] bg-white/90 dark:bg-black/40 backdrop-blur-md py-4 px-6 text-xs text-slate-500 dark:text-[#5a6680] flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-[11px] text-slate-600 dark:text-[#8892a4]">BHUMI Decision Intelligence Engine · SIH26016</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
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

