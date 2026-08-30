import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const classes = await db.classRoom.findMany({
    orderBy: { grade: 'asc' },
    include: { _count: { select: { students: true } } },
  })
  return NextResponse.json({ classes })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const classRoom = await db.classRoom.create({
    data: {
      name: body.name,
      grade: body.grade,
      section: body.section || 'A',
      capacity: body.capacity || 30,
      teacher: body.teacher || null,
      roomNumber: body.roomNumber || null,
    },
  })
  return NextResponse.json({ classRoom }, { status: 201 })
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

  const classRoom = await db.classRoom.update({ where: { id }, data: cleanedData })
  return NextResponse.json({ classRoom })
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.classRoom.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
