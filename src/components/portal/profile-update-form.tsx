'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { apiFetch } from '@/components/dashboard/api';

export function ProfileUpdateRequestForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [field, setField] = useState('mobile');
  const [currentValue, setCurrentValue] = useState('');
  const [requestedValue, setRequestedValue] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch<{ message: string }>('/api/portal/update-requests', {
        method: 'POST',
        body: JSON.stringify({ field, currentValue: currentValue || null, requestedValue, reason: reason || null }),
      });
      toast({ title: res.data?.message ?? 'Request submitted' });
      setRequestedValue(''); setCurrentValue(''); setReason('');
      router.refresh();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Request failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>What do you want to update?</Label>
          <Select value={field} onValueChange={setField}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mobile">Mobile number</SelectItem>
              <SelectItem value="email">Email address</SelectItem>
              <SelectItem value="address">Residential address</SelectItem>
              <SelectItem value="other">Other (specify in reason)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Current value (as on record)</Label>
          <Input value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} placeholder="Optional" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Requested new value</Label>
        <Input value={requestedValue} onChange={(e) => setRequestedValue(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Reason / remarks</Label>
        <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
        Submit update request
      </Button>
    </form>
  );
}
