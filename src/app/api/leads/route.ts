import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const campus = searchParams.get('campus')
    const source = searchParams.get('source')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (status && status !== 'ALL') where.status = status
    if (campus && campus !== 'ALL') where.campus = campus
    if (source && source !== 'ALL') where.source = source
    if (priority && priority !== 'ALL') where.priority = priority
    if (search) {
      where.OR = [
        { studentName: { contains: search } },
        { parentName: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { leadId: { contains: search } },
      ]
    }

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { interactions: true },
      }),
      db.lead.count({ where }),
    ])

    return NextResponse.json({
      leads,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Fetch leads error:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

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
        gradeApplied: body.gradeApplied,
        campus: body.campus || 'City Campus',
        source: body.source || 'Website',
        status: body.status || 'NEW',
        priority: body.priority || 'MEDIUM',
        assignedTo: body.assignedTo || null,
        notes: body.notes || null,
        address: body.address || null,
        previousSchool: body.previousSchool || null,
        dateOfBirth: body.dateOfBirth || null,
        followUpDate: body.followUpDate || null,
      },
    })

    return NextResponse.json({ lead }, { status: 201 })
  } catch (error) {
    console.error('Create lead error:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    const cleanedData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        cleanedData[key] = value
      }
    }

    const lead = await db.lead.update({
      where: { id },
      data: cleanedData,
    })

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('Update lead error:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    await db.lead.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete lead error:', error)
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }
}
