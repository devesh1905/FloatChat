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
        ocean: {
          950: '#070B19', // Obsidian Navy
          900: '#0B132B', // Deep Abyssal Slate
          800: '#1C2541', // Ocean Blue Card
          700: '#2F3E66', // Muted Blue Border
          500: '#3A506B', // Slate Light Accent
          400: '#48CAE4', // Cyber Electric Cyan
          300: '#90E0EF', // Pale Ice Blue
          100: '#CAF0F8'  // White Cyan Glow
        }
      }
    },
  },
  plugins: [],
};
