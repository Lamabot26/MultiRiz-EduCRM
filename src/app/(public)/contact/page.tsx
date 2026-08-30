import { getSchoolSettings } from '@/lib/settings';
import {
  Clock,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ContactForm } from '@/components/public/contact-form';

export const metadata = {
  title: 'Contact Us',
  description:
    'Contact SP International School, Bhubaneswar — address, phone numbers, email, working hours, department contacts and an online message form.',
};

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const settings = await getSchoolSettings();

  const infoCards = [
    {
      icon: MapPin,
      title: 'Visit Us',
      lines: [settings.addressLine, `${settings.city}, ${settings.state} — ${settings.pincode}`],
    },
    {
      icon: Phone,
      title: 'Call Us',
      lines: [`Office: ${settings.phonePrimary}`, `Admissions: ${settings.phoneAdmissions}`],
    },
    {
      icon: Mail,
      title: 'Write to Us',
      lines: [`General: ${settings.emailPrimary}`, `Admissions: ${settings.emailAdmissions}`],
    },
    {
      icon: Clock,
      title: 'Office Hours',
      lines: [settings.workingHours, 'Closed on public holidays'],
    },
  ];

  const departments = [
    { name: 'Admissions Office', person: '[Counsellor — placeholder]', contact: settings.phoneAdmissions, email: settings.emailAdmissions },
    { name: "Principal's Office", person: '[Secretary — placeholder]', contact: settings.phonePrimary, email: settings.emailPrimary },
    { name: 'Accounts & Fees', person: '[Accountant — placeholder]', contact: `${settings.phonePrimary} [Ext.]`, email: settings.emailPrimary },
    { name: 'Transport Desk', person: '[Transport in-charge — placeholder]', contact: `${settings.phonePrimary} [Ext.]`, email: settings.emailPrimary },
    { name: 'Front Desk', person: '[Reception — placeholder]', contact: settings.phonePrimary, email: settings.emailPrimary },
  ];

  return (
    <>
      {/* Page hero */}
      <section className="sp-hero-gradient text-primary-foreground" aria-labelledby="contact-hero">
        <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-foreground/90">Contact</p>
          <h1 id="contact-hero" className="mt-2 max-w-3xl text-4xl font-extrabold sm:text-5xl">
            We would love to hear from you
          </h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/85">
            Whether it is an admission question, a feedback note or a small worry you
            want to share — the {settings.schoolName} office is approachable, responsive
            and genuinely glad you reached out.
          </p>
        </div>
      </section>

      {/* Info cards */}
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16" aria-labelledby="contact-info-heading">
        <h2 id="contact-info-heading" className="sr-only">
          Contact information
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {infoCards.map((c) => (
            <Card key={c.title} className="sp-card-shadow transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="p-6">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl sp-gold-gradient" aria-hidden="true">
                  <c.icon className="h-6 w-6 text-primary" />
                </span>
                <h3 className="font-bold text-primary">{c.title}</h3>
                {c.lines.map((line) => (
                  <p key={line} className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {line}
                  </p>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Map + form */}
      <section className="mx-auto max-w-7xl px-4 pb-12 lg:px-8 lg:pb-16" aria-labelledby="map-form-heading">
        <h2 id="map-form-heading" className="sr-only">
          Map and message form
        </h2>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Map */}
          <div className="flex flex-col">
            <h3 className="text-xl font-bold text-primary">Find us on the map</h3>
            {settings.mapEmbedUrl ? (
              <div className="mt-4 flex-1 overflow-hidden rounded-2xl border sp-card-shadow">
                <iframe
                  src={settings.mapEmbedUrl}
                  title={`Map location of ${settings.schoolName}`}
                  className="h-80 w-full lg:h-full lg:min-h-96"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-secondary/40 p-10 text-center lg:min-h-96">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-card sp-card-shadow" aria-hidden="true">
                  <MapPin className="h-8 w-8 text-primary" />
                </span>
                <p className="mt-5 font-semibold text-foreground">Interactive map placeholder</p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  The school’s map embed URL is configured in the Admin Dashboard →
                  Settings and will render here automatically. Until then, please use the
                  address card above or call the front desk for directions.
                </p>
                <p className="mt-4 rounded-lg bg-card px-4 py-2 text-xs font-medium text-muted-foreground sp-card-shadow">
                  {settings.addressLine}, {settings.city}, {settings.state} — {settings.pincode}
                </p>
              </div>
            )}
          </div>

          {/* Form */}
          <div>
            <h3 className="text-xl font-bold text-primary">Send us a message</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We reply within 1–2 working days. For admission enquiries, the{' '}
              <a href="/admissions#enquiry" className="font-medium text-primary underline">
                admission enquiry form
              </a>{' '}
              reaches the right team faster.
            </p>
            <div className="mt-6 rounded-2xl border bg-card p-6 sp-card-shadow lg:p-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8 lg:pb-20" aria-labelledby="departments-heading">
        <Card className="sp-card-shadow">
          <CardHeader>
            <CardTitle id="departments-heading" className="flex items-center gap-2 text-xl text-primary">
              <UserRound className="h-5 w-5 text-accent" aria-hidden="true" />
              Department contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Contact person</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((d) => (
                    <TableRow key={d.name}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="text-muted-foreground">{d.person}</TableCell>
                      <TableCell className="text-muted-foreground">{d.contact}</TableCell>
                      <TableCell className="text-muted-foreground">{d.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Contact persons and direct extensions are maintained by the school office
              and configurable from the Admin Dashboard → Settings.
            </p>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
