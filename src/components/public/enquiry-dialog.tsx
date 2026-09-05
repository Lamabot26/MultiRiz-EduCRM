'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { GRADE_OPTIONS, CAMPUS_OPTIONS, SCHOOL } from '@/lib/school-data'
import { useAppStore } from '@/lib/app-store'
import { toast } from 'sonner'

export function EnquiryDialog() {
  const { showEnquiry, setShowEnquiry } = useAppStore()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    studentName: '',
    parentName: '',
    phone: '',
    altPhone: '',
    email: '',
    gradeApplied: 'Nursery',
    campus: 'City Campus',
    address: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.studentName || !form.parentName || !form.phone) {
      toast.error('Please fill in all required fields')
      return
    }

    const subject = encodeURIComponent(
      `Admission Enquiry — ${form.studentName} (${form.gradeApplied})`
    )
    const body = encodeURIComponent(
      `Admission Enquiry\n\n` +
      `Student Name: ${form.studentName}\n` +
      `Parent / Guardian: ${form.parentName}\n` +
      `Phone: ${form.phone}\n` +
      `Alternate Phone: ${form.altPhone || '—'}\n` +
      `Email: ${form.email || '—'}\n` +
      `Grade Applied For: ${form.gradeApplied}\n` +
      `Preferred Campus: ${form.campus}\n` +
      `Address: ${form.address || '—'}\n\n` +
      `Message:\n${form.message || '—'}`
    )

    setSubmitting(true)
    try {
      window.location.href = `mailto:${SCHOOL.email}?subject=${subject}&body=${body}`
      setSuccess(true)
      toast.success('Enquiry form ready! Your email client will open to send it.')
      setForm({
        studentName: '',
        parentName: '',
        phone: '',
        altPhone: '',
        email: '',
        gradeApplied: 'Nursery',
        campus: 'City Campus',
        address: '',
        message: '',
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to open email client')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setShowEnquiry(false)
    setTimeout(() => setSuccess(false), 300)
  }

  return (
    <AnimatePresence>
      {showEnquiry && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden"
          >
            {success ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Enquiry Submitted!</h3>
                <p className="text-muted-foreground mb-6">
                  Thank you for your interest in SP International School. Our admissions team will
                  contact you within 24 hours.
                </p>
                <Button onClick={handleClose} className="bg-primary text-primary-foreground">
                  Close
                </Button>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Admission Enquiry</h3>
                    <p className="text-sm text-primary-foreground/80">
                      Fill in the form and we&apos;ll get back to you within 24 hours
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scroll">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="studentName" className="text-sm font-medium">
                        Student Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="studentName"
                        value={form.studentName}
                        onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                        placeholder="Child's full name"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="parentName" className="text-sm font-medium">
                        Parent / Guardian Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="parentName"
                        value={form.parentName}
                        onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                        placeholder="Parent's name"
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="10-digit mobile number"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="altPhone" className="text-sm font-medium">
                        Alternate Phone
                      </Label>
                      <Input
                        id="altPhone"
                        type="tel"
                        value={form.altPhone}
                        onChange={(e) => setForm({ ...form, altPhone: e.target.value })}
                        placeholder="Optional"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="parent@email.com"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gradeApplied" className="text-sm font-medium">
                        Grade Applying For
                      </Label>
                      <select
                        id="gradeApplied"
                        value={form.gradeApplied}
                        onChange={(e) => setForm({ ...form, gradeApplied: e.target.value })}
                        className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {GRADE_OPTIONS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="campus" className="text-sm font-medium">
                        Preferred Campus
                      </Label>
                      <select
                        id="campus"
                        value={form.campus}
                        onChange={(e) => setForm({ ...form, campus: e.target.value })}
                        className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {CAMPUS_OPTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-sm font-medium">
                      Address
                    </Label>
                    <Input
                      id="address"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Your locality / area"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-sm font-medium">
                      Message / Questions
                    </Label>
                    <Textarea
                      id="message"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Any specific questions or information you'd like to share..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-primary text-primary-foreground"
                    >
                      {submitting ? (
                        'Submitting...'
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-1.5" />
                          Submit Enquiry
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
