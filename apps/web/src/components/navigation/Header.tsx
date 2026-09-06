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
  Search
} from 'lucide-react';
import { CalaSealLogo } from '@/components/common/CalaSealLogo';

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
    <header className="bg-gov-navy text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="flex items-center space-x-3 group focus:outline-none focus:ring-1 focus:ring-white/40 rounded-[4px] p-1 transition-all"
            >
              <CalaSealLogo size={32} className="w-8 h-8 flex-shrink-0" variant="light" />

              <div className="flex flex-col leading-tight">
                <span className="font-devanagari font-semibold text-base text-white group-hover:text-white/90 transition-colors">
                  भूमि — CALA
                </span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-white/90 transition-colors">
                    BHUMI
                  </span>
                  <span className="text-[10px] text-white/70 tracking-wider uppercase font-medium">
                    Land Acquisition &amp; Management
                  </span>
                </div>
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
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold tracking-wide transition-all ${
                    active
                      ? 'bg-white/15 text-white border border-white/30 shadow-xs'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-gov-saffron' : 'text-white/50'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions & Live Indicator */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link
              href="/projects/c0a80124-0001-4000-8000-000000000001/impact"
              className="px-3 py-1.5 rounded-[3px] bg-white hover:bg-slate-100 text-gov-navy text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-gov-navy" />
              <span>Simulate Interventions</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-[3px] text-white/60 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/40"
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
        <div className="md:hidden border-t border-white/10 bg-gov-navy px-4 pt-3 pb-5 space-y-2 shadow-xl animate-fadeIn">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2.5 px-3 py-2 rounded-[3px] text-sm font-medium ${
                  active
                    ? 'bg-white/15 text-white font-semibold shadow-xs'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-white/10">
            <Link
              href="/projects/c0a80124-0001-4000-8000-000000000001/impact"
              className="block text-center w-full px-3 py-2 rounded-[3px] bg-white text-gov-navy text-sm font-bold shadow-xs"
            >
              Simulate Counterfactual Interventions
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

