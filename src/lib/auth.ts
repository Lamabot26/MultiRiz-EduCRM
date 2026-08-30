import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { rateLimit } from './rate-limit';

// =====================================================================
// Auth.js (NextAuth v4) — credentials + JWT session carrying id/roles.
// Session cookie is httpOnly + sameSite=lax + secure in production.
// =====================================================================

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 }, // 8 hours
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;
        if (!email || !password) return null;

        // progressive rate limit per email+IP-ish key
        const rl = rateLimit(`login:${email}`, 10, 5 * 60 * 1000);
        if (!rl.allowed) return null;

        const user = await db.user.findUnique({
          where: { email },
          include: { userRoles: { include: { role: true } } },
        });
        if (!user || !user.isActive) return null;
        if (user.lockedUntil && user.lockedUntil > new Date()) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          const failed = user.failedLoginCount + 1;
          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: failed,
              // lock for 15 min after 5 consecutive failures
              lockedUntil: failed >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
            },
          });
          return null;
        }

        await db.user.update({
          where: { id: user.id },
          data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.userRoles.map((ur) => ur.role.key),
        } as unknown as { id: string; email: string; name: string; roles: string[] };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.uid = (user as unknown as { id: string }).id;
        token.roles = (user as unknown as { roles: string[] }).roles ?? [];
      }
      if (trigger === 'update' && token.uid) {
        const fresh = await db.user.findUnique({
          where: { id: token.uid as string },
          include: { userRoles: { include: { role: true } } },
        });
        if (fresh) token.roles = fresh.userRoles.map((ur) => ur.role.key);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as Record<string, unknown>).id = token.uid as string;
        (session.user as unknown as Record<string, unknown>).roles = token.roles ?? [];
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-spis.session-token'
        : 'spis.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};
