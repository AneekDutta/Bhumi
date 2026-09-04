import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[460px] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-center">
      <div className="w-16 h-16 rounded-md bg-slate-100 border border-slate-300 flex items-center justify-center mb-6 text-slate-700 font-mono text-2xl font-bold">
        404
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Resource Not Found
      </h1>
      <p className="mt-2 text-sm text-slate-600 max-w-md">
        The requested operational record, project route, or statutory page could not be located on the system.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/"
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        >
          Return to National Dashboard
        </Link>
        <Link
          href="/projects"
          className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 shadow-sm"
        >
          View Project Portfolio
        </Link>
      </div>

      <p className="mt-8 text-xs text-slate-400">
        If you believe this record should exist, verify the project or parcel identifier with your district administrator.
      </p>
    </div>
  );
}
