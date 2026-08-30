import { db } from '@/lib/db';
import { contactSchema } from '@/lib/validation';
import { withApi, parseBody, ok, writeAudit, auditFrom } from '@/lib/api-helpers';

// POST /api/public/contact — general contact-us submissions.
export const POST = withApi(
  async (req, { ip }) => {
    const body = await parseBody(req, contactSchema);
    const school = await db.school.findFirst();

    await db.communicationLog.create({
      data: {
        schoolId: school?.id ?? '',
        channel: 'EMAIL',
        direction: 'INBOUND',
        subject: `[Website Contact] ${body.subject}`,
        content: `From: ${body.name} <${body.email}>${body.phone ? ` Ph: ${body.phone}` : ''}\n\n${body.message}`,
        status: 'RECEIVED',
      },
    });
    await writeAudit({
      ...auditFrom(null, ip, req),
      action: 'CONTACT_FORM_SUBMIT',
      entityType: 'communication_log',
      after: { subject: body.subject, name: body.name },
    });
    return ok({ message: 'Thank you for reaching out. We will respond within 1–2 working days.' });
  },
  { rateLimit: { key: 'public-contact', limit: 5, windowMs: 10 * 60 * 1000 } },
);
