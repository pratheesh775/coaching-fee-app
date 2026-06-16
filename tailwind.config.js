/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4285F4',
          light: '#6BA3F7',
          dark: '#1A65D6'
        },
        navy: {
          DEFAULT: '#111D3A',
          light: '#1E3055'
        },
        success: {
          DEFAULT: '#16A34A',
          light: '#DCFCE7'
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FEF3C7'
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2'
        },
        sidebar: {
          DEFAULT: '#111D3A',
          hover: 'rgba(66, 133, 244, 0.15)',
          text: 'rgba(255,255,255,0.7)',
          'text-active': '#ffffff'
        },
        body: '#EFF1F5',
        card: '#FFFFFF'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px'
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.06)',
        DEFAULT: '0 4px 12px rgba(0,0,0,0.09)',
        lg: '0 8px 24px rgba(0,0,0,0.12)',
        xl: '0 16px 40px rgba(0,0,0,0.14)'
      }
    }
  },
  plugins: []
}
