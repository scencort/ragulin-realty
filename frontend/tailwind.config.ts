import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F5F5F7",
        surface: "#FFFFFF",
        ink: "#1D1D1F",
        "ink-2": "#6E6E73",
        "ink-3": "#AEAEB2",
        "ink-4": "#D1D1D6",
        border: "rgba(0,0,0,0.08)",
        "border-strong": "rgba(0,0,0,0.14)",
        red: {
          DEFAULT: "#a20d0f",
          hover: "#8a0b0d",
          light: "rgba(162,13,15,0.08)",
        },
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display": ["clamp(52px,6vw,88px)", { lineHeight: "1.03", letterSpacing: "-0.03em" }],
        "headline": ["clamp(36px,4vw,56px)", { lineHeight: "1.08", letterSpacing: "-0.025em" }],
        "title-1": ["32px", { lineHeight: "1.18", letterSpacing: "-0.018em" }],
        "title-2": ["22px", { lineHeight: "1.27", letterSpacing: "-0.012em" }],
        "body-lg": ["17px", { lineHeight: "1.65" }],
        "body": ["15px", { lineHeight: "1.6" }],
        "caption": ["12px", { lineHeight: "1.5", letterSpacing: "0.01em" }],
        "label": ["11px", { lineHeight: "1.4", letterSpacing: "0.08em" }],
      },
      backdropBlur: {
        "glass": "20px",
        "glass-heavy": "40px",
        "glass-xl": "60px",
      },
      boxShadow: {
        "glass": "0 2px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
        "glass-md": "0 4px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
        "glass-lg": "0 8px 48px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.7)",
        "card": "0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.10)",
        "elevated": "0 12px 48px rgba(0,0,0,0.14)",
      },
      borderRadius: {
        "glass": "20px",
        "card": "16px",
        "pill": "100px",
      },
      spacing: {
        "section": "clamp(72px, 10vw, 120px)",
        "section-sm": "clamp(48px, 6vw, 80px)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) forwards",
        "fade-in": "fadeIn 0.5s ease forwards",
        "scale-in": "scaleIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards",
        "slide-up": "slideUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.96)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
