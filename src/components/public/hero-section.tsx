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
          className="absolute top-10 left-5 w-48 h-48 sm:w-72 sm:h-72 rounded-full bg-accent/10 blur-3xl"
          animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-10 right-5 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-primary/15 blur-3xl"
          animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-amber-400/5 blur-3xl"
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

      <div className="container mx-auto px-4 sm:px-6 relative z-10 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full glass-card text-white/90 text-xs sm:text-sm font-medium mb-6 sm:mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
            Admissions Open for 2026-27
          </motion.div>

          {/* School Name — single line, 3D animated, responsive */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="school-name-3d mb-4 sm:mb-6"
          >
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-tight tracking-tight whitespace-nowrap">
              <span className="inline-block text-white text-shadow-3d">
                SP International School
              </span>
            </h1>
          </motion.div>

          {/* Single Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-base sm:text-xl lg:text-2xl text-accent font-semibold italic mb-6 sm:mb-8 px-2"
          >
            Dedicated to Excellence, Where Excellence is Habit
          </motion.p>

          {/* Info badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-8 sm:mb-10 text-white/70 text-xs sm:text-sm"
          >
            <span className="flex items-center gap-1 sm:gap-1.5">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
              Bhubaneswar, Odisha
            </span>
            <span className="flex items-center gap-1 sm:gap-1.5">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
              CBSE Curriculum
            </span>
            <span className="flex items-center gap-1 sm:gap-1.5">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
              Pre-Primary to Class 12
            </span>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 sm:mb-12"
          >
            <Button
              onClick={() => setShowEnquiry(true)}
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold pulse-glow w-full sm:w-auto"
            >
              Apply for Admission
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Link href="/admissions" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="glass-card-light border-white/30 text-foreground hover:bg-white/90 px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold w-full sm:w-auto"
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
            className="grid grid-cols-4 gap-1 sm:gap-2 max-w-xl sm:max-w-2xl mx-auto pt-6 sm:pt-8 border-t border-white/10"
          >
            {[
              { value: '2', label: 'Acre Campus' },
              { value: '6', label: 'Labs' },
              { value: '24', label: 'Classrooms' },
              { value: '13400+', label: 'Books' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-lg sm:text-2xl lg:text-4xl font-bold text-accent">{stat.value}</div>
                <div className="text-[10px] sm:text-xs text-white/60">{stat.label}</div>
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
