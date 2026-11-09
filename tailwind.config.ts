import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: "rgb(var(--bg-primary) / <alpha-value>)",
          secondary: "rgb(var(--bg-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--bg-tertiary) / <alpha-value>)",
        },
        surface: {
          raised: "rgb(var(--surface-raised) / <alpha-value>)",
          elevated: "rgb(var(--surface-elevated) / <alpha-value>)",
          inset: "rgb(var(--surface-inset) / <alpha-value>)",
          hover: "rgb(var(--surface-hover) / <alpha-value>)",
          selected: "rgb(var(--surface-selected) / <alpha-value>)",
        },
        foreground: {
          primary: "rgb(var(--text-primary) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          muted: "rgb(var(--text-muted) / <alpha-value>)",
          tertiary: "rgb(var(--text-tertiary) / <alpha-value>)",
          quaternary: "rgb(var(--text-quaternary) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--border) / <alpha-value>)",
          strong: "rgb(var(--border-strong) / <alpha-value>)",
        },
        separator: {
          DEFAULT: "rgb(var(--separator) / <alpha-value>)",
          strong: "rgb(var(--separator) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          hover: "rgb(var(--accent-hover) / <alpha-value>)",
          pressed: "rgb(var(--accent-pressed) / <alpha-value>)",
        },
        status: {
          success: "rgb(var(--status-success) / <alpha-value>)",
          warning: "rgb(var(--status-warning) / <alpha-value>)",
          error: "rgb(var(--status-error) / <alpha-value>)",
          info: "rgb(var(--status-info) / <alpha-value>)",
        },
        eta: {
          green: "rgb(var(--eta-green) / <alpha-value>)",
          red: "rgb(var(--eta-red) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        display: ["2rem", { lineHeight: "2.5rem", letterSpacing: "-0.025em", fontWeight: "600" }],
        title: ["1.75rem", { lineHeight: "2.125rem", letterSpacing: "-0.02em", fontWeight: "600" }],
        heading: ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.015em", fontWeight: "600" }],
        subheading: ["1rem", { lineHeight: "1.5rem", letterSpacing: "-0.01em", fontWeight: "500" }],
        body: ["0.875rem", { lineHeight: "1.5rem" }],
        small: ["0.8125rem", { lineHeight: "1.25rem" }],
        caption: ["0.75rem", { lineHeight: "1rem" }],
        micro: ["0.6875rem", { lineHeight: "0.875rem", letterSpacing: "0.04em" }],
      },
      borderRadius: {
        none: "0px",
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-control)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        full: "9999px",
      },
      boxShadow: {
        control: "var(--shadow-control)",
        glass: "var(--shadow-glass)",
        window: "var(--shadow-window)",
        popover: "var(--shadow-popover)",
        hairline: "inset 0 0 0 1px rgb(var(--separator) / 0.08)",
      },
      maxWidth: {
        content: "75rem",
        wide: "82rem",
        prose: "68ch",
      },
      transitionTimingFunction: {
        smooth: "var(--ease-standard)",
        emphasized: "var(--ease-emphasized)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97) translateY(4px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in var(--duration-standard) var(--ease-standard)",
        "scale-in": "scale-in var(--duration-standard) var(--ease-emphasized)",
        "slide-up": "slide-up var(--duration-slow) var(--ease-emphasized)",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
