'use client'

import { motion } from 'framer-motion'
import { HeartHandshake, ShieldCheck, Globe, Sparkles } from 'lucide-react'

const VALUES = [
  {
    icon: HeartHandshake,
    title: 'Caring & Qualified Faculty',
    description: 'Mentors who know every child by name — trained regularly in modern pedagogy and child psychology, with generous time for individual attention.',
  },
  {
    icon: ShieldCheck,
    title: 'Safety First Campus',
    description: 'CCTV-monitored campus, verified staff, medical room, and strict visitor protocols, so parents always have complete peace of mind.',
  },
  {
    icon: Sparkles,
    title: 'Smart-Class Learning',
    description: 'Interactive panels, digital content, and a structured curriculum bring abstract concepts alive in every classroom, every single day.',
  },
  {
    icon: Globe,
    title: 'Global Outlook, Indian Roots',
    description: 'An international outlook grounded in Indian culture and values, preparing children to thrive anywhere in the world without losing themselves.',
  },
]

export function AboutSection() {
  return (
    <section id="about" className="py-16 lg:py-24 bg-gradient-to-b from-muted/30 to-white">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium mb-4">
              About Our School
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Where Curiosity Meets Excellence
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              SP International School, Bhubaneswar, is a premier CBSE school committed to providing
              holistic education that balances academic rigour with character development. Our
              sprawling 2-acre campus, led by Principal <strong className="text-foreground">Susanta Kumar Parida</strong>,
              is home to state-of-the-art facilities including 6 well-equipped laboratories, a library
              with over 13,400 books, 24 smart classrooms, 2 sports complexes, and an open-air theater.
            </p>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              We believe every child is unique and deserves an environment that nurtures their individual
              talents. Our experienced faculty, modern infrastructure, and values-based approach ensure
              that students don&apos;t just excel academically but grow into confident, compassionate, and
              responsible global citizens.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Principal', value: 'Susanta Kumar Parida' },
                { label: 'Campus Size', value: '2 Acres' },
                { label: 'Curriculum', value: 'CBSE' },
                { label: 'Grades', value: 'Pre-Nursery to Class 12' },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl p-4 border border-border shadow-sm">
                  <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                  <div className="text-sm font-semibold text-foreground">{item.value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 gap-4"
          >
            {VALUES.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <value.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-foreground mb-2 text-sm lg:text-base">{value.title}</h3>
                <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
