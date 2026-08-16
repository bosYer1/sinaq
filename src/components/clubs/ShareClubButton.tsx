'use client';

import { useState } from 'react';

interface ShareClubButtonProps {
  name: string;
  url: string;
}

export function ShareClubButton({ name, url }: ShareClubButtonProps) {
  const [copied, setCopied] = useState(false);

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

      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Klub linki paylaşılmadı:', error);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex h-10 items-center justify-center rounded-control border border-border bg-surface px-4 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
      aria-live="polite"
    >
      {copied ? 'Link kopyalandı' : 'Klubu paylaş'}
    </button>
  );
}
