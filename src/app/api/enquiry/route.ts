import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate required fields
    if (!body.studentName || !body.parentName || !body.phone) {
      return NextResponse.json({
        error: 'Student name, parent name, and phone are required',
      }, { status: 400 })
    }

    const count = await db.lead.count()
    const leadId = `SPIS${String(count + 1).padStart(5, '0')}`

    const lead = await db.lead.create({
      data: {
        leadId,
        studentName: body.studentName,
        parentName: body.parentName,
        email: body.email || null,
        phone: body.phone,
        altPhone: body.altPhone || null,
        gradeApplied: body.gradeApplied || 'Nursery',
        campus: body.campus || 'City Campus',
        source: 'Website',
        status: 'NEW',
        priority: 'MEDIUM',
        notes: body.message || null,
        address: body.address || null,
      },
    })

    return NextResponse.json({ success: true, leadId: lead.leadId }, { status: 201 })
  } catch (error) {
    console.error('Enquiry error:', error)
    return NextResponse.json({ error: 'Failed to submit enquiry' }, { status: 500 })
  }
}
