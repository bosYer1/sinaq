import type { ClubPricing, OpeningHours } from '@/types/club';

const DAY_NAMES = ['Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə', 'Bazar'];

function cleanTime(value: string | null) {
  return value?.slice(0, 5) ?? '';
}

export function formatPrice(pricing: ClubPricing) {
  const range = pricing.price_to && pricing.price_to !== pricing.price_from
    ? `${pricing.price_from}–${pricing.price_to}`
    : String(pricing.price_from);
  return `${pricing.club_type?.name ?? 'Qiymət'}: ${range} ₼/${pricing.unit}`;
}

export function formatHours(hours: OpeningHours) {
  const day = DAY_NAMES[hours.day_of_week] ?? `Gün ${hours.day_of_week + 1}`;
  if (hours.is_closed) return `${day}: bağlıdır`;
  if (!hours.open_time || !hours.close_time) return `${day}: saat göstərilməyib`;
  return `${day}: ${cleanTime(hours.open_time)}–${cleanTime(hours.close_time)}`;
}
