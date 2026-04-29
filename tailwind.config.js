/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"EB Garamond"', '"Noto Serif SC"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
