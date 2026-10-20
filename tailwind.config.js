/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        tokyo: {
          bg: "#1a1b26",
          bgDark: "#16161e",
          bgHighlight: "#292e42",
          bgFloat: "#24283b",
          bgSidebar: "#1a1b26",
          bgActivity: "#16161e",
          fg: "#c0caf5",
          fgDark: "#a9b1d6",
          fgGutter: "#3b4261",
          border: "#292e42",
          borderActive: "#7aa2f7",
          comment: "#565f89",
          blue: "#7aa2f7",
          blueBright: "#2ac3de",
          cyan: "#7dcfff",
          magenta: "#bb9af7",
          green: "#9ece6a",
          yellow: "#e0af68",
          orange: "#ff9e64",
          red: "#f7768e",
          logoLight: "#0ea5e9",
          logoDeep: "#0b6fda",
        }
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Cascadia Code", "Fira Code", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
}
