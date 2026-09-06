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
}

export function MetricCard({
  title,
  value,
  subtitle,
  colorClass = "text-slate-900 dark:text-white",
  icon: Icon,
  trend,
  trendPositive
}: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-[#0D121F] rounded-[4px] border border-[#DCE2E8] dark:border-white/10 shadow-xs hover:border-[#0B2E59]/40 dark:hover:border-sky-500/40 transition-colors p-4 flex flex-col justify-between group relative overflow-hidden">
      {/* Decorative top edge highlight */}
      <div className="absolute top-0 inset-x-0 h-0.5 bg-[#0B2E59] opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </h3>
          {Icon && (
            <div className="p-1.5 rounded-[3px] bg-[#F4F6F8] dark:bg-[#07080F] text-[#0B2E59] dark:text-sky-400 border border-[#DCE2E8] dark:border-white/10 group-hover:bg-[#E6F0FA] dark:group-hover:bg-sky-950/40 transition-colors">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <div className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${colorClass}`}>
            {value}
          </div>
          {trend && (
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[2px] ${
              trendPositive 
                ? 'bg-[#E8F5E9] dark:bg-emerald-950/40 text-[#1E7E34] dark:text-emerald-300 border border-[#C8E6C9] dark:border-emerald-800/40' 
                : 'bg-[#FFEBEE] dark:bg-rose-950/40 text-[#B32424] dark:text-rose-300 border border-[#FFCDD2] dark:border-rose-800/40'
            }`}>
              {trend}
            </span>
          )}
        </div>
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-[#DCE2E8] dark:border-white/10 flex items-center justify-between">
          <span>{subtitle}</span>
        </p>
      )}
    </div>
  );
}

