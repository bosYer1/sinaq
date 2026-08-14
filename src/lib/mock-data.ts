import type { ClubType, District, ClubWithRelations } from '@/types/database';

/**
 * Development üçün mock data.
 *
 * YALNIZ Supabase konfiqurasiyası (env dəyərləri) olmadıqda istifadə olunur —
 * bax `src/lib/config.ts` (`isSupabaseConfigured`). Real Supabase layihəsi
 * qoşulan kimi bu fayl artıq işə düşmür, `src/lib/queries/*` avtomatik olaraq
 * real cədvəllərdən oxumağa keçir. Sxem `src/types/database.ts`-də təsvir
 * olunan strukturla eynidir ki, keçid şəffaf olsun.
 */

export const MOCK_DISTRICTS: District[] = [
  { id: 'd-yasamal', name: 'Yasamal', slug: 'yasamal', created_at: '2024-01-01T00:00:00Z' },
  { id: 'd-nesimi', name: 'Nəsimi', slug: 'nesimi', created_at: '2024-01-01T00:00:00Z' },
  { id: 'd-narimanov', name: 'Nərimanov', slug: 'narimanov', created_at: '2024-01-01T00:00:00Z' },
  { id: 'd-xetai', name: 'Xətai', slug: 'xetai', created_at: '2024-01-01T00:00:00Z' },
  { id: 'd-sebail', name: 'Səbail', slug: 'sebail', created_at: '2024-01-01T00:00:00Z' },
  { id: 'd-nizami', name: 'Nizami', slug: 'nizami', created_at: '2024-01-01T00:00:00Z' },
];

export const MOCK_CLUB_TYPES: ClubType[] = [
  { id: 'ct-pc', name: 'PC', slug: 'pc' },
  { id: 'ct-ps', name: 'PlayStation', slug: 'playstation' },
];

function district(slug: string): District {
  return MOCK_DISTRICTS.find((d) => d.slug === slug)!;
}

function clubType(slug: string): ClubType {
  return MOCK_CLUB_TYPES.find((t) => t.slug === slug)!;
}

const FULL_WEEK_HOURS = (open = '10:00', close = '02:00') =>
  Array.from({ length: 7 }, (_, day) => ({
    id: `oh-${day}`,
    club_id: '',
    day_of_week: day,
    open_time: open,
    close_time: close,
    is_closed: false,
  }));

interface MockClubInput {
  id: string;
  name: string;
  slug: string;
  description: string;
  districtSlug: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  instagram: string;
  ratingAvg: number | null;
  ratingCount: number;
  isPremium: boolean;
  types: ('pc' | 'playstation')[];
  priceFrom: Record<string, number>;
  hours?: { open: string; close: string };
}

function buildClub(input: MockClubInput): ClubWithRelations {
  const hours = FULL_WEEK_HOURS(input.hours?.open, input.hours?.close).map((h) => ({ ...h, club_id: input.id }));

  return {
    id: input.id,
    name: input.name,
    slug: input.slug,
    description: input.description,
    district_id: district(input.districtSlug).id,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    phone: input.phone,
    instagram_url: input.instagram,
    rating_avg: input.ratingAvg,
    rating_count: input.ratingCount,
    is_premium: input.isPremium,
    premium_expires_at: input.isPremium ? '2026-12-31T00:00:00Z' : null,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    district: district(input.districtSlug),
    type_assignments: input.types.map((typeSlug) => ({
      club_type_id: clubType(typeSlug).id,
      club_type: clubType(typeSlug),
    })),
    pricing: input.types.map((typeSlug) => ({
      id: `${input.id}-price-${typeSlug}`,
      club_id: input.id,
      club_type_id: clubType(typeSlug).id,
      price_from: input.priceFrom[typeSlug],
      price_to: input.priceFrom[typeSlug] + 5,
      unit: 'saat',
      club_type: clubType(typeSlug),
    })),
    images: [],
    opening_hours: hours,
  };
}

