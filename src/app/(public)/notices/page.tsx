import Link from 'next/link';
import { db } from '@/lib/db';
import { fmtDate } from '@/lib/date-utils';
import { NOTICE_CATEGORIES } from '@/lib/constants';
import { getSchoolSettings } from '@/lib/settings';
import {
  ArrowRight,
  CalendarDays,
  FileDown,
  Info,
  MapPin,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  noticeCategoryBadgeClass,
  NOTICE_CATEGORY_LABELS,
} from '@/components/public/nav-items';

export const metadata = {
  title: 'Notices & Events',
  description:
    'Official notices, circulars and upcoming events from SP International School, Bhubaneswar — searchable and filterable by category.',
};

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;

type Search = { q?: string; cat?: string };

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { q = '', cat = '' } = await searchParams;
  const settings = await getSchoolSettings();
  const query = q.trim();
  const category = cat.trim().toUpperCase();
  const validCategory = (NOTICE_CATEGORIES as readonly string[]).includes(category) ? category : '';

  let notices: Awaited<ReturnType<typeof fetchNotices>> = [];
  let events: Awaited<ReturnType<typeof fetchEvents>> = [];
  try {
    [notices, events] = await Promise.all([
      fetchNotices({ q: query, category: validCategory }),
      fetchEvents(),
    ]);
  } catch {
    // Empty states render below if the database is unavailable.
  }

  const buildFilterHref = (nextCat: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (nextCat) params.set('cat', nextCat);
    const qs = params.toString();
    return qs ? `/notices?${qs}` : '/notices';
  };

  return (
    <>
      {/* Page hero */}
      <section className="sp-hero-gradient text-primary-foreground" aria-labelledby="notices-hero">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-foreground/90">Notice Board</p>
          <h1 id="notices-hero" className="mt-2 max-w-3xl text-4xl font-extrabold sm:text-5xl">
            Notices, circulars & events
          </h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/85">
            Every official announcement from {settings.schoolName} is published here for
            parents and students — searchable by keyword and filterable by category.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16" aria-labelledby="notices-list">
        <h2 id="notices-list" className="sr-only">
          Notice list
        </h2>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          {/* Notices column */}
          <div>
            {/* Search + filters */}
            <form action="/notices" method="get" className="flex gap-2" role="search">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Search notices by title or content…"
                  aria-label="Search notices"
                  className="h-12 pl-10"
                />
              </div>
              {validCategory && <input type="hidden" name="cat" value={validCategory} />}
              <Button type="submit" className="h-12 px-5 font-semibold">
                Search
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Filter by category">
              <Link
                href={buildFilterHref('')}
                aria-current={!validCategory ? 'true' : undefined}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
                  !validCategory ? 'bg-primary text-primary-foreground' : 'border bg-card text-muted-foreground hover:text-primary'
                }`}
              >
                All
              </Link>
              {NOTICE_CATEGORIES.map((c) => (
                <Link
                  key={c}
                  href={buildFilterHref(c)}
                  aria-current={validCategory === c ? 'true' : undefined}
                  className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
                    validCategory === c ? 'bg-primary text-primary-foreground' : 'border bg-card text-muted-foreground hover:text-primary'
                  }`}
                >
                  {NOTICE_CATEGORY_LABELS[c] ?? c}
                </Link>
              ))}
            </div>

            {/* Results */}
            {notices.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                <Info className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
                <p className="mt-4 font-semibold text-foreground">
                  {query || validCategory ? 'No notices match your filters' : 'No notices published yet'}
                </p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  {query || validCategory
                    ? 'Try a different keyword or clear the category filter. Official circulars from the school office will appear here as soon as they are published.'
                    : 'Official circulars and announcements from the school office will appear here once published from the Admin Dashboard.'}
                </p>
                {(query || validCategory) && (
                  <Button asChild variant="outline" className="mt-5 h-11">
                    <Link href="/notices">Clear filters</Link>
                  </Button>
                )}
              </div>
            ) : (
              <ul className="mt-8 space-y-4">
                {notices.map((n) => (
                  <li key={n.id}>
                    <Card className="sp-card-shadow transition-all hover:-translate-y-0.5 hover:shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`${noticeCategoryBadgeClass(n.category)} text-[11px] font-semibold`}>
                            {NOTICE_CATEGORY_LABELS[n.category] ?? n.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">Published {fmtDate(n.publishedAt ?? n.createdAt)}</span>
                        </div>
                        <h3 className="mt-3 text-lg font-bold text-primary">
                          <Link
                            href={`/notices/detail?slug=${n.slug}`}
                            className="hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                          >
                            {n.title}
                          </Link>
                        </h3>
                        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {n.content.replace(/\s+/g, ' ').trim().slice(0, 200)}
                          {n.content.length > 200 ? '…' : ''}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-4">
                          <Link
                            href={`/notices/detail?slug=${n.slug}`}
                            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                          >
                            Read full notice
                            <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                          </Link>
                          {n.attachmentUrl && (
                            <a
                              href={n.attachmentUrl}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                            >
                              <FileDown className="h-4 w-4" aria-hidden="true" />
                              {n.attachmentName ?? 'Download attachment'}
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}

            {notices.length >= PAGE_SIZE && (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Showing the latest {PAGE_SIZE} notices — use search or category filters to
                narrow the list.
              </p>
            )}
          </div>

          {/* Events column */}
          <aside aria-labelledby="events-side-heading" className="lg:sticky lg:top-32 lg:self-start">
            <Card className="sp-card-shadow">
              <CardHeader className="flex-row items-center gap-2 pb-4">
                <CalendarDays className="h-5 w-5 text-accent" aria-hidden="true" />
                <CardTitle id="events-side-heading" className="text-lg text-primary">
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {events.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                    No upcoming events published yet. School events appear here as the
                    academic office schedules them.
                  </p>
                ) : (
                  <ol className="space-y-4">
                    {events.map((e) => {
                      const d = e.startsAt;
                      return (
                        <li key={e.id} className="flex gap-3">
                          <div className="flex h-13 w-13 shrink-0 flex-col items-center justify-center rounded-xl bg-primary p-1 text-primary-foreground">
                            <span className="text-lg font-extrabold leading-none">{String(d.getDate()).padStart(2, '0')}</span>
                            <span className="text-[10px] uppercase tracking-wide text-primary-foreground/80">
                              {d.toLocaleString('en-IN', { month: 'short' })}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold leading-snug text-foreground">{e.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{fmtDate(d)}</p>
                            {e.location && (
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" aria-hidden="true" />
                                {e.location}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>

            <div className="mt-6 rounded-2xl border bg-accent/5 p-6">
              <h3 className="font-semibold text-primary">Looking for something specific?</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Fee circulars, exam schedules and admission updates are all categorised —
                or reach the school office during {settings.workingHours}.
              </p>
              <Button asChild variant="outline" className="mt-4 h-11">
                <Link href="/contact">Contact the office</Link>
              </Button>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

async function fetchNotices({ q, category }: { q: string; category: string }) {
  return db.notice.findMany({
    where: {
      isPublished: true,
      audience: { in: ['PUBLIC', 'ALL'] },
      ...(q
        ? {
            OR: [{ title: { contains: q } }, { content: { contains: q } }],
          }
        : {}),
      ...(category ? { category } : {}),
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: PAGE_SIZE,
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
}

async function fetchEvents() {
  return db.event.findMany({
    where: { isPublished: true, isPublic: true, startsAt: { gte: new Date() } },
    orderBy: { startsAt: 'asc' },
    take: 8,
    select: { id: true, title: true, startsAt: true, location: true },
  });
}
