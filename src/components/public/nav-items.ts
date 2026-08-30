// Shared navigation + small helpers for the public website.
// Server-safe (no 'use client') so both header, footer and pages can import.

export type NavLink = { href: string; label: string };

export const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/academics', label: 'Academics' },
  { href: '/admissions', label: 'Admissions' },
  { href: '/facilities', label: 'Facilities' },
  { href: '/student-life', label: 'Student Life' },
  { href: '/notices', label: 'Notices' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
];

export const POLICY_LINKS: NavLink[] = [
  { href: '/policies?page=privacy-policy', label: 'Privacy Policy' },
  { href: '/policies?page=refund-policy', label: 'Refund Policy' },
  { href: '/policies?page=terms-of-use', label: 'Terms of Use' },
  { href: '/policies?page=child-safety-policy', label: 'Child Safety Policy' },
  { href: '/policies?page=fee-policy', label: 'Fee Policy' },
];

/** Classes a family can apply for — mirrors the admissions CRM. */
export const CLASS_OPTIONS: string[] = [
  'Pre-Nursery',
  'Nursery',
  'LKG',
  'UKG',
  ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`),
];

/** Initials for the Principal avatar (ignores [placeholder] brackets). */
export function initialsFrom(name: string, fallback = 'SP'): string {
  const clean = name.replace(/[\[\](){}—–-]/g, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return fallback;
  const letters = words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return letters || fallback;
}

/** Tailwind classes for notice category badges (kept theme-consistent). */
export function noticeCategoryBadgeClass(category: string): string {
  switch (category) {
    case 'URGENT':
      return 'bg-destructive text-white';
    case 'ADMISSION':
      return 'bg-accent text-primary';
    case 'EVENT':
      return 'bg-primary text-primary-foreground';
    case 'FEE':
      return 'bg-warning/30 text-foreground';
    case 'ACADEMIC':
      return 'bg-secondary text-primary';
    default:
      return 'border border-border bg-card text-muted-foreground';
  }
}

export const NOTICE_CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'General',
  ACADEMIC: 'Academic',
  EVENT: 'Event',
  ADMISSION: 'Admission',
  FEE: 'Fee',
  URGENT: 'Urgent',
};

/** True when WebsitePage content is an ALL_CAPS placeholder token like "REFUND_POLICY_PLACEHOLDER". */
export function isPlaceholderContent(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return true;
  // Pure caps tokens (allowing underscores, brackets, dashes) that are short
  // or self-declare as placeholders should NOT be rendered raw.
  const capsToken = /^[A-Z0-9_\[\]—\-.,:\s]+$/;
  if (capsToken.test(trimmed) && (trimmed.length < 160 || /PLACEHOLDER/i.test(trimmed))) {
    return true;
  }
  return false;
}
