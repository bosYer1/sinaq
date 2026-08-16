import type { Config } from 'tailwindcss';

// GameYer dizayn tokenləri — v3 (light-first marketplace).
//
// Prinsip: neytral, işıqlı, professional zəmin üzərində YALNIZ information
// hierarchy üçün rəng: PC=bənövşəyi, PlayStation=sian, açıq=yaşıl,
// premium=qızılı. Rəng dekorasiya deyil, kateqoriya/status siqnalıdır.
const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        'bg-elevated': 'var(--color-bg-elevated)',
        surface: 'var(--color-surface)',
        'surface-hover': 'var(--color-surface-hover)',
        'surface-alt': 'var(--color-surface-alt)',
        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
        ink: 'var(--color-text)',
        muted: 'var(--color-text-muted)',
        faint: 'var(--color-text-faint)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-dark)',
        },
        // Compatibility aliases used by existing active/filter/fallback states.
        'primary-light': 'var(--color-pc-tint)',
        live: 'var(--color-live)',
        'live-tint': 'var(--color-live-tint)',
        'live-light': 'var(--color-live-tint)',
        warn: 'var(--color-warn)',
        'warn-tint': 'var(--color-warn-tint)',
        'warn-light': 'var(--color-warn-tint)',
        pc: 'var(--color-pc)',
        'pc-tint': 'var(--color-pc-tint)',
        ps: 'var(--color-ps)',
        'ps-tint': 'var(--color-ps-tint)',
        'ps-light': 'var(--color-ps-tint)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        card: '14px',
        control: '8px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(16,24,40,0.04), 0 1px 3px 0 rgba(16,24,40,0.06)',
        'card-hover': '0 4px 8px -2px rgba(16,24,40,0.08), 0 2px 4px -2px rgba(16,24,40,0.06)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
