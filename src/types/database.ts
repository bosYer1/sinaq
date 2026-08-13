/**
 * Supabase database sxeminə uyğun TypeScript tipləri.
 *
 * Bu fayl `supabase gen types typescript` əmri ilə avtomatik generasiya
 * oluna bilər (Supabase CLI qoşulanda). Hazırda network/CLI bağlantısı
 * olmadığı üçün 001_initial_schema.sql-a əsaslanaraq əl ilə yazılıb.
 * CLI qoşulan kimi bu faylı generasiya olunmuş versiya ilə əvəz etmək tövsiyə olunur.
 */

export interface Database {
  public: {
    Tables: {
      districts: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
      };
      club_types: {
        Row: {
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
        };
      };
      clubs: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          district_id: string;
          address: string;
          latitude: number | null;
          longitude: number | null;
          phone: string | null;
          instagram_url: string | null;
          rating_avg: number | null;
          rating_count: number;
          is_premium: boolean;
          premium_expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          district_id: string;
          address: string;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          instagram_url?: string | null;
          rating_avg?: number | null;
          rating_count?: number;
          is_premium?: boolean;
          premium_expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['clubs']['Insert']>;
      };
      club_pricing: {
        Row: {
          id: string;
          club_id: string;
          club_type_id: string;
          price_from: number;
          price_to: number | null;
          unit: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          club_type_id: string;
          price_from: number;
          price_to?: number | null;
          unit?: string;
        };
        Update: Partial<Database['public']['Tables']['club_pricing']['Insert']>;
      };
      club_opening_hours: {
        Row: {
          id: string;
          club_id: string;
          day_of_week: number;
          open_time: string | null;
          close_time: string | null;
          is_closed: boolean;
        };
        Insert: {
          id?: string;
          club_id: string;
          day_of_week: number;
          open_time?: string | null;
          close_time?: string | null;
          is_closed?: boolean;
        };
        Update: Partial<Database['public']['Tables']['club_opening_hours']['Insert']>;
      };
      club_images: {
        Row: {
          id: string;
          club_id: string;
          url: string;
          position: number;
          is_cover: boolean;
        };
        Insert: {
          id?: string;
          club_id: string;
          url: string;
          position?: number;
          is_cover?: boolean;
        };
        Update: Partial<Database['public']['Tables']['club_images']['Insert']>;
      };
    };
  };
}

// ---------------------------------------------------------------------------
// Tətbiq daxilində istifadə üçün əlverişli, "join" edilmiş tiplər.
// Bunlar cədvəl sətirlərinin birbaşa əksi deyil, sorğu nəticələrinin şəklidir.
// ---------------------------------------------------------------------------

export type District = Database['public']['Tables']['districts']['Row'];
export type ClubType = Database['public']['Tables']['club_types']['Row'];
export type ClubRow = Database['public']['Tables']['clubs']['Row'];
export type ClubPricing = Database['public']['Tables']['club_pricing']['Row'];
export type ClubOpeningHours = Database['public']['Tables']['club_opening_hours']['Row'];
export type ClubImage = Database['public']['Tables']['club_images']['Row'];

/** Klub siyahısı/xəritə üçün lazım olan bütün əlaqəli məlumatlarla klub. */
export interface ClubWithRelations extends ClubRow {
  district: Pick<District, 'id' | 'name' | 'slug'> | null;
  pricing: (ClubPricing & { club_type: Pick<ClubType, 'id' | 'name' | 'slug'> })[];
  images: Pick<ClubImage, 'id' | 'url' | 'is_cover' | 'position'>[];
  opening_hours: ClubOpeningHours[];
}

/** Ana səhifədə istifadə olunan filtr parametrləri (URL searchParams-dan gəlir). */
export interface ClubFilters {
  district?: string; // district slug
  type?: string; // club_type slug (pc | playstation)
  priceMax?: number; // AZN, price_from üzərindən süzgəc
  q?: string; // klub adı / ünvanına görə axtarış mətni
}

/** İstifadəçinin cari yerinə görə hesablanmış məsafə ilə zənginləşdirilmiş klub. */
export type ClubWithDistance = ClubWithRelations & { distanceKm: number | null };
