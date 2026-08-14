import type { ClubWithRelations } from '@/types/database';

export type ClubTypeSlug = 'pc' | 'playstation';

/**
 * Klub tipi üçün əsas mənbə real pricing rows-dur.
 * Pricing hələ daxil edilməyibsə yalnız ad + description mətnindən konservativ fallback edirik.
 * Bu fallback qiymət uydurmur; sadəcə filtr/badge üçün tip siqnalıdır.
 */
export function inferClubTypeSlugs(club: Pick<ClubWithRelations, 'name' | 'description' | 'pricing'>): ClubTypeSlug[] {
  const explicit = new Set<ClubTypeSlug>();

  for (const pricing of club.pricing) {
    if (pricing.club_type.slug === 'pc') explicit.add('pc');
    if (pricing.club_type.slug === 'playstation' || pricing.club_type.slug === 'ps') {
      explicit.add('playstation');
    }
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
