import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const users = await db.adminUser.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  })
  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const currentUser = await getAuthUser()
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (!body.username || !body.password || !body.name) {
    return NextResponse.json({ error: 'Username, password, and name are required' }, { status: 400 })
  }

  const existing = await db.adminUser.findUnique({ where: { username: body.username } })
  if (existing) {
    return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(body.password, 10)
  const newUser = await db.adminUser.create({
    data: {
      username: body.username,
      passwordHash,
      name: body.name,
      email: body.email || null,
      role: body.role || 'ADMIN',
      isActive: body.isActive ?? true,
    },
    select: { id: true, username: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  })

  return NextResponse.json({ user: newUser }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const currentUser = await getAuthUser()
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, password, ...updateData } = body
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const cleanedData: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(updateData)) {
    if (v !== undefined) cleanedData[k] = v
  }

  if (password) {
    cleanedData.passwordHash = await bcrypt.hash(password, 10)
  }

  const user = await db.adminUser.update({
    where: { id },
    data: cleanedData,
    select: { id: true, username: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
  })

  return NextResponse.json({ user })
}

export async function DELETE(req: NextRequest) {
  const currentUser = await getAuthUser()
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  if (id === currentUser.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
  }

  await db.adminUser.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
