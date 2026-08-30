import { db } from '@/lib/db';
import { ok, fail, withApi, parseBody, auditFrom, writeAudit, ApiError } from '@/lib/api-helpers';
import { hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { approvedContactSchema } from '@/lib/validation';

// =====================================================================
// GET  /api/students/[id]/approved-contacts — list with audit trail
//      (students.approved_contacts.manage).
// POST — add a contact in PENDING state. EVERY change writes BOTH an
//      ApprovedContactAudit row AND an AuditLog row.
// Audited: APPROVED_CONTACT_CREATE (+ audit row CREATED)
// =====================================================================

async function requireStudent(id: string) {
  const school = await db.school.findFirst();
  if (!school) throw new ApiError('School not configured', 500);
  const student = await db.student.findFirst({ where: { id, schoolId: school.id, deletedAt: null } });
  if (!student) throw new ApiError('Student not found', 404);
  return student;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApi(
    async (_r, { user }) => {
      if (!user) return fail('Authentication required', 401);
      if (!hasPermission(user, PERMISSIONS.STUDENTS_APPROVED_CONTACTS_MANAGE)) {
        return fail('You do not have permission to perform this action', 403);
      }
      await requireStudent(id);
      const contacts = await db.approvedContact.findMany({
        where: { studentId: id },
        include: { audits: { orderBy: { createdAt: 'desc' } } },
        orderBy: { createdAt: 'desc' },
      });
      return ok(contacts);
    },
  )(req);
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApi(
    async (r, { user, ip }) => {
      if (!user) return fail('Authentication required', 401);
      if (!hasPermission(user, PERMISSIONS.STUDENTS_APPROVED_CONTACTS_MANAGE)) {
        return fail('You do not have permission to perform this action', 403);
      }
      const student = await requireStudent(id);
      const body = await parseBody(r, approvedContactSchema);

      const contact = await db.approvedContact.create({
        data: {
          studentId: student.id,
          contactName: body.contactName,
          relationship: body.relationship,
          mobile: body.mobile,
          email: body.email ?? null,
          approvalStatus: 'PENDING',
          notes: body.notes ?? null,
          createdById: user.id,
        },
      });

      const after = {
        contactName: contact.contactName,
        relationship: contact.relationship,
        mobile: contact.mobile,
        email: contact.email,
        approvalStatus: contact.approvalStatus,
        notes: contact.notes,
      };

      // Immutable, append-only audit trail (ApprovedContactAudit)
      await db.approvedContactAudit.create({
        data: {
          approvedContactId: contact.id,
          action: 'CREATED',
          beforeData: null,
          afterData: JSON.stringify(after),
          performedBy: user.id,
          performedByRole: user.roles[0] ?? null,
        },
      });

      // System-wide audit log
      await writeAudit({
        ...auditFrom(user, ip, r),
        action: 'APPROVED_CONTACT_CREATE',
        entityType: 'approved_contact',
        entityId: contact.id,
        after: { ...after, studentId: student.id },
      });

      return ok(contact, { status: 201 });
    },
  )(req);
}
