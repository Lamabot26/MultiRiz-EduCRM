import { z } from 'zod';
import { db } from '@/lib/db';
import { withApi, ok, fail, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { DOC_TYPES } from '@/lib/constants';

// =====================================================================
// /api/admissions/applications/[id]/documents
//   POST  — add a document (path must be /uploads/… or https://…)
//   PATCH — verify / unverify a document
// =====================================================================

function idFromUrl(req: Request): string {
  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const i = parts.indexOf('applications');
  return i >= 0 ? parts[i + 1] ?? '' : '';
}

async function loadScopedApplication(req: Request) {
  const id = idFromUrl(req);
  if (!id) throw new ApiError('Application id missing', 400);
  const school = await db.school.findFirst();
  if (!school) throw new ApiError('School not configured yet', 503);
  const app = await db.admissionApplication.findUnique({ where: { id } });
  if (!app || app.schoolId !== school.id) throw new ApiError('Application not found', 404);
  return app;
}

const addDocumentSchema = z.object({
  docType: z.enum(DOC_TYPES),
  fileName: z.string().min(1).max(200),
  fileUrl: z
    .string()
    .min(1)
    .max(500)
    .refine((v) => v.startsWith('/uploads/') || v.startsWith('https://'), {
      message: 'fileUrl must start with /uploads/ or https://',
    }),
  mimeType: z.string().max(100).optional().nullable(),
  sizeBytes: z.number().int().nonnegative().max(10 * 1024 * 1024, 'File must be 10 MB or smaller').optional().nullable(),
  remarks: z.string().max(300).optional().nullable(),
});

const verifySchema = z.object({
  documentId: z.string().uuid(),
  isVerified: z.boolean(),
  remarks: z.string().max(300).optional().nullable(),
});

export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const body = await req.json().then((j) => addDocumentSchema.parse(j));
    const app = await loadScopedApplication(req);

    const doc = await db.applicationDocument.create({
      data: {
        applicationId: app.id,
        docType: body.docType,
        fileName: body.fileName,
        fileUrl: body.fileUrl,
        mimeType: body.mimeType ?? null,
        sizeBytes: body.sizeBytes ?? null,
        remarks: body.remarks ?? null,
        uploadedById: user.id,
      },
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'APPLICATION_DOCUMENT_CREATE',
      entityType: 'application',
      entityId: app.id,
      after: { documentId: doc.id, docType: doc.docType, fileName: doc.fileName },
    });

    return ok({ id: doc.id }, { status: 201 });
  },
  { permission: PERMISSIONS.APPLICATIONS_MANAGE },
);

export const PATCH = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const body = await req.json().then((j) => verifySchema.parse(j));
    const app = await loadScopedApplication(req);

    const doc = await db.applicationDocument.findFirst({
      where: { id: body.documentId, applicationId: app.id },
    });
    if (!doc) throw new ApiError('Document not found', 404);
    const before = { isVerified: doc.isVerified, remarks: doc.remarks };

    const updated = await db.applicationDocument.update({
      where: { id: doc.id },
      data: {
        isVerified: body.isVerified,
        verifiedBy: body.isVerified ? user.id : null,
        verifiedAt: body.isVerified ? new Date() : null,
        remarks: body.remarks !== undefined ? body.remarks : doc.remarks,
      },
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: body.isVerified ? 'APPLICATION_DOCUMENT_VERIFY' : 'APPLICATION_DOCUMENT_UNVERIFY',
      entityType: 'application',
      entityId: app.id,
      before,
      after: { documentId: updated.id, isVerified: updated.isVerified, remarks: updated.remarks },
    });

    return ok({ id: updated.id, isVerified: updated.isVerified });
  },
  { permission: PERMISSIONS.APPLICATIONS_MANAGE },
);
