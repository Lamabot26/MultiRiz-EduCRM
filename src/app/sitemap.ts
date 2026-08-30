import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';

// Dynamic sitemap: static public routes + published notice/event slugs.
// DB failures degrade gracefully to the static route list.

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spinternational.example').replace(/\/$/, '');
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/academics`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/admissions`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/facilities`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/student-life`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/notices`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/gallery`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/policies?page=privacy-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/policies?page=refund-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/policies?page=terms-of-use`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/policies?page=child-safety-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/policies?page=fee-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
  ];

  try {
    const notices = await db.notice.findMany({
      where: { isPublished: true, audience: { in: ['PUBLIC', 'ALL'] } },
      orderBy: { publishedAt: 'desc' },
      take: 200,
      select: { slug: true, updatedAt: true },
    });

    return [
      ...staticRoutes,
      ...notices.map((n) => ({
        url: `${base}/notices/detail?slug=${n.slug}`,
        lastModified: n.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
