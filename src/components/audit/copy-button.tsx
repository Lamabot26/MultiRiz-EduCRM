'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

/** Tiny copy-to-clipboard button for entity ids in the audit table. */
export function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-6 w-6 p-0"
      onClick={copy}
      aria-label={label ?? `Copy ${value}`}
    >
      {copied
        ? <Check className="h-3.5 w-3.5 text-success" aria-hidden />
        : <Copy className="h-3.5 w-3.5" aria-hidden />}
    </Button>
  );
}
