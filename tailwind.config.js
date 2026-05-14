/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Premeth's identity: lab-meth green on near-black, with a warm paper highlight.
        // Picked to feel like Heisenberg lab notes, not a generic ed-tech app.
        ink: {
          DEFAULT: '#0a0a0a',
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        meth: {
          DEFAULT: '#3ee089',
          50:  '#ebfff5',
          100: '#d2fde7',
          200: '#a8f8cf',
          300: '#6fefb1',
          400: '#3ee089',
          500: '#16c46a',
          600: '#0aa055',
          700: '#0a7e46',
          800: '#0e633a',
          900: '#0e5132',
          950: '#022d1c',
        },
        paper: '#f7f3ec',
        crimson: '#e23b3b',
      },
      boxShadow: {
        glow: '0 0 24px -4px rgba(62, 224, 137, 0.45)',
        'glow-sm': '0 0 12px -2px rgba(62, 224, 137, 0.35)',
        'crisp': '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -8px rgba(0,0,0,0.4)',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.4)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.4s linear infinite',
        'pulse-dot': 'pulseDot 1.6s ease-in-out infinite',
      },
      transitionTimingFunction: {
        // Emil's strong custom curves
        'out-strong': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out-strong': 'cubic-bezier(0.77, 0, 0.175, 1)',
        'drawer': 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
};
