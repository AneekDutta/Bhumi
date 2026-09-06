import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  colorClass?: string;
  icon?: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  variant?: "card" | "flush";
}

export function MetricCard({
  title,
  value,
  subtitle,
  colorClass = "text-[#14213D] dark:text-white",
  icon: Icon,
  trend,
  trendPositive,
  variant = "card"
}: MetricCardProps) {
  if (variant === "flush") {
    return (
      <div className="py-3 px-4 sm:px-5 flex flex-col justify-center">
        <div className="flex items-baseline gap-2">
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${colorClass}`}>
            {value}
          </div>
          {trend && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] ${
              trendPositive 
                ? 'bg-[#E8F5E9] text-[#1E7E34] border border-[#C8E6C9]' 
                : 'bg-[#FFEBEE] text-[#B32424] border border-[#FFCDD2]'
            }`}>
              {trend}
            </span>
          )}
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
          {title}
        </div>
        {subtitle && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0D121F] rounded-[4px] border border-[#DCE2E8] dark:border-white/10 p-4 flex flex-col justify-between group relative overflow-hidden">
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${colorClass}`}>
            {value}
          </div>
          {Icon && (
            <div className="p-1.5 rounded-[3px] bg-[#F4F6F8] dark:bg-[#07080F] text-[#0B2E59] dark:text-sky-400 border border-[#DCE2E8] dark:border-white/10">
              <Icon className="w-4 h-4" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </div>
      </div>

      {subtitle && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-[#DCE2E8] dark:border-white/10 flex items-center justify-between">
          <span>{subtitle}</span>
          {trend && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] ${
              trendPositive 
                ? 'bg-[#E8F5E9] text-[#1E7E34]' 
                : 'bg-[#FFEBEE] text-[#B32424]'
            }`}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

