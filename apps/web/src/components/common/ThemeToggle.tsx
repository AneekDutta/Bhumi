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
        className={`inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-400 opacity-60 ${className}`}
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
        className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm ${className}`}
        role="group"
        aria-label="Theme selection"
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
            theme === 'light'
              ? 'bg-white text-amber-600 shadow-sm font-semibold'
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
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
            theme === 'dark'
              ? 'bg-indigo-600 text-white shadow-sm font-semibold'
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
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
            theme === 'system'
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold'
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
      className={`group relative flex items-center gap-2 p-2 rounded-lg transition-all duration-200 border ${
        isDark
          ? 'bg-slate-900/90 hover:bg-slate-800 border-white/10 text-amber-400 hover:text-amber-300 hover:border-amber-400/40 shadow-sm'
          : 'bg-white hover:bg-slate-100 border-slate-200 text-indigo-600 hover:text-indigo-700 hover:border-indigo-300 shadow-sm'
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
