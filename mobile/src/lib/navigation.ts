import { router } from 'expo-router';
import { validClubSlug } from '@/lib/clubs';

const DUPLICATE_NAVIGATION_WINDOW_MS = 700;
let lastNavigation: { slug: string; at: number } | null = null;

export function shouldNavigateToClub(slug: string, now = Date.now()) {
  if (!validClubSlug(slug)) return false;
  if (lastNavigation?.slug === slug && now - lastNavigation.at < DUPLICATE_NAVIGATION_WINDOW_MS) return false;
  lastNavigation = { slug, at: now };
  return true;
}

export function openClub(slug: string) {
  if (!shouldNavigateToClub(slug)) return;
  router.push({ pathname: '/club/[slug]', params: { slug } });
}

export function resetNavigationGuard() {
  lastNavigation = null;
}
