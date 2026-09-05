'use client'

import { motion } from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  MapPin,
  Award,
  GraduationCap,
  PlayCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SCHOOL, LEGACY_STATS } from '@/lib/school-data'
import { useAppStore } from '@/lib/app-store'
import Image from 'next/image'

/** Animated Konark sun-wheel drawn as inline SVG — a nod to Odisha's heritage. */
function KonarkWheel({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={`konark-wheel ${className ?? ''}`} aria-hidden="true">
      <g stroke="rgba(246,211,101,0.9)" strokeWidth="3" fill="none">
        <circle cx="100" cy="100" r="30" />
        <circle cx="100" cy="100" r="78" />
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i * 360) / 16
          const rad = (a * Math.PI) / 180
          const x1 = 100 + Math.cos(rad) * 34
          const y1 = 100 + Math.sin(rad) * 34
          const x2 = 100 + Math.cos(rad) * 72
          const y2 = 100 + Math.sin(rad) * 72
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        })}
      </g>
    </svg>
  )
}

export function HeroSection() {
  const { setShowEnquiry, setShowTour } = useAppStore()

  return (
    <section id="home" className="relative min-h-[100svh] flex items-center overflow-hidden">
      {/* Background campus collage */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&h=1200&fit=crop"
          alt="SP International School campus"
          fill
          priority
          sizes="100vw"
          className="object-cover hero-zoom"
        />
        {/* Rich emerald-tinted overlay with a warm heritage glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#06301f]/95 via-[#0a3d2e]/90 to-[#06301f]/85" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(180,140,40,0.28),transparent_45%)]" />
      </div>

      {/* Heritage decorative top strip */}
      <div className="absolute inset-x-0 top-0 h-1 heritage-strip z-10" />

      {/* Glowing Konark wheel — top right */}
      <div className="absolute top-6 right-6 sm:top-10 sm:right-14 w-24 h-24 sm:w-40 sm:h-40 opacity-40 pointer-events-none drift-anim-slow">
        <KonarkWheel className="w-full h-full" />
      </div>
      {/* Secondary wheel — lower left behind content */}
      <div className="absolute -left-8 bottom-16 w-40 h-40 sm:w-52 sm:h-52 opacity-20 pointer-events-none drift-anim-slow">
        <KonarkWheel className="w-full h-full" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 py-20 sm:py-24">
        <div className="grid lg:grid-cols-2 lg:gap-10 items-center">
          {/* ---------- Left: messaging ---------- */}
          <div className="max-w-2xl">
            {/* Legacy badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full glass-card text-white/95 text-xs sm:text-sm font-medium mb-6 px-4 py-1.5"
            >
              <Sparkles className="w-4 h-4 text-accent" />
              {SCHOOL.legacyLine} · Admissions Open 2026-27
            </motion.div>

            {/* School name */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl xs:text-5xl sm:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight text-white mb-4"
            >
              <span className="text-gold-3d">SP International </span><span className="text-white">School</span>
            </motion.h1>

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative inline-block mb-5"
            >
              <span className="italic text-accent font-semibold text-lg sm:text-2xl">
                {SCHOOL.tagline}
              </span>
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent/60 underline-grow" />
            </motion.div>

            {/* Intro copy */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-white/85 text-sm sm:text-base leading-relaxed mb-7 max-w-xl"
            >
              A premier CBSE school in the heart of {SCHOOL.city} — nurturing young minds since{" "}
              {SCHOOL.establishedYear} with a perfect balance of academics, sports, arts and
              enduring Odia values. From Pre-Nursery to Class 12.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center gap-3 mb-8 text-white/85 text-xs sm:text-sm"
            >
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-accent" /> Bhubaneswar, Odisha
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Award className="w-4 h-4 text-accent" /> CBSE Curriculum
              </span>
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-accent" /> Pre-Primary to Class 12
              </span>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8"
            >
              <Button
                onClick={() => setShowEnquiry(true)}
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 px-7 py-5 text-base font-semibold pulse-glow"
              >
                Apply for Admission <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => setShowTour(true)}
                size="lg"
                variant="outline"
                className="glass-card-light border-white/40 text-foreground hover:bg-white px-7 py-5 text-base font-semibold"
              >
                <PlayCircle className="w-5 h-5 mr-2 text-primary" /> Virtual Campus Tour
              </Button>
            </motion.div>

            {/* Legacy quick stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              className="grid grid-cols-4 gap-2 max-w-md"
            >
              {LEGACY_STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl glass-card text-center py-3 px-1"
                >
                  <div className="text-lg sm:text-2xl font-bold text-accent">{s.value}</div>
                  <div className="text-[9px] sm:text-[11px] text-white/70 leading-tight">
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ---------- Right: board results ---------- */}
          <div className="relative mt-10 lg:mt-0 w-full">
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.4 }}
              className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20"
            >
              <div className="relative h-[340px] sm:h-[420px] lg:h-[500px]">
                <Image
                  src="/result.jpeg"
                  alt="SP International School board results"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06301f]/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 text-white">
                  <div className="font-bold text-lg sm:text-2xl leading-tight">100% Board Results</div>
                  <div className="text-xs sm:text-sm text-accent font-medium">CBSE 12th Exam.</div>
                </div>
              </div>
            </motion.div>

            {/* Floating chip — Konark heritage */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="absolute -right-3 -bottom-5 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/95 shadow-xl p-3 flex items-center justify-center drift-anim-slow"
            >
              <KonarkWheel className="w-full h-full" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 80" className="w-full h-auto" preserveAspectRatio="none">
          <path
            d="M0,40 C320,80 640,0 960,40 C1280,80 1440,20 1440,40 L1440,80 L0,80 Z"
            fill="rgba(255,255,255,1)"
          />
        </svg>
      </div>
    </section>
  )
}