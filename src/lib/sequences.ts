import { db } from './db';

// =====================================================================
// Sequential document numbering (Indian school style):
//   INV-2025-26-000123 | RCP-2025-26-000123 | LEAD-2025-26-000123
// Works with prisma db client OR a transaction client (same shape).
// =====================================================================

type SeqClient = Pick<typeof db, 'numberSequence'>;

export async function nextNumberTx(
  client: SeqClient,
  schoolId: string,
  kind: 'INVOICE' | 'RECEIPT' | 'LEAD' | 'APPLICATION',
  sessionLabel: string,
  prefix: string,
): Promise<string> {
  const key = `${kind}:${sessionLabel}`;
  const row = await client.numberSequence.upsert({
    where: { schoolId_key: { schoolId, key } },
    create: { schoolId, key, prefix, currentValue: 1 },
    update: { currentValue: { increment: 1 } },
  });
  return `${prefix}-${sessionLabel}-${String(row.currentValue).padStart(6, '0')}`;
}

export async function nextNumber(
  schoolId: string,
  kind: 'INVOICE' | 'RECEIPT' | 'LEAD' | 'APPLICATION',
  sessionLabel: string,
  prefix: string,
): Promise<string> {
  return nextNumberTx(db, schoolId, kind, sessionLabel, prefix);
}
