"use client";

import React, { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  FileText, 
  PlusCircle, 
  User, 
  Monitor, 
  Smartphone, 
  ArrowLeft
} from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";

interface LandownerShellProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

export function LandownerShell({ children, title, showBack = false }: LandownerShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [owner, setOwner] = useState<any>(null);

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setOwner({
            user_id: data.user.id,
            name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
            email: data.user.email
          });
        } else {
          // Check bhumi_landowner_session cookie
          const match = typeof document !== "undefined" ? document.cookie.match(/bhumi_landowner_session=([^;]+)/) : null;
          if (match) {
            try {
              const parsed = JSON.parse(decodeURIComponent(match[1]));
              if (parsed.user_id || parsed.owner_id) {
                setOwner({
                  user_id: parsed.user_id || parsed.owner_id,
                  name: parsed.name || parsed.email?.split('@')[0],
                  email: parsed.email
                });
              }
            } catch {}
          }
        }
      });
    });
  }, []);

  const navItems = [
    {
      label: "My Land",
      href: "/landowner/home",
      icon: Home,
      active: pathname === "/landowner" || pathname === "/landowner/home"
    },
    {
      label: "Grievances",
      href: "/landowner/complaints",
      icon: FileText,
      active: pathname === "/landowner/complaints" || pathname.startsWith("/landowner/complaints/") && pathname !== "/landowner/complaints/new"
    },
    {
      label: "Lodge Issue",
      href: "/landowner/complaints/new",
      icon: PlusCircle,
      active: pathname === "/landowner/complaints/new",
      highlight: true
    },
    {
      label: "My Profile",
      href: "/landowner/profile",
      icon: User,
      active: pathname === "/landowner/profile"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8] dark:bg-[#07080F] text-[#14213D] dark:text-[#F0F4FF] antialiased transition-colors duration-200">
      
      {/* Top Official Government Citizen Header */}
      <header className="sticky top-0 z-40 w-full bg-[#0B2E59] text-white shadow-sm flex-shrink-0">
        <div className="max-w-lg mx-auto px-3.5 py-2 flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2.5 overflow-hidden">
            {showBack ? (
              <button
                type="button"
                onClick={() => router.back()}
                className="p-1.5 rounded-[4px] bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/15"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <Link href="/landowner/home" className="flex items-center gap-2 flex-shrink-0">
                <div className="w-7 h-7 rounded-[4px] bg-amber-400 text-[#0B2E59] flex items-center justify-center font-black font-devanagari text-sm shadow-xs border border-amber-300">
                  भ
                </div>
              </Link>
            )}

            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white truncate block font-display leading-tight">
                  {title || "BHUMI Citizen Portal"}
                </span>
                <span className="px-1.5 py-0.2 rounded-[3px] text-[9px] font-mono font-bold bg-[#E8F5E9]/20 text-emerald-200 border border-emerald-400/40 whitespace-nowrap">
                  TITLEHOLDER
                </span>
              </div>
              {owner && (
                <span className="text-[10px] text-white/70 font-mono truncate block leading-tight mt-0.5">
                  {owner.name} · {owner.contact_village || "Corridor Sector"}
                </span>
              )}
            </div>
          </div>

          {/* Right Action Icons: Role Switchers & Theme */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                window.location.href = "/field/dashboard";
              }}
              title="Switch to Field Officer Console"
              className="p-1.5 rounded-[4px] bg-white/10 text-white/90 hover:text-white border border-white/15 transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              title="Switch to Desktop Admin Console"
              className="p-1.5 rounded-[4px] bg-white/10 text-white/90 hover:text-white border border-white/15 transition-colors cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>

            <ThemeToggle variant="icon" className="!bg-white/10 !border-white/15 !text-white hover:!bg-white/20 !rounded-[4px]" />
          </div>
        </div>

        {/* National Tricolor 3px Band */}
        <div className="flex h-[3px] w-full">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto pb-24 px-3 sm:px-4 pt-4">
        {children}
      </main>

      {/* Persistent Citizen Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0D121F]/95 backdrop-blur-md border-t border-[#DCE2E8] dark:border-white/10 shadow-sm transition-colors duration-200">
        <div className="max-w-lg mx-auto grid grid-cols-4 h-15">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  item.highlight
                    ? "text-[#0B2E59] dark:text-sky-400 font-bold"
                    : item.active
                    ? "text-[#0B2E59] dark:text-sky-400 font-bold"
                    : "text-[#5A6A80] dark:text-slate-400 hover:text-[#14213D] dark:hover:text-slate-200"
                }`}
              >
                {item.highlight ? (
                  <div className="w-8 h-8 rounded-[4px] bg-[#0B2E59] dark:bg-[#1E3A5F] hover:bg-[#082242] text-white flex items-center justify-center -mt-3 shadow-md border-2 border-white dark:border-[#0D121F]">
                    <Icon className="w-4 h-4" />
                  </div>
                ) : (
                  <Icon className={`w-4 h-4 ${item.active ? "text-[#0B2E59] dark:text-sky-400" : "text-[#5A6A80] dark:text-slate-400"}`} />
                )}
                <span className="text-[10px] tracking-tight">{item.label}</span>
                {item.active && !item.highlight && (
                  <span className="absolute bottom-0 w-8 h-[2px] bg-[#0B2E59] dark:bg-sky-400" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
