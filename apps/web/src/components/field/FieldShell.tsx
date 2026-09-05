"use client";

import React, { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  ClipboardList, 
  MapPin, 
  RefreshCw, 
  User, 
  Wifi, 
  WifiOff, 
  Monitor, 
  ArrowLeft,
  ShieldCheck,
  Smartphone
} from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { offlineStore } from "@/lib/offlineStore";

interface FieldShellProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

export function FieldShell({ children, title, showBack = false }: FieldShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [officer, setOfficer] = useState<any>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const updateQueue = () => {
      const items = offlineStore.getAll();
      setQueueCount(items.filter((i) => !i.synced).length);
    };

    updateQueue();
    window.addEventListener("bhumi-queue-change", updateQueue);

    const active = offlineStore.getActiveOfficer();
    if (active) {
      setOfficer(active);
    } else {
      setOfficer({
        id: "OFF-001",
        name: "Ramesh Patel",
        designation: "Patwari / Lekhpal"
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("bhumi-queue-change", updateQueue);
    };
  }, []);

  const navItems = [
    {
      label: "Parcels",
      href: "/field/parcels",
      icon: ClipboardList,
      active: pathname === "/field" || pathname === "/field/parcels"
    },
    {
      label: "GIS Map",
      href: "/field/map",
      icon: MapPin,
      active: pathname === "/field/map"
    },
    {
      label: "Sync",
      href: "/field/sync",
      icon: RefreshCw,
      badge: queueCount > 0 ? queueCount : undefined,
      active: pathname === "/field/sync"
    },
    {
      label: "Officer",
      href: "/field/login",
      icon: User,
      active: pathname === "/field/login"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 antialiased selection:bg-emerald-500/30">
      {/* Top Mobile App Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-3 py-2.5">
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
              <Link href="/field" className="flex items-center gap-2 flex-shrink-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-emerald-950">
                  <Smartphone className="w-4 h-4" />
                </div>
              </Link>
            )}

            <div className="overflow-hidden">
              <span className="font-bold text-sm text-white truncate block">
                {title || "BHUMI Field"}
              </span>
              {officer && (
                <span className="text-[10px] text-emerald-400 font-mono truncate block">
                  {officer.name} · {officer.designation || "Officer"}
                </span>
              )}
            </div>
          </div>

          {/* Right Status Badges */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Online / Offline Status */}
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                isOnline
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
              }`}
            >
              {isOnline ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <Wifi className="w-2.5 h-2.5" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-2.5 h-2.5" />
                  <span>Offline</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                document.cookie = "bhumi_officer_session=officer%40bhumi.gov.in; path=/; max-age=86400; SameSite=Lax";
                window.location.href = "/";
              }}
              title="Switch to Web Officer / Admin Console"
              className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>

            <ThemeToggle variant="icon" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto">
        {children}
      </main>

      {/* Persistent Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800">
        <div className="max-w-lg mx-auto grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  item.active
                    ? "text-emerald-400 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${item.active ? "text-emerald-400" : "text-slate-400"}`} />
                  {typeof item.badge === "number" && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-amber-500 text-slate-950 font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span>{item.label}</span>
                {item.active && (
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
