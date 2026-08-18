/** @type {import('tailwindcss').Config} */

// Les couleurs viennent des jetons CSS définis dans src/index.css.
// Le format « <canaux HSL> » permet à Tailwind d'appliquer une opacité :
// bg-accent/10, text-foreground/70, etc.
const token = (name) => `hsl(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: token('background'),
        foreground: token('foreground'),
        border: token('border'),
        input: token('input'),
        ring: token('ring'),
        card: {
          DEFAULT: token('card'),
          foreground: token('card-foreground'),
        },
        muted: {
          DEFAULT: token('muted'),
          foreground: token('muted-foreground'),
        },
        deep: {
          DEFAULT: token('deep'),
          foreground: token('deep-foreground'),
          muted: token('deep-muted'),
          border: token('deep-border'),
        },
        primary: {
          DEFAULT: token('primary'),
          foreground: token('primary-foreground'),
        },
        accent: {
          DEFAULT: token('accent'),
          foreground: token('accent-foreground'),
        },
        destructive: {
          DEFAULT: token('destructive'),
          foreground: token('destructive-foreground'),
        },
        success: {
          DEFAULT: token('success'),
          foreground: token('success-foreground'),
        },
        warning: {
          DEFAULT: token('warning'),
          foreground: token('warning-foreground'),
        },

        // Nuancier or conservé : encore référencé par les pages non migrées.
        // Le 500 est l'or signature #c8a96e.
        gold: {
          50: '#fdf8f0',
          100: '#faefd8',
          200: '#f4dcae',
          300: '#ecc87e',
          400: '#e2af52',
          500: '#c8a96e',
          600: '#a8884e',
          700: '#8a6c3c',
          800: '#6e5430',
          900: '#5a4427',
        },
      },
      // Rayon des nouveaux composants. On n'écrase pas l'échelle par défaut
      // (rounded-lg, rounded-md…) pour ne pas modifier les pages non migrées.
      borderRadius: {
        token: 'var(--radius)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.05)',
        'card-hover': '0 4px 16px rgba(0,0,0,.1)',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-in-right': 'slide-in-right 250ms ease-out',
      },
    },
  },
  plugins: [],
};
