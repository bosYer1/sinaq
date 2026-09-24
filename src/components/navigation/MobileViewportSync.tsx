'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const MOBILE_VIEWPORT_HEIGHT_VAR = '--gameyer-mobile-vh';

export function MobileViewportSync() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const visualViewport = window.visualViewport;
    let frame = 0;
    const settleTimers = new Set<number>();

    const clearTimers = () => {
      for (const timer of settleTimers) window.clearTimeout(timer);
      settleTimers.clear();
    };

    const syncHeight = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const height = visualViewport?.height ?? window.innerHeight;
        if (Number.isFinite(height) && height > 0) {
          root.style.setProperty(MOBILE_VIEWPORT_HEIGHT_VAR, `${height}px`);
        }
      });
    };

    const settleHeight = () => {
      clearTimers();
      syncHeight();
      for (const delay of [50, 150, 300]) {
        const timer = window.setTimeout(() => {
          settleTimers.delete(timer);
          syncHeight();
        }, delay);
        settleTimers.add(timer);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') settleHeight();
    };

    settleHeight();
    visualViewport?.addEventListener('resize', settleHeight);
    window.addEventListener('resize', settleHeight);
    window.addEventListener('orientationchange', settleHeight);
    window.addEventListener('pageshow', settleHeight);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.cancelAnimationFrame(frame);
      clearTimers();
      visualViewport?.removeEventListener('resize', settleHeight);
      window.removeEventListener('resize', settleHeight);
      window.removeEventListener('orientationchange', settleHeight);
      window.removeEventListener('pageshow', settleHeight);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname]);

  return null;
}
