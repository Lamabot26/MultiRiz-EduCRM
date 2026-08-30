# =====================================================================
# SP International School — Production Dockerfile (Kuberns-ready)
# Multi-stage build → standalone Next.js server with SQLite.
# =====================================================================

# ---------- deps + build ----------
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package.json bun.lock* package-lock.json* yarn.lock* ./
RUN npm install --no-audit --no-fund

COPY . .

# Generate Prisma client (SQLite schema)
RUN npx prisma generate --schema prisma/schema.prisma

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/data/custom.db"
RUN npm run build

# ---------- runtime ----------
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl curl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL="file:/app/data/custom.db"

# Non-root user
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/health || exit 1

# Push schema to create SQLite database on first run, then serve.
CMD ["sh", "-c", "npx prisma db push --accept-data-loss; node server.js"]
