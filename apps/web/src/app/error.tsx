'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log technical error details strictly to runtime console, never rendering to client
    console.error('Operational error caught by boundary:', error);
  }, [error]);

  return (
    <div className="min-h-[460px] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-center">
      <div className="w-14 h-14 rounded-[4px] bg-[#FFEBEE] dark:bg-rose-950/40 border border-[#FFCDD2] dark:border-rose-800/40 flex items-center justify-center mb-6 text-[#B32424] dark:text-rose-300 font-mono text-xl font-bold shadow-xs">
        !
      </div>
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        Operational Processing Error
      </h1>
      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 max-w-lg">
        An internal error occurred while processing the requested domain data. Technical diagnostic records have been retained in server logs.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="w-full sm:w-auto px-4 py-2 bg-[#0B2E59] hover:bg-[#082242] text-white text-xs font-bold rounded-[4px] transition-colors shadow-xs cursor-pointer"
        >
          Retry Operation
        </button>
        <Link
          href="/"
          className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-white/5 border border-[#DCE2E8] dark:border-white/10 text-[#0B2E59] dark:text-slate-200 text-xs font-semibold rounded-[4px] hover:bg-[#F4F6F8] dark:hover:bg-white/10 transition-colors shadow-xs"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
