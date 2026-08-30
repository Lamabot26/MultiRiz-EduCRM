import { jsPDF } from 'jspdf';
import { rupees, rupeesPlain, numberToWordsINR } from '../money';
import { fmtDate, fmtDateTime } from '../date-utils';

// =====================================================================
// Server-side PDF generation (jsPDF) for fee receipts & invoices.
// Print-friendly A4, school header from settings, duplicate marking.
// =====================================================================

export type ReceiptPdfInput = {
  schoolName: string;
  addressLine: string;
  city: string;
  phone: string;
  email: string;
  logoUrl?: string | null;
  receiptNumber: string;
  isDuplicate: boolean;
  issuedAt: Date;
  studentName: string;
  admissionNumber: string;
  className?: string | null;
  sectionName?: string | null;
  invoiceNumber?: string | null;
  periodLabel?: string | null;
  paymentMode: string;
  referenceNumber?: string | null;
  items: { description: string; amount: number }[];
  total: number;
  receivedBy?: string | null;
  duplicateOf?: string | null;
};

const NAVY: [number, number, number] = [30, 58, 138];
const GOLD: [number, number, number] = [180, 83, 9];

export function receiptPdf(input: ReceiptPdfInput): Buffer {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  let y = 0;

  // Header band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 90, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  doc.text(input.schoolName, 40, 38);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(`${input.addressLine}, ${input.city}`, 40, 56);
  doc.text(`Phone: ${input.phone}  |  Email: ${input.email}`, 40, 70);

  // Title row
  y = 112;
  doc.setTextColor(...GOLD); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text(input.isDuplicate ? 'FEE RECEIPT (DUPLICATE)' : 'FEE RECEIPT', 40, y);
  doc.setTextColor(60, 60, 60); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(`Receipt No: ${input.receiptNumber}`, W - 40, y, { align: 'right' });
  if (input.isDuplicate && input.duplicateOf) {
    y += 14; doc.setFontSize(8.5); doc.setTextColor(150, 60, 20);
    doc.text(`Duplicate issued for original receipt ${input.duplicateOf}`, W - 40, y, { align: 'right' });
  }

  y += 26;
  doc.setDrawColor(220, 220, 220); doc.line(40, y - 8, W - 40, y - 8);

  // Meta grid
  const meta: [string, string][] = [
    ['Student Name', input.studentName],
    ['Admission No', input.admissionNumber],
    ['Class / Section', `${input.className ?? '—'} ${input.sectionName ? '- ' + input.sectionName : ''}`.trim()],
    ['Receipt Date', fmtDateTime(input.issuedAt)],
    ['Invoice No', input.invoiceNumber ?? '—'],
    ['Period', input.periodLabel ?? '—'],
    ['Payment Mode', input.paymentMode],
    ['Reference', input.referenceNumber ?? '—'],
  ];
  doc.setFontSize(9.5);
  meta.forEach(([k, v], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 40 + col * ((W - 80) / 2);
    const yy = y + row * 18;
    doc.setTextColor(120, 120, 120);
    doc.text(k, x, yy);
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'bold');
    doc.text(String(v ?? '—'), x + 110, yy);
    doc.setFont('helvetica', 'normal');
  });
  y += Math.ceil(meta.length / 2) * 18 + 14;

  // Items table
  doc.setFillColor(245, 246, 250);
  doc.rect(40, y, W - 80, 20, 'F');
  doc.setTextColor(90, 90, 90); doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
  doc.text('Description', 50, y + 14);
  doc.text('Amount (INR)', W - 50, y + 14, { align: 'right' });
  y += 20;
  doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40);
  for (const item of input.items) {
    doc.text(item.description, 50, y + 14);
    doc.text(rupeesPlain(item.amount), W - 50, y + 14, { align: 'right' });
    doc.setDrawColor(235, 235, 235); doc.line(40, y + 20, W - 40, y + 20);
    y += 22;
  }
  // Total row
  y += 6;
  doc.setFillColor(...NAVY); doc.rect(40, y, W - 80, 24, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5);
  doc.text('TOTAL PAID', 50, y + 16);
  doc.text(rupeesPlain(input.total), W - 50, y + 16, { align: 'right' });
  y += 36;

  doc.setFont('helvetica', 'italic'); doc.setFontSize(9.5); doc.setTextColor(70, 70, 70);
  doc.text(`Amount in words: ${numberToWordsINR(input.total)}`, 40, y);
  y += 40;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 100, 100);
  doc.text(`Received by: ${input.receivedBy ?? '—'}`, 40, y);
  doc.text('Authorised Signatory', W - 40, y, { align: 'right' });
  doc.line(W - 140, y + 22, W - 40, y + 22);

  y += 46;
  doc.setFontSize(8); doc.setTextColor(150, 150, 150);
  doc.text(
    'This is a computer-generated receipt. Payments are applied to the oldest outstanding invoice first. Subject to school fee policy.',
    40, y, { maxWidth: W - 80 },
  );

  return Buffer.from(doc.output('arraybuffer'));
}

