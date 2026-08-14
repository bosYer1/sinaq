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

type OpeningHour = {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
};

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Hazırkı vaxta görə klubun açıq olub-olmadığını hesablayır.
 * `openingHours` — həmin klubun bütün həftə sətirləri (club_opening_hours).
 *
 * Gecə yarısını keçən qrafikdə (məs. Cümə 18:00–02:00) şənbə 01:00
 * hələ cümə növbəsinin davamıdır. Ona görə həm bugünkü növbə, həm də
 * əvvəlki günün gecə yarısını keçən növbəsi yoxlanılır.
 */
export function isClubOpenNow(openingHours: OpeningHour[]): boolean {
  if (!openingHours || openingHours.length === 0) return false;

  const now = new Date();
  // JS-də getDay(): 0=Bazar ... 6=Şənbə. Bizim sxemdə 0=Bazar ertəsi ... 6=Bazar.
  const jsDay = now.getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
  const previousDay = (dayOfWeek + 6) % 7;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const today = openingHours.find((h) => h.day_of_week === dayOfWeek);
  if (today && !today.is_closed && today.open_time && today.close_time) {
    const openMinutes = timeToMinutes(today.open_time);
    const closeMinutes = timeToMinutes(today.close_time);

    if (closeMinutes > openMinutes) {
      if (nowMinutes >= openMinutes && nowMinutes < closeMinutes) return true;
    } else if (nowMinutes >= openMinutes) {
      // Bugünkü növbə gecə yarısını keçir və hələ gecə yarısına çatmamışıq.
      return true;
    }
  }

  const previous = openingHours.find((h) => h.day_of_week === previousDay);
  if (previous && !previous.is_closed && previous.open_time && previous.close_time) {
    const previousOpen = timeToMinutes(previous.open_time);
    const previousClose = timeToMinutes(previous.close_time);

    // Yalnız gecə yarısını keçən əvvəlki növbə cari günün erkən saatlarına daşına bilər.
    if (previousClose <= previousOpen && nowMinutes < previousClose) {
      return true;
    }
  }

  return false;
}

/** "10:00" formatındakı vaxtı "10:00"-a saxlayır, saniyə hissəsi varsa təmizləyir. */
export function formatTime(time: string | null): string {
  if (!time) return '—';
  return time.slice(0, 5);
}
