/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0c10',
        surface: '#12151c',
        card: '#161b27',
        border: '#232940',
        accent: '#00e5ff',
        ok: '#22c55e',
        bad: '#ef4444',
        warn: '#f59e0b',
        muted: '#8892b0',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
};
