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
  ShieldCheck,
  FileText,
  Navigation,
  Sparkles,
  Database
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
        { id: "dashboard", href: "/", label: "National Dashboard", icon: LayoutDashboard }
      ]
    },
    {
      group: "Government Projects",
      items: [
        { id: "projects", href: "/projects", label: "Project Portfolio", icon: Briefcase },
        { id: "project-gis", href: "/projects/gis", label: "Project Spatial Map", icon: Navigation }
      ]
    },
    {
      group: "Landowner & Acquisition",
      items: [
        { id: "landowner-cases", href: "/landowner-cases", label: "Landowner Grievances", icon: FileText },
        { id: "parcels", href: "/parcels", label: "Registered Parcels", icon: Layers },
        { id: "verification", href: "/verification", label: "Field Verification", icon: ShieldCheck },
        { id: "landowner-gis", href: "/landowner-gis", label: "Land Parcel Map", icon: MapPin }
      ]
    },
    {
      group: "Intelligence",
      items: [
        { id: "what-if", href: "/intelligence/what-if", label: "What-If Simulation", icon: Sparkles },
        { id: "timeline", href: "/timeline", label: "Statutory Timelines", icon: Clock }
      ]
    },
    {
      group: "Governance & Audit",
      items: [
        { id: "reports", href: "/reports", label: "MIS Reports", icon: FileSpreadsheet },
        { id: "status", href: "/status", label: "System Status", icon: Cpu }
      ]
    }
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/projects") return pathname === "/projects" || (pathname.startsWith("/projects/") && !pathname.includes("/gis") && !pathname.includes("/spatial"));
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navContent = (
    <div className="h-full flex flex-col justify-between bg-white dark:bg-[#080E18] border-r border-[#DCE2E8] dark:border-white/[0.07] text-[#333333] dark:text-[#F0F4FF] transition-colors duration-200">
      <div>
        {/* Brand */}
        <div className="p-4 pb-3 border-b border-[#DCE2E8] dark:border-white/[0.06] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-[34px] h-[34px] rounded-[4px] flex-shrink-0 bg-[#0B2E59] flex items-center justify-center text-white font-devanagari font-bold text-base shadow-sm">
              भ
            </div>
            <div>
              <div className="font-bold text-[#14213D] dark:text-white text-[15px] leading-tight">
                BHUMI Portal
              </div>
              <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                CALA Directorate · MoRTH
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
        <nav className="p-3 space-y-4 overflow-y-auto no-scrollbar max-h-[calc(100vh-210px)]">
          {navGroups.map((grp) => (
            <div key={grp.group}>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase">
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
                      className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-[4px] transition-all ${
                        active
                          ? "bg-[#E6F0FA] dark:bg-[#0B5FA5]/20 text-[#0B2E59] dark:text-[#38BDF8] font-bold border-l-[3px] border-[#0B5FA5] shadow-sm"
                          : "text-[#333333] dark:text-[#CBD5E1] hover:text-[#0B2E59] hover:bg-[#F1F4F7] dark:hover:bg-white/[0.04] font-medium"
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-[#0B5FA5] dark:text-[#38BDF8]" : "text-[#0B2E59]/70 dark:text-slate-400"}`} strokeWidth={active ? 2 : 1.5} />
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
      <div className="p-3 border-t border-[#DCE2E8] dark:border-white/[0.06] bg-[#F8FAFC] dark:bg-black/20 space-y-2.5">
        {/* Theme Switcher Pill */}
        <div className="flex items-center justify-between px-2 py-1 rounded-[4px] bg-white dark:bg-slate-900/60 border border-[#DCE2E8] dark:border-white/[0.05]">
          <span className="text-[11px] font-semibold text-[#64748B] dark:text-slate-400">
            Appearance
          </span>
          <ThemeToggle variant="pill" />
        </div>

        {/* Officer Profile & Sign Out */}
        <div className="flex items-center justify-between pt-1 gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-[4px] flex-shrink-0 bg-[#0B2E59] text-white flex items-center justify-center text-xs font-bold font-mono shadow-sm">
              RK
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-[#14213D] dark:text-slate-200 truncate">
                Sh. Rajesh Kumar
              </div>
              <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">
                CALA Varanasi
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
      {/* Mobile Menu Trigger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 p-1.5 rounded-[4px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 text-[#0B2E59] dark:text-slate-200 shadow-xs"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 h-screen flex-shrink-0 sticky top-0 overflow-hidden z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 h-full z-10 animate-slide-in">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
