/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { brand: '#F84464', ink: '#333545', 'ink-deep': '#1F2533', canvas: '#F5F5F5', muted: '#666978', available: '#4ABD5D' },
      maxWidth: { shell: '1240px' },
      fontFamily: { sans: ['Inter', 'Roboto', 'Arial', 'sans-serif'] },
      boxShadow: { card: '0 2px 12px rgba(31,37,51,.1)', modal: '0 18px 70px rgba(19,22,32,.26)' },
      borderRadius: { card: '6px' },
      transitionDuration: { 180: '180ms' },
    },
  },
  plugins: [],
};
