import './globals.css';
import { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { ThemeProvider } from '@/context/ThemeContext';

export const metadata: Metadata = {
  title: {
    default: 'BHUMI: National Land Acquisition & Infrastructure Operations',
    template: '%s | BHUMI',
  },
  description: 'Operational decision-intelligence platform for infrastructure land acquisition, statutory workflows, and critical path risk monitoring.',
  icons: {
    icon: '/icon.svg',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BHUMI Field',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a2c5f',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="min-h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('bhumi-theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = saved === 'dark' || (saved === 'system' && prefersDark);
                  var root = document.documentElement;
                  if (isDark) {
                    root.classList.add('dark');
                    root.classList.remove('light');
                    root.style.colorScheme = 'dark';
                  } else {
                    root.classList.add('light');
                    root.classList.remove('dark');
                    root.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-[#f4f6f9] dark:bg-[#070a14] text-slate-900 dark:text-[#f0f4ff] font-sans antialiased transition-colors duration-200">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}

