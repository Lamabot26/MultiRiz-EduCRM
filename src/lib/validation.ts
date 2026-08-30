import { z } from 'zod';
import {
  LEAD_STATUSES, PRIORITIES, APPLICATION_STATUSES, GENDERS, RELATIONSHIPS,
  PAYMENT_MODES, FEE_FREQUENCIES, STUDENT_STATUSES, ATTENDANCE_STATUSES,
  NOTICE_CATEGORIES, NOTICE_AUDIENCES, CONCESSION_TYPES, DOC_TYPES, APPROVAL_STATUSES,
} from './constants';

// ---------- Public forms ----------
export const enquirySchema = z.object({
  studentName: z.string().min(2).max(120),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(GENDERS).optional().nullable(),
  classApplyingFor: z.string().min(1).max(40),
  guardianName: z.string().min(2).max(120),
  mobile: z.string().regex(/^(\+91[- ]?)?[6-9]\d{9}$/, 'Enter a valid Indian mobile number'),
  email: z.string().email().optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  previousSchool: z.string().max(160).optional().nullable(),
  message: z.string().max(1000).optional().nullable(),
  consent: z.literal(true, { message: 'Privacy consent is required' }),
  website: z.string().max(0).optional().nullable(), // honeypot — must stay empty
});
export type EnquiryInput = z.infer<typeof enquirySchema>;

export const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(20).optional().nullable(),
  subject: z.string().min(2).max(160),
  message: z.string().min(5).max(2000),
  consent: z.literal(true),
  website: z.string().max(0).optional().nullable(),
});

// ---------- Leads ----------
export const leadCreateSchema = z.object({
  studentName: z.string().min(2).max(120),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(GENDERS).optional().nullable(),
  classApplyingFor: z.string().max(40).optional().nullable(),
  academicSessionId: z.string().uuid().optional().nullable(),
  guardianName: z.string().min(2).max(120),
  mobile: z.string().regex(/^(\+91[- ]?)?[6-9]\d{9}$/),
  altMobile: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  previousSchool: z.string().max(160).optional().nullable(),
  leadSourceId: z.string().uuid().optional().nullable(),
  sourceNotes: z.string().max(300).optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  status: z.enum(LEAD_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  notes: z.string().max(2000).optional().nullable(),
  nextFollowUpDate: z.string().optional().nullable(),
});

export const leadUpdateSchema = leadCreateSchema.partial().extend({
  lostReason: z.string().max(300).optional().nullable(),
});

export const followupCreateSchema = z.object({
  dueDate: z.string(),
  note: z.string().max(500).optional().nullable(),
});

export const activityCreateSchema = z.object({
  type: z.enum(['NOTE', 'CALL', 'EMAIL', 'WHATSAPP']),
  title: z.string().min(2).max(160),
  content: z.string().max(2000).optional().nullable(),
  outcome: z.string().max(300).optional().nullable(),
});

export const visitCreateSchema = z.object({
  scheduledAt: z.string(),
  visitorName: z.string().max(120).optional().nullable(),
  visitorMobile: z.string().max(20).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const leadConvertSchema = z.object({
  classApplyingFor: z.string().max(40).optional().nullable(),
  documentsPending: z.array(z.string()).optional(),
});

export const applicationCreateSchema = z.object({
  leadId: z.string().uuid().optional().nullable(),
  academicSessionId: z.string().uuid(),
  classApplyingFor: z.string().min(1).max(40),
  studentName: z.string().min(2).max(120),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(GENDERS).optional().nullable(),
  guardianName: z.string().min(2).max(120),
  mobile: z.string().regex(/^(\+91[- ]?)?[6-9]\d{9}$/),
  email: z.string().email().optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  previousSchool: z.string().max(160).optional().nullable(),
  status: z.enum(APPLICATION_STATUSES).optional(),
});

export const bulkAssignSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(200),
  assignedTo: z.string().uuid(),
});

// ---------- Students ----------
export const guardianSchema = z.object({
  fullName: z.string().min(2).max(120),
  relationship: z.enum(RELATIONSHIPS),
  mobile: z.string().regex(/^(\+91[- ]?)?[6-9]\d{9}$/),
  altMobile: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  occupation: z.string().max(120).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  isPrimaryContact: z.boolean().optional(),
  isEmergencyContact: z.boolean().optional(),
});

export const studentCreateSchema = z.object({
  admissionNumber: z.string().min(2).max(40).optional(), // auto-generated if omitted
  academicSessionId: z.string().uuid().optional().nullable(),
  firstName: z.string().min(1).max(60),
  middleName: z.string().max(60).optional().nullable(),
  lastName: z.string().max(60).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(GENDERS).optional().nullable(),
  bloodGroup: z.string().max(8).optional().nullable(),
  nationality: z.string().max(60).optional().nullable(),
  religion: z.string().max(60).optional().nullable(),
  categoryId: z.string().max(60).optional().nullable(),
  admissionDate: z.string().optional().nullable(),
  classId: z.string().uuid().optional().nullable(),
  sectionId: z.string().uuid().optional().nullable(),
  rollNumber: z.string().max(20).optional().nullable(),
  house: z.string().max(60).optional().nullable(),
  transportRoute: z.string().max(60).optional().nullable(),
  hostelStatus: z.string().max(60).optional().nullable(),
  previousSchool: z.string().max(160).optional().nullable(),
  status: z.enum(STUDENT_STATUSES).optional(),
  guardian: guardianSchema.optional(),
});

export const studentUpdateSchema = studentCreateSchema.partial().extend({
  reason: z.string().max(300).optional().nullable(),
});

export const approvedContactSchema = z.object({
  contactName: z.string().min(2).max(120),
  relationship: z.enum(RELATIONSHIPS),
  mobile: z.string().regex(/^(\+91[- ]?)?[6-9]\d{9}$/),
  email: z.string().email().optional().nullable(),
  notes: z.string().max(300).optional().nullable(),
});

export const approvedContactDecisionSchema = z.object({
  approvalStatus: z.enum(['APPROVED', 'REJECTED', 'REVOKED']),
  notes: z.string().max(300).optional().nullable(),
});

export const studentDocumentSchema = z.object({
  docType: z.enum(DOC_TYPES),
  fileName: z.string().min(1).max(200),
  fileUrl: z.string().min(1).max(500),
  mimeType: z.string().max(100).optional().nullable(),
  sizeBytes: z.number().int().nonnegative().max(10 * 1024 * 1024).optional().nullable(),
  notes: z.string().max(300).optional().nullable(),
});

// ---------- Classes / sections ----------
export const classCreateSchema = z.object({
  name: z.string().min(1).max(60),
  level: z.number().int().min(0).max(20),
  description: z.string().max(300).optional().nullable(),
});

export const sectionCreateSchema = z.object({
  classId: z.string().uuid(),
  name: z.string().min(1).max(20),
  capacity: z.number().int().min(1).max(200).optional().nullable(),
  classTeacherId: z.string().uuid().optional().nullable(),
});

// ---------- Attendance ----------
export const attendanceMarkSchema = z.object({
  classId: z.string().uuid(),
  sectionId: z.string().uuid().nullable().optional(),
  date: z.string(),
  records: z.array(z.object({
    studentId: z.string().uuid(),
    status: z.enum(ATTENDANCE_STATUSES),
    remarks: z.string().max(200).optional().nullable(),
  })).min(1).max(200),
});

// ---------- Fees ----------
export const feeStructureSchema = z.object({
  academicSessionId: z.string().uuid(),
  classId: z.string().uuid(),
  name: z.string().min(2).max(120),
  effectiveFrom: z.string().optional().nullable(),
  items: z.array(z.object({
    feeComponentId: z.string().uuid(),
    amount: z.number().int().positive(),
    frequency: z.enum(FEE_FREQUENCIES),
    dueDay: z.number().int().min(1).max(28).optional().nullable(),
    installmentCount: z.number().int().min(1).max(12).optional(),
  })).min(1),
});

export const invoiceGenerateSchema = z.object({
  feeStructureId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()).min(1).max(500).optional(),
  classId: z.string().uuid().optional().nullable(),
  periods: z.number().int().min(1).max(12).default(1),
  dueDay: z.number().int().min(1).max(28).optional().nullable(),
});

