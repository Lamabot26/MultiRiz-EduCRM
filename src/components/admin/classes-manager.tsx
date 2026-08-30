'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit2, BookOpen, Loader2, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ClassRoom {
  id: string
  name: string
  grade: string
  section: string
  capacity: number
  teacher: string | null
  roomNumber: string | null
  isActive: boolean
  _count?: { students: number }
}

export function ClassesManager() {
  const [classes, setClasses] = useState<ClassRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ClassRoom | null>(null)

  const fetchClasses = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/classes')
      if (res.ok) {
        const data = await res.json()
        setClasses(data.classes)
      }
    } catch {
      toast.error('Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClasses() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this class?')) return
    try {
      await fetch(`/api/classes?id=${id}`, { method: 'DELETE' })
      toast.success('Class deleted')
      fetchClasses()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(null); setShowForm(true) }} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Class
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <Card key={cls.id} className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(cls); setShowForm(true) }} className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center">
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(cls.id)} className="w-7 h-7 rounded hover:bg-red-50 flex items-center justify-center">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-foreground">{cls.name}</h3>
                <div className="text-sm text-muted-foreground mb-3">Section {cls.section} · Room {cls.roomNumber || '—'}</div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {cls._count?.students || 0} students
                  </span>
                  <span>Capacity: {cls.capacity}</span>
                </div>
                {cls.teacher && <div className="text-xs text-muted-foreground mt-1">Teacher: {cls.teacher}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <ClassFormDialog
            classRoom={editing}
            onClose={() => setShowForm(false)}
            onSuccess={() => { setShowForm(false); fetchClasses() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ClassFormDialog({ classRoom, onClose, onSuccess }: {
  classRoom: ClassRoom | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: classRoom?.name || '',
    grade: classRoom?.grade || '',
    section: classRoom?.section || 'A',
    capacity: classRoom?.capacity || 30,
    teacher: classRoom?.teacher || '',
    roomNumber: classRoom?.roomNumber || '',
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.grade) {
      toast.error('Name and grade are required')
      return
    }
    setSaving(true)
    try {
      const method = classRoom ? 'PUT' : 'POST'
      const body = classRoom ? { id: classRoom.id, ...form } : form
      const res = await fetch('/api/classes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed')
      }
      toast.success(classRoom ? 'Class updated' : 'Class created')
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
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-5 flex items-center justify-between">
          <h3 className="text-lg font-bold">{classRoom ? 'Edit Class' : 'Add Class'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <Label className="text-sm font-medium">Class Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Grade *</Label>
              <Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} required className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Section</Label>
              <Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Capacity</Label>
              <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 30 })} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium">Room Number</Label>
              <Input value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Class Teacher</Label>
            <Input value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} className="mt-1" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-primary text-primary-foreground">
              {saving ? 'Saving...' : classRoom ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
