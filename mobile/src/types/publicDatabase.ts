import type { Club, ClubImage, ClubPricing, ClubType, District, OpeningHours } from './club';

type ReadTable<Row> = { Row: Row; Insert: never; Update: never; Relationships: [] };
type ClubRow = Omit<Club, 'district' | 'type_assignments' | 'pricing' | 'images' | 'opening_hours'> & {
  district_id: string;
  is_active: boolean;
  created_at: string;
  rating_avg: number | null;
  rating_count: number;
};

// Public read surface only. Admin/submission tables and RPCs are intentionally absent.
// Row columns mirror src/types/database.ts; nested select results are typed as Club.
export type PublicDatabase = {
  public: {
    Tables: {
      clubs: ReadTable<ClubRow>;
      districts: ReadTable<District & { created_at: string }>;
      club_types: ReadTable<ClubType>;
      club_type_assignments: ReadTable<{ club_id: string; club_type_id: string }>;
      club_pricing: ReadTable<Omit<ClubPricing, 'club_type'> & { club_id: string; club_type_id: string }>;
      club_images: ReadTable<ClubImage & { club_id: string }>;
      club_opening_hours: ReadTable<OpeningHours & { club_id: string }>;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
