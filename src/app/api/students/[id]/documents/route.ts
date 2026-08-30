import { db } from '@/lib/db';
import { ok, fail, withApi, parseBody, auditFrom, writeAudit, ApiError } from '@/lib/api-helpers';
import { hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { studentDocumentSchema } from '@/lib/validation';

// =====================================================================
// POST   /api/students/[id]/documents — add document (students.documents.manage)
//        fileUrl must be /uploads/... or https://... ; sizeBytes ≤ 10 MB.
// DELETE /api/students/[id]/documents?docId= — hard delete (allowed for
//        documents) + audit.
// Audited: STUDENT_DOCUMENT_CREATE | STUDENT_DOCUMENT_DELETE
// =====================================================================

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApi(
    async (r, { user, ip }) => {
      if (!user) return fail('Authentication required', 401);
      if (!hasPermission(user, PERMISSIONS.STUDENTS_DOCUMENTS_MANAGE)) {
        return fail('You do not have permission to perform this action', 403);
      }
      const school = await db.school.findFirst();
      if (!school) throw new ApiError('School not configured', 500);
      const student = await db.student.findFirst({ where: { id, schoolId: school.id, deletedAt: null } });
      if (!student) throw new ApiError('Student not found', 404);

      const body = await parseBody(r, studentDocumentSchema);

      const url = body.fileUrl.trim();
      if (!(url.startsWith('/uploads/') || url.startsWith('https://'))) {
        throw new ApiError('fileUrl must start with /uploads/ or https://', 422);
      }

      const doc = await db.studentDocument.create({
        data: {
          studentId: student.id,
          docType: body.docType,
          fileName: body.fileName,
          fileUrl: url,
          mimeType: body.mimeType ?? null,
          sizeBytes: body.sizeBytes ?? null,
          notes: body.notes ?? null,
          uploadedBy: user.id,
        },
      });

      await writeAudit({
        ...auditFrom(user, ip, r),
        action: 'STUDENT_DOCUMENT_CREATE',
        entityType: 'student',
        entityId: student.id,
        after: { docId: doc.id, docType: doc.docType, fileName: doc.fileName, fileUrl: doc.fileUrl },
      });

      return ok(doc, { status: 201 });
    },
  )(req);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withApi(
    async (r, { user, ip }) => {
      if (!user) return fail('Authentication required', 401);
      if (!hasPermission(user, PERMISSIONS.STUDENTS_DOCUMENTS_MANAGE)) {
        return fail('You do not have permission to perform this action', 403);
      }
      const school = await db.school.findFirst();
      if (!school) throw new ApiError('School not configured', 500);
      const student = await db.student.findFirst({ where: { id, schoolId: school.id, deletedAt: null } });
      if (!student) throw new ApiError('Student not found', 404);

      const docId = new URL(r.url).searchParams.get('docId');
      if (!docId) throw new ApiError('docId query parameter is required', 422);

      const doc = await db.studentDocument.findFirst({ where: { id: docId, studentId: student.id } });
      if (!doc) throw new ApiError('Document not found', 404);

      await db.studentDocument.delete({ where: { id: doc.id } });

      await writeAudit({
        ...auditFrom(user, ip, r),
        action: 'STUDENT_DOCUMENT_DELETE',
        entityType: 'student',
        entityId: student.id,
        before: { docId: doc.id, docType: doc.docType, fileName: doc.fileName, fileUrl: doc.fileUrl },
      });

      return ok({ deleted: true, id: doc.id });
    },
  )(req);
}
