/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Coursera-inspired color scheme - Professional Blue
        primary: {
          50: '#e6f2ff',
          100: '#b3d9ff',
          200: '#80bfff',
          300: '#4da6ff',
          400: '#1a8cff',
          500: '#0056D2', // Main primary - Coursera Blue
          600: '#0047b3',
          700: '#003894',
          800: '#002975',
          900: '#001a56',
        },
        secondary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Secondary - Sky Blue
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Accent - Green for success/complete
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0056D2 0%, #0047b3 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        'gradient-hero': 'linear-gradient(135deg, #f8fafc 0%, #e6f2ff 100%)',
        'gradient-hero-soft': 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
        'gradient-navbar': 'linear-gradient(135deg, #ffffff 0%, #ffffff 100%)',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-secondary': '0 0 20px rgba(20, 184, 166, 0.3)',
      },
    },
  },
  plugins: [],
}
