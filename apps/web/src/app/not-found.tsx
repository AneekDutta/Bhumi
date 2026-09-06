import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[460px] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-center">
      <div className="w-14 h-14 rounded-[4px] bg-[#E6F0FA] dark:bg-sky-950/40 border border-[#B8D5ED] dark:border-sky-800/40 flex items-center justify-center mb-6 text-[#0B2E59] dark:text-sky-300 font-mono text-xl font-bold shadow-xs">
        404
      </div>
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        Resource Not Found
      </h1>
      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 max-w-md">
        The requested operational record, project route, or statutory page could not be located on the system.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/"
          className="w-full sm:w-auto px-4 py-2 bg-[#0B2E59] hover:bg-[#082242] text-white text-xs font-bold rounded-[4px] transition-colors shadow-xs"
        >
          Return to National Dashboard
        </Link>
        <Link
          href="/projects"
          className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-white/5 border border-[#DCE2E8] dark:border-white/10 text-[#0B2E59] dark:text-slate-200 text-xs font-semibold rounded-[4px] hover:bg-[#F4F6F8] dark:hover:bg-white/10 transition-colors shadow-xs"
        >
          View Project Portfolio
        </Link>
      </div>

      <p className="mt-8 text-xs text-slate-400 dark:text-slate-500">
        If you believe this record should exist, verify the project or parcel identifier with your district administrator.
      </p>
    </div>
  );
}
