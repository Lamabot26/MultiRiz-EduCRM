import Link from 'next/link';
import { db } from '@/lib/db';
import { getSchoolSettings } from '@/lib/settings';
import { fmtDate } from '@/lib/date-utils';
import {
  ArrowRight,
  Baby,
  BookOpen,
  Bus,
  CalendarDays,
  Compass,
  FlaskConical,
  Globe,
  GraduationCap,
  HeartHandshake,
  Image as ImageIcon,
  Library,
  MapPin,
  PencilRuler,
  Phone,
  Presentation,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { initialsFrom, noticeCategoryBadgeClass, NOTICE_CATEGORY_LABELS } from '@/components/public/nav-items';

export const metadata = {
  title: 'Home',
  description:
    'SP International School, Bhubaneswar — a caring, future-ready school offering Pre-Primary to Senior Secondary education with smart classrooms, labs, sports and values-based learning. Admissions open.',
};

export const dynamic = 'force-dynamic';

const PROGRAMMES = [
  {
    icon: Baby,
    title: 'Pre-Primary',
    grades: 'Pre-Nursery · Nursery · LKG · UKG',
    copy: 'A joyful, play-based foundation where curiosity is nurtured through stories, music, movement and hands-on discovery in warm, child-safe classrooms.',
  },
  {
    icon: PencilRuler,
    title: 'Primary',
    grades: 'Class 1 – Class 5',
    copy: 'Strong literacy and numeracy foundations built through activity-led learning, thematic units and gentle habit formation that makes children love school.',
  },
  {
    icon: Compass,
    title: 'Middle',
    grades: 'Class 6 – Class 8',
    copy: 'Learners deepen subject knowledge with labs, projects and collaborative work while developing study skills, confidence and a sense of responsibility.',
  },
  {
    icon: GraduationCap,
    title: 'Senior',
    grades: 'Class 9 – Class 12',
    copy: 'Rigorous board-focused preparation with stream guidance, career counselling and mentored practice so every student steps out future-ready.',
  },
];

const WHY_US = [
  {
    icon: Users,
    title: 'Caring, Qualified Faculty',
    copy: 'Mentors who know every child by name — trained regularly in modern pedagogy and child psychology, with generous time for individual attention.',
  },
  {
    icon: Presentation,
    title: 'Smart-Class Learning',
    copy: 'Interactive panels, digital content and a structured curriculum bring abstract concepts alive in every classroom, every single day.',
  },
  {
    icon: HeartHandshake,
    title: 'Values & Life Skills',
    copy: 'Empathy, honesty and respect are taught as deliberately as mathematics — through assemblies, mentoring circles and community projects.',
  },
  {
    icon: ShieldCheck,
    title: 'Safety First Campus',
    copy: 'CCTV-monitored campus, verified staff, medical room and strict visitor protocols, so parents always have complete peace of mind.',
  },
  {
    icon: Trophy,
    title: 'Sports & Arts for All',
    copy: 'Structured coaching in games, athletics, music and visual arts — because confidence built on the field travels into every classroom.',
  },
  {
    icon: Globe,
    title: 'Global Outlook, Indian Roots',
    copy: 'An international outlook grounded in Indian culture and values, preparing children to thrive anywhere in the world without losing themselves.',
  },
];

const FACILITY_CARDS = [
  { icon: Presentation, title: 'Smart Classrooms', copy: 'Every classroom is enabled with interactive displays and curated digital lessons.' },
  { icon: FlaskConical, title: 'Science & Computer Labs', copy: 'Well-equipped physics, chemistry, biology and computer labs for joyful experimentation.' },
  { icon: Library, title: 'Library & Reading Nook', copy: 'A growing collection of storybooks, reference texts and quiet corners for young readers.' },
  { icon: Trophy, title: 'Sports Facilities', copy: 'Playfields, indoor games and structured PE programmes for every age group.' },
  { icon: Bus, title: 'Safe Transport', copy: 'GPS-tracked buses with trained attendants on every route. [Route map — placeholder]' },
  { icon: ShieldCheck, title: 'Safety & Security', copy: 'CCTV coverage, controlled access, fire safety and an on-campus medical room.' },
];

function excerptOf(text: string, max = 150): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat;
}

