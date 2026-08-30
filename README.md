# SP International School — Digital Ecosystem (School ERP + Website)

Production-ready, single-application school platform for **SP International School, Bhubaneswar (India)**:

1. **Premium public website** (10 pages, SEO, enquiry capture)
2. **Admission Lead Management CRM** (pipeline, Kanban + table, follow-ups, conversion)
3. **Student Information System** (profiles, guardians, approved contacts, documents)
4. **Fee Management** (structures → invoices → payments → receipts PDF → concessions/refunds → ledgers & defaulters)
5. **Role portals** — Super Admin, Principal, Admission Counsellor, Accountant, Teacher, Class Teacher, Front Desk, Parent/Guardian, Student, IT Admin
6. **Reports, audit logs, RBAC, secure payments webhook**, deployment kit for **Kuberns**

> All school-specific facts (address, phone, board, fees, logo) are **clearly-labelled configurable placeholders**, editable from *Dashboard → Settings*.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS 4 + shadcn/ui + lucide-react |
| DB | PostgreSQL (Prisma ORM) — SQLite twin for zero-setup local dev |
| Auth | Auth.js (NextAuth v4) — credentials + JWT, httpOnly cookies, lockout, rate limiting |
| Validation | Zod on every API endpoint + server-side RBAC |
| PDFs | jsPDF (server-side receipts / invoices, duplicate-marked) |
| Payments | Provider-agnostic abstraction + Razorpay-style placeholder (HMAC-verified webhook, idempotent) |

## Quick start (local, no Docker)

```bash
cp .env.example .env            # fill DATABASE_URL / NEXTAUTH_SECRET
npm install
npx prisma generate --schema prisma/schema.prisma
npx prisma db push              # PostgreSQL
npm run db:seed                 # demo data (see below)
npm run dev                     # http://localhost:3000
```

**Zero-PostgreSQL local trial (SQLite):**

```bash
npx prisma db push --schema prisma/schema.sqlite.prisma
npx prisma generate --schema prisma/schema.sqlite.prisma
bun prisma/seed.ts              # seeds + prints demo logins
npm run dev
```

### Demo logins (password: `School@123`)

| Role | Email |
|---|---|
| Super Admin / Owner | owner@spinternational.example |
| Principal | principal@spinternational.example |
| Admission Counsellor | counsellor@spinternational.example |
| Accountant | accounts@spinternational.example |
| Teacher / Class Teacher | teacher@… / classteacher@… |
| Front Desk | frontdesk@spinternational.example |
| Parent / Student | parent@… / student@… |
| IT Admin | itadmin@spinternational.example |

## Local development with Docker

```bash
docker compose up --build       # app on :3000, Postgres on :5432
```

## Deployment (Kuberns)

Full runbook: [`docs/DEPLOYMENT-KUBERNS.md`](docs/DEPLOYMENT-KUBERNS.md).

- **Service 1** — this app (Docker, `output: standalone`, healthcheck `/api/health`)
- **Service 2** — Kuberns managed PostgreSQL (private network, persistent disk)
- Set environment variables from `.env.example` in the Kuberns console (never in code)
- Custom domain + HTTPS via Kuberns; DB is never publicly exposed

## Project structure

```
prisma/            schema.prisma (PostgreSQL) · schema.sqlite.prisma · seed.ts
src/lib/           auth · rbac · audit · rate-limit · fee engine · payments · pdf · csv · settings
src/app/(public)/  website: / about academics admissions facilities student-life notices gallery contact policies
src/app/dashboard/ staff ERP: overview · leads · applications · students · classes · attendance · fees/* · reports · notices · users · audit-logs · settings
src/app/portal/    parent/student portal: home · fees (pay online) · notices · profile
src/app/api/       REST: public · admissions · students · classes · attendance · fees · payments · reports · users · settings · audit-logs · health
docs/              product & technical design (24 sections) · Kuberns deployment runbook
```

## Financial safety (highlights)

- Money stored as **integer paise**; invoices/receipts use per-session sequential numbering
- Payments **immutable once CONFIRMED**; corrections only via refund/adjustment workflows
- Concessions & refunds need **Principal/Super-Admin approval** (fully audited)
- Only the **HMAC-verified webhook** finalises online payments (frontend redirects never do)
- Every sensitive action writes an **audit log** (actor, role, before/after, IP, user-agent)

## Documentation

- [`docs/PRODUCT-AND-TECHNICAL-DESIGN.md`](docs/PRODUCT-AND-TECHNICAL-DESIGN.md) — complete 24-section product/technical design (architecture, ERD, API spec, journeys, roadmap, test plan, go-live checklist)
- [`docs/DEPLOYMENT-KUBERNS.md`](docs/DEPLOYMENT-KUBERNS.md) — deployment, backup/restore runbook, monitoring, rollback plan
