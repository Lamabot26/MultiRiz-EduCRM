'use client'

import { useEffect, useState } from 'react'
import { UserCog, Loader2, Plus, Trash2, Edit2, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface AdminUser {
  id: string
  username: string
  name: string
  email: string | null
  role: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export function UsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
      }
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed')
      }
      toast.success('User deleted')
      fetchUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(null); setShowForm(true) }} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-1.5" />
          Add User
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Username</th>
                  <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Email</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Role</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Last Login</th>
                  <th className="p-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-medium text-foreground">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{u.username}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{u.email || '—'}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                    </td>
                    <td className="p-3 flex gap-1">
                      <button onClick={() => { setEditing(u); setShowForm(true) }} className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center">
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="w-7 h-7 rounded hover:bg-red-50 flex items-center justify-center">
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
          <UserFormDialog
            user={editing}
            onClose={() => setShowForm(false)}
            onSuccess={() => { setShowForm(false); fetchUsers() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function UserFormDialog({ user, onClose, onSuccess }: {
  user: AdminUser | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    username: user?.username || '',
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'ADMIN',
    isActive: user?.isActive ?? true,
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user && (!form.username || !form.password || !form.name)) {
      toast.error('Username, password, and name are required')
      return
    }
    setSaving(true)
    try {
      const method = user ? 'PUT' : 'POST'
      const body = user ? { id: user.id, ...form } : form
      const res = await fetch('/api/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed')
      }
      toast.success(user ? 'User updated' : 'User created')
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
          <h3 className="text-lg font-bold">{user ? 'Edit User' : 'Add User'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <Label className="text-sm font-medium">Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1" />
          </div>
          <div>
            <Label className="text-sm font-medium">Username {!user && '*'}</Label>
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={!!user} className="mt-1" />
          </div>
          <div>
            <Label className="text-sm font-medium">Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-sm font-medium">{user ? 'New Password (leave blank to keep)' : 'Password *'}</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Role</Label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="PRINCIPAL">Principal</option>
                <option value="ADMISSION_OFFICER">Admission Officer</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <select value={form.isActive ? 'true' : 'false'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-primary text-primary-foreground">
              {saving ? 'Saving...' : user ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
