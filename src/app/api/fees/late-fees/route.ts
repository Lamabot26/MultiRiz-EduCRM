import { db } from '@/lib/db';
import { withApi, ok, fail, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { toPaise } from '@/lib/money';

// GET /api/fees/late-fees — list late fee rules.
export const GET = withApi(
  async () => {
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 503);
    const rules = await db.lateFeeRule.findMany({
      where: { schoolId: school.id },
      orderBy: { createdAt: 'desc' },
    });
    return ok({ rules });
  },
  { permission: PERMISSIONS.FEES_PAYMENTS_READ },
);

// POST /api/fees/late-fees — create a late fee rule.
export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const school = await db.school.findFirst();
    if (!school) throw new ApiError('School not configured', 503);
    const body = (await req.json()) as {
      name: string; ruleType: string; amountRupees?: number; percent?: number;
      gracePeriodDays?: number; maxAmountRupees?: number; academicSessionId?: string;
    };
    if (!body.name || !['FIXED', 'PERCENT_PER_DAY', 'PERCENT_PER_MONTH', 'ONE_TIME'].includes(body.ruleType)) {
      throw new ApiError('Invalid rule payload', 422);
    }
    const rule = await db.lateFeeRule.create({
      data: {
        schoolId: school.id,
        name: body.name,
        ruleType: body.ruleType,
        amount: body.amountRupees ? toPaise(body.amountRupees) : 0,
        percent: body.percent ?? null,
        gracePeriodDays: body.gracePeriodDays ?? 0,
        maxAmount: body.maxAmountRupees ? toPaise(body.maxAmountRupees) : null,
        academicSessionId: body.academicSessionId ?? null,
      },
    });
    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'LATE_FEE_RULE_CREATE',
      entityType: 'late_fee_rule',
      entityId: rule.id,
      after: { name: rule.name, ruleType: rule.ruleType },
    });
    return ok({ rule });
  },
  { permission: PERMISSIONS.FEES_STRUCTURES_MANAGE },
);
