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
        surface: {
          bg:       '#0D0D0D',
          base:     '#141414',
          elevated: '#1A1A1A',
          input:    '#1F1F1F',
          code:     '#111111',
          border:   '#2A2A2A',
        },
        brand: {
          DEFAULT: '#10A37F',
          dark:    '#087F63',
          soft:    '#153D34',
        },
        success:  '#35B77A',
        warning:  '#D6A84F',
        danger:   '#E06A62',
        critical: '#F04444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        '3xs': ['9px',  { lineHeight: '12px' }],
      },
      boxShadow: {
        'card':     '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-md':  '0 4px 16px rgba(0,0,0,0.3)',
        'card-lg':  '0 8px 32px rgba(0,0,0,0.4)',
        'dropdown': '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
        'modal':    '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)',
        'inset':    'inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      animation: {
        'fade-in':   'fadeIn 0.2s ease-out',
        'slide-up':  'slideUp 0.25s ease-out',
        'slide-down':'slideDown 0.2s ease-out',
        'scale-in':  'scaleIn 0.15s ease-out',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'enter-row': 'enterRow 0.3s ease-out',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:   { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: '0', transform: 'translateY(-6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { '0%': { opacity: '0', transform: 'scale(0.97)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        pulseDot:  { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
        enterRow:  { '0%': { opacity: '0', transform: 'translateY(-4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
