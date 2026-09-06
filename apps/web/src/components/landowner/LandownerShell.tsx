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
        }
      });
    });
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
      label: "My Profile",
      href: "/landowner/profile",
      icon: User,
      active: pathname === "/landowner/profile"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f9] text-slate-900 antialiased selection:bg-[#0a2c5f]/15">
      
      {/* Government Header — Navy */}
      <header className="sticky top-0 z-40 w-full flex-shrink-0 shadow-md">
        {/* Main navy header bar */}
        <div className="bg-[#0a2c5f] px-3 py-2.5">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-2">

            <div className="flex items-center gap-2.5 overflow-hidden">
              {showBack ? (
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors flex-shrink-0"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <Link href="/landowner/home" className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-[#0a2c5f] font-bold text-sm shadow-sm">
                    भ
                  </div>
                </Link>
              )}

              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white truncate block">
                    {title || "BHUMI Citizen Portal"}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-400/20 text-amber-200 border border-amber-400/30 whitespace-nowrap">
                    AFFECTED PERSON
                  </span>
                </div>
                {owner && (
                  <span className="text-[10px] text-amber-200 font-mono truncate block">
                    {owner.name}
                  </span>
                )}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => { window.location.href = "/field/dashboard"; }}
                title="Field Officer App"
                className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white border border-white/20 transition-colors cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => { window.location.href = "/"; }}
                title="Admin Console"
                className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white border border-white/20 transition-colors cursor-pointer"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>

              <ThemeToggle variant="icon" />
            </div>
          </div>
        </div>

        {/* Tricolor strip */}
        <div className="flex h-[2px] w-full">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>
      </header>

      {/* Main Content Area — Light */}
      <main className="flex-1 w-full max-w-lg mx-auto pb-24">
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#e2e8f0] shadow-lg">
        <div className="max-w-lg mx-auto grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  item.highlight
                    ? "text-[#0a2c5f] font-bold"
                    : item.active
                    ? "text-[#0a2c5f] font-semibold"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                {item.highlight ? (
                  <div className="w-9 h-9 rounded-full bg-[#0a2c5f] hover:bg-[#082449] text-white flex items-center justify-center -mt-4 shadow-lg border-2 border-white">
                    <Icon className="w-5 h-5" />
                  </div>
                ) : (
                  <Icon className={`w-5 h-5 ${item.active ? "text-[#0a2c5f]" : "text-slate-400"}`} />
                )}
                <span>{item.label}</span>
                {item.active && !item.highlight && (
                  <span className="absolute bottom-1 w-6 h-0.5 rounded-full bg-[#0a2c5f]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
