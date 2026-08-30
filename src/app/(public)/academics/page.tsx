import Link from 'next/link';
import {
  Baby,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Compass,
  FileText,
  FlaskConical,
  GraduationCap,
  Languages,
  Lightbulb,
  Palette,
  PencilRuler,
  Presentation,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSchoolSettings } from '@/lib/settings';

export const metadata = {
  title: 'Academics',
  description:
    'Curriculum and pedagogy at SP International School, Bhubaneswar — pre-primary to senior secondary, subjects offered, assessment approach and academic calendar.',
};

export const dynamic = 'force-dynamic';

const STAGES = [
  {
    icon: Baby,
    title: 'Pre-Primary (Pre-Nursery – UKG)',
    tagline: 'Learning through play, every single day',
    subjects: ['Language readiness', 'Early numeracy', 'EVS discovery', 'Rhymes & stories', 'Art & craft', 'Music & movement', 'Free & structured play'],
    approach: [
      'Play-way and Montessori-inspired methods with activity corners in every classroom.',
      'Phonics-first literacy so children read before they are asked to write long answers.',
      'No-bag days, nature walks and celebration days that make school a place children run towards.',
    ],
    copy:
      'Our pre-primary wing is a warm, colourful world scaled to little people. Classrooms have reading corners, block areas and sand-and-water stations; the daily timetable balances free play, guided activities and rest. Teachers observe each child against developmental milestones and share progress with parents gently and often — there are no examinations here, only growth.',
  },
  {
    icon: PencilRuler,
    title: 'Primary (Class 1 – Class 5)',
    tagline: 'Strong foundations, happy habits',
    subjects: ['English', 'Mathematics', 'EVS / Science', 'Social Studies', 'Hindi', 'Odia', 'Computer Science', 'Art', 'Music', 'Physical Education', 'Value Education'],
    approach: [
      'Thematic units connect subjects so knowledge feels useful, not fragmented.',
      'Daily reading programme and structured handwriting, spelling and mental-maths practice.',
      'Continuous, low-stress assessment — short quizzes and activities instead of frightening tests.',
    ],
    copy:
      'The primary years decide how a child feels about learning for the rest of their life. We keep classes small and activities hands-on: mathematics with manipulatives, science with experiments, language with readers’ theatre. Form teachers track each child closely and communicate with parents every term — and sooner, whenever a little extra help is spotted.',
  },
  {
    icon: Compass,
    title: 'Middle (Class 6 – Class 8)',
    tagline: 'From facts to frameworks',
    subjects: ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History & Civics', 'Geography', 'Hindi', 'Odia / Sanskrit', 'Computer Science / AI basics', 'Work Education', 'Art & Music'],
    approach: [
      'Subject specialists for every discipline, with laboratory work woven into the timetable.',
      'Project-based learning, model-making and inter-house academic competitions.',
      'Explicit study-skills and note-making coaching as workloads step up.',
    ],
    copy:
      'Middle school is where children move from learning to read to reading to learn. Laboratory work becomes weekly, projects become research-driven, and our teachers deliberately coach the invisible skills — planning, note-making, revision strategy — that make senior school manageable. Pastoral care continues through class teachers and house mentors who know every student’s story.',
  },
  {
    icon: GraduationCap,
    title: 'Secondary & Senior (Class 9 – Class 12)',
    tagline: 'Board-ready, future-ready',
    subjects: ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Accountancy', 'Business Studies', 'Economics', 'History', 'Political Science', 'Physical Education'],
    approach: [
      'Structured board preparation with chapter tests, pre-boards and detailed error analysis.',
      'Stream counselling for Class 11 based on aptitude, interest and board performance.',
      'Mentored practice, doubt-clearing clinics and career guidance from Class 9 onwards.',
    ],
    copy:
      'In the senior years we are unapologetically focused on outcomes — while refusing to reduce children to marks. Weekly assessments mirror board patterns, answer scripts are returned with written feedback, and mentor teachers sit with each student to plan improvement. Career talks, alumni interactions and stream-counselling sessions help families choose Class 11 streams with confidence rather than pressure.',
  },
];

const ASSESSMENT = [
  {
    icon: ClipboardList,
    title: 'Continuous & comprehensive',
    copy: 'Classwork, projects, participation and behaviour are observed through the term — report cards reflect the whole child, not just test scores.',
  },
  {
    icon: FileText,
    title: 'Formative feedback first',
    copy: 'Quizzes, exit tickets and class discussions surface misunderstandings early; remedial support is arranged before gaps can grow.',
  },
  {
    icon: BookOpen,
    title: 'Term examinations',
    copy: 'From upper primary onwards, structured term and annual examinations build exam temperament gradually, with papers that follow board patterns.',
  },
  {
    icon: Users,
    title: 'Parents as partners',
    copy: 'Report cards, parent–teacher meetings and the parent portal keep families fully in the loop — progress is never a surprise at our school.',
  },
];

