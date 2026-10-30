/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          deep: '#123D73',
          blue: '#2563EB',
          light: '#F5F8FC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          text: '#1E293B',
          muted: '#64748B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Telugu', 'sans-serif'],
        telugu: ['Noto Sans Telugu', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
