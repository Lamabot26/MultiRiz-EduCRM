'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarClock } from 'lucide-react';
import { apiFetch } from '@/components/dashboard/api';

export function LateFeeButton() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await apiFetch<{ invoicesUpdated: number }>('/api/fees/late-fees/evaluate', { method: 'POST' });
      toast({ title: `Late fees evaluated — ${res.data?.invoicesUpdated ?? 0} invoice(s) updated` });
      router.refresh();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Evaluation failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={run} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarClock className="h-4 w-4 mr-2" />}
      Evaluate late fees
    </Button>
  );
}
