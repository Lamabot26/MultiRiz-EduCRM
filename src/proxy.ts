import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard']
const SESSION_COOKIE = 'spis_session'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if path is protected
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))

  if (isProtected) {
    const sessionToken = request.cookies.get(SESSION_COOKIE)?.value

    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Token exists — let the route handler verify it against the DB
    // (middleware can't access Prisma, so we just check cookie presence)
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
