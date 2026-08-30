import { db } from '@/lib/db';
import { ok, fail, withApi, parseBody, auditFrom, writeAudit, ApiError } from '@/lib/api-helpers';
import { hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { eventSchema } from '@/lib/validation';

// =====================================================================
// GET  /api/events — staff with notices.manage see all; others published.
// POST /api/events — create (notices.manage). Slug generated + unique.
//      Audited: EVENT_CREATE.
// =====================================================================

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'event';
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let n = 1;
  while (await db.event.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    n += 1;
    candidate = `${base}-${n}`;
    if (n > 50) {
      candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
      break;
    }
  }
  return candidate;
}

export const GET = withApi(
  async (_req, { user }) => {
    if (!user) return fail('Authentication required', 401);
    const canManage = hasPermission(user, PERMISSIONS.NOTICES_MANAGE);

    const rows = await db.event.findMany({
      where: canManage ? {} : { isPublished: true },
      orderBy: [{ startsAt: 'desc' }],
      take: 200,
    });
    return ok(rows);
  },
);

export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    if (!hasPermission(user, PERMISSIONS.NOTICES_MANAGE)) {
      return fail('You do not have permission to perform this action', 403);
    }
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 500);

    const body = await parseBody(req, eventSchema);
    const slug = await uniqueSlug(slugify(body.title));
    const startsAt = new Date(body.startsAt);
    if (Number.isNaN(startsAt.getTime())) throw new ApiError('Invalid start date/time', 422);

    const event = await db.event.create({
      data: {
        schoolId: school.id,
        title: body.title,
        slug,
        description: body.description,
        startsAt,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        location: body.location ?? null,
        isPublished: body.isPublished,
        createdById: user.id,
      },
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'EVENT_CREATE',
      entityType: 'event',
      entityId: event.id,
      after: { title: event.title, slug: event.slug, startsAt: event.startsAt, isPublished: event.isPublished },
    });

    return ok(event, { status: 201 });
  },
);
