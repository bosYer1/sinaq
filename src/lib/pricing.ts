import type { ClubPricing, ClubType } from '@/types/database';

type PricingWithType = ClubPricing & {
  club_type?: Pick<ClubType, 'id' | 'name' | 'slug'> | null;
};

type PlatformStartingPrices = {
  pc: PricingWithType | null;
  playstation: PricingWithType | null;
};

function cheapestFor(pricing: PricingWithType[], slug: 'pc' | 'playstation') {
  return pricing
    .filter((item) => item.club_type?.slug === slug && Number.isFinite(item.price_from) && item.price_from > 0)
    .sort((a, b) => a.price_from - b.price_from)[0] ?? null;
}

export function getPlatformStartingPrices(pricing: PricingWithType[]): PlatformStartingPrices {
  return {
    pc: cheapestFor(pricing, 'pc'),
    playstation: cheapestFor(pricing, 'playstation'),
  };
}
