import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth-guard';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { rupees } from '@/lib/money';
import { fmtDate } from '@/lib/date-utils';
import { StructureFormDialog } from '@/components/fees/structure-form-dialog';
import { AssignStructureDialog } from '@/components/fees/assign-structure-dialog';
import { Receipt, Layers, Users } from 'lucide-react';

export const metadata = { title: 'Fee Structures' };

export default async function FeeStructuresPage() {
  const user = await requirePermission('fees.structures.manage');
  const school = await db.school.findFirst();
  if (!school) return <p className="p-6 text-muted-foreground">School not configured.</p>;

  const [structures, classes, sessions, components] = await Promise.all([
    db.feeStructure.findMany({
      where: { schoolId: school.id },
      include: {
        classRoom: true, academicSession: true,
        items: { include: { feeComponent: true } },
        studentAssignments: { select: { id: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    }),
    db.classRoom.findMany({ where: { schoolId: school.id, isActive: true }, include: { sections: true }, orderBy: { level: 'asc' } }),
    db.academicSession.findMany({ where: { schoolId: school.id }, orderBy: { name: 'desc' } }),
    db.feeComponent.findMany({ where: { schoolId: school.id, isActive: true } }),
  ]);

  const statusBadge = (s: string) =>
    s === 'ACTIVE' ? <Badge className="text-success bg-success/10">Active</Badge>
    : s === 'DRAFT' ? <Badge variant="outline">Draft</Badge>
    : <Badge variant="secondary">Archived</Badge>;

  return (
    <div>
      <PageHeader
        title="Fee Structures"
        description="Define per-class fee components, amounts, frequencies and due days for each academic session."
        actions={
          <StructureFormDialog
            classes={classes.map((c) => ({ id: c.id, name: c.name }))}
            sessions={sessions.map((s) => ({ id: s.id, name: s.name }))}
            components={components.map((c) => ({ id: c.id, code: c.code, name: c.name }))}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3"><Layers className="h-8 w-8 text-primary/40" /><div><p className="text-2xl font-bold">{structures.length}</p><p className="text-xs text-muted-foreground">Structures</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Receipt className="h-8 w-8 text-accent/50" /><div><p className="text-2xl font-bold">{structures.filter((s) => s.status === 'ACTIVE').length}</p><p className="text-xs text-muted-foreground">Active</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Users className="h-8 w-8 text-primary/40" /><div><p className="text-2xl font-bold">{structures.reduce((s, x) => s + x.studentAssignments.length, 0)}</p><p className="text-xs text-muted-foreground">Student assignments</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">All structures</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Structure</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Components</TableHead>
                  <TableHead className="text-right">Per-period total</TableHead>
                  <TableHead>Effective</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Assignments</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {structures.map((st) => (
                  <TableRow key={st.id}>
                    <TableCell className="font-medium">{st.name}</TableCell>
                    <TableCell>{st.classRoom.name}</TableCell>
                    <TableCell>{st.academicSession.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {st.items.map((it) => (
                          <span key={it.id} className="text-xs rounded bg-muted px-1.5 py-0.5">
                            {it.feeComponent.name} ₹{(it.amount / 100).toLocaleString('en-IN')}/{(it.installmentCount || 1) > 1 ? `÷${it.installmentCount}` : it.frequency.toLowerCase()}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{rupees(st.totalAmount)}</TableCell>
                    <TableCell className="text-sm">{st.effectiveFrom ? fmtDate(st.effectiveFrom) : '—'}</TableCell>
                    <TableCell>{statusBadge(st.status)}</TableCell>
                    <TableCell className="text-right tabular-nums">{st.studentAssignments.length}</TableCell>
                    <TableCell>
                      {st.status === 'ACTIVE' && (
                        <AssignStructureDialog
                          structureId={st.id}
                          structureName={st.name}
                          classes={classes.map((c) => ({ id: c.id, name: c.name, sections: c.sections.map((s) => ({ id: s.id, name: s.name })) }))}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {structures.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No fee structures yet. Create the first one for a class & session.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
