import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind class-larını təhlükəsiz birləşdirmək üçün helper (conflict-ləri həll edir). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatPriceValue(value: number): string {
  return new Intl.NumberFormat('az-AZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/** AZN qiymət aralığını qəpiklik dəqiqliyi itirmədən formatlayır. */
export function formatPriceRange(priceFrom: number, priceTo: number | null, unit: string): string {
  const from = formatPriceValue(priceFrom);
  if (priceTo != null && priceTo !== priceFrom) {
    return `${from}–${formatPriceValue(priceTo)} AZN / ${unit}`;
  }
  return `${from} AZN / ${unit}`;
}

/** Verilmiş mətndən URL-uyğun slug yaradır (Azərbaycan hərfləri daxil). */
export function slugify(input: string): string {
  const map: Record<string, string> = {
    ə: 'e',
    ı: 'i',
    ö: 'o',
    ü: 'u',
    ş: 's',
    ç: 'c',
    ğ: 'g',
    Ə: 'e',
    I: 'i',
    İ: 'i',
    Ö: 'o',
    Ü: 'u',
    Ş: 's',
    Ç: 'c',
    Ğ: 'g',
  };
  return input
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Premium yalnız flag aktiv və bitmə tarixi gələcəkdədirsə public UI-da aktiv sayılır. */
export function isPremiumActive(club: {
  is_premium: boolean;
  premium_expires_at: string | null;
}): boolean {
  if (!club.is_premium || !club.premium_expires_at) return false;
  const expiresAt = Date.parse(club.premium_expires_at);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export const DAY_NAMES_AZ = [
  'Bazar ertəsi',
  'Çərşənbə axşamı',
  'Çərşənbə',
  'Cümə axşamı',
  'Cümə',
  'Şənbə',
  'Bazar',
] as const;

export const DAY_NAMES_SHORT_AZ = ['B.e', 'Ç.a', 'Çər', 'C.a', 'Cümə', 'Şən', 'Baz'] as const;

const BAKU_TIME_ZONE = 'Asia/Baku';
const BAKU_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: BAKU_TIME_ZONE,
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const WEEKDAY_TO_SCHEMA_DAY: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

export function isClubOpenNow(
  openingHours: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>,
  now = new Date()
): boolean {
  if (!openingHours.length) return false;

  const parts = BAKU_DATE_TIME_FORMATTER.formatToParts(now);
  const weekday = parts.find((part) => part.type === 'weekday')?.value;
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
  const dayOfWeek = weekday ? WEEKDAY_TO_SCHEMA_DAY[weekday] : undefined;
  if (dayOfWeek == null) return false;

  const today = openingHours.find((hours) => hours.day_of_week === dayOfWeek);
  if (!today || today.is_closed || !today.open_time || !today.close_time) return false;

  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const currentMinutes = hour * 60 + minute;
  const openMinutes = toMinutes(today.open_time);
  const closeMinutes = toMinutes(today.close_time);

  if (closeMinutes > openMinutes) {
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }

  return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
}

export function formatTime(value: string | null): string {
  return value ? value.slice(0, 5) : '—';
}
