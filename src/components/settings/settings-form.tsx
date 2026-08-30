'use client';

// =====================================================================
// School settings form (settings.manage) → PUT /api/settings, plus the
// Data Management card: audited CSV exports and Kuberns backup/restore
// placeholders.
// =====================================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DatabaseBackup, Download, Loader2, Save, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/components/dashboard/api';
import type { SchoolSettings } from '@/lib/settings';

type Props = { initial: SchoolSettings };

export function SettingsForm({ initial }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<SchoolSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [exportType, setExportType] = useState<string | null>(null);

  const set = (k: keyof SchoolSettings, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch('/api/settings', { method: 'PUT', body: JSON.stringify(form) });
      toast({ title: 'Settings saved', description: 'Changes apply across the site immediately.' });
      router.refresh();
    } catch (err) {
      toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const exportUrl = (type: string) => `/api/reports/${type}`;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Profile form */}
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">School identity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="School name" id="st-name" value={form.schoolName} onChange={(v) => set('schoolName', v)} />
            <Field label="Tagline" id="st-tagline" value={form.tagline} onChange={(v) => set('tagline', v)} />
            <Field label="Board affiliation" id="st-board" value={form.boardAffiliation} onChange={(v) => set('boardAffiliation', v)} />
            <Field label="Established year" id="st-year" value={form.establishedYear} onChange={(v) => set('establishedYear', v)} />
            <Field label="Logo URL" id="st-logo" value={form.logoUrl} onChange={(v) => set('logoUrl', v)} />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="st-primary">Primary color</Label>
                <Input id="st-primary" type="color" value={form.primaryColor} onChange={(e) => set('primaryColor', e.target.value)} className="h-9 p-1" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="st-accent">Accent color</Label>
                <Input id="st-accent" type="color" value={form.accentColor} onChange={(e) => set('accentColor', e.target.value)} className="h-9 p-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contact & address</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Address line" id="st-addr" value={form.addressLine} onChange={(v) => set('addressLine', v)} />
            <div className="grid grid-cols-3 gap-3">
              <Field label="City" id="st-city" value={form.city} onChange={(v) => set('city', v)} />
              <Field label="State" id="st-state" value={form.state} onChange={(v) => set('state', v)} />
              <Field label="Pincode" id="st-pin" value={form.pincode} onChange={(v) => set('pincode', v)} />
            </div>
            <Field label="Phone (primary)" id="st-ph1" value={form.phonePrimary} onChange={(v) => set('phonePrimary', v)} />
            <Field label="Phone (admissions)" id="st-ph2" value={form.phoneAdmissions} onChange={(v) => set('phoneAdmissions', v)} />
            <Field label="Email (primary)" id="st-em1" type="email" value={form.emailPrimary} onChange={(v) => set('emailPrimary', v)} />
            <Field label="Email (admissions)" id="st-em2" type="email" value={form.emailAdmissions} onChange={(v) => set('emailAdmissions', v)} />
            <Field label="Working hours" id="st-hours" value={form.workingHours} onChange={(v) => set('workingHours', v)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Web, social & map</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Facebook URL" id="st-fb" value={form.facebookUrl} onChange={(v) => set('facebookUrl', v)} />
            <Field label="Instagram URL" id="st-ig" value={form.instagramUrl} onChange={(v) => set('instagramUrl', v)} />
            <Field label="YouTube URL" id="st-yt" value={form.youtubeUrl} onChange={(v) => set('youtubeUrl', v)} />
            <Field label="Twitter / X URL" id="st-tw" value={form.twitterUrl} onChange={(v) => set('twitterUrl', v)} />
            <Field label="LinkedIn URL" id="st-li" value={form.linkedinUrl} onChange={(v) => set('linkedinUrl', v)} />
            <Field label="Map embed URL" id="st-map" value={form.mapEmbedUrl} onChange={(v) => set('mapEmbedUrl', v)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Admissions, session & principal</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.admissionOpen} onCheckedChange={(v) => set('admissionOpen', v)} aria-label="Admissions open" />
              Admissions open
            </label>
            <Field label="Session label" id="st-session" value={form.sessionLabel} onChange={(v) => set('sessionLabel', v)} />
            <Field label="Principal name" id="st-pname" value={form.principalName} onChange={(v) => set('principalName', v)} />
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="st-pmsg">Principal message</Label>
              <Textarea id="st-pmsg" rows={3} value={form.principalMessage} onChange={(e) => set('principalMessage', e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="st-fee">Fee policy note</Label>
              <Textarea id="st-fee" rows={2} value={form.feePolicyNote} onChange={(e) => set('feePolicyNote', e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="st-refund">Refund policy note</Label>
              <Textarea id="st-refund" rows={2} value={form.refundPolicyNote} onChange={(e) => set('refundPolicyNote', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Save className="mr-2 h-4 w-4" aria-hidden />}
            Save settings
          </Button>
        </div>
      </div>

      {/* Data management */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Data management</CardTitle>
            <CardDescription>CSV exports are audited every time they run.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {['leads', 'students', 'invoices', 'payments'].map((t) => (
              <Button key={t} variant="outline" className="justify-start" onClick={() => setExportType(t)}>
                <Download className="mr-2 h-4 w-4" aria-hidden /> Export {t} (CSV)
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DatabaseBackup className="h-4 w-4" aria-hidden /> Backup
            </CardTitle>
            <CardDescription>Managed via Kuberns operations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled className="w-full justify-start">
              <DatabaseBackup className="mr-2 h-4 w-4" aria-hidden /> Download backup
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Nightly PostgreSQL snapshots are handled by the Kuberns platform; on-demand
              backups are performed by the ops team.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Undo2 className="h-4 w-4" aria-hidden /> Restore
            </CardTitle>
            <CardDescription>Managed via Kuberns operations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled className="w-full justify-start">
              <Undo2 className="mr-2 h-4 w-4" aria-hidden /> Restore from backup
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Restores require a support request — they replace the live database and are
              never performed from the dashboard.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export confirmation */}
      <Dialog open={exportType !== null} onOpenChange={(o) => { if (!o) setExportType(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export {exportType} as CSV?</DialogTitle>
            <DialogDescription>
              This action is audited: your user, IP address and the export scope are written
              to the audit trail.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportType(null)}>Cancel</Button>
            <Button asChild onClick={() => setExportType(null)}>
              <a href={exportType ? exportUrl(exportType) : '#'} download>
                <Download className="mr-2 h-4 w-4" aria-hidden /> Confirm export
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label, id, value, onChange, type = 'text',
}: {
  label: string; id: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
