import { db } from '@/lib/db';
import { withApi, ok, fail, parseBody, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { feeStructureSchema } from '@/lib/validation';
import { toPaise } from '@/lib/money';

// GET /api/fees/structures — list fee structures w/ items (session/class filters).
export const GET = withApi(
  async (req) => {
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 503);
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('session') ?? undefined;
    const classId = url.searchParams.get('class') ?? undefined;

    const structures = await db.feeStructure.findMany({
      where: {
        schoolId: school.id,
        ...(sessionId ? { academicSessionId: sessionId } : {}),
        ...(classId ? { classId } : {}),
      },
      include: {
        classRoom: true,
        academicSession: true,
        items: { include: { feeComponent: true, feeCategory: true } },
        studentAssignments: { select: { id: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    return ok({ items: structures });
  },
  { permission: PERMISSIONS.FEES_PAYMENTS_READ },
);

// POST /api/fees/structures — create structure + items transactionally.
export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 503);

    const body = await parseBody(req, feeStructureSchema);
    const itemsTotal = body.items.reduce(
      (sum, it) => sum + Math.round(toPaise(it.amount) / (it.installmentCount ?? 1)),
      0,
    );

    const created = await db.$transaction(async (tx) => {
      const structure = await tx.feeStructure.create({
        data: {
          schoolId: school.id,
          academicSessionId: body.academicSessionId,
          classId: body.classId,
          name: body.name,
          status: 'ACTIVE',
          effectiveFrom: body.effectiveFrom ? new Date(body.effectiveFrom) : null,
          totalAmount: itemsTotal,
          createdById: user.id,
          items: {
            create: body.items.map((it) => ({
              feeComponentId: it.feeComponentId,
              amount: toPaise(it.amount),
              frequency: it.frequency,
              dueDay: it.dueDay ?? null,
              installmentCount: it.installmentCount ?? 1,
            })),
          },
        },
        include: { items: { include: { feeComponent: true } } },
      });
      return structure;
    });

    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'FEE_STRUCTURE_CREATE',
      entityType: 'fee_structure',
      entityId: created.id,
      after: { name: created.name, totalAmount: created.totalAmount, items: created.items.length },
    });
    return ok({ structure: created });
  },
  { permission: PERMISSIONS.FEES_STRUCTURES_MANAGE },
);
