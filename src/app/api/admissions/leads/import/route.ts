import { db } from '@/lib/db';
import { withApi, ok, fail, writeAudit, auditFrom, ApiError } from '@/lib/api-helpers';
import { PERMISSIONS } from '@/lib/rbac';
import { nextNumberTx } from '@/lib/sequences';
import { toCsv, csvResponse } from '@/lib/csv';

// =====================================================================
// /api/admissions/leads/import
//   GET  ?template=1 → downloadable CSV template
//   POST → bulk import. Accepts text/csv raw body or multipart file.
//   Columns: studentName,guardianName,mobile,classApplyingFor,email,
//            city,previousSchool,sourceName,notes
// =====================================================================

const IMPORT_COLUMNS = [
  'studentName', 'guardianName', 'mobile', 'classApplyingFor',
  'email', 'city', 'previousSchool', 'sourceName', 'notes',
];
const MOBILE_RE = /^(\+91[- ]?)?[6-9]\d{9}$/;
const MAX_ROWS = 500;

function templateCsv(): string {
  const rows = [
    ['Aarav Mohanty', 'Rakesh Mohanty', '9876543210', 'Class 1', 'guardian@example.com', 'Bhubaneswar', 'Sunrise Public School', 'REFERRAL', 'Sibling of existing student'],
    ['Ishita Das', 'Sourav Das', '9812345678', 'Nursery', '', 'Cuttack', '', 'WALK_IN', 'Walked in on open-house day'],
  ];
  return toCsv(IMPORT_COLUMNS, rows);
}

/** Minimal RFC-4180-ish CSV parser (handles quotes + embedded commas). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch === '\r') { /* skip */ }
    else field += ch;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

export const GET = withApi(async (req, { user }) => {
  if (!user) return fail('Authentication required', 401);
  const url = new URL(req.url);
  if (url.searchParams.get('template')) {
    return csvResponse('lead-import-template.csv', templateCsv());
  }
  return fail('Use ?template=1 to download the CSV template, or POST rows to import', 400);
});

export const POST = withApi(
  async (req, { user, ip }) => {
    if (!user) return fail('Authentication required', 401);
    const school = await db.school.findFirst();
    if (!school) return fail('School not configured yet', 503);

    // Accept multipart/form-data (file field) or raw text/csv body.
    const contentType = req.headers.get('content-type') ?? '';
    let text: string;
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file');
      if (file instanceof File) text = await file.text();
      else throw new ApiError('Attach a CSV file in the "file" field', 422);
    } else {
      text = await req.text();
    }
    if (!text.trim()) throw new ApiError('CSV body is empty', 422);

    const rows = parseCsv(text);
    if (rows.length < 2) throw new ApiError('CSV must contain a header row and at least one data row', 422);

    const header = rows[0].map((h) => h.trim().toLowerCase());
    const idx = (name: string) => header.indexOf(name.toLowerCase());
    const col = IMPORT_COLUMNS.map((c) => idx(c));
    if (col[0] === -1 || col[1] === -1 || col[2] === -1) {
      throw new ApiError('CSV must include at least studentName, guardianName and mobile columns', 422);
    }
    const dataRows = rows.slice(1, 1 + MAX_ROWS);

    // Source lookup/create map
    const sources = await db.leadSource.findMany({ where: { schoolId: school.id } });
    const sourceMap = new Map(sources.map((s) => [s.name.toLowerCase(), s.id]));

    const session = await db.academicSession.findFirst({ where: { schoolId: school.id, isCurrent: true } });
    const sessionLabel = session?.name ?? 'SESSION';

    const errors: string[] = [];
    const valid: { row: number; data: Record<string, string> }[] = [];
    dataRows.forEach((r, i) => {
      const cell = (c: number) => (c >= 0 && c < r.length ? r[c].trim() : '');
      const rec = {
        studentName: cell(col[0]),
        guardianName: cell(col[1]),
        mobile: cell(col[2]).replace(/[\s-]/g, ''),
        classApplyingFor: cell(col[3]),
        email: cell(col[4]),
        city: cell(col[5]),
        previousSchool: cell(col[6]),
        sourceName: cell(col[7]),
        notes: cell(col[8]),
      };
      const rowNo = i + 2; // 1-based incl. header
      if (rec.studentName.length < 2) { errors.push(`Row ${rowNo}: student name required`); return; }
      if (rec.guardianName.length < 2) { errors.push(`Row ${rowNo}: guardian name required`); return; }
      if (!MOBILE_RE.test(rec.mobile)) { errors.push(`Row ${rowNo}: invalid mobile “${rec.mobile}”`); return; }
      if (rec.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rec.email)) { errors.push(`Row ${rowNo}: invalid email`); return; }
      valid.push({ row: rowNo, data: rec });
    });

    const created = await db.$transaction(async (tx) => {
      let count = 0;
      for (const { data } of valid) {
        // Resolve / create lead source by name
        let leadSourceId: string | null = null;
        if (data.sourceName) {
          const key = data.sourceName.toLowerCase();
          leadSourceId = sourceMap.get(key) ?? null;
          if (!leadSourceId) {
            const src = await tx.leadSource.create({
              data: { schoolId: school.id, name: data.sourceName.slice(0, 60) },
            });
            sourceMap.set(key, src.id);
            leadSourceId = src.id;
          }
        }
        const leadNumber = await nextNumberTx(tx, school.id, 'LEAD', sessionLabel, 'LEAD');
        await tx.admissionLead.create({
          data: {
            schoolId: school.id,
            leadNumber,
            studentName: data.studentName,
            classApplyingFor: data.classApplyingFor || null,
            guardianName: data.guardianName,
            mobile: data.mobile,
            email: data.email || null,
            city: data.city || null,
            previousSchool: data.previousSchool || null,
            leadSourceId,
            sourceNotes: data.notes || null,
            status: 'NEW',
            priority: 'MEDIUM',
            academicSessionId: session?.id ?? null,
            createdById: user.id,
          },
        });
        count++;
      }
      return count;
    });

    const skipped = dataRows.length - valid.length;
    await writeAudit({
      ...auditFrom(user, ip, req),
      action: 'LEAD_IMPORT',
      entityType: 'lead',
      entityId: null,
      after: { created, skipped, errors: errors.slice(0, 10) },
    });

    return ok({ created, skipped, errors });
  },
  { permission: PERMISSIONS.LEADS_IMPORT_EXPORT, rateLimit: { key: 'lead-import', limit: 10, windowMs: 60_000 } },
);
