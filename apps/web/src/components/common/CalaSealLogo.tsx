import React from "react";

interface CalaSealLogoProps {
  className?: string;
  size?: number;
  variant?: "light" | "navy";
}

/**
 * Official KOSH — Land to Progress seal logo component for CALA (Central Authority of Land Acquisition).
 * Displays the authoritative KOSH emblem and Land to Progress motto.
 */
export function CalaSealLogo({ className = "", size = 44, variant = "light" }: CalaSealLogoProps) {
  const isLight = variant === "light";
  const badgeWidth = Math.round(size * 1.3);
  return (
    <div
      className={`rounded-md p-1 flex items-center justify-center flex-shrink-0 shadow-xs bg-white ${
        isLight ? "border border-white/40 shadow-xs" : "border border-slate-200 shadow-sm"
      } ${className}`}
      style={{ height: size, minWidth: badgeWidth, width: badgeWidth }}
    >
      <img
        src="/kosh-logo.png"
        alt="KOSH — Land to Progress"
        className="h-full w-full object-contain select-none"
      />
    </div>
  );
}
