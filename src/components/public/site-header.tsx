'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, Lock, Menu, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { NAV_LINKS, type NavLink } from '@/components/public/nav-items';
import type { SchoolSettings } from '@/lib/settings';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandMark({ schoolName, tagline }: { schoolName: string; tagline: string }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-ring" aria-label={`${schoolName} — home`}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sp-gold-gradient shadow-sm" aria-hidden="true">
        <GraduationCap className="h-6 w-6 text-primary" />
      </span>
      <span className="flex min-w-0 flex-col whitespace-nowrap leading-tight">
        <span className="text-base font-bold text-primary sm:text-lg">{schoolName}</span>
        <span className="hidden text-xs text-muted-foreground 2xl:block">{tagline}</span>
      </span>
    </Link>
  );
}

export function SiteHeader({ settings }: { settings: SchoolSettings }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Slim contact strip */}
      <div className="hidden bg-primary text-primary-foreground md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs lg:px-8">
          <p className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-accent-foreground/90" aria-hidden="true" />
            <span>Admissions helpline: {settings.phoneAdmissions}</span>
            <span aria-hidden="true" className="mx-1 opacity-40">|</span>
            <span className="opacity-80">{settings.workingHours}</span>
          </p>
          <p className="opacity-80">
            {settings.boardAffiliation} · Est. {settings.establishedYear}
          </p>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 lg:px-8">
          <BrandMark schoolName={settings.schoolName} tagline={settings.tagline} />

          <nav aria-label="Main navigation" className="hidden items-center gap-1 2xl:flex">
            {NAV_LINKS.map((link: NavLink) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(pathname, link.href) ? 'page' : undefined}
                className={`rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-ring ${
                  isActive(pathname, link.href) ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden h-11 gap-1.5 text-sm font-medium text-primary hover:text-primary md:inline-flex"
            >
              <Link href="/login">
                <Lock className="h-4 w-4" aria-hidden="true" />
                Parent Login
              </Link>
            </Button>
            {settings.admissionOpen && (
              <Button
                asChild
                size="sm"
                className="hidden h-11 sp-gold-gradient text-sm font-semibold text-primary shadow-md hover:opacity-90 sm:inline-flex"
              >
                <Link href="/admissions">Apply for Admission</Link>
              </Button>
            )}

            {/* Mobile menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 2xl:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-left">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg sp-gold-gradient" aria-hidden="true">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </span>
                    {settings.schoolName}
                  </SheetTitle>
                  <SheetDescription className="text-left">{settings.tagline}</SheetDescription>
                </SheetHeader>
                <nav aria-label="Mobile navigation" className="flex flex-col gap-1 px-4 pb-6">
                  {NAV_LINKS.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={isActive(pathname, link.href) ? 'page' : undefined}
                        className={`flex h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors hover:bg-secondary hover:text-primary ${
                          isActive(pathname, link.href) ? 'bg-secondary text-primary' : 'text-foreground'
                        }`}
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <Separator className="my-3" />
                  {settings.admissionOpen && (
                    <Button asChild className="h-11 sp-gold-gradient font-semibold text-primary hover:opacity-90">
                      <SheetClose asChild>
                        <Link href="/admissions">Apply for Admission</Link>
                      </SheetClose>
                    </Button>
                  )}
                  <Button asChild variant="outline" className="h-11 gap-2">
                    <SheetClose asChild>
                      <Link href="/login">
                        <Lock className="h-4 w-4" aria-hidden="true" />
                        Parent Login
                      </Link>
                    </SheetClose>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
