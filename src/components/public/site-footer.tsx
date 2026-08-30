import Link from 'next/link';
import {
  Facebook,
  GraduationCap,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
  Clock,
} from 'lucide-react';
import { NAV_LINKS, POLICY_LINKS } from '@/components/public/nav-items';
import type { SchoolSettings } from '@/lib/settings';

// Footer for the public website — navy band, settings-driven, sticky to the
// bottom of the viewport via the layout's flex wrapper + mt-auto.

export function SiteFooter({ settings }: { settings: SchoolSettings }) {
  const year = new Date().getFullYear();

  const socials = [
    { href: settings.facebookUrl, label: 'Facebook', Icon: Facebook },
    { href: settings.instagramUrl, label: 'Instagram', Icon: Instagram },
    { href: settings.youtubeUrl, label: 'YouTube', Icon: Youtube },
    { href: settings.twitterUrl, label: 'Twitter / X', Icon: Twitter },
    { href: settings.linkedinUrl, label: 'LinkedIn', Icon: Linkedin },
  ].filter((s) => Boolean(s.href));

  return (
    <footer className="mt-auto sp-hero-gradient text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12">
          {/* About */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl sp-gold-gradient" aria-hidden="true">
                <GraduationCap className="h-6 w-6 text-primary" />
              </span>
              <div>
                <p className="text-lg font-bold">{settings.schoolName}</p>
                <p className="text-sm text-primary-foreground/70">{settings.tagline}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80">
              A caring, future-ready school where every child is known, challenged and
              celebrated. We blend a strong academic core with sports, arts and values
              education so that learners step into the world as confident, compassionate
              global citizens.
            </p>
            {socials.length > 0 && (
              <div className="mt-5 flex items-center gap-2">
                {socials.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${settings.schoolName} on ${label}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5 transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <nav className="lg:col-span-2" aria-label="Footer quick links">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-accent-foreground/90">Explore</h2>
            <ul className="mt-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex h-9 items-center text-sm text-primary-foreground/80 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Information */}
          <nav className="lg:col-span-2" aria-label="Footer information links">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-accent-foreground/90">Information</h2>
            <ul className="mt-4 space-y-1">
              <li>
                <Link href="/admissions" className="inline-flex h-9 items-center text-sm text-primary-foreground/80 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-ring">
                  Admissions {settings.sessionLabel}
                </Link>
              </li>
              <li>
                <Link href="/admissions#enquiry" className="inline-flex h-9 items-center text-sm text-primary-foreground/80 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-ring">
                  Enquiry Form
                </Link>
              </li>
              <li>
                <Link href="/login" className="inline-flex h-9 items-center text-sm text-primary-foreground/80 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-ring">
                  Parent Login
                </Link>
              </li>
              {POLICY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex h-9 items-center text-sm text-primary-foreground/80 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div className="lg:col-span-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-accent-foreground/90">Reach Us</h2>
            <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                <span>
                  {settings.addressLine}
                  <br />
                  {settings.city}, {settings.state} — {settings.pincode}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                <span>
                  Office: {settings.phonePrimary}
                  <br />
                  Admissions: {settings.phoneAdmissions}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                <span>
                  {settings.emailPrimary}
                  <br />
                  {settings.emailAdmissions}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                <span>{settings.workingHours}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-primary-foreground/70 sm:flex-row lg:px-8">
          <p>
            © {year} {settings.schoolName}, {settings.city}. All rights reserved.
          </p>
          <p>Managed from the school ERP Admin Dashboard · Content placeholders configurable in Settings.</p>
        </div>
      </div>
    </footer>
  );
}
