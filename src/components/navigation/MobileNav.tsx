'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getMobileNavDocumentTop, getRealLayoutMaxScrollTop, isIOSWebKit, isPhantomBottomScroll } from '@/lib/mobileViewport';

const baseClass = 'flex flex-col items-center justify-center gap-1 text-[10px] transition';
const activeClass = 'font-semibold text-primary';
const inactiveClass = 'font-medium text-muted';

function navClass(active: boolean) {
  return `${baseClass} ${active ? activeClass : inactiveClass}`;
}

export function MobileNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const visualViewport = window.visualViewport;
    const iosWebKit = isIOSWebKit(
      window.navigator.userAgent,
      window.navigator.platform,
      window.navigator.maxTouchPoints,
    );

    if (!iosWebKit || !visualViewport) {
      nav.style.position = '';
      nav.style.top = '';
      nav.style.bottom = '';
      nav.style.visibility = '';
      delete nav.dataset.iosViewportMode;
      return;
    }

    nav.dataset.iosViewportMode = 'absolute';

    let frame = 0;
    let editableFocusSeen = false;
    let keyboardPollTimer = 0;
    let keyboardReleaseTimer = 0;
    const settleTimers = new Set<number>();

    const clearSettleTimers = () => {
      for (const timer of settleTimers) window.clearTimeout(timer);
      settleTimers.clear();
    };

    const isEditableElement = (target: EventTarget | null) => (
      target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || (target instanceof HTMLElement && target.isContentEditable)
    );

    const isEditableFocused = () => isEditableElement(document.activeElement);

    const getRealContentBottom = () => {
      const sentinel = document.querySelector<HTMLElement>('[data-mobile-content-end="true"]');
      if (!sentinel) return null;
      return window.scrollY + sentinel.getBoundingClientRect().top;
    };

    const syncNav = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const editableFocused = isEditableFocused();
        nav.style.position = 'absolute';
        nav.style.bottom = 'auto';

        if (editableFocused) {
          editableFocusSeen = true;
          nav.style.visibility = 'hidden';

          if (keyboardReleaseTimer) {
            window.clearTimeout(keyboardReleaseTimer);
            keyboardReleaseTimer = 0;
          }
          if (!keyboardPollTimer) {
            keyboardPollTimer = window.setTimeout(() => {
              keyboardPollTimer = 0;
              syncNav();
            }, 100);
          }
          return;
        }

        if (editableFocusSeen) {
          nav.style.visibility = 'hidden';
          if (!keyboardReleaseTimer) {
            keyboardReleaseTimer = window.setTimeout(() => {
              keyboardReleaseTimer = 0;
              editableFocusSeen = false;
              settleViewport();
            }, 500);
          }
          return;
        }

        const contentBottom = getRealContentBottom();
        if (contentBottom != null) {
          const maxLayoutScrollTop = getRealLayoutMaxScrollTop(
            contentBottom,
            visualViewport.offsetTop,
            visualViewport.height,
          );
          if (isPhantomBottomScroll(window.scrollY, maxLayoutScrollTop)) {
            window.scrollTo({ top: maxLayoutScrollTop, left: 0, behavior: 'auto' });
            nav.style.visibility = 'hidden';
            window.requestAnimationFrame(syncNav);
            return;
          }
        }

        const top = getMobileNavDocumentTop(
          visualViewport.pageTop,
          visualViewport.height,
          nav.offsetHeight,
        );
        nav.style.top = `${top}px`;
        nav.style.visibility = 'visible';
      });
    };

    const settleViewport = () => {
      clearSettleTimers();
      syncNav();
      for (const delay of [50, 150, 300]) {
        const timer = window.setTimeout(() => {
          settleTimers.delete(timer);
          syncNav();
        }, delay);
        settleTimers.add(timer);
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (!isEditableElement(event.target)) return;
      syncNav();
    };

    const handleFocusOut = (event: FocusEvent) => {
      if (!isEditableElement(event.target)) return;
      syncNav();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') settleViewport();
    };

    settleViewport();
    visualViewport.addEventListener('resize', settleViewport);
    visualViewport.addEventListener('scroll', syncNav);
    window.addEventListener('scroll', syncNav, { passive: true });
    window.addEventListener('resize', settleViewport);
    window.addEventListener('orientationchange', settleViewport);
    window.addEventListener('pageshow', settleViewport);
    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('focusout', handleFocusOut, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.cancelAnimationFrame(frame);
      clearSettleTimers();
      if (keyboardPollTimer) window.clearTimeout(keyboardPollTimer);
      if (keyboardReleaseTimer) window.clearTimeout(keyboardReleaseTimer);
      visualViewport.removeEventListener('resize', settleViewport);
      visualViewport.removeEventListener('scroll', syncNav);
      window.removeEventListener('scroll', syncNav);
      window.removeEventListener('resize', settleViewport);
      window.removeEventListener('orientationchange', settleViewport);
      window.removeEventListener('pageshow', settleViewport);
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('focusout', handleFocusOut, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      nav.style.position = '';
      nav.style.top = '';
      nav.style.bottom = '';
      nav.style.visibility = '';
      delete nav.dataset.iosViewportMode;
    };
  }, [pathname]);
  const clubsActive = pathname === '/';
  const districtsActive = pathname === '/rayon' || pathname.startsWith('/rayon/');
  const updatesActive = pathname === '/yenilikler' || pathname.startsWith('/yenilikler/');
  const menuActive = pathname === '/menyu';

  return (
    <nav
      ref={navRef}
      className="fixed inset-x-0 bottom-0 z-40 grid min-h-[68px] grid-cols-5 border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(31,35,48,0.06)] md:hidden"
      aria-label="Mobil naviqasiya"
    >
      <Link href="/" className={navClass(clubsActive)}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7.5 8h9a4 4 0 0 1 3.7 5.5l-1.3 3.2a2 2 0 0 1-3.2.7L14 16h-4l-1.7 1.4a2 2 0 0 1-3.2-.7l-1.3-3.2A4 4 0 0 1 7.5 8Z" />
          <path d="M8 11v4M6 13h4M16.5 12h.01M18 14h.01" />
        </svg>
        <span>Klublar</span>
      </Link>

      <Link href="/rayon" className={navClass(districtsActive)}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3.5 6.5 5-2 7 2 5-2v13l-5 2-7-2-5 2v-13Z" />
          <path d="M8.5 4.5v13M15.5 6.5v13" />
          <path d="M12 8.2a2.4 2.4 0 0 1 2.4 2.4c0 1.8-2.4 4.3-2.4 4.3s-2.4-2.5-2.4-4.3A2.4 2.4 0 0 1 12 8.2Z" />
          <circle cx="12" cy="10.6" r=".7" />
        </svg>
        <span>Rayonlar</span>
      </Link>

      <Link href="/#club-search" className="flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-primary transition">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-[0_5px_16px_rgba(124,92,252,0.3)]">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="6" />
            <path d="m16 16 4 4" />
          </svg>
        </span>
        <span>Axtar</span>
      </Link>

      <Link href="/yenilikler" className={navClass(updatesActive)}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
        <span>Yeniliklər</span>
      </Link>

      <Link href="/menyu" className={navClass(menuActive)}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        <span>Menyu</span>
      </Link>
    </nav>
  );
}