export const MOCK_CLUBS: ClubWithRelations[] = [
  buildClub({
    id: 'c1',
    name: 'CyberZone Yasamal',
    slug: 'cyberzone-yasamal',
    description: 'Yüksək performanslı PC-lər və rahat gaming kresloları ilə 24 saat açıq klub.',
    districtSlug: 'yasamal',
    address: 'Yasamal r., Aİ. Əliyev küç. 14',
    latitude: 40.3891,
    longitude: 49.8347,
    phone: '+994501234567',
    instagram: 'https://instagram.com/cyberzone.yasamal',
    ratingAvg: 4.7,
    ratingCount: 128,
    isPremium: true,
    types: ['pc', 'playstation'],
    priceFrom: { pc: 4, playstation: 6 },
    hours: { open: '00:00', close: '23:59' },
  }),
  buildClub({
    id: 'c2',
    name: 'GameHub Nəsimi',
    slug: 'gamehub-nesimi',
    description: 'Mərkəzdə yerləşən, RTX kartlı PC-lərlə təchiz olunmuş müasir klub.',
    districtSlug: 'nesimi',
    address: 'Nəsimi r., Rəsul Rza küç. 5',
    latitude: 40.3773,
    longitude: 49.8465,
    phone: '+994557654321',
    instagram: 'https://instagram.com/gamehub.nesimi',
    ratingAvg: 4.4,
    ratingCount: 76,
    isPremium: false,
    types: ['pc'],
    priceFrom: { pc: 5 },
  }),
  buildClub({
    id: 'c3',
    name: 'PS Lounge Nərimanov',
    slug: 'ps-lounge-narimanov',
    description: 'PS5 konsolları, böyük ekranlar və rahat divanlarla ailəvi/dostlar üçün ideal məkan.',
    districtSlug: 'narimanov',
    address: 'Nərimanov r., Ə. Naxçıvani küç. 22',
    latitude: 40.4106,
    longitude: 49.8592,
    phone: '+994709876543',
    instagram: 'https://instagram.com/pslounge.baku',
    ratingAvg: 4.9,
    ratingCount: 203,
    isPremium: true,
    types: ['playstation'],
    priceFrom: { playstation: 7 },
  }),
  buildClub({
    id: 'c4',
    name: 'Elite Gaming Xətai',
    slug: 'elite-gaming-xetai',
    description: 'Həm PC, həm PlayStation seksiyaları olan geniş klub, turnir otağı ilə.',
    districtSlug: 'xetai',
    address: 'Xətai r., H. Zərdabi pr. 88',
    latitude: 40.3958,
    longitude: 49.9187,
    phone: '+994512345678',
    instagram: 'https://instagram.com/elitegaming.xetai',
    ratingAvg: 4.2,
    ratingCount: 54,
    isPremium: false,
    types: ['pc', 'playstation'],
    priceFrom: { pc: 3.5, playstation: 5 },
  }),
  buildClub({
    id: 'c5',
    name: 'Nova PC Club Səbail',
    slug: 'nova-pc-club-sebail',
    description: 'Şəhər mərkəzində, sərnişin yolu üzərində rahat çatım — sürətli internet, sakit mühit.',
    districtSlug: 'sebail',
    address: 'Səbail r., Neftçilər pr. 3',
    latitude: 40.3701,
    longitude: 49.8355,
    phone: '+994503219876',
    instagram: 'https://instagram.com/novapc.baku',
    ratingAvg: 4.0,
    ratingCount: 31,
    isPremium: false,
    types: ['pc'],
    priceFrom: { pc: 4.5 },
  }),
  buildClub({
    id: 'c6',
    name: 'Retro & PS Nizami',
    slug: 'retro-ps-nizami',
    description: 'PS4/PS5 və klassik konsol oyunları — retro atmosferli kiçik, isti klub.',
    districtSlug: 'nizami',
    address: 'Nizami r., Ü. Hacıbəyov küç. 45',
    latitude: 40.3742,
    longitude: 49.8654,
    phone: '+994704567890',
    instagram: 'https://instagram.com/retrops.nizami',
    ratingAvg: 3.8,
    ratingCount: 19,
    isPremium: false,
    types: ['playstation'],
    priceFrom: { playstation: 4 },
  }),
  buildClub({
    id: 'c7',
    name: 'Titan Gaming Yasamal',
    slug: 'titan-gaming-yasamal',
    description: '240Hz monitorlar və mexaniki klaviaturalarla e-idman həvəskarları üçün klub.',
    districtSlug: 'yasamal',
    address: 'Yasamal r., Cavadxan küç. 33',
    latitude: 40.4012,
    longitude: 49.8221,
    phone: '+994557891234',
    instagram: 'https://instagram.com/titangaming.baku',
    ratingAvg: null,
    ratingCount: 0,
    isPremium: false,
    types: ['pc'],
    priceFrom: { pc: 6 },
  }),
];
