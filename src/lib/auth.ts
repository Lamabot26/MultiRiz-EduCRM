import { db } from './db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const SESSION_COOKIE = 'spis_session'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface AuthUser {
  id: string
  username: string
  name: string
  email: string | null
  role: string
}

// ---------------------------------------------------------------------
// Password hashing with bcryptjs
// ---------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------
// Session management — DB-backed, httpOnly cookie
// ---------------------------------------------------------------------

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  await db.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION / 1000,
  })

  return token
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (token) {
    await db.session.deleteMany({ where: { token } }).catch(() => {})
  }

  cookieStore.delete(SESSION_COOKIE)
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value

    if (!token) return null

    const session = await db.session.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session) return null

    if (session.expiresAt < new Date()) {
      await db.session.delete({ where: { id: session.id } }).catch(() => {})
      return null
    }

    if (!session.user.isActive) return null

    return {
      id: session.user.id,
      username: session.user.username,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    }
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser()
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}

export async function authenticate(username: string, password: string): Promise<AuthUser | null> {
  const admin = await db.adminUser.findUnique({ where: { username } })

  if (!admin || !admin.isActive) return null

  const valid = await verifyPassword(password, admin.passwordHash)
  if (!valid) return null

  await db.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  })

  await createSession(admin.id)

  return {
    id: admin.id,
    username: admin.username,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  }
}

// Get session token for client-side checks (middleware)
export function getSessionCookieName(): string {
  return SESSION_COOKIE
}
