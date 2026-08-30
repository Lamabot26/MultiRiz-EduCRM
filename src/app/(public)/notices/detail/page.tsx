import Link from 'next/link';
import { db } from '@/lib/db';
import { fmtDateTime } from '@/lib/date-utils';
import { getSchoolSettings } from '@/lib/settings';
import { ArrowLeft, CalendarDays, FileDown, Info, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { noticeCategoryBadgeClass, NOTICE_CATEGORY_LABELS } from '@/components/public/nav-items';

export const dynamic = 'force-dynamic';

type Search = { slug?: string };

async function getNotice(slug: string) {
  if (!slug) return null;
  try {
    return await db.notice.findFirst({
      where: { slug, isPublished: true, audience: { in: ['PUBLIC', 'ALL'] } },
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        category: true,
        publishedAt: true,
        createdAt: true,
        attachmentUrl: true,
        attachmentName: true,
      },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<Search> }) {
  const { slug = '' } = await searchParams;
  const notice = await getNotice(slug);
  if (!notice) return { title: 'Notice Not Found' };
  return {
    title: notice.title,
    description: notice.content.replace(/\s+/g, ' ').trim().slice(0, 150),
  };
}

export default async function NoticeDetailPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { slug = '' } = await searchParams;
  const [settings, notice] = await Promise.all([getSchoolSettings(), getNotice(slug)]);

  if (!notice) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 lg:px-8 lg:py-28" aria-labelledby="missing-heading">
        <Card className="sp-card-shadow">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary" aria-hidden="true">
              <Info className="h-8 w-8 text-primary" />
            </span>
            <h1 id="missing-heading" className="mt-5 text-2xl font-bold text-primary">
              Notice not found
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              This notice may have been unpublished, expired or moved. All current
              circulars from the school office are always available on the notices board.
            </p>
            <Button asChild className="mt-6 h-11 sp-gold-gradient font-semibold text-primary hover:opacity-90">
              <Link href="/notices">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Back to Notices
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const paragraphs = notice.content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 lg:px-8 lg:py-16">
      {/* Breadcrumb / back */}
      <nav aria-label="Breadcrumb">
        <Link
          href="/notices"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to notices
        </Link>
      </nav>

      <Card className="mt-5 sp-card-shadow">
        <CardContent className="p-6 lg:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={`${noticeCategoryBadgeClass(notice.category)} text-[11px] font-semibold`}>
              {NOTICE_CATEGORY_LABELS[notice.category] ?? notice.category}
            </Badge>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              Published {fmtDateTime(notice.publishedAt ?? notice.createdAt)}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-extrabold leading-tight text-primary sm:text-3xl">
            {notice.title}
          </h1>

          <Separator className="my-6" />

          <div className="space-y-4 text-[15px] leading-relaxed text-foreground">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {notice.attachmentUrl && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-muted/40 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-card sp-card-shadow" aria-hidden="true">
                  <FileDown className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{notice.attachmentName ?? 'Attachment'}</p>
                  <p className="text-xs text-muted-foreground">Official attachment to this notice</p>
                </div>
              </div>
              <Button asChild variant="outline" className="h-11">
                <a href={notice.attachmentUrl} download target="_blank" rel="noopener noreferrer">
                  Download
                </a>
              </Button>
            </div>
          )}

          <Separator className="my-8" />

          <div className="rounded-2xl bg-secondary/60 p-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Queries regarding this notice may be directed to the school office at{' '}
              <a href={`mailto:${settings.emailPrimary}`} className="inline-flex items-center gap-1 font-medium text-primary underline focus-visible:outline-2 focus-visible:outline-ring">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                {settings.emailPrimary}
              </a>{' '}
              or by phone during {settings.workingHours}.
            </p>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
