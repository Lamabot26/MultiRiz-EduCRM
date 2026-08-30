import { ROLES, type RoleKey } from './constants';

// =====================================================================
// Role-based access control.
// The matrix below is the runtime source of truth (fast + typed).
// Roles/Permissions/RolePermission tables are seeded from here so the
// matrix is inspectable & configurable in DB for future needs.
// Least-privilege by default: anything not listed is DENIED.
// =====================================================================

export const PERMISSIONS = {
  // website & content
  CONTENT_MANAGE: 'content.manage',
  NOTICES_MANAGE: 'notices.manage',
  // leads / admissions
  LEADS_READ_ALL: 'leads.read.all',
  LEADS_READ_ASSIGNED: 'leads.read.assigned',
  LEADS_WRITE: 'leads.write',
  LEADS_ASSIGN: 'leads.assign',
  LEADS_IMPORT_EXPORT: 'leads.import_export',
  LEADS_CONVERT: 'leads.convert',
  APPLICATIONS_MANAGE: 'applications.manage',
  // students
  STUDENTS_READ_ALL: 'students.read.all',
  STUDENTS_READ_LIMITED: 'students.read.limited',
  STUDENTS_WRITE: 'students.write',
  STUDENTS_APPROVED_CONTACTS_MANAGE: 'students.approved_contacts.manage',
  STUDENTS_DOCUMENTS_MANAGE: 'students.documents.manage',
  CLASSES_MANAGE: 'classes.manage',
  ATTENDANCE_MARK: 'attendance.mark',
  ATTENDANCE_READ: 'attendance.read',
  // fees
  FEES_STRUCTURES_MANAGE: 'fees.structures.manage',
  FEES_INVOICES_GENERATE: 'fees.invoices.generate',
  FEES_PAYMENTS_OFFLINE: 'fees.payments.offline',
  FEES_PAYMENTS_READ: 'fees.payments.read',
  FEES_CONCESSION_REQUEST: 'fees.concession.request',
  FEES_CONCESSION_APPROVE: 'fees.concession.approve',
  FEES_REFUND_REQUEST: 'fees.refund.request',
  FEES_REFUND_APPROVE: 'fees.refund.approve',
  FEES_LEDGER_READ: 'fees.ledger.read',
  FEES_ONLINE_PAY: 'fees.online_pay',
  // users & system
  USERS_MANAGE: 'users.manage',
  SETTINGS_MANAGE: 'settings.manage',
  AUDIT_READ: 'audit.read',
  REPORTS_READ: 'reports.read',
  REPORTS_FINANCIAL: 'reports.financial',
  EXPORT_DATA: 'export.data',
  // portal
  PORTAL_ACCESS: 'portal.access',
  PROFILE_UPDATE_REQUEST: 'profile.update_request',
} as const;
export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL: PermissionKey[] = Object.values(PERMISSIONS) as PermissionKey[];

const FEE_READ_ONLY: PermissionKey[] = [
  PERMISSIONS.FEES_PAYMENTS_READ,
  PERMISSIONS.FEES_LEDGER_READ,
  PERMISSIONS.REPORTS_FINANCIAL,
];

