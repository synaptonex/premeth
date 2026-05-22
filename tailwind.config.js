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
        // Two-accent system. Gold is for achievement and CTAs. Teal is for
        // active study state (current question, streaks, progress). They sit
        // opposite each other on the colour wheel, so the page can carry both
        // without feeling chaotic.
        accent: {
          DEFAULT: '#E0A341',
          // Brighter, more saturated for moments that should land hard:
          // streak completions, full-mock results, daily-goal hits.
          bright: '#F5B84A',
          glow: 'rgba(245, 184, 74, 0.18)',
        },

        // Second accent — deep teal for active study moments.
        teal: {
          DEFAULT: '#2DA39A',
          bright: '#3FBDB3',
          glow: 'rgba(63, 189, 179, 0.18)',
        },

        // Success — for correct answers. Brighter than the default green so
        // the right-answer moment actually lands as a dopamine hit.
        success: {
          DEFAULT: '#36C26B',
          bright: '#4DD984',
          glow: 'rgba(77, 217, 132, 0.20)',
        },

        // Semantic error — used for wrong answers and destructive actions.
        // Slightly warmer and more saturated than the old crimson so wrong
        // feedback actually registers.
        crimson: {
          DEFAULT: '#EF4949',
          bright: '#FF5E5E',
          glow: 'rgba(255, 94, 94, 0.20)',
        },
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
