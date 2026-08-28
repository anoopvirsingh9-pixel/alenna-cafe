/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#c9b17a",
        "brand-light": "#e0d0a0",
        "brand-dark": "#2c4545",
        teal: "#2c4545",
        "teal-deep": "#1c2e2e",
        gold: "#c9b17a",
        cream: "#f7f1e6",
        "cream-dark": "#eadfc8",
        sage: "#8aa09a",
        "sage-dark": "#5d736d",
        charcoal: "#1c2e2e",
        "warm-gray": "#6b6b6b",
      },
      fontFamily: {
        heading: ["Playfair Display", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
