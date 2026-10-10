import type { Club } from '@/types/club';

export function detailImages(club: Pick<Club, 'profile_image_url' | 'images'>) {
  const result: { id: string; url: string }[] = [];
  const seen = new Set<string>();
  const add = (id: string, url: string) => {
    if (seen.has(url)) return;
    seen.add(url);
    result.push({ id, url });
  };
  if (club.profile_image_url) add('profile', club.profile_image_url);
  club.images.forEach(({ id, url }) => add(id, url));
  return result;
}
