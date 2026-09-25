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
        Row: { id: string; name: string; slug: string; description: string | null; district_id: string; address: string; latitude: number | null; longitude: number | null; phone: string | null; instagram_url: string | null; tiktok_url: string | null; profile_image_url: string | null; rating_avg: number | null; rating_count: number; is_premium: boolean; premium_expires_at: string | null; is_active: boolean; is_verified: boolean; verified_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; slug: string; description?: string | null; district_id: string; address: string; latitude?: number | null; longitude?: number | null; phone?: string | null; instagram_url?: string | null; tiktok_url?: string | null; profile_image_url?: string | null; rating_avg?: number | null; rating_count?: number; is_premium?: boolean; premium_expires_at?: string | null; is_active?: boolean; is_verified?: boolean; verified_at?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; name?: string; slug?: string; description?: string | null; district_id?: string; address?: string; latitude?: number | null; longitude?: number | null; phone?: string | null; instagram_url?: string | null; tiktok_url?: string | null; profile_image_url?: string | null; rating_avg?: number | null; rating_count?: number; is_premium?: boolean; premium_expires_at?: string | null; is_active?: boolean; is_verified?: boolean; verified_at?: string | null; created_at?: string; updated_at?: string };
        Relationships: [{ foreignKeyName: 'clubs_district_id_fkey'; columns: ['district_id']; isOneToOne: false; referencedRelation: 'districts'; referencedColumns: ['id'] }];
      };
      club_type_assignments: {
        Row: { club_id: string; club_type_id: string };
        Insert: { club_id: string; club_type_id: string };
        Update: { club_id?: string; club_type_id?: string };
        Relationships: [
          { foreignKeyName: 'club_type_assignments_club_id_fkey'; columns: ['club_id']; isOneToOne: false; referencedRelation: 'clubs'; referencedColumns: ['id'] },
          { foreignKeyName: 'club_type_assignments_club_type_id_fkey'; columns: ['club_type_id']; isOneToOne: false; referencedRelation: 'club_types'; referencedColumns: ['id'] }
        ];
      };
      club_pricing: {
        Row: { id: string; club_id: string; club_type_id: string; price_from: number; price_to: number | null; unit: string; tariff_name?: string | null; schedule_label?: string | null; position?: number };
        Insert: { id?: string; club_id: string; club_type_id: string; price_from: number; price_to?: number | null; unit?: string; tariff_name?: string | null; schedule_label?: string | null; position?: number };
        Update: { id?: string; club_id?: string; club_type_id?: string; price_from?: number; price_to?: number | null; unit?: string; tariff_name?: string | null; schedule_label?: string | null; position?: number };
        Relationships: [
          { foreignKeyName: 'club_pricing_club_id_fkey'; columns: ['club_id']; isOneToOne: false; referencedRelation: 'clubs'; referencedColumns: ['id'] },
          { foreignKeyName: 'club_pricing_club_type_id_fkey'; columns: ['club_type_id']; isOneToOne: false; referencedRelation: 'club_types'; referencedColumns: ['id'] }
        ];
      };
      club_opening_hours: {
        Row: { id: string; club_id: string; day_of_week: number; open_time: string | null; close_time: string | null; is_closed: boolean };
        Insert: { id?: string; club_id: string; day_of_week: number; open_time?: string | null; close_time?: string | null; is_closed?: boolean };
        Update: { id?: string; club_id?: string; day_of_week?: number; open_time?: string | null; close_time?: string | null; is_closed?: boolean };
        Relationships: [{ foreignKeyName: 'club_opening_hours_club_id_fkey'; columns: ['club_id']; isOneToOne: false; referencedRelation: 'clubs'; referencedColumns: ['id'] }];
      };
      club_images: {
        Row: { id: string; club_id: string; url: string; position: number; is_cover: boolean };
        Insert: { id?: string; club_id: string; url: string; position?: number; is_cover?: boolean };
        Update: { id?: string; club_id?: string; url?: string; position?: number; is_cover?: boolean };
        Relationships: [{ foreignKeyName: 'club_images_club_id_fkey'; columns: ['club_id']; isOneToOne: false; referencedRelation: 'clubs'; referencedColumns: ['id'] }];
      };
      club_data_evidence: {
        Row: { id: string; club_id: string; field_name: string; source_type: string; source_url: string | null; evidence_value: string | null; confidence: string; is_current: boolean; checked_at: string; created_by: string | null; created_at: string };
        Insert: { id?: string; club_id: string; field_name: string; source_type: string; source_url?: string | null; evidence_value?: string | null; confidence: string; is_current?: boolean; checked_at?: string; created_by?: string | null; created_at?: string };
        Update: { id?: string; club_id?: string; field_name?: string; source_type?: string; source_url?: string | null; evidence_value?: string | null; confidence?: string; is_current?: boolean; checked_at?: string; created_by?: string | null; created_at?: string };
        Relationships: [{ foreignKeyName: 'club_data_evidence_club_id_fkey'; columns: ['club_id']; isOneToOne: false; referencedRelation: 'clubs'; referencedColumns: ['id'] }];
      };
      page_views: {
        Row: { id: number; session_id: string; visit_id: string | null; path: string; referrer_host: string | null; user_agent: string | null; ip_address: string | null; created_at: string };
        Insert: { id?: number; session_id: string; visit_id?: string | null; path: string; referrer_host?: string | null; user_agent?: string | null; ip_address?: string | null; created_at?: string };
        Update: { id?: number; session_id?: string; visit_id?: string | null; path?: string; referrer_host?: string | null; user_agent?: string | null; ip_address?: string | null; created_at?: string };
        Relationships: [];
      };
      analytics_events: {
        Row: { id: number; session_id: string; path: string; event_type: string; club_slug: string | null; created_at: string };
        Insert: { id?: number; session_id: string; path: string; event_type: string; club_slug?: string | null; created_at?: string };
        Update: { id?: number; session_id?: string; path?: string; event_type?: string; club_slug?: string | null; created_at?: string };
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
          applied_fields: Json;
          applied_at: string | null;
          submitted_images: string[];
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
          applied_fields?: Json;
          applied_at?: string | null;
          submitted_images?: string[];
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
          applied_fields?: Json;
          applied_at?: string | null;
          submitted_images?: string[];
        };
        Relationships: [{ foreignKeyName: 'club_submissions_club_id_fkey'; columns: ['club_id']; isOneToOne: false; referencedRelation: 'clubs'; referencedColumns: ['id'] }];
      };
      admin_notifications: {
        Row: { id: string; type: string; submission_id: string | null; title: string; message: string; read_at: string | null; created_at: string };
        Insert: { id?: string; type: string; submission_id?: string | null; title: string; message: string; read_at?: string | null; created_at?: string };
        Update: { id?: string; type?: string; submission_id?: string | null; title?: string; message?: string; read_at?: string | null; created_at?: string };
        Relationships: [{ foreignKeyName: 'admin_notifications_submission_id_fkey'; columns: ['submission_id']; isOneToOne: false; referencedRelation: 'club_submissions'; referencedColumns: ['id'] }];
      };
      business_customers: {
        Row: { id: string; display_name: string; legal_name: string | null; tax_id: string | null; contact_name: string | null; contact_phone: string | null; contact_email: string | null; contact_instagram: string | null; status: 'lead' | 'active' | 'inactive'; created_at: string; updated_at: string };
        Insert: { id?: string; display_name: string; legal_name?: string | null; tax_id?: string | null; contact_name?: string | null; contact_phone?: string | null; contact_email?: string | null; contact_instagram?: string | null; status?: 'lead' | 'active' | 'inactive'; created_at?: string; updated_at?: string };
        Update: { id?: string; display_name?: string; legal_name?: string | null; tax_id?: string | null; contact_name?: string | null; contact_phone?: string | null; contact_email?: string | null; contact_instagram?: string | null; status?: 'lead' | 'active' | 'inactive'; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      commercial_packages: {
        Row: { id: string; code: string; name: string; description: string | null; default_price_azn: number | null; billing_period: 'one_time' | 'monthly' | 'custom' | null; is_active: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; code: string; name: string; description?: string | null; default_price_azn?: number | null; billing_period?: 'one_time' | 'monthly' | 'custom' | null; is_active?: boolean; created_at?: string; updated_at?: string };
        Update: { id?: string; code?: string; name?: string; description?: string | null; default_price_azn?: number | null; billing_period?: 'one_time' | 'monthly' | 'custom' | null; is_active?: boolean; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      commercial_contracts: {
        Row: { id: string; customer_id: string; club_id: string | null; package_id: string | null; status: 'draft' | 'active' | 'completed' | 'cancelled'; starts_at: string; ends_at: string | null; agreed_price_azn: number; discount_azn: number; notes: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; customer_id: string; club_id?: string | null; package_id?: string | null; status?: 'draft' | 'active' | 'completed' | 'cancelled'; starts_at: string; ends_at?: string | null; agreed_price_azn: number; discount_azn?: number; notes?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; customer_id?: string; club_id?: string | null; package_id?: string | null; status?: 'draft' | 'active' | 'completed' | 'cancelled'; starts_at?: string; ends_at?: string | null; agreed_price_azn?: number; discount_azn?: number; notes?: string | null; created_at?: string; updated_at?: string };
        Relationships: [
          { foreignKeyName: 'commercial_contracts_customer_id_fkey'; columns: ['customer_id']; isOneToOne: false; referencedRelation: 'business_customers'; referencedColumns: ['id'] },
          { foreignKeyName: 'commercial_contracts_club_id_fkey'; columns: ['club_id']; isOneToOne: false; referencedRelation: 'clubs'; referencedColumns: ['id'] },
          { foreignKeyName: 'commercial_contracts_package_id_fkey'; columns: ['package_id']; isOneToOne: false; referencedRelation: 'commercial_packages'; referencedColumns: ['id'] }
        ];
      };
      commercial_payments: {
        Row: { id: string; contract_id: string; amount_azn: number; status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'; payment_method: string | null; external_reference: string | null; paid_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; contract_id: string; amount_azn: number; status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'; payment_method?: string | null; external_reference?: string | null; paid_at?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; contract_id?: string; amount_azn?: number; status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'; payment_method?: string | null; external_reference?: string | null; paid_at?: string | null; created_at?: string; updated_at?: string };
        Relationships: [{ foreignKeyName: 'commercial_payments_contract_id_fkey'; columns: ['contract_id']; isOneToOne: false; referencedRelation: 'commercial_contracts'; referencedColumns: ['id'] }];
      };
      commercial_placements: {
        Row: { id: string; contract_id: string; club_id: string; placement_type: string; starts_at: string; ends_at: string | null; status: 'scheduled' | 'active' | 'completed' | 'cancelled'; metadata: Json; created_at: string; updated_at: string };
        Insert: { id?: string; contract_id: string; club_id: string; placement_type: string; starts_at: string; ends_at?: string | null; status?: 'scheduled' | 'active' | 'completed' | 'cancelled'; metadata?: Json; created_at?: string; updated_at?: string };
        Update: { id?: string; contract_id?: string; club_id?: string; placement_type?: string; starts_at?: string; ends_at?: string | null; status?: 'scheduled' | 'active' | 'completed' | 'cancelled'; metadata?: Json; created_at?: string; updated_at?: string };
        Relationships: [
          { foreignKeyName: 'commercial_placements_contract_id_fkey'; columns: ['contract_id']; isOneToOne: false; referencedRelation: 'commercial_contracts'; referencedColumns: ['id'] },
          { foreignKeyName: 'commercial_placements_club_id_fkey'; columns: ['club_id']; isOneToOne: false; referencedRelation: 'clubs'; referencedColumns: ['id'] }
        ];
      };
      commercial_opportunities: {
        Row: { id: string; customer_id: string; club_id: string | null; package_id: string | null; contract_id: string | null; stage: 'targeted' | 'contacted' | 'replied' | 'offered' | 'paid' | 'activated' | 'reported' | 'renewed' | 'lost'; offer_price_azn: number | null; first_contact_at: string | null; last_contact_at: string | null; next_follow_up_at: string | null; lost_reason: string | null; notes: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; customer_id: string; club_id?: string | null; package_id?: string | null; contract_id?: string | null; stage?: 'targeted' | 'contacted' | 'replied' | 'offered' | 'paid' | 'activated' | 'reported' | 'renewed' | 'lost'; offer_price_azn?: number | null; first_contact_at?: string | null; last_contact_at?: string | null; next_follow_up_at?: string | null; lost_reason?: string | null; notes?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; customer_id?: string; club_id?: string | null; package_id?: string | null; contract_id?: string | null; stage?: 'targeted' | 'contacted' | 'replied' | 'offered' | 'paid' | 'activated' | 'reported' | 'renewed' | 'lost'; offer_price_azn?: number | null; first_contact_at?: string | null; last_contact_at?: string | null; next_follow_up_at?: string | null; lost_reason?: string | null; notes?: string | null; created_at?: string; updated_at?: string };
        Relationships: [
          { foreignKeyName: 'commercial_opportunities_customer_id_fkey'; columns: ['customer_id']; isOneToOne: false; referencedRelation: 'business_customers'; referencedColumns: ['id'] },
          { foreignKeyName: 'commercial_opportunities_club_id_fkey'; columns: ['club_id']; isOneToOne: false; referencedRelation: 'clubs'; referencedColumns: ['id'] },
          { foreignKeyName: 'commercial_opportunities_package_id_fkey'; columns: ['package_id']; isOneToOne: false; referencedRelation: 'commercial_packages'; referencedColumns: ['id'] },
          { foreignKeyName: 'commercial_opportunities_contract_id_fkey'; columns: ['contract_id']; isOneToOne: false; referencedRelation: 'commercial_contracts'; referencedColumns: ['id'] }
        ];
      };
      commercial_performance_snapshots: {
        Row: { id: string; placement_id: string; club_id: string; snapshot_type: 'baseline' | 'day7' | 'final'; period_start: string; period_end: string; profile_views: number; view_sessions: number; phone_clicks: number; instagram_clicks: number; maps_clicks: number; intent_sessions: number; created_at: string };
        Insert: { id?: string; placement_id: string; club_id: string; snapshot_type: 'baseline' | 'day7' | 'final'; period_start: string; period_end: string; profile_views?: number; view_sessions?: number; phone_clicks?: number; instagram_clicks?: number; maps_clicks?: number; intent_sessions?: number; created_at?: string };
        Update: { id?: string; placement_id?: string; club_id?: string; snapshot_type?: 'baseline' | 'day7' | 'final'; period_start?: string; period_end?: string; profile_views?: number; view_sessions?: number; phone_clicks?: number; instagram_clicks?: number; maps_clicks?: number; intent_sessions?: number; created_at?: string };
        Relationships: [
          { foreignKeyName: 'commercial_performance_snapshots_placement_id_fkey'; columns: ['placement_id']; isOneToOne: false; referencedRelation: 'commercial_placements'; referencedColumns: ['id'] },
          { foreignKeyName: 'commercial_performance_snapshots_club_id_fkey'; columns: ['club_id']; isOneToOne: false; referencedRelation: 'clubs'; referencedColumns: ['id'] }
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
      replace_club_relations_atomic: { Args: { p_club_id: string; p_assignments: Json; p_pricing: Json; p_hours: Json; p_images: Json }; Returns: undefined };
      apply_owner_claim_fields_atomic: { Args: { p_submission_id: string; p_instagram_url?: string | null; p_pc_price?: number | null; p_ps_price?: number | null; p_hours?: Json | null }; Returns: string };
      verify_owner_claim_atomic: { Args: { p_submission_id: string }; Returns: string };
      record_paid_commercial_sale_atomic: {
        Args: { p_opportunity_id: string; p_agreed_price_azn: number; p_discount_azn: number; p_starts_at: string; p_ends_at: string; p_payment_method?: string | null; p_external_reference?: string | null; p_contract_notes?: string | null };
        Returns: string;
      };
      activate_commercial_premium_atomic: {
        Args: { p_contract_id: string; p_baseline_start: string; p_baseline_end: string; p_profile_views: number; p_view_sessions: number; p_phone_clicks: number; p_instagram_clicks: number; p_maps_clicks: number; p_intent_sessions: number };
        Returns: string;
      };
      finalize_commercial_performance_atomic: {
        Args: { p_placement_id: string; p_period_start: string; p_period_end: string; p_profile_views: number; p_view_sessions: number; p_phone_clicks: number; p_instagram_clicks: number; p_maps_clicks: number; p_intent_sessions: number };
        Returns: string;
      };
      get_admin_analytics: { Args: Record<PropertyKey, never>; Returns: Json };
      get_admin_analytics_24h: { Args: Record<PropertyKey, never>; Returns: Json };
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
export type ClubDataEvidence = Database['public']['Tables']['club_data_evidence']['Row'];
export type ClubSubmission = Database['public']['Tables']['club_submissions']['Row'];
export type PageView = Database['public']['Tables']['page_views']['Row'];
export type AnalyticsEvent = Database['public']['Tables']['analytics_events']['Row'];
export type AdminNotification = Database['public']['Tables']['admin_notifications']['Row'];

export interface ClubWithRelations extends ClubRow {
  district: Pick<District, 'id' | 'name' | 'slug'> | null;
  type_assignments: Array<ClubTypeAssignment & { club_type: Pick<ClubType, 'id' | 'name' | 'slug'> }>;
  pricing: Array<ClubPricing & { club_type: Pick<ClubType, 'id' | 'name' | 'slug'> }>;
  images: Pick<ClubImage, 'id' | 'url' | 'is_cover' | 'position'>[];
  opening_hours: ClubOpeningHours[];
}

export interface ClubFilters { district?: string; metro?: string; type?: string; priceMax?: number; q?: string }
export type ClubWithDistance = ClubWithRelations & { distanceKm: number | null };