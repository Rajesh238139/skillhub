/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#120E29",
        violet: {
          50: "#F5F2FF",
          100: "#EBE4FF",
          200: "#D2C4FF",
          400: "#9A7CFF",
          500: "#7C5CFF",
          600: "#6D28D9",
          700: "#5B1FB8",
          900: "#2A1B5D",
        },
        coral: {
          400: "#FF8A65",
          500: "#FF6B4A",
          600: "#F0512E",
        },
        mint: {
          400: "#34D9A8",
          500: "#10B981",
          600: "#0C9468",
        },
        cream: "#FAF8FF",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        glow: "0 8px 30px -8px rgba(124, 92, 255, 0.45)",
        card: "0 2px 12px -2px rgba(18, 14, 41, 0.08)",
        cardHover: "0 16px 40px -12px rgba(124, 92, 255, 0.35)",
      },
      backgroundImage: {
        "mesh": "radial-gradient(at 20% 10%, rgba(124,92,255,0.25) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(255,107,74,0.18) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(16,185,129,0.12) 0px, transparent 50%)",
        "cta": "linear-gradient(135deg, #7C5CFF 0%, #FF6B4A 100%)",
      },
    },
  },
  plugins: [],
}
