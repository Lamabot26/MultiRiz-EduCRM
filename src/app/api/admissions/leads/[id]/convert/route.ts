import { db } from '@/lib/db';
import { withApi, ok, fail, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { leadConvertSchema } from '@/lib/validation';
import { nextNumberTx } from '@/lib/sequences';
import { CLOSED_LEAD_STATUSES } from '@/lib/constants';

// =====================================================================
// /api/admissions/leads/[id]/convert — create an AdmissionApplication
// from a lead (permission leads.convert). Idempotent: returns the
// existing application when one is already linked.
// =====================================================================

function idFromUrl(req: Request): string {
  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const i = parts.indexOf('leads');
  return i >= 0 ? parts[i + 1] ?? '' : '';
}

export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);

    // Body is optional; allows class override + pending-docs note.
    const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const body = leadConvertSchema.parse(raw ?? {});

    const id = idFromUrl(req);
    if (!id) throw new ApiError('Lead id missing', 400);
    const school = await db.school.findFirst();
    if (!school) return fail('School not configured yet', 503);
    const lead = await db.admissionLead.findUnique({ where: { id } });
    if (!lead || lead.schoolId !== school.id) throw new ApiError('Lead not found', 404);
    if (CLOSED_LEAD_STATUSES.includes(lead.status)) {
      throw new ApiError('Closed leads cannot be converted', 422);
    }

    // Idempotency — reuse an existing application for this lead.
    const existing = await db.admissionApplication.findFirst({
      where: { leadId: lead.id },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      return ok({ applicationId: existing.id, applicationNumber: existing.applicationNumber, reused: true });
    }

    const session =
      (lead.academicSessionId
        ? await db.academicSession.findFirst({ where: { id: lead.academicSessionId } })
        : null) ??
      (await db.academicSession.findFirst({ where: { schoolId: school.id, isCurrent: true } }));
    if (!session) throw new ApiError('No academic session configured — set one up in Settings first', 422);
    const sessionLabel = session.name;

    const classApplyingFor = body.classApplyingFor || lead.classApplyingFor;
    if (!classApplyingFor) throw new ApiError('Class applying for is required to convert', 422);

    const result = await db.$transaction(async (tx) => {
      const applicationNumber = await nextNumberTx(tx, school.id, 'APPLICATION', sessionLabel, 'APP');
      const application = await tx.admissionApplication.create({
        data: {
          schoolId: school.id,
          applicationNumber,
          leadId: lead.id,
          academicSessionId: session.id,
          classApplyingFor,
          studentName: lead.studentName,
          dateOfBirth: lead.dateOfBirth,
          gender: lead.gender,
          guardianName: lead.guardianName,
          mobile: lead.mobile,
          email: lead.email,
          address: lead.address,
          previousSchool: lead.previousSchool,
          status: 'SUBMITTED',
          submittedAt: new Date(),
          createdById: user.id,
        },
      });
      await tx.admissionLead.update({
        where: { id: lead.id },
        data: {
          status: 'APPLICATION_SUBMITTED',
          lastActivityAt: new Date(),
          ...(body.documentsPending && body.documentsPending.length > 0
            ? { notes: `${lead.notes ? lead.notes + '\n' : ''}Pending docs: ${body.documentsPending.join(', ')}` }
            : {}),
        },
      });
      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: 'STAGE_MOVE',
          title: `Converted to application ${applicationNumber}`,
          content: 'Application created from lead; status moved to Application Submitted.',
          performedBy: user.id,
        },
      });
      return application;
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'LEAD_CONVERT',
      entityType: 'lead',
      entityId: lead.id,
      before: { status: lead.status },
      after: { applicationId: result.id, applicationNumber: result.applicationNumber, leadStatus: 'APPLICATION_SUBMITTED' },
    });

    return ok({ applicationId: result.id, applicationNumber: result.applicationNumber }, { status: 201 });
  },
  { permission: PERMISSIONS.LEADS_CONVERT },
);
