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
          navy: '#0B2E59',
          navyDark: '#0A2647',
          nav: '#123C6B',
          navActive: '#2F6FB0',
          blue: '#0B5FA5',
          canvas: '#F4F6F8',
          border: '#DCE2E8',
          borderDark: '#D9DEE3',
          saffron: '#FF9933',
          green: '#128807',
          heading: '#14213D',
          body: '#333333',
          success: '#1E7E34',
          warning: '#B36B00',
          danger: '#B32424',
          footer: '#0A2647',
          utility: '#071A32',
          slate: '#14213D',
          amber: '#B36B00',
          emerald: '#1E7E34',
          crimson: '#B32424',
          indigo: '#0B2E59',
          accent: '#0B5FA5',
          muted: '#64748B',
        },
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '4px',
        md: '4px',
        lg: '6px',
        xl: '8px',
        '2xl': '8px',
        full: '9999px',
      },
      boxShadow: {
        'gov-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'gov': '0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'gov-md': '0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'gov-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
      },
      fontFamily: {
        sans: ['"Noto Sans"', '"Segoe UI"', 'Arial', 'sans-serif'],
        display: ['"Noto Sans"', '"Segoe UI"', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        devanagari: ['"Noto Sans Devanagari"', '"Noto Sans"', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(2px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.15s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
export default config