export const ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  [ROLES.SUPER_ADMIN]: ALL,
  [ROLES.IT_ADMIN]: [
    PERMISSIONS.USERS_MANAGE, PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.AUDIT_READ,
    PERMISSIONS.EXPORT_DATA, PERMISSIONS.REPORTS_READ, PERMISSIONS.CONTENT_MANAGE,
    PERMISSIONS.STUDENTS_READ_ALL, PERMISSIONS.FEES_PAYMENTS_READ, PERMISSIONS.FEES_LEDGER_READ,
  ],
  [ROLES.PRINCIPAL]: [
    PERMISSIONS.LEADS_READ_ALL, PERMISSIONS.LEADS_ASSIGN, PERMISSIONS.APPLICATIONS_MANAGE,
    PERMISSIONS.STUDENTS_READ_ALL, PERMISSIONS.STUDENTS_READ_LIMITED, PERMISSIONS.CLASSES_MANAGE,
    PERMISSIONS.ATTENDANCE_READ, PERMISSIONS.NOTICES_MANAGE, PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_FINANCIAL, PERMISSIONS.FEES_PAYMENTS_READ, PERMISSIONS.FEES_LEDGER_READ,
    PERMISSIONS.FEES_CONCESSION_APPROVE, PERMISSIONS.FEES_REFUND_APPROVE,
    PERMISSIONS.AUDIT_READ, PERMISSIONS.EXPORT_DATA, PERMISSIONS.CONTENT_MANAGE,
  ],
  [ROLES.ADMISSION_COUNSELLOR]: [
    PERMISSIONS.LEADS_READ_ALL, PERMISSIONS.LEADS_WRITE, PERMISSIONS.LEADS_IMPORT_EXPORT,
    PERMISSIONS.LEADS_CONVERT, PERMISSIONS.APPLICATIONS_MANAGE, PERMISSIONS.STUDENTS_READ_LIMITED,
    PERMISSIONS.REPORTS_READ, PERMISSIONS.CONTENT_MANAGE,
  ],
  [ROLES.ACCOUNTANT]: [
    PERMISSIONS.STUDENTS_READ_ALL, PERMISSIONS.STUDENTS_READ_LIMITED,
    PERMISSIONS.FEES_STRUCTURES_MANAGE, PERMISSIONS.FEES_INVOICES_GENERATE,
    PERMISSIONS.FEES_PAYMENTS_OFFLINE, PERMISSIONS.FEES_PAYMENTS_READ,
    PERMISSIONS.FEES_LEDGER_READ, PERMISSIONS.FEES_CONCESSION_REQUEST,
    PERMISSIONS.FEES_REFUND_REQUEST, PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_FINANCIAL,
    PERMISSIONS.EXPORT_DATA,
  ],
  [ROLES.TEACHER]: [
    PERMISSIONS.STUDENTS_READ_LIMITED, PERMISSIONS.ATTENDANCE_MARK, PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.NOTICES_MANAGE, PERMISSIONS.REPORTS_READ,
  ],
  [ROLES.CLASS_TEACHER]: [
    PERMISSIONS.STUDENTS_READ_LIMITED, PERMISSIONS.STUDENTS_WRITE, PERMISSIONS.ATTENDANCE_MARK,
    PERMISSIONS.ATTENDANCE_READ, PERMISSIONS.NOTICES_MANAGE, PERMISSIONS.REPORTS_READ,
    PERMISSIONS.STUDENTS_APPROVED_CONTACTS_MANAGE, PERMISSIONS.FEES_PAYMENTS_READ,
  ],
  [ROLES.FRONT_DESK]: [
    PERMISSIONS.LEADS_WRITE, PERMISSIONS.LEADS_READ_ASSIGNED, PERMISSIONS.STUDENTS_READ_LIMITED,
  ],
  [ROLES.PARENT]: [
    PERMISSIONS.PORTAL_ACCESS, PERMISSIONS.FEES_PAYMENTS_READ, PERMISSIONS.FEES_ONLINE_PAY,
    PERMISSIONS.PROFILE_UPDATE_REQUEST,
  ],
  [ROLES.STUDENT]: [
    PERMISSIONS.PORTAL_ACCESS,
  ],
};

export function can(roles: string[], permission: PermissionKey): boolean {
  return roles.some((r) => (ROLE_PERMISSIONS[r as RoleKey] ?? []).includes(permission));
}

export function canAny(roles: string[], permissions: PermissionKey[]): boolean {
  return permissions.some((p) => can(roles, p));
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  PRINCIPAL: 'Principal',
  ADMISSION_COUNSELLOR: 'Admission Counsellor',
  ACCOUNTANT: 'Accountant',
  TEACHER: 'Teacher',
  CLASS_TEACHER: 'Class Teacher',
  FRONT_DESK: 'Front Desk',
  PARENT: 'Parent / Guardian',
  STUDENT: 'Student',
  IT_ADMIN: 'IT Administrator',
};
