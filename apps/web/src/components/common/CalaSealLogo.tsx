import React from "react";

interface CalaSealLogoProps {
  className?: string;
  size?: number;
  variant?: "light" | "navy";
}

/**
 * Fictional, generic administrative seal for CALA (Central Authority for Land Acquisition).
 * Built purely from geometric motifs: compass rose, cadastral land parcel grid, and measuring quadrant.
 * Strictly compliant with SIH prototype rules: NO Lion Capital, NO Ashoka Chakra, NO real government marks.
 */
export function CalaSealLogo({ className = "w-10 h-10", size = 44, variant = "light" }: CalaSealLogoProps) {
  const isLight = variant === "light";
  const primaryColor = isLight ? "#FFFFFF" : "#0B2E59";
  const secondaryColor = isLight ? "#93C5FD" : "#0B5FA5";
  const ringBg = isLight ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="CALA Administrative Seal"
      role="img"
    >
      {/* Outer concentric decorative rim */}
      <circle cx="32" cy="32" r="30" stroke={primaryColor} strokeWidth="1.5" strokeDasharray="3 1.5" />
      <circle cx="32" cy="32" r="27.5" stroke={primaryColor} strokeWidth="1" />
      <circle cx="32" cy="32" r="21" fill={ringBg} stroke={secondaryColor} strokeWidth="0.8" />

      {/* Cadastral parcel grid motif inside inner medallion */}
      <path
        d="M23 23 L41 23 L37 41 L19 41 Z"
        stroke={secondaryColor}
        strokeWidth="1"
        strokeDasharray="2 1"
        fill="none"
      />
      <line x1="30" y1="23" x2="28" y2="41" stroke={secondaryColor} strokeWidth="0.8" />
      <line x1="21" y1="32" x2="39" y2="32" stroke={secondaryColor} strokeWidth="0.8" />

      {/* Central Compass Rose / Corridor Axis Motif */}
      {/* North Arrow */}
      <polygon points="32,15 34,31 32,29 30,31" fill={primaryColor} />
      {/* South Arrow */}
      <polygon points="32,49 34,33 32,35 30,33" fill={secondaryColor} />
      {/* East Arrow */}
      <polygon points="49,32 33,34 35,32 33,30" fill={secondaryColor} />
      {/* West Arrow */}
      <polygon points="15,32 31,34 29,32 31,30" fill={primaryColor} />

      {/* Center Pivot Point */}
      <circle cx="32" cy="32" r="2.5" fill={primaryColor} stroke={isLight ? "#0B2E59" : "#FFFFFF"} strokeWidth="0.8" />

      {/* Corner Quad Accents (Survey Benchmarks) */}
      <circle cx="32" cy="5.5" r="1.2" fill={primaryColor} />
      <circle cx="32" cy="58.5" r="1.2" fill={primaryColor} />
      <circle cx="5.5" cy="32" r="1.2" fill={primaryColor} />
      <circle cx="58.5" cy="32" r="1.2" fill={primaryColor} />
    </svg>
  );
}
