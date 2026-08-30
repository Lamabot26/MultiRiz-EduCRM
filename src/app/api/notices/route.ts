import { db } from '@/lib/db';
import { ok, fail, withApi, parseBody, auditFrom, writeAudit, ApiError } from '@/lib/api-helpers';
import { hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { noticeSchema } from '@/lib/validation';

// =====================================================================
// GET  /api/notices — staff with notices.manage see all (incl. drafts);
//      everyone else gets published only.
// POST /api/notices — create (notices.manage). Slug is generated from
//      the title with a unique suffix. Audited: NOTICE_CREATE.
// =====================================================================

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'notice';
}

export async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let n = 1;
  // unique() probes are cheap; titles repeat rarely so this stays bounded.
  while (await db.notice.findUnique({ where: { slug: candidate }, select: { id: true } })) {
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

    const rows = await db.notice.findMany({
      where: canManage ? {} : { isPublished: true },
      orderBy: [{ isPublished: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
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

    const body = await parseBody(req, noticeSchema);
    const slug = await uniqueSlug(slugify(body.title));

    const notice = await db.notice.create({
      data: {
        schoolId: school.id,
        title: body.title,
        slug,
        content: body.content,
        category: body.category,
        audience: body.audience,
        isPublished: body.isPublished,
        publishedAt: body.isPublished ? new Date() : null,
        attachmentUrl: body.attachmentUrl ?? null,
        attachmentName: body.attachmentName ?? null,
        createdById: user.id,
      },
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'NOTICE_CREATE',
      entityType: 'notice',
      entityId: notice.id,
      after: { title: notice.title, slug: notice.slug, category: notice.category, audience: notice.audience, isPublished: notice.isPublished },
    });

    return ok(notice, { status: 201 });
  },
);
