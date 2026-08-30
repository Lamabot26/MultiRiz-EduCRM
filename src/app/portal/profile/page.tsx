import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { getParentStudentIds, getOwnStudentId } from '@/lib/access';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fmtDate } from '@/lib/date-utils';
import { RELATIONSHIP_LABELS, APPROVAL_STATUSES } from '@/lib/constants';
import { ProfileUpdateRequestForm } from '@/components/portal/profile-update-form';
import { UserRound, ShieldCheck } from 'lucide-react';

export const metadata = { title: 'Profile' };

export default async function PortalProfilePage() {
  const user = await requireUser();
  const school = await db.school.findFirst();

  let studentIds: string[] = [];
  if (user.roles.includes('PARENT')) studentIds = await getParentStudentIds(user.id);
  else if (user.roles.includes('STUDENT')) {
    const own = await getOwnStudentId(user.id);
    if (own) studentIds = [own];
  }

  const students = studentIds.length
    ? await db.student.findMany({
        where: { id: { in: studentIds } },
        include: {
          classRoom: true, section: true,
          guardians: { include: { guardian: true } },
          approvedContacts: true,
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold md:text-2xl">Profile & Records</h1>
        <p className="text-sm text-muted-foreground">Review linked student records, approved contacts, and request corrections.</p>
      </div>

      {students.map((s) => {
        const guardian = s.guardians.find((g) => g.guardian.userId === user.id)?.guardian;
        return (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserRound className="h-4 w-4 text-primary" />
                {s.firstName} {s.lastName ?? ''} — {s.classRoom?.name ?? ''} {s.section ? `- ${s.section.name}` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <p><span className="text-muted-foreground">Admission No:</span> {s.admissionNumber}</p>
                <p><span className="text-muted-foreground">Date of birth:</span> {s.dateOfBirth ? fmtDate(s.dateOfBirth) : '—'}</p>
                {guardian && (
                  <>
                    <p><span className="text-muted-foreground">Registered {RELATIONSHIP_LABELS[guardian.relationship] ?? guardian.relationship}:</span> {guardian.fullName}</p>
                    <p><span className="text-muted-foreground">Contact:</span> {guardian.mobile?.replace(/\d(?=\d{4})/g, '•') ?? '—'}</p>
                  </>
                )}
              </div>

              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-success" /> Approved contacts (verified by school office)</p>
                <div className="flex flex-wrap gap-2">
                  {s.approvedContacts.map((c) => (
                    <Badge key={c.id} variant={c.approvalStatus === 'APPROVED' ? 'default' : 'secondary'} className="px-3 py-1.5">
                      {c.contactName} ({RELATIONSHIP_LABELS[c.relationship] ?? c.relationship}) · {c.mobile} · {c.approvalStatus}
                    </Badge>
                  ))}
                  {s.approvedContacts.length === 0 && <p className="text-xs text-muted-foreground">No approved contacts on record.</p>}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Only school-approved contacts are authorised for pickup and phone-calling. Changes are verified at the office counter with ID proof.
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {students.length === 0 && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No student records linked to your account. Please contact the school office.</CardContent></Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request a profile correction</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            For data safety, changes to contact details are verified by the school office before being applied.
            Submit a request and the office will verify and update the record (every change is audited).
          </p>
          <ProfileUpdateRequestForm />
        </CardContent>
      </Card>
    </div>
  );
}
