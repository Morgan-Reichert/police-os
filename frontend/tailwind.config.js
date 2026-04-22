/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      colors: {
        // Palette "admin sombre"
        bureau: {
          900: '#0a0e14',
          800: '#0f141c',
          700: '#161d27',
          600: '#1e2734',
          500: '#2a3441',
          400: '#3d4a5c',
          300: '#5e6b7f',
        },
        accent: {
          green: '#00ff9c',   // MATCH / OK
          red:   '#ff3c3c',   // NO MATCH / ALERT
          amber: '#ffb020',   // PROCESSING
          blue:  '#4fc3ff',   // INFO
        },
      },
      boxShadow: {
        'win': '0 0 0 1px #3d4a5c, 0 10px 40px rgba(0,0,0,0.6)',
        'inset-dark': 'inset 0 1px 0 #2a3441, inset 0 -1px 0 #000',
      },
    },
  },
  plugins: [],
};
