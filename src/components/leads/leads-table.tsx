'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, MessageCircle, UserCheck, Inbox, Send } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/leads/status-badge';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, type ApiFetchError } from '@/components/dashboard/api';
import { fmtDate, fmtDateTime } from '@/lib/date-utils';
import { COMMUNICATION_CHANNELS } from '@/lib/constants';

export type LeadRow = {
  id: string;
  leadNumber: string;
  studentName: string;
  classApplyingFor: string | null;
  guardianName: string;
  mobile: string;
  email: string | null;
  sourceName: string | null;
  assigneeName: string | null;
  status: string;
  priority: string;
  nextFollowUpDate: string | null;
  lastActivityAt: string;
};

const PRIORITY_DOT: Record<string, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-emerald-500',
};

export function LeadsTable({
  rows,
  counsellors,
  canAssign,
}: {
  rows: LeadRow[];
  counsellors: { id: string; name: string }[];
  canAssign: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);
  const [communicating, setCommunicating] = useState(false);
  const [commOpen, setCommOpen] = useState(false);

  useEffect(() => setSelected(new Set()), [rows]);

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }
  function toggleOne(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function bulkAssign(assignedTo: string) {
    if (!assignedTo || selectedIds.length === 0) return;
    setAssigning(true);
    try {
      await apiFetch('/api/admissions/leads/bulk-assign', {
        method: 'POST',
        body: JSON.stringify({ leadIds: selectedIds, assignedTo }),
      });
      toast({ title: 'Leads assigned', description: `${selectedIds.length} lead(s) reassigned.` });
      setSelected(new Set());
      router.refresh();
    } catch (e) {
      const err = e as ApiFetchError;
      toast({ title: 'Bulk assign failed', description: err.message, variant: 'destructive' });
    } finally {
      setAssigning(false);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <Inbox className="h-10 w-10 text-muted-foreground/50" aria-hidden />
        <p className="text-sm font-medium">No leads found</p>
        <p className="text-xs text-muted-foreground">Try adjusting the filters, or create a new lead.</p>
      </div>
    );
  }

  return (
    <div>
      {selected.size > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-2.5">
          <span className="text-sm font-medium">{selected.size} selected</span>
          {canAssign ? (
            <Select onValueChange={(v) => void bulkAssign(v)} disabled={assigning} value="">
              <SelectTrigger className="h-9 w-[200px]" aria-label="Bulk assign to counsellor">
                <SelectValue placeholder={assigning ? 'Assigning…' : 'Assign to counsellor'} />
              </SelectTrigger>
              <SelectContent>
                {counsellors.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2"><UserCheck className="h-3.5 w-3.5" />{c.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Button variant="outline" size="sm" className="h-9" onClick={() => setCommOpen(true)}>
            <MessageCircle className="mr-1.5 h-4 w-4" /> Send WhatsApp / Email
          </Button>
          <Button variant="ghost" size="sm" className="h-9" onClick={() => setSelected(new Set())}>
            Clear selection
          </Button>
          {assigning ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden /> : null}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all leads"
                />
              </TableHead>
              <TableHead>Lead #</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Guardian</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Counsellor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Next follow-up</TableHead>
              <TableHead>Last activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} className="hover:bg-muted/40">
                <TableCell>
                  <Checkbox
                    checked={selected.has(r.id)}
                    onCheckedChange={() => toggleOne(r.id)}
                    aria-label={`Select lead ${r.leadNumber}`}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs">
                  <Link href={`/dashboard/leads/${r.id}`} className="font-medium text-primary hover:underline">
                    {r.leadNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/leads/${r.id}`} className="font-medium hover:underline">
                    {r.studentName}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">{r.classApplyingFor ?? '—'}</TableCell>
                <TableCell>
                  <p className="text-sm">{r.guardianName}</p>
                  <p className="text-xs text-muted-foreground">{r.mobile}</p>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">{r.sourceName ?? '—'}</TableCell>
                <TableCell className="whitespace-nowrap text-sm">{r.assigneeName ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className={`inline-block h-2 w-2 rounded-full ${PRIORITY_DOT[r.priority] ?? 'bg-muted-foreground'}`} aria-hidden />
                    {r.priority.charAt(0) + r.priority.slice(1).toLowerCase()}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">{fmtDate(r.nextFollowUpDate)}</TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDateTime(r.lastActivityAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Bulk communication (creates QUEUED CommunicationLog entries) */}
      <CommDialog
        open={commOpen}
        onOpenChange={setCommOpen}
        leadIds={selectedIds}
        onDone={() => setSelected(new Set())}
      />
    </div>
  );
}

function CommDialog({
  open, onOpenChange, leadIds, onDone,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; leadIds: string[]; onDone: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [channel, setChannel] = useState('WHATSAPP');
  const [subject, setSubject] = useState('Admission enquiry — SP International School');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    if (content.trim().length < 5) {
      toast({ title: 'Message too short', description: 'Write at least a few words.', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch<{ queued: number }>('/api/admissions/leads/communicate', {
        method: 'POST',
        body: JSON.stringify({ leadIds, channel, subject, content }),
      });
      toast({
        title: 'Communication queued',
        description: `${res.data?.queued ?? leadIds.length} message(s) queued for delivery.`,
      });
      onOpenChange(false);
      onDone();
      router.refresh();
    } catch (e) {
      const err = e as ApiFetchError;
      toast({ title: 'Could not queue communication', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4" /> Queue communication
          </DialogTitle>
          <DialogDescription>
            {leadIds.length} selected lead(s). Messages are queued in the Communication Log — WhatsApp/SMS gateway integration is planned.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Channel</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger aria-label="Channel"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMMUNICATION_CHANNELS.filter((c) => c !== 'IN_PERSON' && c !== 'PHONE').map((c) => (
                  <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comm-subject">Subject</Label>
            <Input id="comm-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comm-content">Message</Label>
            <Textarea id="comm-content" rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Type the message to send…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={() => void send()} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Queue {leadIds.length} message(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
