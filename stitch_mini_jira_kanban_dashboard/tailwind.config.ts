import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#f9f9fb',
        surface_container_low: '#f2f4f6',
        surface_container_lowest: '#ffffff',
        surface_container_high: '#e4e9ee',
        surface_container_highest: '#dde3e9',
        primary: '#005bbf',
        primary_dim: '#0050a8',
        outline_variant: '#acb3b8',
        tertiary_container: '#69f6b8',
        on_tertiary_fixed: '#00452d',
        error_container: '#fe8983',
        on_error_container: '#752121',
        primary_container: '#d7e2ff',
        on_primary_fixed: '#003d84',
        inverse_surface: '#0c0e10',
      },
      boxShadow: {
        air: '0px 12px 32px rgba(12, 14, 16, 0.04)',
      },
      borderRadius: {
        md: '0.375rem',
        xl: '0.75rem',
      },
    },
  },
  plugins: [],
} satisfies Config
