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
      <div className="w-16 h-16 rounded-md bg-red-50 border border-red-200 flex items-center justify-center mb-6 text-red-700 font-mono text-xl font-bold">
        !
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Operational Processing Error
      </h1>
      <p className="mt-2 text-sm text-slate-600 max-w-lg">
        An internal error occurred while processing the requested domain data. Technical diagnostic records have been retained in server logs.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        >
          Retry Operation
        </button>
        <Link
          href="/"
          className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 shadow-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
