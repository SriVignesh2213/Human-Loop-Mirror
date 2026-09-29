/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Architectural Dark mode palette
        charcoal: {
          950: '#0B0D0E',
          900: '#121517',
          850: '#171B1E',
          800: '#1F2428',
          700: '#2A3137',
          600: '#3D464E',
          500: '#5A6570',
          400: '#85929E',
          300: '#B0BAC4',
          200: '#D5DBE1',
          100: '#F0F3F6',
        },
        telemetry: {
          teal: '#14B8A6',
          'teal-dim': '#0D9488',
          'teal-bright': '#2DD4BF',
          'teal-surface': 'rgba(20, 184, 166, 0.08)',
          'teal-border': 'rgba(20, 184, 166, 0.25)',
          amber: '#F59E0B',
          rose: '#F43F5E',
          indigo: '#6366F1',
          emerald: '#10B981',
        },
        // Warm Onboarding palette
        warm: {
          cream: '#FDFBF7',
          parchment: '#F6F2EA',
          card: '#FFFFFF',
          terracotta: '#D97757',
          'terracotta-soft': '#E68E72',
          sage: '#5B8266',
          'sage-soft': '#7A9E84',
          charcoal: '#2D312E',
          muted: '#6E726E',
          border: '#E7E0D3',
        },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        serif: ['Geist', 'Inter', '-apple-system', 'sans-serif'], // Standardized: fallback to clean primary sans font
      },
      borderRadius: {
        'xs': '2px',
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        'elevated': '0 4px 12px rgba(0,0,0,0.25)',
        'warm': '0 4px 20px -2px rgba(100, 75, 60, 0.06)',
      },
    },
  },
  plugins: [],
}
