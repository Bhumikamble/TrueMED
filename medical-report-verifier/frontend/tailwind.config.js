/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f6ff",
          100: "#eceeff",
          500: "#2254f4",
          600: "#173fd1",
          900: "#101f63"
        },
        accent: {
          500: "#17a27a",
          600: "#10815f"
        }
      },
      boxShadow: {
        glow: "0 8px 30px rgba(34, 84, 244, 0.25)"
      }
    },
  },
  plugins: [],
};
