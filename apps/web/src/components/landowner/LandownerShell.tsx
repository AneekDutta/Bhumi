"use client";

import React, { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  Layers, 
  FileText, 
  AlertCircle, 
  User, 
  PlusCircle, 
  Monitor, 
  Smartphone, 
  ShieldCheck, 
  ArrowLeft,
  RefreshCw,
  LogOut
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
    // Read session cookie
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const sessionCookie = cookies.find((c) => c.startsWith("bhumi_landowner_session=") || c.startsWith("bhumi_officer_session="));
    if (sessionCookie) {
      try {
        const val = decodeURIComponent(sessionCookie.split("=")[1]);
        const parsed = JSON.parse(val);
        if (parsed) {
          setOwner(parsed);
          return;
        }
      } catch {}
    }
    setOwner(null);
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
      label: "Citizen Profile",
      href: "/landowner/profile",
      icon: User,
      active: pathname === "/landowner/profile"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500/30">
      
      {/* Top Citizen Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-3 py-2.5">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2 overflow-hidden">
            {showBack ? (
              <button
                type="button"
                onClick={() => router.back()}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <Link href="/landowner/home" className="flex items-center gap-2 flex-shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-950">
                  भ
                </div>
              </Link>
            )}

            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white truncate block font-display">
                  {title || "BHUMI Citizen Portal"}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AFFECTED PERSON
                </span>
              </div>
              {owner && (
                <span className="text-[10px] text-emerald-400 font-mono truncate block">
                  {owner.name} · {owner.contact_village || "Corridor Sector"}
                </span>
              )}
            </div>
          </div>

          {/* Right Action Icons: Role Switchers & Theme */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Quick Switch to Field Ops */}
            <button
              type="button"
              onClick={() => {
                const sessionData = {
                  officer_id: "OFF-001",
                  name: "Ramesh Patel",
                  designation: "Patwari / Revenue Lekhpal",
                  assigned_villages: ["Ramganj Mandi", "Kanhera Kalan"],
                  role: "FIELD_OFFICER"
                };
                document.cookie = `bhumi_officer_session=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=604800; SameSite=Lax`;
                window.location.href = "/field/dashboard";
              }}
              title="Switch to Field Officer Console"
              className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-emerald-400 border border-slate-700/60 transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>

            {/* Quick Switch to Desktop Admin */}
            <button
              type="button"
              onClick={() => {
                document.cookie = "bhumi_officer_session=officer%40bhumi.gov.in; path=/; max-age=86400; SameSite=Lax";
                window.location.href = "/";
              }}
              title="Switch to Desktop Admin Console"
              className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-indigo-400 border border-slate-700/60 transition-colors cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>

            <ThemeToggle variant="icon" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto pb-24">
        {children}
      </main>

      {/* Persistent Citizen Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800">
        <div className="max-w-lg mx-auto grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  item.highlight
                    ? "text-emerald-400 font-bold"
                    : item.active
                    ? "text-emerald-400 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {item.highlight ? (
                  <div className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center -mt-4 shadow-lg shadow-emerald-950 border-2 border-slate-900">
                    <Icon className="w-5 h-5" />
                  </div>
                ) : (
                  <Icon className={`w-5 h-5 ${item.active ? "text-emerald-400" : "text-slate-400"}`} />
                )}
                <span>{item.label}</span>
                {item.active && !item.highlight && (
                  <span className="absolute bottom-1 w-6 h-0.5 rounded-full bg-emerald-400" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
