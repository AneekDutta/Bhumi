"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
  SlidersHorizontal,
  Database,
  Scale,
  ScanLine,
  PlayCircle,
  Bot,
  Mic
} from "lucide-react";

import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ExitButton } from "@/components/common/ExitButton";
import { useLanguage } from "@/context/LanguageContext";

import { CalaSealLogo } from "@/components/common/CalaSealLogo";

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language, t } = useLanguage();

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const navGroups = [
    {
      groupKey: "nav.operations",
      fallbackGroup: "Operations",
      items: [
        { id: "action-center", translationKey: "nav.action_center", href: "/action-center", label: "Officer Action Center", icon: AlertOctagon, badge: "CORE" },
        { id: "dashboard", translationKey: "nav.dashboard", href: "/dashboard", label: "National Dashboard", icon: LayoutDashboard }
      ]
    },
    {
      groupKey: "nav.gov_projects",
      fallbackGroup: "Government Projects",
      items: [
        { id: "projects", translationKey: "nav.project_portfolio", href: "/projects", label: "Project Portfolio", icon: Briefcase },
        { id: "project-gis", translationKey: "nav.project_gis", href: "/projects/gis", label: "Project Spatial Map", icon: Navigation }
      ]
    },
    {
      groupKey: "nav.landowner_acq",
      fallbackGroup: "Landowner & Acquisition",
      items: [
        { id: "landowner-cases", translationKey: "nav.landowner_cases", href: "/landowner-cases", label: "Landowner Grievances", icon: FileText },
        { id: "parcels", translationKey: "nav.registered_parcels", href: "/parcels", label: "Registered Parcels", icon: Layers },
        { id: "verification", translationKey: "nav.field_verification", href: "/verification", label: "Field Verification", icon: ShieldCheck },
        { id: "landowner-gis", translationKey: "nav.land_parcel_map", href: "/landowner-gis", label: "Land Parcel Map", icon: MapPin }
      ]
    },
    {
      groupKey: "nav.intelligence",
      fallbackGroup: "Intelligence",
      items: [
        { id: "assistant", translationKey: "nav.assistant", href: "/intelligence/assistant", label: "Intelligence & Voice", icon: Bot, badge: "AI" },
        { id: "document-intelligence", translationKey: "nav.document_intelligence", href: "/document-intelligence", label: "Document Intelligence", icon: ScanLine },
        { id: "what-if", translationKey: "nav.what_if", href: "/intelligence/what-if", label: "What-If Simulation", icon: SlidersHorizontal },
        { id: "timeline", translationKey: "nav.statutory_timelines", href: "/timeline", label: "Statutory Timelines", icon: Clock }
      ]
    },
    {
      groupKey: "nav.governance_law",
      fallbackGroup: "Governance & Law",
      items: [
        { id: "legal-rights", translationKey: "nav.legal_rights", href: "/legal-rights", label: "Legal & Rights", icon: Scale },
        { id: "reports", translationKey: "nav.reports", href: "/reports", label: "MIS Reports", icon: FileSpreadsheet },
        { id: "status", translationKey: "nav.system_status", href: "/status", label: "System Status", icon: Cpu }
      ]
    }
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    if (href === "/projects") return pathname === "/projects" || (pathname.startsWith("/projects/") && !pathname.includes("/gis") && !pathname.includes("/spatial"));
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navContent = (
    <div className="h-full flex flex-col justify-between bg-white dark:bg-[#080E18] text-[#333333] dark:text-[#F0F4FF] transition-colors duration-200">
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Desktop Authority Console Subheader Strip (No duplicate logo) */}
        <div className="hidden md:flex items-center justify-between px-3 py-2 border-b border-[#DCE2E8] dark:border-white/[0.07] bg-[#F8FAFC]/90 dark:bg-white/[0.02] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-[#0B2E59] dark:text-sky-400 uppercase tracking-wider font-mono">
              {t("nav.command_menu") || "Authority Console"}
            </span>
          </div>
          <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shadow-xs">
            Kota Desk
          </span>
        </div>

        {/* Mobile Drawer Brand Header with Close Button */}
        <div className="md:hidden p-4 pb-3 border-b border-[#DCE2E8] dark:border-white/[0.07] flex items-center justify-between flex-shrink-0 bg-[#F8FAFC] dark:bg-white/[0.02]">
          <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 group">
            <CalaSealLogo size={32} className="w-8 h-8 flex-shrink-0 drop-shadow-xs" variant="light" />
            <div>
              <div className="font-bold text-[#14213D] dark:text-white text-[15px] leading-tight">
                KOSH Console
              </div>
              <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                CALA Directorate · Kota
              </div>
            </div>
          </Link>
          <button 
            onClick={() => setMobileOpen(false)}
            className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 rounded hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items (Strictly Fixed & Non-Scrollable) */}
        <nav className="p-2 sm:px-2.5 sm:py-2 space-y-1.5 flex-1 min-h-0 overflow-hidden select-none">
          {navGroups.map((grp, idx) => (
            <div key={grp.groupKey} className={idx > 0 ? "pt-0.5" : ""}>
              <div className="px-2 pb-0.5 flex items-center justify-between">
                <span className="text-[9.5px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider font-sans">
                  {t(grp.groupKey) || grp.fallbackGroup}
                </span>
              </div>
              <div className="space-y-0.5">
                {grp.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  const itemLabel = t(item.translationKey) || item.label;
                  const badge = (item as any).badge;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`group flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-all ${
                        active
                          ? "bg-[#0B2E59] text-white shadow-xs font-semibold"
                          : "text-[#334155] dark:text-[#CBD5E1] hover:text-[#0B2E59] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-white/[0.05] font-medium"
                      }`}
                    >
                      <Icon 
                        className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                          active 
                            ? "text-amber-300" 
                            : "text-[#0B2E59]/70 dark:text-slate-400 group-hover:text-[#0B2E59] dark:group-hover:text-white"
                        }`} 
                        strokeWidth={active ? 2 : 1.75} 
                      />
                      <span className="flex-1 truncate tracking-tight">{itemLabel}</span>
                      {badge && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold tracking-tight shadow-xs ${
                          active
                            ? "bg-white/20 text-white"
                            : badge === "CORE"
                            ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                            : badge === "AI"
                            ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        }`}>
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Desktop Compact Statutory Compliance Status Footer */}
      <div className="hidden md:block p-2.5 px-3 border-t border-[#DCE2E8] dark:border-white/[0.07] bg-[#F8FAFC] dark:bg-black/20 flex-shrink-0">
        <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="truncate font-medium">RFCTLARR &bull; PostGIS Twin</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0 ml-1">SIH26016</span>
        </div>
      </div>

      {/* Mobile Drawer Footer Controls */}
      <div className="md:hidden p-3 border-t border-[#DCE2E8] dark:border-white/[0.07] bg-[#F8FAFC] dark:bg-black/20 space-y-2.5 flex-shrink-0">
        <div className="flex items-center justify-between px-2 py-1 rounded bg-white dark:bg-slate-900/60 border border-[#DCE2E8] dark:border-white/[0.05]">
          <span className="text-[11px] font-semibold text-[#64748B] dark:text-slate-400">
            {t("nav.appearance")}
          </span>
          <ThemeToggle variant="pill" />
        </div>

        <div className="flex items-center justify-between pt-1 gap-2">
          <div className="flex items-center gap-2 truncate">
            <div className="w-7 h-7 rounded bg-[#0B2E59] text-amber-300 flex items-center justify-center text-xs font-bold font-devanagari flex-shrink-0">
              क
            </div>
            <div className="truncate text-left">
              <div className="text-xs font-bold text-[#14213D] dark:text-slate-200 truncate">
                CALA Officer
              </div>
              <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">
                Kota District
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
        className="md:hidden fixed top-3 left-3 z-50 p-1.5 rounded bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 text-[#0B2E59] dark:text-slate-200 shadow-xs cursor-pointer"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Persistent Sidebar (Matches header layout perfectly) */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 h-full overflow-hidden z-30 border-r border-[#DCE2E8] dark:border-white/[0.07] bg-white dark:bg-[#080E18]">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-slide-in shadow-2xl border-r border-[#DCE2E8] dark:border-white/[0.07]">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
