import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Palet biru royal mengikuti web resmi UM Metro (penmaru.ummetro.ac.id)
        brand: {
          DEFAULT: "#0b46e3",
          50: "#eef3fe",
          100: "#d9e4fd",
          500: "#2d63ea",
          600: "#0b46e3",
          700: "#0938b4",
          900: "#2d3691",
        },
        // Aksen kuning tombol "DAFTAR" di web UM Metro
        accent: {
          DEFAULT: "#ffc107",
          100: "#fff3cd",
          600: "#e0a800",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Arial",
          "sans-serif",
        ],
        handwriting: ["var(--font-handwriting)", "cursive"],
      },
    },
  },
  plugins: [],
};
export default config;
