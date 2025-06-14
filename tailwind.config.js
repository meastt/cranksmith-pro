/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './pages/**/*.{js,jsx,ts,tsx}',
      './components/**/*.{js,jsx,ts,tsx}',
      './styles/**/*.css',
    ],
    theme: {
      screens: { lg: '1024px', xl: '1280px', '2xl': '1536px' },
      extend: {
        colors: {
          bg: 'var(--bg)',
          surface: 'var(--surface)',
          text: 'var(--text)',
          'text-secondary': 'var(--text-secondary)',
          border: 'var(--border)',
          accent: 'var(--accent)',
          success: 'var(--success)',
          warning: 'var(--warning)',
          error: 'var(--error)',
        },
        fontFamily: {
          mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
        },
      },
    },
    plugins: [],
  };
  