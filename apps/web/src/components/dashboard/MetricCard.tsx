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
  colorClass = "text-slate-900",
  icon: Icon,
  trend,
  trendPositive
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-gov hover:shadow-gov-md transition-all duration-200 p-5 flex flex-col justify-between group relative overflow-hidden">
      {/* Decorative top edge highlight */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent group-hover:via-indigo-500 transition-colors" />

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {title}
          </h3>
          {Icon && (
            <div className="p-2 rounded-lg bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <div className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${colorClass}`}>
            {value}
          </div>
          {trend && (
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
              trendPositive 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {trend}
            </span>
          )}
        </div>
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <span>{subtitle}</span>
        </p>
      )}
    </div>
  );
}

