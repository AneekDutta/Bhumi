import React from "react";

interface DigitalCorridorMarkProps {
  className?: string;
}

/**
 * Fictional generic program mark for "CALA Digital Corridor Directorate".
 * Replaces any real central PSU or national program marks (e.g. PM GatiShakti).
 */
export function DigitalCorridorMark({ className = "" }: DigitalCorridorMarkProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="text-right hidden sm:block">
        <div className="text-[10px] uppercase font-mono tracking-widest text-slate-300">
          CALA DIRECTURATE
        </div>
        <div className="text-xs font-bold text-white tracking-tight">
          Digital Corridor System
        </div>
      </div>
      <div className="w-8 h-8 rounded-none bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 font-bold font-devanagari text-base shadow-xs">
        भ
      </div>
    </div>
  );
}
