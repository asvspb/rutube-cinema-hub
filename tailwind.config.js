/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        dark: {
          900: '#000917',
          800: '#0a0f1a',
          700: '#111827',
        },
      },
    },
  },
  plugins: [],
};
