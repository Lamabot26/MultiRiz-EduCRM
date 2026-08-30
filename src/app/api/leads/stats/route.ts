import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { LEAD_STATUSES, LEAD_SOURCES, CAMPUS_OPTIONS } from '@/lib/school-data'

export async function GET() {
  try {
    const [totalLeads, statusCounts, sourceCounts, campusCounts, recentLeads, todayLeads, thisMonthLeads] = await Promise.all([
      db.lead.count(),
      db.lead.groupBy({ by: ['status'], _count: true }),
      db.lead.groupBy({ by: ['source'], _count: true }),
      db.lead.groupBy({ by: ['campus'], _count: true }),
      db.lead.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
      db.lead.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      db.lead.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ])

    // Format status distribution
    const statusDistribution = LEAD_STATUSES.map((s) => ({
      label: s.label,
      value: statusCounts.find((sc) => sc.status === s.value)?._count || 0,
      color: s.color,
    }))

    // Format source distribution
    const sourceDistribution = LEAD_SOURCES.map((src) => ({
      label: src,
      value: sourceCounts.find((sc) => sc.source === src)?._count || 0,
    }))

    // Format campus distribution
    const campusDistribution = CAMPUS_OPTIONS.map((camp) => ({
      label: camp,
      value: campusCounts.find((cc) => cc.campus === camp)?._count || 0,
    }))

    // Grade-wise distribution
    const gradeCounts = await db.lead.groupBy({ by: ['gradeApplied'], _count: true })
    const gradeDistribution = gradeCounts
      .map((g) => ({ label: g.gradeApplied, value: g._count }))
      .sort((a, b) => b.value - a.value)

    // Conversion rate
    const admitted = statusCounts.find((s) => s.status === 'ADMITTED')?._count || 0
    const conversionRate = totalLeads > 0 ? ((admitted / totalLeads) * 100).toFixed(1) : '0'

    // Priority distribution
    const priorityCounts = await db.lead.groupBy({ by: ['priority'], _count: true })
    const priorityDistribution = [
      { label: 'High', value: priorityCounts.find((p) => p.priority === 'HIGH')?._count || 0 },
      { label: 'Medium', value: priorityCounts.find((p) => p.priority === 'MEDIUM')?._count || 0 },
      { label: 'Low', value: priorityCounts.find((p) => p.priority === 'LOW')?._count || 0 },
    ]

    return NextResponse.json({
      totalLeads,
      todayLeads,
      thisMonthLeads,
      conversionRate,
      statusDistribution,
      sourceDistribution,
      campusDistribution,
      gradeDistribution,
      priorityDistribution,
      recentLeads,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
