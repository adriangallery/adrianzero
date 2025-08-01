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
        retro: {
          primary: '#0000ff', // Azul predominante para anaglyph
          secondary: '#ff00ff', // Magenta para acentos
          accent: '#00ffff', // Cyan para highlights
          dark: '#000000',
          light: '#ffffff',
          gray: '#404040',
          neon: {
            blue: '#0000ff',
            magenta: '#ff00ff',
            cyan: '#00ffff',
            red: '#ff0000',
            green: '#00ff00',
            yellow: '#ffff00',
          }
        }
      },
      fontFamily: {
        'pixel': ['VT323', 'monospace'],
        'retro': ['Press Start 2P', 'cursive'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'blink': 'blink 1s infinite',
        'scan': 'scan 3s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { textShadow: '0 0 5px #0000ff, 0 0 10px #0000ff, 0 0 15px #0000ff' },
          '100%': { textShadow: '0 0 10px #0000ff, 0 0 20px #0000ff, 0 0 30px #0000ff' }
        },
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' }
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        }
      }
    },
  },
  plugins: [],
} 