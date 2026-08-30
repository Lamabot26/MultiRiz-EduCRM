'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type FormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  consent: boolean;
};

const INITIAL: FormState = { name: '', email: '', phone: '', subject: '', message: '', consent: false };

export function ContactForm() {
  const { toast } = useToast();
  const [form, setForm] = React.useState<FormState>(INITIAL);
  const [website, setWebsite] = React.useState(''); // honeypot
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 2) next.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address so we can reply.';
    if (form.subject.trim().length < 2) next.subject = 'Please add a short subject.';
    if (form.message.trim().length < 5) next.message = 'Please write your message (at least a few words).';
    if (!form.consent) next.consent = 'Please accept the privacy consent to continue.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) {
      toast({
        title: 'Please review the form',
        description: 'Some required fields need your attention.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          subject: form.subject.trim(),
          message: form.message.trim(),
          consent: true,
          website,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast({
          title: 'Message not sent',
          description: json?.error ?? 'Something went wrong. Please try again in a moment.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      setSuccessMsg((json.data?.message as string) ?? 'Thank you for reaching out.');
      setForm(INITIAL);
      setWebsite('');
      toast({ title: 'Message sent', description: 'Our office will respond within 1–2 working days.' });
    } catch {
      toast({
        title: 'Network error',
        description: 'We could not reach the server. Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5" aria-label="Contact form">
      {successMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-success/40 bg-success/10 p-4" role="status" aria-live="polite">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground">Message received!</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{successMsg}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Your name *</Label>
          <Input
            id="contact-name"
            className="h-11"
            autoComplete="name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            aria-invalid={Boolean(errors.name)}
            required
            maxLength={120}
          />
          {errors.name && <FieldError message={errors.name} />}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email *</Label>
          <Input
            id="contact-email"
            type="email"
            className="h-11"
            autoComplete="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            aria-invalid={Boolean(errors.email)}
            required
            maxLength={160}
          />
          {errors.email && <FieldError message={errors.email} />}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone">Phone (optional)</Label>
          <Input
            id="contact-phone"
            type="tel"
            className="h-11"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            maxLength={20}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-subject">Subject *</Label>
          <Input
            id="contact-subject"
            className="h-11"
            placeholder="e.g. Transport route query"
            value={form.subject}
            onChange={(e) => set('subject', e.target.value)}
            aria-invalid={Boolean(errors.subject)}
            required
            maxLength={160}
          />
          {errors.subject && <FieldError message={errors.subject} />}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="contact-message">Message *</Label>
          <Textarea
            id="contact-message"
            className="min-h-32"
            placeholder="How can the school office help you?"
            value={form.message}
            onChange={(e) => set('message', e.target.value)}
            aria-invalid={Boolean(errors.message)}
            required
            maxLength={2000}
          />
          {errors.message && <FieldError message={errors.message} />}
        </div>
      </div>

      <div className="rounded-xl border bg-muted/40 p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="contact-consent"
            checked={form.consent}
            onCheckedChange={(v) => set('consent', v === true)}
            aria-invalid={Boolean(errors.consent)}
            className="mt-0.5"
          />
          <div>
            <Label htmlFor="contact-consent" className="text-sm font-normal leading-relaxed">
              I consent to the school storing and using these details to respond to my
              message, as described in the{' '}
              <Link href="/policies?page=privacy-policy" className="font-semibold text-primary underline">
                Privacy Policy
              </Link>
              . *
            </Label>
            {errors.consent && <FieldError message={errors.consent} />}
          </div>
        </div>
      </div>

      {/* Honeypot — hidden from humans */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="h-12 gap-2 sp-gold-gradient px-8 text-base font-semibold text-primary shadow-lg hover:opacity-90"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          <>
            <Send className="h-4.5 w-4.5" aria-hidden="true" />
            Send Message
          </>
        )}
      </Button>
    </form>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium text-destructive" role="alert">
      <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
      {message}
    </p>
  );
}
