"use client";

import React, { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";

interface ExitButtonProps {
  variant?: "header" | "sidebar";
  className?: string;
}

export function ExitButton({ variant = "header", className = "" }: ExitButtonProps) {
  const [exiting, setExiting] = useState(false);

  const handleExit = async () => {
    setExiting(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Sign out notification:", e);
    }
    // Expire session cookies cleanly
    document.cookie = "bhumi_officer_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "bhumi_landowner_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    // Redirect to login
    window.location.href = "/login";
  };

  if (variant === "sidebar") {
    return (
      <button
        onClick={handleExit}
        disabled={exiting}
        title="Exit Admin Console / Sign Out"
        aria-label="Exit Admin Session"
        className={`flex items-center gap-1.5 px-2 py-1 rounded-[3px] text-xs font-semibold text-[#B32424] dark:text-rose-300 hover:bg-[#FFEBEE] dark:hover:bg-rose-950/40 border border-[#FFCDD2] dark:border-rose-800/40 transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex-shrink-0 ${className}`}
      >
        {exiting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <LogOut className="w-3.5 h-3.5" />
        )}
        <span>Exit</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleExit}
      disabled={exiting}
      title="Exit Admin Console / Sign Out"
      aria-label="Exit Admin Session"
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-[3px] bg-[#FFEBEE] hover:bg-[#FFCDD2] dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-[#B32424] dark:text-rose-300 border border-[#FFCDD2] dark:border-rose-800/60 transition-colors shadow-xs cursor-pointer disabled:opacity-50 ${className}`}
    >
      {exiting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <LogOut className="w-3.5 h-3.5" />
      )}
      <span>Exit</span>
    </button>
  );
}
