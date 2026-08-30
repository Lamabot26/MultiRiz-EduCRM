// =====================================================================
// Domain constants — single source of truth for all enum-like strings.
// Columns are String in the DB; values here are enforced with zod.
// =====================================================================

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  PRINCIPAL: 'PRINCIPAL',
  ADMISSION_COUNSELLOR: 'ADMISSION_COUNSELLOR',
  ACCOUNTANT: 'ACCOUNTANT',
  TEACHER: 'TEACHER',
  CLASS_TEACHER: 'CLASS_TEACHER',
  FRONT_DESK: 'FRONT_DESK',
  PARENT: 'PARENT',
  STUDENT: 'STUDENT',
  IT_ADMIN: 'IT_ADMIN',
} as const;
export type RoleKey = (typeof ROLES)[keyof typeof ROLES];

export const STAFF_ROLES: RoleKey[] = [
  ROLES.SUPER_ADMIN,
  ROLES.PRINCIPAL,
  ROLES.ADMISSION_COUNSELLOR,
  ROLES.ACCOUNTANT,
  ROLES.TEACHER,
  ROLES.CLASS_TEACHER,
  ROLES.FRONT_DESK,
  ROLES.IT_ADMIN,
];

export const LEAD_STATUSES = [
  'NEW', 'CONTACTED', 'FOLLOW_UP', 'VISIT_SCHEDULED', 'APPLICATION_STARTED',
  'DOCUMENTS_PENDING', 'APPLICATION_SUBMITTED', 'ASSESSMENT_SCHEDULED',
  'INTERVIEW_SCHEDULED', 'OFFER_MADE', 'ADMISSION_CONFIRMED', 'WAITLISTED',
  'LOST', 'NOT_INTERESTED',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  FOLLOW_UP: 'Follow-up Required',
  VISIT_SCHEDULED: 'Campus Visit Scheduled',
  APPLICATION_STARTED: 'Application Started',
  DOCUMENTS_PENDING: 'Documents Pending',
  APPLICATION_SUBMITTED: 'Application Submitted',
  ASSESSMENT_SCHEDULED: 'Assessment Scheduled',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  OFFER_MADE: 'Offer Made',
  ADMISSION_CONFIRMED: 'Admission Confirmed',
  WAITLISTED: 'Waitlisted',
  LOST: 'Lost',
  NOT_INTERESTED: 'Not Interested',
};

export const CLOSED_LEAD_STATUSES: string[] = ['LOST', 'NOT_INTERESTED', 'ADMISSION_CONFIRMED'];

export const LEAD_SOURCES = [
  'WEBSITE_FORM', 'WALK_IN', 'TELEPHONE', 'WHATSAPP', 'REFERRAL',
  'SOCIAL_MEDIA', 'EDUCATION_FAIR', 'PARENT_REFERRAL', 'MANUAL_ENTRY', 'OTHER',
] as const;
export const LEAD_SOURCE_LABELS: Record<string, string> = {
  WEBSITE_FORM: 'Website Enquiry Form',
  WALK_IN: 'Walk-in Enquiry',
  TELEPHONE: 'Telephone Enquiry',
  WHATSAPP: 'WhatsApp Enquiry',
  REFERRAL: 'Referral',
  SOCIAL_MEDIA: 'Social Media',
  EDUCATION_FAIR: 'Education Fair / Event',
  PARENT_REFERRAL: 'Existing Parent Referral',
  MANUAL_ENTRY: 'Manual Staff Entry',
  OTHER: 'Other',
};

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

export const LEAD_ACTIVITY_TYPES = [
  'NOTE', 'CALL', 'STATUS_CHANGE', 'EMAIL', 'WHATSAPP', 'VISIT', 'STAGE_MOVE',
] as const;

export const APPLICATION_STATUSES = [
  'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ASSESSMENT_SCHEDULED', 'INTERVIEW_SCHEDULED',
  'OFFER_MADE', 'ACCEPTED', 'REJECTED', 'WAITLISTED', 'WITHDRAWN',
] as const;
export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review',
  ASSESSMENT_SCHEDULED: 'Assessment Scheduled', INTERVIEW_SCHEDULED: 'Interview Scheduled',
  OFFER_MADE: 'Offer Made', ACCEPTED: 'Accepted', REJECTED: 'Rejected',
  WAITLISTED: 'Waitlisted', WITHDRAWN: 'Withdrawn',
};

export const DOC_TYPES = [
  'BIRTH_CERTIFICATE', 'TRANSFER_CERTIFICATE', 'REPORT_CARD', 'ADDRESS_PROOF',
  'PHOTO', 'AADHAAR', 'INCOME_CERTIFICATE', 'CASTE_CERTIFICATE', 'OTHER',
] as const;
export const DOC_TYPE_LABELS: Record<string, string> = {
  BIRTH_CERTIFICATE: 'Birth Certificate', TRANSFER_CERTIFICATE: 'Transfer Certificate',
  REPORT_CARD: 'Previous Report Card', ADDRESS_PROOF: 'Address Proof', PHOTO: 'Photograph',
  AADHAAR: 'Aadhaar Card', INCOME_CERTIFICATE: 'Income Certificate',
  CASTE_CERTIFICATE: 'Caste Certificate', OTHER: 'Other',
};

