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
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 transition-all shadow-sm cursor-pointer disabled:opacity-50 flex-shrink-0 ${className}`}
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
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 transition-all shadow-sm cursor-pointer disabled:opacity-50 ${className}`}
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
