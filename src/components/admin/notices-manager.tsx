'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit2, Bell, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface Notice {
  id: string
  title: string
  content: string
  category: string
  date: string
  isActive: boolean
  createdAt: string
}

const CATEGORIES = ['GENERAL', 'ACADEMIC', 'EVENT', 'ADMISSION', 'FEE', 'URGENT']

export function NoticesManager() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Notice | null>(null)

  const fetchNotices = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notices')
      if (res.ok) {
        const data = await res.json()
        setNotices(data.notices)
      }
    } catch {
      toast.error('Failed to load notices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotices() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notice?')) return
    try {
      await fetch(`/api/notices?id=${id}`, { method: 'DELETE' })
      toast.success('Notice deleted')
      fetchNotices()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const getCategoryColor = (cat: string) => {
    const map: Record<string, string> = {
      URGENT: 'bg-red-100 text-red-700',
      ADMISSION: 'bg-amber-100 text-amber-700',
      EVENT: 'bg-teal-100 text-teal-700',
      FEE: 'bg-orange-100 text-orange-700',
      ACADEMIC: 'bg-blue-100 text-blue-700',
      GENERAL: 'bg-gray-100 text-gray-700',
    }
    return map[cat] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(null); setShowForm(true) }} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Notice
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : notices.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No notices yet.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <Card key={n.id} className="border-border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(n.category)}`}>
                        {n.category}
                      </span>
                      {!n.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>}
                      <span className="text-xs text-muted-foreground">{n.date}</span>
                    </div>
                    <h3 className="font-bold text-foreground mb-1">{n.title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{n.content}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { setEditing(n); setShowForm(true) }} className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center">
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(n.id)} className="w-7 h-7 rounded hover:bg-red-50 flex items-center justify-center">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <NoticeFormDialog
            notice={editing}
            onClose={() => setShowForm(false)}
            onSuccess={() => { setShowForm(false); fetchNotices() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function NoticeFormDialog({ notice, onClose, onSuccess }: {
  notice: Notice | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: notice?.title || '',
    content: notice?.content || '',
    category: notice?.category || 'GENERAL',
    date: notice?.date || new Date().toISOString().split('T')[0],
    isActive: notice?.isActive ?? true,
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.content) {
      toast.error('Title and content are required')
      return
    }
    setSaving(true)
    try {
      const method = notice ? 'PUT' : 'POST'
      const body = notice ? { id: notice.id, ...form } : form
      const res = await fetch('/api/notices', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed')
      }
      toast.success(notice ? 'Notice updated' : 'Notice created')
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-5 flex items-center justify-between">
          <h3 className="text-lg font-bold">{notice ? 'Edit Notice' : 'Add Notice'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <Label className="text-sm font-medium">Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Category</Label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium">Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Content *</Label>
            <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required rows={4} className="mt-1" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
            Active (visible on website)
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-primary text-primary-foreground">
              {saving ? 'Saving...' : notice ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
