export type District = {
  id: string;
  name: string;
  slug: string;
};

export type ClubType = {
  id: string;
  name: string;
  slug: string;
};

export type ClubPricing = {
  id: string;
  price_from: number;
  price_to: number | null;
  unit: string;
  club_type: ClubType | null;
};

export type OpeningHours = {
  id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
};

export type ClubImage = {
  id: string;
  url: string;
  is_cover: boolean;
  position: number;
};

export type Club = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  instagram_url: string | null;
  is_premium: boolean;
  premium_expires_at: string | null;
  is_verified: boolean;
  verified_at: string | null;
  updated_at: string;
  district: District | null;
  type_assignments: { club_type: ClubType | null }[];
  pricing: ClubPricing[];
  images: ClubImage[];
  opening_hours: OpeningHours[];
};

export type MappableClub = Club & { latitude: number; longitude: number };

export type ClubFilters = {
  query: string;
  district: string | null;
  type: string | null;
  verifiedOnly: boolean;
};
