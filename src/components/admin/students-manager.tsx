'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Edit2, Users, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface Student {
  id: string
  admissionNo: string
  firstName: string
  lastName: string
  dateOfBirth: string | null
  gender: string | null
  phone: string | null
  email: string | null
  address: string | null
  parentName: string
  parentPhone: string
  parentEmail: string | null
  classId: string | null
  campus: string
  status: string
  createdAt: string
  classRoom?: { name: string; grade: string } | null
}

interface ClassRoom {
  id: string
  name: string
  grade: string
}

export function StudentsManager() {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<ClassRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/students?${params}`)
      if (res.ok) {
        const data = await res.json()
        setStudents(data.students)
      }
    } catch {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes')
      if (res.ok) {
        const data = await res.json()
        setClasses(data.classes)
      }
    } catch {}
  }

  useEffect(() => {
    const debounce = setTimeout(fetchStudents, 300)
    return () => clearTimeout(debounce)
  }, [search])

  useEffect(() => {
    fetchClasses()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this student?')) return
    try {
      await fetch(`/api/students?id=${id}`, { method: 'DELETE' })
      toast.success('Student deleted')
      fetchStudents()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, admission no, parent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="bg-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Student
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : students.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No students found.</p>
        </CardContent></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="p-3 text-left font-medium text-muted-foreground">Admission No</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Parent</th>
                  <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Phone</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Class</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="p-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs text-muted-foreground">{s.admissionNo}</td>
                    <td className="p-3 font-medium text-foreground">{s.firstName} {s.lastName}</td>
                    <td className="p-3 hidden md:table-cell">{s.parentName}</td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">{s.parentPhone}</td>
                    <td className="p-3"><span className="text-xs px-2 py-0.5 rounded bg-muted">{s.classRoom?.name || '—'}</span></td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 flex gap-1">
                      <button onClick={() => { setEditing(s); setShowForm(true) }} className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center">
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="w-7 h-7 rounded hover:bg-red-50 flex items-center justify-center">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AnimatePresence>
        {showForm && (
          <StudentFormDialog
            student={editing}
            classes={classes}
            onClose={() => setShowForm(false)}
            onSuccess={() => { setShowForm(false); fetchStudents() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function StudentFormDialog({ student, classes, onClose, onSuccess }: {
  student: Student | null
  classes: ClassRoom[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    dateOfBirth: student?.dateOfBirth || '',
    gender: student?.gender || '',
    phone: student?.phone || '',
    email: student?.email || '',
    address: student?.address || '',
    parentName: student?.parentName || '',
    parentPhone: student?.parentPhone || '',
    parentEmail: student?.parentEmail || '',
    classId: student?.classId || '',
    campus: student?.campus || 'City Campus',
    status: student?.status || 'ACTIVE',
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName || !form.parentName || !form.parentPhone) {
      toast.error('First name, parent name, and parent phone are required')
      return
    }
    setSaving(true)
    try {
      const method = student ? 'PUT' : 'POST'
      const body = student ? { id: student.id, ...form } : form
      const res = await fetch('/api/students', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed')
      }
      toast.success(student ? 'Student updated' : 'Student created')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-5 flex items-center justify-between">
          <h3 className="text-lg font-bold">{student ? 'Edit Student' : 'Add Student'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scroll">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">First Name *</Label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Last Name</Label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Date of Birth</Label>
              <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Gender</Label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Parent Name *</Label>
              <Input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} required className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Parent Phone *</Label>
              <Input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} required className="mt-1" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Parent Email</Label>
              <Input type="email" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Class</Label>
              <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="">No Class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Address</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-primary text-primary-foreground">
              {saving ? 'Saving...' : student ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
