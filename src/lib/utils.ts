import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind class-larını təhlükəsiz birləşdirmək üçün helper (conflict-ləri həll edir). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** AZN qiymət aralığını formatlayır: "10 AZN" və ya "10–15 AZN". */
export function formatPriceRange(priceFrom: number, priceTo: number | null, unit: string): string {
  const from = Math.round(priceFrom);
  if (priceTo && priceTo !== priceFrom) {
    return `${from}–${Math.round(priceTo)} AZN / ${unit}`;
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

/**
 * Hazırkı vaxta görə klubun açıq olub-olmadığını hesablayır.
 * `openingHours` — həmin klubun bütün həftə sətirləri (club_opening_hours).
 */
export function isClubOpenNow(
  openingHours: { day_of_week: number; open_time: string | null; close_time: string | null; is_closed: boolean }[],
): boolean {
  if (!openingHours || openingHours.length === 0) return false;

  const now = new Date();
  // JS-də getDay(): 0=Bazar ... 6=Şənbə. Bizim sxemdə 0=Bazar ertəsi ... 6=Bazar.
  const jsDay = now.getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

  const today = openingHours.find((h) => h.day_of_week === dayOfWeek);
  if (!today || today.is_closed || !today.open_time || !today.close_time) return false;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = today.open_time.split(':').map(Number);
  const [closeH, closeM] = today.close_time.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  // Gecə yarısını keçən iş saatları (məs. 10:00–02:00) üçün də düzgün işləsin.
  if (closeMinutes <= openMinutes) {
    return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
  }
  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}

/** "10:00" formatındakı vaxtı "10:00"-a saxlayır, saniyə hissəsi varsa təmizləyir. */
export function formatTime(time: string | null): string {
  if (!time) return '—';
  return time.slice(0, 5);
}
