'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GripVertical, Inbox, Lock } from 'lucide-react';
import { StatusBadge } from '@/components/leads/status-badge';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, type ApiFetchError } from '@/components/dashboard/api';
import { cn } from '@/lib/utils';
import {
  LEAD_STATUSES, LEAD_STATUS_LABELS, CLOSED_LEAD_STATUSES,
} from '@/lib/constants';

export type KanbanLead = {
  id: string;
  leadNumber: string;
  studentName: string;
  mobile: string;
  classApplyingFor: string | null;
  status: string;
  priority: string;
  assigneeName: string | null;
};

// The 11 open pipeline stages as kanban columns; LOST / NOT_INTERESTED /
// ADMISSION_CONFIRMED live in a collapsed "Closed" column (they are managed
// from the lead detail page per spec — e.g. lost-reason dialog).
const OPEN_COLUMNS = LEAD_STATUSES.filter((s) => !CLOSED_LEAD_STATUSES.includes(s));

export function KanbanBoard({ initial }: { initial: KanbanLead[] }) {
  const router = useRouter();
  const { toast } = useToast();
  // Optimistic overrides (leadId → status). Kept separate from props so the
  // server payload always wins after router.refresh() — no setState-in-effect.
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [closedOpen, setClosedOpen] = useState(false);

  const items: KanbanLead[] = initial.map((l) =>
    overrides[l.id] ? { ...l, status: overrides[l.id] } : l,
  );

  async function moveLead(id: string, status: string) {
    const lead = items.find((l) => l.id === id);
    if (!lead || lead.status === status) return;
    // optimistic update
    setOverrides((o) => ({ ...o, [id]: status }));
    try {
      await apiFetch(`/api/admissions/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast({
        title: 'Stage updated',
        description: `${lead.studentName} moved to “${LEAD_STATUS_LABELS[status] ?? status}”.`,
      });
      router.refresh();
      // Server now agrees with the override — drop it.
      setOverrides((o) => {
        const next = { ...o };
        delete next[id];
        return next;
      });
    } catch (e) {
      const err = e as ApiFetchError;
      setOverrides((o) => {
        const next = { ...o }; // revert
        delete next[id];
        return next;
      });
      toast({ title: 'Could not move lead', description: err.message, variant: 'destructive' });
    }
  }

  const byStatus = (status: string) => items.filter((l) => l.status === status);
  const closedItems = items.filter((l) => CLOSED_LEAD_STATUSES.includes(l.status));

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-3">
        {OPEN_COLUMNS.map((status) => {
          const cards = byStatus(status);
          return (
            <div
              key={status}
              className={cn(
                'flex w-64 shrink-0 flex-col rounded-lg border bg-muted/30',
                overColumn === status && 'border-primary ring-2 ring-primary/20',
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setOverColumn(status);
              }}
              onDragLeave={() => setOverColumn((c) => (c === status ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                setOverColumn(null);
                const id = dragId ?? e.dataTransfer.getData('text/plain');
                if (id) void moveLead(id, status);
              }}
            >
              <div className="flex items-center justify-between border-b bg-background/60 px-3 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide">{LEAD_STATUS_LABELS[status]}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{cards.length}</span>
              </div>
              <div className="flex max-h-[62vh] flex-col gap-2 overflow-y-auto p-2" data-status={status}>
                {cards.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">Drop cards here</p>
                ) : (
                  cards.map((lead) => (
                    <KanbanCard key={lead.id} lead={lead} onDragStart={(id) => setDragId(id)} onDragEnd={() => setDragId(null)} />
                  ))
                )}
              </div>
            </div>
          );
        })}

        {/* Collapsed closed column */}
        <div className="w-14 shrink-0">
          <button
            type="button"
            onClick={() => setClosedOpen((o) => !o)}
            aria-expanded={closedOpen}
            className="flex h-full w-full flex-col items-center gap-3 rounded-lg border bg-muted/30 px-1 py-3 text-muted-foreground transition-colors hover:bg-muted/60"
          >
            <Lock className="h-4 w-4" aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-widest [writing-mode:vertical-rl]">
              Closed
            </span>
            <span className="rounded-full bg-muted px-1.5 text-xs font-bold">{closedItems.length}</span>
          </button>
        </div>
        {closedOpen ? (
          <div className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30">
            <div className="border-b bg-background/60 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">
              Closed / Lost
            </div>
            <div className="flex max-h-[62vh] flex-col gap-2 overflow-y-auto p-2">
              {closedItems.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">No closed leads.</p>
              ) : (
                closedItems.map((lead) => (
                  <KanbanCard key={lead.id} lead={lead} onDragStart={() => {}} onDragEnd={() => {}} />
                ))
              )}
              <p className="px-2 pt-1 text-[11px] text-muted-foreground">
                Lost / Not-interested moves are made from the lead detail page (reason captured).
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function KanbanCard({
  lead, onDragStart, onDragEnd,
}: {
  lead: KanbanLead;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}) {
  const isClosed = CLOSED_LEAD_STATUSES.includes(lead.status);
  return (
    <div
      draggable={!isClosed}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', lead.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(lead.id);
      }}
      onDragEnd={onDragEnd}
      className={cn(
        'group rounded-md border bg-card p-2.5 shadow-sm',
        !isClosed && 'cursor-grab active:cursor-grabbing',
        isClosed && 'opacity-80',
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <Link href={`/dashboard/leads/${lead.id}`} className="min-w-0 text-sm font-medium leading-tight hover:underline">
          {lead.studentName}
        </Link>
        {!isClosed ? <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden /> : null}
      </div>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">{lead.leadNumber}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {lead.classApplyingFor ?? '—'} · {lead.mobile}
      </p>
      <div className="mt-2 flex items-center justify-between gap-1">
        <StatusBadge status={lead.status} className="text-[10px] px-1.5 py-0" />
        <span
          className={cn(
            'inline-block h-2 w-2 rounded-full',
            lead.priority === 'HIGH' ? 'bg-red-500' : lead.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500',
          )}
          title={`Priority: ${lead.priority}`}
        />
      </div>
    </div>
  );
}

export function KanbanEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <Inbox className="h-10 w-10 text-muted-foreground/50" aria-hidden />
      <p className="text-sm font-medium">No leads found</p>
      <p className="text-xs text-muted-foreground">Create a lead or relax the filters to see the pipeline.</p>
    </div>
  );
}
