import Link from 'next/link';
import {
  Award,
  Eye,
  Globe,
  Heart,
  HeartHandshake,
  Landmark,
  Lightbulb,
  Quote,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSchoolSettings } from '@/lib/settings';
import { initialsFrom } from '@/components/public/nav-items';

export const metadata = {
  title: 'About Us',
  description:
    'Learn about SP International School, Bhubaneswar — our vision, mission, values, leadership, campus infrastructure, journey and board affiliation.',
};

export const dynamic = 'force-dynamic';

const VALUES = [
  { icon: Heart, title: 'Compassion', copy: 'We teach children to notice, care and act — for classmates, community and the world around them.' },
  { icon: ShieldCheck, title: 'Integrity', copy: 'Honesty and fairness are practised daily, from honest homework to fair play on the field.' },
  { icon: Lightbulb, title: 'Curiosity', copy: 'Questions are celebrated. Our classrooms reward the courage to ask “why” and the persistence to find out.' },
  { icon: Award, title: 'Excellence', copy: 'We pursue high standards in everything — academics, sport, art and conduct — without fearing mistakes.' },
  { icon: HeartHandshake, title: 'Respect', copy: 'Every voice matters. Children learn to listen first, disagree politely and include everyone.' },
  { icon: Globe, title: 'Global Citizenship', copy: 'Rooted in Indian values, our learners develop the awareness and skills to contribute to a wider world.' },
];

const TIMELINE = [
  { year: '[Year]', title: 'The foundation', copy: '[Placeholder — the story of how the school was founded and its founding vision will be published here.]' },
  { year: '[Year]', title: 'Primary wing opens', copy: '[Placeholder — milestone details about the expansion into a full primary school.]' },
  { year: '[Year]', title: 'Senior secondary begins', copy: '[Placeholder — milestone details about launching secondary and senior secondary classes.]' },
  { year: '[Year]', title: 'Board affiliation', copy: '[Placeholder — details of formal affiliation and recognitions received.]' },
  { year: 'Today', title: 'A complete digital campus', copy: 'Today the school runs on a modern ERP — admissions, fees, attendance and parent communication all in one place.' },
];

