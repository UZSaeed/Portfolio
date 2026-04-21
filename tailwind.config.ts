import type { Config } from "tailwindcss";

// Tokyo Night palette (storm + night blends) — see https://github.com/folke/tokyonight.nvim
const tokyonight = {
  bg: "#1a1b26",
  bgDark: "#16161e",
  bgHighlight: "#292e42",
  terminalBlack: "#414868",
  fg: "#c0caf5",
  fgDark: "#a9b1d6",
  fgGutter: "#3b4261",
  dark3: "#545c7e",
  comment: "#565f89",
  dark5: "#737aa2",
  blue0: "#3d59a1",
  blue: "#7aa2f7",
  cyan: "#7dcfff",
  blue1: "#2ac3de",
  blue2: "#0db9d7",
  blue5: "#89ddff",
  blue6: "#b4f9f8",
  blue7: "#394b70",
  magenta: "#bb9af7",
  magenta2: "#ff007c",
  purple: "#9d7cd8",
  orange: "#ff9e64",
  yellow: "#e0af68",
  green: "#9ece6a",
  green1: "#73daca",
  green2: "#41a6b5",
  teal: "#1abc9c",
  red: "#f7768e",
  red1: "#db4b4b",
};

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tn: tokyonight,
      },
      fontFamily: {
        mono: [
          "var(--font-mono)",
          "JetBrainsMono Nerd Font",
          "JetBrains Mono",
          "Fira Code",
          "SF Mono",
          "ui-monospace",
          "monospace",
        ],
        sans: [
          "var(--font-sans)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        "glow-blue": "0 0 24px 0 rgba(122,162,247,0.45)",
        "glow-magenta": "0 0 24px 0 rgba(187,154,247,0.45)",
        "glow-green": "0 0 24px 0 rgba(158,206,106,0.45)",
        "glow-orange": "0 0 24px 0 rgba(255,158,100,0.45)",
      },
      keyframes: {
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
      },
      animation: {
        blink: "blink 1s step-end infinite",
        scanline: "scanline 9s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
