'use client'

import { motion } from 'framer-motion'
import { SCHOOL } from '@/lib/school-data'

type Props = {
  eyebrow: string
  icon?: React.ReactNode
  title: string
  subtitle: string
}

export function PageHero({ eyebrow, icon, title, subtitle }: Props) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0a3d2e] via-[#0e4a36] to-[#06301f] text-white pt-14 pb-16 lg:pt-20 lg:pb-24">
      {/* Heritage strip */}
      <div className="absolute inset-x-0 top-0 h-1 heritage-strip" />

      {/* Decorative glow + wheel */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 right-16 w-56 h-56 rounded-full bg-accent blur-3xl" />
        <div className="absolute bottom-0 left-10 w-64 h-64 rounded-full bg-primary blur-3xl" />
      </div>
      <svg
        viewBox="0 0 200 200"
        className="absolute -right-10 -bottom-16 w-72 h-72 opacity-15 konark-wheel pointer-events-none"
        aria-hidden="true"
      >
        <g stroke="rgba(246,211,101,0.9)" strokeWidth="2.5" fill="none">
          <circle cx="100" cy="100" r="30" />
          <circle cx="100" cy="100" r="82" />
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i * 360) / 16
            const rad = (a * Math.PI) / 180
            return (
              <line
                key={i}
                x1={100 + Math.cos(rad) * 34}
                y1={100 + Math.sin(rad) * 34}
                x2={100 + Math.cos(rad) * 76}
                y2={100 + Math.sin(rad) * 76}
              />
            )
          })}
        </g>
      </svg>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 text-white text-xs sm:text-sm font-medium mb-4 px-4 py-1.5 backdrop-blur-sm">
            {icon}
            {eyebrow}
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">{title}</h1>
          <p className="text-white/85 text-base lg:text-lg max-w-3xl mx-auto leading-relaxed">
            {subtitle}
          </p>
          <div className="mt-5 text-xs sm:text-sm text-white/60">
            {SCHOOL.legacyLine} · {SCHOOL.heritageLine}
          </div>
        </motion.div>
      </div>
    </section>
  )
}