import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import {
  FileText, CheckCircle2, ClipboardList, ArrowRight, FileCheck2, UserRound,
} from 'lucide-react';
import { requireUser, hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { db } from '@/lib/db';
import { GENDER_LABELS, APPLICATION_STATUS_LABELS } from '@/lib/constants';
import { fmtDate, fmtDateTime } from '@/lib/date-utils';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ApplicationStatusBadge } from '@/components/leads/status-badge';
import {
  ApplicationStatusSelect, AddDocumentDialog, DocumentVerifyCheckbox,
  DecisionButtons, ConvertToStudentButton,
} from '@/components/applications/application-detail-actions';

export const metadata: Metadata = { title: 'Application Details' };

const DOC_TYPE_LABELS_LOCAL: Record<string, string> = {
  BIRTH_CERTIFICATE: 'Birth Certificate', TRANSFER_CERTIFICATE: 'Transfer Certificate',
  REPORT_CARD: 'Previous Report Card', ADDRESS_PROOF: 'Address Proof', PHOTO: 'Photograph',
  AADHAAR: 'Aadhaar Card', INCOME_CERTIFICATE: 'Income Certificate',
  CASTE_CERTIFICATE: 'Caste Certificate', OTHER: 'Other',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value ?? '—'}</p>
    </div>
  );
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!hasPermission(user, PERMISSIONS.APPLICATIONS_MANAGE)) redirect('/dashboard?denied=1');

  const { id } = await params;
  const school = await db.school.findFirst();
  if (!school) notFound();

  const app = await db.admissionApplication.findUnique({
    where: { id },
    include: {
      documents: { orderBy: { createdAt: 'asc' } },
      decisions: { orderBy: { decidedAt: 'desc' } },
      lead: { select: { id: true, leadNumber: true, studentName: true } },
      academicSession: { select: { name: true } },
    },
  });
  if (!app || app.schoolId !== school.id) notFound();

  const verifiedDocs = app.documents.filter((d) => d.isVerified).length;
  const isTerminal = app.status === 'ACCEPTED' || app.status === 'REJECTED' || app.status === 'WITHDRAWN';
  const canDecide = !isTerminal;
  const converted = Boolean(app.convertedStudentId);

  return (
    <div>
      <PageHeader
        title={`Application: ${app.studentName}`}
        description={`${app.applicationNumber} · ${app.classApplyingFor} · Session ${app.academicSession?.name ?? '—'}`}
        actions={
          <>
            {app.lead ? (
              <Link href={`/dashboard/leads/${app.lead.id}`} className="text-sm text-primary hover:underline">
                ← Lead {app.lead.leadNumber}
              </Link>
            ) : null}
            <Link href="/dashboard/applications" className="text-sm font-medium text-primary hover:underline">
              ← All applications
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Info */}
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Application Details</CardTitle>
                <ApplicationStatusBadge status={app.status} />
              </div>
              <ApplicationStatusSelect applicationId={app.id} current={app.status} />
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-3">
              <Field label="Student" value={app.studentName} />
              <Field label="Date of Birth" value={fmtDate(app.dateOfBirth)} />
              <Field label="Gender" value={app.gender ? (GENDER_LABELS[app.gender] ?? app.gender) : null} />
              <Field label="Class Applying For" value={app.classApplyingFor} />
              <Field label="Guardian" value={app.guardianName} />
              <Field label="Mobile" value={<a href={`tel:${app.mobile}`} className="hover:underline">{app.mobile}</a>} />
              <Field label="Email" value={app.email} />
              <Field label="Previous School" value={app.previousSchool} />
              <Field label="Address" value={app.address} />
              <Field label="Submitted" value={fmtDateTime(app.submittedAt)} />
              <Field label="Created" value={fmtDate(app.createdAt)} />
            </div>
          </Card>

          {/* Document checklist */}
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" /> Document Checklist
                </CardTitle>
                <CardDescription className="mt-1">
                  {app.documents.length === 0
                    ? 'No documents recorded yet.'
                    : `${verifiedDocs}/${app.documents.length} verified.`}
                </CardDescription>
              </div>
              <AddDocumentDialog applicationId={app.id} />
            </div>
            <Separator className="my-4" />
            {app.documents.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Add the birth certificate, transfer certificate, report card etc. as they arrive.
              </p>
            ) : (
              <ul className="space-y-2">
                {app.documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <DocumentVerifyCheckbox applicationId={app.id} documentId={d.id} isVerified={d.isVerified} />
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                          {DOC_TYPE_LABELS_LOCAL[d.docType] ?? d.docType}
                          {d.isVerified ? (
                            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 px-1.5 py-0 text-[10px] text-emerald-800">
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-300 bg-amber-50 px-1.5 py-0 text-[10px] text-amber-800">
                              Pending
                            </Badge>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {d.fileName} ·{' '}
                          <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            open file
                          </a>
                          {d.remarks ? ` · ${d.remarks}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(d.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Decision timeline */}
          <Card className="p-6">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" /> Decision Timeline
            </CardTitle>
            <CardDescription className="mt-1">Every offer / reject / waitlist decision with remarks.</CardDescription>
            <div className="mt-4 max-h-64 overflow-y-auto pr-1">
              {app.decisions.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No decisions recorded yet.</p>
              ) : (
                <ol className="space-y-3">
                  {app.decisions.map((dec) => (
                    <li key={dec.id} className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        dec.decision === 'OFFER' ? 'bg-yellow-100 text-yellow-800'
                        : dec.decision === 'REJECT' ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-800'}`}>
                        <FileCheck2 className="h-4 w-4" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {dec.decision === 'OFFER' ? 'Offer made' : dec.decision === 'REJECT' ? 'Rejected' : 'Waitlisted'}
                        </p>
                        {dec.remarks ? <p className="text-sm text-muted-foreground">{dec.remarks}</p> : null}
                        <p className="mt-0.5 text-xs text-muted-foreground">{fmtDateTime(dec.decidedAt)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card className="p-6">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" /> Admission Decision
            </CardTitle>
            <CardDescription className="mt-1">
              Records an AdmissionDecision and moves the application status.
            </CardDescription>
            <div className="mt-4">
              <DecisionButtons applicationId={app.id} disabled={!canDecide} />
              {isTerminal ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Status “{APPLICATION_STATUS_LABELS[app.status] ?? app.status}” — decisions are closed.
                </p>
              ) : null}
            </div>
          </Card>

          <Card className="p-6">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4" /> Enrolment
            </CardTitle>
            <CardDescription className="mt-1">
              Convert an accepted application into an active student with an auto admission number.
            </CardDescription>
            <div className="mt-4">
              {converted && app.convertedStudentId ? (
                <Link
                  href={`/dashboard/students/${app.convertedStudentId}`}
                  className="flex items-center justify-between rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 hover:bg-emerald-100"
                >
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> View student record</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : app.status === 'ACCEPTED' ? (
                <ConvertToStudentButton applicationId={app.id} />
              ) : (
                <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                  Mark the application <strong>ACCEPTED</strong> (after an offer) to enable conversion.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
