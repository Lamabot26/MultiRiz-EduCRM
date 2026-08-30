'use client';

// =====================================================================
// Users manager (users.manage) — table with role badges, active switch,
// create/edit dialogs. Protections mirrored from the API: cannot
// deactivate self; last active Super Admin cannot lose the role.
// =====================================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/components/dashboard/api';
import { fmtDateTime } from '@/lib/date-utils';
import { ROLES } from '@/lib/constants';
import { ROLE_LABELS } from '@/lib/rbac';

const ALL_ROLES = Object.values(ROLES);

/** Empty string → null (tiny local helper). */
const orNull = (v: string): string | null => {
  const t = v.trim();
  return t.length ? t : null;
};

export type UserRow = {
  id: string; name: string; email: string; phone: string | null;
  isActive: boolean; lastLoginAt: Date | null; failedLoginCount: number;
  roles: string[]; createdAt: Date;
};

type Props = {
  users: UserRow[];
  currentUserId: string;
};

export function UsersManager({ users, currentUserId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);

  const [createForm, setCreateForm] = useState({
    name: '', email: '', password: '', phone: '', roles: [] as string[],
  });
  const [editForm, setEditForm] = useState({
    name: '', phone: '', roles: [] as string[], password: '', isActive: true,
  });

  const toggleRole = (list: string[], role: string): string[] =>
    list.includes(role) ? list.filter((r) => r !== role) : [...list, role];

  const createUser = async () => {
    if (!createForm.name.trim() || !createForm.email.trim() || createForm.password.length < 8 || createForm.roles.length === 0) {
      toast({ title: 'Name, email, an 8+ char password and at least one role are required', variant: 'destructive' });
      return;
    }
    setBusy('create');
    try {
      await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          name: createForm.name.trim(),
          email: createForm.email.trim(),
          password: createForm.password,
          phone: orNull(createForm.phone),
          roles: createForm.roles,
        }),
      });
      toast({ title: 'User created', description: `${createForm.name} can now sign in.` });
      setCreateOpen(false);
      setCreateForm({ name: '', email: '', password: '', phone: '', roles: [] });
      router.refresh();
    } catch (err) {
      toast({ title: 'Could not create user', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const openEdit = (u: UserRow) => {
    setEditing(u);
    setEditForm({ name: u.name, phone: u.phone ?? '', roles: [...u.roles], password: '', isActive: u.isActive });
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editForm.name.trim() || editForm.roles.length === 0) {
      toast({ title: 'Name and at least one role are required', variant: 'destructive' });
      return;
    }
    setBusy('edit');
    try {
      await apiFetch(`/api/users/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name.trim(),
          phone: orNull(editForm.phone),
          roles: editForm.roles,
          isActive: editForm.isActive,
          ...(editForm.password ? { password: editForm.password } : {}),
        }),
      });
      toast({ title: 'User updated', description: `${editForm.name}'s account was saved.` });
      setEditing(null);
      router.refresh();
    } catch (err) {
      toast({ title: 'Update failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const toggleActive = async (u: UserRow) => {
    if (u.id === currentUserId) {
      toast({ title: 'You cannot deactivate your own account', variant: 'destructive' });
      return;
    }
    setBusy(u.id);
    try {
      await apiFetch(`/api/users/${u.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !u.isActive }) });
      toast({ title: u.isActive ? 'User deactivated' : 'User activated' });
      router.refresh();
    } catch (err) {
      toast({ title: 'Update failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{users.length} staff & portal accounts. Role changes are audited.</p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" aria-hidden /> Create User
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Last login</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className={u.isActive ? '' : 'opacity-60'}>
                      <TableCell className="font-medium">{u.name}{u.id === currentUserId && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}</TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{u.phone ?? '—'}</TableCell>
                      <TableCell>
                        <div className="flex max-w-[240px] flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <Badge key={r} variant="secondary" className="text-[10px]">{ROLE_LABELS[r] ?? r}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{fmtDateTime(u.lastLoginAt)}</TableCell>
                      <TableCell className="text-sm">{u.failedLoginCount > 0 ? <span className="text-destructive">{u.failedLoginCount}</span> : '0'}</TableCell>
                      <TableCell>
                        <Switch
                          checked={u.isActive}
                          disabled={busy === u.id || u.id === currentUserId}
                          onCheckedChange={() => toggleActive(u)}
                          aria-label={`Toggle active for ${u.name}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(u)} aria-label={`Edit ${u.name}`}>
                          <Pencil className="h-4 w-4" aria-hidden />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
            <DialogDescription>Password is stored hashed (bcrypt, 12 rounds).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="us-name">Full name *</Label>
              <Input id="us-name" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="us-email">Email *</Label>
              <Input id="us-email" type="email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="us-pass">Password * (min 8)</Label>
              <Input id="us-pass" type="password" value={createForm.password} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="us-phone">Phone</Label>
              <Input id="us-phone" value={createForm.phone} onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Roles *</Label>
              <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                {ALL_ROLES.map((r) => (
                  <label key={r} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={createForm.roles.includes(r)}
                      onCheckedChange={() => setCreateForm((p) => ({ ...p, roles: toggleRole(p.roles, r) }))}
                      aria-label={ROLE_LABELS[r]}
                    />
                    {ROLE_LABELS[r]}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={busy !== null}>Cancel</Button>
            <Button onClick={createUser} disabled={busy !== null}>
              {busy === 'create' && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Create user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* edit dialog */}
      <Dialog open={editing !== null} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit user — {editing?.name}</DialogTitle>
            <DialogDescription>
              Leave the password blank to keep it unchanged. The last active Super Admin cannot be demoted.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ue-name">Full name</Label>
              <Input id="ue-name" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ue-phone">Phone</Label>
              <Input id="ue-phone" value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ue-pass">Reset password (optional)</Label>
              <Input id="ue-pass" type="password" placeholder="Min 8 characters" value={editForm.password} onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 self-end text-sm">
              <Switch
                checked={editForm.isActive}
                disabled={editing?.id === currentUserId}
                onCheckedChange={(v) => setEditForm((p) => ({ ...p, isActive: v }))}
                aria-label="Account active"
              />
              Account active
            </label>
            <div className="space-y-2 sm:col-span-2">
              <Label>Roles</Label>
              <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                {ALL_ROLES.map((r) => (
                  <label key={r} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={editForm.roles.includes(r)}
                      onCheckedChange={() => setEditForm((p) => ({ ...p, roles: toggleRole(p.roles, r) }))}
                      aria-label={ROLE_LABELS[r]}
                    />
                    {ROLE_LABELS[r]}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={busy !== null}>Cancel</Button>
            <Button onClick={saveEdit} disabled={busy !== null}>
              {busy === 'edit' && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
