"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Layers, 
  FileSpreadsheet, 
  Activity, 
  Menu, 
  X, 
  ShieldCheck,
  Search
} from 'lucide-react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { href: '/', label: 'National Dashboard', icon: LayoutDashboard },
    { href: '/projects', label: 'Corridor Portfolio', icon: Layers },
    { href: '/reports', label: 'MIS Reports', icon: FileSpreadsheet },
    { href: '/status', label: 'System Engine', icon: Activity },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white sticky top-0 z-50 shadow-gov">
      {/* Top micro-banner for statutory authority */}
      <div className="bg-slate-900/80 border-b border-slate-800/60 text-[11px] text-slate-400 py-1 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-medium text-slate-300">
              National Infrastructure Pipeline (NIP) &bull; SIH26016 Decision Support System
            </span>
          </div>
          <div className="hidden sm:flex items-center space-x-3 text-[10px]">
            <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> PostGIS + CPM Engine Active
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Statutory Framework: RFCTLARR 2013</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="flex items-center space-x-3 group focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-lg p-1 transition-all"
            >
              {/* Ashoka/Chakra inspired emblem SVG badge */}
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-900 border border-indigo-400/30 flex items-center justify-center shadow-glow-indigo group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                  <path d="M12 3v6M12 15v6M3 12h6M15 12h6" strokeLinecap="round" />
                  <path d="m5.6 5.6 4.3 4.3M14.1 14.1l4.3 4.3M18.4 5.6l-4.3 4.3M9.9 14.1l-4.3 4.3" strokeLinecap="round" />
                </svg>
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
              </div>

              <div className="flex flex-col">
                <div className="flex items-baseline space-x-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                    BHUMI
                  </span>
                  <span className="text-xs font-semibold text-amber-400 font-sans tracking-wide">
                    भूमि
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">
                  Land Acquisition Intelligence
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-md text-xs font-semibold tracking-wide transition-all ${
                    active
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions & Live Indicator */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link
              href="/projects/c0a80124-0001-4000-8000-000000000001/impact"
              className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-200" />
              <span>Simulate Interventions</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-lg px-4 pt-3 pb-5 space-y-2 shadow-xl animate-fadeIn">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  active
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-800">
            <Link
              href="/projects/c0a80124-0001-4000-8000-000000000001/impact"
              className="block text-center w-full px-3 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow-sm"
            >
              Simulate Counterfactual Interventions
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

