'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, MapPin, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SCHOOL } from '@/lib/school-data'
import { useAppStore } from '@/lib/app-store'
import Link from 'next/link'

export function HeroSection() {
  const { setShowEnquiry } = useAppStore()

  return (
    <section
      id="home"
      className="relative min-h-[92vh] flex items-center justify-center overflow-hidden mesh-bg"
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
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-white/90 text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            Admissions Open for 2026-27
          </motion.div>

          {/* School Name — 3D animated, centered */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="school-name-3d mb-6"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.05] tracking-tight">
              <span className="block text-white text-shadow-3d">
                SP International
              </span>
              <span className="block text-gold-3d school-name-3d-text mt-2">
                School
              </span>
            </h1>
          </motion.div>

          {/* Tagline 1 */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-2xl lg:text-3xl text-white font-semibold mb-2"
          >
            {SCHOOL.tagline1}
          </motion.p>

          {/* Tagline 2 */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg lg:text-xl text-accent font-medium italic mb-8"
          >
            {SCHOOL.tagline2}
          </motion.p>

          {/* Info badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-10 text-white/70 text-sm"
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

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-12"
          >
            <Button
              onClick={() => setShowEnquiry(true)}
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-6 text-base font-semibold pulse-glow"
            >
              Apply for Admission
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Link href="/admissions">
              <Button
                size="lg"
                variant="outline"
                className="glass-card-light border-white/30 text-foreground hover:bg-white/90 px-8 py-6 text-base font-semibold"
              >
                Admission Details
              </Button>
            </Link>
          </motion.div>

          {/* Quick stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="grid grid-cols-4 gap-2 max-w-2xl mx-auto pt-8 border-t border-white/10"
          >
            {[
              { value: '2', label: 'Acre Campus' },
              { value: '6', label: 'Labs' },
              { value: '24', label: 'Classrooms' },
              { value: '13400+', label: 'Books' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl lg:text-4xl font-bold text-accent">{stat.value}</div>
                <div className="text-xs text-white/60">{stat.label}</div>
              </div>
            ))}
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
