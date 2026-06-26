/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: 'var(--color-surface)',
          hover: 'var(--color-surface-hover)',
          active: 'var(--color-surface-active)',
          text: 'var(--color-text)',
          muted: 'var(--color-text-muted)'
        },
        terminal: {
          bg: 'var(--color-bg)',
          border: 'var(--color-border)'
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          blue: 'var(--color-accent)',
          green: 'var(--color-green)',
          red: 'var(--color-red)',
          yellow: 'var(--color-yellow)',
          purple: 'var(--color-purple)',
          cyan: 'var(--color-cyan)'
        }
      },
      backgroundColor: {
        theme: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          hover: 'var(--color-surface-hover)',
          active: 'var(--color-surface-active)'
        }
      },
      textColor: {
        theme: {
          DEFAULT: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
          accent: 'var(--color-accent-text)'
        }
      },
      borderColor: {
        theme: 'var(--color-border)'
      }
    }
  },
  plugins: []
}
