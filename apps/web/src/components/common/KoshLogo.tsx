import React from "react";

interface KoshLogoProps {
  className?: string;
  size?: number;
  variant?: "badge" | "plain" | "light";
}

/**
 * Official KOSH — Land to Progress logo component.
 * Displays the authoritative Ashoka Chakra emblem and bold KOSH typography.
 */
export function KoshLogo({
  className = "",
  size = 40,
  variant = "badge",
}: KoshLogoProps) {
  const width = Math.round(size * 1.4);

  if (variant === "badge") {
    return (
      <div
        className={`bg-white rounded-md p-1 border border-slate-200/80 dark:border-white/20 shadow-xs flex items-center justify-center flex-shrink-0 transition-transform ${className}`}
        style={{ height: size + 8, width: width + 12 }}
      >
        <img
          src="/kosh-logo.png"
          alt="KOSH — Land to Progress"
          width={width}
          height={size}
          className="h-full w-auto object-contain select-none"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center flex-shrink-0 ${className}`}>
      <img
        src="/kosh-logo.png"
        alt="KOSH — Land to Progress"
        width={width}
        height={size}
        className="h-full w-auto object-contain select-none rounded"
        style={{ maxHeight: size }}
      />
    </div>
  );
}
