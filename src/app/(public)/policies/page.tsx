import Link from 'next/link';
import { db } from '@/lib/db';
import { getSchoolSettings } from '@/lib/settings';
import { fmtDate } from '@/lib/date-utils';
import { FileText, Info, Lock, Receipt, ScrollText, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isPlaceholderContent } from '@/components/public/nav-items';

export const metadata = {
  title: 'Policies',
  description:
    'School policies — privacy, refunds, terms of use, child safety and fees — published by SP International School, Bhubaneswar.',
};

export const dynamic = 'force-dynamic';

const POLICIES = [
  { slug: 'privacy-policy', title: 'Privacy Policy', icon: Lock, blurb: 'How the school collects, uses and protects personal information.' },
  { slug: 'refund-policy', title: 'Refund Policy', icon: Receipt, blurb: 'Rules for fee refunds, withdrawals and adjustments.' },
  { slug: 'terms-of-use', title: 'Terms of Use', icon: ScrollText, blurb: 'Conditions governing use of this website and the school portal.' },
  { slug: 'child-safety-policy', title: 'Child Safety Policy', icon: ShieldCheck, blurb: 'Our commitments and protocols for keeping every child safe.' },
  { slug: 'fee-policy', title: 'Fee Policy', icon: FileText, blurb: 'Fee structure principles, due dates, late fees and concessions.' },
] as const;

type Search = { page?: string };

async function fetchPolicyPages() {
  return db.websitePage.findMany({
    where: { slug: { in: POLICIES.map((p) => p.slug) }, isPublished: true },
    select: { slug: true, title: true, content: true, updatedAt: true },
  });
}

function RichContent({ content }: { content: string }) {
  const looksLikeHtml = /<\/?(p|div|ul|ol|h[1-6]|br|strong|em|li|a|span|table)\b/i.test(content);
  if (looksLikeHtml) {
    return <div className="sp-prose" dangerouslySetInnerHTML={{ __html: content }} />;
  }
  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

export default async function PoliciesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { page = 'privacy-policy' } = await searchParams;
  const settings = await getSchoolSettings();

  const current = POLICIES.find((p) => p.slug === page) ?? POLICIES[0];

  let pages: Awaited<ReturnType<typeof fetchPolicyPages>> = [];
  try {
    pages = await fetchPolicyPages();
  } catch {
    pages = [];
  }
  const byslug = new Map(pages.map((p) => [p.slug, p]));
  const active = byslug.get(current.slug);
  const contentIsReal = active ? !isPlaceholderContent(active.content) : false;

  const fallbackNote =
    current.slug === 'refund-policy'
      ? settings.refundPolicyNote
      : current.slug === 'fee-policy'
        ? settings.feePolicyNote
        : null;

  return (
    <>
      {/* Page hero */}
      <section className="sp-hero-gradient text-primary-foreground" aria-labelledby="policies-hero">
        <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-foreground/90">Policy Hub</p>
          <h1 id="policies-hero" className="mt-2 max-w-3xl text-4xl font-extrabold sm:text-5xl">
            Our policies, in plain language
          </h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/85">
            Everything families should know about how {settings.schoolName} handles
            privacy, fees, refunds, safety and the use of our digital platforms.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16" aria-labelledby="policy-content-heading">
        <h2 id="policy-content-heading" className="sr-only">
          Policy documents
        </h2>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          {/* Left nav */}
          <nav aria-label="Policy list" className="lg:sticky lg:top-32 lg:self-start">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">Policy Documents</p>
            <ul className="space-y-1.5">
              {POLICIES.map((p) => {
                const published = byslug.has(p.slug);
                return (
                  <li key={p.slug}>
                    <Link
                      href={`/policies?page=${p.slug}`}
                      aria-current={current.slug === p.slug ? 'page' : undefined}
                      className={`flex min-h-11 items-center justify-between gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
                        current.slug === p.slug
                          ? 'bg-primary text-primary-foreground'
                          : 'border bg-card text-muted-foreground hover:border-accent/50 hover:text-primary'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <p.icon className={`h-4 w-4 ${current.slug === p.slug ? 'text-accent-foreground' : 'text-accent'}`} aria-hidden="true" />
                        {p.title}
                      </span>
                      <span
                        className={`h-2 w-2 rounded-full ${published ? 'bg-success' : 'bg-muted-foreground/30'}`}
                        title={published ? 'Published' : 'Awaiting publication'}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Policies are reviewed and published by the school office from the Admin
              Dashboard.
            </p>
          </nav>

          {/* Content */}
          <Card className="sp-card-shadow">
            <CardHeader className="border-b">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl sp-gold-gradient" aria-hidden="true">
                    <current.icon className="h-5.5 w-5.5 text-primary" />
                  </span>
                  <div>
                    <CardTitle className="text-xl text-primary">{active?.title ?? current.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{current.blurb}</p>
                  </div>
                </div>
                <Badge variant={contentIsReal ? 'secondary' : 'outline'} className="text-[11px] font-semibold">
                  {contentIsReal
                    ? `Last updated ${fmtDate(active?.updatedAt)}`
                    : 'Awaiting publication'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 lg:p-8">
              {contentIsReal && active ? (
                <RichContent content={active.content} />
              ) : (
                <div className="space-y-5">
                  {fallbackNote && (
                    <div className="rounded-2xl border border-accent/40 bg-accent/5 p-5">
                      <p className="flex items-center gap-2 text-sm font-bold text-primary">
                        <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
                        Summary from the school office
                      </p>
                      <p className="mt-2 text-[15px] leading-relaxed text-foreground">{fallbackNote}</p>
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-primary">
                    This policy document is being prepared for publication
                  </h3>
                  <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                    <p>
                      {settings.schoolName} is finalising the formal text of its{' '}
                      <span className="font-semibold text-foreground">{current.title}</span>{' '}
                      for publication on this page. The document is being drafted with the
                      same care we apply to everything else — reviewed by the school
                      leadership and aligned with applicable regulations and board
                      requirements.
                    </p>
                    <p>
                      Until the final document is published here, please treat this page as
                      the authoritative pointer: the school office can share the current
                      working policy on request, and any commitments already communicated to
                      parents (in writing, at admission or in circulars) remain fully valid.
                    </p>
                    <ul className="list-disc space-y-1.5 pl-5">
                      <li>Request a copy: write to {settings.emailPrimary} with the policy name in the subject line.</li>
                      <li>Ask in person: visit the front desk during {settings.workingHours}.</li>
                      <li>Stay notified: publication announcements appear on the notices board.</li>
                    </ul>
                    <p>
                      We update this hub as each document is approved — the status dots on
                      the left show which policies are already live.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
