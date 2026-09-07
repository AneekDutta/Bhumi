import React from "react";
import Link from "next/link";
import { KoshLogo } from "@/components/common/KoshLogo";

interface DigitalCorridorMarkProps {
  className?: string;
}

/**
 * Program mark for "CALA Digital Corridor Directorate — KOSH".
 */
export function DigitalCorridorMark({ className = "" }: DigitalCorridorMarkProps) {
  return (
    <Link href="/" title="KOSH Home Portal" className={`flex items-center gap-2.5 group cursor-pointer ${className}`}>
      <div className="text-right hidden sm:block">
        <div className="text-[10px] uppercase font-mono tracking-widest text-slate-300 group-hover:text-amber-300 transition-colors">
          CALA DIRECTORATE
        </div>
        <div className="text-xs font-bold text-white tracking-tight group-hover:underline">
          Digital Corridor System
        </div>
      </div>
      <KoshLogo size={30} variant="badge" className="group-hover:scale-105 transition-transform" />
    </Link>
  );
}
