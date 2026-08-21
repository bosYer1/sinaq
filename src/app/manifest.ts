import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GameYer',
    short_name: 'GameYer',
    description: 'Bakıda PC və PlayStation klublarını tap.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#7C5CFC',
    icons: [
      {
        src: '/gameyer-logo.jpeg',
        sizes: '1254x1254',
        type: 'image/jpeg',
        purpose: 'any',
      },
      {
        src: '/gameyer-logo.jpeg',
        sizes: '1254x1254',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
    ],
  };
}
