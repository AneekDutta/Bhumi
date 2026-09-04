import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  colorClass?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  colorClass = "text-slate-900"
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          {title}
        </h3>
        <div className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${colorClass}`}>
          {value}
        </div>
      </div>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-2 border-t border-slate-100 pt-2">
          {subtitle}
        </p>
      )}
    </div>
  );
}
