/** @type {import('next').NextConfig} */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://uxcedpbumulpheglhlvs.supabase.co https://tile.openstreetmap.org https://marsol.az",
  "font-src 'self' data:",
  "connect-src 'self' https://uxcedpbumulpheglhlvs.supabase.co wss://uxcedpbumulpheglhlvs.supabase.co",
  "media-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

const legacyProductionHosts = [
  'gameyerr-gameyer.vercel.app',
  'bosyer-web.vercel.app',
];

const utilityQueryNoindexPaths = ['/klub-sahibi', '/elaqe'];
const utilityQueryStateKeys = ['club', 'slug', 'sent', 'error', 'rate'];
const utilityQueryNoindexHeaders = utilityQueryNoindexPaths.flatMap((source) =>
  utilityQueryStateKeys.map((key) => ({
    source,
    has: [{ type: 'query', key }],
    headers: [{ key: 'X-Robots-Tag', value: 'noindex, follow' }],
  }))
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uxcedpbumulpheglhlvs.supabase.co',
        pathname: '/storage/v1/object/public/club-images/**',
      },
      {
        protocol: 'https',
        hostname: 'marsol.az',
        pathname: '/wp-content/uploads/2021/12/laliga-logo-sayt.jpg',
      },
    ],
  },
  async redirects() {
    return [
      ...legacyProductionHosts.map((host) => ({
        source: '/:path*',
        has: [{ type: 'host', value: host }],
        destination: 'https://gameyer.az/:path*',
        permanent: true,
      })),
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.gameyer.az' }],
        destination: 'https://gameyer.az/:path*',
        permanent: true,
      },
      {
        source: '/tip/pc',
        destination: '/bakida-pc-klublari',
        permanent: true,
      },
      {
        source: '/tip/playstation',
        destination: '/bakida-playstation-klublari',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      ...utilityQueryNoindexHeaders,
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          { key: 'Origin-Agent-Cluster', value: '?1' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), browsing-topics=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
