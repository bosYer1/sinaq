'use client';

import { useState } from 'react';

interface ShareClubButtonProps {
  name: string;
  url: string;
}

type ShareStatus = 'idle' | 'copied' | 'error';

export function ShareClubButton({ name, url }: ShareClubButtonProps) {
  const [status, setStatus] = useState<ShareStatus>('idle');

  function resetStatus() {
    window.setTimeout(() => setStatus('idle'), 1800);
  }

  function legacyCopy(value: string) {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  }

  async function copyUrl() {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }

    return legacyCopy(url);
  }

  async function handleShare() {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `${name} | GameYer`,
          text: `${name} klub məlumatlarına GameYer-də bax.`,
          url,
        });
        return;
      }

      const copied = await copyUrl();
      setStatus(copied ? 'copied' : 'error');
      resetStatus();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Klub linki paylaşılmadı:', error);
      setStatus('error');
      resetStatus();
    }
  }

  const label = status === 'copied'
    ? 'Link kopyalandı'
    : status === 'error'
      ? 'Kopyalama alınmadı'
      : 'Klubu paylaş';

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex h-10 items-center justify-center rounded-control border border-border bg-surface px-4 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
      aria-live="polite"
    >
      {label}
    </button>
  );
}
