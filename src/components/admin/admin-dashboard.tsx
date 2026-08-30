'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  TrendingUp,
  Calendar,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  Mail,
  MapPin,
  Clock,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LEAD_STATUSES } from '@/lib/school-data'

interface Stats {
  totalLeads: number
  todayLeads: number
  thisMonthLeads: number
  conversionRate: string
  statusDistribution: { label: string; value: number; color: string }[]
  sourceDistribution: { label: string; value: number }[]
  campusDistribution: { label: string; value: number }[]
  gradeDistribution: { label: string; value: number }[]
  priorityDistribution: { label: string; value: number }[]
  recentLeads: Array<{
    id: string
    leadId: string
    studentName: string
    parentName: string
    phone: string
    gradeApplied: string
    status: string
    createdAt: string
  }>
}

interface DashboardProps {
  onNavigate: (page: 'dashboard' | 'leads' | 'reports' | 'settings') => void
}

const PIE_COLORS = ['#0d9488', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#ef4444']

export function AdminDashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/leads/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-white animate-pulse" />
        ))}
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Leads',
      value: stats?.totalLeads || 0,
      icon: Users,
      color: 'from-teal-500 to-emerald-600',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Today',
      value: stats?.todayLeads || 0,
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
      trend: '+5%',
      trendUp: true,
    },
    {
      label: 'This Month',
      value: stats?.thisMonthLeads || 0,
      icon: Calendar,
      color: 'from-blue-500 to-indigo-600',
      trend: '+18%',
      trendUp: true,
    },
    {
      label: 'Conversion Rate',
      value: `${stats?.conversionRate || 0}%`,
      icon: Target,
      color: 'from-purple-500 to-pink-600',
      trend: '+3%',
      trendUp: true,
    },
  ]

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

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <Card className="relative overflow-hidden border-border shadow-sm hover:shadow-md transition-shadow">
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color}`} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${card.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                    {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {card.trend}
                  </div>
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-foreground">{card.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Status distribution - Pie */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.statusDistribution.some((s) => s.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.statusDistribution}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={2}
                  >
                    {stats.statusDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                No data yet. Leads will appear here.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Source distribution - Bar */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.sourceDistribution.some((s) => s.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.sourceDistribution} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                No data yet. Leads will appear here.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campus distribution - Area */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Campus Preference</CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.campusDistribution.some((s) => s.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={stats.campusDistribution}>
                  <defs>
                    <linearGradient id="campusGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="url(#campusGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                No data yet. Leads will appear here.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grade distribution - Bar */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Grade-wise Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.gradeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                No data yet. Leads will appear here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent leads */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent Enquiries</CardTitle>
          <button
            onClick={() => onNavigate('leads')}
            className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
          >
            View All
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </CardHeader>
        <CardContent>
          {stats && stats.recentLeads.length > 0 ? (
            <div className="space-y-2">
              {stats.recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onNavigate('leads')}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {lead.studentName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground truncate">{lead.studentName}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{lead.leadId}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {lead.parentName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {lead.phone}
                      </span>
                      <span className="hidden sm:flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {lead.gradeApplied}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(lead.status)}
                    <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(lead.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No leads yet. Enquiries from the website will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
