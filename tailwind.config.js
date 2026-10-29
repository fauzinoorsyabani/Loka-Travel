/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: "#f2f7fb",
          100: "#e1eef7",
          500: "#0e4d84",
          600: "#0b3b68",
          700: "#082b4d",
          800: "#061f38",
          900: "#041526",
        },
        lagoon: {
          500: "#00897b",
          600: "#00695c",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
