"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Layers,
  Clock,
  MapPin,
  FileSpreadsheet,
  Cpu,
  Menu,
  X,
  ShieldCheck,
  FileText,
  Navigation,
  Sparkles,
} from "lucide-react";

import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ExitButton } from "@/components/common/ExitButton";

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navGroups = [
    {
      group: "Operations",
      items: [
        { id: "dashboard", href: "/", label: "National Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      group: "Government Projects",
      items: [
        { id: "projects", href: "/projects", label: "Project Portfolio", icon: Briefcase },
        { id: "project-gis", href: "/projects/gis", label: "Project Spatial Map", icon: Navigation },
      ],
    },
    {
      group: "Landowner & Acquisition",
      items: [
        { id: "landowner-cases", href: "/landowner-cases", label: "Landowner Grievances", icon: FileText },
        { id: "parcels", href: "/parcels", label: "Registered Parcels", icon: Layers },
        { id: "verification", href: "/verification", label: "Field Verification", icon: ShieldCheck },
        { id: "landowner-gis", href: "/landowner-gis", label: "Land Parcel Map", icon: MapPin },
      ],
    },
    {
      group: "Intelligence",
      items: [
        { id: "what-if", href: "/intelligence/what-if", label: "What-If Simulation", icon: Sparkles },
        { id: "timeline", href: "/timeline", label: "Statutory Timelines", icon: Clock },
      ],
    },
    {
      group: "Governance & Audit",
      items: [
        { id: "reports", href: "/reports", label: "MIS Reports", icon: FileSpreadsheet },
        { id: "status", href: "/status", label: "System Status", icon: Cpu },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/projects")
      return (
        pathname === "/projects" ||
        (pathname.startsWith("/projects/") &&
          !pathname.includes("/gis") &&
          !pathname.includes("/spatial"))
      );
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navContent = (
    <div className="h-full flex flex-col justify-between bg-white dark:bg-[#05060e]/95 border-r border-[#e2e8f0] dark:border-white/[0.07] text-slate-800 dark:text-[#f0f4ff] transition-colors duration-200">
      <div>
        {/* Brand */}
        <div className="p-4 pb-3 border-b border-[#e2e8f0] dark:border-white/[0.06] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg flex-shrink-0 bg-[#0a2c5f] flex items-center justify-center shadow-sm group-hover:bg-[#082449] transition-colors">
              <span className="font-bold text-white text-sm font-sans">भ</span>
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-[#f0f4ff] text-[14px] tracking-tight leading-tight flex items-center gap-2">
                BHUMI
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-[9px] text-slate-400 dark:text-[#4a5568] font-mono tracking-wider uppercase">
                SIH26016 · CALA Administration
              </div>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-700 dark:hover:text-white"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-4 overflow-y-auto no-scrollbar max-h-[calc(100vh-200px)]">
          {navGroups.map((grp) => (
            <div key={grp.group}>
              <div className="px-2 mb-1.5">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-[#5a6680] uppercase font-mono">
                  {grp.group}
                </span>
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
                          ? "bg-[#0a2c5f] text-white font-semibold shadow-sm"
                          : "text-slate-600 dark:text-[#8892a4] hover:text-slate-900 dark:hover:text-[#f0f4ff] hover:bg-slate-100 dark:hover:bg-white/[0.035]"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          active ? "text-white" : "text-slate-400 dark:text-[#5a6680]"
                        }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer: Theme Toggle + User Profile */}
      <div className="p-3 border-t border-[#e2e8f0] dark:border-white/[0.06] bg-slate-50 dark:bg-black/20 space-y-2.5">
        <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/[0.05]">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Theme</span>
          <ThemeToggle variant="pill" />
        </div>
        <div className="flex items-center justify-between pt-1 gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg flex-shrink-0 bg-[#0a2c5f] flex items-center justify-center text-[10px] font-bold text-white font-mono">
              RK
            </div>
            <div className="truncate">
              <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                CALA Directorate
              </div>
              <div className="text-[9px] text-slate-400 font-mono truncate">
                Land Acquisition Authority
              </div>
            </div>
          </div>
          <ExitButton variant="sidebar" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-md"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 h-screen flex-shrink-0 sticky top-0 overflow-hidden z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 h-full z-10">{navContent}</div>
        </div>
      )}
    </>
  );
}
