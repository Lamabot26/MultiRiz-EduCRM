'use client';

import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

export function ReportActions({ type, filters }: { type: string; filters: string }) {
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" asChild>
        <a href={`/api/reports/${type}${filters}`}><Download className="h-3.5 w-3.5 mr-1.5" /> CSV</a>
      </Button>
      <Button size="sm" variant="ghost" onClick={() => window.print()}>
        <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
      </Button>
    </div>
  );
}
