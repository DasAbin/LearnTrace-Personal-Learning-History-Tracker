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
          dark: '#0F0E0C',
          light: '#FAFAF7',
          gold: '#C9A84C',
          text: '#F5F0E8',
        },
        primary: '#C9A84C',
        'success-green': '#10B981',
        'soft-purple': '#8B5CF6',
        'warm-orange': '#F97316',
        'alert-red': '#EF4444',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
