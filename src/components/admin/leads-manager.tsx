'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Trash2,
  Edit2,
  Phone,
  Mail,
  X,
  ChevronDown,
  LayoutGrid,
  Table as TableIcon,
  CheckSquare,
  Square,
  Tag,
  MapPin,
  FileText,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  LEAD_STATUSES,
  LEAD_SOURCES,
  LEAD_PRIORITIES,
  GRADE_OPTIONS,
  CAMPUS_OPTIONS,
} from '@/lib/school-data'
import { toast } from 'sonner'

interface Lead {
  id: string
  leadId: string
  studentName: string
  parentName: string
  email: string | null
  phone: string
  altPhone: string | null
  gradeApplied: string
  campus: string
  source: string
  status: string
  priority: string
  assignedTo: string | null
  notes: string | null
  address: string | null
  previousSchool: string | null
  dateOfBirth: string | null
  followUpDate: string | null
  createdAt: string
  interactions?: unknown[]
}

export function LeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'table' | 'kanban'>('table')
  const [showForm, setShowForm] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    status: 'ALL',
    campus: 'ALL',
    source: 'ALL',
    priority: 'ALL',
  })

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status !== 'ALL') params.set('status', filters.status)
      if (filters.campus !== 'ALL') params.set('campus', filters.campus)
      if (filters.source !== 'ALL') params.set('source', filters.source)
      if (filters.priority !== 'ALL') params.set('priority', filters.priority)
      if (search) params.set('search', search)

      const res = await fetch(`/api/leads?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error)
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [filters, search])

  useEffect(() => {
    const debounce = setTimeout(fetchLeads, 300)
    return () => clearTimeout(debounce)
  }, [fetchLeads])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return
    try {
      const res = await fetch(`/api/leads?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Lead deleted')
        fetchLeads()
      }
    } catch {
      toast.error('Failed to delete lead')
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        toast.success('Status updated')
        fetchLeads()
      }
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams()
      params.set('format', format)
      if (filters.status !== 'ALL') params.set('status', filters.status)
      if (filters.campus !== 'ALL') params.set('campus', filters.campus)

      const res = await fetch(`/api/leads/export?${params}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `leads-export-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success(`Exported ${format.toUpperCase()} successfully`)
      }
    } catch {
      toast.error('Failed to export')
    }
  }

  const handleBulkAction = async (action: string, value?: string) => {
    if (selectedIds.length === 0) {
      toast.error('No leads selected')
      return
    }

    if (action === 'delete' && !confirm(`Delete ${selectedIds.length} leads?`)) return

    try {
      const res = await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action, value }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`${data.updated || data.deleted} leads updated`)
        setSelectedIds([])
        setShowBulkActions(false)
        fetchLeads()
      }
    } catch {
      toast.error('Failed to perform bulk action')
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(leads.map((l) => l.id))
    }
  }

  const getStatusBadge = (status: string) => {
    const s = LEAD_STATUSES.find((st) => st.value === status)
    return s ? (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
        {s.label}
      </span>
    ) : (
      <Badge variant="secondary">{status}</Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const p = LEAD_PRIORITIES.find((pr) => pr.value === priority)
    return p ? (
      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${p.color}`}>
        {p.label}
      </span>
    ) : null
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email, or lead ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="border-border"
          >
            <Filter className="w-4 h-4 mr-1.5" />
            Filters
            <ChevronDown className="w-3.5 h-3.5 ml-1" />
          </Button>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setView('table')}
              className={`px-3 py-2 ${view === 'table' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-2 ${view === 'kanban' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <Button
            onClick={() => {
              setEditingLead(null)
              setShowForm(true)
            }}
            size="sm"
            className="bg-primary text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs font-medium">Status</Label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    >
                      <option value="ALL">All Statuses</option>
                      {LEAD_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Campus</Label>
                    <select
                      value={filters.campus}
                      onChange={(e) => setFilters({ ...filters, campus: e.target.value })}
                      className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    >
                      <option value="ALL">All Campuses</option>
                      {CAMPUS_OPTIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Source</Label>
                    <select
                      value={filters.source}
                      onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                      className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    >
                      <option value="ALL">All Sources</option>
                      {LEAD_SOURCES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Priority</Label>
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                      className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    >
                      <option value="ALL">All Priorities</option>
                      {LEAD_PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ status: 'ALL', campus: 'ALL', source: 'ALL', priority: 'ALL' })}
                  >
                    Reset Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {total} {total === 1 ? 'lead' : 'leads'}
            {selectedIds.length > 0 && ` · ${selectedIds.length} selected`}
          </span>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) handleBulkAction('update_status', e.target.value)
                  e.target.value = ''
                }}
                className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
              >
                <option value="">Update Status</option>
                {LEAD_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <select
                onChange={(e) => {
                  if (e.target.value) handleBulkAction('update_priority', e.target.value)
                  e.target.value = ''
                }}
                className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
              >
                <option value="">Update Priority</option>
                {LEAD_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('delete')}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Import
          </Button>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => handleExport('csv')}
              className="px-3 py-1.5 text-xs font-medium hover:bg-muted flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="px-3 py-1.5 text-xs font-medium hover:bg-muted border-l border-border flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : leads.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No leads found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search || filters.status !== 'ALL' || filters.campus !== 'ALL'
                ? 'Try adjusting your filters or search query.'
                : 'New enquiries from the website will appear here.'}
            </p>
            <Button
              onClick={() => {
                setEditingLead(null)
                setShowForm(true)
              }}
              size="sm"
              className="bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add First Lead
            </Button>
          </CardContent>
        </Card>
      ) : view === 'table' ? (
        <TableView
          leads={leads}
          selectedIds={selectedIds}
          toggleSelect={toggleSelect}
          toggleSelectAll={toggleSelectAll}
          getStatusBadge={getStatusBadge}
          getPriorityBadge={getPriorityBadge}
          formatDate={formatDate}
          onEdit={(lead) => {
            setEditingLead(lead)
            setShowForm(true)
          }}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <KanbanView
          leads={leads}
          onStatusChange={handleStatusChange}
          onEdit={(lead) => {
            setEditingLead(lead)
            setShowForm(true)
          }}
        />
      )}

      {/* Lead form dialog */}
      <AnimatePresence>
        {showForm && (
          <LeadFormDialog
            lead={editingLead}
            onClose={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false)
              fetchLeads()
            }}
          />
        )}
      </AnimatePresence>

      {/* Import dialog */}
      <AnimatePresence>
        {showImport && (
          <ImportDialog
            onClose={() => setShowImport(false)}
            onSuccess={() => {
              setShowImport(false)
              fetchLeads()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============ TABLE VIEW ============
function TableView({
  leads,
  selectedIds,
  toggleSelect,
  toggleSelectAll,
  getStatusBadge,
  getPriorityBadge,
  formatDate,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  leads: Lead[]
  selectedIds: string[]
  toggleSelect: (id: string) => void
  toggleSelectAll: () => void
  getStatusBadge: (status: string) => React.ReactNode
  getPriorityBadge: (priority: string) => React.ReactNode
  formatDate: (date: string) => string
  onEdit: (lead: Lead) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: string) => void
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const allSelected = selectedIds.length === leads.length && leads.length > 0

  return (
    <Card className="border-border overflow-hidden">
      <div className="overflow-x-auto custom-scroll">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="p-3 text-left w-10">
                <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground">
                  {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>
              </th>
              <th className="p-3 text-left font-medium text-muted-foreground">Lead ID</th>
              <th className="p-3 text-left font-medium text-muted-foreground">Student</th>
              <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Parent</th>
              <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Contact</th>
              <th className="p-3 text-left font-medium text-muted-foreground">Grade</th>
              <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Campus</th>
              <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Priority</th>
              <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Date</th>
              <th className="p-3 text-left font-medium text-muted-foreground w-10"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <button
                    onClick={() => toggleSelect(lead.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {selectedIds.includes(lead.id) ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </td>
                <td className="p-3">
                  <span className="text-xs font-mono text-muted-foreground">{lead.leadId}</span>
                </td>
                <td className="p-3">
                  <div className="font-medium text-foreground">{lead.studentName}</div>
                  <div className="text-xs text-muted-foreground">{lead.source}</div>
                </td>
                <td className="p-3 hidden md:table-cell text-foreground">{lead.parentName}</td>
                <td className="p-3 hidden lg:table-cell">
                  <div className="flex flex-col gap-0.5">
                    <a href={`tel:${lead.phone}`} className="text-xs flex items-center gap-1 text-foreground hover:text-primary">
                      <Phone className="w-3 h-3" />
                      {lead.phone}
                    </a>
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary truncate max-w-[180px]">
                        <Mail className="w-3 h-3" />
                        {lead.email}
                      </a>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-foreground">{lead.gradeApplied}</span>
                </td>
                <td className="p-3 hidden lg:table-cell">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {lead.campus === 'City Campus' ? 'City' : 'Residential'}
                  </span>
                </td>
                <td className="p-3">
                  <select
                    value={lead.status}
                    onChange={(e) => onStatusChange(lead.id, e.target.value)}
                    className="text-xs border-0 bg-transparent cursor-pointer focus:ring-0 p-0"
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </td>
                <td className="p-3 hidden md:table-cell">{getPriorityBadge(lead.priority)}</td>
                <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">{formatDate(lead.createdAt)}</td>
                <td className="p-3 relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === lead.id ? null : lead.id)}
                    className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center"
                  >
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {openMenu === lead.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                      <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-border py-1 min-w-[140px]">
                        <button
                          onClick={() => {
                            onEdit(lead)
                            setOpenMenu(null)
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            onDelete(lead.id)
                            setOpenMenu(null)
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ============ KANBAN VIEW ============
function KanbanView({
  leads,
  onStatusChange,
  onEdit,
}: {
  leads: Lead[]
  onStatusChange: (id: string, status: string) => void
  onEdit: (lead: Lead) => void
}) {
  return (
    <div className="overflow-x-auto custom-scroll pb-4">
      <div className="flex gap-4 min-w-max">
        {LEAD_STATUSES.map((status) => {
          const statusLeads = leads.filter((l) => l.status === status.value)
          return (
            <div key={status.value} className="w-72 flex-shrink-0">
              <div className="bg-muted/50 rounded-t-lg p-3 border-b-2 border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status.color.split(' ')[0]}`} />
                    <span className="font-semibold text-sm text-foreground">{status.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground bg-white px-2 py-0.5 rounded-full">
                    {statusLeads.length}
                  </span>
                </div>
              </div>
              <div className="bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto custom-scroll">
                {statusLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => onEdit(lead)}
                    className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-sm text-foreground">{lead.studentName}</div>
                      <span className="text-[10px] font-mono text-muted-foreground">{lead.leadId}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">{lead.parentName}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Phone className="w-3 h-3" />
                      {lead.phone}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2 py-0.5 rounded bg-muted">{lead.gradeApplied}</span>
                      <select
                        value={lead.status}
                        onChange={(e) => {
                          e.stopPropagation()
                          onStatusChange(lead.id, e.target.value)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] border-0 bg-transparent cursor-pointer focus:ring-0 p-0"
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                {statusLeads.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground">No leads</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============ LEAD FORM DIALOG ============
function LeadFormDialog({
  lead,
  onClose,
  onSuccess,
}: {
  lead: Lead | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    studentName: lead?.studentName || '',
    parentName: lead?.parentName || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    altPhone: lead?.altPhone || '',
    gradeApplied: lead?.gradeApplied || 'Nursery',
    campus: lead?.campus || 'City Campus',
    source: lead?.source || 'Website',
    status: lead?.status || 'NEW',
    priority: lead?.priority || 'MEDIUM',
    assignedTo: lead?.assignedTo || '',
    notes: lead?.notes || '',
    address: lead?.address || '',
    previousSchool: lead?.previousSchool || '',
    dateOfBirth: lead?.dateOfBirth || '',
    followUpDate: lead?.followUpDate || '',
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.studentName || !form.parentName || !form.phone) {
      toast.error('Student name, parent name, and phone are required')
      return
    }

    setSaving(true)
    try {
      const url = lead ? '/api/leads' : '/api/leads'
      const method = lead ? 'PUT' : 'POST'
      const body = lead ? { id: lead.id, ...form } : form

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      toast.success(lead ? 'Lead updated' : 'Lead created')
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save lead')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">
              {lead ? 'Edit Lead' : 'Add New Lead'}
            </h3>
            {lead && (
              <p className="text-xs text-primary-foreground/80 mt-0.5">Lead ID: {lead.leadId}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scroll">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Student Name <span className="text-destructive">*</span></Label>
              <Input
                value={form.studentName}
                onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Parent / Guardian Name <span className="text-destructive">*</span></Label>
              <Input
                value={form.parentName}
                onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                required
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Phone <span className="text-destructive">*</span></Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Alternate Phone</Label>
              <Input
                type="tel"
                value={form.altPhone}
                onChange={(e) => setForm({ ...form, altPhone: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Date of Birth</Label>
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Grade</Label>
              <select
                value={form.gradeApplied}
                onChange={(e) => setForm({ ...form, gradeApplied: e.target.value })}
                className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium">Campus</Label>
              <select
                value={form.campus}
                onChange={(e) => setForm({ ...form, campus: e.target.value })}
                className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {CAMPUS_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium">Source</Label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium">Priority</Label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {LEAD_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium">Follow-up Date</Label>
              <Input
                type="date"
                value={form.followUpDate}
                onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Address</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Previous School</Label>
            <Input
              value={form.previousSchool}
              onChange={(e) => setForm({ ...form, previousSchool: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {saving ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ============ IMPORT DIALOG ============
function ImportDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    success: number
    failed: number
    total: number
    errors: string[]
  } | null>(null)

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/leads/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setResult({
        success: data.success,
        failed: data.failed,
        total: data.total,
        errors: data.errors || [],
      })

      if (data.success > 0) {
        toast.success(`${data.success} leads imported successfully`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const headers = [
      'StudentName', 'ParentName', 'Phone', 'AltPhone', 'Email',
      'GradeApplied', 'Campus', 'Source', 'Status', 'Priority',
      'PreviousSchool', 'DateOfBirth', 'Address', 'Notes'
    ]
    const sampleRow = [
      'John Doe', 'Jane Doe', '9876543210', '9876543211', 'jane@example.com',
      'Nursery', 'City Campus', 'Website', 'NEW', 'MEDIUM',
      'Little Stars Preschool', '2020-01-15', 'Bhubaneswar', 'Interested in admission'
    ]
    const csv = [headers.join(','), sampleRow.join(',')].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'leads-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Import Leads from CSV</h3>
            <p className="text-xs text-primary-foreground/80 mt-0.5">Upload a CSV file to bulk import leads</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!result ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-medium mb-1">CSV Format Requirements:</p>
                <ul className="text-xs space-y-0.5 list-disc list-inside">
                  <li>First row must contain column headers</li>
                  <li>Required: StudentName, Phone</li>
                  <li>Optional: ParentName, Email, GradeApplied, Campus, Source, Status, Priority, etc.</li>
                </ul>
                <button
                  onClick={downloadTemplate}
                  className="text-xs font-medium text-blue-700 hover:underline mt-2 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download template
                </button>
              </div>

              <div
                onClick={() => document.getElementById('import-file')?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              >
                {file ? (
                  <div>
                    <FileText className="w-10 h-10 mx-auto text-primary mb-2" />
                    <div className="text-sm font-medium text-foreground">{file.name}</div>
                    <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <div className="text-sm font-medium text-foreground">Click to upload CSV file</div>
                    <div className="text-xs text-muted-foreground mt-1">Maximum size: 5MB</div>
                  </div>
                )}
                <input
                  id="import-file"
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!file || importing}
                  className="flex-1 bg-primary text-primary-foreground"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-1.5" />
                      Import Leads
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div>
              <div className="text-center py-4">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${result.failed === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                  {result.failed === 0 ? '✓' : '!'}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">Import Complete</h3>
                <p className="text-sm text-muted-foreground">
                  {result.success} of {result.total} leads imported successfully
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-600">{result.success}</div>
                  <div className="text-xs text-muted-foreground">Success</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-foreground">{result.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-32 overflow-y-auto custom-scroll">
                  <div className="text-xs font-medium text-red-800 mb-1">Errors:</div>
                  {result.errors.slice(0, 10).map((err, i) => (
                    <div key={i} className="text-xs text-red-600">{err}</div>
                  ))}
                  {result.errors.length > 10 && (
                    <div className="text-xs text-red-600 mt-1">...and {result.errors.length - 10} more</div>
                  )}
                </div>
              )}

              <Button onClick={onSuccess} className="w-full bg-primary text-primary-foreground mt-4">
                Done
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
