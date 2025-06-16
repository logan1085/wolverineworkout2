/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'athletic': ['Roboto Condensed', 'Inter', 'sans-serif'],
        'athletic-light': ['Roboto Condensed', 'Inter', 'sans-serif'],
        'athletic-bold': ['Roboto Condensed', 'Inter', 'sans-serif'],
      },
      colors: {
        gray: {
          750: '#2d3748',
        },
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-in': 'slideIn 0.5s ease-out',
      },
      keyframes: {
        glow: {
          '0%, 100%': {
            boxShadow: '0 0 5px rgba(20, 184, 166, 0.5)',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(20, 184, 166, 0.8), 0 0 30px rgba(59, 130, 246, 0.6)',
          },
        },
        slideIn: {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
    },
  },
  plugins: [],
} 