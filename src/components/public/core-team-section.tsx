'use client'

import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { CORE_TEAM } from '@/lib/school-data'

function initials(name: string) {
  return name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const AVATAR_GRADIENTS = [
  'from-emerald-600 to-teal-700',
  'from-amber-500 to-orange-700',
  'from-rose-500 to-pink-700',
  'from-indigo-500 to-purple-700',
  'from-teal-500 to-emerald-800',
  'from-sky-500 to-indigo-700',
]

export function CoreTeamSection() {
  return (
    <section id="team" className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Users className="w-4 h-4" />
            Our Core Team
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
            Meet the Leaders Behind Our School
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our dedicated leadership team brings decades of experience in education, administration,
            and child development — committed to nurturing every child&apos;s potential.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CORE_TEAM.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -8 }}
              className="group bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all"
            >
              {/* Avatar */}
              <div className="relative h-52 flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                <div
                  className={`w-28 h-28 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} text-white flex items-center justify-center ring-4 ring-white shadow-lg group-hover:scale-110 transition-transform duration-500`}
                >
                  <span className="text-4xl font-bold tracking-wide">
                    {initials(member.name)}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 text-center">
                <h3 className="font-bold text-lg text-foreground mb-1">{member.name}</h3>
                <div className="text-sm text-primary font-medium mb-3">{member.position}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
