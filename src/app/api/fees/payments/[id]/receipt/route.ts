import { db } from '@/lib/db';
import { withApi, fail, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { getSchoolSettings } from '@/lib/settings';
import { receiptPdf } from '@/lib/pdf/receipt';
import { canAccessStudentFees } from '@/lib/access';
import { nextNumberTx } from '@/lib/sequences';

// GET /api/fees/payments/[id]/receipt — receipt PDF.
// ?duplicate=1 issues a NEW duplicate-marked receipt (audited).
export const GET = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 503);
    const url = new URL(req.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const paymentId = parts[parts.indexOf('payments') + 1] ?? '';
    const isDuplicateRequest = url.searchParams.get('duplicate') === '1';

    const payment = await db.payment.findFirst({
      where: { id: paymentId, schoolId: school.id },
      include: {
        student: { include: { classRoom: true, section: true } },
        invoice: true,
        allocations: { include: { invoice: true } },
        receipts: { orderBy: { issuedAt: 'asc' } },
      },
    });
    if (!payment) throw new ApiError('Payment not found', 404);
    if (!(await canAccessStudentFees(user, payment.studentId))) {
      return fail('You do not have permission to view this receipt', 403);
    }

    let receipt = payment.receipts[0];
    let duplicateOf: string | null = null;

    if (isDuplicateRequest) {
      if (!receipt) throw new ApiError('Original receipt missing', 404);
      const session = await db.academicSession.findFirst({ where: { schoolId: school.id, isCurrent: true } });
      const dupNumber = await nextNumberTx(db, school.id, 'RECEIPT', session?.name ?? 'SESSION', 'RCP');
      receipt = await db.receipt.create({
        data: {
          schoolId: school.id, receiptNumber: dupNumber, paymentId: payment.id,
          studentId: payment.studentId, invoiceId: payment.invoiceId,
          amount: payment.amount, issuedBy: user.id,
          isDuplicate: true, duplicateOf: payment.receipts[0].receiptNumber,
        },
      });
      duplicateOf = receipt.duplicateOf;
      await writeAudit({
        ...auditFrom(user, ip, req),
        action: 'RECEIPT_DUPLICATE',
        entityType: 'receipt',
        entityId: receipt.id,
        after: { receiptNumber: receipt.receiptNumber, original: duplicateOf },
      });
    } else if (!receipt) {
      throw new ApiError('Receipt not found', 404);
    }

    const settings = await getSchoolSettings();
    const invoiceNumbers = payment.allocations.map((a) => a.invoice.invoiceNumber).join(', ');
    const pdf = receiptPdf({
      schoolName: settings.schoolName,
      addressLine: settings.addressLine,
      city: settings.city,
      phone: settings.phonePrimary,
      email: settings.emailPrimary,
      receiptNumber: receipt.receiptNumber,
      isDuplicate: receipt.isDuplicate,
      issuedAt: receipt.issuedAt,
      studentName: `${payment.student.firstName} ${payment.student.lastName ?? ''}`.trim(),
      admissionNumber: payment.student.admissionNumber,
      className: payment.student.classRoom?.name ?? null,
      sectionName: payment.student.section?.name ?? null,
      invoiceNumber: payment.invoice?.invoiceNumber ?? invoiceNumbers ?? null,
      periodLabel: payment.invoice?.periodLabel ?? null,
      paymentMode: payment.mode,
      referenceNumber: payment.referenceNumber,
      items: payment.allocations.length
        ? payment.allocations.map((a) => ({
            description: `Fee payment — ${a.invoice.invoiceNumber}${a.invoice.periodLabel ? ` (${a.invoice.periodLabel})` : ''}`,
            amount: a.amount,
          }))
        : [{ description: payment.invoice ? `Fee payment — ${payment.invoice.invoiceNumber}` : 'Advance fee payment', amount: payment.amount }],
      total: payment.amount,
      receivedBy: user.name,
      duplicateOf,
    });
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${receipt.receiptNumber}${receipt.isDuplicate ? '-duplicate' : ''}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  },
  { permission: PERMISSIONS.FEES_PAYMENTS_READ },
);
