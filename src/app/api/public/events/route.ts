import { db } from '@/lib/db';
import { withApi, ok } from '@/lib/api-helpers';

// GET /api/public/events?limit=
// Public, rate-limited feed of published upcoming events (chronological).
export const GET = withApi(
  async (req) => {
    const sp = new URL(req.url).searchParams;
    const limitRaw = Number(sp.get('limit') ?? '20');
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : 20, 1), 50);

    const events = await db.event.findMany({
      where: {
        isPublished: true,
        isPublic: true,
        startsAt: { gte: new Date() },
      },
      orderBy: { startsAt: 'asc' },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        startsAt: true,
        endsAt: true,
        location: true,
      },
    });

    return ok({ count: events.length, events });
  },
  { rateLimit: { key: 'public-events-get', limit: 60, windowMs: 60_000 } },
);
