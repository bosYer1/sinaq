import { createClient } from '@/lib/supabase/server';

export interface AdminClubListItem {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  is_premium: boolean;
  district_id: string | null;
  district_name: string | null;
}

export interface AdminDistrictOption {
  id: string;
  name: string;
}

type AdminClubRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  is_premium: boolean;
  district_id: string | null;
  districts: { name: string } | null;
};

export async function getAdminClubs(): Promise<AdminClubListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('clubs')
    .select('id, name, slug, is_active, is_premium, district_id, districts(name)')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return (data as unknown as AdminClubRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    is_active: row.is_active,
    is_premium: row.is_premium,
    district_id: row.district_id,
    district_name: row.districts?.name ?? null,
  }));
}

export async function getAdminDistricts(): Promise<AdminDistrictOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('districts')
    .select('id, name')
    .order('name', { ascending: true });

  if (error || !data) return [];
  return data as AdminDistrictOption[];
}
