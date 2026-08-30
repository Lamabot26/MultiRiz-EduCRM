import { db } from '@/lib/db';
import { withApi, ok } from '@/lib/api-helpers';
import { NOTICE_CATEGORIES } from '@/lib/constants';

// GET /api/public/notices?q=&cat=&limit=
// Public, rate-limited feed of published notices (audience PUBLIC or ALL).
export const GET = withApi(
  async (req) => {
    const sp = new URL(req.url).searchParams;
    const q = (sp.get('q') ?? '').trim();
    const catRaw = (sp.get('cat') ?? '').trim().toUpperCase();
    const cat = (NOTICE_CATEGORIES as readonly string[]).includes(catRaw) ? catRaw : '';
    const limitRaw = Number(sp.get('limit') ?? '20');
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : 20, 1), 50);

    const notices = await db.notice.findMany({
      where: {
        isPublished: true,
        audience: { in: ['PUBLIC', 'ALL'] },
        ...(q ? { OR: [{ title: { contains: q } }, { content: { contains: q } }] } : {}),
        ...(cat ? { category: cat } : {}),
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        category: true,
        audience: true,
        publishedAt: true,
        createdAt: true,
        attachmentUrl: true,
        attachmentName: true,
      },
    });

    return ok({
      count: notices.length,
      notices: notices.map((n) => ({
        ...n,
        excerpt: n.content.replace(/\s+/g, ' ').trim().slice(0, 200),
      })),
    });
  },
  { rateLimit: { key: 'public-notices-get', limit: 60, windowMs: 60_000 } },
);
