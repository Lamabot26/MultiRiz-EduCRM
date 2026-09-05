'use client'

import { motion } from 'framer-motion'
import { Landmark, SunMedium, Palmtree, Sparkles } from 'lucide-react'
import { HERITAGE_HIGHLIGHTS } from '@/lib/school-data'

const ICON_MAP: Record<string, React.ElementType> = {
  temple: Landmark,
  wheel: SunMedium,
  culture: Palmtree,
}

export function HeritageSection() {
  return (
    <section
      id="heritage"
      className="py-16 lg:py-24 relative overflow-hidden bg-gradient-to-br from-[#0a3d2e] via-[#0e4a36] to-[#06301f] text-white"
    >
      {/* Decorative glow */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-accent blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 rounded-full bg-primary blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium mb-4 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-accent" />
            Rooted in Odisha's Heritage
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-3">
            In the Heart of the Temple City
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto">
            Bhubaneswar has been a cradle of learning, art and devotion for a thousand years. We bring
            that timeless spirit into modern classrooms — nurturing young minds with pride in their roots
            and ambition for the future.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {HERITAGE_HIGHLIGHTS.map((item, i) => {
            const Icon = ICON_MAP[item.icon] || Landmark
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="group rounded-2xl bg-white/5 backdrop-blur-sm border border-white/15 p-6 hover:bg-white/10 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/20 text-accent mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/75 leading-relaxed">{item.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}