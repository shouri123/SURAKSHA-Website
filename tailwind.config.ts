import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["'IBM Plex Sans'", "'Noto Sans Devanagari'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        sans: ["'Inter'", "'Noto Sans Devanagari'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["'JetBrains Mono'", "'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        background: "#09090B",
        foreground: "#FFFFFF",
        brand: {
          DEFAULT: "#0FA978",
          400: "#14BF88",
          500: "#0FA978",
          600: "#0B8A61",
          soft: "rgba(15, 169, 120, 0.13)",
          border: "rgba(15, 169, 120, 0.36)",
        },
        obsidian: {
          DEFAULT: "#09090B",
          950: "#09090B",
          900: "#0D1110",
          850: "#121816",
          800: "#18201D",
          700: "#1F2925",
          border: "#1F2925",
        },
        charcoal: {
          DEFAULT: "#09090B",
          950: "#09090B",
          900: "#0D1110",
          card: "#121816",
          elevated: "#18201D",
          border: "#1F2925",
        },
        sand: {
          DEFAULT: "#FFFFFF",
          bright: "#FFFFFF",
          muted: "#97A39E",
          dim: "#6B7873",
          faint: "rgba(255, 255, 255, 0.08)",
        },
        electric: {
          DEFAULT: "#FFFFFF",
          hover: "#DDE4E1",
          active: "#C8D3CE",
          tinted: "#121816",
          dim: "rgba(255, 255, 255, 0.10)",
        },
        suraksha: {
          950: "#09090B",
          900: "#0D1110",
          850: "#121816",
          800: "#18201D",
          750: "#1F2925",
          700: "#2C3833",
          600: "#4A5953",
          500: "#6B7873",
          400: "#97A39E",
          300: "#C8D3CE",
          200: "#DDE4E1",
          100: "#FFFFFF",
        },
        cyan: {
          DEFAULT: "#FFFFFF",
          500: "#FFFFFF",
          400: "#E4E4E7",
          glow: "rgba(255, 255, 255, 0.2)",
        },
        teal: {
          DEFAULT: "#FFFFFF",
          500: "#FFFFFF",
          400: "#E4E4E7",
        },
      },
      borderRadius: {
        pill: "9999px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
