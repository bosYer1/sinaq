/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Klub şəkilləri Supabase Storage-dən gələcək.
    // NEXT_PUBLIC_SUPABASE_URL təyin olunanda bura uyğun host əlavə edin,
    // məsələn: 'xxxxx.supabase.co'
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

module.exports = nextConfig;
