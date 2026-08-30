# SP International School — Product & Technical Design

*Complete design record for the school digital ecosystem, ordered per the project brief (sections 1–24).*

---

## 1. Product summary

A single full-stack Next.js application serving the public website, staff ERP (admissions CRM, student information system, fee management, attendance, communication, reports, administration) and the parent/student portal, backed by one managed PostgreSQL database. The product goals are: capture and convert more admission enquiries, systematic follow-ups, a single reliable student record from enquiry to alumni, controlled fee workflows with accurate invoices/receipts, parent self-service, elimination of Excel operations, full auditability, and ease of use for non-technical staff — all in an affordable one-app + one-database Kuberns deployment.

## 2. Assumptions and configurable placeholders

Unknown school facts are never hard-coded. They live in the `Setting` table (`school.profile` JSON) editable from **Dashboard → Settings**, with safe `[placeholder]` defaults: school name/logo/colors, address & contact numbers, email addresses, working hours, board affiliation, establishment year, social links, map embed, admission-open flag, session label, principal name/message, fee & refund policy notes. Website policy pages (privacy/refund/terms/child-safety/fee) are `WebsitePage` rows with placeholder bodies until the school supplies content. Age criteria, fee tables, prospectus file, gallery photos and testimonials are placeholders managed from the dashboard.

## 3. Information architecture

**Public:** `/` (home) · `/about` · `/academics` · `/admissions` (+ enquiry form) · `/facilities` · `/student-life` · `/notices` (+ detail) · `/gallery` · `/contact` · `/policies` (5 policies)
**Auth:** `/login`
**Staff (`/dashboard`, permission-filtered nav):** Overview · Leads (table+Kanban, detail) · Applications (detail) · Students (list, detail tabs) · Classes · Attendance · Fees (Structures, Invoices+detail, Collections, Concessions, Refunds) · Reports · Notices/Events · Users · Audit Logs · Settings
**Portal (`/portal`):** Home (children cards) · Fees (invoices, pay online, receipts) · Notices · Profile (approved contacts, update requests)
**System APIs:** `/api/health`, `/api/auth/*`, plus the REST surface in section 11.

## 4. User roles and permission matrix

Roles: `SUPER_ADMIN`, `PRINCIPAL`, `ADMISSION_COUNSELLOR`, `ACCOUNTANT`, `TEACHER`, `CLASS_TEACHER`, `FRONT_DESK`, `PARENT`, `STUDENT`, `IT_ADMIN`. The runtime matrix is `src/lib/rbac.ts` (least-privilege; anything not granted is denied) and is mirrored into `roles/permissions/role_permissions` tables for future configurability. Highlights (SA=Super Admin, PR=Principal, AC=Admission Counsellor, ACC=Accountant, TE=Teacher, CT=Class Teacher, FD=Front Desk, PA=Parent, ST=Student, IT=IT Admin):

| Capability | SA | PR | AC | ACC | TE | CT | FD | PA | ST | IT |
|---|---|---|---|---|---|---|---|---|---|---|
| Leads (all / write / assign) | ● | ● | ● | – | – | – | own | – | – | ● |
| Applications & conversion | ● | ● | ● | – | – | – | – | – | – | – |
| Students read (all/limited) | ● | ● | ● | ● | lim | lim | lim | own | own | ● |
| Approved contacts manage | ● | – | – | – | – | ● | – | read | – | – |
| Fee structures / invoice gen | ● | – | – | ● | – | – | – | – | – | ● |
| Offline payments / receipts | ● | – | – | ● | – | – | – | – | – | – |
| Concession request / approve | ● | ● | – | req | – | – | – | – | – | – |
| Refund request / approve | ● | ● | – | req | – | – | – | – | – | – |
| Online pay (own children) | – | – | – | – | – | – | – | ● | – | – |
| Users / settings / audit | ● | audit | – | – | – | – | – | – | – | ● |

## 5. Detailed user journeys (key flows)

