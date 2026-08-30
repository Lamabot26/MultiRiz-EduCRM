# Worklog — SP International School ERP (skool.zip)

Project: Complete school digital ecosystem for "SP International School" per uploaded prompt.
Stack: Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui + Prisma + PostgreSQL (prod) / SQLite (local sandbox) + NextAuth v4 (credentials, JWT) + zod + jspdf (receipt PDFs).

Key architecture decisions:
- Canonical schema: `prisma/schema.prisma` (PostgreSQL, for Kuberns). Local variant: `prisma/schema.sqlite.prisma` (same models, sqlite provider). Sandbox uses the sqlite variant for db push/generate.
- All enums implemented as String columns + TS constants in `src/lib/constants.ts` (keeps schema dual-provider compatible). Money stored as integer paise; helpers in `src/lib/money.ts`.
- Auth: NextAuth v4 credentials + JWT session carrying user id/roles; guards in `src/lib/auth-guard.ts`; RBAC matrix in `src/lib/rbac.ts`.
- Edge gating + security headers: `src/proxy.ts` (Next 16 proxy convention; middleware.ts is deprecated in Next 16 and returns empty responses — do not reintroduce).
- Audit framework: `src/lib/audit.ts` writeAudit() — used by every sensitive mutation.
- Rate limiting: in-memory sliding window `src/lib/rate-limit.ts` (no Redis in v1).
- Payment provider abstraction: `src/lib/payments/provider.ts` (Razorpay-style placeholder adapter; webhook HMAC verification; idempotent via payment_gateway_events unique eventId).
- PDFs (receipts/invoices) generated server-side with jspdf via `src/lib/pdf/receipt.ts`.
- Fee engine: `src/lib/fees.ts` (generateInvoices, allocatePayment, evaluateLateFees, recordOfflinePayment — all transactional).
- Sequences: `src/lib/sequences.ts` nextNumberTx (INV/RCP/LEAD/APP per session).
- Route map:
  - Public: `/` `/about` `/academics` `/admissions` `/facilities` `/student-life` `/notices` `/notices/detail?slug=` `/gallery` `/contact` `/policies`
  - Staff: `/login` `/dashboard` (role-aware) `/dashboard/leads|leads/[id]|applications|applications/[id]|students|students/[id]|classes|attendance|fees/*|notices|users|audit-logs|settings|reports`
  - Portal (parent/student): `/portal` `/portal/fees` `/portal/notices` `/portal/profile`
  - APIs: `/api/health` `/api/auth/[...nextauth]` `/api/public/*` `/api/admissions/*` `/api/students*` `/api/classes*` `/api/attendance*` `/api/users*` `/api/settings*` `/api/notices*` `/api/events*` `/api/sessions*` `/api/audit-logs*` `/api/fees/*` `/api/payments/*` `/api/reports/[type]`
- Shared client helper: `src/components/dashboard/api.ts` apiFetch().
- Demo logins (password School@123): owner@ / principal@ / counsellor@ / accounts@ / teacher@ / classteacher@ / frontdesk@ / parent@ / student@ / itadmin@ @spinternational.example

---
Task ID: 1
Agent: main
Task: Foundation (schema, libs, theme, auth skeleton)

Work Log:
- Prisma schema (60 models) canonical Postgres + sqlite twin; pushed + generated.
- Libs: constants, rbac, auth (NextAuth v4), auth-guard, audit, rate-limit, settings, money, date-utils, api-helpers, sequences, csv, fees engine, payments provider, pdf receipt/invoice, validation (zod).
- Theme tokens: deep academic blue primary + warm gold accent; navy sidebar tokens; hero/gold gradient utilities.
- Root layout metadata; login page; health endpoint; proxy.ts security headers + edge gating.
- Seed: school, sessions, roles/permissions from RBAC matrix, 10 demo users, classes/sections, lead sources, fee components/categories, fee structure, 5 students (+guardian, approved contacts), invoices + one paid payment/receipt, 7 leads, notices/events, gallery albums, website policy pages, number sequences synced.

Stage Summary:
- Foundation verified: /api/health 200, credentials login returns JWT session w/ roles, public enquiry creates lead LEAD-2026-27-000008, edge gating redirects anon /dashboard → /login, seed idempotent-ish, lint clean.

---
Task ID: 2
Agent: full-stack-developer (public website)
Task: Public school website (10 pages + SEO + public APIs)

Work Log:
- Created (public) route group: layout (header/footer w/ settings), home (hero, programmes, why-us, facilities, principal, testimonials, gallery/notices previews, JSON-LD), about, academics, admissions (+enquiry form), facilities, student-life, notices list + detail, gallery, contact (+contact form), policies hub reading WebsitePage rows.
- Components: site-header (Sheet mobile nav), site-footer (sticky), enquiry-form (posts /api/public/enquiries w/ honeypot+consent), contact-form.
- APIs: /api/public/notices, /api/public/events (rate-limited via withApi).
- SEO: per-page metadata, sitemap.ts, robots.ts.

Stage Summary:
- Public website complete; premium blue/gold design; server components fetch via prisma; enquiry + contact forms functional.

