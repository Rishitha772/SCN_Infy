/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#e2e8f0',
          200: '#cbd5e1',
          300: '#94a3b8',
          400: '#64748b',
          450: '#36b7c9', // cyan
          500: '#167d9a', // teal
          600: '#123b63', // scientific blue
          650: '#123b63',
          700: '#0e2e4e',
          800: '#0a2037',
          900: '#071524',
          950: '#172033'
        },
        slate: {
          50: '#f7f9fc',  // clean cool page background
          100: '#f1f5f9', // subtle gray
          200: '#e2e8f0', // divider border
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#172033',
          950: '#0f172a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.03), 0 2px 4px rgba(0, 0, 0, 0.02)',
        'lg': '0 10px 20px rgba(0, 0, 0, 0.04), 0 3px 6px rgba(0, 0, 0, 0.03)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
