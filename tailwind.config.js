/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        }
      }
    },
  },
  plugins: [],
  safelist: [
    // Gray colors
    'border-gray-200',
    'border-gray-300',
    'bg-gray-50',
    'bg-gray-100',
    'bg-gray-200',
    'text-gray-500',
    'text-gray-600',
    'text-gray-700',
    'text-gray-800',
    'text-gray-900',
    // Yellow colors for debug box
    'bg-yellow-50',
    'border-yellow-200',
    'text-yellow-600',
    'text-yellow-700',
    'text-yellow-800',
    'bg-yellow-600',
    'hover:bg-yellow-700',
    // Other common colors
    'bg-white',
    'text-white',
    'bg-blue-600',
    'hover:bg-blue-700',
    'bg-green-600',
    'hover:bg-green-700',
    'bg-purple-600',
    'hover:bg-purple-700',
    'bg-red-600',
    'hover:bg-red-700',
  ]
};