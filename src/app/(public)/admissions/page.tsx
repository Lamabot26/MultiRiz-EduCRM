import Link from 'next/link';
import {
  Baby,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Info,
  Phone,
  Receipt,
  Sparkles,
  UserRoundPlus,
  Users,
  Footprints,
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getSchoolSettings } from '@/lib/settings';
import { EnquiryForm } from '@/components/public/enquiry-form';

export const metadata = {
  title: 'Admissions',
  description:
    'Admissions at SP International School, Bhubaneswar — process, eligibility, age criteria, required documents, fee information, FAQs and online enquiry form.',
};

export const dynamic = 'force-dynamic';

const STEPS = [
  {
    icon: UserRoundPlus,
    title: 'Submit an enquiry',
    copy: 'Fill the enquiry form below or call the admissions helpline. We log your details and a counsellor calls you back within 1–2 working days.',
  },
  {
    icon: Footprints,
    title: 'Visit the campus',
    copy: 'Walk through the classrooms, labs and playfields with our team, meet the coordinators and ask every question on your list.',
  },
  {
    icon: ClipboardList,
    title: 'Complete the application',
    copy: 'Collect and submit the application form with the required documents (checklist below). Our team verifies everything with you.',
  },
  {
    icon: Users,
    title: 'Interaction / assessment',
    copy: 'Pre-primary applicants meet us in a friendly parent–child interaction; Class 1 onwards students take a short age-appropriate assessment.',
  },
  {
    icon: BadgeCheck,
    title: 'Offer & enrolment',
    copy: 'Selected families receive an offer letter. Complete fee formalities to confirm the seat — and welcome to the school family!',
  },
];

const DOCUMENTS = [
  'Birth certificate of the child (photocopy + original for verification)',
  'Transfer Certificate from the previous school (Class 2 onwards)',
  'Report card / progress record of the previous class',
  'Recent passport-size photographs of the child and parents',
  'Address proof (Aadhaar / utility bill / rent agreement)',
  'Aadhaar card of the child (as applicable)',
  'Any concession documents (sibling, staff ward, etc.), if claiming',
];

const FAQS = [
  {
    q: 'When do admissions open for the new session?',
    a: 'Enquiries open well before the session begins, and seats in popular classes fill early. The exact admission window for each session is announced on this page and on the Notices board — the badge at the top of this page always shows the current status.',
  },
  {
    q: 'What is the minimum age for admission?',
    a: 'Age is calculated as on 1st April of the admission year. The indicative class-wise criteria are listed in the age table above; the school office confirms the exact cut-off dates for the current session as per board norms.',
  },
  {
    q: 'Is there an entrance test for my child?',
    a: 'Pre-primary admissions happen through a friendly parent–child interaction. From Class 1 onwards, applicants complete a short, age-appropriate written assessment in English, Mathematics and EVS/Science so we can plan the right support from day one.',
  },
  {
    q: 'Do you offer transport? Which areas are covered?',
    a: 'Yes, GPS-tracked school buses with trained attendants operate on fixed routes. The current route map and stop list are available from the school office — transport seats are allotted subject to availability on the requested route.',
  },
  {
    q: 'Can I pay fees in instalments?',
    a: 'Yes. Fee structures and instalment schedules are shared by the accounts office and are also visible to enrolled parents in the portal. Concessions (sibling, need-based) may be requested in writing to the Principal.',
  },
  {
    q: 'How will I know the status of my enquiry?',
    a: 'Every enquiry receives a reference number (e.g. LEAD-2025-26-00001). Quote this number on any call or email to the admissions office and our team will update you on the spot.',
  },
  {
    q: 'Whom do I contact if I need help with the form?',
    a: 'Call the admissions helpline during working hours, or write to the admissions email — both are listed in the contact section of this page. Our front-desk team is happy to fill the form together with you over the phone.',
  },
];

