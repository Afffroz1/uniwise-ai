/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        amu: {
          primary: '#0b5e36',
          dark: '#073d22',
          darker: '#042817',
          light: '#eaf3ed',
          sage: '#e3ede6',
          sageDark: '#d0dfd6',
          maroon: '#8c1d22',
          gold: '#c29b38',
          border: '#dbe6df',
          sidebar: '#083b21',
          sidebarActive: '#0f5230',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['Cinzel', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
