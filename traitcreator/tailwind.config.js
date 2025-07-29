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
          primary: '#00ff00',
          secondary: '#ff00ff',
          accent: '#ffff00',
          dark: '#000000',
          light: '#ffffff',
          gray: '#808080',
          neon: {
            blue: '#00ffff',
            pink: '#ff0080',
            green: '#00ff00',
            yellow: '#ffff00',
            purple: '#8000ff',
            orange: '#ff8000',
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
          '0%': { textShadow: '0 0 5px #00ff00, 0 0 10px #00ff00, 0 0 15px #00ff00' },
          '100%': { textShadow: '0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00' }
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