/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          light: '#F7FAFC',
          dark: '#0B0F19',
        },
        cardBg: {
          light: 'rgba(255, 255, 255, 0.75)',
          dark: 'rgba(17, 24, 39, 0.75)',
        },
        brand: {
          50: '#EBF8FF',
          100: '#EBF8FF',
          200: '#BEE3F8',
          500: '#3182CE',
          600: '#2B6CB0',
          700: '#2C5282',
        },
        accent: {
          teal: '#319795',
          indigo: '#4C51BF',
          emerald: '#10B981',
          rose: '#F43F5E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        glassDark: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