export default async function AdmissionsPage() {
  const settings = await getSchoolSettings();

  return (
    <>
      {/* Page hero */}
      <section className="sp-hero-gradient text-primary-foreground" aria-labelledby="admissions-hero">
        <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-foreground/90">Admissions</p>
          <h1 id="admissions-hero" className="mt-2 max-w-3xl text-4xl font-extrabold sm:text-5xl">
            Join the {settings.schoolName} family
          </h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/85">
            A clear, honest five-step process — no agents, no hidden conditions. Start
            with a two-minute enquiry and we will walk with you from the first phone call
            to the first day of school.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {settings.admissionOpen ? (
              <Badge className="gap-1.5 border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Admissions open for {settings.sessionLabel}
              </Badge>
            ) : (
              <Badge variant="outline" className="px-3 py-1.5 text-xs font-semibold text-white/90">
                Admissions currently closed — enquiries still welcome
              </Badge>
            )}
            <a
              href={`tel:${settings.phoneAdmissions.replace(/[^+\d]/g, '')}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              Admissions helpline: {settings.phoneAdmissions}
            </a>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20" aria-labelledby="process-heading">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">The Process</p>
          <h2 id="process-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
            Five simple steps to a confirmed seat
          </h2>
        </div>
        <ol className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative">
              <Card className="h-full sp-card-shadow transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl sp-gold-gradient" aria-hidden="true">
                      <step.icon className="h-5.5 w-5.5 text-primary" />
                    </span>
                    <span className="text-3xl font-extrabold text-secondary" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.copy}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Eligibility + age criteria */}
      <section className="bg-secondary/50 py-14 lg:py-20" aria-labelledby="eligibility-heading">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">Eligibility</p>
              <h2 id="eligibility-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
                Who can apply
              </h2>
              <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  Applications are welcome from all families who share our values,
                  irrespective of background. The child should meet the age criterion for
                  the class applied for (as on 1st April of the admission year) and, for
                  Class 2 onwards, produce a Transfer Certificate from a recognised
                  school.
                </p>
                <p>
                  For mid-session transfers, admissions are subject to seat availability
                  and a readiness interaction. Siblings of enrolled students and children
                  of school staff may be considered under the school’s concession policy —
                  please mention this in your enquiry.
                </p>
              </div>

              <h3 className="mt-8 text-xl font-bold text-primary">Required documents checklist</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Bring originals for verification; submit self-attested photocopies.
              </p>
              <ul className="mt-4 space-y-2.5">
                {DOCUMENTS.map((d) => (
                  <li key={d} className="flex gap-2.5 text-sm leading-relaxed text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-success" aria-hidden="true" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <Card className="sp-card-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-primary">
                    <Baby className="h-5 w-5 text-accent" aria-hidden="true" />
                    Indicative age criteria
                  </CardTitle>
                  <CardDescription>
                    Age as on 1st April of the admission year. Final cut-offs follow board
                    norms for the session.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class</TableHead>
                        <TableHead className="text-right">Completed age</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        ['Pre-Nursery', '[XX] years'],
                        ['Nursery', '[XX] years'],
                        ['LKG', '[XX] years'],
                        ['UKG', '[XX] years'],
                        ['Class 1', '[XX] years'],
                        ['Class 2 onwards', 'As per TC / previous class'],
                      ].map(([cls, age]) => (
                        <TableRow key={cls}>
                          <TableCell className="font-medium">{cls}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{age}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p className="mt-4 flex gap-2 text-xs text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Age table values are placeholders — the school office publishes the
                    confirmed cut-off dates for each session.
                  </p>
                </CardContent>
              </Card>

              <Card className="sp-card-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-primary">
                    <CalendarDays className="h-5 w-5 text-accent" aria-hidden="true" />
                    Admission timeline {settings.sessionLabel}
                  </CardTitle>
                  <CardDescription>Indicative milestones — dates announced on the Notices board.</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ol className="space-y-4">
                    {[
                      ['[Month]', 'Enquiry & campus visits open'],
                      ['[Month]', 'Application forms issued & accepted'],
                      ['[Month]', 'Interactions / assessments conducted'],
                      ['[Month]', 'Offers released & enrolment completed'],
                    ].map(([when, what]) => (
                      <li key={what} className="flex gap-4">
                        <span className="w-20 shrink-0 text-sm font-bold text-accent">{when}</span>
                        <span className="text-sm text-muted-foreground">{what}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Fees + prospectus */}
      <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20" aria-labelledby="fees-heading">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="sp-card-shadow">
            <CardHeader>
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl sp-gold-gradient" aria-hidden="true">
                <Receipt className="h-6 w-6 text-primary" />
              </span>
              <CardTitle className="text-xl text-primary">Fee information</CardTitle>
              <CardDescription>Transparent, published, and explained in person.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-[15px] leading-relaxed text-muted-foreground">{settings.feePolicyNote}</p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Fee structure sheets for every class are available at the school office.</li>
                <li>Enrolled parents can view invoices and payment history in the parent portal.</li>
                <li>Concession requests are considered in writing by the Principal’s office.</li>
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                The detailed fee policy is published on our{' '}
                <Link href="/policies?page=fee-policy" className="font-medium text-primary underline">
                  Fee Policy page
                </Link>
                .
              </p>
            </CardContent>
          </Card>

          <Card className="sp-card-shadow">
            <CardHeader>
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl sp-gold-gradient" aria-hidden="true">
                <FileText className="h-6 w-6 text-primary" />
              </span>
              <CardTitle className="text-xl text-primary">Prospectus & application form</CardTitle>
              <CardDescription>
                The full prospectus covers curriculum, facilities, rules and the fee sheet.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                The downloadable prospectus for session {settings.sessionLabel} is being
                updated by the school office. Until it is published, request a printed copy
                at the front desk or ask our admissions team to send one over.
              </p>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="mt-5 inline-block rounded-md">
                      <Button disabled className="h-12 gap-2 px-6 text-base" aria-disabled="true">
                        <Download className="h-4.5 w-4.5" aria-hidden="true" />
                        Download Prospectus
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Available soon — being updated for session {settings.sessionLabel}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <p className="mt-4 text-xs text-muted-foreground">
                Tip: while the prospectus is in preparation, the{' '}
                <Link href="/academics" className="font-medium text-primary underline">
                  Academics
                </Link>{' '}
                and{' '}
                <Link href="/facilities" className="font-medium text-primary underline">
                  Facilities
                </Link>{' '}
                pages cover most of the same ground.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Enquiry form */}
      <section className="bg-secondary/50 py-14 lg:py-20" aria-labelledby="enquiry-heading">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Enquiry Form</p>
            <h2 id="enquiry-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
              Tell us about your child
            </h2>
            <p className="mt-3 text-muted-foreground">
              Two minutes now saves you a phone tree later. Submit the form and our
              admissions team will call you back to schedule a campus visit.
            </p>
          </div>
          <div className="mt-8">
            <EnquiryForm sessionLabel={settings.sessionLabel} />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-14 lg:px-8 lg:py-20" aria-labelledby="faq-heading">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">FAQs</p>
          <h2 id="faq-heading" className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
            Questions parents ask us most
          </h2>
        </div>
        <Accordion type="single" collapsible className="mt-8">
          {FAQS.map((f, i) => (
            <AccordionItem key={f.q} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-[15px] font-semibold text-foreground">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-[15px] leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </>
  );
}
