/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0a0a0a',
          800: '#1a1a1a',
          700: '#2a2a2a',
          500: '#5a5a5a',
          300: '#a8a8a8',
          100: '#e8e8e8',
          50: '#f4f4f0',
        },
        flame: {
          DEFAULT: '#f6821f', // Cloudflare's orange
          dim: '#c2671a',
          bg: '#fef3eb',
        },
        sage: '#3a7b3a',
        plum: '#7a3a7b',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
    },
  },
  plugins: [],
};
