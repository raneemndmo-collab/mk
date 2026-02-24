/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["IBM Plex Sans Arabic", "sans-serif"],
      },
      colors: {
        brand: {
          navy: "#0B1E2D",
          teal: "#2EC4B6",
          gold: "#C5A55A",
          light: "#F5F7FA",
        },
      },
    },
  },
  plugins: [],
};