**Enquiry → Admission (public parent):** parent submits enquiry form (rate-limited, honeypot, privacy consent) → lead created `NEW` with source `WEBSITE_FORM` + audit → counsellor calls (activity logged), schedules follow-ups → campus visit → application created from lead (document checklist verified) → decision `OFFER` → `ACCEPT` converts to a Student with sequential admission number → fee structure assigned → invoices generated → parent pays.

**Fee collection (accountant):** create fee structure per class/session → assign to students → bulk-generate invoices (idempotent per student+period) → record offline payment (cash/cheque/transfer/UPI) → receipt PDF prints instantly → payment auto-allocates to oldest outstanding invoices → invoice status transitions ISSUED → PARTIALLY_PAID → PAID; overdue invoices evaluated for late fees.

**Parent online payment:** parent opens *Portal → Fees* → Pay Online → `POST /api/payments/create-order` validates ownership + balance → gateway order → gateway webhook (HMAC-verified, idempotent) → immutable Payment CONFIRMED → allocation → receipt → audit. *(In demo mode — no gateway keys — a simulate endpoint runs the identical transactional path.)*

**Approved contact (class teacher):** add contact (PENDING) → approver approves with an immutable audit trail in `approved_contact_audits` → contact usable by future smart-card calling system.

## 6. Screen/page inventory

Public (10) · Login (1) · Dashboard overview (1) · Leads (2 + Kanban view) · Applications (2) · Students (2) · Classes (1) · Attendance (1) · Fees (6: structures, invoices, invoice detail, collections, concessions, refunds) · Reports center (1) · Notices/Events (1) · Users (1) · Audit Logs (1) · Settings (1) · Portal (4). Total ≈ 35 screens, all responsive, keyboard accessible, print-friendly where relevant (receipts, reports).

## 7. Wireframe descriptions (major pages)

