/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          DEFAULT: "#0a0e16",
          panel: "#0f1420",
          card: "#141a29",
          border: "#232b3d",
        },
        accent: {
          DEFAULT: "#22d3ee",
          dim: "#0891b2",
        },
        risk: {
          low: "#2dd4bf",
          mid: "#f59e0b",
          high: "#ef4444",
        },
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(34, 211, 238, 0.35)",
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
