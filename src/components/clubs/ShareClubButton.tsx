'use client';

import { useState } from 'react';
import { trackPostHogEvent } from '@/lib/posthog';

interface ShareClubButtonProps {
  name: string;
  url: string;
}

type ShareStatus = 'idle' | 'copied' | 'error';
type ShareMethod = 'native' | 'copy';

const SHARE_ATTRIBUTION = {
  utm_source: 'gameyer_share',
  utm_medium: 'referral',
  utm_campaign: 'club_share',
} as const;

function buildAttributedShareUrl(value: string) {
  try {
    const attributedUrl = new URL(value, window.location.origin);
    attributedUrl.search = '';
    attributedUrl.hash = '';

    for (const [key, parameter] of Object.entries(SHARE_ATTRIBUTION)) {
      attributedUrl.searchParams.set(key, parameter);
    }

    return attributedUrl.toString();
  } catch {
    return value;
  }
}

export function ShareClubButton({ name, url }: ShareClubButtonProps) {
  const [status, setStatus] = useState<ShareStatus>('idle');

  function resetStatus() {
    window.setTimeout(() => setStatus('idle'), 1800);
  }

  function trackSuccessfulShare(method: ShareMethod) {
    let clubPath = url;
    try {
      clubPath = new URL(url, window.location.origin).pathname;
    } catch {
      // Keep the supplied path if URL parsing is unavailable.
    }

    trackPostHogEvent('club_share', {
      method,
      club_path: clubPath,
    });
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

  async function copyUrl(value: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }

    return legacyCopy(value);
  }

  async function handleShare() {
    try {
      const shareUrl = buildAttributedShareUrl(url);

      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `${name} | GameYer`,
          text: `${name} klub məlumatlarına GameYer-də bax.`,
          url: shareUrl,
        });
        trackSuccessfulShare('native');
        return;
      }

      const copied = await copyUrl(shareUrl);
      if (copied) trackSuccessfulShare('copy');
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