---
Task ID: 3
Agent: full-stack-developer (dashboard shell + admission CRM)
Task: Dashboard shell, role-aware overview, leads CRM, applications

Work Log:
- dashboard/layout.tsx + shell.tsx: navy sidebar (Sheet on mobile), permission-filtered nav, user menu + sign out.
- /dashboard: role-aware metric cards (students, leads pipeline, collections, defaulters, follow-ups, audit feed), denied banner.
- /dashboard/leads: stats strip, table+kanban views (HTML5 DnD stage moves), filters, create/edit dialog w/ duplicate 409 flow, CSV import/export/template, bulk assign + bulk communicate.
- /dashboard/leads/[id]: info/stage/assignment, follow-ups (schedule/complete), activity timeline, campus visits, lost-reason flow, convert-to-application.
- /dashboard/applications (+[id]): status workflow, document checklist verify, decisions (offer/reject/waitlist), convert-to-student (auto admission number).
- APIs: leads CRUD + followups + activities + visits + convert + import/export + bulk-assign + communicate; applications CRUD + documents + decision + convert; counsellors list; sessions list.
- Components: kanban-board, lead-form-dialog, lead-detail-actions, status-badge, page-header, api.ts helper.

Stage Summary:
- Admission CRM complete end-to-end (lead → application → student), all mutations audited, counsellor/front-desk scoping enforced server-side.

---
Task ID: 4
Agent: full-stack-developer (SIS + admin ops)
Task: Students, classes, attendance, notices/events, users, audit logs, settings

Work Log:
- /dashboard/students (+[id] tabs: Overview, Guardians, Approved Contacts w/ immutable audit trail, Documents, Fee Account, Attendance, Status History), add/edit dialogs, CSV export.
- /dashboard/classes (class cards + sections + class teacher + sessions mgmt), /dashboard/attendance (roster marking grid w/ transactional upserts + weekly summary), /dashboard/notices (notices + events manager), /dashboard/users (create/edit/roles/active), /dashboard/audit-logs (filters + JSON previews + CSV), /dashboard/settings (school profile form w/ colors/socials/flags + data management exports).
- APIs: students CRUD + guardians + approved-contacts (dual audit) + documents; classes + sections; attendance GET/POST; notices/events CRUD; users CRUD w/ last-super-admin & self-lock guards; settings PUT; audit-logs; students/export.

Stage Summary:
- SIS + admin ops complete; approved-contact workflow audit-ready for future smart-card integration; least-privilege enforced in every API.

---
Task ID: 5
Agent: main
Task: Fee management + parent/student portal + reports

Work Log:
- APIs: fee structures CRUD+assign, invoice generate (idempotent bulk), invoice detail+PDF, offline payments (+auto allocation + receipt), concessions request/decision (auto ledger application), refunds request/approve/process (payment REFUNDED transition), late-fee rules+evaluate, student ledger, payments create-order (order→invoice mapping persisted), verified webhook (HMAC + idempotent via payment_gateway_events), demo-only simulate path, reports CSV (19 types, permission-split), portal update-requests.
- Pages: fees/structures (create w/ items repeater + assign dialog), fees/invoices (stats + generate wizard + filters + late-fee evaluate), fees/invoices/[id] (items, summary, payments w/ receipt PDF + duplicate issue, concessions w/ approve), fees/payments (collections dashboard + mode mix + record payment), fees/concessions, fees/refunds, reports center (grouped cards, financial gated).
- Portal: layout (mobile-first nav), home (children cards w/ dues + attendance + notices), fees (invoices + Pay Online demo flow + receipts PDF), notices, profile (masked data, approved contacts, update-request form).

Stage Summary:
- Full fee module + portals complete; financial controls enforced (immutability, approvals, audits); lint clean.

- Docs & deployment kit: README (quickstart, demo logins, structure, financial safety), docs/PRODUCT-AND-TECHNICAL-DESIGN.md (24 sections per spec Q), docs/DEPLOYMENT-KUBERNS.md (setup, migrations, backups/restore runbook, monitoring, rollback, hardening checklist), Dockerfile (multi-stage standalone + healthcheck), docker-compose.yml (local only), .dockerignore, .env.example.
- package.json renamed to sp-international-school-erp v1.0.0 with db:seed / db:push:local scripts.
- Verification (browser + API): all public pages 200; enquiry form end-to-end (LEAD-2026-27-000009 created); owner login → dashboard metrics/audit feed; leads Kanban; invoice/receipt/duplicate PDFs; parent portal (200) with IDOR-safe guardian scoping; full online-payment demo flow (create-order → simulate → CONFIRMED payment + receipt + PAID invoice); reports CSVs (defaulters, leads, receipts).
- Fixes during verification: lucide `Walk`→`Footprints`; NEXTAUTH_SECRET added (stable session decryption); header brand wrap + CTA overflow (nav → 2xl breakpoint, opaque header); parseBody import in create-order; StudentGuardian composite-PK select; invoice-item orderBy (no createdAt column).

Stage Summary:
- Task 5 complete; full platform verified working in sandbox; ready to package as skool.zip.