export type InvoicePdfInput = {
  schoolName: string;
  addressLine: string;
  city: string;
  phone: string;
  email: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate?: Date | null;
  studentName: string;
  admissionNumber: string;
  className?: string | null;
  sectionName?: string | null;
  periodLabel?: string | null;
  items: { description: string; amount: number }[];
  subtotal: number;
  lateFee: number;
  total: number;
  paidTotal: number;
  balance: number;
  status: string;
};

export function invoicePdf(input: InvoicePdfInput): Buffer {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(...NAVY); doc.rect(0, 0, W, 90, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  doc.text(input.schoolName, 40, 38);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(`${input.addressLine}, ${input.city}`, 40, 56);
  doc.text(`Phone: ${input.phone}  |  Email: ${input.email}`, 40, 70);

  let y = 112;
  doc.setTextColor(...GOLD); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text('FEE INVOICE', 40, y);
  doc.setTextColor(60, 60, 60); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(`Invoice No: ${input.invoiceNumber}`, W - 40, y, { align: 'right' });

  y += 26; doc.setDrawColor(220, 220, 220); doc.line(40, y - 8, W - 40, y - 8);
  const meta: [string, string][] = [
    ['Student Name', input.studentName],
    ['Admission No', input.admissionNumber],
    ['Class / Section', `${input.className ?? '—'} ${input.sectionName ? '- ' + input.sectionName : ''}`.trim()],
    ['Issue Date', fmtDate(input.issueDate)],
    ['Due Date', input.dueDate ? fmtDate(input.dueDate) : '—'],
    ['Period', input.periodLabel ?? '—'],
  ];
  doc.setFontSize(9.5);
  meta.forEach(([k, v], i) => {
    const col = i % 2; const row = Math.floor(i / 2);
    const x = 40 + col * ((W - 80) / 2); const yy = y + row * 18;
    doc.setTextColor(120, 120, 120); doc.text(k, x, yy);
    doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'bold'); doc.text(String(v ?? '—'), x + 110, yy);
    doc.setFont('helvetica', 'normal');
  });
  y += Math.ceil(meta.length / 2) * 18 + 14;

  doc.setFillColor(245, 246, 250); doc.rect(40, y, W - 80, 20, 'F');
  doc.setTextColor(90, 90, 90); doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
  doc.text('Description', 50, y + 14);
  doc.text('Amount (INR)', W - 50, y + 14, { align: 'right' });
  y += 20;
  doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40);
  for (const item of input.items) {
    doc.text(item.description, 50, y + 14);
    doc.text(rupeesPlain(item.amount), W - 50, y + 14, { align: 'right' });
    doc.setDrawColor(235, 235, 235); doc.line(40, y + 20, W - 40, y + 20);
    y += 22;
  }
  if (input.lateFee > 0) {
    doc.text('Late Fee', 50, y + 14);
    doc.text(rupeesPlain(input.lateFee), W - 50, y + 14, { align: 'right' });
    y += 22;
  }
  const totals: [string, number][] = [
    ['Subtotal', input.subtotal],
    ['Total Payable', input.total + input.lateFee],
    ['Paid', input.paidTotal],
    ['Balance Due', input.balance],
  ];
  y += 8;
  totals.forEach(([label, val]) => {
    const bold = label === 'Balance Due';
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(bold ? 180 : 60, bold ? 83 : 60, bold ? 9 : 60);
    doc.text(label, W - 200, y + 12);
    doc.text(rupeesPlain(val), W - 50, y + 12, { align: 'right' });
    y += 18;
  });

  y += 30; doc.setFontSize(8); doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal');
  doc.text('Computer-generated invoice. Please quote the invoice number with your payment. Subject to school fee policy.', 40, y, { maxWidth: W - 80 });

  return Buffer.from(doc.output('arraybuffer'));
}
