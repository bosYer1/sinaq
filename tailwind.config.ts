import type { Config } from 'tailwindcss';

// GameYer UI 3.0 — dark-first gaming discovery system.
const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)', 'bg-elevated': 'var(--color-bg-elevated)', surface: 'var(--color-surface)', 'surface-hover': 'var(--color-surface-hover)', 'surface-alt': 'var(--color-surface-alt)', border: 'var(--color-border)', 'border-strong': 'var(--color-border-strong)', ink: 'var(--color-text)', muted: 'var(--color-text-muted)', faint: 'var(--color-text-faint)',
        primary: { DEFAULT: 'var(--color-primary)', dark: 'var(--color-primary-dark)' },
        'primary-light': 'var(--color-pc-tint)', live: 'var(--color-live)', 'live-tint': 'var(--color-live-tint)', 'live-light': 'var(--color-live-tint)', warn: 'var(--color-warn)', 'warn-tint': 'var(--color-warn-tint)', 'warn-light': 'var(--color-warn-tint)', pc: 'var(--color-pc)', 'pc-tint': 'var(--color-pc-tint)', ps: 'var(--color-ps)', 'ps-tint': 'var(--color-ps-tint)', 'ps-light': 'var(--color-ps-tint)',
      },
      fontFamily: { display: ['var(--font-display)', 'sans-serif'], body: ['var(--font-body)', 'sans-serif'], mono: ['var(--font-mono)', 'monospace'] },
      borderRadius: { card: '18px', control: '12px' },
      boxShadow: {
        card: '0 10px 30px -20px rgba(0,0,0,.8), inset 0 1px rgba(255,255,255,.025)',
        'card-hover': '0 18px 44px -20px rgba(0,0,0,.9), 0 0 28px rgba(139,108,255,.12)',
      },
      keyframes: { 'pulse-dot': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.35' } } },
      animation: { 'pulse-dot': 'pulse-dot 1.8s ease-in-out infinite' },
    },
  },
  plugins: [],
};
export default config;
