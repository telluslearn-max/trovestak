import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        border: "rgb(var(--border))",
        input: "rgb(var(--input))",
        ring: "rgb(var(--ring))",
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        primary: {
          DEFAULT: "rgb(var(--primary))",
          foreground: "rgb(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary))",
          foreground: "rgb(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive))",
          foreground: "rgb(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "rgb(var(--muted))",
          foreground: "rgb(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "rgb(var(--accent))",
          foreground: "rgb(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "rgb(var(--popover))",
          foreground: "rgb(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "rgb(var(--card))",
          foreground: "rgb(var(--card-foreground))",
        },
        success: {
          DEFAULT: "rgb(var(--success))",
          foreground: "rgb(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "rgb(var(--warning))",
          foreground: "rgb(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "rgb(var(--info))",
          foreground: "rgb(var(--info-foreground))",
        },
        apple: {
          gray: "#F5F5F7",
          dark: "#000000",
          blue: "#0071E3",
          "blue-hover": "#0077ED",
          "blue-dark": "#2997FF",
          text: "#1D1D1F",
          "text-secondary": "#86868B",
          "text-tertiary": "#6E6E73",
          border: "#D2D2D7",
          "border-dark": "#424245",
        },
      },
      fontSize: {
        // Apple type scale
        display: ["80px", { lineHeight: "1.05", fontWeight: "700", letterSpacing: "-0.015em" }],
        headline: ["48px", { lineHeight: "1.1", fontWeight: "700", letterSpacing: "-0.01em" }],
        title: ["32px", { lineHeight: "1.2", fontWeight: "600", letterSpacing: "-0.005em" }],
        "body-apple": ["17px", { lineHeight: "1.6", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "1.4", fontWeight: "400" }],
        // Legacy scale
        h1: ["2.5rem", { lineHeight: "1.2", fontWeight: "700" }],
        h2: ["2rem", { lineHeight: "1.25", fontWeight: "700" }],
        h3: ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        h4: ["1.25rem", { lineHeight: "1.35", fontWeight: "600" }],
        h5: ["1.125rem", { lineHeight: "1.4", fontWeight: "600" }],
        h6: ["1rem", { lineHeight: "1.5", fontWeight: "600" }],
        body: ["1rem", { lineHeight: "1.5" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
        "body-xs": ["0.75rem", { lineHeight: "1.5" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sf: [
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      animation: {
        "fade-in": "fadeIn 0.5s var(--ease-smooth)",
        "slide-up": "slideUp 0.6s var(--ease-smooth)",
        "slide-down": "slideDown 0.4s var(--ease-smooth)",
        scale: "scale 0.3s var(--ease-spring)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scale: {
          "0%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
      },
      transitionTimingFunction: {
        smooth: "var(--ease-smooth)",
        spring: "var(--ease-spring)",
      },
    },
  },
  plugins: [],
};

export default config;
