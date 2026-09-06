"use client";

import React, { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill' | 'compact';
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({
  variant = 'icon',
  className = '',
  showLabel = false
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`inline-flex items-center justify-center p-2 rounded-[4px] border border-[#DCE2E8] dark:border-white/10 text-slate-400 opacity-60 ${className}`}
        aria-hidden="true"
      >
        <Moon className="w-4 h-4 opacity-0" />
      </div>
    );
  }

  const isDark = resolvedTheme === 'dark';

  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center p-0.5 rounded-[4px] bg-[#F4F6F8] dark:bg-[#07080F] border border-[#DCE2E8] dark:border-white/10 text-xs shadow-xs ${className}`}
        role="group"
        aria-label="Theme selection"
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-[3px] font-medium transition-all ${
            theme === 'light'
              ? 'bg-white text-[#B36B00] shadow-xs font-bold border border-[#FFE082]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Switch to Light Mode"
          aria-pressed={theme === 'light'}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-[3px] font-medium transition-all ${
            theme === 'dark'
              ? 'bg-[#0B2E59] text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Switch to Dark Mode"
          aria-pressed={theme === 'dark'}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Dark</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-[3px] font-medium transition-all ${
            theme === 'system'
              ? 'bg-white dark:bg-[#0D121F] text-[#0B2E59] dark:text-white shadow-xs font-bold border border-[#DCE2E8] dark:border-white/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Use System Theme"
          aria-pressed={theme === 'system'}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Auto</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative flex items-center gap-2 p-1.5 rounded-[4px] transition-colors border shadow-xs ${
        isDark
          ? 'bg-[#0D121F] hover:bg-white/10 border-white/10 text-amber-400 hover:text-amber-300'
          : 'bg-white hover:bg-[#F4F6F8] border-[#DCE2E8] text-[#0B2E59] hover:text-[#082242]'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
        {isDark ? (
          <Sun className="w-4 h-4 transition-transform duration-300 rotate-0" />
        ) : (
          <Moon className="w-4 h-4 transition-transform duration-300 -rotate-12" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold tracking-wide capitalize select-none">
          {isDark ? 'Light' : 'Dark'} Mode
        </span>
      )}
    </button>
  );
}
