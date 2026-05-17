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
          rule: '#322F2A',
        },
        // One signal color. Warm gold reads as premium on dark, where red
        // would muddy and blue would feel cold.
        accent: '#E0A341',

        // Semantic error color — used for wrong answers, rejected states, and
        // destructive actions. The only other hue the theme allows.
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
