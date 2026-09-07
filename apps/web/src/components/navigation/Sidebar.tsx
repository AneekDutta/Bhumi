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
        { id: "golden-demo", translationKey: "nav.golden_demo", href: "/intelligence/golden-demo", label: "Golden Demo Flow", icon: PlayCircle, badge: "DEMO" },
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
    <div className="h-full flex flex-col justify-between bg-white dark:bg-[#080E18] border-r border-[#DCE2E8] dark:border-white/[0.07] text-[#333333] dark:text-[#F0F4FF] transition-colors duration-200">
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Brand */}
        <div className="p-4 pb-3 border-b border-[#DCE2E8] dark:border-white/[0.06] flex items-center justify-between flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 group" title="BHUMI Operations Console">
            <CalaSealLogo size={32} className="w-8 h-8 flex-shrink-0 drop-shadow-xs" variant="light" />
            <div>
              <div className="font-bold text-[#14213D] dark:text-white text-[15px] leading-tight">
                BHUMI Console
              </div>
              <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                CALA Directorate · Kota
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
        <nav className="p-3 space-y-4 flex-1 min-h-0 overflow-y-auto">
          {navGroups.map((grp) => (
            <div key={grp.groupKey}>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase">
                  {t(grp.groupKey) || grp.fallbackGroup}
                </span>
              </div>
              <div className="space-y-0.5">
                {grp.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  const itemLabel = t(item.translationKey) || item.label;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-[4px] transition-all duration-150 ease-out ${
                        active
                          ? "bg-[#E6F0FA] dark:bg-[#0B5FA5]/20 text-[#0B2E59] dark:text-[#38BDF8] font-bold border-l-[3px] border-[#0B5FA5] shadow-xs"
                          : "text-[#333333] dark:text-[#CBD5E1] hover:text-[#0B2E59] hover:bg-[#F1F4F7] dark:hover:bg-white/[0.04] font-medium"
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-[#0B5FA5] dark:text-[#38BDF8]" : "text-[#0B2E59]/70 dark:text-slate-400"}`} strokeWidth={active ? 2 : 1.5} />
                      <span className="flex-1 truncate">{itemLabel}</span>
                      {(item as any).badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-[3px] font-bold bg-[#0B2E59]/10 dark:bg-sky-400/20 text-[#0B2E59] dark:text-sky-300 border border-[#0B2E59]/20 dark:border-sky-400/30">
                          {(item as any).badge}
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

      {/* Footer Controls: Theme Toggle & User Profile */}
      <div className="p-3 border-t border-[#DCE2E8] dark:border-white/[0.06] bg-[#F8FAFC] dark:bg-black/20 space-y-2.5 flex-shrink-0">
        {/* Theme Switcher Pill (Stacked layout so Auto button never overflows) */}
        <div className="p-2 rounded-[4px] bg-white dark:bg-slate-900/60 border border-[#DCE2E8] dark:border-white/[0.05] space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
              {t("nav.appearance")}
            </span>
          </div>
          <ThemeToggle variant="pill" />
        </div>

        {/* Officer Profile & Sign Out */}
        <div className="flex items-center justify-between pt-1 gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-[4px] flex-shrink-0 bg-[#0B2E59] text-white flex items-center justify-center text-xs font-bold font-mono shadow-xs">
              RK
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-[#14213D] dark:text-slate-200 truncate">
                Sh. Rajesh Kumar
              </div>
              <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">
                CALA Officer · Kota District
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
        className="md:hidden fixed top-3 left-3 z-50 p-1.5 rounded-[4px] bg-white dark:bg-[#0D121F] border border-[#DCE2E8] dark:border-white/10 text-[#0B2E59] dark:text-slate-200 shadow-xs"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Persistent Sticky Sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0 sticky top-[89px] h-[calc(100vh-89px)] overflow-hidden z-30 border-r border-[#DCE2E8] dark:border-white/[0.07]">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-slide-in shadow-2xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
