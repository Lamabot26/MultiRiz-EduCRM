'use client'

import { motion } from 'framer-motion'
import { Trees, FlaskConical, BookOpen, School, Trophy, Theater, GraduationCap } from 'lucide-react'
import { CAMPUS_STATS } from '@/lib/school-data'

const ICON_MAP: Record<string, React.ElementType> = {
  trees: Trees,
  flask: FlaskConical,
  book: BookOpen,
  school: School,
  trophy: Trophy,
  theater: Theater,
}

export function StatsSection() {
  return (
    <section className="py-16 lg:py-20 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <GraduationCap className="w-4 h-4" />
            Our Campus at a Glance
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
            Infrastructure That Inspires Learning
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Spread across a sprawling 2-acre campus, SP International School offers world-class facilities
            designed to nurture every aspect of a child&apos;s growth — academic, physical, and creative.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
          {CAMPUS_STATS.map((stat, i) => {
            const Icon = ICON_MAP[stat.icon] || School
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -8 }}
                className="group relative bg-gradient-to-br from-white to-muted/30 rounded-2xl p-6 text-center border border-border shadow-sm hover:shadow-xl transition-shadow"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-3 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 transition-all">
                  <Icon className="w-7 h-7" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
