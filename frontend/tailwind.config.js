/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#212121',
        'dark-surface': '#2f2f2f',
        'dark-border': '#404040',
        'dark-text': '#ffffff',
        'dark-text-secondary': '#d1d5db',
        'accent': '#10a37f',
        'accent-hover': '#0d8a6a',
      },
    },
  },
  plugins: [],
}
