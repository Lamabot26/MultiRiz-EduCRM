'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Quote, ChevronLeft, ChevronRight, MessageSquareHeart } from 'lucide-react'
import { TESTIMONIALS } from '@/lib/school-data'

export function TestimonialsSection() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIndex((p) => (p + 1) % TESTIMONIALS.length), 6500)
    return () => clearInterval(t)
  }, [])

  const current = TESTIMONIALS[index]

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-muted/20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium mb-4">
            <MessageSquareHeart className="w-4 h-4" />
            Families Say
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
            Trusted by Parents Across Bhubaneswar
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hear from the families who have made SP International School a part of their children&apos;s
            journey over the past five years.
          </p>
        </motion.div>

        <div className="relative max-w-3xl mx-auto">
          <div className="relative rounded-3xl bg-white border border-border shadow-xl p-8 lg:p-12">
            <Quote className="w-12 h-12 text-primary/15 absolute top-6 left-6" />
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <p className="text-lg lg:text-xl text-foreground/90 italic leading-relaxed mb-6">
                  “{current.quote}”
                </p>
                <div>
                  <div className="font-bold text-foreground">{current.name}</div>
                  <div className="text-sm text-muted-foreground">{current.role}</div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Nav */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setIndex((p) => (p - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground/70 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex gap-2">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    aria-label={`Testimonial ${i + 1}`}
                    className={`h-2.5 rounded-full transition-all ${
                      i === index ? 'w-8 bg-primary' : 'w-2.5 bg-border hover:bg-primary/40'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setIndex((p) => (p + 1) % TESTIMONIALS.length)}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground/70 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}