const { Primary, Secondary, Error, Success, Warning, White, Background, Grey } = require("./constants/colors");

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
        background: Background,
        grey: Grey,
      },
      // Google Fonts ships one static .ttf per weight — each weight is its own
      // font family name (RN can't fake weights within a single family via
      // fontWeight), so every weight actually used gets its own utility.
      fontFamily: {
        sans: ["Inter_400Regular"],
        "sans-medium": ["Inter_500Medium"],
        "sans-semibold": ["Inter_600SemiBold"],
        heading: ["Sora_600SemiBold"],
        "heading-bold": ["Sora_700Bold"],
      },
    },
  },
  plugins: [],
};
