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
        dark: {
          bg: '#121212',
          surface: '#1E1E1E',
          text: '#E0E0E0',
          primary: '#BB86FC',
          secondary: '#03DAC6',
          error: '#CF6679',
        },
      },
    },
  },
  plugins: [],
}

