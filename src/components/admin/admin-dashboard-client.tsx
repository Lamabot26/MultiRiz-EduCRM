'use client'

import { motion } from 'framer-motion'
import {
  Users, Clock, Calendar, Target, GraduationCap, BookOpen, Bell,
  ArrowUpRight, ArrowDownRight, Phone, Mail, MapPin,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LEAD_STATUSES, LEAD_SOURCES, CAMPUS_OPTIONS } from '@/lib/school-data'
import Link from 'next/link'

const PIE_COLORS = ['#0d9488', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#ef4444']

interface Stats {
  totalLeads: number
  todayLeads: number
  thisMonthLeads: number
  conversionRate: string
  totalStudents: number
  totalClasses: number
  activeNotices: number
  statusCounts: { status: string; _count: number }[]
  sourceCounts: { source: string; _count: number }[]
  campusCounts: { campus: string; _count: number }[]
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

export function AdminDashboardClient({ stats }: { stats: Stats }) {
  const statCards = [
    { label: 'Total Leads', value: stats.totalLeads, icon: Users, color: 'from-teal-500 to-emerald-600', trend: '+12%', trendUp: true },
    { label: 'Today', value: stats.todayLeads, icon: Clock, color: 'from-amber-500 to-orange-600', trend: '+5%', trendUp: true },
    { label: 'This Month', value: stats.thisMonthLeads, icon: Calendar, color: 'from-blue-500 to-indigo-600', trend: '+18%', trendUp: true },
    { label: 'Conversion', value: `${stats.conversionRate}%`, icon: Target, color: 'from-purple-500 to-pink-600', trend: '+3%', trendUp: true },
    { label: 'Students', value: stats.totalStudents, icon: GraduationCap, color: 'from-emerald-500 to-teal-600', trend: '+8%', trendUp: true },
    { label: 'Classes', value: stats.totalClasses, icon: BookOpen, color: 'from-cyan-500 to-blue-600', trend: '0%', trendUp: null },
    { label: 'Active Notices', value: stats.activeNotices, icon: Bell, color: 'from-orange-500 to-red-600', trend: '+2', trendUp: true },
  ]

  const statusData = LEAD_STATUSES.map((s) => ({
    label: s.label,
    value: stats.statusCounts.find((sc) => sc.status === s.value)?._count || 0,
  }))

  const sourceData = LEAD_SOURCES.map((src) => ({
    label: src,
    value: stats.sourceCounts.find((sc) => sc.source === src)?._count || 0,
  })).filter((s) => s.value > 0)

  const campusData = CAMPUS_OPTIONS.map((camp) => ({
    label: camp,
    value: stats.campusCounts.find((cc) => cc.campus === camp)?._count || 0,
  }))

  const getStatusBadge = (status: string) => {
    const s = LEAD_STATUSES.find((st) => st.value === status)
    return s ? (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
        {s.label}
      </span>
    ) : null
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Card className="relative overflow-hidden border-border shadow-sm hover:shadow-md transition-shadow">
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color}`} />
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg`}>
                    <card.icon className="w-4 h-4" />
                  </div>
                  {card.trendUp !== null && (
                    <div className={`flex items-center gap-0.5 text-[10px] font-medium ${card.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                      {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {card.trend}
                    </div>
                  )}
                </div>
                <div className="text-xl lg:text-2xl font-bold text-foreground">{card.value}</div>
                <div className="text-[10px] text-muted-foreground">{card.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.some((s) => s.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
                    {statusData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sourceData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                No data yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent leads */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent Enquiries</CardTitle>
          <Link href="/dashboard/leads" className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
            View All
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {stats.recentLeads.length > 0 ? (
            <div className="space-y-2">
              {stats.recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href="/dashboard/leads"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
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
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(lead.status)}
                    <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(lead.createdAt)}</span>
                  </div>
                </Link>
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

      {/* Quick links to modules */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Manage Leads', href: '/dashboard/leads', icon: Users, color: 'bg-teal-500' },
          { label: 'Students', href: '/dashboard/students', icon: GraduationCap, color: 'bg-emerald-500' },
          { label: 'Classes', href: '/dashboard/classes', icon: BookOpen, color: 'bg-blue-500' },
          { label: 'Reports', href: '/dashboard/reports', icon: Target, color: 'bg-purple-500' },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${link.color} text-white flex items-center justify-center`}>
                  <link.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-foreground">{link.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
