import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Download, Users } from 'lucide-react';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth-guard';
import { can, PERMISSIONS } from '@/lib/rbac';
import { fmtDate } from '@/lib/date-utils';
import {
  STUDENT_STATUSES, STUDENT_STATUS_LABELS,
} from '@/lib/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { StudentsFilters } from '@/components/students/students-filters';
import { AddStudentButton } from '@/components/students/add-student-button';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

type SP = { q?: string; classId?: string; sectionId?: string; status?: string; page?: string };

function initials(first?: string | null, last?: string | null): string {
  return `${(first ?? '').charAt(0)}${(last ?? '').charAt(0)}`.toUpperCase() || 'S';
}

export default async function StudentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const canReadAll = can(user.roles, PERMISSIONS.STUDENTS_READ_ALL);
  const canReadLimited = can(user.roles, PERMISSIONS.STUDENTS_READ_LIMITED);
  if (!canReadAll && !canReadLimited) redirect('/dashboard?denied=1');
  const canWrite = can(user.roles, PERMISSIONS.STUDENTS_WRITE);

  const sp = await searchParams;
  const q = sp.q?.trim() ?? '';
  const classId = sp.classId ?? '';
  const sectionId = sp.sectionId ?? '';
  const status = sp.status ?? '';
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  const school = await db.school.findFirst();
  if (!school) return <p className="p-6 text-sm text-muted-foreground">School not configured.</p>;

  // NOTE: users with students.read.limited (teacher / front desk) see the same
  // list; financial columns are simply not part of this table, so no leak.
  const where = {
    schoolId: school.id,
    deletedAt: null,
    ...(classId ? { classId } : {}),
    ...(sectionId ? { sectionId } : {}),
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { firstName: { contains: q } },
            { middleName: { contains: q } },
            { lastName: { contains: q } },
            { admissionNumber: { contains: q } },
            { rollNumber: { contains: q } },
            { guardians: { some: { guardian: { mobile: { contains: q } } } } },
          ],
        }
      : {}),
  };

  const [rows, total, statusGroups, classRooms] = await Promise.all([
    db.student.findMany({
      where,
      include: {
        classRoom: true,
        section: true,
        guardians: { include: { guardian: true }, orderBy: { isPrimary: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    db.student.count({ where }),
    db.student.groupBy({ by: ['status'], where: { schoolId: school.id, deletedAt: null }, _count: { _all: true } }),
    db.classRoom.findMany({
      where: { schoolId: school.id },
      orderBy: { level: 'asc' },
      include: { sections: { orderBy: { name: 'asc' } } },
    }),
  ]);

  const statusCounts = new Map(statusGroups.map((g) => [g.status, g._count._all]));
  const totalActive = statusCounts.get('ACTIVE') ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageParams = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (classId) params.set('classId', classId);
    if (sectionId) params.set('sectionId', sectionId);
    if (status) params.set('status', status);
    params.set('page', String(p));
    return `/dashboard/students?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground">
            Enrolled student records, guardians and admission details.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canReadAll && (
            <Button variant="outline" asChild>
              <a
                href={`/api/students/export?${new URLSearchParams({ ...(q ? { q } : {}), ...(classId ? { classId } : {}), ...(sectionId ? { sectionId } : {}), ...(status ? { status } : {}) }).toString()}`}
              >
                <Download className="mr-2 h-4 w-4" aria-hidden /> Export CSV
              </a>
            </Button>
          )}
          {canWrite && <AddStudentButton />}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Total (non-archived)</p>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        {STUDENT_STATUSES.map((s) => (
          <Card key={s}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{STUDENT_STATUS_LABELS[s]}</p>
              <p className={`text-2xl font-bold ${s === 'ACTIVE' ? 'text-success' : ''}`}>{statusCounts.get(s) ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <StudentsFilters
        classes={classRooms.map((c) => ({
          id: c.id, name: c.name, level: c.level,
          sections: c.sections.map((s) => ({ id: s.id, name: s.name })),
        }))}
      />

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground/50" aria-hidden />
              <p className="text-sm font-medium">No students found</p>
              <p className="text-xs text-muted-foreground">
                {q || classId || sectionId || status
                  ? 'Try adjusting the filters above.'
                  : 'Admitted students will appear here.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14"><span className="sr-only">Photo</span></TableHead>
                    <TableHead>Admission #</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class – Section</TableHead>
                    <TableHead>Roll #</TableHead>
                    <TableHead>Guardian Mobile</TableHead>
                    <TableHead>Admitted On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right"><span className="sr-only">Open</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((s) => {
                    const primary = s.guardians.find((g) => g.isPrimary) ?? s.guardians[0];
                    const name = [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ');
                    return (
                      <TableRow key={s.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Avatar className="h-9 w-9">
                            {s.photoUrl && <AvatarImage src={s.photoUrl} alt={`${name} photo`} />}
                            <AvatarFallback className="text-xs font-semibold">{initials(s.firstName, s.lastName)}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-xs">{s.admissionNumber}</TableCell>
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {s.classRoom ? `${s.classRoom.name}${s.section ? ` – ${s.section.name}` : ''}` : '—'}
                        </TableCell>
                        <TableCell className="text-sm">{s.rollNumber ?? '—'}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {primary ? primary.guardian.mobile : '—'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{fmtDate(s.admissionDate)}</TableCell>
                        <TableCell>
                          <StatusBadge status={s.status} label={STUDENT_STATUS_LABELS[s.status] ?? s.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/students/${s.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} students
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
              {page > 1 ? <Link href={pageParams(page - 1)}>Previous</Link> : <span>Previous</span>}
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
              {page < totalPages ? <Link href={pageParams(page + 1)}>Next</Link> : <span>Next</span>}
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
