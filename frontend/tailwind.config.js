/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vtex: {
          pink: '#f71963',
          blue: '#142c8e',
          dark: '#000711',
          gray: '#f4f4f4',
        },
      },
    },
  },
  plugins: [],
}
