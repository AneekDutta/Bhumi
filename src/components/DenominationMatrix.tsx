import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import note500 from "@/imports/image.png";
import note200 from "@/imports/image-1.png";
import note100 from "@/imports/image-2.png";
import note50  from "@/imports/image-3.png";
import note20  from "@/imports/image-4.png";
import note10  from "@/imports/image-5.png";

const DENOMS = [
  { value: 500, label: "₹500", img: note500 },
  { value: 200, label: "₹200", img: note200 },
  { value: 100, label: "₹100", img: note100 },
  { value: 50,  label: "₹50",  img: note50  },
  { value: 20,  label: "₹20",  img: note20  },
  { value: 10,  label: "₹10",  img: note10  },
  { value: 1,   label: "Coins", img: null   },
];

interface DenominationMatrixProps {
  onChange?: (total: number, counts: Record<number, number>) => void;
  initialCounts?: Record<number, number>;
}

export default function DenominationMatrix({ onChange, initialCounts = {} }: DenominationMatrixProps) {
  const [counts, setCounts] = useState<Record<number, number>>(initialCounts);

  const update = (denom: number, delta: number) => {
    setCounts((prev) => {
      const next = { ...prev, [denom]: Math.max(0, (prev[denom] ?? 0) + delta) };
      const total = DENOMS.reduce((s, d) => s + d.value * (next[d.value] ?? 0), 0);
      onChange?.(total, next);
      return next;
    });
  };

  const total = DENOMS.reduce((s, d) => s + d.value * (counts[d.value] ?? 0), 0);

  return (
    <div>
      <div className="space-y-2 mb-4">
        {DENOMS.map((d) => {
          const count = counts[d.value] ?? 0;
          const subtotal = d.value * count;
          return (
            <div key={d.value} className="flex items-center gap-3">
              {/* Note image or coin pill */}
              {d.img ? (
                <div className="w-16 h-8 rounded-[3px] overflow-hidden shrink-0 select-none"
                     style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.20)" }}>
                  <img
                    src={d.img}
                    alt={d.label}
                    className="w-full h-full object-cover object-center"
                    draggable={false}
                  />
                </div>
              ) : (
                <div className="w-16 h-8 rounded-full bg-[#6b7280] shrink-0 flex items-center justify-center text-[10px] font-bold text-white select-none">
                  {d.label}
                </div>
              )}

              {/* Minus */}
              <button
                onClick={() => update(d.value, -1)}
                className="w-7 h-7 border border-[#d1d5db] rounded-[4px] flex items-center justify-center text-[#374151] hover:bg-[#f3f4f6] cursor-pointer"
              >
                <Minus size={11} />
              </button>

              {/* Count */}
              <span className="w-10 text-center text-sm font-semibold tabular-nums text-[#111827]">{count}</span>

              {/* Plus */}
              <button
                onClick={() => update(d.value, 1)}
                className="w-7 h-7 border border-[#d1d5db] rounded-[4px] flex items-center justify-center text-[#374151] hover:bg-[#f3f4f6] cursor-pointer"
              >
                <Plus size={11} />
              </button>

              {/* Subtotal */}
              <span className="ml-auto text-sm tabular-nums text-[#6b7280] min-w-[72px] text-right">
                {subtotal > 0 ? `₹${subtotal.toLocaleString("en-IN")}` : "—"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t-2 border-[#111827] pt-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-[#374151] uppercase tracking-wide">Physical cash total</span>
        <span className="text-xl font-bold text-[#111827] tabular-nums">₹{total.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}
