/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Playfair Display", "serif"],
        script: ["Great Vibes", "cursive"],
        sans: ["Montserrat", "sans-serif"],
      },
      colors: {
        blue: {
          50: '#f4f8f8', 100: '#eaf1f2', 200: '#d6e6e8', 300: '#b5d5d8',
          400: '#8ebcc2', 500: '#6ca0a7', 600: '#548189', 700: '#466870',
          800: '#3c565d', 900: '#34484f',
        },
        rose: {
          50: '#fdf8f9', 100: '#faedf0', 200: '#f3d8dd', 300: '#e9b9c3',
          400: '#dc92a2', 500: '#ce6c81', 600: '#b24d62', 700: '#963d50',
        },
      },
    },
  },
  plugins: [],
}
