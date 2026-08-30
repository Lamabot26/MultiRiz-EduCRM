import { Badge } from '@/components/ui/badge';
import { LEAD_STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

// Color map per design language:
//  NEW = secondary (blue-ish); FOLLOW_UP / DOCUMENTS_PENDING = amber;
//  VISIT/ASSESSMENT/INTERVIEW = secondary (purple-ish);
//  OFFER_MADE = gold; ADMISSION_CONFIRMED = green; LOST/NOT_INTERESTED = muted;
//  WAITLISTED = outline; everything else = outline.
const STATUS_CLASS: Record<string, string> = {
  FOLLOW_UP: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300',
  DOCUMENTS_PENDING: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300',
  OFFER_MADE: 'border-yellow-500/50 bg-yellow-100 text-yellow-900 dark:border-yellow-600 dark:bg-yellow-950 dark:text-yellow-300',
  ADMISSION_CONFIRMED: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  LOST: 'border-transparent bg-muted text-muted-foreground',
  NOT_INTERESTED: 'border-transparent bg-muted text-muted-foreground',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  NEW: 'secondary',
  VISIT_SCHEDULED: 'secondary',
  ASSESSMENT_SCHEDULED: 'secondary',
  INTERVIEW_SCHEDULED: 'secondary',
  CONTACTED: 'outline',
  APPLICATION_STARTED: 'outline',
  APPLICATION_SUBMITTED: 'outline',
  WAITLISTED: 'outline',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const label = LEAD_STATUS_LABELS[status] ?? status;
  const variant = STATUS_VARIANT[status] ?? 'outline';
  return (
    <Badge variant={variant} className={cn(STATUS_CLASS[status], 'whitespace-nowrap', className)}>
      {label}
    </Badge>
  );
}

export function ApplicationStatusBadge({ status, className }: { status: string; className?: string }) {
  const map: Record<string, string> = {
    SUBMITTED: 'border-transparent bg-muted text-foreground',
    UNDER_REVIEW: 'border-amber-300 bg-amber-50 text-amber-800',
    ASSESSMENT_SCHEDULED: 'border-purple-200 bg-purple-50 text-purple-800',
    INTERVIEW_SCHEDULED: 'border-purple-200 bg-purple-50 text-purple-800',
    OFFER_MADE: 'border-yellow-500/50 bg-yellow-100 text-yellow-900',
    ACCEPTED: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    REJECTED: 'border-red-200 bg-red-50 text-red-800',
    WAITLISTED: 'border-border bg-background text-foreground',
    WITHDRAWN: 'border-transparent bg-muted text-muted-foreground',
  };
  return (
    <Badge variant="outline" className={cn(map[status] ?? 'border-border bg-background', 'whitespace-nowrap', className)}>
      {status}
    </Badge>
  );
}
