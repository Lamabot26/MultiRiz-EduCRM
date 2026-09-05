'use client'

import { motion } from 'framer-motion'
import { FlaskConical, BookOpen, Trophy, Palette } from 'lucide-react'
import { DEVELOPMENT_PILLARS } from '@/lib/school-data'

const ICON_MAP: Record<string, React.ElementType> = {
  book: BookOpen,
  palette: Palette,
  trophy: Trophy,
}

export function DevelopmentPillars() {
  return (
    <section id="holistic" className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <FlaskConical className="w-4 h-4" />
            Learning @ SP International
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
            Education Beyond the Classroom
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We believe true education shapes the whole child. Our holistic framework balances smart
            academics, creative arts, and physical well-being so every student grows with confidence
            and character.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEVELOPMENT_PILLARS.map((pillar, i) => {
            const Icon = ICON_MAP[pillar.icon] || BookOpen
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="group relative bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all"
              >
                <div className={`h-2 bg-gradient-to-r ${pillar.color}`} />
                <div className="p-6">
                  <div
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${pillar.color} text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{pillar.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}