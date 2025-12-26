/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}", // Adicionando components na raiz
    "./**/*.{js,ts,jsx,tsx}", // Fallback para arquivos na raiz
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#1E40AF',
        'primary-hover': '#1D4ED8',
        'secondary': '#F3F4F6',
        'accent': '#F59E0B',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
