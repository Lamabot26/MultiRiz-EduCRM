'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, MapPin, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SCHOOL } from '@/lib/school-data'
import { useAppStore } from '@/lib/app-store'
import Image from 'next/image'

export function HeroSection() {
  const { setShowEnquiry, setShowTour } = useAppStore()

  const scrollTo = (href: string) => {
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section
      id="home"
      className="relative min-h-[90vh] flex items-center overflow-hidden mesh-bg"
    >
      {/* Decorative floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 rounded-full bg-accent/10 blur-3xl"
          animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-primary/15 blur-3xl"
          animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-amber-400/5 blur-3xl"
          animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      <div className="container mx-auto px-4 relative z-10 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-white/90 text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4 text-accent" />
              Admissions Open for 2026-27
            </motion.div>

            {/* 3D School Name */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="school-name-3d mb-2"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
                <span className="block text-white text-shadow-3d">
                  SP International
                </span>
                <span className="block text-gold-3d school-name-3d-text">
                  School
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg lg:text-xl text-white/80 mb-3 font-medium"
            >
              {SCHOOL.tagline}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-8 text-white/70 text-sm"
            >
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-accent" />
                Bhubaneswar, Odisha
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-accent" />
                CBSE Curriculum
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent" />
                Pre-Primary to Class 12
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3"
            >
              <Button
                onClick={() => setShowEnquiry(true)}
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 px-6 py-6 text-base font-semibold pulse-glow"
              >
                Apply for Admission
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => setShowTour(true)}
                size="lg"
                variant="outline"
                className="glass-card-light border-white/30 text-foreground hover:bg-white/90 px-6 py-6 text-base font-semibold"
              >
                Virtual Campus Tour
              </Button>
            </motion.div>

            {/* Quick stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="grid grid-cols-4 gap-2 mt-10 pt-6 border-t border-white/10"
            >
              {[
                { value: '2', label: 'Acre Campus' },
                { value: '6', label: 'Labs' },
                { value: '24', label: 'Classrooms' },
                { value: '13400+', label: 'Books' },
              ].map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <div className="text-2xl lg:text-3xl font-bold text-accent">{stat.value}</div>
                  <div className="text-xs text-white/60">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Logo showcase with 3D effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex items-center justify-center"
          >
            <div className="relative w-72 h-72 lg:w-96 lg:h-96">
              {/* Rotating ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-dashed border-accent/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-8 rounded-full border border-white/20"
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />

              {/* Logo container */}
              <motion.div
                className="absolute inset-12 rounded-full overflow-hidden shadow-2xl ring-4 ring-white/20"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Image
                  src={SCHOOL.logo}
                  alt="SP International School Logo"
                  fill
                  sizes="100%"
                  className="object-cover"
                  priority
                />
              </motion.div>

              {/* Floating badges */}
              <motion.div
                className="absolute -top-2 -right-2 lg:top-0 lg:right-0 glass-card rounded-2xl px-4 py-2 text-white"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="text-xs text-white/70">Principal</div>
                <div className="text-sm font-semibold">{SCHOOL.principal}</div>
              </motion.div>

              <motion.div
                className="absolute -bottom-2 -left-2 lg:bottom-0 lg:left-0 glass-card rounded-2xl px-4 py-2 text-white"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <div className="text-xs text-white/70">CBSE School</div>
                <div className="text-sm font-semibold">Bhubaneswar</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
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
