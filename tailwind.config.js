/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#1e1e2e',
          hover: '#313244',
          active: '#45475a',
          text: '#cdd6f4',
          muted: '#6c7086'
        },
        terminal: {
          bg: '#11111b',
          border: '#313244'
        },
        accent: {
          blue: '#89b4fa',
          green: '#a6e3a1',
          red: '#f38ba8',
          yellow: '#f9e2af',
          purple: '#cba6f7'
        }
      }
    }
  },
  plugins: []
}
