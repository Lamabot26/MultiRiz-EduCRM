import { db } from '@/lib/db';
import { withApi, ok, fail, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS, canAny } from '@/lib/rbac';
import { hasPermission, type AuthUser } from '@/lib/auth-guard';
import { leadUpdateSchema } from '@/lib/validation';
import { LEAD_STATUS_LABELS } from '@/lib/constants';
import type { Prisma } from '@prisma/client';

// =====================================================================
// /api/admissions/leads/[id] — GET detail + PATCH partial update.
// NOTE: `withApi` forwards only the Request, so the dynamic id is taken
// from the URL path (robust for this fixed /api/admissions/leads/:id/…
// route family).
// =====================================================================

function idFromUrl(req: Request): string {
  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const i = parts.indexOf('leads');
  return i >= 0 ? parts[i + 1] ?? '' : '';
}

async function loadScopedLead(req: Request, user: AuthUser) {
  const id = idFromUrl(req);
  if (!id) throw new ApiError('Lead id missing', 400);
  const school = await db.school.findFirst();
  if (!school) throw new ApiError('School not configured yet', 503);
  const lead = await db.admissionLead.findUnique({ where: { id } });
  if (!lead || lead.schoolId !== school.id) throw new ApiError('Lead not found', 404);
  // Scope: users without leads.read.all may only touch their own leads.
  if (
    !hasPermission(user, PERMISSIONS.LEADS_READ_ALL) &&
    lead.assignedTo !== user.id &&
    lead.createdById !== user.id
  ) {
    throw new ApiError('You do not have permission to modify this lead', 403);
  }
  return lead;
}

// GET — full detail incl. activities, followups, visits, applications.
export const GET = withApi(async (req, { user }) => {
  if (!user) return fail('Authentication required', 401);
  if (!canAny(user.roles, [PERMISSIONS.LEADS_READ_ALL, PERMISSIONS.LEADS_READ_ASSIGNED, PERMISSIONS.LEADS_WRITE])) {
    return fail('You do not have permission to perform this action', 403);
  }
  const lead = await loadScopedLead(req, user);
  const full = await db.admissionLead.findUnique({
    where: { id: lead.id },
    include: {
      leadSource: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
      academicSession: { select: { id: true, name: true } },
      activities: { orderBy: { createdAt: 'desc' }, take: 100 },
      followups: { orderBy: { dueDate: 'asc' } },
      campusVisits: { orderBy: { scheduledAt: 'desc' } },
      applications: { select: { id: true, applicationNumber: true, status: true } },
    },
  });
  return ok(full);
});

// PATCH — update fields. Status changes create a STATUS_CHANGE activity and
// bump lastActivityAt. A pure-assignment change only needs leads.assign.
export const PATCH = withApi(async (req, { user, ip }) => {
  if (!user) return fail('Authentication required', 401);

  const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw) throw new ApiError('Invalid JSON body', 400);
  const body = leadUpdateSchema.parse(raw);

  const keys = Object.keys(body);
  if (keys.length === 0) throw new ApiError('Nothing to update', 400);

  const assignmentOnly = keys.every((k) => k === 'assignedTo');
  const canWrite = hasPermission(user, PERMISSIONS.LEADS_WRITE);
  const canAssign = hasPermission(user, PERMISSIONS.LEADS_ASSIGN);
  if (assignmentOnly ? !(canWrite || canAssign) : !canWrite) {
    return fail('You do not have permission to perform this action', 403);
  }

  const lead = await loadScopedLead(req, user);
  const before = {
    status: lead.status, priority: lead.priority, assignedTo: lead.assignedTo,
    nextFollowUpDate: lead.nextFollowUpDate, lostReason: lead.lostReason,
  };

  // Resolve assignment target when present
  let assignedTo: string | null | undefined;
  if ('assignedTo' in body) {
    if (body.assignedTo) {
      const assignee = await db.user.findFirst({ where: { id: body.assignedTo, isActive: true } });
      if (!assignee) throw new ApiError('Counsellor not found', 422);
      assignedTo = assignee.id;
    } else {
      assignedTo = null;
    }
  }

  const statusChanged = Boolean(body.status && body.status !== lead.status);
  const data = {
    studentName: body.studentName,
    dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : body.dateOfBirth === null ? null : undefined,
    gender: 'gender' in body ? (body.gender ?? null) : undefined,
    classApplyingFor: 'classApplyingFor' in body ? (body.classApplyingFor ?? null) : undefined,
    academicSessionId: 'academicSessionId' in body ? (body.academicSessionId ?? null) : undefined,
    guardianName: body.guardianName,
    mobile: body.mobile,
    altMobile: 'altMobile' in body ? (body.altMobile ?? null) : undefined,
    email: 'email' in body ? (body.email ?? null) : undefined,
    address: 'address' in body ? (body.address ?? null) : undefined,
    city: 'city' in body ? (body.city ?? null) : undefined,
    previousSchool: 'previousSchool' in body ? (body.previousSchool ?? null) : undefined,
    leadSourceId: 'leadSourceId' in body ? (body.leadSourceId ?? null) : undefined,
    sourceNotes: 'sourceNotes' in body ? (body.sourceNotes ?? null) : undefined,
    assignedTo,
    status: body.status,
    priority: body.priority,
    notes: 'notes' in body ? (body.notes ?? null) : undefined,
    nextFollowUpDate: body.nextFollowUpDate ? new Date(body.nextFollowUpDate) : body.nextFollowUpDate === null ? null : undefined,
    lostReason: 'lostReason' in body ? (body.lostReason ?? null) : undefined,
    lastActivityAt: statusChanged ? new Date() : undefined,
  };
  // Drop undefined keys (Prisma treats undefined as "don't touch").
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined),
  ) as Prisma.AdmissionLeadUpdateInput;

  const updated = await db.$transaction(async (tx) => {
    const row = await tx.admissionLead.update({ where: { id: lead.id }, data: cleanData });
    if (statusChanged) {
      const from = LEAD_STATUS_LABELS[lead.status] ?? lead.status;
      const to = LEAD_STATUS_LABELS[body.status!] ?? body.status;
      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: 'STATUS_CHANGE',
          title: `Status: ${from} → ${to}`,
          content: body.lostReason ?? undefined,
          performedBy: user.id,
        },
      });
    }
    return row;
  });

  const after = {
    status: updated.status, priority: updated.priority, assignedTo: updated.assignedTo,
    nextFollowUpDate: updated.nextFollowUpDate, lostReason: updated.lostReason,
  };

  await writeAudit({
    ...auditFrom(user, ip, req),
    action: statusChanged ? 'LEAD_STATUS_CHANGE' : 'LEAD_UPDATE',
    entityType: 'lead',
    entityId: lead.id,
    before,
    after,
  });

  return ok({ id: updated.id, status: updated.status, leadNumber: updated.leadNumber });
});
