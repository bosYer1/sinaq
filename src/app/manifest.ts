import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BosYer',
    short_name: 'BosYer',
    description: 'Bakıda PC və PlayStation klublarını tap.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#7C5CFC',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
