const { Primary, Secondary, Error, Success, Warning, White } = require("./constants/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: Primary,
        secondary: Secondary,
        error: Error,
        success: Success,
        warning: Warning,
        white: White,
      },
    },
  },
  plugins: [],
};