export const offlinePaymentSchema = z.object({
  studentId: z.string().uuid(),
  invoiceId: z.string().uuid().nullable().optional(),
  amount: z.number().int().positive(),
  mode: z.enum(PAYMENT_MODES),
  referenceNumber: z.string().max(80).optional().nullable(),
  chequeNumber: z.string().max(40).optional().nullable(),
  chequeDate: z.string().optional().nullable(),
  bankName: z.string().max(120).optional().nullable(),
  notes: z.string().max(300).optional().nullable(),
});

export const createOrderSchema = z.object({
  invoiceId: z.string().uuid(),
});

export const concessionSchema = z.object({
  studentId: z.string().uuid(),
  invoiceId: z.string().uuid().optional().nullable(),
  type: z.enum(CONCESSION_TYPES),
  percent: z.number().min(0).max(100).optional().nullable(),
  amount: z.number().int().positive().optional().nullable(),
  reason: z.string().min(3).max(500),
});

export const concessionDecisionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  remarks: z.string().max(300).optional().nullable(),
});

export const refundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().int().positive(),
  reason: z.string().min(3).max(500),
});

export const refundDecisionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'PROCESSED']),
  referenceNumber: z.string().max(80).optional().nullable(),
  remarks: z.string().max(300).optional().nullable(),
});

// ---------- Notices / users / settings ----------
export const noticeSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(5).max(20000),
  category: z.enum(NOTICE_CATEGORIES).default('GENERAL'),
  audience: z.enum(NOTICE_AUDIENCES).default('PUBLIC'),
  isPublished: z.boolean().default(false),
  attachmentUrl: z.string().max(500).optional().nullable(),
  attachmentName: z.string().max(200).optional().nullable(),
});

export const eventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(5).max(20000),
  startsAt: z.string(),
  endsAt: z.string().optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  isPublished: z.boolean().default(false),
});

export const userCreateSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  phone: z.string().max(20).optional().nullable(),
  roles: z.array(z.string()).min(1),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  phone: z.string().max(20).optional().nullable(),
  isActive: z.boolean().optional(),
  roles: z.array(z.string()).optional(),
  password: z.string().min(8).max(72).optional(),
});

export const settingsSchema = z.record(z.string(), z.unknown());

export const profileUpdateRequestSchema = z.object({
  field: z.enum(['mobile', 'email', 'address', 'other']),
  currentValue: z.string().max(200).optional().nullable(),
  requestedValue: z.string().min(1).max(200),
  reason: z.string().max(500).optional().nullable(),
});
