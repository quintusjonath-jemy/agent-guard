/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#050709',
          900: '#090c12',
          850: '#0d1120',
          800: '#121829',
          750: '#172033',
          700: '#1e2a40',
          600: '#2a3a52',
        },
        brand: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          teal: '#06b6d4',
          emerald: '#10b981',
          indigo: '#6366f1',
        },
        risk: {
          low:      '#10b981',
          medium:   '#f59e0b',
          high:     '#f97316',
          critical: '#ef4444',
          success:  '#22c55e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        'glow-teal':    '0 0 24px -4px rgba(6, 182, 212, 0.35)',
        'glow-blue':    '0 0 24px -4px rgba(59, 130, 246, 0.3)',
        'glow-red':     '0 0 24px -4px rgba(239, 68, 68, 0.3)',
        'glow-amber':   '0 0 24px -4px rgba(245, 158, 11, 0.3)',
        'glow-emerald': '0 0 24px -4px rgba(16, 185, 129, 0.25)',
        'glow-indigo':  '0 0 24px -4px rgba(99, 102, 241, 0.3)',
        'panel':        '0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 24px rgba(0,0,0,0.4)',
        'panel-lg':     '0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 40px rgba(0,0,0,0.6)',
        'inner-glow':   'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':      'fadeIn 0.25s ease-out',
        'slide-up':     'slideUp 0.3s ease-out',
        'ping-slow':    'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'grid-white': 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      backgroundSize: {
        'grid': '28px 28px',
      },
    },
  },
  plugins: [],
}
