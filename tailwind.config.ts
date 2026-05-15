import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans KR', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        cream: '#F4ECDC',
        terracotta: '#C47C58',
        sage: '#5C7A4F',
        ink: '#2D2418',
        muted: '#6B5E48',
      },
    },
  },
  plugins: [],
};

export default config;
