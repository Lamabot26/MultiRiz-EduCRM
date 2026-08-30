// CSV builder with Excel-friendly BOM + injection guard.

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escapeCell = (v: string | number | null | undefined): string => {
    if (v === null || v === undefined) return '';
    let s = String(v);
    // protect against CSV injection (=, +, -, @ leading chars)
    if (/^[=+\-@\t]/.test(s)) s = `'${s}`;
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      s = `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))];
  return '\uFEFF' + lines.join('\r\n');
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
