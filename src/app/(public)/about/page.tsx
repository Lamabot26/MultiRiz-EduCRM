'use client'

import { motion } from 'framer-motion'
import {
  HeartHandshake,
  ShieldCheck,
  Globe,
  Sparkles,
  GraduationCap,
  Target,
  BookOpen,
  Landmark,
  GraduationCap as AlumniCap,
} from 'lucide-react'
import { SCHOOL, LEGACY_STATS, HERITAGE_HIGHLIGHTS, ALUMNI_JOURNEY } from '@/lib/school-data'
import { PageHero } from '@/components/public/page-hero'

const VALUES = [
  { icon: HeartHandshake, title: 'Caring & Qualified Faculty', description: 'Mentors who know every child by name — trained regularly in modern pedagogy and child psychology, with generous time for individual attention.' },
  { icon: ShieldCheck, title: 'Safety First Campus', description: 'CCTV-monitored campus, verified staff, medical room, and strict visitor protocols, so parents always have complete peace of mind.' },
  { icon: Sparkles, title: 'Smart-Class Learning', description: 'Interactive panels, digital content, and a structured curriculum bring abstract concepts alive in every classroom, every single day.' },
  { icon: Globe, title: 'Global Outlook, Indian Roots', description: 'An international outlook grounded in Indian culture and values, preparing children to thrive anywhere in the world without losing themselves.' },
]

const HERITAGE_ICONS: Record<string, React.ElementType> = {
  temple: Landmark,
  wheel: GraduationCap,
  culture: Globe,
}
const ALUMNI_ICONS: Record<string, React.ElementType> = {
  cap: AlumniCap,
  globe: Globe,
  heart: HeartHandshake,
}

export default function AboutPage() {
  return (
    <div>
      {/* Page hero */}
      <PageHero
        eyebrow="About Our School"
        icon={<GraduationCap className="w-4 h-4 text-accent" />}
        title="Where Excellence is Habit"
        subtitle={`${SCHOOL.tagline}. SP International School, Bhubaneswar, is a premier CBSE school committed to providing holistic education that balances academic rigour with character development.`}
      />

      {/* Story + quick facts */}
      <div className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">Our Story & Legacy</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                For over five years, SP International School has grown into a trusted name for families
                across Bhubaneswar and beyond. Spread across a sprawling 2-acre campus, we are home to
                state-of-the-art facilities including 6 well-equipped laboratories, a library with over
                13,400 books, 24 smart classrooms, 2 sports complexes, and an open-air theater.
              </p>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                We believe every child is unique and deserves an environment that nurtures their individual
                talents. Our experienced faculty, modern infrastructure, and values-based approach ensure
                that students don&apos;t just excel academically but grow into confident, compassionate, and
                responsible global citizens. We are dedicated to excellence in every aspect of education.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Campus Size', value: '2 Acres' },
                  { label: 'Curriculum', value: 'CBSE' },
                  { label: 'Grades', value: 'Pre-Nursery to Class 12' },
                  { label: 'Location', value: 'Bhubaneswar, Odisha' },
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
              {LEGACY_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 text-center border border-border shadow-sm"
                >
                  <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Mission / Vision */}
          <div className="grid md:grid-cols-2 gap-6 mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl p-8 border border-border shadow-sm"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                To provide a nurturing learning environment that empowers every child to discover their unique
                potential, develop critical thinking skills, and grow into confident, compassionate, and
                responsible individuals — in academics, character, and extracurricular pursuits.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-2xl p-8 border border-border shadow-sm"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 text-accent-foreground mb-4">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed">
                To be a centre of educational excellence that shapes future leaders through innovative learning,
                strong values, and a global perspective — while remaining deeply rooted in Indian culture and
                traditions. Where excellence becomes a habit, not just an aspiration.
              </p>
            </motion.div>
          </div>

          {/* Core values */}
          <div className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">Our Core Values</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                The principles that guide everything we do at SP International School.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
            </div>
          </div>

          {/* Heritage band */}
          <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#0a3d2e] via-[#0e4a36] to-[#06301f] text-white p-8 lg:p-12 mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <h2 className="text-2xl lg:text-3xl font-bold mb-3">Rooted in the Temple City</h2>
              <p className="text-white/80 max-w-2xl mx-auto text-sm lg:text-base">
                {SCHOOL.heritageLine}. Our identity is shaped by the cultural richness of Odisha — from the
                Konark wheel to the art of pattachitra.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {HERITAGE_HIGHLIGHTS.map((item, i) => {
                const Icon = HERITAGE_ICONS[item.icon] || Landmark
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/15 p-6"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/20 text-accent mb-3">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-white/75 leading-relaxed">{item.description}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Alumni journey */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">Life After SP International</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our students carry the habits of excellence into higher education and beyond — wherever they
                go, they stay connected to their roots.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-3 gap-6">
              {ALUMNI_JOURNEY.map((item, i) => {
                const Icon = ALUMNI_ICONS[item.icon] || AlumniCap
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-lg transition-shadow"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent-foreground mb-4">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}