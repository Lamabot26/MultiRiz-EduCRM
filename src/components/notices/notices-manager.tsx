'use client';

// =====================================================================
// Notices & Events manager (notices.manage) — tabbed tables with
// create/edit dialogs, publish toggles and guarded deletes.
// All mutations hit /api/notices* and /api/events* then refresh.
// =====================================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Loader2, Megaphone, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/components/dashboard/api';
import { fmtDateTime } from '@/lib/date-utils';
import { NOTICE_CATEGORIES, NOTICE_AUDIENCES } from '@/lib/constants';

/** Empty string → null (tiny local helper). */
const orNull = (v: string): string | null => {
  const t = v.trim();
  return t.length ? t : null;
};

type NoticeRow = {
  id: string; title: string; content: string; category: string; audience: string;
  isPublished: boolean; publishedAt: Date | null; expiresAt: Date | null;
  attachmentUrl: string | null; attachmentName: string | null; createdAt: Date;
};
type EventRow = {
  id: string; title: string; description: string; startsAt: Date; endsAt: Date | null;
  location: string | null; isPublished: boolean; createdAt: Date;
};

const CATEGORY_BADGE: Record<string, string> = {
  GENERAL: 'bg-secondary text-secondary-foreground',
  ACADEMIC: '',
  EVENT: 'bg-accent text-accent-foreground',
  ADMISSION: 'border',
  FEE: 'border',
  URGENT: 'bg-destructive text-destructive',
};

