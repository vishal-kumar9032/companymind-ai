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
        bg: "#08080c",
        surface: {
          DEFAULT: "rgba(255, 255, 255, 0.03)",
          hover: "rgba(255, 255, 255, 0.05)",
          active: "rgba(255, 255, 255, 0.08)",
          card: "rgba(18, 18, 26, 0.72)",
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          subtle: "rgba(255, 255, 255, 0.05)",
          focus: "rgba(139, 92, 246, 0.5)",
        },
        accent: {
          DEFAULT: "#8b5cf6",
          hover: "#7c3aed",
          muted: "rgba(139, 92, 246, 0.15)",
        },
        danger: {
          DEFAULT: "#f43f5e",
          muted: "rgba(244, 63, 94, 0.15)",
        },
        success: {
          DEFAULT: "#34d399",
          muted: "rgba(52, 211, 153, 0.15)",
        },
        warning: {
          DEFAULT: "#f59e0b",
          muted: "rgba(245, 158, 11, 0.15)",
        },
        falkor: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 8px 32px 0 rgba(0, 0, 0, 0.36)",
        glow: "0 0 24px -4px rgba(139, 92, 246, 0.25)",
        "inner-highlight": "inset 0 1px 0 0 rgba(255, 255, 255, 0.07)",
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
