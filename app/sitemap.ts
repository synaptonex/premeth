import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://enid.app';

// Public, indexable pages only. Account pages are excluded by robots.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    { path: '', priority: 1.0 },
    { path: 'exams', priority: 0.9 },
    { path: 'pathways', priority: 0.8 },
    { path: 'aggregate', priority: 0.7 },
    { path: 'pricing', priority: 0.7 },
    { path: 'about', priority: 0.6 },
    { path: 'privacy', priority: 0.3 },
    { path: 'terms', priority: 0.3 },
    { path: 'login', priority: 0.4 },
    { path: 'signup', priority: 0.5 },
  ];
  return routes.map((r) => ({
    url: `${SITE}/${r.path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: r.priority,
  }));
}