- **Home:** slim contact strip → opaque navbar (logo, nav, Parent Login, gold Apply CTA, hamburger below 1536px) → navy gradient hero (badge, headline, 2 CTAs, stat placeholders) → programmes (4 cards) → why-us (6 icon cards) → facilities (6) → principal quote → testimonials (3 placeholders) → gallery preview → notices/events preview → gold CTA band → footer (address/socials/policies/quick links), sticky-to-bottom.
- **Leads list:** stat strip (pipeline counts) → toolbar (search, status/source/priority/counsellor filters, Create, Import/Export CSV, Template, bulk assign) → table or Kanban (open-status columns + collapsed closed column, drag to move stage).
- **Lead detail:** left — info card, stage select, reassign, priority; right — next follow-up card, activity timeline, add note/call, campus visits, follow-up list, convert-to-application CTA.
- **Students list:** filters + stats → table (avatar, admission #, class-section, guardian mobile, status) → add dialog. **Student detail:** tabs Overview / Guardians / Approved Contacts (with immutable audit trail) / Documents / Fee Account / Attendance / Status History.
- **Invoice detail:** header actions (PDF, record payment, request concession) · items table · totals card (subtotal/late fee/discount/paid/balance) · payments list with receipt PDF + duplicate · concessions with approve/reject.
- **Portal Fees:** child switcher → outstanding card → invoices table with Pay Online → receipts with PDF downloads → policy note.
- **Attendance:** class/section/date selectors → roster grid with PRESENT/ABSENT/LATE/LEAVE radios → save (transactional upsert) → weekly summary.

## 8. Design system specification

Tokens (globals.css): primary deep academic blue `oklch(0.38 0.12 265)` (#1e3a8a), accent warm gold/saffron `oklch(0.63 0.13 65)` (#b45309), support white/soft grey/dark slate, success green, warning amber, destructive red; radius 0.625rem; navy sidebar tokens. Typography: Geist sans, clear hierarchy, tabular numerals for money. Components: shadcn/ui (New York), Lucide icons. Utilities: `sp-hero-gradient`, `sp-gold-gradient`, `sp-card-shadow`, `sp-prose`. Rules: cards p-4/p-6 gap-4/6, min 44px touch targets, visible focus rings, tables wrapped in overflow-x-auto, DD-MM-YYYY dates, ₹ formatting via `rupees()`.

## 9. Database ERD description

Six domains, 60 tables (all UUID PKs, timestamps, FK constraints, indexes per the brief's section K):

- **Core:** `schools` 1—n `academic_sessions`; `users` n—n `roles` (via `user_roles`), `roles` n—n `permissions` (`role_permissions`); `audit_logs` (append-only); `settings`.
- **Admissions:** `lead_sources` 1—n `admission_leads` 1—n `lead_activities` / `lead_followups` / `campus_visits`; leads 1—n `admission_applications` 1—n `application_documents` / `admission_decisions`; application 1—1 converted `students`.
- **Students:** `students` n—n `guardians` (`student_guardians`, isPrimary); `approved_contacts` 1—n `approved_contact_audits` (append-only); `classes` 1—n `sections` 1—n `class_assignments`; `student_documents`; `student_status_history`.
- **Fees:** `fee_structures` (session×class) 1—n `fee_structure_items` → `student_fee_assignments` → `invoices` 1—n `invoice_items`; `payments` 1—n `payment_allocations` n—1 `invoices`; `receipts` (duplicate-marked); `concessions`, `refunds`, `fee_adjustments`, `late_fee_rules`, `payment_gateway_events` (idempotency), `number_sequences`.
- **Attendance:** `attendance_sessions` (class+section+date unique) 1—n `attendance_records` (unique per session+student).
- **Communication/Content/System:** `notices`, `events`, `notification_templates`, `communication_logs`, `parent_messages`; `media_files`, `gallery_albums/items`, `website_pages/navigation`, `site_settings`; `jobs/job_runs/error_logs/data_exports/backup_logs`.

Unique constraints: admission numbers, invoice/receipt/lead/application numbers, session names, class+section names, gateway event ids, user emails. Performance indexes on mobile, email, admission number, status fields, due dates, session/class, entity+id pairs (see `@@index` blocks in the schema).

## 10. Complete Prisma schema

See **`prisma/schema.prisma`** (canonical PostgreSQL; `prisma/schema.sqlite.prisma` is the generated twin for local no-Docker dev). It implements every table in the brief's section K plus `number_sequences`. Money = integer paise. Enum-like columns are Strings validated by zod + `src/lib/constants.ts` for provider portability (documented in-file).

**Migration strategy:** development uses `prisma db push`; production uses `prisma migrate` — first deploy: `npx prisma migrate dev --name init`, commit `prisma/migrations/`, then the Kuberns start command runs `prisma migrate deploy`. Breaking changes ship as expand → migrate → contract steps.

## 11. API architecture and endpoint specification

Style: REST route handlers with a uniform envelope `{ success, data | error }`; `withApi()` enforces authentication → permission → rate limit → zod validation → error mapping; every mutation writes an audit log; financial mutations are `$transaction`-wrapped.

```
Public    POST /api/public/enquiries · POST /api/public/contact · GET /api/public/notices · GET /api/public/events
Admissions GET/POST /api/admissions/leads · GET/PATCH /api/admissions/leads/:id
           POST /api/admissions/leads/:id/followups|activities|visits|convert
           POST /api/admissions/leads/bulk-assign|communicate|import · GET …/export(?template=1)
           GET/POST /api/admissions/applications · GET/PATCH /:id · POST /:id/documents|decision|convert
           GET /api/admissions/counsellors · GET /api/sessions
Students  GET/POST /api/students · GET/PATCH /api/students/:id · POST /:id/guardians|documents
           GET/POST /:id/approved-contacts · PATCH/DELETE /:id/approved-contacts/:cid · GET /api/students/export
Academics GET/POST /api/classes · POST /api/classes/:id/sections · GET/POST /api/attendance
Fees      GET/POST /api/fees/structures · PATCH/DELETE /:id · POST /:id/assign
           POST /api/fees/invoices/generate · GET /api/fees/invoices · GET/PATCH /:id · GET /:id/pdf
           POST /api/fees/payments/offline · GET /api/fees/payments/:id/receipt(?duplicate=1)
           GET/POST /api/fees/concessions · POST /:id/decision
           GET/POST /api/fees/refunds · POST /:id/decision
           GET/POST /api/fees/late-fees · POST /api/fees/late-fees/evaluate
           GET /api/fees/student-ledger/:studentId
Payments  POST /api/payments/create-order · POST /api/payments/webhook · POST /api/payments/webhook/simulate (dev only)
Reports   GET /api/reports/[type] (19 types → CSV; financial types permission-gated)
Admin     GET/POST /api/notices(/:id) · /api/events(/:id) · GET/POST /api/users(/:id) · GET/PUT /api/settings
           GET /api/audit-logs · POST /api/portal/update-requests
System    GET /api/health (liveness + readiness)
```

Errors: `401` unauthenticated · `403` permission denied · `404` scoped-not-found · `409` duplicates (lead duplicate detection returns the existing lead) · `422` validation (zod) · `429` rate-limited (retryAfterMs) · `500` logged to `error_logs`. Payment webhooks are idempotent via unique `eventId`; financial endpoints are transaction-safe.

## 12. Authentication and security plan

Auth.js (NextAuth v4) credentials + JWT (8h), httpOnly/SameSite=Lax/Secure-in-prod cookies, bcrypt cost 12, progressive lockout (5 fails → 15 min), password reset & email-verification architecture ready (OTP/MFA future). Edge `proxy.ts` sets security headers (CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) and gates `/dashboard` + `/portal`; every page/API re-checks server-side. Zod validation everywhere; authorisation enforced server-side (client role/id/amount never trusted); Prisma parameterised queries; UUIDs prevent ID enumeration; portal access is guardian↔student-link verified (`src/lib/access.ts`); uploads MIME-allowlisted, ≤10MB, non-guessable UUID paths; public forms honeypot + per-IP rate limits + privacy consent; audited data exports; append-only audit log (actor, role, before/after, IP, user-agent) covering logins, failures, user/role changes, student & contact edits, admission stages, fee changes, invoices, payments, receipts (incl. duplicates), concessions, refunds, exports, settings, documents.

## 13. Fee-management workflow and financial controls

Structures (session×class; components with frequency/installments/due-day) → assignment → bulk generation (idempotent, periods 1–12) → allocation engine (FIFO by due date; partial payments & advances) → late-fee rules (fixed/percent-per-day/percent-per-month, grace, cap). Controls: payments immutable once CONFIRMED; refunds require request→approve→process (payment → REFUNDED); concessions require request→approve with automatic invoice application; fee edits audited before/after; approval levels enforced in API permissions; integer-paise math; sequential invoice/receipt numbering per session (`INV-2025-26-000123`).

## 14. Payment-gateway webhook design

`PaymentProvider` interface: `createOrder / verifyPaymentSignature / verifyWebhook / getPaymentStatus / refundPayment`. v1 ships a Razorpay-style placeholder (HMAC-SHA256, timing-safe) configured purely via `PAYMENT_GATEWAY_*` env vars. Flow: create-order validates ownership/balance and persists the order→invoice mapping (`payment_gateway_events`, `ORDER_CREATED`) → gateway calls `/api/payments/webhook` → raw-body HMAC verification → idempotency via unique eventId → transaction: immutable Payment CONFIRMED + allocation + receipt → event PROCESSED + audit. Frontend redirects never confirm payments. Without keys the system runs in labelled demo mode (simulate endpoint uses the same transactional path).

## 15. File/document storage design

`media_files` / `student_documents` / `application_documents` store metadata; binaries live under a non-guessable UUID path (`UPLOAD_DIR`, default `./uploads`) mounted on a Kuberns persistent disk. Uploads are MIME-allowlisted, size-capped, filename-sanitised; access is permission-checked (time-limited links are a drop-in future enhancement). Media soft-delete for recoverability.

## 16. Audit-log design

Append-only `audit_logs`: timestamp, user, role, action, entityType/entityId, before/after JSON summaries (sensitive keys stripped), IP, user-agent. Queryable at *Dashboard → Audit Logs* (filters + CSV, `audit.read`). Specialised trails: `approved_contact_audits` (contact lifecycle, smart-card ready) and `payment_gateway_events` (webhook forensics).

## 17. Kuberns deployment architecture

Service 1: this Next.js app (Docker standalone, port 3000, healthcheck `/api/health`, custom domain + HTTPS). Service 2: managed PostgreSQL (private networking, persistent disk, never publicly exposed). Secrets only as Kuberns environment variables. Runbook: `docs/DEPLOYMENT-KUBERNS.md`.

## 18. Dockerfile and local docker-compose

`Dockerfile`: multi-stage Node 22 Alpine → install → `prisma generate` → `next build` (standalone) → non-root runtime with healthcheck; start command runs `prisma migrate deploy` (falls back to `db push` on first boot) then serves. `docker-compose.yml` (local only): Postgres 16 + app, named volumes for data and uploads.

## 19. Environment variable template

See `.env.example`: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, `PAYMENT_GATEWAY_KEY_ID/KEY_SECRET/WEBHOOK_SECRET`, `UPLOAD_DIR`, `MAX_UPLOAD_MB`. Never commit real secrets.

## 20. Backup, restore, monitoring, disaster recovery

Enable Kuberns DB backups **plus** independent encrypted `pg_dump` exports stored off-runtime; retention 7 daily / 4 weekly / 3 monthly; quarterly restore rehearsals (an untested backup is considered unreliable). Monitoring: `/api/health`, structured logs, `error_logs`, Kuberns CPU/RAM/disk/usage alerts. Rollback: keep the previous image tag; DB recovers point-in-time from backups; `migrate deploy` is forward-only (revert = restore pre-migration dump). Full runbook in `docs/DEPLOYMENT-KUBERNS.md`.

## 21. Phased implementation roadmap

Phase 1 Foundation ✅ (schema, auth, RBAC, design system, website + lead capture, dashboard shell, audit framework, deployment config). Phase 2 Admissions CRM ✅ (pipeline, follow-ups, assignments, applications, document checklist, conversion). Phase 3 Student Management ✅ (profiles, guardians, approved contacts, classes, documents, portal foundation). Phase 4 Fee Management ✅ (structures, invoices, offline payments, gateway + webhook, receipts, ledger, defaulter/collection reports, approvals). Phase 5 Attendance & Communication — attendance + notices/events ✅; Email/SMS/WhatsApp sending = future integration via `notification_templates` + `communication_logs`. Phase 6 Production hardening — checklists executed at go-live.

## 22. Test plan

**Verified during this build:** health endpoint; login incl. lockout counters; RBAC denials per role; enquiry form (validation, honeypot, duplicates, rate limit, consent); lead pipeline create→follow-up→visit→application→decision→convert with audit rows; student CRUD + approved-contact audit trail; fee structure→assign→generate→offline payment→receipt PDF→duplicate receipt; online payment create-order→webhook path→idempotency; late-fee evaluation; reports CSV (permission-gated); parent portal scoping (IDOR attempts denied).
**Recommended QA matrix at go-live:** per-role happy paths (10 roles × core flows), gateway sandbox end-to-end, browser matrix (Chrome/Safari/Firefox, Android/iOS), load test (≈200 concurrent reads / 50 writes), accessibility pass (keyboard-only, screen reader), backup-restore rehearsal.

## 23. Go-live checklist

1. Kuberns project `sp-international-school`; Postgres service with persistent disk, private networking. 2. Env vars set (strong `NEXTAUTH_SECRET`; real gateway keys when available). 3. Custom domain + HTTPS. 4. `prisma migrate deploy`; seed master data (classes, sessions, fee components) via dashboard. 5. Create real staff users; remove demo accounts. 6. Fill school settings (name, logo, address, contacts, policies). 7. Register payment webhook URL at the gateway. 8. Backups enabled + first restore test. 9. Monitoring/alerts on. 10. Security review (headers, permission spot-checks) + UAT sign-off.

## 24. Future enhancements

Email/SMS/WhatsApp providers via `notification_templates` + queue; smart-card calling integration fed by `approved_contacts`; ID cards & certificates (PDF); exams/results module; timetable; transport & hostel modules (placeholder fields ready); MFA/OTP login; multi-school tenancy (schema already school-scoped); Redis-backed rate limiting/caching for multi-instance scale; PWA push notifications for parents; BI dashboards over `audit_logs`/`data_exports`.
