'use client'

import { motion } from 'framer-motion'
import { Baby, PencilRuler, Compass, GraduationCap, ArrowRight } from 'lucide-react'
import { PROGRAMMES } from '@/lib/school-data'
import { useAppStore } from '@/lib/app-store'

const ICON_MAP: Record<string, React.ElementType> = {
  baby: Baby,
  pencil: PencilRuler,
  compass: Compass,
  graduation: GraduationCap,
}

export function AcademicsSection() {
  const { setShowEnquiry } = useAppStore()

  return (
    <section id="academics" className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Academics
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
            A Learning Journey for Every Stage
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From joyful early years to rigorous board preparation, our four-stage academic framework
            is designed to nurture confident, curious, and capable learners.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROGRAMMES.map((prog, i) => {
            const Icon = ICON_MAP[prog.icon] || GraduationCap
            return (
              <motion.div
                key={prog.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="group relative bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all"
              >
                <div className={`h-2 bg-gradient-to-r ${prog.color}`} />
                <div className="p-6">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${prog.color} text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">{prog.title}</h3>
                  <div className="text-sm text-accent-foreground font-medium bg-accent/10 inline-block px-2 py-0.5 rounded-md mb-3">
                    {prog.grades}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {prog.description}
                  </p>
                  <button
                    onClick={() => setShowEnquiry(true)}
                    className="text-sm font-medium text-primary hover:text-primary/80 inline-flex items-center gap-1 group/btn"
                  >
                    Enquire about admission
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
