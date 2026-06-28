import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E30613',
          dark: '#C40010',
          soft: '#FFF1F3',
        },
        ink: {
          DEFAULT: '#171D2B',
          muted: '#8A8F9B',
          secondary: '#374151',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          soft: '#FFFAFA',
          border: 'rgba(23, 29, 43, 0.10)',
        },
      },
      boxShadow: {
        card: '0 10px 24px rgba(23, 29, 43, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
