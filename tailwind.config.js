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
        coal: {
          DEFAULT: '#FAF8F2',
          50:  '#FFFFFF',
          100: '#F5F1E8',
          200: '#EAE4D4',
          300: '#D6CFBE',
          400: '#A8A192',
          500: '#7A7568',
          600: '#5C5749',
          700: '#3D3930',
          800: '#2A2620',
          900: '#1A1814',
          rule: '#E5DFD0',
        },
        accent: {
          DEFAULT: '#C98A1F',
          bright: '#E8A436',
          glow: 'rgba(232, 164, 54, 0.18)',
        },
        teal: {
          DEFAULT: '#0F8F86',
          bright: '#13B0A5',
          glow: 'rgba(19, 176, 165, 0.18)',
        },
        success: {
          DEFAULT: '#1FA856',
          bright: '#28C268',
          glow: 'rgba(40, 194, 104, 0.18)',
        },
        crimson: {
          DEFAULT: '#D63838',
          bright: '#EB4848',
          glow: 'rgba(235, 72, 72, 0.18)',
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
