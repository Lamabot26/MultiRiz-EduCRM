'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  Users,
  MapPin,
  Target,
  Download,
  FileText,
  PieChart as PieChartIcon,
  Activity,
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
  RadialBarChart,
  RadialBar,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LEAD_STATUSES, LEAD_SOURCES } from '@/lib/school-data'

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
  recentLeads: Array<Record<string, unknown>>
}

const PIE_COLORS = ['#0d9488', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#ef4444']
const PRIORITY_COLORS = ['#ef4444', '#f59e0b', '#6b7280']

export function ReportsView() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState<'overview' | 'status' | 'source' | 'grade' | 'priority'>('overview')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/leads/stats')
      if (res.ok) {
        setStats(await res.json())
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = () => {
    if (!stats) return
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalLeads: stats.totalLeads,
        todayLeads: stats.todayLeads,
        thisMonthLeads: stats.thisMonthLeads,
        conversionRate: stats.conversionRate,
      },
      statusDistribution: stats.statusDistribution,
      sourceDistribution: stats.sourceDistribution,
      campusDistribution: stats.campusDistribution,
      gradeDistribution: stats.gradeDistribution,
      priorityDistribution: stats.priorityDistribution,
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `admission-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const reportTypes = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'status' as const, label: 'By Status', icon: Activity },
    { id: 'source' as const, label: 'By Source', icon: PieChartIcon },
    { id: 'grade' as const, label: 'By Grade', icon: Users },
    { id: 'priority' as const, label: 'By Priority', icon: Target },
  ]

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 rounded-xl bg-white animate-pulse" />
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">Failed to load report data.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Report type selector + export */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setReportType(type.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                reportType === type.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white text-foreground/70 hover:bg-primary/10 border border-border'
              }`}
            >
              <type.icon className="w-4 h-4" />
              {type.label}
            </button>
          ))}
        </div>
        <Button onClick={handleExportReport} variant="outline" size="sm">
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Export Report
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: stats.totalLeads, icon: Users, color: 'text-teal-600 bg-teal-50' },
          { label: 'Today', value: stats.todayLeads, icon: Activity, color: 'text-amber-600 bg-amber-50' },
          { label: 'This Month', value: stats.thisMonthLeads, icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
          { label: 'Conversion', value: `${stats.conversionRate}%`, icon: Target, color: 'text-purple-600 bg-purple-50' },
        ].map((card) => (
          <Card key={card.label} className="border-border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{card.value}</div>
                <div className="text-xs text-muted-foreground">{card.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report content based on type */}
      {reportType === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-2 gap-4"
        >
          <Card className="border-border shadow-sm">
            <CardHeader><CardTitle className="text-base">Status Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stats.statusDistribution}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={45}
                    label={({ value }) => value > 0 ? value : ''}
                  >
                    {stats.statusDistribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader><CardTitle className="text-base">Source Breakdown</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.sourceDistribution} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader><CardTitle className="text-base">Campus Preference</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RadialBarChart
                  innerRadius="30%"
                  outerRadius="100%"
                  data={stats.campusDistribution}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar dataKey="value" cornerRadius={6}>
                    {stats.campusDistribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </RadialBar>
                  <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader><CardTitle className="text-base">Grade-wise Applications</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {reportType === 'status' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader><CardTitle className="text-base">Lead Pipeline by Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={stats.statusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {stats.statusDistribution.map((entry, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader><CardTitle className="text-base">Detailed Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.statusDistribution.map((status, i) => {
                  const pct = stats.totalLeads > 0 ? ((status.value / stats.totalLeads) * 100).toFixed(1) : '0'
                  return (
                    <div key={status.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{status.label}</span>
                          <span className="text-sm text-muted-foreground">{status.value} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i] }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {reportType === 'source' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-2 gap-4">
          <Card className="border-border shadow-sm">
            <CardHeader><CardTitle className="text-base">Lead Sources (Pie)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={stats.sourceDistribution}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ label, value }) => value > 0 ? `${label}: ${value}` : ''}
                    labelLine={false}
                  >
                    {stats.sourceDistribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader><CardTitle className="text-base">Source Performance (Bar)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={stats.sourceDistribution} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {stats.sourceDistribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {reportType === 'grade' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader><CardTitle className="text-base">Grade-wise Application Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={stats.gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader><CardTitle className="text-base">Grade Distribution Table</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-3 text-left font-medium text-muted-foreground">Grade</th>
                    <th className="p-3 text-right font-medium text-muted-foreground">Count</th>
                    <th className="p-3 text-right font-medium text-muted-foreground">Percentage</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Visual</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.gradeDistribution.map((grade) => {
                    const pct = stats.totalLeads > 0 ? ((grade.value / stats.totalLeads) * 100).toFixed(1) : '0'
                    return (
                      <tr key={grade.label} className="border-b border-border">
                        <td className="p-3 font-medium text-foreground">{grade.label}</td>
                        <td className="p-3 text-right text-foreground">{grade.value}</td>
                        <td className="p-3 text-right text-muted-foreground">{pct}%</td>
                        <td className="p-3">
                          <div className="h-2 rounded-full bg-muted overflow-hidden w-full max-w-[200px]">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {reportType === 'priority' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-2 gap-4">
          <Card className="border-border shadow-sm">
            <CardHeader><CardTitle className="text-base">Priority Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.priorityDistribution}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ label, value }) => `${label}: ${value}`}
                  >
                    {stats.priorityDistribution.map((_, i) => (
                      <Cell key={i} fill={PRIORITY_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader><CardTitle className="text-base">Priority Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.priorityDistribution.map((priority, i) => {
                  const pct = stats.totalLeads > 0 ? ((priority.value / stats.totalLeads) * 100).toFixed(1) : '0'
                  return (
                    <div key={priority.label} className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[i] }} />
                          <span className="font-medium text-foreground">{priority.label} Priority</span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-foreground">{priority.value}</span>
                          <span className="text-sm text-muted-foreground ml-1">({pct}%)</span>
                        </div>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: PRIORITY_COLORS[i] }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Insights */}
      <Card className="border-border shadow-sm bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                label: 'Top Source',
                value: stats.sourceDistribution.sort((a, b) => b.value - a.value)[0]?.label || 'N/A',
                detail: `${stats.sourceDistribution.sort((a, b) => b.value - a.value)[0]?.value || 0} leads`,
                icon: PieChartIcon,
              },
              {
                label: 'Most Applied Grade',
                value: stats.gradeDistribution[0]?.label || 'N/A',
                detail: `${stats.gradeDistribution[0]?.value || 0} applications`,
                icon: Users,
              },
              {
                label: 'Preferred Campus',
                value: stats.campusDistribution.sort((a, b) => b.value - a.value)[0]?.label || 'N/A',
                detail: `${stats.campusDistribution.sort((a, b) => b.value - a.value)[0]?.value || 0} leads`,
                icon: MapPin,
              },
            ].map((insight) => (
              <div key={insight.label} className="bg-white rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <insight.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-muted-foreground">{insight.label}</span>
                </div>
                <div className="font-bold text-foreground text-lg">{insight.value}</div>
                <div className="text-xs text-muted-foreground">{insight.detail}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
