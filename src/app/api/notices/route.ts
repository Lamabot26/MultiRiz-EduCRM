import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notices = await db.notice.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ notices })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const notice = await db.notice.create({
    data: {
      title: body.title,
      content: body.content,
      category: body.category || 'GENERAL',
      date: body.date || new Date().toISOString().split('T')[0],
      isActive: body.isActive ?? true,
    },
  })
  return NextResponse.json({ notice }, { status: 201 })
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

  const notice = await db.notice.update({ where: { id }, data: cleanedData })
  return NextResponse.json({ notice })
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.notice.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
