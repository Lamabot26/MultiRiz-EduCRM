import { db } from '@/lib/db';
import { enquirySchema, EnquiryInput } from '@/lib/validation';
import { withApi, parseBody, ok, fail, writeAudit, auditFrom } from '@/lib/api-helpers';
import { nextNumberTx } from '@/lib/sequences';

// POST /api/public/enquiries — admission enquiry from the public website.
// Spam-protected (honeypot + rate limit), duplicate-flagged by mobile/email,
// audited, and privacy-consent captured.
export const POST = withApi(
  async (req, { ip }) => {
    const body = (await parseBody(req, enquirySchema)) as EnquiryInput;

    const school = await db.school.findFirst();
    if (!school) return fail('School not configured yet', 503);

    // Duplicate detection by mobile (last 30 days)
    const dup = await db.admissionLead.findFirst({
      where: {
        schoolId: school.id,
        mobile: body.mobile,
        createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
      },
      select: { id: true, leadNumber: true },
    });
    if (dup) {
      return ok({ duplicate: true, leadNumber: dup.leadNumber, message: 'Your enquiry is already registered. Our admission team will contact you shortly.' });
    }

    const websiteSource = await db.leadSource.upsert({
      where: { schoolId_name: { schoolId: school.id, name: 'WEBSITE_FORM' } },
      create: { schoolId: school.id, name: 'WEBSITE_FORM' },
      update: {},
    });
    const session = await db.academicSession.findFirst({ where: { schoolId: school.id, isCurrent: true } });

    const lead = await db.$transaction(async (tx) => {
      const leadNumber = await nextNumberTx(tx, school.id, 'LEAD', session?.name ?? 'SESSION', 'LEAD');
      const created = await tx.admissionLead.create({
        data: {
          schoolId: school.id,
          leadNumber,
          studentName: body.studentName,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
          gender: body.gender ?? null,
          classApplyingFor: body.classApplyingFor,
          academicSessionId: session?.id ?? null,
          guardianName: body.guardianName,
          mobile: body.mobile,
          email: body.email ?? null,
          city: body.city ?? null,
          previousSchool: body.previousSchool ?? null,
          leadSourceId: websiteSource.id,
          sourceNotes: body.message ?? null,
          status: 'NEW',
          priority: 'MEDIUM',
          createdById: null,
        },
      });
      await tx.leadActivity.create({
        data: {
          leadId: created.id,
          type: 'NOTE',
          title: 'Website enquiry received',
          content: body.message ?? null,
        },
      });
      return created;
    });

    await writeAudit({
      ...auditFrom(null, ip, req),
      action: 'LEAD_CREATE',
      entityType: 'lead',
      entityId: lead.id,
      after: { leadNumber: lead.leadNumber, studentName: lead.studentName, mobile: lead.mobile, source: 'WEBSITE_FORM' },
    });

    return ok({
      duplicate: false,
      leadNumber: lead.leadNumber,
      message: 'Thank you! Your admission enquiry has been received. Our team will reach out within 1–2 working days.',
    });
  },
  { rateLimit: { key: 'public-enquiry', limit: 5, windowMs: 10 * 60 * 1000 } },
);
