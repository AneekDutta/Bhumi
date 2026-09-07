"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, LayoutDashboard, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8 text-center bg-[#F4F6F8] dark:bg-[#07080F] text-[#14213D] dark:text-[#F0F4FF] transition-colors">
      <div className="w-16 h-16 rounded-md bg-[#E6F0FA] dark:bg-sky-950/40 border border-[#B8D5ED] dark:border-sky-800/40 flex items-center justify-center mb-5 text-[#0B2E59] dark:text-sky-300 font-mono text-2xl font-bold shadow-xs">
        404
      </div>
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        Record or Page Not Found
      </h1>
      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
        The requested operational record, dynamic route identifier, or statutory resource could not be located in the central database.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full max-w-md">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-white/5 border border-[#CBD5E1] dark:border-white/10 text-[#14213D] dark:text-slate-200 text-xs font-semibold rounded hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Go Back</span>
        </button>
        <Link
          href="/dashboard"
          className="w-full sm:w-auto px-4 py-2 bg-[#0B2E59] hover:bg-[#082242] text-white text-xs font-bold rounded transition-colors shadow-xs flex items-center justify-center gap-1.5"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Operations Console</span>
        </Link>
        <Link
          href="/"
          className="w-full sm:w-auto px-4 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded hover:bg-slate-300 dark:hover:bg-white/20 transition-colors shadow-xs flex items-center justify-center gap-1.5"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Public Home</span>
        </Link>
      </div>

      <p className="mt-8 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
        BHUMI Directorate &bull; Zero Silent Redirect Fallback Policy
      </p>
    </div>
  );
}
