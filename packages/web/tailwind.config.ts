import type { Config } from "tailwindcss";

// Helper function to support opacity with CSS variables using color-mix
function withOpacity(variableName: string): any {
  return ({ opacityValue }: { opacityValue: string | undefined }) => {
    if (opacityValue !== undefined) {
      return `color-mix(in srgb, var(${variableName}) calc(${opacityValue} * 100%), transparent)`;
    }
    return `var(${variableName})`;
  };
}

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: withOpacity("--border"),
        input: withOpacity("--input"),
        ring: withOpacity("--ring"),
        background: withOpacity("--background"),
        foreground: withOpacity("--foreground"),
        primary: {
          DEFAULT: withOpacity("--primary"),
          foreground: withOpacity("--primary-foreground"),
        },
        secondary: {
          DEFAULT: withOpacity("--secondary"),
          foreground: withOpacity("--secondary-foreground"),
        },
        destructive: {
          DEFAULT: withOpacity("--destructive"),
          foreground: withOpacity("--destructive-foreground"),
        },
        muted: {
          DEFAULT: withOpacity("--muted"),
          foreground: withOpacity("--muted-foreground"),
        },
        accent: {
          DEFAULT: withOpacity("--accent"),
          foreground: withOpacity("--accent-foreground"),
        },
        popover: {
          DEFAULT: withOpacity("--popover"),
          foreground: withOpacity("--popover-foreground"),
        },
        card: {
          DEFAULT: withOpacity("--card"),
          foreground: withOpacity("--card-foreground"),
        },
        sidebar: {
          DEFAULT: withOpacity("--sidebar"),
          foreground: withOpacity("--sidebar-foreground"),
          primary: withOpacity("--sidebar-primary"),
          "primary-foreground": withOpacity("--sidebar-primary-foreground"),
          accent: withOpacity("--sidebar-accent"),
          "accent-foreground": withOpacity("--sidebar-accent-foreground"),
          border: withOpacity("--sidebar-border"),
          ring: withOpacity("--sidebar-ring"),
        },
        chart: {
          1: withOpacity("--chart-1"),
          2: withOpacity("--chart-2"),
          3: withOpacity("--chart-3"),
          4: withOpacity("--chart-4"),
          5: withOpacity("--chart-5"),
        },
        // Magazine theme colors (CSS custom properties)
        mag: {
          primary: "var(--mag-primary)",
          accent: "var(--mag-accent)",
          bg: "var(--mag-bg)",
          text: "var(--mag-text)",
        },
        "scanner-green": "#00FF00",
        "neon-orange": "#FF4500",
        // Main page colors
        "main-bg": "var(--main-bg)",
        "main-cta-bg": "var(--main-cta-bg)",
        "main-accent": "var(--main-accent)",
      },
      fontSize: {
        // Main page typography (existing, keep for backward compatibility)
        hero: "var(--text-hero)",
        "heading-xl": "var(--text-heading-xl)",
        "heading-lg": "var(--text-heading-lg)",
        "heading-md": "var(--text-heading-md)",
        "heading-sm": "var(--text-heading-sm)",

        // Semantic heading sizes from design system (decoded.pen)
        h1: ["3rem", { lineHeight: "1.15", fontWeight: "600" }], // 48px
        h2: ["2.25rem", { lineHeight: "1.2", fontWeight: "600" }], // 36px
        h3: ["1.75rem", { lineHeight: "1.25", fontWeight: "600" }], // 28px
        h4: ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }], // 24px
        "body-lg": ["1.125rem", { lineHeight: "1.75" }], // 18px
        body: ["1rem", { lineHeight: "1.5" }], // 16px
        "body-sm": ["0.875rem", { lineHeight: "1.5" }], // 14px
        caption: ["0.75rem", { lineHeight: "1.4" }], // 12px
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "2xs": "var(--shadow-2xs)",
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
      },
      fontFamily: {
        serif: ["Playfair Display", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-soft": "pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spot-reveal": "spot-reveal 0.4s ease-out forwards",
        "neon-drift": "neon-drift 10s ease-in-out infinite alternate",
        "neon-drift-reverse":
          "neon-drift-reverse 12s ease-in-out infinite alternate",
        "neon-drift-slow": "neon-drift-slow 8s ease-in-out infinite alternate",
        "bounce-slow": "bounce-slow 2.4s ease-in-out infinite",
        "scroll-dot": "scroll-dot 2.4s ease-in-out infinite",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": {
            transform: "translate(-50%, -50%) scale(1)",
            opacity: "1",
          },
          "50%": {
            transform: "translate(-50%, -50%) scale(1.15)",
            opacity: "0.8",
          },
        },
        "spot-reveal": {
          "0%": {
            opacity: "0",
            transform: "translate(-50%, -50%) scale(0)",
          },
          "50%": {
            opacity: "1",
            transform: "translate(-50%, -50%) scale(1.3)",
          },
          "100%": {
            opacity: "1",
            transform: "translate(-50%, -50%) scale(1)",
          },
        },
        "neon-drift": {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "100%": { transform: "translate(3%, 5%) scale(1.05)" },
        },
        "neon-drift-reverse": {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "100%": { transform: "translate(-4%, -3%) scale(1.08)" },
        },
        "neon-drift-slow": {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "100%": { transform: "translate(2%, -4%) scale(1.03)" },
        },
        "bounce-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(5px)" },
        },
        "scroll-dot": {
          "0%": { cy: "9", opacity: "1" },
          "50%": { cy: "18", opacity: "0.3" },
          "100%": { cy: "9", opacity: "1" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
