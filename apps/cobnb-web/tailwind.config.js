/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        cobnb: {
          primary: "#FF5A5F",
          dark: "#484848",
          light: "#767676",
          bg: "#F7F7F7",
        },
      },
    },
  },
  plugins: [],
};
