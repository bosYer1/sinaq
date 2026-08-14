export type ClubTypeSlug = 'pc' | 'playstation';

type TypeSourceClub = {
  name: string;
  description: string | null;
  pricing: Array<{
    club_type: { slug: string };
  }>;
  type_assignments?: Array<{
    club_type: { slug: string };
  }>;
};

/**
 * Klub tipi üçün əsas mənbə club_type_assignments cədvəlidir.
 * Köhnə/uyğunluq hallarında real pricing rows ikinci mənbədir.
 * Heç biri yoxdursa yalnız ad + description mətnindən konservativ fallback edilir.
 */
export function inferClubTypeSlugs(club: TypeSourceClub): ClubTypeSlug[] {
  const explicit = new Set<ClubTypeSlug>();

  for (const assignment of club.type_assignments ?? []) {
    const slug = assignment.club_type?.slug;
    if (slug === 'pc') explicit.add('pc');
    if (slug === 'playstation' || slug === 'ps') explicit.add('playstation');
  }

  for (const pricing of club.pricing ?? []) {
    const slug = pricing.club_type?.slug;
    if (slug === 'pc') explicit.add('pc');
    if (slug === 'playstation' || slug === 'ps') explicit.add('playstation');
  }

  if (explicit.size > 0) return [...explicit];

  const haystack = `${club.name} ${club.description ?? ''}`.toLocaleLowerCase('az');
  const inferred = new Set<ClubTypeSlug>();

  if (/\b(pc|cyber|internet|kompüter|computer)\b/i.test(haystack)) {
    inferred.add('pc');
  }

  if (/\b(playstation|ps4|ps5)\b/i.test(haystack)) {
    inferred.add('playstation');
  }

  return [...inferred];
}
