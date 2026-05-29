/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f3f0ff",
          100: "#e8e0ff",
          200: "#d3c2ff",
          300: "#b399ff",
          400: "#997aff",
          500: "#836FFF", // Violet-blue principal
          600: "#705ae6",
          700: "#836FFF",
          800: "#5d4ca3",
          900: "#836FFF",
          950: "#3d3080",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
