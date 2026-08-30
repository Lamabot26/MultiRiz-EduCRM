import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const status = searchParams.get('status')
  const classId = searchParams.get('classId')

  const where: Record<string, unknown> = {}
  if (status && status !== 'ALL') where.status = status
  if (classId && classId !== 'ALL') where.classId = classId
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { admissionNo: { contains: search } },
      { parentName: { contains: search } },
      { parentPhone: { contains: search } },
    ]
  }

  const students = await db.student.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { classRoom: true },
  })

  return NextResponse.json({ students })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const count = await db.student.count()
  const admissionNo = `SPIS-S${String(count + 1).padStart(5, '0')}`

  const student = await db.student.create({
    data: {
      admissionNo,
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: body.dateOfBirth || null,
      gender: body.gender || null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      parentName: body.parentName,
      parentPhone: body.parentPhone,
      parentEmail: body.parentEmail || null,
      classId: body.classId || null,
      campus: body.campus || 'City Campus',
      status: body.status || 'ACTIVE',
    },
  })

  return NextResponse.json({ student }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, ...updateData } = body
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const cleanedData: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(updateData)) {
    if (v !== undefined) cleanedData[k] = v
  }

  const student = await db.student.update({ where: { id }, data: cleanedData })
  return NextResponse.json({ student })
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.student.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
