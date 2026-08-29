/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1E6F5C',
          50: '#EAF6F2',
          100: '#CDEAE1',
          200: '#9BD5C3',
          300: '#69C0A5',
          400: '#3EA687',
          500: '#1E6F5C',
          600: '#185A4A',
          700: '#134639',
          800: '#0D3128',
          900: '#081D17',
        },
        accent: {
          DEFAULT: '#E8A33D',
          500: '#E8A33D',
          600: '#C6821F',
        },
        ink: {
          50: '#F7F8F9',
          100: '#EEF0F2',
          200: '#DBDFE3',
          400: '#8A93A0',
          600: '#4B5563',
          800: '#1F2733',
          900: '#11151B',
        },
      },
    },
  },
  plugins: [],
};
