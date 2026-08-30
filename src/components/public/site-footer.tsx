'use client'

import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, Shield } from 'lucide-react'
import { SCHOOL, CAMPUSES } from '@/lib/school-data'
import Image from 'next/image'
import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* School info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-accent/30">
                <Image
                  src={SCHOOL.logo}
                  alt="SP International School Logo"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <div>
                <div className="font-bold text-sm">SP International School</div>
                <div className="text-xs text-background/60">Bhubaneswar, Odisha</div>
              </div>
            </div>
            <p className="text-sm text-background/70 leading-relaxed mb-4">
              {SCHOOL.tagline1}. {SCHOOL.tagline2}. A premier CBSE school committed to nurturing
              excellence through holistic education, modern infrastructure, and values-based learning.
            </p>
            <div className="flex gap-2">
              {[Facebook, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full bg-background/10 hover:bg-accent flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-background/90">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'Academics', href: '/academics' },
                { label: 'Facilities', href: '/facilities' },
                { label: 'Admissions', href: '/admissions' },
                { label: 'Gallery', href: '/gallery' },
                { label: 'Contact Us', href: '/contact' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-background/70 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Admissions */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-background/90">
              Admissions
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/admissions" className="text-background/70 hover:text-accent transition-colors">
                  Admission Process 2026-27
                </Link>
              </li>
              <li className="text-background/70">
                <span className="block text-xs text-background/50 mb-1">Admission Helpline</span>
                {SCHOOL.phones.map((phone) => (
                  <a
                    key={phone}
                    href={`tel:${phone}`}
                    className="block hover:text-accent transition-colors"
                  >
                    {phone}
                  </a>
                ))}
              </li>
              <li>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-background/70 hover:text-accent transition-colors mt-2"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-background/90">
              Our Campuses
            </h3>
            <div className="space-y-3 text-sm">
              {CAMPUSES.map((campus) => (
                <div key={campus.name}>
                  <div className="font-medium text-background/90 mb-1">{campus.name}</div>
                  <div className="flex items-start gap-1.5 text-background/70 text-xs leading-relaxed">
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{campus.address}</span>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <a
                  href={`mailto:${SCHOOL.email}`}
                  className="flex items-center gap-1.5 text-background/70 hover:text-accent transition-colors text-xs"
                >
                  <Mail className="w-3 h-3" />
                  {SCHOOL.email}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-background/60 text-center sm:text-left">
            © {new Date().getFullYear()} SP International School, Bhubaneswar. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-xs text-background/60">
            <span>CBSE School</span>
            <span>·</span>
            <span>Admissions Open 2026-27</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
