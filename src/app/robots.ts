import type { MetadataRoute } from 'next';
import { isCloudflareStandby } from '@/lib/cloudflare-standby';
import { getSiteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  if (isCloudflareStandby()) {
    return {
      // Crawlers must be able to read the response-level noindex directive.
      rules: [{ userAgent: '*', allow: '/' }],
    };
  }

  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Admin pages emit explicit noindex metadata. Do not block them here,
        // otherwise crawlers may be unable to observe the noindex directive.
        disallow: ['/api/', '/login', '/auth/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
