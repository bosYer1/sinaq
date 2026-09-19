import type { Club } from '@/types/club';

export type ClubTypeSlug = 'pc' | 'playstation';

// Mirrors src/lib/clubType.ts: assignments, pricing, then conservative text fallback.
export function inferClubTypeSlugs(club: Pick<Club, 'name' | 'description' | 'type_assignments' | 'pricing'>): ClubTypeSlug[] {
  const explicit = new Set<ClubTypeSlug>();
  for (const relation of [...(club.type_assignments ?? []), ...(club.pricing ?? [])]) {
    const slug = relation.club_type?.slug;
    if (slug === 'pc') explicit.add('pc');
    if (slug === 'ps' || slug === 'playstation') explicit.add('playstation');
  }
  if (explicit.size) return [...explicit];
  const text = `${club.name} ${club.description ?? ''}`.toLocaleLowerCase('az');
  if (/\b(pc|cyber|internet|kompüter|computer)\b/i.test(text)) explicit.add('pc');
  if (/\b(playstation|ps4|ps5)\b/i.test(text)) explicit.add('playstation');
  return [...explicit];
}
