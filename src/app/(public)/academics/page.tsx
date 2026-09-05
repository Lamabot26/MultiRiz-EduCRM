'use client'

import { motion } from 'framer-motion'
import {
  Baby,
  PencilRuler,
  Compass,
  GraduationCap,
  BookOpen,
  FlaskConical,
  Trophy,
  Palette,
  Music,
  Dumbbell,
  Languages,
  Mountain,
} from 'lucide-react'
import { PROGRAMMES, MORAL_VALUE_THEMES } from '@/lib/school-data'
import { PageHero } from '@/components/public/page-hero'

const ICON_MAP: Record<string, React.ElementType> = {
  baby: Baby,
  pencil: PencilRuler,
  compass: Compass,
  graduation: GraduationCap,
}

const SUBJECTS = [
  { icon: Languages, name: 'Languages', desc: 'English, Hindi, Odia' },
  { icon: FlaskConical, name: 'Sciences', desc: 'Physics, Chemistry, Biology' },
  { icon: Compass, name: 'Mathematics', desc: 'Algebra, Geometry, Calculus' },
  { icon: Palette, name: 'Arts', desc: 'Music, Dance, Visual Arts' },
  { icon: Trophy, name: 'Physical Education', desc: 'Sports & Athletics' },
  { icon: BookOpen, name: 'Social Sciences', desc: 'History, Geography, Civics' },
]

const ACTIVITIES = [
  { icon: Music, title: 'Music & Dance', desc: 'Odissi, folk, and contemporary dance with vocal & instrumental music.' },
  { icon: Palette, title: 'Art & Craft', desc: 'Pattachitra-inspired arts, painting, and creative crafts.' },
  { icon: Dumbbell, title: 'Sports & Fitness', desc: 'Cricket, football, basketball, athletics, yoga, and more.' },
  { icon: BookOpen, title: 'Clubs & Societies', desc: 'Debate, quiz, literary, science, and eco clubs.' },
  { icon: Mountain, title: 'Character & Values', desc: 'Moral education woven into daily school life.' },
]

export default function AcademicsPage() {
  return (
    <div>
      <PageHero
        eyebrow="Academics"
        icon={<GraduationCap className="w-4 h-4 text-accent" />}
        title="A Learning Journey for Every Stage"
        subtitle="From joyful early years to rigorous board preparation, our four-stage academic framework nurtures confident, curious, and capable learners — with academics, sports and arts in balance."
      />

      <div className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
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

          {/* Co-curricular & values */}
          <div className="grid lg:grid-cols-2 gap-8 mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl p-8 lg:p-10"
            >
              <h2 className="text-2xl lg:text-3xl font-bold mb-6">Beyond Academics</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {ACTIVITIES.map((a) => (
                  <div key={a.title} className="rounded-xl bg-white/10 backdrop-blur-sm p-4">
                    <a.icon className="w-6 h-6 text-accent mb-2" />
                    <div className="font-semibold text-sm mb-1">{a.title}</div>
                    <div className="text-xs text-primary-foreground/80 leading-relaxed">{a.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-2xl p-8 lg:p-10 border border-border shadow-sm"
            >
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">Values We Live By</h2>
              <p className="text-muted-foreground mb-6">
                Academic success means little without character. Moral education and life skills are woven
                into everyday school life.
              </p>
              <div className="flex flex-wrap gap-2">
                {MORAL_VALUE_THEMES.map((v) => (
                  <span
                    key={v}
                    className="px-4 py-2 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Teaching approach */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-[#0a3d2e] to-[#06301f] text-primary-foreground rounded-2xl p-8 lg:p-12"
          >
            <h2 className="text-2xl lg:text-3xl font-bold mb-4 text-white">Our Teaching Approach</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-bold mb-2 text-accent">Activity-Based Learning</h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  Hands-on activities, projects, and experiential learning that make concepts come alive
                  and stick with students for life.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2 text-accent">Technology-Enabled</h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  Smart classrooms with interactive panels, digital content, and blended learning tools
                  that enhance the traditional teaching experience.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2 text-accent">Individual Attention</h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  Low student-teacher ratio ensures every child gets the personal attention they need
                  to thrive academically and personally.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}