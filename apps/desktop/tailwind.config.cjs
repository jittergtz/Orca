/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/renderer/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        "instrument-serif": ['"Instrument Serif"', "serif"]
      }
    }
  },
  plugins: [require("@tailwindcss/typography")]
};

