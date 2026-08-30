'use client'

import { motion } from 'framer-motion'
import { FlaskConical, BookOpen, Trophy, Theater, Bus, Stethoscope, Cpu, Palette, Building2 } from 'lucide-react'
import { CAMPUS_STATS } from '@/lib/school-data'


const FACILITIES = [
  { icon: Building2, title: '2-Acre Green Campus', description: 'A spacious, well-maintained campus with lush greenery and modern infrastructure designed for holistic development.' },
  { icon: FlaskConical, title: '6 Science & Computer Labs', description: 'Fully-equipped Physics, Chemistry, Biology, Computer, Robotics, and Language labs for hands-on learning.' },
  { icon: BookOpen, title: 'Library with 13,400+ Books', description: 'A vast collection of books, journals, and digital resources for curious minds across all age groups.' },
  { icon: Trophy, title: '2 Sports Complexes', description: 'Dedicated facilities for athletics, cricket, football, basketball, and indoor games.' },
  { icon: Theater, title: 'Open Air Theater', description: 'A spacious amphitheater for assemblies, performances, and cultural events.' },
  { icon: Cpu, title: '24 Smart Classrooms', description: 'Technology-enabled classrooms with interactive panels and digital content.' },
  { icon: Bus, title: 'Safe Transport', description: 'GPS-enabled bus fleet covering all major routes across Bhubaneswar.' },
  { icon: Stethoscope, title: 'Medical Room', description: 'On-campus medical room with trained staff for student health and safety.' },
  { icon: Palette, title: 'Arts & Music Studio', description: 'Dedicated spaces for visual arts, music, dance, and creative expression.' },
]

export default function FacilitiesPage() {
  return (
    <div className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium mb-4">
            <Building2 className="w-4 h-4" />
            Facilities
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            World-Class Infrastructure
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Every facility at SP International School is thoughtfully designed to support holistic
            development — from academics to athletics, from creativity to character building.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
          {CAMPUS_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-gradient-to-br from-white to-muted/30 rounded-2xl p-6 text-center border border-border shadow-sm"
            >
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Facilities grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FACILITIES.map((facility, i) => (
            <motion.div
              key={facility.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ y: -5 }}
              className="group flex gap-4 p-6 bg-white rounded-2xl border border-border shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="flex-shrink-0">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <facility.icon className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1.5">{facility.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{facility.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
