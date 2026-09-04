import './globals.css';
import { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';

export const metadata: Metadata = {
  title: {
    default: 'BHUMI: National Land Acquisition & Infrastructure Operations',
    template: '%s | BHUMI',
  },
  description: 'Operational decision-intelligence platform for infrastructure land acquisition, statutory workflows, and critical path risk monitoring.',
  icons: {
    icon: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 flex flex-col font-sans antialiased overflow-x-hidden">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
