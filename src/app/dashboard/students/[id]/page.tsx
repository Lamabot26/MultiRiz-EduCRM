import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser, hasPermission } from '@/lib/auth-guard';
import { PERMISSIONS } from '@/lib/rbac';
import { rupees } from '@/lib/money';
import { fmtDate } from '@/lib/date-utils';
import { StudentDetailTabs } from '@/components/students/student-detail-tabs';

export const dynamic = 'force-dynamic';

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const canReadAll = hasPermission(user, PERMISSIONS.STUDENTS_READ_ALL);
  const canReadLimited = hasPermission(user, PERMISSIONS.STUDENTS_READ_LIMITED);
  if (!canReadAll && !canReadLimited) redirect('/dashboard?denied=1');

  const school = await db.school.findFirst();
  if (!school) notFound();

  const student = await db.student.findFirst({
    where: { id, schoolId: school.id, deletedAt: null },
    include: {
      academicSession: true,
      classRoom: true,
      section: true,
      guardians: { include: { guardian: true }, orderBy: { isPrimary: 'desc' } },
      approvedContacts: { include: { audits: { orderBy: { createdAt: 'desc' } } }, orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
      statusHistory: { orderBy: { changedAt: 'desc' } },
      classAssignments: {
        include: { classRoom: true, section: true, academicSession: true },
        orderBy: { assignedAt: 'desc' },
      },
    },
  });
  if (!student) notFound();

  // Soft-ref user names for audit displays.
  const userIds = [
    ...student.approvedContacts.map((c) => c.approvedBy),
    ...student.approvedContacts.flatMap((c) => c.audits.map((a) => a.performedBy)),
    ...student.statusHistory.map((h) => h.changedBy),
  ].filter((x): x is string => Boolean(x));
  const userMap = new Map(
    (await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })).map((u) => [u.id, u.name]),
  );

  // Attendance (current session summary + recent records)
  const session = student.academicSession
    ?? (await db.academicSession.findFirst({ where: { schoolId: school.id, isCurrent: true } }));
  const attendanceRecords = await db.attendanceRecord.findMany({
    where: {
      studentId: student.id,
      ...(session ? { attendanceSession: { date: { gte: session.startDate, lte: new Date(session.endDate.getTime() + 24 * 3600 * 1000) } } } : {}),
    },
    include: {
      attendanceSession: {
        include: { classRoom: { select: { name: true } }, section: { select: { name: true } } },
      },
    },
    orderBy: { attendanceSession: { date: 'desc' } },
    take: 30,
  });
  const counted = attendanceRecords.filter((r) => r.status !== 'HOLIDAY');
  const presentCount = counted.filter((r) => r.status === 'PRESENT').length;
  const percentPresent = counted.length ? Math.round((presentCount / counted.length) * 100) : null;

  // Fees (gated by fees.payments.read)
  const canSeeFees = hasPermission(user, PERMISSIONS.FEES_PAYMENTS_READ);
  let fees: {
    invoices: {
      id: string; invoiceNumber: string; periodLabel: string | null; issueDate: Date; dueDate: Date | null;
      status: string; total: number; paidTotal: number; balance: number;
    }[];
    payments: {
      id: string; amount: number; mode: string; status: string; paidAt: Date | null;
      referenceNumber: string | null; createdAt: Date;
    }[];
    outstandingLabel: string;
  } | null = null;
  if (canSeeFees) {
    const [invoices, payments] = await Promise.all([
      db.invoice.findMany({ where: { studentId: student.id }, orderBy: { issueDate: 'desc' }, take: 50 }),
      db.payment.findMany({ where: { studentId: student.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
    ]);
    const outstanding = invoices
      .filter((i) => !['PAID', 'CANCELLED', 'DRAFT'].includes(i.status))
      .reduce((sum, i) => sum + i.balance, 0);
    fees = {
      invoices: invoices.map((i) => ({
        id: i.id, invoiceNumber: i.invoiceNumber, periodLabel: i.periodLabel,
        issueDate: i.issueDate, dueDate: i.dueDate, status: i.status,
        total: i.total, paidTotal: i.paidTotal, balance: i.balance,
      })),
      payments: payments.map((p) => ({
        id: p.id, amount: p.amount, mode: p.mode, status: p.status, paidAt: p.paidAt,
        referenceNumber: p.referenceNumber, createdAt: p.createdAt,
      })),
      outstandingLabel: rupees(outstanding),
    };
  }

  return (
    <StudentDetailTabs
      perms={{
        write: hasPermission(user, PERMISSIONS.STUDENTS_WRITE),
        contacts: hasPermission(user, PERMISSIONS.STUDENTS_APPROVED_CONTACTS_MANAGE),
        documents: hasPermission(user, PERMISSIONS.STUDENTS_DOCUMENTS_MANAGE),
        fees: canSeeFees,
        attendance: hasPermission(user, PERMISSIONS.ATTENDANCE_READ) || hasPermission(user, PERMISSIONS.ATTENDANCE_MARK),
      }}
      student={{
        id: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        bloodGroup: student.bloodGroup,
        nationality: student.nationality,
        religion: student.religion,
        admissionDate: student.admissionDate,
        classId: student.classId,
        sectionId: student.sectionId,
        rollNumber: student.rollNumber,
        house: student.house,
        transportRoute: student.transportRoute,
        hostelStatus: student.hostelStatus,
        previousSchool: student.previousSchool,
        status: student.status,
        photoUrl: student.photoUrl,
        className: student.classRoom?.name ?? null,
        sectionName: student.section?.name ?? null,
        sessionName: student.academicSession?.name ?? session?.name ?? null,
        admissionDateLabel: fmtDate(student.admissionDate),
      }}
      guardians={student.guardians.map((g) => ({
        guardianId: g.guardian.id,
        fullName: g.guardian.fullName,
        relationship: g.guardian.relationship,
        mobile: g.guardian.mobile,
        email: g.guardian.email,
        occupation: g.guardian.occupation,
        isPrimary: g.isPrimary,
        isEmergencyContact: g.guardian.isEmergencyContact,
        isPrimaryContactFlag: g.guardian.isPrimaryContact,
        consentStatus: g.guardian.consentStatus,
      }))}
      approvedContacts={student.approvedContacts.map((c) => ({
        id: c.id,
        contactName: c.contactName,
        relationship: c.relationship,
        mobile: c.mobile,
        email: c.email,
        approvalStatus: c.approvalStatus,
        approvedByName: c.approvedBy ? userMap.get(c.approvedBy) ?? null : null,
        approvedAt: c.approvedAt,
        notes: c.notes,
        createdAt: c.createdAt,
        audits: c.audits.map((a) => ({
          id: a.id,
          action: a.action,
          performedByName: a.performedBy ? userMap.get(a.performedBy) ?? a.performedBy : 'System',
          createdAt: a.createdAt,
        })),
      }))}
      documents={student.documents.map((d) => ({
        id: d.id,
        docType: d.docType,
        fileName: d.fileName,
        fileUrl: d.fileUrl,
        verified: Boolean(d.verifiedAt),
        sizeBytes: d.sizeBytes,
        createdAt: d.createdAt,
      }))}
      statusHistory={student.statusHistory.map((h) => ({
        id: h.id,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        reason: h.reason,
        changedByName: h.changedBy ? userMap.get(h.changedBy) ?? h.changedBy : 'System',
        changedAt: h.changedAt,
      }))}
      classAssignments={student.classAssignments.map((ca) => ({
        id: ca.id,
        className: ca.classRoom.name,
        sectionName: ca.section?.name ?? null,
        sessionName: ca.academicSession.name,
        rollNumber: ca.rollNumber,
        isActive: ca.isActive,
        assignedAt: ca.assignedAt,
      }))}
      attendance={{
        percentPresent,
        total: counted.length,
        present: presentCount,
        recent: attendanceRecords.slice(0, 10).map((r) => ({
          id: r.id,
          date: r.attendanceSession.date,
          status: r.status,
          className: r.attendanceSession.classRoom.name,
          sessionType: r.attendanceSession.sessionType,
        })),
      }}
      fees={fees}
    />
  );
}
