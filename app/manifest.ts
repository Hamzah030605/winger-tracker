import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Winger Tracker',
    short_name: 'Winger',
    description: 'Train like Neymar. Sprint like CR7. Track every session.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0d0d0f',
    theme_color: '#0d0d0f',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['health', 'fitness', 'sports'],
  }
}
