/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["'Source Serif 4'", "Georgia", "serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        paper: "#F7F5F0",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#171512",
          soft: "#6F6A61",
        },
        line: "#E3DFD5",
        brand: {
          DEFAULT: "#2B3A55",
          soft: "#3D4E6B",
        },
        risk: {
          low: "#1E7A5C",
          mid: "#A6741B",
          high: "#AC3327",
        },
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};