export default async function AboutPage() {
  const settings = await getSchoolSettings();

  return (
    <>
      {/* Page hero */}
      <section className="sp-hero-gradient text-primary-foreground" aria-labelledby="about-hero">
        <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-foreground/90">About Us</p>
          <h1 id="about-hero" className="mt-2 max-w-3xl text-4xl font-extrabold sm:text-5xl">
            A school where children are known, challenged and celebrated
          </h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/85">
            {settings.schoolName}, {settings.city} — {settings.tagline.toLowerCase()}.
          </p>
        </div>
      </section>

      {/* Our story */}
      <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20" aria-labelledby="story-heading">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Our Story</p>
            <h2 id="story-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
              Built for the children of {settings.city}
            </h2>
            <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
              <p>
                Every parent remembers the morning they first handed their child over to a
                school — the mixture of hope and nervousness, the silent question: will
                this place truly know my child? {settings.schoolName} was imagined
                precisely for that moment. We set out to build a school that is small
                enough to care and ambitious enough to prepare children for a fast-changing
                world.
              </p>
              <p>
                Our campus in {settings.city} brings together bright, air-y classrooms,
                well-equipped labs and libraries, generous play spaces and a faculty that
                is trained not just in subjects, but in childhood itself. Lessons follow a
                structured curriculum enriched by projects, field trips, performing arts
                and sport, so that learning never feels like a spectator sport.
              </p>
              <p>
                We are equally deliberate about character. Assemblies, house activities and
                community projects give children daily practice in teamwork, honesty and
                empathy. The result, year after year, is a community of students who are
                confident without being loud, curious without being restless, and kind
                without being asked.
              </p>
              <p>
                {settings.boardAffiliation} · Established {settings.establishedYear}.
                Details of recognitions are updated by the school office as they are
                conferred.
              </p>
            </div>
          </div>

          {/* Infrastructure summary */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary">Campus at a glance</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '[XX]-acre', label: 'Green campus' },
                { value: 'XX+', label: 'Smart classrooms' },
                { value: 'X', label: 'Modern laboratories' },
                { value: 'XX,XXX+', label: 'Library books' },
                { value: 'X', label: 'Playfields & courts' },
                { value: '100%', label: 'Campus CCTV coverage' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border bg-card p-5 sp-card-shadow">
                  <p className="text-2xl font-extrabold text-primary">{s.value}</p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">{s.label} <span className="sr-only">(configurable placeholder)</span></p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Figures are configurable placeholders — the school office maintains the
              authoritative campus facts in the Admin Dashboard → Settings.
            </p>
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="flex gap-3 p-5">
                <Landmark className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-foreground">
                  <span className="font-semibold text-primary">Affiliation & accreditation:</span>{' '}
                  {settings.boardAffiliation}. Additional accreditations and memberships will
                  be listed here as they are confirmed by the school office. Families are
                  welcome to request the latest affiliation documents at the front desk.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Vision, Mission, Values */}
      <section className="bg-secondary/50 py-14 lg:py-20" aria-labelledby="vmv-heading">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Vision · Mission · Values</p>
            <h2 id="vmv-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
              What we stand for
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card className="sp-card-shadow">
              <CardHeader>
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl sp-gold-gradient" aria-hidden="true">
                  <Eye className="h-6 w-6 text-primary" />
                </span>
                <CardTitle className="text-xl text-primary">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[15px] leading-relaxed text-muted-foreground">
                  To be the school every family in {settings.city} trusts — a community
                  where academic rigour, character formation and joyful childhood coexist,
                  and where every learner leaves prepared not just for examinations, but
                  for life.
                </p>
              </CardContent>
            </Card>
            <Card className="sp-card-shadow">
              <CardHeader>
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl sp-gold-gradient" aria-hidden="true">
                  <Target className="h-6 w-6 text-primary" />
                </span>
                <CardTitle className="text-xl text-primary">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted-foreground">
                  <li>Deliver a strong, concept-driven academic core supported by smart classrooms and labs.</li>
                  <li>Keep class sizes humane so every child receives individual attention.</li>
                  <li>Build character through structured values education, houses and community service.</li>
                  <li>Partner transparently with parents through regular, honest communication.</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v) => (
              <Card key={v.title} className="sp-card-shadow transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-6">
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary" aria-hidden="true">
                    <v.icon className="h-5.5 w-5.5 text-primary" />
                  </span>
                  <h3 className="font-semibold text-foreground">{v.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{v.copy}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership message */}
      <section className="mx-auto max-w-5xl px-4 py-14 lg:px-8 lg:py-20" aria-labelledby="leadership-heading">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">Leadership</p>
        <h2 id="leadership-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
          From the Principal’s desk
        </h2>
        <Card className="mt-8 sp-card-shadow overflow-hidden border-0">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr]">
            <div className="flex items-center justify-center bg-primary p-10 md:w-64">
              <div className="text-center">
                <span
                  className="mx-auto flex h-24 w-24 items-center justify-center rounded-full sp-gold-gradient text-3xl font-extrabold text-primary"
                  aria-hidden="true"
                >
                  {initialsFrom(settings.principalName)}
                </span>
                <p className="mt-4 font-semibold text-primary-foreground">{settings.principalName}</p>
                <p className="text-sm text-primary-foreground/70">Principal, {settings.schoolName}</p>
              </div>
            </div>
            <div className="p-8 lg:p-10">
              <Quote className="h-8 w-8 text-accent" aria-hidden="true" />
              <blockquote className="mt-4">
                <p className="text-lg italic leading-relaxed text-foreground">“{settings.principalMessage}”</p>
              </blockquote>
              <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  Education, for us, is a long conversation between a child’s potential and
                  the opportunities we place in front of them. My door — and the doors of
                  every coordinator and teacher — remain open to parents at every step of
                  that journey.
                </p>
                <p>
                  I warmly invite you to visit our campus, sit in our corridors during
                  working hours ({settings.workingHours}), and feel the atmosphere your
                  child will grow up in.
                </p>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                The Principal’s message and photograph are configurable by the school from
                the Admin Dashboard → Settings.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Journey timeline */}
      <section className="bg-secondary/50 py-14 lg:py-20" aria-labelledby="journey-heading">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Our Journey</p>
            <h2 id="journey-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
              Milestones along the way
            </h2>
            <p className="mt-3 text-muted-foreground">
              The school’s illustrated timeline is maintained by the school office — the
              milestones below are placeholders ready to be filled with real dates and
              photographs.
            </p>
          </div>
          <ol className="relative mt-12 space-y-10 border-l-2 border-accent/40 pl-8">
            {TIMELINE.map((m) => (
              <li key={m.title} className="relative">
                <span
                  className="absolute -left-[41px] top-1 flex h-5 w-5 items-center justify-center rounded-full sp-gold-gradient ring-4 ring-background"
                  aria-hidden="true"
                >
                  <Sparkles className="h-3 w-3 text-primary" />
                </span>
                <p className="text-sm font-bold uppercase tracking-wide text-accent">{m.year}</p>
                <h3 className="mt-1 text-lg font-semibold text-primary">{m.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{m.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20" aria-labelledby="about-cta">
        <div className="rounded-3xl border bg-card p-8 text-center sp-card-shadow lg:p-12">
          <h2 id="about-cta" className="text-2xl font-bold text-primary sm:text-3xl">
            Come and see the school for yourself
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Words and photographs only go so far. Book a campus visit and let our
            admissions team walk you through the classrooms, labs and playfields.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-12 px-7 sp-gold-gradient font-semibold text-primary shadow-lg hover:opacity-90">
              <Link href="/admissions#enquiry">Book a Campus Visit</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 px-7">
              <Link href="/academics">Explore Academics</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
