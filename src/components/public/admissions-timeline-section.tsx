'use client'

import { motion } from 'framer-motion'
import { Compass, FileText, Users, GraduationCap, Calendar } from 'lucide-react'
import { ADMISSION_TIMELINE } from '@/lib/school-data'

const ICON_MAP: Record<string, React.ElementType> = {
  compass: Compass,
  'file-text': FileText,
  users: Users,
  'graduation-cap': GraduationCap,
}

const COLOR_MAP: Record<string, string> = {
  emerald: 'from-emerald-500 to-teal-600',
  amber: 'from-amber-500 to-orange-600',
  teal: 'from-teal-500 to-cyan-600',
  gold: 'from-yellow-500 to-amber-600',
}

export function AdmissionsTimelineSection() {
  return (
    <section
      id="admissions"
      className="py-16 lg:py-24 bg-gradient-to-b from-white to-muted/20"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium mb-4">
            <Calendar className="w-4 h-4" />
            Admissions 2026-27
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
            Admission Timeline 2026-27
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Indicative milestones — specific dates are announced on the Notices board. We recommend
            starting early to secure your child&apos;s seat.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative max-w-5xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-4 lg:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-primary lg:-translate-x-1/2" />

          <div className="space-y-8 lg:space-y-12">
            {ADMISSION_TIMELINE.map((item, i) => {
              const Icon = ICON_MAP[item.icon] || Compass
              const isLeft = i % 2 === 0

              return (
                <motion.div
                  key={item.phase}
                  initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`relative flex items-center gap-6 ${
                    isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}
                >
                  {/* Node */}
                  <div className="absolute left-4 lg:left-1/2 lg:-translate-x-1/2 z-10">
                    <div className={`w-8 h-8 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br ${COLOR_MAP[item.color]} flex items-center justify-center shadow-lg ring-4 ring-background`}>
                      <Icon className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
                    </div>
                  </div>

                  {/* Content card */}
                  <div className={`flex-1 ml-16 lg:ml-0 ${isLeft ? 'lg:pr-16 lg:text-right' : 'lg:pl-16'}`}>
                    <div className="bg-white rounded-2xl p-5 lg:p-6 border border-border shadow-sm hover:shadow-lg transition-shadow">
                      <div className={`text-sm font-semibold text-primary mb-1 ${isLeft ? 'lg:text-right' : ''}`}>
                        {item.period}
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2">{item.phase}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                  </div>

                  {/* Spacer for opposite side */}
                  <div className="hidden lg:block flex-1" />
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mt-12"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-white rounded-2xl p-6 border border-border shadow-sm">
            <div className="text-left">
              <div className="text-sm text-muted-foreground">Have questions about admissions?</div>
              <div className="font-semibold text-foreground">Our team is here to help</div>
            </div>
            <div className="flex gap-2">
              {['9040417575', '9556101210', '9337505150'].map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone}`}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  {phone}
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
