import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import {
  StickyNote, Phone, Mail, MessageCircle, MapPin, GitBranch, ArrowRight,
  CalendarClock, History, Building2, ClipboardList, UserCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { requireUser, hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS, canAny } from '@/lib/rbac';
import { db } from '@/lib/db';
import { LEAD_SOURCE_LABELS, GENDER_LABELS, CLOSED_LEAD_STATUSES } from '@/lib/constants';
import { fmtDate, fmtDateTime } from '@/lib/date-utils';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/leads/status-badge';
import {
  StageSelect, PrioritySelect, AssigneeSelect, NextFollowUpCard,
  FollowupCompleteButton, ActivityForm, VisitDialogButton, VisitStatusButtons,
  LostDialogButton, ConvertLeadButton, ConvertDisabledNote, EditLeadButton,
} from '@/components/leads/lead-detail-actions';

export const metadata: Metadata = { title: 'Lead Details' };

const ACTIVITY_ICON: Record<string, LucideIcon> = {
  NOTE: StickyNote, CALL: Phone, EMAIL: Mail, WHATSAPP: MessageCircle,
  VISIT: MapPin, STATUS_CHANGE: GitBranch, STAGE_MOVE: GitBranch,
};

const FOLLOWUP_BADGE: Record<string, string> = {
  PENDING: 'border-amber-300 bg-amber-50 text-amber-800',
  DONE: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  MISSED: 'border-red-200 bg-red-50 text-red-700',
  CANCELLED: 'border-transparent bg-muted text-muted-foreground',
};

const VISIT_BADGE: Record<string, string> = {
  SCHEDULED: 'border-purple-200 bg-purple-50 text-purple-800',
  COMPLETED: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  NO_SHOW: 'border-red-200 bg-red-50 text-red-700',
  CANCELLED: 'border-transparent bg-muted text-muted-foreground',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value ?? '—'}</p>
    </div>
  );
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const canAccessLeads = canAny(user.roles, [
    PERMISSIONS.LEADS_READ_ALL, PERMISSIONS.LEADS_READ_ASSIGNED, PERMISSIONS.LEADS_WRITE,
  ]);
  if (!canAccessLeads) redirect('/dashboard?denied=1');

  const canReadAll = hasPermission(user, PERMISSIONS.LEADS_READ_ALL);
  const canWrite = hasPermission(user, PERMISSIONS.LEADS_WRITE);
  const canAssign = hasPermission(user, PERMISSIONS.LEADS_ASSIGN);
  const canConvert = hasPermission(user, PERMISSIONS.LEADS_CONVERT);

  const { id } = await params;

  const school = await db.school.findFirst();
  if (!school) notFound();

  const lead = await db.admissionLead.findUnique({
    where: { id },
    include: {
      leadSource: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
      academicSession: { select: { id: true, name: true } },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      followups: { orderBy: { dueDate: 'asc' } },
      campusVisits: { orderBy: { scheduledAt: 'desc' } },
      applications: { select: { id: true, applicationNumber: true, status: true } },
    },
  });
  if (!lead || lead.schoolId !== school.id) notFound();

  // FRONT_DESK-style scoping: only creator or assignee may view.
  if (!canReadAll && lead.assignedTo !== user.id && lead.createdById !== user.id) {
    redirect('/dashboard?denied=1');
  }

  // Resolve performer names (LeadActivity.performedBy is a soft User ref).
  const performerIds = Array.from(
    new Set([...lead.activities.map((a) => a.performedBy), lead.createdById].filter(Boolean) as string[]),
  );
  const performers = await db.user.findMany({
    where: { id: { in: performerIds } },
    select: { id: true, name: true },
  });
  const performerName = (uid: string | null) =>
    uid ? performers.find((p) => p.id === uid)?.name ?? 'Staff' : 'System';

  const counsellors = await db.user.findMany({
    where: {
      isActive: true,
      userRoles: { some: { role: { key: { in: ['ADMISSION_COUNSELLOR', 'FRONT_DESK'] } } } },
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const sources = await db.leadSource.findMany({
    where: { schoolId: school.id, isActive: true },
    orderBy: { name: 'asc' },
  });
  const sessions = await db.academicSession.findMany({
    where: { schoolId: school.id, isActive: true },
    orderBy: { startDate: 'desc' },
  });
  const formOptions = {
    sources: sources.map((s) => ({ id: s.id, name: s.name })),
    sessions: sessions.map((s) => ({ id: s.id, name: s.name })),
    counsellors,
  };

  const isClosed = CLOSED_LEAD_STATUSES.includes(lead.status);
  const canConvertNow = canConvert && !isClosed;
  const hasApplications = lead.applications.length > 0;

  return (
    <div>
      <PageHeader
        title={`Lead: ${lead.studentName}`}
        description={`${lead.leadNumber} · created ${fmtDate(lead.createdAt)} by ${performerName(lead.createdById)}`}
        actions={
          <>
            {canWrite ? (
              <EditLeadButton
                lead={{
                  id: lead.id,
                  studentName: lead.studentName,
                  dateOfBirth: lead.dateOfBirth ? lead.dateOfBirth.toISOString() : null,
                  gender: lead.gender,
                  classApplyingFor: lead.classApplyingFor,
                  academicSessionId: lead.academicSessionId,
                  guardianName: lead.guardianName,
                  mobile: lead.mobile,
                  altMobile: lead.altMobile,
                  email: lead.email,
                  address: lead.address,
                  city: lead.city,
                  previousSchool: lead.previousSchool,
                  leadSourceId: lead.leadSourceId,
                  sourceNotes: lead.sourceNotes,
                  assignedTo: lead.assignedTo,
                  status: lead.status,
                  priority: lead.priority,
                  notes: lead.notes,
                  nextFollowUpDate: lead.nextFollowUpDate ? lead.nextFollowUpDate.toISOString() : null,
                }}
                options={formOptions}
                canAssign={canAssign || canReadAll}
              />
            ) : null}
            <Link href="/dashboard/leads" className="text-sm font-medium text-primary hover:underline">
              ← All leads
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ------------------------------ Left column ------------------------------ */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Enquiry Details</CardTitle>
                <StatusBadge status={lead.status} />
                {lead.lostReason ? (
                  <Badge variant="outline" className="max-w-[240px] truncate">Reason: {lead.lostReason}</Badge>
                ) : null}
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-3">
              <Field label="Student" value={lead.studentName} />
              <Field label="Date of Birth" value={fmtDate(lead.dateOfBirth)} />
              <Field label="Gender" value={lead.gender ? (GENDER_LABELS[lead.gender] ?? lead.gender) : null} />
              <Field label="Class Applying For" value={lead.classApplyingFor} />
              <Field label="Academic Session" value={lead.academicSession?.name} />
              <Field label="Priority" value={lead.priority} />
              <Field label="Guardian" value={lead.guardianName} />
              <Field label="Mobile" value={<a href={`tel:${lead.mobile}`} className="hover:underline">{lead.mobile}</a>} />
              <Field label="Alternate Mobile" value={lead.altMobile} />
              <Field label="Email" value={lead.email ? <a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a> : null} />
              <Field label="City" value={lead.city} />
              <Field label="Previous School" value={lead.previousSchool} />
              <Field label="Source" value={lead.leadSource ? (LEAD_SOURCE_LABELS[lead.leadSource.name] ?? lead.leadSource.name) : null} />
              <Field label="Source Notes" value={lead.sourceNotes} />
              <Field label="Address" value={lead.address} />
            </div>
            {lead.notes ? (
              <>
                <Separator className="my-4" />
                <Field label="Internal Notes" value={<span className="whitespace-pre-wrap">{lead.notes}</span>} />
              </>
            ) : null}
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="p-6">
              <CardTitle className="text-base">Stage Movement</CardTitle>
              <CardDescription className="mt-1">Every move is written to the timeline + audit log.</CardDescription>
              <div className="mt-4 space-y-3">
                {canWrite ? (
                  <StageSelect leadId={lead.id} current={lead.status} />
                ) : (
                  <StatusBadge status={lead.status} />
                )}
                {canWrite ? <PrioritySelect leadId={lead.id} current={lead.priority} /> : null}
              </div>
            </Card>

            <Card className="p-6">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheck className="h-4 w-4" /> Assignment
              </CardTitle>
              <CardDescription className="mt-1">
                {lead.assignee ? `Currently assigned to ${lead.assignee.name}.` : 'Not assigned to any counsellor yet.'}
              </CardDescription>
              <div className="mt-4">
                {canWrite || canAssign ? (
                  <AssigneeSelect leadId={lead.id} current={lead.assignedTo} counsellors={counsellors} />
                ) : (
                  <p className="text-sm">{lead.assignee?.name ?? 'Unassigned'}</p>
                )}
              </div>
            </Card>
          </div>

          {/* Activity timeline */}
          <Card className="p-6">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" /> Activity Timeline
            </CardTitle>
            <CardDescription className="mt-1">Calls, notes, emails and stage changes — newest first.</CardDescription>
            <div className="mt-4 max-h-96 overflow-y-auto pr-1">
              {lead.activities.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No activity yet — log the first call.</p>
              ) : (
                <ol className="space-y-4">
                  {lead.activities.map((a) => {
                    const Icon = ACTIVITY_ICON[a.type] ?? StickyNote;
                    return (
                      <li key={a.id} className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2">
                            <p className="text-sm font-medium">{a.title}</p>
                            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">{a.type}</Badge>
                          </div>
                          {a.content ? <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">{a.content}</p> : null}
                          {a.outcome ? (
                            <p className="mt-1 text-xs font-medium text-primary">Outcome: {a.outcome}</p>
                          ) : null}
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {performerName(a.performedBy)} · {fmtDateTime(a.createdAt)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
            {canWrite ? (
              <>
                <Separator className="my-4" />
                <ActivityForm leadId={lead.id} />
              </>
            ) : null}
          </Card>
        </div>

        {/* ------------------------------ Right column ------------------------------ */}
        <div className="space-y-4">
          <Card className="p-6">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4" /> Next Follow-up
            </CardTitle>
            {canWrite ? (
              <div className="mt-4">
                <NextFollowUpCard leadId={lead.id} nextFollowUpDate={lead.nextFollowUpDate ? lead.nextFollowUpDate.toISOString() : null} />
              </div>
            ) : (
              <p className="mt-2 text-sm">{fmtDate(lead.nextFollowUpDate)}</p>
            )}
          </Card>

          <Card className="p-6">
            <CardTitle className="text-base">Follow-ups</CardTitle>
            <CardDescription className="mt-1">Scheduled call-back tasks.</CardDescription>
            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
              {lead.followups.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No follow-ups scheduled.</p>
              ) : (
                lead.followups.map((f) => (
                  <div key={f.id} className="flex items-start justify-between gap-2 rounded-md border p-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{fmtDate(f.dueDate)}</p>
                      {f.note ? <p className="truncate text-xs text-muted-foreground">{f.note}</p> : null}
                      <Badge variant="outline" className={`mt-1 px-1.5 py-0 text-[10px] ${FOLLOWUP_BADGE[f.status] ?? ''}`}>
                        {f.status}
                      </Badge>
                    </div>
                    {f.status === 'PENDING' && canWrite ? (
                      <FollowupCompleteButton leadId={lead.id} followupId={f.id} />
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" /> Campus Visits
            </CardTitle>
            <div className="mt-3 space-y-2">
              {lead.campusVisits.length === 0 ? (
                <p className="py-2 text-center text-sm text-muted-foreground">No visits scheduled yet.</p>
              ) : (
                lead.campusVisits.map((v) => (
                  <div key={v.id} className="rounded-md border p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{fmtDateTime(v.scheduledAt)}</p>
                      <Badge variant="outline" className={`px-1.5 py-0 text-[10px] ${VISIT_BADGE[v.status] ?? ''}`}>
                        {v.status}
                      </Badge>
                    </div>
                    {v.visitorName ? <p className="mt-0.5 text-xs text-muted-foreground">Visitor: {v.visitorName}{v.visitorMobile ? ` · ${v.visitorMobile}` : ''}</p> : null}
                    {v.notes ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{v.notes}</p> : null}
                    {v.status === 'SCHEDULED' && canWrite ? (
                      <div className="mt-1.5"><VisitStatusButtons leadId={lead.id} visitId={v.id} /></div>
                    ) : null}
                  </div>
                ))
              )}
              {canWrite && !isClosed ? (
                <div className="pt-1"><VisitDialogButton leadId={lead.id} /></div>
              ) : null}
            </div>
          </Card>

          {canConvert ? (
            <Card className="p-6">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-4 w-4" /> Convert to Application
              </CardTitle>
              <CardDescription className="mt-1">
                Creates an admission application pre-filled from this lead.
              </CardDescription>
              <div className="mt-3 space-y-2">
                {hasApplications ? (
                  lead.applications.map((app) => (
                    <Link
                      key={app.id}
                      href={`/dashboard/applications/${app.id}`}
                      className="flex items-center justify-between rounded-md border p-2.5 text-sm hover:bg-muted/40"
                    >
                      <span className="font-mono text-xs">{app.applicationNumber}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        {app.status} <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  ))
                ) : null}
                {canConvertNow && !hasApplications ? (
                  <ConvertLeadButton leadId={lead.id} />
                ) : (
                  !hasApplications ? (
                    <ConvertDisabledNote />
                  ) : null
                )}
                {hasApplications ? (
                  <p className="text-xs text-muted-foreground">This lead already has an application linked above.</p>
                ) : null}
                {isClosed && !hasApplications ? (
                  <p className="text-xs text-muted-foreground">Closed leads cannot be converted.</p>
                ) : null}
              </div>
            </Card>
          ) : null}

          {canWrite && !isClosed ? (
            <Card className="p-6">
              <LostDialogButton leadId={lead.id} />
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
