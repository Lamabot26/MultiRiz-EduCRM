import type { MetadataRoute } from 'next';

// robots.txt — allow everything, point crawlers at the sitemap.
// (Replaces the static public/robots.txt, which was removed to avoid the
// Next.js "conflicting public file and page file" error.)

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spinternational.example').replace(/\/$/, '');
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
