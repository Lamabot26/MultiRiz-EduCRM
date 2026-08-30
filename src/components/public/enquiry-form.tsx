'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CLASS_OPTIONS } from '@/components/public/nav-items';

const INDIAN_MOBILE = /^(\+91[- ]?)?[6-9]\d{9}$/;

type FormState = {
  studentName: string;
  dateOfBirth: string;
  gender: string; // '' = not specified
  classApplyingFor: string;
  guardianName: string;
  mobile: string;
  email: string;
  city: string;
  previousSchool: string;
  message: string;
  consent: boolean;
};

const INITIAL: FormState = {
  studentName: '',
  dateOfBirth: '',
  gender: '',
  classApplyingFor: '',
  guardianName: '',
  mobile: '',
  email: '',
  city: '',
  previousSchool: '',
  message: '',
  consent: false,
};

export function EnquiryForm({ sessionLabel }: { sessionLabel: string }) {
  const { toast } = useToast();
  const [form, setForm] = React.useState<FormState>(INITIAL);
  const [website, setWebsite] = React.useState(''); // honeypot — must stay empty
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState<{ leadNumber: string; message: string } | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.studentName.trim().length < 2) next.studentName = 'Please enter the student’s full name.';
    if (!form.classApplyingFor) next.classApplyingFor = 'Please choose a class.';
    if (form.guardianName.trim().length < 2) next.guardianName = 'Please enter the guardian’s name.';
    if (!INDIAN_MOBILE.test(form.mobile.trim())) next.mobile = 'Enter a valid 10-digit Indian mobile number.';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
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
      const res = await fetch('/api/public/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: form.studentName.trim(),
          dateOfBirth: form.dateOfBirth || null,
          gender: form.gender || null,
          classApplyingFor: form.classApplyingFor,
          guardianName: form.guardianName.trim(),
          mobile: form.mobile.trim(),
          email: form.email.trim() || null,
          city: form.city.trim() || null,
          previousSchool: form.previousSchool.trim() || null,
          message: form.message.trim() || null,
          consent: true,
          website,
        }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        toast({
          title: 'Submission failed',
          description: json?.error ?? 'Something went wrong. Please try again in a moment.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const data = json.data as { leadNumber?: string; message?: string };
      setSuccess({
        leadNumber: data?.leadNumber ?? '—',
        message: data?.message ?? 'Your enquiry has been received.',
      });
      setForm(INITIAL);
      setWebsite('');
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

  if (success) {
    return (
      <Card id="enquiry" className="scroll-mt-28 border-success/40 sp-card-shadow" aria-live="polite">
        <CardContent className="flex flex-col items-center p-8 text-center lg:p-10">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15" aria-hidden="true">
            <CheckCircle2 className="h-9 w-9 text-success" />
          </span>
          <h3 className="mt-5 text-2xl font-bold text-primary">Enquiry received!</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{success.message}</p>
          <div className="mt-6 rounded-xl border border-dashed border-accent/50 bg-accent/5 px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Your reference number</p>
            <p className="mt-1 text-xl font-extrabold tracking-wide text-primary">{success.leadNumber}</p>
          </div>
          <p className="mt-4 max-w-md text-xs text-muted-foreground">
            Please save this reference number. Our admissions team will contact you within
            1–2 working days. Quote it in any call or email for a faster response.
          </p>
          <Button variant="outline" className="mt-6 h-11" onClick={() => setSuccess(null)}>
            Submit another enquiry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="enquiry" className="scroll-mt-28 sp-card-shadow">
      <CardHeader>
        <CardTitle className="text-xl text-primary">Admission Enquiry Form</CardTitle>
        <CardDescription>
          Admissions open for session {sessionLabel}. Fields marked * are required — the
          rest help our team serve you faster.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Student name */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="studentName">Student’s full name *</Label>
              <Input
                id="studentName"
                className="h-11"
                autoComplete="off"
                value={form.studentName}
                onChange={(e) => set('studentName', e.target.value)}
                aria-invalid={Boolean(errors.studentName)}
                required
                maxLength={120}
              />
              {errors.studentName && <FieldError message={errors.studentName} />}
            </div>

            {/* DOB + gender */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of birth (optional)</Label>
              <Input
                id="dateOfBirth"
                type="date"
                className="h-11"
                max={new Date().toISOString().slice(0, 10)}
                value={form.dateOfBirth}
                onChange={(e) => set('dateOfBirth', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender (optional)</Label>
              <Select value={form.gender || undefined} onValueChange={(v) => set('gender', v)}>
                <SelectTrigger id="gender" className="h-11 w-full">
                  <SelectValue placeholder="Select (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Class applying for */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="classApplyingFor">Class applying for *</Label>
              <Select value={form.classApplyingFor || undefined} onValueChange={(v) => set('classApplyingFor', v)}>
                <SelectTrigger
                  id="classApplyingFor"
                  className={`h-11 w-full ${errors.classApplyingFor ? 'border-destructive' : ''}`}
                  aria-invalid={Boolean(errors.classApplyingFor)}
                >
                  <SelectValue placeholder="Select class — Pre-Nursery to Class 12" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {CLASS_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.classApplyingFor && <FieldError message={errors.classApplyingFor} />}
            </div>

            {/* Guardian + mobile */}
            <div className="space-y-2">
              <Label htmlFor="guardianName">Parent / guardian name *</Label>
              <Input
                id="guardianName"
                className="h-11"
                autoComplete="name"
                value={form.guardianName}
                onChange={(e) => set('guardianName', e.target.value)}
                aria-invalid={Boolean(errors.guardianName)}
                required
                maxLength={120}
              />
              {errors.guardianName && <FieldError message={errors.guardianName} />}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile number *</Label>
              <Input
                id="mobile"
                type="tel"
                inputMode="tel"
                className="h-11"
                placeholder="10-digit mobile"
                autoComplete="tel"
                value={form.mobile}
                onChange={(e) => set('mobile', e.target.value)}
                aria-invalid={Boolean(errors.mobile)}
                required
                maxLength={14}
              />
              {errors.mobile && <FieldError message={errors.mobile} />}
            </div>

            {/* Email + city */}
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                className="h-11"
                autoComplete="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                aria-invalid={Boolean(errors.email)}
                maxLength={160}
              />
              {errors.email && <FieldError message={errors.email} />}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City (optional)</Label>
              <Input
                id="city"
                className="h-11"
                autoComplete="address-level2"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                maxLength={80}
              />
            </div>

            {/* Previous school */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="previousSchool">Previous school (optional)</Label>
              <Input
                id="previousSchool"
                className="h-11"
                value={form.previousSchool}
                onChange={(e) => set('previousSchool', e.target.value)}
                maxLength={160}
              />
            </div>

            {/* Message */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="message">Message / questions (optional)</Label>
              <Textarea
                id="message"
                className="min-h-24"
                placeholder="Anything you would like us to know before we call you?"
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
                maxLength={1000}
              />
            </div>
          </div>

          {/* Consent */}
          <div className="rounded-xl border bg-muted/40 p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={form.consent}
                onCheckedChange={(v) => set('consent', v === true)}
                aria-invalid={Boolean(errors.consent)}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="consent" className="text-sm font-normal leading-relaxed">
                  I agree that the school may contact me by phone, SMS, WhatsApp or email
                  regarding this admission enquiry, and I accept the{' '}
                  <Link href="/policies?page=privacy-policy" className="font-semibold text-primary underline">
                    Privacy Policy
                  </Link>
                  . *
                </Label>
                {errors.consent && <FieldError message={errors.consent} />}
              </div>
            </div>
          </div>

          {/* Honeypot — invisible to humans, catnip for bots */}
          <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
            <label htmlFor="website">Website</label>
            <input
              id="website"
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
            className="h-12 w-full gap-2 sp-gold-gradient text-base font-semibold text-primary shadow-lg hover:opacity-90 sm:w-auto sm:px-8"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="h-4.5 w-4.5" aria-hidden="true" />
                Submit Enquiry
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            We usually respond within 1–2 working days. Submissions are rate-limited and
            monitored to keep the form spam-free.
          </p>
        </form>
      </CardContent>
    </Card>
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
