import type { MetadataRoute } from 'next';

// Lets Enid be installed to a phone home screen. Colours match the app theme:
// coal background (#14130F), accent gold elsewhere.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Enid: MDCAT practice',
    short_name: 'Enid',
    description:
      'Practice MDCAT MCQs from 2,500 past papers. Free, no signup, no ads.',
    start_url: '/',
    display: 'standalone',
    background_color: '#14130F',
    theme_color: '#14130F',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
