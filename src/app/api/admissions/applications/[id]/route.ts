import { db } from '@/lib/db';
import { withApi, ok, fail, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { applicationCreateSchema } from '@/lib/validation';
import { APPLICATION_STATUS_LABELS } from '@/lib/constants';
import type { Prisma } from '@prisma/client';

// =====================================================================
// /api/admissions/applications/[id] — GET detail + PATCH (status etc).
// =====================================================================

function idFromUrl(req: Request): string {
  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const i = parts.indexOf('applications');
  return i >= 0 ? parts[i + 1] ?? '' : '';
}

async function loadScopedApplication(req: Request) {
  const id = idFromUrl(req);
  if (!id) throw new ApiError('Application id missing', 400);
  const school = await db.school.findFirst();
  if (!school) throw new ApiError('School not configured yet', 503);
  const app = await db.admissionApplication.findUnique({ where: { id } });
  if (!app || app.schoolId !== school.id) throw new ApiError('Application not found', 404);
  return app;
}

export const GET = withApi(async (req, { user }) => {
  if (!user) return fail('Authentication required', 401);
  const app = await loadScopedApplication(req);
  const full = await db.admissionApplication.findUnique({
    where: { id: app.id },
    include: {
      documents: { orderBy: { createdAt: 'asc' } },
      decisions: { orderBy: { decidedAt: 'desc' } },
      lead: { select: { id: true, leadNumber: true, studentName: true } },
      academicSession: { select: { id: true, name: true } },
    },
  });
  return ok(full);
});

export const PATCH = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const body = await req.json().then((j) => applicationCreateSchema.partial().parse(j));
    const keys = Object.keys(body);
    if (keys.length === 0) throw new ApiError('Nothing to update', 400);

    const app = await loadScopedApplication(req);
    const before = { status: app.status, classApplyingFor: app.classApplyingFor, email: app.email, address: app.address };

    const data: Prisma.AdmissionApplicationUpdateInput = {
      ...(body.classApplyingFor !== undefined ? { classApplyingFor: body.classApplyingFor } : {}),
      ...(body.studentName !== undefined ? { studentName: body.studentName } : {}),
      ...(body.dateOfBirth !== undefined ? { dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null } : {}),
      ...(body.gender !== undefined ? { gender: body.gender } : {}),
      ...(body.guardianName !== undefined ? { guardianName: body.guardianName } : {}),
      ...(body.mobile !== undefined ? { mobile: body.mobile } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(body.address !== undefined ? { address: body.address } : {}),
      ...(body.previousSchool !== undefined ? { previousSchool: body.previousSchool } : {}),
      ...(body.status !== undefined
        ? {
            status: body.status,
            submittedAt:
              body.status !== 'DRAFT' && !app.submittedAt ? new Date() : app.submittedAt,
          }
        : {}),
    };

    const updated = await db.admissionApplication.update({ where: { id: app.id }, data });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: keys.length === 1 && keys[0] === 'status' ? 'APPLICATION_STATUS_CHANGE' : 'APPLICATION_UPDATE',
      entityType: 'application',
      entityId: app.id,
      before,
      after: {
        status: updated.status,
        statusLabel: APPLICATION_STATUS_LABELS[updated.status] ?? updated.status,
        classApplyingFor: updated.classApplyingFor,
        email: updated.email,
        address: updated.address,
      },
    });

    return ok({ id: updated.id, status: updated.status, applicationNumber: updated.applicationNumber });
  },
  { permission: PERMISSIONS.APPLICATIONS_MANAGE },
);
