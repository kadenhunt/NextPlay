/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        red: {
          50:  '#fef2f3',
          100: '#fee2e4',
          200: '#fdcacd',
          300: '#fba5a9',
          400: '#f47279',
          500: '#a63038',
          600: '#801E24',
          700: '#6d1b20',
          800: '#5c191d',
          900: '#4f181b',
          950: '#2c0b0d',
        },
      },
    },
  },
  plugins: [],
}
