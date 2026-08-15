const GAMEYER_PRODUCTION_URL = 'https://gameyerr-gameyer.vercel.app';

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configured || configured.includes('bosyer')) {
    return GAMEYER_PRODUCTION_URL;
  }

  try {
    const url = new URL(configured);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return GAMEYER_PRODUCTION_URL;
    }
    return url.origin;
  } catch {
    return GAMEYER_PRODUCTION_URL;
  }
}
