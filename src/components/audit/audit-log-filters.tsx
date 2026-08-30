'use client';

// =====================================================================
// Audit-log filter bar — search, entity type, action, user, date range.
// Updates ?query params via router.push (server re-render).
// =====================================================================

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type Props = {
  users: { id: string; name: string }[];
  entityTypes: string[];
  actions: string[];
};

export function AuditLogFilters({ users, entityTypes, actions }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const [userId, setUserId] = useState(sp.get('userId') ?? '');
  const [entityType, setEntityType] = useState(sp.get('entityType') ?? '');
  const [action, setAction] = useState(sp.get('action') ?? '');
  const [dateFrom, setDateFrom] = useState(sp.get('dateFrom') ?? '');
  const [dateTo, setDateTo] = useState(sp.get('dateTo') ?? '');

  const push = (updates: Record<string, string>) => {
    const params = new URLSearchParams(sp.toString());
    for (const [k, raw] of Object.entries(updates)) {
      const v = raw.trim() === '' ? '' : raw; // ' ' sentinel from "All" items
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete('page');
    router.push(`/dashboard/audit-logs?${params.toString()}`);
  };

  const apply = () => push({ q, userId, entityType, action, dateFrom, dateTo });

  return (
    <div className="space-y-3" role="search" aria-label="Audit log filters">
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="al-q">Search (entity ID / action)</Label>
          <form onSubmit={(e) => { e.preventDefault(); apply(); }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
              <Input id="al-q" className="pl-8" placeholder="STUDENT_… / uuid…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </form>
        </div>
        <div className="space-y-1.5">
          <Label>Entity type</Label>
          <Select value={entityType} onValueChange={(v) => { setEntityType(v); push({ entityType: v }); }}>
            <SelectTrigger aria-label="Entity type"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All types</SelectItem>
              {entityTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Action</Label>
          <Select value={action} onValueChange={(v) => { setAction(v); push({ action: v }); }}>
            <SelectTrigger aria-label="Action"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All actions</SelectItem>
              {actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>User</Label>
          <Select value={userId} onValueChange={(v) => { setUserId(v); push({ userId: v }); }}>
            <SelectTrigger aria-label="User"><SelectValue placeholder="All users" /></SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All users</SelectItem>
              {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="al-from">From</Label>
            <Input id="al-from" type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); push({ dateFrom: e.target.value }); }} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="al-to">To</Label>
            <Input id="al-to" type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); push({ dateTo: e.target.value }); }} />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setQ(''); setUserId(''); setEntityType(''); setAction(''); setDateFrom(''); setDateTo(''); router.push('/dashboard/audit-logs'); }}
        >
          <X className="mr-1 h-4 w-4" aria-hidden /> Clear filters
        </Button>
      </div>
    </div>
  );
}
