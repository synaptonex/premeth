/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        display: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Warm near-black surface. Not pure #000 — a touch of warmth keeps it
        // from feeling like an OLED void, and Manrope sits better on it.
        coal: {
          DEFAULT: '#14130F',
          50:  '#1E1C17',
          100: '#1A1814',
          200: '#252320',
          300: '#322F2A',
          400: '#4A463F',
          500: '#6B665C',
          600: '#928C7F',
          700: '#B5AFA1',
          800: '#D6D0C2',
          900: '#F0EBDD',
        },
        // One signal color. Warm gold reads as premium on dark, where red
        // would muddy and blue would feel cold.
        accent: '#E0A341',

        // Original palette kept so nothing that still references it breaks.
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
          400: '#3ee089',
          500: '#16c46a',
        },
        paper: '#f7f3ec',
        crimson: '#e23b3b',
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight: '-0.02em',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
