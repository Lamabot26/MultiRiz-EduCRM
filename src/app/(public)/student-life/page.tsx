import Link from 'next/link';
import { db } from '@/lib/db';
import { fmtDate } from '@/lib/date-utils';
import {
  Award,
  Code2,
  Flag,
  Languages,
  Leaf,
  Lightbulb,
  MapPin,
  Medal,
  Music,
  Palette,
  Trophy,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSchoolSettings } from '@/lib/settings';

export const metadata = {
  title: 'Student Life',
  description:
    'Beyond the classroom at SP International School, Bhubaneswar — events, house system, clubs, competitions, achievements and the student council.',
};

export const dynamic = 'force-dynamic';

const CLUBS = [
  { icon: Music, name: 'Music & Dance Club', copy: 'Classical and western training, choir practice and annual-stage performances.' },
  { icon: Palette, name: 'Art & Craft Club', copy: 'Sketching, painting and craft projects that fill our corridors with colour.' },
  { icon: Code2, name: 'Coding & Robotics Club', copy: 'Scratch to Python, building blocks to bots — computational thinking made playful.' },
  { icon: Languages, name: 'Literary Club', copy: 'Debates, elocution, creative writing and the annual magazine editorial team.' },
  { icon: Leaf, name: 'Eco Club', copy: 'Campus greening, waste segregation drives and environmental awareness campaigns.' },
  { icon: Lightbulb, name: 'Science Club', copy: 'Experiments beyond the syllabus, exhibition projects and science-fair mentoring.' },
];

const COMPETITIONS = [
  {
    title: 'Olympiads & Scholarship Exams',
    copy: 'Students are coached and registered for national Olympiads (Maths, Science, English) and scholarship examinations each year.',
  },
  {
    title: 'Inter-school Meets',
    copy: 'Our teams represent the school at city and state level in quizzes, debates, sports and cultural festivals.',
  },
  {
    title: 'Intra-school Championships',
    copy: 'Inter-house competitions in everything from spell-bee and chess to painting and rangoli keep every child participating.',
  },
  {
    title: 'Exhibitions & Fairs',
    copy: 'The annual science exhibition and art fair turn the school into a gallery of student work, open to parents and guests.',
  },
];

const HOUSES = [
  { name: 'Ruby House', dot: 'bg-destructive', motto: 'Courage in everything' },
  { name: 'Emerald House', dot: 'bg-success', motto: 'Grow together, rise together' },
  { name: 'Topaz House', dot: 'bg-warning', motto: 'Shine with hard work' },
  { name: 'Coral House', dot: 'bg-accent', motto: 'Warm hearts, bright minds' },
];

