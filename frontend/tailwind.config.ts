import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary: Light Pink
        pink: {
          50: "#FFF5F7",
          100: "#FFEBEF",
          200: "#FFD6E0",
          300: "#FFB6C8",
          400: "#FF8FA8",
          500: "#FF6B8A",
          600: "#E54B6B",
          700: "#C93D5B",
          800: "#A32E4A",
          900: "#7D2239",
        },
        // Accent: Yellow
        accent: {
          50: "#FFFEF0",
          100: "#FFFCDB",
          200: "#FFF9B8",
          300: "#FFF490",
          400: "#FFED5C",
          500: "#FFE500",
          600: "#E6CE00",
          700: "#BFA800",
          800: "#998600",
          900: "#736500",
        },
        // Dark mode backgrounds
        dark: {
          50: "#f7f7f8",
          100: "#ececef",
          200: "#d5d5db",
          300: "#b0b0bc",
          400: "#858597",
          500: "#66667a",
          600: "#515163",
          700: "#434351",
          800: "#1a1a24",
          900: "#121218",
          950: "#0a0a0f",
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "cursive"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "glitch-1": "glitch-1 0.3s ease-in-out infinite",
        "glitch-2": "glitch-2 0.3s ease-in-out infinite reverse",
        "pixel-fade": "pixel-fade 0.5s steps(8) forwards",
        "scan-line": "scan-line 4s linear infinite",
        float: "float 3s ease-in-out infinite",
        pulse: "pulse 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        "glitch-1": {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
        },
        "glitch-2": {
          "0%, 100%": { transform: "translate(0)", opacity: "0.8" },
          "20%": { transform: "translate(2px, -2px)", opacity: "0.6" },
          "40%": { transform: "translate(2px, 2px)", opacity: "0.8" },
          "60%": { transform: "translate(-2px, -2px)", opacity: "0.6" },
          "80%": { transform: "translate(-2px, 2px)", opacity: "0.8" },
        },
        "pixel-fade": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        "pixel-grid":
          "linear-gradient(rgba(255,182,200,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,182,200,0.1) 1px, transparent 1px)",
        "glitch-gradient":
          "linear-gradient(135deg, rgba(255,107,138,0.2) 0%, rgba(255,229,0,0.2) 100%)",
        shimmer:
          "linear-gradient(90deg, transparent 0%, rgba(255,182,200,0.3) 50%, transparent 100%)",
      },
      backgroundSize: {
        "pixel-grid": "20px 20px",
        shimmer: "200% 100%",
      },
      boxShadow: {
        pixel: "4px 4px 0 0 rgba(0,0,0,0.2)",
        "pixel-sm": "2px 2px 0 0 rgba(0,0,0,0.2)",
        "pixel-lg": "8px 8px 0 0 rgba(0,0,0,0.2)",
        glow: "0 0 20px rgba(255,107,138,0.5)",
        "glow-yellow": "0 0 20px rgba(255,229,0,0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