export const STUDENT_STATUSES = ['ACTIVE', 'INACTIVE', 'ALUMNI', 'TRANSFERRED', 'WITHDRAWN'] as const;
export const STUDENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active', INACTIVE: 'Inactive', ALUMNI: 'Alumni',
  TRANSFERRED: 'Transferred', WITHDRAWN: 'Withdrawn',
};

export const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;
export const GENDER_LABELS: Record<string, string> = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' };

export const RELATIONSHIPS = ['FATHER', 'MOTHER', 'LOCAL_GUARDIAN', 'OTHER'] as const;
export const RELATIONSHIP_LABELS: Record<string, string> = {
  FATHER: 'Father', MOTHER: 'Mother', LOCAL_GUARDIAN: 'Local Guardian', OTHER: 'Other',
};

export const APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'REVOKED'] as const;

export const FEE_FREQUENCIES = ['MONTHLY', 'QUARTERLY', 'ANNUAL', 'ONE_TIME'] as const;
export const FEE_FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', ANNUAL: 'Annual', ONE_TIME: 'One-time',
};

export const FEE_COMPONENT_CODES = [
  'ADMISSION', 'REGISTRATION', 'TUITION', 'ANNUAL', 'DEVELOPMENT', 'EXAM',
  'LAB', 'LIBRARY', 'TRANSPORT', 'HOSTEL', 'ACTIVITY', 'SMART_CLASS',
] as const;
export const FEE_COMPONENT_LABELS: Record<string, string> = {
  ADMISSION: 'Admission Fee', REGISTRATION: 'Registration Fee', TUITION: 'Tuition Fee',
  ANNUAL: 'Annual Fee', DEVELOPMENT: 'Development Fee', EXAM: 'Examination Fee',
  LAB: 'Lab Fee', LIBRARY: 'Library Fee', TRANSPORT: 'Transport Fee',
  HOSTEL: 'Hostel Fee', ACTIVITY: 'Activity Fee', SMART_CLASS: 'Smart Class Fee',
};

export const INVOICE_STATUSES = ['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'] as const;
export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', ISSUED: 'Issued', PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid', OVERDUE: 'Overdue', CANCELLED: 'Cancelled',
};

export const PAYMENT_MODES = ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'ONLINE', 'ADJUSTMENT'] as const;
export const PAYMENT_MODE_LABELS: Record<string, string> = {
  CASH: 'Cash', CHEQUE: 'Cheque', BANK_TRANSFER: 'Bank Transfer',
  UPI: 'UPI', ONLINE: 'Online (Gateway)', ADJUSTMENT: 'Adjustment',
};

export const PAYMENT_STATUSES = ['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED', 'REFUNDED'] as const;

export const CONCESSION_TYPES = ['SCHOLARSHIP', 'SIBLING', 'STAFF_WARD', 'SPORTS', 'NEED_BASED', 'OTHER'] as const;
export const CONCESSION_TYPE_LABELS: Record<string, string> = {
  SCHOLARSHIP: 'Scholarship', SIBLING: 'Sibling Discount', STAFF_WARD: 'Staff Ward',
  SPORTS: 'Sports Quota', NEED_BASED: 'Need-based', OTHER: 'Other',
};
export const CONCESSION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'APPLIED'] as const;

export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'HOLIDAY'] as const;
export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Present', ABSENT: 'Absent', LATE: 'Late', LEAVE: 'Leave', HOLIDAY: 'Holiday',
};

export const NOTICE_CATEGORIES = ['GENERAL', 'ACADEMIC', 'EVENT', 'ADMISSION', 'FEE', 'URGENT'] as const;
export const NOTICE_AUDIENCES = ['PUBLIC', 'PARENTS', 'STUDENTS', 'STAFF', 'ALL'] as const;

export const COMMUNICATION_CHANNELS = ['EMAIL', 'SMS', 'WHATSAPP', 'PHONE', 'IN_PERSON'] as const;

// Financial safety: payment records are IMMUTABLE once CONFIRMED.
// Corrections happen only via Refund / FeeAdjustment / reversal workflows.
export const IMMUTABLE_PAYMENT_STATUSES = ['CONFIRMED', 'REFUNDED'];

export const SESSION_DEFAULT = '2025-26';

// Late-fee rule types
export const LATE_FEE_RULE_TYPES = ['FIXED', 'PERCENT_PER_DAY', 'PERCENT_PER_MONTH', 'ONE_TIME'] as const;
