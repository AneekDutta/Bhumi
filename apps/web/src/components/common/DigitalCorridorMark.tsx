import React from "react";
import Link from "next/link";

interface DigitalCorridorMarkProps {
  className?: string;
}

/**
 * Fictional generic program mark for "CALA Digital Corridor Directorate".
 * Replaces any real central PSU or national program marks.
 */
export function DigitalCorridorMark({ className = "" }: DigitalCorridorMarkProps) {
  return (
    <Link href="/" title="BHUMI Home Portal" className={`flex items-center gap-2.5 group cursor-pointer ${className}`}>
      <div className="text-right hidden sm:block">
        <div className="text-[10px] uppercase font-mono tracking-widest text-slate-300 group-hover:text-amber-300 transition-colors">
          CALA DIRECTORATE
        </div>
        <div className="text-xs font-bold text-white tracking-tight group-hover:underline">
          Digital Corridor System
        </div>
      </div>
      <div className="w-8 h-8 rounded-none bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 font-bold font-devanagari text-base shadow-xs group-hover:bg-amber-400 group-hover:text-[#0B2E59] group-hover:border-amber-400 transition-all">
        भ
      </div>
    </Link>
  );
}
