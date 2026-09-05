'use client'

import { motion } from 'framer-motion'
import { Compass, FileText, Users, GraduationCap, Calendar, Phone, CheckCircle2 } from 'lucide-react'
import { ADMISSION_TIMELINE, SCHOOL, GRADE_OPTIONS } from '@/lib/school-data'
import { PageHero } from '@/components/public/page-hero'
import Link from 'next/link'
import { Button } from '@/components/ui/button'


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

const REQUIREMENTS = [
  'Completed application form',
  'Birth certificate (original + photocopy)',
  'Passport-size photographs (4 copies)',
  'Previous school transfer certificate (if applicable)',
  'Previous report card / mark sheet (if applicable)',
  'Aadhaar card of student and parents',
  'Address proof',
  'Immunization / vaccination record',
]

export default function AdmissionsPage() {
  return (
    <div>
      <PageHero
        eyebrow="Admissions 2026-27"
        icon={<Calendar className="w-4 h-4 text-accent" />}
        title="Begin Your Child's Journey"
        subtitle="Admissions are now open for the academic year 2026-27. Follow our simple admission process and give your child the gift of excellence in education."
      />

      <div className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
        {/* Timeline */}
        <div className="max-w-5xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">Admission Timeline 2026-27</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Indicative milestones — specific dates are announced on the Notices board.
            </p>
          </motion.div>

          <div className="relative">
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
                    className={`relative flex items-center gap-6 ${isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                  >
                    <div className="absolute left-4 lg:left-1/2 lg:-translate-x-1/2 z-10">
                      <div className={`w-8 h-8 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br ${COLOR_MAP[item.color]} flex items-center justify-center shadow-lg ring-4 ring-background`}>
                        <Icon className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
                      </div>
                    </div>

                    <div className={`flex-1 ml-16 lg:ml-0 ${isLeft ? 'lg:pr-16 lg:text-right' : 'lg:pl-16'}`}>
                      <div className="bg-white rounded-2xl p-5 lg:p-6 border border-border shadow-sm hover:shadow-lg transition-shadow">
                        <div className={`text-sm font-semibold text-primary mb-1`}>{item.period}</div>
                        <h3 className="text-lg font-bold text-foreground mb-2">{item.phase}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                      </div>
                    </div>

                    <div className="hidden lg:block flex-1" />
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Requirements + CTA */}
        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-8 border border-border shadow-sm"
          >
            <h3 className="text-xl font-bold text-foreground mb-4">Documents Required</h3>
            <ul className="space-y-2">
              {REQUIREMENTS.map((req) => (
                <li key={req} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl p-8 flex flex-col justify-center"
          >
            <h3 className="text-xl font-bold mb-4">Ready to Apply?</h3>
            <p className="text-primary-foreground/80 mb-6">
              Contact our admissions team to schedule a campus visit or submit an enquiry. We&apos;re here
              to help you through every step of the process.
            </p>
            <div className="space-y-3">
              {SCHOOL.phones.map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone}`}
                  className="flex items-center gap-2 text-primary-foreground hover:text-accent transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span className="font-medium">{phone}</span>
                </a>
              ))}
            </div>
            <Link href="/contact" className="mt-6">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 w-full">
                Contact Admissions
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
    </div>
  )
}
