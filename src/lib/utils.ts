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

function getBakuDayAndMinutes(date = new Date()) {
  const parts = BAKU_DATE_TIME_FORMATTER.formatToParts(date);
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Mon';
  const hours = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minutes = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);

  return {
    dayOfWeek: WEEKDAY_TO_SCHEMA_DAY[weekday] ?? 0,
    nowMinutes: hours * 60 + minutes,
  };
}

/**
 * Bakı vaxtına görə klubun hazırda açıq olub-olmadığını hesablayır.
 * `openingHours` — həmin klubun bütün həftə sətirləri (club_opening_hours).
 *
 * Eyni açılış və bağlanış saatı (məs. 00:00–00:00) 24 saat açıq qrafik
 * kimi qəbul edilir. Gecə yarısını keçən qrafikdə (məs. Cümə 18:00–02:00)
 * şənbə 01:00 hələ cümə növbəsinin davamıdır.
 */
export function isClubOpenNow(openingHours: OpeningHour[]): boolean {
  if (!openingHours || openingHours.length === 0) return false;

  const { dayOfWeek, nowMinutes } = getBakuDayAndMinutes();
  const previousDay = (dayOfWeek + 6) % 7;

  const today = openingHours.find((h) => h.day_of_week === dayOfWeek);
  if (today && !today.is_closed && today.open_time && today.close_time) {
    const openMinutes = timeToMinutes(today.open_time);
    const closeMinutes = timeToMinutes(today.close_time);

    // Admin panelində 00:00–00:00 kimi saxlanılan qrafik 24/7 deməkdir.
    if (closeMinutes === openMinutes) return true;

    if (closeMinutes > openMinutes) {
      if (nowMinutes >= openMinutes && nowMinutes < closeMinutes) return true;
    } else if (nowMinutes >= openMinutes) {
      return true;
    }
  }

  const previous = openingHours.find((h) => h.day_of_week === previousDay);
  if (previous && !previous.is_closed && previous.open_time && previous.close_time) {
    const previousOpen = timeToMinutes(previous.open_time);
    const previousClose = timeToMinutes(previous.close_time);

    if (previousClose < previousOpen && nowMinutes < previousClose) {
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
