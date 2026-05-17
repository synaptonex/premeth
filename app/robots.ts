import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://enid.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Account-only and admin areas have nothing useful for a crawler.
      disallow: ['/dashboard', '/profile', '/admin', '/vault', '/drill', '/mock', '/goal'],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
