import { db } from '@/lib/db';
import { ok, fail, withApi, parseBody, auditFrom, writeAudit, ApiError } from '@/lib/api-helpers';
import { hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { noticeSchema } from '@/lib/validation';

// =====================================================================
// PATCH  /api/notices/[id] — edit / publish-toggle (notices.manage).
//          Publishing stamps publishedAt (once).
// DELETE — allowed only while unpublished (soft-archive preference:
//          set isPublished=false instead). Audited: NOTICE_DELETE.
// Audited: NOTICE_UPDATE.
// =====================================================================

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApi(
    async (r, { user, ip }) => {
      if (!user) return fail('Authentication required', 401);
      if (!hasPermission(user, PERMISSIONS.NOTICES_MANAGE)) {
        return fail('You do not have permission to perform this action', 403);
      }
      const notice = await db.notice.findUnique({ where: { id } });
      if (!notice) throw new ApiError('Notice not found', 404);

      const body = await parseBody(r, noticeSchema.partial());
      const before = {
        title: notice.title, content: notice.content, category: notice.category,
        audience: notice.audience, isPublished: notice.isPublished,
        attachmentUrl: notice.attachmentUrl, attachmentName: notice.attachmentName,
      };

      const willPublish = body.isPublished === true && !notice.isPublished;

      const updated = await db.notice.update({
        where: { id: notice.id },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.content !== undefined ? { content: body.content } : {}),
          ...(body.category !== undefined ? { category: body.category } : {}),
          ...(body.audience !== undefined ? { audience: body.audience } : {}),
          ...(body.isPublished !== undefined ? { isPublished: body.isPublished } : {}),
          ...(body.attachmentUrl !== undefined ? { attachmentUrl: body.attachmentUrl ?? null } : {}),
          ...(body.attachmentName !== undefined ? { attachmentName: body.attachmentName ?? null } : {}),
          ...(willPublish ? { publishedAt: notice.publishedAt ?? new Date() } : {}),
        },
      });

      const after = {
        title: updated.title, content: updated.content, category: updated.category,
        audience: updated.audience, isPublished: updated.isPublished,
        attachmentUrl: updated.attachmentUrl, attachmentName: updated.attachmentName,
      };

      await writeAudit({
        ...auditFrom(user, ip, r),
        action: 'NOTICE_UPDATE',
        entityType: 'notice',
        entityId: updated.id,
        before,
        after,
      });

      return ok(updated);
    },
  )(req);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApi(
    async (r, { user, ip }) => {
      if (!user) return fail('Authentication required', 401);
      if (!hasPermission(user, PERMISSIONS.NOTICES_MANAGE)) {
        return fail('You do not have permission to perform this action', 403);
      }
      const notice = await db.notice.findUnique({ where: { id } });
      if (!notice) throw new ApiError('Notice not found', 404);
      if (notice.isPublished) {
        throw new ApiError('Unpublish this notice before deleting (or archive it instead)', 400);
      }

      await db.notice.delete({ where: { id: notice.id } });

      await writeAudit({
        ...auditFrom(user, ip, r),
        action: 'NOTICE_DELETE',
        entityType: 'notice',
        entityId: notice.id,
        before: { title: notice.title, slug: notice.slug, category: notice.category },
      });

      return ok({ deleted: true, id: notice.id });
    },
  )(req);
}
