import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        patrol: {
          green: "#157f59",
          amber: "#b7791f",
          red: "#ba2f3c",
          blue: "#2463a6",
          line: "#d9e1e8",
          paper: "#f7f9fb",
        },
      },
      boxShadow: {
        panel: "0 16px 40px rgba(23, 32, 42, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
