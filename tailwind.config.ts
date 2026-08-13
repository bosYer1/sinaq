import type { Config } from 'tailwindcss';

// BoşYer dizayn tokenləri.
// Premium dark gaming konsepti: graphite/navy fon üzərində PC üçün elektrik
// bənövşəyi (primary/pc), PlayStation üçün canlı cyan (ps) əsas rəng olaraq
// ayrılıb; "açıqdır" statusu üçün ayrıca yaşıl (live) əlamət rəngi saxlanılıb.
const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-alt': 'var(--color-surface-alt)',
        border: 'var(--color-border)',
        ink: 'var(--color-text)',
        muted: 'var(--color-text-muted)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-dark)',
          light: 'var(--color-primary-light)',
        },
        live: 'var(--color-live)',
        'live-light': 'var(--color-live-light)',
        warn: 'var(--color-warn)',
        'warn-light': 'var(--color-warn-light)',
        pc: 'var(--color-pc)',
        ps: 'var(--color-ps)',
        'ps-light': 'var(--color-ps-light)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 22, 28, 0.04), 0 8px 24px -12px rgba(20, 22, 28, 0.12)',
        'card-hover': '0 4px 8px rgba(20, 22, 28, 0.06), 0 16px 32px -12px rgba(20, 22, 28, 0.18)',
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
