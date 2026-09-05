"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Briefcase, 
  Layers, 
  Clock, 
  Activity, 
  MapPin, 
  FileSpreadsheet, 
  Cpu, 
  Menu, 
  X,
  AlertOctagon,
  LogOut,
  Smartphone
} from "lucide-react";

import { NATIONAL_PROJECTS } from "@/lib/api";
import { ThemeToggle } from "@/components/common/ThemeToggle";

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const firstId = NATIONAL_PROJECTS[0]?.id;

  const navGroups = [
    {
      group: "Operations",
      items: [
        { id: "dashboard", href: "/", label: "National Dashboard", icon: LayoutDashboard },
        { id: "projects", href: "/projects", label: "Project Portfolio", icon: Briefcase },
        { id: "parcels", href: "/parcels", label: "Land Parcels", icon: Layers },
        { id: "field", href: "/field", label: "Field Operations", icon: Smartphone },
      ]
    },
    {
      group: "Intelligence",
      items: [
        { id: "timeline", href: "/timeline", label: "Statutory Timelines", icon: Clock },
        { id: "impact", href: firstId ? `/projects/${firstId}/impact` : "/projects#impact", label: "Schedule Impact", icon: Activity },
        { id: "intelligence", href: firstId ? `/projects/${firstId}/intelligence` : "/projects#intelligence", label: "Bottleneck Intel", icon: AlertOctagon },
        { id: "spatial", href: firstId ? `/projects/${firstId}/spatial` : "/projects#spatial", label: "Spatial / GIS", icon: MapPin },
      ]
    },
    {
      group: "Governance & Ops",
      items: [
        { id: "reports", href: "/reports", label: "MIS Reports", icon: FileSpreadsheet },
        { id: "status", href: "/status", label: "System Status", icon: Cpu },
      ]
    }
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.includes("/impact")) return pathname.endsWith("/impact");
    if (href.includes("/intelligence")) return pathname.endsWith("/intelligence");
    if (href.includes("/spatial")) return pathname.endsWith("/spatial");
    if (href === "/projects") return pathname === "/projects" || (pathname.startsWith("/projects/") && !pathname.includes("/impact") && !pathname.includes("/spatial") && !pathname.includes("/intelligence"));
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="h-full flex flex-col justify-between bg-white dark:bg-[#05060e]/95 backdrop-blur-xl border-r border-slate-200 dark:border-white/[0.07] text-slate-800 dark:text-[#f0f4ff] transition-colors duration-200">
      <div>
        {/* Brand */}
        <div className="p-5 pb-4 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-[34px] h-[34px] rounded-[10px] flex-shrink-0 bg-gradient-to-br from-[#7c3aed] to-[#6366f1] flex items-center justify-center shadow-[0_4px_16px_rgba(99,102,241,0.35)] group-hover:scale-105 transition-transform">
              <span className="font-display font-bold text-white text-base">भ</span>
            </div>
            <div>
              <div className="font-display font-extrabold text-slate-900 dark:text-[#f0f4ff] text-[15px] tracking-tight leading-tight flex items-center gap-2">
                BHUMI
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-[10px] text-slate-500 dark:text-[#4a5568] font-mono tracking-wider">
                SIH26016 · Command Unit
              </div>
            </div>
          </Link>
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-800 dark:hover:text-white"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-5 overflow-y-auto no-scrollbar max-h-[calc(100vh-210px)]">
          {navGroups.map((grp) => (
            <div key={grp.group}>
              <div className="px-2 mb-1.5 text-[10px] font-semibold tracking-widest text-slate-400 dark:text-[#3a4258] uppercase font-mono">
                {grp.group}
              </div>
              <div className="space-y-0.5">
                {grp.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                        active
                          ? "bg-indigo-50 dark:bg-gradient-to-r dark:from-indigo-500/20 dark:to-indigo-500/5 text-indigo-700 dark:text-indigo-300 border-l-2 border-indigo-600 dark:border-indigo-500 font-semibold shadow-sm"
                          : "text-slate-600 dark:text-[#8892a4] hover:text-slate-900 dark:hover:text-[#f0f4ff] hover:bg-slate-100 dark:hover:bg-white/[0.035] border-l-2 border-transparent"
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-[#5a6680]"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Controls: Theme Toggle & User Profile */}
      <div className="p-3 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50/70 dark:bg-black/20 space-y-2.5">
        {/* Theme Switcher Pill */}
        <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.05]">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Theme
          </span>
          <ThemeToggle variant="pill" />
        </div>

        {/* Officer Profile & Sign Out */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg flex-shrink-0 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-[#1e3a5f] dark:to-[#153247] border border-indigo-300 dark:border-[#38bdf8]/30 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-[#38bdf8] font-mono shadow-sm">
              BH
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-slate-800 dark:text-[#c8d4e8] truncate">Officer Terminal</div>
              <div className="text-[10px] text-slate-500 dark:text-[#4a5568] font-mono truncate">CALA Division · Active</div>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();
                await supabase.auth.signOut();
              } catch {}
              document.cookie = "bhumi_officer_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              window.location.href = "/login";
            }}
            title="Sign Out of Command Session"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:text-[#64748b] dark:hover:text-[#ef4444] dark:hover:bg-[#ef4444]/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Trigger */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg bg-white/90 dark:bg-[#07080f]/90 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white backdrop-blur-md shadow-lg"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {navContent}
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-60 h-screen flex-shrink-0 sticky top-0 overflow-hidden z-30">
        {navContent}
      </aside>
    </>
  );
}
