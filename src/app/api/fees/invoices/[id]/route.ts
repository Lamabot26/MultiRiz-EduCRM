import { db } from '@/lib/db';
import { withApi, ok, fail, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';

function idFromUrl(req: Request): string {
  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const i = parts.indexOf('invoices');
  return i >= 0 ? parts[i + 1] ?? '' : '';
}

// GET /api/fees/invoices/[id] — full invoice detail.
export const GET = withApi(
  async (req, { user }) => {
    if (!user) return fail('Authentication required', 401);
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 503);
    const id = idFromUrl(req);
    const invoice = await db.invoice.findFirst({
      where: { id, schoolId: school.id },
      include: {
        student: { include: { classRoom: true, section: true } },
        items: { include: { feeComponent: true }, orderBy: { id: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        allocations: true,
        receipts: { orderBy: { issuedAt: 'desc' } },
        concessions: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!invoice) throw new ApiError('Invoice not found', 404);
    return ok({ invoice });
  },
  { permission: PERMISSIONS.FEES_PAYMENTS_READ },
);

// PATCH /api/fees/invoices/[id] — notes only (financial fields immutable).
export const PATCH = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const id = idFromUrl(req);
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 503);
    const invoice = await db.invoice.findFirst({ where: { id, schoolId: school.id } });
    if (!invoice) throw new ApiError('Invoice not found', 404);

    const body = (await req.json()) as { notes?: string };
    const before = { notes: invoice.notes };
    const updated = await db.invoice.update({
      where: { id },
      data: { notes: body.notes?.slice(0, 500) ?? null },
    });
    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'INVOICE_UPDATE',
      entityType: 'invoice',
      entityId: id,
      before,
      after: { notes: updated.notes },
    });
    return ok({ invoice: updated });
  },
  { permission: PERMISSIONS.FEES_PAYMENTS_OFFLINE },
);
