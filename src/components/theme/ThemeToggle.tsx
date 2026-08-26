'use client';

import { useSyncExternalStore } from 'react';

type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'gameyer-theme';
const CHANGE_EVENT = 'gameyer-theme-change';
const ORDER: ThemePreference[] = ['system', 'light', 'dark'];

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

function getPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isThemePreference(stored) ? stored : 'system';
}

function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference !== 'system') return preference;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  root.dataset.themePreference = preference;
  root.dataset.theme = resolveTheme(preference);
}

function subscribe(callback: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onPreferenceChange = () => callback();
  const onSystemThemeChange = () => {
    if (getPreference() === 'system') applyTheme('system');
    callback();
  };

  window.addEventListener(CHANGE_EVENT, onPreferenceChange);
  media.addEventListener('change', onSystemThemeChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onPreferenceChange);
    media.removeEventListener('change', onSystemThemeChange);
  };
}

export function ThemeToggle() {
  const preference = useSyncExternalStore(subscribe, getPreference, () => 'system');
  const nextPreference = ORDER[(ORDER.indexOf(preference) + 1) % ORDER.length];
  const label = preference === 'system' ? 'Sistem' : preference === 'dark' ? 'Tünd' : 'Açıq';
  const nextLabel = nextPreference === 'system' ? 'sistem' : nextPreference === 'dark' ? 'tünd' : 'açıq';

  const cycleTheme = () => {
    window.localStorage.setItem(STORAGE_KEY, nextPreference);
    applyTheme(nextPreference);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted transition hover:border-primary hover:bg-surface-hover hover:text-primary"
      aria-label={`Tema: ${label}. ${nextLabel} rejimə keç`}
      title={`Tema: ${label}`}
    >
      {preference === 'system' ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        </svg>
      ) : preference === 'dark' ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.5 14.2A8 8 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
        </svg>
      )}
      <span className="sr-only">{label} tema</span>
    </button>
  );
}