export default async function HomePage() {
  const settings = await getSchoolSettings();

  let albums: Awaited<ReturnType<typeof fetchHomeAlbums>> = [];
  let notices: Awaited<ReturnType<typeof fetchHomeNotices>> = [];
  let events: Awaited<ReturnType<typeof fetchHomeEvents>> = [];
  try {
    [albums, notices, events] = await Promise.all([fetchHomeAlbums(), fetchHomeNotices(), fetchHomeEvents()]);
  } catch {
    // The marketing page must always render; sections fall back to placeholders.
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: settings.schoolName,
    url: '/',
    description: settings.tagline,
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.addressLine,
      addressLocality: settings.city,
      addressRegion: settings.state,
      postalCode: settings.pincode,
      addressCountry: 'IN',
    },
    telephone: settings.phonePrimary,
    email: settings.emailPrimary,
    sameAs: [settings.facebookUrl, settings.instagramUrl, settings.youtubeUrl, settings.twitterUrl, settings.linkedinUrl].filter(
      (u) => u && u !== '#',
    ),
  };

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden sp-hero-gradient text-primary-foreground" aria-labelledby="hero-heading">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 85% 15%, oklch(0.8 0.14 75) 0%, transparent 45%), radial-gradient(circle at 10% 90%, oklch(0.7 0.13 65) 0%, transparent 40%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            {settings.admissionOpen && (
              <Badge className="mb-5 gap-1.5 border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Admissions open for {settings.sessionLabel}
              </Badge>
            )}
            <h1 id="hero-heading" className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {settings.tagline}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
              Welcome to {settings.schoolName}, {settings.city}. From the first wobbly step
              into Pre-Nursery to the confident stride out of Class 12, we partner with
              parents to build strong minds, kind hearts and courageous spirits.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                className="h-12 px-6 sp-gold-gradient text-base font-semibold text-primary shadow-xl hover:opacity-90"
              >
                <Link href="/admissions">
                  Apply for Admission
                  <ArrowRight className="ml-2 h-4.5 w-4.5" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 border-white/40 bg-white/5 px-6 text-base font-medium text-white backdrop-blur hover:bg-white/15 hover:text-white"
              >
                <Link href="/admissions#enquiry">Book a Campus Visit</Link>
              </Button>
            </div>
          </div>

          {/* Hero stats — configuration placeholders, editable from Settings */}
          <dl className="mt-12 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { value: '[XX]+', label: 'Years of academic excellence' },
              { value: 'XX', label: 'Classes — Pre-Nursery to Class 12' },
              { value: 'XX:XX', label: 'Teacher–student ratio' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur transition-colors hover:bg-white/15"
              >
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-3xl font-extrabold tracking-tight">{stat.value}</dd>
                <dd className="mt-1 text-xs font-medium text-primary-foreground/75">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ============ ACADEMIC PROGRAMMES ============ */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20" aria-labelledby="programmes-heading">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Academic Programmes</p>
          <h2 id="programmes-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
            One journey, four thoughtfully designed stages
          </h2>
          <p className="mt-3 text-muted-foreground">
            Each stage of school life has its own rhythm, curriculum design and pastoral
            care — so children are always learning at the right pace, in the right way.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROGRAMMES.map((p) => (
            <Card key={p.title} className="group sp-card-shadow transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardHeader className="pb-3">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary transition-colors group-hover:bg-accent/15" aria-hidden="true">
                  <p.icon className="h-6 w-6 text-primary" />
                </span>
                <CardTitle className="text-lg text-primary">{p.title}</CardTitle>
                <CardDescription className="text-xs font-medium uppercase tracking-wide">{p.grades}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm leading-relaxed text-muted-foreground">{p.copy}</p>
                <Link
                  href="/academics"
                  className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  Explore curriculum
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ============ WHY CHOOSE US ============ */}
      <section className="bg-secondary/50 py-16 lg:py-20" aria-labelledby="why-heading">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Why Choose Us</p>
            <h2 id="why-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
              A school built around your child
            </h2>
            <p className="mt-3 text-muted-foreground">
              Choosing a school is choosing a second home. Here is what families can
              count on, every single day, at {settings.schoolName}.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_US.map((f) => (
              <Card key={f.title} className="sp-card-shadow transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="flex gap-4 p-6">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sp-gold-gradient" aria-hidden="true">
                    <f.icon className="h-6 w-6 text-primary" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.copy}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FACILITIES OVERVIEW ============ */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20" aria-labelledby="facilities-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Campus & Facilities</p>
            <h2 id="facilities-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
              Spaces designed for curiosity and play
            </h2>
            <p className="mt-3 text-muted-foreground">
              Bright classrooms, buzzing labs, quiet libraries and open play spaces —
              every corner of our campus is planned with children in mind.
            </p>
          </div>
          <Button asChild variant="outline" className="h-11 shrink-0">
            <Link href="/facilities">View all facilities</Link>
          </Button>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FACILITY_CARDS.map((f) => (
            <Card key={f.title} className="sp-card-shadow transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="p-6">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary" aria-hidden="true">
                  <f.icon className="h-6 w-6 text-primary" />
                </span>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.copy}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ============ PRINCIPAL'S MESSAGE ============ */}
      <section className="bg-secondary/50 py-16 lg:py-20" aria-labelledby="principal-heading">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <Card className="sp-card-shadow overflow-hidden border-0">
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr]">
              <div className="flex items-center justify-center bg-primary p-10 md:w-64">
                <div className="text-center">
                  <span
                    className="mx-auto flex h-24 w-24 items-center justify-center rounded-full sp-gold-gradient text-3xl font-extrabold text-primary shadow-inner"
                    aria-hidden="true"
                  >
                    {initialsFrom(settings.principalName)}
                  </span>
                  <p className="mt-4 font-semibold text-primary-foreground">{settings.principalName}</p>
                  <p className="text-sm text-primary-foreground/70">Principal</p>
                </div>
              </div>
              <div className="p-8 lg:p-10">
                <Quote className="h-8 w-8 text-accent" aria-hidden="true" />
                <blockquote id="principal-heading" className="mt-4">
                  <p className="text-lg italic leading-relaxed text-foreground sm:text-xl">
                    “{settings.principalMessage}”
                  </p>
                </blockquote>
                <p className="mt-4 text-sm text-muted-foreground">
                  Every child who walks through our gates arrives with a unique spark. Our
                  promise to parents is simple — we will know your child, challenge your
                  child and celebrate your child, every single term.
                </p>
                <Separator className="my-5" />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Message configurable by the school from Admin Dashboard → Settings.
                  </p>
                  <Button asChild variant="outline" className="h-11">
                    <Link href="/about">Read our full story</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20" aria-labelledby="testimonials-heading">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Parent Voices</p>
          <h2 id="testimonials-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
            What our families say
          </h2>
          <p className="mt-3 text-muted-foreground">
            Real stories from our parent community will be published here, collected
            through the school’s feedback process.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="sp-card-shadow">
              <CardContent className="p-6">
                <div className="flex gap-0.5" aria-label="Star rating placeholder">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-[oklch(0.63_0.13_65)] text-[oklch(0.63_0.13_65)]" aria-hidden="true" />
                  ))}
                </div>
                <p className="mt-4 min-h-20 text-sm italic leading-relaxed text-muted-foreground">
                  [Parent testimonial — placeholder. Collected testimonials will be curated
                  and published from the Admin Dashboard.]
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary" aria-hidden="true">
                    {['P1', 'P2', 'P3'][i]}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">[Parent name]</p>
                    <p className="text-xs text-muted-foreground">Parent, [Class] · {settings.city}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ============ GALLERY PREVIEW ============ */}
      <section className="bg-secondary/50 py-16 lg:py-20" aria-labelledby="gallery-heading">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">Life at School</p>
              <h2 id="gallery-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
                Moments from our campus
              </h2>
              <p className="mt-3 text-muted-foreground">
                Assemblies, annual days, science fairs and everyday joy — glimpsed through
                our photo albums.
              </p>
            </div>
            <Button asChild variant="outline" className="h-11 shrink-0">
              <Link href="/gallery">
                Open gallery
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {albums.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {albums.map((album) => (
                <Link
                  key={album.id}
                  href={`/gallery?slug=${album.slug}`}
                  className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <div
                    className="relative flex h-44 items-center justify-center rounded-2xl sp-hero-gradient transition-transform group-hover:scale-[1.02]"
                    role="img"
                    aria-label={`Album: ${album.title}`}
                  >
                    <ImageIcon className="h-10 w-10 text-white/40" aria-hidden="true" />
                  </div>
                  <div className="px-1 pt-3">
                    <p className="font-semibold text-primary group-hover:underline">{album.title}</p>
                    <p className="text-xs text-muted-foreground">{album._count.items} photos</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {['Annual Day', 'Science Fair', 'Sports Meet', 'Art & Craft'].map((label) => (
                <div
                  key={label}
                  className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card p-4 text-center"
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">Album placeholder — photos coming soon</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ NOTICES & EVENTS ============ */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20" aria-labelledby="news-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Stay Updated</p>
            <h2 id="news-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
              Latest notices & upcoming events
            </h2>
          </div>
          <Button asChild variant="outline" className="h-11 shrink-0">
            <Link href="/notices">All notices & events</Link>
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Notices */}
          <Card className="sp-card-shadow">
            <CardHeader className="flex-row items-center gap-2 pb-4">
              <BookOpen className="h-5 w-5 text-accent" aria-hidden="true" />
              <CardTitle className="text-lg text-primary">Notices</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {notices.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                  No notices published yet — announcements from the school office will
                  appear here once published from the Admin Dashboard.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {notices.map((n) => (
                    <li key={n.id}>
                      <Link
                        href={`/notices/detail?slug=${n.slug}`}
                        className="group flex flex-col gap-1.5 py-4 focus-visible:outline-2 focus-visible:outline-ring first:pt-0"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`${noticeCategoryBadgeClass(n.category)} text-[11px] font-semibold`}>
                            {NOTICE_CATEGORY_LABELS[n.category] ?? n.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{fmtDate(n.publishedAt ?? n.createdAt)}</span>
                        </div>
                        <p className="font-semibold text-foreground group-hover:text-primary">{n.title}</p>
                        <p className="line-clamp-2 text-sm text-muted-foreground">{excerptOf(n.content)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Events */}
          <Card className="sp-card-shadow">
            <CardHeader className="flex-row items-center gap-2 pb-4">
              <CalendarDays className="h-5 w-5 text-accent" aria-hidden="true" />
              <CardTitle className="text-lg text-primary">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {events.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                  No upcoming events published yet — the school calendar will populate
                  here as events are scheduled by the Admin team.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {events.map((e) => {
                    const d = e.startsAt;
                    return (
                      <li key={e.id} className="flex gap-4 py-4 first:pt-0">
                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-primary-foreground">
                          <span className="text-xl font-extrabold leading-none">{String(d.getDate()).padStart(2, '0')}</span>
                          <span className="text-[10px] uppercase tracking-wide text-primary-foreground/80">
                            {d.toLocaleString('en-IN', { month: 'short' })}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{e.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{excerptOf(e.description, 110)}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                            {e.location ?? settings.city}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============ CTA BAND ============ */}
      <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-8" aria-labelledby="cta-heading">
        <div className="rounded-3xl sp-hero-gradient px-6 py-12 text-center text-primary-foreground sm:px-12 lg:py-16">
          <h2 id="cta-heading" className="mx-auto max-w-2xl text-3xl font-extrabold sm:text-4xl">
            Begin your child’s journey with {settings.schoolName}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">
            Admissions for {settings.sessionLabel} are open. Share a few details and our
            admissions team will call you back within 1–2 working days to arrange a
            campus visit.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-12 px-7 sp-gold-gradient text-base font-semibold text-primary shadow-xl hover:opacity-90">
              <Link href="/admissions#enquiry">Submit an Enquiry</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 border-white/40 bg-white/5 px-7 text-base text-white hover:bg-white/15 hover:text-white"
            >
              <a href={`tel:${settings.phoneAdmissions.replace(/[^+\d]/g, '')}`}>
                <Phone className="mr-2 h-4.5 w-4.5" aria-hidden="true" />
                Call Admissions: {settings.phoneAdmissions}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}

// ---------- data fetchers ----------

async function fetchHomeAlbums() {
  return db.galleryAlbum.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    take: 4,
    include: { _count: { select: { items: true } } },
  });
}

async function fetchHomeNotices() {
  return db.notice.findMany({
    where: { isPublished: true, audience: { in: ['PUBLIC', 'ALL'] } },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: 3,
    select: { id: true, slug: true, title: true, content: true, category: true, publishedAt: true, createdAt: true },
  });
}

async function fetchHomeEvents() {
  return db.event.findMany({
    where: { isPublished: true, isPublic: true, startsAt: { gte: new Date() } },
    orderBy: { startsAt: 'asc' },
    take: 3,
    select: { id: true, title: true, description: true, startsAt: true, location: true },
  });
}