export default async function StudentLifePage() {
  const settings = await getSchoolSettings();

  let events: Awaited<ReturnType<typeof fetchEvents>> = [];
  try {
    events = await fetchEvents();
  } catch {
    // Section falls back to its empty state below.
  }

  return (
    <>
      {/* Page hero */}
      <section className="sp-hero-gradient text-primary-foreground" aria-labelledby="life-hero">
        <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-foreground/90">Student Life</p>
          <h1 id="life-hero" className="mt-2 max-w-3xl text-4xl font-extrabold sm:text-5xl">
            School is where life happens too
          </h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/85">
            Houses, clubs, councils, competitions and celebrations — at{' '}
            {settings.schoolName}, the timetable beyond academics is designed just as
            carefully as the one inside the classroom.
          </p>
        </div>
      </section>

      {/* Upcoming events */}
      <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20" aria-labelledby="events-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">What’s Next</p>
            <h2 id="events-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
              Upcoming events
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Events published by the school’s academic office appear here automatically —
              parents also receive them through the notices board and portal.
            </p>
          </div>
          <Button asChild variant="outline" className="h-11 shrink-0">
            <Link href="/notices">Notices board</Link>
          </Button>
        </div>

        {events.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Flag className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
            <p className="mt-4 font-semibold text-foreground">No events published yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              The school calendar is being planned for session {settings.sessionLabel}.
              As the admin team publishes events, they will appear right here with dates
              and venues. [Event content — managed from Admin Dashboard]
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <Card key={e.id} className="sp-card-shadow transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <span className="text-xl font-extrabold leading-none">{String(e.startsAt.getDate()).padStart(2, '0')}</span>
                      <span className="text-[10px] uppercase tracking-wide text-primary-foreground/80">
                        {e.startsAt.toLocaleString('en-IN', { month: 'short' })}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-base leading-snug text-primary">{e.title}</CardTitle>
                      <p className="mt-0.5 text-xs text-muted-foreground">{fmtDate(e.startsAt)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{e.description}</p>
                  {e.location && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                      {e.location}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* House system */}
      <section className="bg-secondary/50 py-14 lg:py-20" aria-labelledby="houses-heading">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">House System</p>
            <h2 id="houses-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
              Four houses, one school spirit
            </h2>
            <p className="mt-3 text-muted-foreground">
              Every student joins a house at admission and stays in it through school —
              earning points in sports, academics and service, and learning that teams
              achieve what individuals only dream. [House names & structure are
              configurable from the Admin Dashboard.]
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOUSES.map((h) => (
              <Card key={h.name} className="sp-card-shadow text-center transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-6">
                  <span className={`mx-auto block h-4 w-4 rounded-full ${h.dot}`} aria-hidden="true" />
                  <h3 className="mt-3 font-bold text-primary">{h.name}</h3>
                  <p className="mt-1 text-sm italic text-muted-foreground">“{h.motto}”</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Clubs */}
      <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20" aria-labelledby="clubs-heading">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Clubs</p>
          <h2 id="clubs-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
            Every interest gets a room and a mentor
          </h2>
          <p className="mt-3 text-muted-foreground">
            Club periods sit inside the school timetable, so every child — not just the
            ones with after-school freedom — gets to pursue a passion seriously.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CLUBS.map((c) => (
            <Card key={c.name} className="sp-card-shadow transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="flex gap-4 p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary" aria-hidden="true">
                  <c.icon className="h-6 w-6 text-primary" />
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">{c.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.copy}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Competitions */}
      <section className="bg-secondary/50 py-14 lg:py-20" aria-labelledby="competitions-heading">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Competitions</p>
            <h2 id="competitions-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
              Healthy rivalry, lifelong confidence
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {COMPETITIONS.map((c, i) => (
              <Card key={c.title} className="sp-card-shadow">
                <CardContent className="p-6">
                  <span className="text-sm font-extrabold text-accent">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-2 font-semibold text-foreground">{c.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.copy}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements + council */}
      <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:pb-20" aria-labelledby="achievements-heading">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              <Trophy className="mr-1 inline h-4 w-4" aria-hidden="true" />
              Achievements
            </p>
            <h2 id="achievements-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
              A wall of fame in the making
            </h2>
            <div className="mt-6 space-y-4">
              {['Board & Olympiad results', 'Sports championships', 'Cultural & literary wins'].map((label) => (
                <div key={label} className="flex gap-4 rounded-2xl border bg-card p-5 sp-card-shadow">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sp-gold-gradient" aria-hidden="true">
                    <Medal className="h-5.5 w-5.5 text-primary" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      [Achievement highlight — placeholder. Verified student achievements
                      will be curated and published here by the school office.]
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              <Users className="mr-1 inline h-4 w-4" aria-hidden="true" />
              Student Council
            </p>
            <h2 className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
              Leadership, practised early
            </h2>
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
              <p>
                The student council — head boy, head girl, house captains and portfolio
                ministers — is elected each session through a proper campaign and secret
                ballot. Council members run assemblies, lead house events, manage lost
                property desks and bring student concerns to the school leadership.
              </p>
              <p>
                Beyond the council, classroom monitor duties, library prefect roles and
                event volunteering give every willing student a taste of responsibility.
                [Council positions and elected names are published here by the school each
                session.]
              </p>
            </div>
            <div className="mt-6 flex gap-4 rounded-2xl border bg-card p-5 sp-card-shadow">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sp-gold-gradient" aria-hidden="true">
                <Award className="h-5.5 w-5.5 text-primary" />
              </span>
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-primary">Council elections {settings.sessionLabel}:</span>{' '}
                nominations typically open at the start of the session — watch the{' '}
                <Link href="/notices" className="font-medium text-primary underline">
                  notices board
                </Link>{' '}
                for the schedule.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

async function fetchEvents() {
  return db.event.findMany({
    where: { isPublished: true, isPublic: true, startsAt: { gte: new Date() } },
    orderBy: { startsAt: 'asc' },
    take: 6,
    select: { id: true, title: true, description: true, startsAt: true, location: true },
  });
}
