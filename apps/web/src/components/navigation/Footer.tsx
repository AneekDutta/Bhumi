import React from 'react';
import Link from 'next/link';
import { ShieldCheck, GitBranch, Scale, Database } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-auto text-slate-400 text-xs">
      {/* Top Footer info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-slate-800">
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-white">BHUMI</span>
              <span className="text-amber-400 font-sans font-semibold text-xs">भूमि</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300 font-medium">National Land Acquisition & Infrastructure Operations</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
              Statutory decision system for national land acquisition workflows, contiguous spatial contiguity clustering, and deterministic Critical Path Method (CPM) schedule risk attribution.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                SIH26016 Problem Solution
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                Phase 1-4 Complete
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-slate-200 font-semibold uppercase tracking-wider text-[11px] mb-3">Statutory Framework</h4>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li className="flex items-center gap-1.5"><Scale className="w-3 h-3 text-amber-400" /> RFCTLARR Act 2013 (Sec 19/21/30)</li>
              <li className="flex items-center gap-1.5"><Scale className="w-3 h-3 text-slate-500" /> National Highways Act 1956</li>
              <li className="flex items-center gap-1.5"><Scale className="w-3 h-3 text-slate-500" /> Railways (Amendment) Act 2008</li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-200 font-semibold uppercase tracking-wider text-[11px] mb-3">Quick Navigation</h4>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li><Link href="/" className="hover:text-indigo-400 transition-colors">National Dashboard</Link></li>
              <li><Link href="/projects" className="hover:text-indigo-400 transition-colors">Corridor Directory</Link></li>
              <li><Link href="/reports" className="hover:text-indigo-400 transition-colors">MIS Operational Reports</Link></li>
              <li><Link href="/status" className="hover:text-indigo-400 transition-colors">System Operational Status</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & disclaimer */}
        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
          <div>
            BHUMI Platform — Smart India Hackathon Prototype (SIH26016). Not an official government system.
          </div>
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1 text-slate-400 font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> CALA Operations Platform · RFCTLARR Act 2013
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

