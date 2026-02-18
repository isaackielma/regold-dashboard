/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'rebijoux-teal':   '#1B9AAA',
        'rebijoux-green':  '#4CAF50',
        'rebijoux-orange': '#FF9800',
        'rebijoux-beige':  '#F5F5F0',
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
