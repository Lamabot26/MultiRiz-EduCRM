import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'csv'
    const status = searchParams.get('status')
    const campus = searchParams.get('campus')

    const where: Record<string, unknown> = {}
    if (status && status !== 'ALL') where.status = status
    if (campus && campus !== 'ALL') where.campus = campus

    const leads = await db.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const headers = [
      'Lead ID',
      'Student Name',
      'Parent Name',
      'Phone',
      'Alt Phone',
      'Email',
      'Grade Applied',
      'Campus',
      'Source',
      'Status',
      'Priority',
      'Previous School',
      'Date of Birth',
      'Address',
      'Notes',
      'Follow Up Date',
      'Created At',
    ]

    if (format === 'csv') {
      const rows = leads.map((l) =>
        [
          l.leadId,
          l.studentName,
          l.parentName,
          l.phone,
          l.altPhone,
          l.email,
          l.gradeApplied,
          l.campus,
          l.source,
          l.status,
          l.priority,
          l.previousSchool,
          l.dateOfBirth,
          l.address,
          l.notes,
          l.followUpDate,
          l.createdAt.toISOString(),
        ].map(escapeCSV).join(',')
      )

      const csv = [headers.join(','), ...rows].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="leads-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // JSON format
    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      totalRecords: leads.length,
      leads: leads.map((l) => ({
        leadId: l.leadId,
        studentName: l.studentName,
        parentName: l.parentName,
        phone: l.phone,
        altPhone: l.altPhone,
        email: l.email,
        gradeApplied: l.gradeApplied,
        campus: l.campus,
        source: l.source,
        status: l.status,
        priority: l.priority,
        previousSchool: l.previousSchool,
        dateOfBirth: l.dateOfBirth,
        address: l.address,
        notes: l.notes,
        followUpDate: l.followUpDate,
        createdAt: l.createdAt,
      })),
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export leads' }, { status: 500 })
  }
}
