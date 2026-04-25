import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ShareChat-inspired palette: warm, Bharat-feel, bold
        sc: {
          primary: '#E5264B',    // ShareChat red-pink
          accent:  '#FF6B35',    // Saffron-warm accent
          ink:     '#0F0B1F',    // Deep purple-black bg
          surface: '#1A142E',    // Card surface
          surfaceHi: '#2A1F4A',
          muted:   '#8B80A8',
          line:    '#2E2545',
          heat1:   '#FFB800',    // Warm heat gradient
          heat2:   '#FF4D4D',
          heat3:   '#C1275C',
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
};

export default config;
