import type { Club } from '@/types/club';

export function detailImages(club: Pick<Club, 'profile_image_url' | 'images'>) {
  const images = club.images.map(({ id, url }) => ({ id, url }));
  if (!club.profile_image_url) return images;
  return [{ id: 'profile', url: club.profile_image_url }, ...images.filter(({ url }) => url !== club.profile_image_url)];
}
