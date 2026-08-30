import { db } from '@/lib/db'
import { AdminDashboardClient } from '@/components/admin/admin-dashboard-client'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [
    totalLeads,
    todayLeads,
    thisMonthLeads,
    statusCounts,
    sourceCounts,
    campusCounts,
    recentLeads,
    totalStudents,
    totalClasses,
    activeNotices,
  ] = await Promise.all([
    db.lead.count(),
    db.lead.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    db.lead.count({ where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    db.lead.groupBy({ by: ['status'], _count: true }),
    db.lead.groupBy({ by: ['source'], _count: true }),
    db.lead.groupBy({ by: ['campus'], _count: true }),
    db.lead.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    db.student.count(),
    db.classRoom.count({ where: { isActive: true } }),
    db.notice.count({ where: { isActive: true } }),
  ])

  const admitted = statusCounts.find((s) => s.status === 'ADMITTED')?._count || 0
  const conversionRate = totalLeads > 0 ? ((admitted / totalLeads) * 100).toFixed(1) : '0'

  const stats = {
    totalLeads,
    todayLeads,
    thisMonthLeads,
    conversionRate,
    totalStudents,
    totalClasses,
    activeNotices,
    statusCounts,
    sourceCounts,
    campusCounts,
    recentLeads,
  }

  return <AdminDashboardClient stats={stats} />
}
