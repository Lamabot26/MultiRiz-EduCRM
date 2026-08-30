import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ADMIN_CREDENTIALS } from '@/lib/school-data'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      try {
        const existing = await db.adminUser.findUnique({ where: { username } })
        if (existing) {
          await db.adminUser.update({
            where: { username },
            data: { lastLoginAt: new Date() },
          })
        } else {
          await db.adminUser.create({
            data: {
              username: ADMIN_CREDENTIALS.username,
              passwordHash: ADMIN_CREDENTIALS.password,
              name: ADMIN_CREDENTIALS.name,
              role: 'SUPER_ADMIN',
              lastLoginAt: new Date(),
            },
          })
        }
      } catch {
        // DB might not be available, continue
      }

      return NextResponse.json({
        success: true,
        admin: {
          username: ADMIN_CREDENTIALS.username,
          name: ADMIN_CREDENTIALS.name,
          role: 'SUPER_ADMIN',
        },
      })
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
