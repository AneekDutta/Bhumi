import React from 'react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-bold text-slate-800 tracking-tight">BHUMI</span>
            <span className="text-slate-300">|</span>
            <span>National Land Acquisition Decision-Intelligence Platform</span>
          </div>

          <div className="flex items-center">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
              Synthetic Demo Data
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
