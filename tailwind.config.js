/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        card: "#FFFFFF",
        ink: "#16241F",
        "ink-soft": "#4B5C54",
        pine: "#2F5D50",
        "pine-dark": "#1E3E35",
        gold: "#B98D3E",
        rule: "#D8D9C8",
        error: "#B23A34",
        cream: "#FBF7EC",
      },
      fontFamily: {
        display: ["\"Instrument Serif\"", "Georgia", "serif"],
        body: ["\"Inter\"", "system-ui", "sans-serif"],
        mono: ["\"IBM Plex Mono\"", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(31,42,36,0.06), 0 4px 14px rgba(31,42,36,0.06)",
      },
      keyframes: {
        stamp: {
          "0%": { transform: "scale(2.2) rotate(-8deg)", opacity: "0" },
          "60%": { transform: "scale(0.95) rotate(-8deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-8deg)", opacity: "1" },
        },
        flip: {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(180deg)" },
        },
      },
      animation: {
        stamp: "stamp 0.35s ease-out forwards",
      },
    },
  },
  plugins: [],
};