import { db } from '@/lib/db';
import { withApi, ok, fail, parseBody, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { concessionDecisionSchema } from '@/lib/validation';

// POST /api/fees/concessions/[id]/decision — approve/reject (approver only).
// On APPROVE with a linked invoice, the discount is applied transactionally.
export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 503);
    const parts = new URL(req.url).pathname.split('/').filter(Boolean);
    const id = parts[parts.indexOf('concessions') + 1] ?? '';
    const body = await parseBody(req, concessionDecisionSchema);

    const result = await db.$transaction(async (tx) => {
      const concession = await tx.concession.findFirst({ where: { id, schoolId: school.id } });
      if (!concession) throw new ApiError('Concession not found', 404);
      if (concession.status !== 'PENDING') throw new ApiError('Concession already decided', 400);

      let invoiceAmount = concession.amount ?? 0;
      if (!invoiceAmount && concession.percent && concession.invoiceId) {
        const inv = await tx.invoice.findUnique({ where: { id: concession.invoiceId } });
        invoiceAmount = inv ? Math.round((inv.subtotal * concession.percent) / 100) : 0;
      } else if (!invoiceAmount && concession.percent) {
        const inv = concession.invoiceId ? null : null;
        void inv;
      }

      const updated = await tx.concession.update({
        where: { id },
        data: {
          status: body.status,
          approvedBy: user.id,
          approvedAt: new Date(),
          remarks: body.remarks ?? null,
          ...(body.status === 'APPROVED' ? { appliedAt: new Date() } : {}),
        },
      });

      if (body.status === 'APPROVED' && invoiceAmount > 0) {
        if (concession.invoiceId) {
          const invoice = await tx.invoice.findUnique({ where: { id: concession.invoiceId } });
          if (invoice) {
            const discountTotal = invoice.discountTotal + invoiceAmount;
            const balance = Math.max(0, invoice.total + invoice.lateFeeTotal - discountTotal - invoice.paidTotal);
            await tx.invoice.update({
              where: { id: invoice.id },
              data: { discountTotal, balance },
            });
            await tx.concession.update({ where: { id }, data: { amount: invoiceAmount } });
          }
        }
      }
      return updated;
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'CONCESSION_DECISION',
      entityType: 'concession',
      entityId: id,
      before: { status: 'PENDING' },
      after: { status: result.status, remarks: result.remarks },
    });
    return ok({ concession: result });
  },
  { permission: PERMISSIONS.FEES_CONCESSION_APPROVE },
);
