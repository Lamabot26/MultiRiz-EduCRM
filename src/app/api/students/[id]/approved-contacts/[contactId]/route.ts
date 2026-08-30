import { db } from '@/lib/db';
import { ok, fail, withApi, parseBody, auditFrom, writeAudit, ApiError } from '@/lib/api-helpers';
import { hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { approvedContactDecisionSchema } from '@/lib/validation';

// =====================================================================
// PATCH  /api/students/[id]/approved-contacts/[contactId]
//        decision: APPROVED | REJECTED | REVOKED (sets approvedBy/at).
// DELETE — soft removal: status → REVOKED, never a hard delete.
// Every change writes BOTH an ApprovedContactAudit row AND an AuditLog.
// Audited: APPROVED_CONTACT_DECISION | APPROVED_CONTACT_REMOVED
// =====================================================================

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string; contactId: string }> }) {
  const { id, contactId } = await ctx.params;
  return withApi(
    async (r, { user, ip }) => {
      if (!user) return fail('Authentication required', 401);
      if (!hasPermission(user, PERMISSIONS.STUDENTS_APPROVED_CONTACTS_MANAGE)) {
        return fail('You do not have permission to perform this action', 403);
      }
      const school = await db.school.findFirst();
      if (!school) throw new ApiError('School not configured', 500);

      const contact = await db.approvedContact.findFirst({
        where: { id: contactId, studentId: id, student: { schoolId: school.id } },
      });
      if (!contact) throw new ApiError('Approved contact not found', 404);

      const body = await parseBody(r, approvedContactDecisionSchema);
      const before = { approvalStatus: contact.approvalStatus, notes: contact.notes };

      const updated = await db.approvedContact.update({
        where: { id: contact.id },
        data: {
          approvalStatus: body.approvalStatus,
          approvedBy: user.id,
          approvedAt: new Date(),
          notes: body.notes ?? contact.notes,
        },
      });

      const after = {
        contactName: updated.contactName,
        relationship: updated.relationship,
        mobile: updated.mobile,
        approvalStatus: updated.approvalStatus,
        notes: updated.notes,
      };

      await db.approvedContactAudit.create({
        data: {
          approvedContactId: contact.id,
          action: body.approvalStatus, // APPROVED | REJECTED | REVOKED
          beforeData: JSON.stringify(before),
          afterData: JSON.stringify(after),
          performedBy: user.id,
          performedByRole: user.roles[0] ?? null,
        },
      });

      await writeAudit({
        ...auditFrom(user, ip, r),
        action: 'APPROVED_CONTACT_DECISION',
        entityType: 'approved_contact',
        entityId: contact.id,
        before: { ...before, studentId: id },
        after,
      });

      return ok(updated);
    },
  )(req);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string; contactId: string }> }) {
  const { id, contactId } = await ctx.params;
  return withApi(
    async (r, { user, ip }) => {
      if (!user) return fail('Authentication required', 401);
      if (!hasPermission(user, PERMISSIONS.STUDENTS_APPROVED_CONTACTS_MANAGE)) {
        return fail('You do not have permission to perform this action', 403);
      }
      const school = await db.school.findFirst();
      if (!school) throw new ApiError('School not configured', 500);

      const contact = await db.approvedContact.findFirst({
        where: { id: contactId, studentId: id, student: { schoolId: school.id } },
      });
      if (!contact) throw new ApiError('Approved contact not found', 404);

      // Soft delete only — records stay for the immutable audit trail.
      const updated = await db.approvedContact.update({
        where: { id: contact.id },
        data: { approvalStatus: 'REVOKED' },
      });

      const after = {
        contactName: updated.contactName,
        relationship: updated.relationship,
        mobile: updated.mobile,
        approvalStatus: updated.approvalStatus,
      };

      await db.approvedContactAudit.create({
        data: {
          approvedContactId: contact.id,
          action: 'REMOVED',
          beforeData: JSON.stringify({ approvalStatus: contact.approvalStatus }),
          afterData: JSON.stringify(after),
          performedBy: user.id,
          performedByRole: user.roles[0] ?? null,
        },
      });

      await writeAudit({
        ...auditFrom(user, ip, r),
        action: 'APPROVED_CONTACT_REMOVED',
        entityType: 'approved_contact',
        entityId: contact.id,
        before: { approvalStatus: contact.approvalStatus, studentId: id },
        after,
      });

      return ok({ id: updated.id, approvalStatus: updated.approvalStatus });
    },
  )(req);
}
