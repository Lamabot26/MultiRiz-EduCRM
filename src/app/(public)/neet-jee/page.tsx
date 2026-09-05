'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  Stethoscope,
  Cpu,
  Rocket,
  Trophy,
  Brain,
  Target,
  ChartNoAxesColumn,
  Clock,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  BookOpen,
  TextSearch,
  ShieldQuestion,
} from 'lucide-react'
import { PageHero } from '@/components/public/page-hero'
import { Button } from '@/components/ui/button'
import {
  NEET_JEE_OVERVIEW,
  NEET_JEE_COURSES,
  EXAM_DETAILS,
  ASSESSMENT_QUESTIONS,
  CAREER_SUGGESTIONS,
} from '@/lib/school-data'
import { useAppStore } from '@/lib/app-store'

const EXAM_ICON_MAP: Record<string, React.ElementType> = {
  stethoscope: Stethoscope,
  cpu: Cpu,
  rocket: Rocket,
  trophy: Trophy,
}

export default function NeetJeePage() {
  const { setShowEnquiry } = useAppStore()

  return (
    <div>
      <PageHero
        eyebrow="NEET & JEE Preparation"
        icon={<GraduationCap className="w-4 h-4 text-accent" />}
        title="Crack NEET & JEE with Structured Coaching"
        subtitle="A dedicated preparation programme that pairs a strong CBSE board foundation with focused coaching for India's toughest medical and engineering entrance exams — from Pre-Foundation in Classes 8–10 to intensive Class XI–XII batches."
      />

      {/* Overview */}
      <div className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium mb-4">
              <BookOpen className="w-4 h-4" /> Our Approach
            </div>
            <p className="text-foreground/80 text-base lg:text-lg leading-relaxed">
              {NEET_JEE_OVERVIEW}
            </p>
          </motion.div>

          {/* Courses */}
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
              Choose the Course That Fits Your Goal
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three flexible preparation routes — pick the one that matches your class and how you
              want to study.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {NEET_JEE_COURSES.map((course, i) => (
              <motion.div
                key={course.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className={`relative flex flex-col rounded-2xl p-6 sm:p-8 border ${
                  course.discount
                    ? 'bg-gradient-to-b from-white to-accent/5 border-accent/40 shadow-xl'
                    : 'bg-white border-border shadow-sm'
                }`}
              >
                {course.discount && (
                  <div className="absolute -top-3 right-6 rounded-full bg-accent text-accent-foreground text-xs font-bold px-3 py-1 shadow">
                    LIMITED-TIME DISCOUNT
                  </div>
                )}

                <h3 className="text-xl font-bold text-foreground mb-3">{course.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {course.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {course.batches.map((b) => (
                    <span
                      key={b}
                      className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary"
                    >
                      {b}
                    </span>
                  ))}
                </div>

                {course.discount ? (
                  <div className="mt-auto rounded-xl bg-white border border-border p-4 mb-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-sm text-muted-foreground">Full Course Fee</span>
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{course.originalFee.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">Discounted Fee</span>
                      <span className="text-2xl font-bold text-accent-foreground">
                        ₹{course.discountedFee.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-3">{course.feeNote}</div>
                  </div>
                ) : (
                  <div className="mt-auto mb-4 rounded-xl bg-muted/50 p-4">
                    <div className="text-sm text-muted-foreground">{course.feeNote}</div>
                  </div>
                )}

                <Button
                  onClick={() => setShowEnquiry(true)}
                  className="w-full bg-primary text-primary-foreground"
                >
                  Enquire About This Course <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick assessment */}
      <AssessmentSection onEnquire={() => setShowEnquiry(true)} />

      {/* Exam details */}
      <div className="py-16 lg:py-24 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <ShieldQuestion className="w-4 h-4" /> Know Your Exams
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
              Understand NEET, JEE & Other Competitive Exams
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A quick, easy read on the major entrance exams so you can make an informed choice for
              your future.
            </p>
          </div>

          <div className="space-y-6">
            {EXAM_DETAILS.map((exam, i) => {
              const Icon = EXAM_ICON_MAP[exam.icon] || Trophy
              return (
                <motion.div
                  key={exam.acronym}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className={`flex flex-col md:flex-row gap-6 rounded-2xl bg-white border border-border shadow-sm p-6 sm:p-8 ${
                    i % 2 === 1 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  <div className="md:w-72 flex-shrink-0">
                    <div
                      className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${exam.color} text-white mb-3`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="text-2xl font-black text-foreground">{exam.acronym}</div>
                    <div className="text-sm text-muted-foreground font-medium mt-1">
                      {exam.fullName}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground/80 leading-relaxed mb-4">{exam.about}</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="rounded-xl bg-muted/50 p-4">
                        <div className="text-xs font-semibold text-primary mb-1">
                          Exam Pattern
                        </div>
                        <div className="text-sm text-foreground/80 leading-relaxed">
                          {exam.pattern}
                        </div>
                      </div>
                      <div className="rounded-xl bg-muted/50 p-4">
                        <div className="text-xs font-semibold text-primary mb-1">
                          Eligibility
                        </div>
                        <div className="text-sm text-foreground/80 leading-relaxed">
                          {exam.eligibility}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* AI-based preparation */}
      <div className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Brain className="w-4 h-4" /> AI-Powered Prep
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
              Smart Practice with Our AI System
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Adaptive practice tests that focus on your weak areas, with instant feedback — because
              consistent, targeted practice is what cracks NEET and JEE.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Brain, title: 'Adaptive Practice', desc: 'Questions served at the right difficulty for you.' },
              { icon: Target, title: 'Mock Tests', desc: 'Exam-pattern tests that build speed and accuracy.' },
              { icon: ChartNoAxesColumn, title: 'Progress Tracking', desc: 'See your rank and weak topics at a glance.' },
              { icon: Clock, title: 'Daily Practice', desc: 'Short daily sets that keep you streak-consistent.' },
            ].map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border p-6 text-center"
              >
                <feat.icon className="w-8 h-8 mx-auto text-primary mb-3" />
                <div className="font-semibold text-foreground mb-1">{feat.title}</div>
                <div className="text-sm text-muted-foreground">{feat.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AssessmentSection({ onEnquire }: { onEnquire: () => void }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  const question = ASSESSMENT_QUESTIONS[step]
  const isComplete = step >= ASSESSMENT_QUESTIONS.length

  const result = useMemo(() => {
    if (!isComplete) return null
    const keys = new Set<string>()
    answers.forEach((a) => {
      const key = a in CAREER_SUGGESTIONS ? a : 'other'
      keys.add(key)
    })
    const suggestionKeys = Array.from(keys)
    const suggestions = suggestionKeys.flatMap((k) => CAREER_SUGGESTIONS[k] ?? [])
    const primaryStream = answers.includes('NEET')
      ? 'NEET'
      : answers.includes('JEE')
      ? 'JEE'
      : null
    return { suggestions, primaryStream, keys }
  }, [answers, isComplete])

  const handleNext = () => {
    if (!selected) return
    setAnswers([...answers, selected])
    setSelected(null)
    setStep(step + 1)
  }

  const reset = () => {
    setStep(0)
    setAnswers([])
    setSelected(null)
  }

  return (
    <div className="py-16 lg:py-24 bg-gradient-to-br from-[#0a3d2e] via-[#0e4a36] to-[#06301f] text-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium mb-4">
            <TextSearch className="w-4 h-4 text-accent" /> Quick Career Assessment
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-3">
            Which Path Suits You Best?
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto">
            Answer a few quick questions and we&apos;ll suggest the entrance-exam and course route that
            best matches your interests — then simply fill in your details and our counsellors will
            get back to you.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto rounded-2xl bg-white text-foreground shadow-2xl p-6 sm:p-10">
          {!isComplete ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Question {step + 1} of {ASSESSMENT_QUESTIONS.length}
                </div>
                <div className="flex gap-1.5">
                  {ASSESSMENT_QUESTIONS.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i <= step ? 'w-6 bg-accent' : 'w-3 bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <h3 className="text-lg font-bold mb-5">{question.q}</h3>

              <div className="space-y-3">
                {question.options.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setSelected(opt.value)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all text-sm ${
                      selected === opt.value
                        ? 'border-accent bg-accent/10 ring-1 ring-accent'
                        : 'border-border hover:border-accent/50 hover:bg-muted/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                {step > 0 && (
                  <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1 sm:flex-none">
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={!selected}
                  className="flex-1 bg-accent text-accent-foreground"
                >
                  {step === ASSESSMENT_QUESTIONS.length - 1 ? 'See My Suggestion' : 'Next'} 
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-1">Your Suggested Path</h3>
              <p className="text-muted-foreground mb-6">
                Based on your answers, here&apos;s where you might fit best.
              </p>

              {result?.primaryStream && (
                <div className="rounded-xl bg-primary/10 text-primary font-semibold text-lg px-4 py-3 mb-5">
                  Recommended Track: {result.primaryStream === 'NEET' ? 'NEET (Medical)' : 'JEE (Engineering)'}
                </div>
              )}

              <div className="space-y-4 mb-6 text-left">
                {result?.suggestions.map((s, i) => (
                  <div key={i} className="rounded-xl border border-border p-4">
                    <div className="font-semibold text-foreground mb-1">{s.title}</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{s.text}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={onEnquire} className="flex-1 bg-accent text-accent-foreground">
                  Book a Counselling Session <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={reset} className="flex-1 sm:flex-none">
                  <RotateCcw className="w-4 h-4 mr-2" /> Retake Test
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}