import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Alabaster Notes',
    short_name: 'Alabaster',
    description: 'A quiet place for your thoughts',
    start_url: '/',
    display: 'standalone',
    background_color: '#1C1C1C',
    theme_color: '#1C1C1C',
    icons: [
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
