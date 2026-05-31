
/**
 * Enid design system — Aurora Maximalism.
 *
 * Token tiers: primitives (raw hex below) -> semantic (the `coal` scale + `accent`)
 * -> component (utilities in globals.css). The `coal` scale is an INVERTED dark
 * ramp: `coal` is the page background, `coal-900` is the brightest foreground text.
 * This preserves the existing class API across all 35 pages while retuning every
 * value toward the vibrant direction.
 */
/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces (dark -> raised)
        coal: {
          DEFAULT: '#0A0711', // page background, deep violet-black
          50: '#120D1F', // raised surface / cards
          100: '#181226', // raised surface 2
          200: '#20182F', // input bg / hover surface
          300: '#2E2342', // subtle border
          400: '#5A4F73', // faint / disabled text
          500: '#8478A0', // muted label  (AA on coal for large text)
          600: '#ADA2C7', // secondary / body text (~7:1 on coal)
          700: '#CFC7E2', // strong secondary
          800: '#E7E2F2', // near-primary
          900: '#F5F2FC', // primary text
          rule: '#271D3A', // hairline rule
        },
        // Primary interactive accent + glow tint
        accent: {
          DEFAULT: '#B14DFF', // electric violet
          bright: '#E879F9', // glow / numerals / hover
        },
        // Destructive / report (rose-red, reads on the dark surface)
        crimson: {
          DEFAULT: '#F43F5E',
          bright: '#FB7185',
        },
        // Aurora gradient stops (used by background/text gradient utilities)
        aurora: {
          1: '#7C3AED', // violet
          2: '#EC4899', // pink
          3: '#22D3EE', // cyan
        },
        paper: '#120D1F',
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        display: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
      },
      // Type scale: 12 14 16 20 24 32 48 64, rem units, tuned line-heights.
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.5' }], // 12
        sm: ['0.875rem', { lineHeight: '1.5' }], // 14
        base: ['1rem', { lineHeight: '1.6' }], // 16
        lg: ['1.125rem', { lineHeight: '1.6' }], // 18
        xl: ['1.25rem', { lineHeight: '1.45' }], // 20
        '2xl': ['1.5rem', { lineHeight: '1.3' }], // 24
        '3xl': ['2rem', { lineHeight: '1.2' }], // 32
        '4xl': ['2.5rem', { lineHeight: '1.12' }], // 40
        '5xl': ['3rem', { lineHeight: '1.08' }], // 48
        '6xl': ['4rem', { lineHeight: '1.04' }], // 64
        '7xl': ['5rem', { lineHeight: '1' }], // 80
        '8xl': ['6.5rem', { lineHeight: '0.98' }], // 104
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        glow: '0 0 24px -6px rgba(177, 77, 255, 0.55)',
        'glow-lg': '0 0 48px -8px rgba(177, 77, 255, 0.5)',
        'glow-pink': '0 0 28px -6px rgba(236, 72, 153, 0.55)',
        crimson: '0 0 24px -6px rgba(244, 63, 94, 0.5)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 30px -12px rgba(0,0,0,0.6)',
        'card-hover':
          '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 18px 50px -16px rgba(124,58,237,0.4)',
      },
      backgroundImage: {
        // The signature aurora mesh: several radial blooms over the dark base.
        aurora:
          'radial-gradient(40% 50% at 15% 10%, rgba(124,58,237,0.40) 0%, transparent 60%),' +
          'radial-gradient(45% 55% at 85% 15%, rgba(236,72,153,0.32) 0%, transparent 62%),' +
          'radial-gradient(50% 60% at 60% 95%, rgba(34,211,238,0.22) 0%, transparent 60%)',
        'aurora-line':
          'linear-gradient(90deg, #7C3AED 0%, #EC4899 50%, #22D3EE 100%)',
        'aurora-text':
          'linear-gradient(100deg, #C4B5FD 0%, #F0ABFC 38%, #67E8F9 78%, #C4B5FD 100%)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
      },
      keyframes: {
        'aurora-drift': {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '33%': { transform: 'translate3d(2%, -3%, 0) scale(1.05)' },
          '66%': { transform: 'translate3d(-2%, 2%, 0) scale(0.97)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.85' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'aurora-drift': 'aurora-drift 18s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
        'fade-up': 'fade-up 0.4s cubic-bezier(0.2,0.8,0.2,1) both',
      },
    },
  },
  plugins: [],
};

module.exports = config;
