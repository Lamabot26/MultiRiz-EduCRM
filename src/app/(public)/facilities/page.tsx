import Link from 'next/link';
import {
  BedDouble,
  Bus,
  Dumbbell,
  FlaskConical,
  Image as ImageIcon,
  Library,
  Monitor,
  Palette,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getSchoolSettings } from '@/lib/settings';

export const metadata = {
  title: 'Facilities',
  description:
    'Campus facilities at SP International School, Bhubaneswar — smart classrooms, science & computer labs, library, sports, transport, safety and clubs.',
};

export const dynamic = 'force-dynamic';

const FACILITIES = [
  {
    icon: Monitor,
    title: 'Smart Classrooms',
    copy:
      'Every classroom is a smart classroom. Interactive panels, curated digital lessons and audio-visual content turn abstract chapters into experiences — a volcano erupts, a heart beats, a triangle transforms. Teachers are trained to blend screens with books, so technology deepens attention rather than competing with it.',
    points: ['Interactive panels in all classrooms', 'Curated grade-wise digital content', 'Structured screen-time guidelines'],
  },
  {
    icon: FlaskConical,
    title: 'Science & Computer Labs',
    copy:
      'Dedicated physics, chemistry and biology labs give every student real bench time — measuring, mixing, observing and recording like young scientists. The computer lab supports coding, digital literacy and AI-basics modules with up-to-date machines and supervised internet.',
    points: ['Separate physics, chemistry & biology labs', 'Computer lab with supervised internet', 'Lab safety protocols & trained assistants'],
  },
  {
    icon: Library,
    title: 'Library & Reading Nook',
    copy:
      'Our library pairs reference shelves with a cosy junior reading nook full of picture books and early readers. A structured reading programme runs through the year — book weeks, read-aloud sessions and reading logs — because children who read for pleasure learn everything else faster.',
    points: ['Fiction, reference and periodicals collection', 'Weekly library periods for every class', 'Annual book week & author celebrations'],
  },
  {
    icon: Dumbbell,
    title: 'Sports Facilities',
    copy:
      'Open playfields for football and cricket, courts for badminton and basketball, and indoor space for table tennis, chess and yoga. Structured physical education periods ensure every child plays every week, with inter-house tournaments building healthy competitive spirit.',
    points: ['Playfields & outdoor courts', 'Indoor games and yoga space', 'Inter-house tournaments each term'],
  },
  {
    icon: Bus,
    title: 'Transport',
    copy:
      'GPS-tracked school buses with trained drivers and female attendants on every route serve major residential areas of the city. Routes and stops are reviewed each session; parents receive route details at admission and updates through the parent portal.',
    points: ['GPS-tracked buses on fixed routes', 'Trained drivers & attendants', 'Route details shared at admission'],
  },
  {
    icon: ShieldCheck,
    title: 'Safety & Security',
    copy:
      'Safety is infrastructure, not intention. The campus has CCTV coverage, controlled single-point entry, fire safety equipment, a medical room with first-aid trained staff and strict visitor verification. Staff are background-verified and trained in child-safety protocols.',
    points: ['CCTV-monitored campus & single entry point', 'Medical room with first-aid trained staff', 'Verified staff & visitor protocols'],
  },
  {
    icon: BedDouble,
    title: 'Hostel (if applicable)',
    copy:
      'Boarding facilities, where offered for a session, are confirmed by the school office as availability changes year to year. When operational, the hostel provides supervised study hours, resident wardens, hygienic dining and structured weekend routines. Please check with the admissions office for the current session’s status before applying.',
    points: ['Availability confirmed per session by the office', 'Supervised study & resident wardens (when offered)', 'Hygienic dining & structured routines (when offered)'],
  },
  {
    icon: Palette,
    title: 'Clubs & Activity Studios',
    copy:
      'Dedicating space to the arts tells children their talents matter: a music room, an art studio and activity spaces host weekly club meetings — from western and classical music to sketching, robotics and debate. Performances through the year give every child a stage.',
    points: ['Music room & art studio', 'Weekly club periods in the timetable', 'Stage performances through the year'],
  },
];

export default async function FacilitiesPage() {
  const settings = await getSchoolSettings();

  return (
    <>
      {/* Page hero */}
      <section className="sp-hero-gradient text-primary-foreground" aria-labelledby="facilities-hero">
        <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-foreground/90">Facilities</p>
          <h1 id="facilities-hero" className="mt-2 max-w-3xl text-4xl font-extrabold sm:text-5xl">
            A campus engineered for curiosity, play and safety
          </h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/85">
            Great teaching needs great surroundings. Every space at {settings.schoolName},{' '}
            {settings.city} — from labs to libraries to buses — is planned, monitored and
            continuously upgraded with children’s wellbeing at the centre.
          </p>
        </div>
      </section>

      {/* Facility detail cards */}
      <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20" aria-labelledby="facility-list">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {FACILITIES.map((f) => (
            <Card key={f.title} className="sp-card-shadow transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="p-6 lg:p-8">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sp-gold-gradient" aria-hidden="true">
                    <f.icon className="h-6 w-6 text-primary" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-primary">{f.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.copy}</p>
                    <ul className="mt-4 space-y-1.5">
                      {f.points.map((p) => (
                        <li key={p} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Gallery strip placeholder */}
      <section className="bg-secondary/50 py-14 lg:py-20" aria-labelledby="facility-gallery">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">Photo Strip</p>
              <h2 id="facility-gallery" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
                Walk the corridors with us
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Photographs of each facility will appear here as albums are published from
                the Admin Dashboard.
              </p>
            </div>
            <Button asChild variant="outline" className="h-11 shrink-0">
              <Link href="/gallery">Open full gallery</Link>
            </Button>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {['Classrooms', 'Laboratories', 'Library', 'Sports', 'Transport', 'Art Studio', 'Events', 'Campus Green'].map(
              (label) => (
                <div
                  key={label}
                  className="flex h-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card p-4 text-center transition-colors hover:border-accent/50"
                >
                  <ImageIcon className="h-7 w-7 text-muted-foreground/60" aria-hidden="true" />
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">Photos coming soon</p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:pb-20" aria-labelledby="facilities-cta">
        <div className="rounded-3xl sp-hero-gradient px-6 py-10 text-center text-primary-foreground sm:px-12">
          <h2 className="mx-auto max-w-xl text-2xl font-extrabold sm:text-3xl">
            The best way to evaluate a campus is to stand in it
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-primary-foreground/85">
            Book a guided walk-through with our admissions team and see every facility
            described above — in action, during school hours.
          </p>
          <Button
            asChild
            className="mt-7 h-12 px-7 sp-gold-gradient text-base font-semibold text-primary shadow-xl hover:opacity-90"
          >
            <Link href="/admissions#enquiry">
              <Users className="mr-2 h-4.5 w-4.5" aria-hidden="true" />
              Book a Campus Visit
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
