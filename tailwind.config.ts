import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        muted: "var(--muted)",
        paper: "var(--paper)",
        card: "var(--card)",
        line: "var(--line)",
        accent: "var(--accent)",
        warn: "var(--warn)",
      },
    },
  },
  plugins: [],
};
export default config;
