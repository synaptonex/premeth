/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Single family. The whole app reads in Manrope at varying weights.
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        display: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Public surfaces use this paper-toned light palette. Off-white
        // is warmer than #FFFFFF without crossing into Organic cream.
        bone: {
          DEFAULT: '#F7F7F4',
          50:  '#FBFBF9',
          100: '#F7F7F4',
          200: '#EFEFEA',
          300: '#E0E0D8',
          400: '#B8B8AE',
          500: '#8B8B82',
          600: '#5C5C56',
          700: '#3F3F3A',
          800: '#2A2A26',
          900: '#1A1A18',
        },
        // Single accent. Used sparingly — for Premeth+ and one primary action per page.
        accent: '#CC2936',

        // Existing dark theme retained for the paid feature pages.
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
      letterSpacing: {
        // Tight by default for display sizes — Manrope reads better tight.
        tighter: '-0.04em',
        tight: '-0.02em',
      },
      transitionTimingFunction: {
        // One curve. Used for every transition in the app.
        'out-soft': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
