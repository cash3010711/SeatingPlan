/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wedding: {
          primary: '#E11D48',    // Rose-600
          burgundy: '#9F1239',   // Rose-800
          gold: '#F59E0B',       // Amber-500
          champagne: '#FEF3C7',  // Amber-100
        }
      }
    },
  },
  plugins: [],
}
