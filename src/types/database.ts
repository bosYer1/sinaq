/**
 * GameYer Supabase database TypeScript tipləri.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      districts: {
        Row: { id: string; name: string; slug: string; created_at: string };
        Insert: { id?: string; name: string; slug: string; created_at?: string };
        Update: { id?: string; name?: string; slug?: string; created_at?: string };
        Relationships: [];
      };

      club_types: {
        Row: { id: string; name: string; slug: string };
        Insert: { id?: string; name: string; slug: string };
        Update: { id?: string; name?: string; slug?: string };
        Relationships: [];
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
          profile_image_url: string | null;
          rating_avg: number | null;
          rating_count: number;
          is_premium: boolean;
          premium_expires_at: string | null;
          is_active: boolean;
          is_verified: boolean;
          verified_at: string | null;
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
          profile_image_url?: string | null;
          rating_avg?: number | null;
          rating_count?: number;
          is_premium?: boolean;
          premium_expires_at?: string | null;
          is_active?: boolean;
          is_verified?: boolean;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          district_id?: string;
          address?: string;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          instagram_url?: string | null;
          profile_image_url?: string | null;
          rating_avg?: number | null;
          rating_count?: number;
          is_premium?: boolean;
          premium_expires_at?: string | null;
          is_active?: boolean;
          is_verified?: boolean;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'clubs_district_id_fkey';
            columns: ['district_id'];
            isOneToOne: false;
            referencedRelation: 'districts';
            referencedColumns: ['id'];
          }
        ];
      };

      club_type_assignments: {
        Row: { club_id: string; club_type_id: string };
        Insert: { club_id: string; club_type_id: string };
        Update: { club_id?: string; club_type_id?: string };
        Relationships: [
          {
            foreignKeyName: 'club_type_assignments_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'club_type_assignments_club_type_id_fkey';
            columns: ['club_type_id'];
            isOneToOne: false;
            referencedRelation: 'club_types';
            referencedColumns: ['id'];
          }
        ];
      };

      club_pricing: {
        Row: {
          id: string;
          club_id: string;
          club_type_id: string;
          price_from: number;
          price_to: number | null;
          unit: string;
          tariff_name?: string | null;
          schedule_label?: string | null;
          position?: number;
        };
        Insert: {
          id?: string;
          club_id: string;
          club_type_id: string;
          price_from: number;
          price_to?: number | null;
          unit?: string;
          tariff_name?: string | null;
          schedule_label?: string | null;
          position?: number;
        };
        Update: {
          id?: string;
          club_id?: string;
          club_type_id?: string;
          price_from?: number;
          price_to?: number | null;
          unit?: string;
          tariff_name?: string | null;
          schedule_label?: string | null;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'club_pricing_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'club_pricing_club_type_id_fkey';
            columns: ['club_type_id'];
            isOneToOne: false;
            referencedRelation: 'club_types';
            referencedColumns: ['id'];
          }
        ];
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
        Update: {
          id?: string;
          club_id?: string;
          day_of_week?: number;
          open_time?: string | null;
          close_time?: string | null;
          is_closed?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'club_opening_hours_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          }
        ];
      };

      club_images: {
        Row: { id: string; club_id: string; url: string; position: number; is_cover: boolean };
        Insert: { id?: string; club_id: string; url: string; position?: number; is_cover?: boolean };
        Update: { id?: string; club_id?: string; url?: string; position?: number; is_cover?: boolean };
        Relationships: [
          {
            foreignKeyName: 'club_images_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          }
        ];
      };

      page_views: {
        Row: {
          id: number;
          session_id: string;
          path: string;
          referrer_host: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          session_id: string;
          path: string;
          referrer_host?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          session_id?: string;
          path?: string;
          referrer_host?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      club_submissions: {
        Row: {
          id: string;
          kind: 'correction' | 'new_club' | 'owner_claim';
          club_id: string | null;
          club_name: string;
          message: string;
          contact_type: 'instagram' | 'phone' | 'email';
          contact_value: string;
          status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          kind: 'correction' | 'new_club' | 'owner_claim';
          club_id?: string | null;
          club_name: string;
          message: string;
          contact_type: 'instagram' | 'phone' | 'email';
          contact_value: string;
          status?: 'pending' | 'reviewing' | 'resolved' | 'rejected';
          created_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          kind?: 'correction' | 'new_club' | 'owner_claim';
          club_id?: string | null;
          club_name?: string;
          message?: string;
          contact_type?: 'instagram' | 'phone' | 'email';
          contact_value?: string;
          status?: 'pending' | 'reviewing' | 'resolved' | 'rejected';
          created_at?: string;
          reviewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'club_submissions_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          }
        ];
      };

      admin_users: {
        Row: { user_id: string; created_at: string };
        Insert: { user_id: string; created_at?: string };
        Update: { user_id?: string; created_at?: string };
        Relationships: [];
      };
    };

    Views: { [_ in never]: never };
    Functions: {
      replace_club_relations_atomic: {
        Args: {
          p_club_id: string;
          p_assignments: Json;
          p_pricing: Json;
          p_hours: Json;
          p_images: Json;
        };
        Returns: undefined;
      };
      apply_owner_claim_fields_atomic: {
        Args: {
          p_submission_id: string;
          p_instagram_url?: string | null;
          p_pc_price?: number | null;
          p_ps_price?: number | null;
          p_hours?: Json | null;
        };
        Returns: string;
      };
      verify_owner_claim_atomic: {
        Args: {
          p_submission_id: string;
        };
        Returns: string;
      };
      get_admin_analytics: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

export type District = Database['public']['Tables']['districts']['Row'];
export type ClubType = Database['public']['Tables']['club_types']['Row'];
export type ClubRow = Database['public']['Tables']['clubs']['Row'];
export type ClubTypeAssignment = Database['public']['Tables']['club_type_assignments']['Row'];
export type ClubPricing = Database['public']['Tables']['club_pricing']['Row'];
export type ClubOpeningHours = Database['public']['Tables']['club_opening_hours']['Row'];
export type ClubImage = Database['public']['Tables']['club_images']['Row'];
export type ClubSubmission = Database['public']['Tables']['club_submissions']['Row'];
export type PageView = Database['public']['Tables']['page_views']['Row'];

export interface ClubWithRelations extends ClubRow {
  district: Pick<District, 'id' | 'name' | 'slug'> | null;
  type_assignments: Array<
    ClubTypeAssignment & {
      club_type: Pick<ClubType, 'id' | 'name' | 'slug'>;
    }
  >;
  pricing: Array<
    ClubPricing & {
      club_type: Pick<ClubType, 'id' | 'name' | 'slug'>;
    }
  >;
  images: Pick<ClubImage, 'id' | 'url' | 'is_cover' | 'position'>[];
  opening_hours: ClubOpeningHours[];
}

export interface ClubFilters {
  district?: string;
  type?: string;
  priceMax?: number;
  q?: string;
}

export type ClubWithDistance = ClubWithRelations & {
  distanceKm: number | null;
};