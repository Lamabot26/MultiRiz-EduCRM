'use client';

import { useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Search, Upload, Table2, Columns3, FileDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, type ApiFetchError } from '@/components/dashboard/api';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_SOURCES, LEAD_SOURCE_LABELS, PRIORITIES } from '@/lib/constants';

// ---------------------------------------------------------------------
// Filters — Selects + search that push query params via router.push.
// ---------------------------------------------------------------------
export function LeadsFilters({
  counsellors,
  showCounsellorFilter,
}: {
  counsellors: { id: string; name: string }[];
  showCounsellorFilter: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');

  function pushParams(mutate: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete('page'); // any filter change resets pagination
    router.push(`/dashboard/leads?${next.toString()}`);
  }

  const hasFilters = ['q', 'status', 'source', 'priority', 'assignedTo'].some((k) => params.get(k));

  return (
    <div className="mb-4 flex flex-col gap-2 rounded-lg border bg-card p-3 md:flex-row md:items-center md:flex-wrap">
      <form
        className="flex min-w-0 flex-1 gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          pushParams((p) => {
            if (q) p.set('q', q); else p.delete('q');
          });
        }}
      >
        <div className="relative min-w-0 flex-1 md:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, mobile, email…"
            className="pl-8"
            aria-label="Search leads"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm" className="h-10">Search</Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={params.get('status') ?? 'all'}
          onValueChange={(v) => pushParams((p) => (v === 'all' ? p.delete('status') : p.set('status', v)))}
        >
          <SelectTrigger className="h-10 w-[160px]" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {LEAD_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{LEAD_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.get('source') ?? 'all'}
          onValueChange={(v) => pushParams((p) => (v === 'all' ? p.delete('source') : p.set('source', v)))}
        >
          <SelectTrigger className="h-10 w-[160px]" aria-label="Filter by source">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {LEAD_SOURCES.map((s) => (
              <SelectItem key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.get('priority') ?? 'all'}
          onValueChange={(v) => pushParams((p) => (v === 'all' ? p.delete('priority') : p.set('priority', v)))}
        >
          <SelectTrigger className="h-10 w-[130px]" aria-label="Filter by priority">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showCounsellorFilter ? (
          <Select
            value={params.get('assignedTo') ?? 'all'}
            onValueChange={(v) => pushParams((p) => (v === 'all' ? p.delete('assignedTo') : p.set('assignedTo', v)))}
          >
            <SelectTrigger className="h-10 w-[170px]" aria-label="Filter by counsellor">
              <SelectValue placeholder="Counsellor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All counsellors</SelectItem>
              {counsellors.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <div className="flex overflow-hidden rounded-md border" role="group" aria-label="View mode">
          <Button
            variant={(params.get('view') ?? 'table') === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-10 rounded-none"
            onClick={() => pushParams((p) => p.delete('view'))}
            aria-pressed={(params.get('view') ?? 'table') === 'table'}
          >
            <Table2 className="mr-1.5 h-4 w-4" /> Table
          </Button>
          <Button
            variant={params.get('view') === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-10 rounded-none"
            onClick={() => pushParams((p) => p.set('view', 'kanban'))}
            aria-pressed={params.get('view') === 'kanban'}
          >
            <Columns3 className="mr-1.5 h-4 w-4" /> Kanban
          </Button>
        </div>

        {hasFilters ? (
          <Button variant="ghost" size="sm" className="h-10" onClick={() => router.push('/dashboard/leads')}>
            <X className="mr-1 h-4 w-4" /> Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Import CSV — file input reading text and POSTing to the import API.
// ---------------------------------------------------------------------
export function ImportCsvButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function onFile(file: File) {
    setBusy(true);
    try {
      const text = await file.text();
      const res = await apiFetch<{ created: number; skipped: number; errors: string[] }>('/api/admissions/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: text,
      });
      toast({
        title: 'Import complete',
        description: `Created ${res.data?.created ?? 0} leads · skipped ${res.data?.skipped ?? 0}${
          res.data?.errors?.length ? ` · first error: ${res.data.errors[0]}` : ''
        }`,
      });
      router.refresh();
    } catch (e) {
      const err = e as ApiFetchError;
      toast({ title: 'Import failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        aria-label="Import leads CSV file"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
        }}
      />
      <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        Import CSV
      </Button>
    </>
  );
}

// ---------------------------------------------------------------------
// Export CSV — preserves current filters in the download link.
// ---------------------------------------------------------------------
export function ExportCsvLink({ href }: { href: string }) {
  return (
    <Button variant="outline" asChild>
      <a href={href} download>
        <FileDown className="mr-2 h-4 w-4" /> Export CSV
      </a>
    </Button>
  );
}
