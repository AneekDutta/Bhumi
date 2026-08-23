import { useState } from "react";

import note500 from "@/imports/image.png";
import note200 from "@/imports/image-1.png";
import note100 from "@/imports/image-2.png";
import note50  from "@/imports/image-3.png";
import note20  from "@/imports/image-4.png";
import note10  from "@/imports/image-5.png";

const NOTE_IMAGES: Record<number, string> = {
  500: note500,
  200: note200,
  100: note100,
  50:  note50,
  20:  note20,
  10:  note10,
};

// Fallback color palette for coins / unknown denominations
const NOTE_FALLBACK: Record<number, { bg: string; text: string }> = {
  5:  { bg: "#9ca3af", text: "#f9fafb" },
  2:  { bg: "#6b7280", text: "#f9fafb" },
  1:  { bg: "#4b5563", text: "#f9fafb" },
};

const DENOMS = [500, 200, 100, 50, 20, 10];

export function decomposeAmount(amount: number): { denom: number; count: number }[] {
  const result: { denom: number; count: number }[] = [];
  let remaining = Math.floor(amount);
  for (const d of DENOMS) {
    if (remaining >= d) {
      result.push({ denom: d, count: Math.floor(remaining / d) });
      remaining %= d;
    }
  }
  return result;
}

function totalNoteCount(breakdown: { denom: number; count: number }[]): number {
  return breakdown.reduce((s, b) => s + b.count, 0);
}

// Single note visual — real photo if available, colored pill for coins
function Note({ denom, size = "md" }: { denom: number; size?: "sm" | "md" | "lg" }) {
  const imgSrc = NOTE_IMAGES[denom];
  const dims = {
    sm: { w: "w-14", h: "h-7",  text: "text-[8px]" },
    md: { w: "w-20", h: "h-10", text: "text-[10px]" },
    lg: { w: "w-28", h: "h-14", text: "text-[12px]" },
  }[size];

  if (imgSrc) {
    return (
      <div className={`${dims.w} ${dims.h} rounded-[3px] shrink-0 overflow-hidden select-none inline-block`}
           style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
        <img
          src={imgSrc}
          alt={`₹${denom} note`}
          className="w-full h-full object-cover object-center"
          draggable={false}
        />
      </div>
    );
  }

  // Coin / small denomination fallback
  const fb = NOTE_FALLBACK[denom] ?? { bg: "#6b7280", text: "#f9fafb" };
  return (
    <div
      className={`${dims.w} ${dims.h} rounded-full shrink-0 inline-flex items-center justify-center select-none ${dims.text} font-bold`}
      style={{ backgroundColor: fb.bg, color: fb.text }}
    >
      ₹{denom}
    </div>
  );
}

// Stack badge — note + count label
function NoteStack({ denom, count, size }: { denom: number; count: number; size?: "sm" | "md" | "lg" }) {
  if (count === 0) return null;
  if (count === 1) return <Note denom={denom} size={size} />;
  return (
    <div className="flex items-center gap-1">
      <Note denom={denom} size={size} />
      <span className="text-xs text-[#6b7280] font-medium">×{count}</span>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface CurrencyNotesProps {
  amount: number;
  size?: "sm" | "md" | "lg";
  compact?: boolean;
  className?: string;
}

export function CurrencyNotes({ amount, size = "md", compact = false, className = "" }: CurrencyNotesProps) {
  const breakdown = decomposeAmount(amount);
  const noteCount = totalNoteCount(breakdown);
  const useCompact = compact || noteCount > 8;

  if (breakdown.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 items-center ${className}`}>
      {breakdown.map(({ denom, count }) => {
        if (useCompact) {
          return (
            <div key={denom} className="flex items-center gap-1.5">
              <Note denom={denom} size={size} />
              <span className="text-xs text-[#6b7280]">
                × {count} {count === 1 ? "note" : "notes"}
              </span>
            </div>
          );
        }
        const show = Math.min(count, 4);
        return (
          <div key={denom} className="flex items-center gap-1">
            {Array.from({ length: show }).map((_, i) => (
              <Note key={i} denom={denom} size={size} />
            ))}
            {count > show && (
              <span className="text-xs text-[#6b7280] ml-0.5">+{count - show} more</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Toggle wrapper ───────────────────────────────────────────────────────────

interface CurrencyViewToggleProps {
  amount: number;
  size?: "sm" | "md" | "lg";
  compact?: boolean;
  defaultView?: "numeric" | "notes";
}

export function CurrencyViewToggle({ amount, size = "md", compact, defaultView = "notes" }: CurrencyViewToggleProps) {
  const [view, setView] = useState<"numeric" | "notes">(defaultView);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="text-2xl font-semibold text-[#111827] tabular-nums tracking-tight">
          ₹{amount.toLocaleString("en-IN")}
        </div>
        <div className="flex bg-[#f3f4f6] rounded p-0.5">
          {(["numeric", "notes"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-colors ${
                view === v ? "bg-white text-[#111827] shadow-sm" : "text-[#9ca3af] hover:text-[#6b7280]"
              }`}
            >
              {v === "numeric" ? "Numeric" : "Currency"}
            </button>
          ))}
        </div>
      </div>
      {view === "notes" && (
        <CurrencyNotes amount={amount} size={size} compact={compact} />
      )}
    </div>
  );
}

// ─── Inline note row (for lists) ──────────────────────────────────────────────

interface NoteRowProps {
  amount: number;
  showToggle?: boolean;
}

export function NoteRow({ amount, showToggle = false }: NoteRowProps) {
  const [show, setShow] = useState(false);

  if (showToggle) {
    return (
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium tabular-nums text-[#111827]">₹{amount.toLocaleString("en-IN")}</span>
          <button
            onClick={() => setShow(!show)}
            className="text-[10px] text-[#3b4fd8] hover:underline cursor-pointer"
          >
            {show ? "hide notes" : "show notes"}
          </button>
        </div>
        {show && <CurrencyNotes amount={amount} size="sm" className="mt-1.5" />}
      </div>
    );
  }

  return <CurrencyNotes amount={amount} size="sm" />;
}
