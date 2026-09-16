import type { ClubPricing, ClubType } from '@/types/database';

type PricingWithType = ClubPricing & {
  club_type?: Pick<ClubType, 'id' | 'name' | 'slug'> | null;
};

export type PricingPlatform = 'pc' | 'playstation';

type PlatformStartingPrices = {
  pc: PricingWithType | null;
  playstation: PricingWithType | null;
};

type HourlyPriceRange = {
  min: number | null;
  max: number | null;
};

export function isHourlyPricing(item: Pick<PricingWithType, 'unit' | 'price_from'>) {
  const normalized = item.unit.trim().toLocaleLowerCase('az-AZ');
  return (normalized === 'saat' || normalized.endsWith('/saat'))
    && Number.isFinite(item.price_from)
    && item.price_from > 0;
}

export function getHourlyPricing(pricing: PricingWithType[], platform?: PricingPlatform) {
  return pricing.filter((item) => isHourlyPricing(item)
    && (!platform || item.club_type?.slug === platform));
}

export function getStartingPrice(pricing: PricingWithType[], platform?: PricingPlatform) {
  return [...getHourlyPricing(pricing, platform)]
    .sort((a, b) => a.price_from - b.price_from)[0] ?? null;
}

export function getPlatformStartingPrices(pricing: PricingWithType[]): PlatformStartingPrices {
  return {
    pc: getStartingPrice(pricing, 'pc'),
    playstation: getStartingPrice(pricing, 'playstation'),
  };
}

export function getHourlyPriceRange(pricing: PricingWithType[]): HourlyPriceRange {
  const values = getHourlyPricing(pricing)
    .flatMap((item) => [item.price_from, item.price_to])
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);

  if (values.length === 0) return { min: null, max: null };
  return { min: Math.min(...values), max: Math.max(...values) };
}
