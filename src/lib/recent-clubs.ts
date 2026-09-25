export type RecentClub = {
  slug: string;
  name: string;
  district: string | null;
  viewedAt: number;
};

const RECENT_CLUBS_KEY = 'gameyer:recent-clubs-v1';
const RECENT_CLUB_LIMIT = 4;
const RECENT_CLUB_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function isRecentClub(value: unknown): value is RecentClub {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<RecentClub>;
  return typeof entry.slug === 'string'
    && entry.slug.trim().length > 0
    && typeof entry.name === 'string'
    && entry.name.trim().length > 0
    && (entry.district == null || typeof entry.district === 'string')
    && typeof entry.viewedAt === 'number'
    && Number.isFinite(entry.viewedAt);
}

export function readRecentClubs(now = Date.now()): RecentClub[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(RECENT_CLUBS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isRecentClub)
      .filter((entry) => now - entry.viewedAt <= RECENT_CLUB_MAX_AGE_MS)
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, RECENT_CLUB_LIMIT);
  } catch {
    return [];
  }
}

export function rememberRecentClub(club: Omit<RecentClub, 'viewedAt'>, now = Date.now()) {
  if (typeof window === 'undefined') return;

  const slug = club.slug.trim();
  const name = club.name.trim();
  if (!slug || !name) return;

  try {
    const existing = readRecentClubs(now);
    const next: RecentClub[] = [
      {
        slug,
        name,
        district: club.district?.trim() || null,
        viewedAt: now,
      },
      ...existing.filter((entry) => entry.slug !== slug),
    ].slice(0, RECENT_CLUB_LIMIT);

    window.localStorage.setItem(RECENT_CLUBS_KEY, JSON.stringify(next));
  } catch {
    // Browsing must keep working when local storage is unavailable.
  }
}
