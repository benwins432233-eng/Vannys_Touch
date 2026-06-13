/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
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
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.05)',
        'card-hover': '0 4px 16px rgba(0,0,0,.1)',
      },
    },
  },
  plugins: [],
};
