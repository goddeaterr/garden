import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['SF Mono', 'ui-monospace', 'Menlo', 'monospace'],
      },
      colors: {
        forest: {
          50: '#f3f7f3',
          100: '#e3ede3',
          200: '#c8dac9',
          300: '#9fbf9f',
          400: '#719e72',
          500: '#508153',
          600: '#3d6741',
          700: '#325336',
          800: '#2a432d',
          900: '#243826',
          950: '#101f12',
        },
        moss: {
          50: '#f6f8f3',
          100: '#eaf0e2',
          200: '#d4e0c5',
          300: '#b3c89c',
          400: '#90ae72',
          500: '#719256',
          600: '#577342',
          700: '#445a36',
          800: '#39492f',
          900: '#313e29',
        },
        sand: {
          50: '#faf8f3',
          100: '#f3eee0',
          200: '#e6dbc0',
          300: '#d6c399',
          400: '#c5a973',
          500: '#b6925b',
          600: '#a17d4f',
          700: '#866443',
          800: '#6f523c',
          900: '#5d4533',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 10s ease-in-out infinite',
        'fade-up': 'fadeUp 0.8s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'aurora': 'aurora 20s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