function toLocalInput(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// =====================================================================
export function NoticesManager({ notices, events }: { notices: NoticeRow[]; events: EventRow[] }) {
  return (
    <Tabs defaultValue="notices" className="space-y-4">
      <TabsList>
        <TabsTrigger value="notices">Notices ({notices.length})</TabsTrigger>
        <TabsTrigger value="events">Events ({events.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="notices"><NoticesTab notices={notices} /></TabsContent>
      <TabsContent value="events"><EventsTab events={events} /></TabsContent>
    </Tabs>
  );
}

// ============================ Notices tab =============================
function NoticesTab({ notices }: { notices: NoticeRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NoticeRow | null>(null);
  const [deleting, setDeleting] = useState<NoticeRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: '', content: '', category: 'GENERAL', audience: 'PUBLIC',
    isPublished: false, attachmentUrl: '', attachmentName: '',
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '', category: 'GENERAL', audience: 'PUBLIC', isPublished: false, attachmentUrl: '', attachmentName: '' });
    setDialogOpen(true);
  };
  const openEdit = (n: NoticeRow) => {
    setEditing(n);
    setForm({
      title: n.title, content: n.content, category: n.category, audience: n.audience,
      isPublished: n.isPublished, attachmentUrl: n.attachmentUrl ?? '', attachmentName: n.attachmentName ?? '',
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: 'Title and content are required', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const body = {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        audience: form.audience,
        isPublished: form.isPublished,
        attachmentUrl: orNull(form.attachmentUrl),
        attachmentName: orNull(form.attachmentName),
      };
      if (editing) {
        await apiFetch(`/api/notices/${editing.id}`, { method: 'PATCH', body: JSON.stringify(body) });
        toast({ title: 'Notice updated' });
      } else {
        await apiFetch('/api/notices', { method: 'POST', body: JSON.stringify(body) });
        toast({ title: 'Notice created', description: form.isPublished ? 'Published immediately.' : 'Saved as draft.' });
      }
      setDialogOpen(false);
      router.refresh();
    } catch (err) {
      toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (n: NoticeRow) => {
    setBusy(true);
    try {
      await apiFetch(`/api/notices/${n.id}`, { method: 'PATCH', body: JSON.stringify({ isPublished: !n.isPublished }) });
      toast({ title: n.isPublished ? 'Notice unpublished' : 'Notice published' });
      router.refresh();
    } catch (err) {
      toast({ title: 'Update failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await apiFetch(`/api/notices/${deleting.id}`, { method: 'DELETE' });
      toast({ title: 'Notice deleted' });
      setDeleting(null);
      router.refresh();
    } catch (err) {
      toast({ title: 'Delete failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Drafts stay visible here; the public site shows published notices only.</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" aria-hidden /> New Notice
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {notices.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Megaphone className="h-10 w-10 text-muted-foreground/50" aria-hidden />
              <p className="text-sm font-medium">No notices yet</p>
              <p className="text-xs text-muted-foreground">Create the first notice for parents and students.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notices.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="max-w-[260px] truncate font-medium">{n.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={CATEGORY_BADGE[n.category] ?? ''}>{n.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{n.audience}</TableCell>
                      <TableCell>
                        {n.isPublished
                          ? <Badge variant="outline" className="border-success/30 bg-success/10 text-success">Published</Badge>
                          : <Badge variant="outline">Draft</Badge>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{fmtDateTime(n.publishedAt)}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{fmtDateTime(n.expiresAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(n)} aria-label={`Edit ${n.title}`}>
                            <Pencil className="h-4 w-4" aria-hidden />
                          </Button>
                          <Button size="sm" variant="ghost" disabled={busy} onClick={() => togglePublish(n)}>
                            {n.isPublished ? 'Unpublish' : 'Publish'}
                          </Button>
                          {!n.isPublished && (
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleting(n)} aria-label={`Delete ${n.title}`}>
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* create/edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit notice' : 'New notice'}</DialogTitle>
            <DialogDescription>Published notices appear on the public website instantly.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nt-title">Title *</Label>
              <Input id="nt-title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nt-content">Content *</Label>
              <Textarea id="nt-content" rows={6} value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NOTICE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Audience</Label>
                <Select value={form.audience} onValueChange={(v) => setForm((p) => ({ ...p, audience: v }))}>
                  <SelectTrigger aria-label="Audience"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NOTICE_AUDIENCES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nt-atturl">Attachment URL</Label>
                <Input id="nt-atturl" placeholder="/uploads/… or https://…" value={form.attachmentUrl} onChange={(e) => setForm((p) => ({ ...p, attachmentUrl: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nt-attname">Attachment name</Label>
                <Input id="nt-attname" value={form.attachmentName} onChange={(e) => setForm((p) => ({ ...p, attachmentName: e.target.value }))} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.isPublished} onCheckedChange={(v) => setForm((p) => ({ ...p, isPublished: v }))} aria-label="Publish immediately" />
              Publish immediately
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={save} disabled={busy || !form.title.trim() || !form.content.trim()}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              {editing ? 'Save changes' : 'Create notice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* delete confirm */}
      <Dialog open={deleting !== null} onOpenChange={(o) => { if (!o) setDeleting(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete draft notice?</DialogTitle>
            <DialogDescription>
              “{deleting?.title}” will be permanently removed. Published notices must be unpublished first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={busy}>Cancel</Button>
            <Button variant="destructive" onClick={doDelete} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================ Events tab ==============================
function EventsTab({ events }: { events: EventRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [deleting, setDeleting] = useState<EventRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', startsAt: '', endsAt: '', location: '', isPublished: false,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', startsAt: '', endsAt: '', location: '', isPublished: false });
    setDialogOpen(true);
  };
  const openEdit = (ev: EventRow) => {
    setEditing(ev);
    setForm({
      title: ev.title, description: ev.description, startsAt: toLocalInput(ev.startsAt),
      endsAt: toLocalInput(ev.endsAt), location: ev.location ?? '', isPublished: ev.isPublished,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.startsAt) {
      toast({ title: 'Title, description and start time are required', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        location: orNull(form.location),
        isPublished: form.isPublished,
      };
      if (editing) {
        await apiFetch(`/api/events/${editing.id}`, { method: 'PATCH', body: JSON.stringify(body) });
        toast({ title: 'Event updated' });
      } else {
        await apiFetch('/api/events', { method: 'POST', body: JSON.stringify(body) });
        toast({ title: 'Event created' });
      }
      setDialogOpen(false);
      router.refresh();
    } catch (err) {
      toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (ev: EventRow) => {
    setBusy(true);
    try {
      await apiFetch(`/api/events/${ev.id}`, { method: 'PATCH', body: JSON.stringify({ isPublished: !ev.isPublished }) });
      toast({ title: ev.isPublished ? 'Event unpublished' : 'Event published' });
      router.refresh();
    } catch (err) {
      toast({ title: 'Update failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await apiFetch(`/api/events/${deleting.id}`, { method: 'DELETE' });
      toast({ title: 'Event deleted' });
      setDeleting(null);
      router.refresh();
    } catch (err) {
      toast({ title: 'Delete failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">School events shown on the public website and dashboard.</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" aria-hidden /> New Event
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {events.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground/50" aria-hidden />
              <p className="text-sm font-medium">No events yet</p>
              <p className="text-xs text-muted-foreground">Create the first school event.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Starts</TableHead>
                    <TableHead>Ends</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((ev) => (
                    <TableRow key={ev.id}>
                      <TableCell className="max-w-[260px] truncate font-medium">{ev.title}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{fmtDateTime(ev.startsAt)}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{fmtDateTime(ev.endsAt)}</TableCell>
                      <TableCell className="max-w-[160px] truncate text-sm">{ev.location ?? '—'}</TableCell>
                      <TableCell>
                        {ev.isPublished
                          ? <Badge variant="outline" className="border-success/30 bg-success/10 text-success">Published</Badge>
                          : <Badge variant="outline">Draft</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(ev)} aria-label={`Edit ${ev.title}`}>
                            <Pencil className="h-4 w-4" aria-hidden />
                          </Button>
                          <Button size="sm" variant="ghost" disabled={busy} onClick={() => togglePublish(ev)}>
                            {ev.isPublished ? 'Unpublish' : 'Publish'}
                          </Button>
                          {!ev.isPublished && (
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleting(ev)} aria-label={`Delete ${ev.title}`}>
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* create/edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit event' : 'New event'}</DialogTitle>
            <DialogDescription>Times are entered in the school&apos;s local timezone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ev-title">Title *</Label>
              <Input id="ev-title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-desc">Description *</Label>
              <Textarea id="ev-desc" rows={4} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ev-start">Starts at *</Label>
                <Input id="ev-start" type="datetime-local" value={form.startsAt} onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-end">Ends at</Label>
                <Input id="ev-end" type="datetime-local" value={form.endsAt} onChange={(e) => setForm((p) => ({ ...p, endsAt: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-loc">Location</Label>
              <Input id="ev-loc" placeholder="Main auditorium" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.isPublished} onCheckedChange={(v) => setForm((p) => ({ ...p, isPublished: v }))} aria-label="Publish immediately" />
              Publish immediately
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={save} disabled={busy || !form.title.trim() || !form.description.trim() || !form.startsAt}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              {editing ? 'Save changes' : 'Create event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* delete confirm */}
      <Dialog open={deleting !== null} onOpenChange={(o) => { if (!o) setDeleting(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete draft event?</DialogTitle>
            <DialogDescription>
              “{deleting?.title}” will be permanently removed. Published events must be unpublished first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={busy}>Cancel</Button>
            <Button variant="destructive" onClick={doDelete} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
