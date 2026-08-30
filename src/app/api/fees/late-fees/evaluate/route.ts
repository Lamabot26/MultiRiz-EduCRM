import { db } from '@/lib/db';
import { withApi, ok, fail, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { evaluateLateFees } from '@/lib/fees';

// POST /api/fees/late-fees/evaluate — run late-fee evaluation for overdue invoices.
export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 503);
    const updated = await evaluateLateFees(school.id);
    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'LATE_FEE_EVALUATE',
      entityType: 'invoice',
      after: { invoicesUpdated: updated },
    });
    return ok({ invoicesUpdated: updated });
  },
  { permission: PERMISSIONS.FEES_STRUCTURES_MANAGE },
);
