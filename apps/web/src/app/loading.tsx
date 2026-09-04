import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[360px] space-y-3" role="status" aria-label="Loading operational data">
      <div className="w-8 h-8 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      <div className="text-xs font-medium text-slate-500 tracking-wide uppercase">
        Loading Operational Data...
      </div>
    </div>
  );
}
