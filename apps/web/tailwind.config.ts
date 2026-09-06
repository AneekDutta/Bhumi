import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          slate: '#0f172a',
          navy: '#0b132b',
          deep: '#1c2541',
          saffron: '#d97706',
          amber: '#f59e0b',
          emerald: '#059669',
          crimson: '#dc2626',
          indigo: '#4338ca',
          accent: '#6366f1',
        },
      },
      boxShadow: {
        'gov-sm': '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        'gov': '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
        'gov-md': '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.05)',
        'gov-lg': '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
        'glow-indigo': '0 0 15px -2px rgba(99, 102, 241, 0.25)',
        'glow-emerald': '0 0 15px -2px rgba(16, 185, 129, 0.25)',
        'glow-amber': '0 0 15px -2px rgba(245, 158, 11, 0.25)',
        'glow-red': '0 0 15px -2px rgba(239, 68, 68, 0.25)',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
