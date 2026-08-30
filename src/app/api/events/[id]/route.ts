import { db } from '@/lib/db';
import { ok, fail, withApi, parseBody, auditFrom, writeAudit, ApiError } from '@/lib/api-helpers';
import { hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { eventSchema } from '@/lib/validation';

// =====================================================================
// PATCH  /api/events/[id] — edit / publish-toggle (notices.manage).
// DELETE — allowed only while unpublished. Audited: EVENT_DELETE.
// Audited: EVENT_UPDATE.
// =====================================================================

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApi(
    async (r, { user, ip }) => {
      if (!user) return fail('Authentication required', 401);
      if (!hasPermission(user, PERMISSIONS.NOTICES_MANAGE)) {
        return fail('You do not have permission to perform this action', 403);
      }
      const event = await db.event.findUnique({ where: { id } });
      if (!event) throw new ApiError('Event not found', 404);

      const body = await parseBody(r, eventSchema.partial());
      const before = {
        title: event.title, description: event.description, startsAt: event.startsAt,
        endsAt: event.endsAt, location: event.location, isPublished: event.isPublished,
      };

      const willPublish = body.isPublished === true && !event.isPublished;

      const updated = await db.event.update({
        where: { id: event.id },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.startsAt !== undefined ? { startsAt: new Date(body.startsAt) } : {}),
          ...(body.endsAt !== undefined ? { endsAt: body.endsAt ? new Date(body.endsAt) : null } : {}),
          ...(body.location !== undefined ? { location: body.location ?? null } : {}),
          ...(body.isPublished !== undefined ? { isPublished: body.isPublished } : {}),
        },
      });

      const after = {
        title: updated.title, description: updated.description, startsAt: updated.startsAt,
        endsAt: updated.endsAt, location: updated.location, isPublished: updated.isPublished,
      };

      await writeAudit({
        ...auditFrom(user, ip, r),
        action: 'EVENT_UPDATE',
        entityType: 'event',
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
      const event = await db.event.findUnique({ where: { id } });
      if (!event) throw new ApiError('Event not found', 404);
      if (event.isPublished) {
        throw new ApiError('Unpublish this event before deleting', 400);
      }

      await db.event.delete({ where: { id: event.id } });

      await writeAudit({
        ...auditFrom(user, ip, r),
        action: 'EVENT_DELETE',
        entityType: 'event',
        entityId: event.id,
        before: { title: event.title, slug: event.slug, startsAt: event.startsAt },
      });

      return ok({ deleted: true, id: event.id });
    },
  )(req);
}
