import { db } from '@/lib/db';
import { withApi, ok, fail, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';

function idFromUrl(req: Request): string {
  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const i = parts.indexOf('structures');
  return i >= 0 ? parts[i + 1] ?? '' : '';
}

async function loadStructure(req: Request) {
  const id = idFromUrl(req);
  if (!id) throw new ApiError('Structure id missing', 400);
  const school = await db.school.findFirst();
  if (!school) throw new ApiError('School not configured', 503);
  const structure = await db.feeStructure.findUnique({ where: { id } });
  if (!structure || structure.schoolId !== school.id) throw new ApiError('Fee structure not found', 404);
  return structure;
}

// PATCH /api/fees/structures/[id] — activate/archive.
export const PATCH = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const structure = await loadStructure(req);
    const body = (await req.json()) as { status?: string };
    if (!body.status || !['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(body.status)) {
      throw new ApiError('Invalid status', 422);
    }
    const updated = await db.feeStructure.update({
      where: { id: structure.id },
      data: { status: body.status },
    });
    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'FEE_STRUCTURE_UPDATE',
      entityType: 'fee_structure',
      entityId: structure.id,
      before: { status: structure.status },
      after: { status: updated.status },
    });
    return ok({ structure: updated });
  },
  { permission: PERMISSIONS.FEES_STRUCTURES_MANAGE },
);

// DELETE /api/fees/structures/[id] — only drafts with no assignments.
export const DELETE = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const structure = await loadStructure(req);
    if (structure.status !== 'DRAFT') throw new ApiError('Only draft structures can be deleted', 400);
    const count = await db.studentFeeAssignment.count({ where: { feeStructureId: structure.id } });
    if (count > 0) throw new ApiError('Structure has student assignments; archive instead', 400);
    await db.feeStructure.delete({ where: { id: structure.id } });
    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'FEE_STRUCTURE_DELETE',
      entityType: 'fee_structure',
      entityId: structure.id,
      before: { name: structure.name },
    });
    return ok({ deleted: true });
  },
  { permission: PERMISSIONS.FEES_STRUCTURES_MANAGE },
);
