import { db } from '@/lib/db';
import { withApi, fail, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { getSchoolSettings } from '@/lib/settings';
import { invoicePdf } from '@/lib/pdf/receipt';
import { canAccessStudentFees } from '@/lib/access';

// GET /api/fees/invoices/[id]/pdf — downloadable invoice PDF.
export const GET = withApi(
  async (req, { user }) => {
    if (!user) return fail('Authentication required', 401);
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 503);
    const parts = new URL(req.url).pathname.split('/').filter(Boolean);
    const id = parts[parts.indexOf('invoices') + 1] ?? '';

    const invoice = await db.invoice.findFirst({
      where: { id, schoolId: school.id },
      include: {
        student: { include: { classRoom: true, section: true } },
        items: { orderBy: { id: 'asc' } },
      },
    });
    if (!invoice) throw new ApiError('Invoice not found', 404);
    if (!(await canAccessStudentFees(user, invoice.studentId))) {
      return fail('You do not have permission to view this invoice', 403);
    }

    const settings = await getSchoolSettings();
    const pdf = invoicePdf({
      schoolName: settings.schoolName,
      addressLine: settings.addressLine,
      city: settings.city,
      phone: settings.phonePrimary,
      email: settings.emailPrimary,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      studentName: `${invoice.student.firstName} ${invoice.student.lastName ?? ''}`.trim(),
      admissionNumber: invoice.student.admissionNumber,
      className: invoice.student.classRoom?.name ?? null,
      sectionName: invoice.student.section?.name ?? null,
      periodLabel: invoice.periodLabel,
      items: invoice.items.map((i) => ({ description: i.description, amount: i.amount })),
      subtotal: invoice.subtotal,
      lateFee: invoice.lateFeeTotal,
      total: invoice.total,
      paidTotal: invoice.paidTotal,
      balance: invoice.balance,
      status: invoice.status,
    });
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoice.invoiceNumber}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  },
  { permission: PERMISSIONS.FEES_PAYMENTS_READ },
);
