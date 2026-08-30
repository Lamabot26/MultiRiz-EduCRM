'use client'

import { motion } from 'framer-motion'
import { Baby, PencilRuler, Compass, GraduationCap, BookOpen, FlaskConical, Trophy, Palette } from 'lucide-react'
import { PROGRAMMES } from '@/lib/school-data'


const ICON_MAP: Record<string, React.ElementType> = {
  baby: Baby,
  pencil: PencilRuler,
  compass: Compass,
  graduation: GraduationCap,
}

const SUBJECTS = [
  { icon: BookOpen, name: 'Languages', desc: 'English, Hindi, Odia' },
  { icon: FlaskConical, name: 'Sciences', desc: 'Physics, Chemistry, Biology' },
  { icon: Compass, name: 'Mathematics', desc: 'Algebra, Geometry, Calculus' },
  { icon: Palette, name: 'Arts', desc: 'Music, Dance, Visual Arts' },
  { icon: Trophy, name: 'Physical Education', desc: 'Sports & Athletics' },
  { icon: BookOpen, name: 'Social Sciences', desc: 'History, Geography, Civics' },
]

export default function AcademicsPage() {
  return (
    <div className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <GraduationCap className="w-4 h-4" />
            Academics
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            A Learning Journey for Every Stage
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            From joyful early years to rigorous board preparation, our four-stage academic framework
            is designed to nurture confident, curious, and capable learners.
          </p>
        </motion.div>

        {/* Programmes */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
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
                  <p className="text-sm text-muted-foreground leading-relaxed">{prog.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Subjects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">Subjects We Offer</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A comprehensive curriculum covering all major academic and co-curricular areas.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-20">
          {SUBJECTS.map((subject, i) => (
            <motion.div
              key={subject.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="bg-white rounded-xl p-5 text-center border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-3">
                <subject.icon className="w-6 h-6" />
              </div>
              <div className="font-semibold text-sm text-foreground mb-1">{subject.name}</div>
              <div className="text-xs text-muted-foreground">{subject.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Curriculum approach */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl p-8 lg:p-12"
        >
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">Our Teaching Approach</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-bold mb-2 text-accent">Activity-Based Learning</h3>
              <p className="text-sm text-primary-foreground/80 leading-relaxed">
                Hands-on activities, projects, and experiential learning that make concepts come alive
                and stick with students for life.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-2 text-accent">Technology-Enabled</h3>
              <p className="text-sm text-primary-foreground/80 leading-relaxed">
                Smart classrooms with interactive panels, digital content, and blended learning tools
                that enhance the traditional teaching experience.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-2 text-accent">Individual Attention</h3>
              <p className="text-sm text-primary-foreground/80 leading-relaxed">
                Low student-teacher ratio ensures every child gets the personal attention they need
                to thrive academically and personally.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
