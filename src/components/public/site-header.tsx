'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SCHOOL } from '@/lib/school-data'
import { useAppStore } from '@/lib/app-store'
import Image from 'next/image'

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Academics', href: '/academics' },
  { label: 'NEET/JEE Preparation', href: '/neet-jee' },
  { label: 'Facilities', href: '/facilities' },
  { label: 'Admissions', href: '/admissions' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact', href: '/contact' },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { setShowEnquiry } = useAppStore()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Heritage decorative strip */}
      <div className="heritage-strip" />

      {/* Top bar — desktop */}
      <div className="bg-primary text-primary-foreground text-xs sm:text-sm py-2 hidden md:block">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3 h-3" />
              {SCHOOL.phones.join(' · ')}
            </span>
            <span className="text-primary-foreground/70">|</span>
            <span>CBSE School · {SCHOOL.legacyLine}</span>
          </div>
          <div className="flex items-center gap-3 text-primary-foreground/80">
            <span>{SCHOOL.heritageLine}</span>
          </div>
        </div>
      </div>

      {/* Top bar — mobile (compact, just phone) */}
      <div className="bg-primary text-primary-foreground text-xs py-1.5 md:hidden">
        <div className="container mx-auto px-4 flex items-center justify-center gap-1.5">
          <Phone className="w-3 h-3" />
          <a href={`tel:${SCHOOL.phones[0]}`} className="font-medium">{SCHOOL.phones[0]}</a>
          <span className="text-primary-foreground/50">·</span>
          <span>Admissions Open 2026-27</span>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg'
            : 'bg-white/80 backdrop-blur-sm'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden ring-2 ring-primary/20 ring-offset-2 group-hover:ring-accent transition-all">
                <Image
                  src={SCHOOL.logo}
                  alt="SP International School Logo"
                  fill
                  sizes="48px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="text-left min-w-0">
                <div className="font-bold text-sm lg:text-lg text-primary leading-tight whitespace-nowrap">
                  SP International School
                </div>
                <div className="text-[10px] lg:text-xs text-muted-foreground font-medium leading-tight hidden sm:block">
                  Bhubaneswar · Est. 2021 · CBSE
                </div>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname === item.href
                      ? 'text-primary bg-primary/5'
                      : 'text-foreground/80 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowEnquiry(true)}
                size="sm"
                className="hidden sm:flex bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Enquire Now
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-border bg-white overflow-hidden"
            >
              <div className="container mx-auto px-4 py-3 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block w-full text-left px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                      pathname === item.href
                        ? 'text-primary bg-primary/5'
                        : 'text-foreground/80 hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-2 border-t border-border flex flex-col gap-2">
                  <Button
                    onClick={() => {
                      setMobileOpen(false)
                      setShowEnquiry(true)
                    }}
                    size="sm"
                    className="w-full justify-center bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    Enquire Now
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}
