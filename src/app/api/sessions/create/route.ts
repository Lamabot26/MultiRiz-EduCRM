import { db } from '@/lib/db';
import { ok, fail, withApi, parseBody, auditFrom, writeAudit, ApiError } from '@/lib/api-helpers';
import { hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { z } from 'zod';

// =====================================================================
// POST /api/sessions/create — create an academic session (settings.manage).
// If isCurrent, all other sessions of the school are demoted in the same
// transaction. Audited: SESSION_CREATE.
// (GET /api/sessions belongs to another task — this file only creates.)
// =====================================================================

const sessionCreateSchema = z.object({
  name: z.string().min(4).max(20), // e.g. 2025-26
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  isCurrent: z.boolean().optional().default(false),
});

export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    if (!hasPermission(user, PERMISSIONS.SETTINGS_MANAGE)) {
      return fail('You do not have permission to perform this action', 403);
    }
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 500);

    const body = await parseBody(req, sessionCreateSchema);
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new ApiError('Invalid start or end date', 422);
    }
    if (endDate <= startDate) throw new ApiError('End date must be after start date', 422);

    const existing = await db.academicSession.findUnique({
      where: { schoolId_name: { schoolId: school.id, name: body.name } },
    });
    if (existing) throw new ApiError('A session with this name already exists', 409);

    const created = await db.$transaction(async (tx) => {
      if (body.isCurrent) {
        await tx.academicSession.updateMany({
          where: { schoolId: school.id, isCurrent: true },
          data: { isCurrent: false },
        });
      }
      return tx.academicSession.create({
        data: {
          schoolId: school.id,
          name: body.name,
          startDate,
          endDate,
          isCurrent: body.isCurrent,
        },
      });
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'SESSION_CREATE',
      entityType: 'academic_session',
      entityId: created.id,
      after: { name: created.name, startDate: created.startDate, endDate: created.endDate, isCurrent: created.isCurrent },
    });

    return ok(created, { status: 201 });
  },
);
