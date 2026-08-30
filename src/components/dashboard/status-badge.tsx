import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// =====================================================================
// Shared status → Badge styling used across dashboard pages & islands.
// Green = ACTIVE/APPROVED/PAID/PRESENT/CONFIRMED, amber = PENDING/
// PARTIALLY_PAID/LATE, destructive = REJECTED/REVOKED/WITHDRAWN/etc.
// Pure presentational — safe in both server and client components.
// =====================================================================

const GREEN = 'border-success/30 bg-success/10 text-success';
const AMBER = 'border-warning/40 bg-warning/10 text-warning';
const DESTRUCTIVE = 'border-destructive/30 bg-destructive/10 text-destructive';
const MUTED = '';

export function statusBadgeClass(status?: string | null): string {
  switch (status) {
    case 'ACTIVE':
    case 'APPROVED':
    case 'PAID':
    case 'PRESENT':
    case 'CONFIRMED':
    case 'SENT':
      return GREEN;
    case 'PENDING':
    case 'PARTIALLY_PAID':
    case 'LATE':
    case 'ISSUED':
    case 'QUEUED':
      return AMBER;
    case 'REJECTED':
    case 'REVOKED':
    case 'WITHDRAWN':
    case 'TRANSFERRED':
    case 'OVERDUE':
    case 'FAILED':
    case 'ABSENT':
      return DESTRUCTIVE;
    case 'INACTIVE':
    case 'ALUMNI':
    case 'DRAFT':
    case 'CANCELLED':
    case 'LEAVE':
      return MUTED;
    default:
      return MUTED;
  }
}

export function StatusBadge({ status, label, className }: { status?: string | null; label?: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn(statusBadgeClass(status), className)}>
      {label ?? status ?? '—'}
    </Badge>
  );
}
