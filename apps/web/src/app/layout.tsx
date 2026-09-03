import './globals.css'
import { ReactNode } from 'react'
import Link from 'next/link'

export const metadata = { title: 'SIH26016 Platform' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="font-bold text-lg text-blue-800">
            <Link href="/">SIH26016</Link>
          </div>
          <nav className="space-x-4">
            <Link href="/projects" className="hover:text-blue-600">Projects</Link>
            <Link href="/status" className="hover:text-blue-600">System Status</Link>
          </nav>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto p-6">
          {children}
        </main>
      </body>
    </html>
  )
}
