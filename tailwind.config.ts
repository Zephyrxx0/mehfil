import type { Config } from 'tailwindcss'
import tailwindAnimate from 'tailwindcss-animate'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        maroon: 'hsl(var(--maroon) / <alpha-value>)',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        'warm-ivory': 'hsl(var(--background) / <alpha-value>)',
        'royal-plum': 'hsl(var(--foreground) / <alpha-value>)',
        marigold: 'hsl(var(--primary) / <alpha-value>)',
        'gulabi-rose': 'hsl(var(--secondary) / <alpha-value>)',
        'ivory-900': 'hsl(var(--muted) / <alpha-value>)',
        terracotta: 'hsl(var(--destructive) / <alpha-value>)',
      },
      fontSize: {
        '3xs': ['0.625rem', { lineHeight: '0.875rem' }],
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      opacity: {
        '2': '0.02',
        '3': '0.03',
        '4': '0.04',
        '8': '0.08',
        '12': '0.12',
      },
      scale: {
        '98': '0.98',
      },
      boxShadow: {
        '2xs': '0 1px 0 0 rgb(58 36 66 / 0.04)',
        xs: '0 1px 2px 0 rgb(58 36 66 / 0.06)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'serif'],
        sans: ['var(--font-jakarta)', 'sans-serif'],
        devanagari: ['var(--font-tiro)', 'serif'],
        display: ['var(--font-ewert)', 'var(--font-fraunces)', 'serif'],
      },
      animation: {
        'spin-slow': 'spin 120s linear infinite',
      },
    },
  },
  plugins: [
    tailwindAnimate,
    // Tailwind v4 names used across the components, provided for v3.
    function ({
      addUtilities,
    }: {
      addUtilities: (u: Record<string, Record<string, string>>) => void
    }) {
      addUtilities({
        '.outline-hidden': { outline: '2px solid transparent', 'outline-offset': '2px' },
      })
    },
  ],
}

export default config
