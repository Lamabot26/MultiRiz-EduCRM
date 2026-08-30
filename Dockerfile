# =====================================================================
# SP International School ERP — production Dockerfile (Kuberns-ready)
# Multi-stage build → standalone Next.js server (output: "standalone").
# =====================================================================

# ---------- deps + build ----------
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package.json bun.lock* package-lock.json* yarn.lock* ./
# Install with npm for maximal Docker compatibility (bun optional).
RUN npm install --no-audit --no-fund

COPY . .

# Prisma client generation (canonical PostgreSQL schema)
RUN npx prisma generate --schema prisma/schema.prisma

ENV NEXT_TELEMETRY_DISABLED=1
# Build-time placeholder — all runtime secrets come from env vars.
ENV NEXTAUTH_SECRET=build-time-placeholder
ENV DATABASE_URL=postgresql://build:placeholder@localhost:5432/build
RUN npm run build

# ---------- runtime ----------
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl curl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# migration + tooling support
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/health || exit 1

# Kuberns start command: run migrations then serve.
#   npx prisma migrate deploy && node server.js
# (First deploy may use: npx prisma db push --accept-data-loss)
CMD ["sh", "-c", "npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss; node server.js"]
