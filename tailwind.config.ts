import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      colors: {
        bg: "#f8fafc",
        surface: {
          DEFAULT: "#ffffff",
          hover: "#f1f5f9",
          active: "#e2e8f0",
          card: "#ffffff",
        },
        border: {
          DEFAULT: "#e2e8f0",
          subtle: "#f1f5f9",
          focus: "rgba(99, 102, 241, 0.6)",
        },
        accent: {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
          muted: "rgba(99, 102, 241, 0.08)",
        },
        danger: {
          DEFAULT: "#e11d48",
          muted: "rgba(225, 29, 72, 0.08)",
        },
        success: {
          DEFAULT: "#059669",
          muted: "rgba(5, 150, 105, 0.08)",
        },
        warning: {
          DEFAULT: "#d97706",
          muted: "rgba(217, 119, 6, 0.08)",
        },
        falkor: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        elevated: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        glow: "0 0 24px -4px rgba(99, 102, 241, 0.18)",
        "inner-highlight": "inset 0 1px 0 0 rgba(255, 255, 255, 0.9)",
      },
      fontSize: {
        "2xs": ["11px", "14px"],
        xs: ["12px", "16px"],
        sm: ["14px", "20px"],
        base: ["16px", "24px"],
        xl: ["20px", "28px"],
        "2xl": ["28px", "36px"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
