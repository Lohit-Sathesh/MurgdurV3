/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'luxury-black': 'rgb(var(--color-bg-rgb) / <alpha-value>)',
        'luxury-white': 'rgb(var(--color-text-rgb) / <alpha-value>)',
        'luxury-gold':  'rgb(var(--color-gold-rgb) / <alpha-value>)',
        'luxury-gray':  'rgb(var(--color-gray-rgb) / <alpha-value>)',
        'luxury-muted': 'rgb(var(--color-muted-rgb) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'serif'],
        sans:  ['var(--font-sans)', 'sans-serif'],
      },
      letterSpacing: {
        luxury: '0.15em',
        wide:   '0.08em',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      keyframes: {
        kenburns: {
          '0%':   { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.12)' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(110%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
      },
      animation: {
        kenburns:     'kenburns 12s ease-out forwards',
        slideInRight: 'slideInRight 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
