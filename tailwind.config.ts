import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05070a",
          900: "#080c11",
          800: "#0e141c",
          700: "#151d28",
          600: "#1c2733",
        },
        pitch: {
          500: "#1f8a42",
          600: "#167338",
          700: "#0f5c2c",
        },
        neon: {
          DEFAULT: "#3dff8a",
          dim: "#1fa85a",
        },
        gold: {
          DEFAULT: "#f0c14b",
          dim: "#b8860b",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(61, 255, 138, 0.15)",
        gold: "0 0 30px rgba(240, 193, 75, 0.18)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;