export default async function AcademicsPage() {
  const settings = await getSchoolSettings();

  return (
    <>
      {/* Page hero */}
      <section className="sp-hero-gradient text-primary-foreground" aria-labelledby="academics-hero">
        <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-foreground/90">Academics</p>
          <h1 id="academics-hero" className="mt-2 max-w-3xl text-4xl font-extrabold sm:text-5xl">
            A curriculum that builds understanding, not memorisation
          </h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/85">
            From the first rhyme in Pre-Nursery to the final board practical in Class 12,
            learning at {settings.schoolName} is structured, joyful and continuously
            assessed. {settings.boardAffiliation}
          </p>
        </div>
      </section>

      {/* Pedagogy intro */}
      <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20" aria-labelledby="pedagogy-heading">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Our Pedagogy</p>
            <h2 id="pedagogy-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
              How we teach
            </h2>
            <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
              <p>
                Our teaching philosophy rests on a simple conviction: children understand
                what they can see, touch, discuss and apply. Every classroom therefore
                pairs a structured syllabus with concrete experiences — laboratory
                demonstrations, manipulatives, role-play, field observations and digital
                lessons on smart panels.
              </p>
              <p>
                Teachers plan in teams, mapping every chapter to learning outcomes before
                it is taught. Lessons open with a hook, build through guided practice, and
                close with a check for understanding. Wherever a concept refuses to land,
                our teachers have the freedom — and the time — to re-teach it differently.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { icon: Presentation, title: 'Concept-first lessons', copy: 'Every lesson is mapped to clear learning outcomes.' },
              { icon: FlaskConical, title: 'Learning by doing', copy: 'Labs, projects and kits make ideas tangible.' },
              { icon: Languages, title: 'Language rich', copy: 'Reading, speaking and writing woven through all subjects.' },
              { icon: Lightbulb, title: 'Thinking skills', copy: 'Questioning, reasoning and reflection practised daily.' },
            ].map((b) => (
              <div key={b.title} className="rounded-2xl border bg-card p-5 sp-card-shadow">
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary" aria-hidden="true">
                  <b.icon className="h-5.5 w-5.5 text-primary" />
                </span>
                <h3 className="font-semibold text-foreground">{b.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{b.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stage sections */}
      <section className="bg-secondary/50 py-14 lg:py-20" aria-labelledby="stages-heading">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Programmes</p>
            <h2 id="stages-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
              Four stages, one continuous journey
            </h2>
          </div>
          <div className="mt-10 space-y-8">
            {STAGES.map((stage, idx) => (
              <Card key={stage.title} className="sp-card-shadow overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px]">
                  <div className="p-6 lg:p-8">
                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sp-gold-gradient" aria-hidden="true">
                        <stage.icon className="h-6 w-6 text-primary" />
                      </span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-accent">Stage {idx + 1}</p>
                        <CardTitle className="mt-1 text-xl text-primary">{stage.title}</CardTitle>
                        <p className="mt-1 text-sm font-medium text-muted-foreground">{stage.tagline}</p>
                      </div>
                    </div>
                    <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{stage.copy}</p>
                    <ul className="mt-4 space-y-2">
                      {stage.approach.map((a) => (
                        <li key={a} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t bg-card p-6 lg:border-l lg:border-t-0 lg:p-8">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Subjects offered</h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {stage.subjects.map((s) => (
                        <Badge key={s} variant="secondary" className="font-medium">
                          {s}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                      Subject availability varies by class; the school office shares the
                      detailed syllabus on request.
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Assessment */}
      <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20" aria-labelledby="assessment-heading">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Assessment</p>
          <h2 id="assessment-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
            Measuring what truly matters
          </h2>
          <p className="mt-3 text-muted-foreground">
            Assessment at our school is a flashlight, not a hammer — it exists to show
            children (and parents) exactly where they stand and what comes next.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ASSESSMENT.map((a) => (
            <Card key={a.title} className="sp-card-shadow transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="p-6">
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary" aria-hidden="true">
                  <a.icon className="h-5.5 w-5.5 text-primary" />
                </span>
                <h3 className="font-semibold text-foreground">{a.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{a.copy}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Academic calendar */}
      <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8 lg:pb-20" aria-labelledby="calendar-heading">
        <Card className="sp-card-shadow overflow-hidden border-0">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-6 bg-primary p-8 text-primary-foreground lg:p-10">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl sp-gold-gradient" aria-hidden="true">
              <CalendarDays className="h-7 w-7 text-primary" />
            </span>
            <div>
              <h2 id="calendar-heading" className="text-xl font-bold sm:text-2xl">
                Academic Calendar {settings.sessionLabel}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-primary-foreground/80">
                The detailed calendar — term dates, examinations, holidays and event days
                for session {settings.sessionLabel} — is being finalised by the academic
                office. Once published it will be downloadable here and shared through
                the notices board and parent portal.
              </p>
            </div>
            <Button asChild variant="outline" className="h-12 border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white">
              <Link href="/notices">Check notices board</Link>
            </Button>
          </div>
        </Card>
      </section>
    </>
  );
}
