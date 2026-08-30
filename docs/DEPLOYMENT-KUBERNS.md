# Kuberns Deployment Runbook — SP International School ERP

Target topology (per the project brief):

| Service | Spec |
|---|---|
| **App** (this repo) | 1× Next.js standalone container, port 3000, healthcheck `/api/health`, custom domain + HTTPS |
| **Database** | 1× managed PostgreSQL on Kuberns, **private networking only**, persistent disk enabled |

## 1. One-time setup

1. Create Kuberns project **`sp-international-school`**.
2. Add **PostgreSQL** service → enable **persistent storage** → keep it **private** (no public exposure).
3. Link the GitHub repo → Kuberns builds from the `Dockerfile`.
4. Configure the custom domain; Kuberns provisions HTTPS.
5. Set environment variables (Service → Settings → Environment, encrypted):

```env
# NOTE: when you add Kuberns' managed PostgreSQL from the database panel,
# DATABASE_URL is auto-injected (private network + SSL). Set it manually
# only if you are overriding with your own Postgres.
# DATABASE_URL=postgresql://<user>:<pass>@<kuberns-internal-host>:5432/<db>?schema=public
NEXTAUTH_URL=https://<your-domain>
NEXTAUTH_SECRET=<openssl rand -hex 32>
NEXT_PUBLIC_SITE_URL=https://<your-domain>
PAYMENT_GATEWAY_KEY_ID=<from gateway dashboard>        # optional at launch
PAYMENT_GATEWAY_KEY_SECRET=<from gateway dashboard>    # optional at launch
PAYMENT_GATEWAY_WEBHOOK_SECRET=<from gateway dashboard># optional at launch
UPLOAD_DIR=/data/uploads                               # persistent disk mount
```

> ⚠️ Never put secrets in the repo. No credentials are hard-coded anywhere in the codebase.

## 2. First deployment

```bash
git push origin main          # Kuberns builds & starts the container
```

The container start command runs `npx prisma migrate deploy` and falls back to `npx prisma db push --accept-data-loss` on a fresh database.

> If deploying via Kuberns' native Node builder (no Dockerfile), run these once after the first deploy — from the service **Console / one-off command** (or temporarily override the Start Command):
>
> ```bash
> npx prisma db push            # create schema on a fresh database
> npm run db:seed:prod          # roles, permissions, demo users (tsx)
> ```
>
> Then revert the Start Command to `node .next/standalone/server.js`.

Then:

1. Open the site → verify `/api/health` returns `{"status":"healthy"}`.
2. Sign in with the seeded Super Admin (change the password immediately, or create real users and delete demo accounts).
3. Fill **Dashboard → Settings** (school name, address, contacts, colours, policies).
4. Create master data: academic session (mark current), classes, sections, fee components, fee structures.
5. Register the payment webhook URL at the gateway: `https://<your-domain>/api/payments/webhook`.

## 3. Migrations

- Development: `prisma db push` (fast iteration).
- From v1 → production: `npx prisma migrate dev --name init` once, commit `prisma/migrations/`, subsequent deploys run `migrate deploy` automatically.
- Risky changes: expand → migrate → contract; never destructive in the same release.

## 4. Backups (mandatory)

1. Enable Kuberns managed DB backups.
2. Independent encrypted exports (store OUTSIDE the app/db runtime — e.g. object storage):

```bash
pg_dump "$DATABASE_URL" --no-owner --format=custom -f spis-$(date +%F).dump
openssl enc -aes-256-cbc -pbkdf2 -salt -in spis-$(date +%F).dump -out spis-$(date +%F).dump.enc -pass env:BACKUP_PASSPHRASE
```

3. **Retention policy:** 7 daily, 4 weekly, 3 monthly.
4. **Restore drill quarterly — an untested backup is not a backup.**

### Restore steps

```bash
# 1. Provision/point to a fresh Postgres (or restore in place after stopping the app)
# 2. Decrypt and restore
openssl enc -d -aes-256-cbc -pbkdf2 -in spis-YYYY-MM-DD.dump.enc -out spis.restore.dump -pass env:BACKUP_PASSPHRASE
pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" spis.restore.dump
# 3. Start the app service; verify /api/health and a login + sample invoice
```

## 5. Monitoring & alerts

- Kuberns: CPU, RAM, disk, usage/budget alerts (enable all).
- App: `/api/health` (app + database check) — use as Kuberns health probe.
- Logs: structured server logs + `error_logs` table (visible via DB or the audit/report exports).
- Watch: DB connection count, storage growth (uploads), failed-login spikes (audit log action `LOGIN_FAILED`).

## 6. Rollback plan

1. Redeploy the previous successful image/commit tag in Kuberns (kept for at least 3 releases).
2. If a migration shipped, restore the pre-migration backup dump (migrations are forward-only).
3. Payments: the webhook is idempotent; replayed events after recovery are safe.

## 7. Production hardening checklist (Phase 6)

- [ ] Permission spot-check for all 10 roles (least privilege confirmed)
- [ ] Payment gateway sandbox end-to-end + webhook replay test
- [ ] Backup restore rehearsal passed
- [ ] Load test (≈200 concurrent reads / 50 writes)
- [ ] Mobile responsiveness + accessibility pass
- [ ] Demo accounts removed; strong passwords enforced
- [ ] Custom domain HTTPS active; security headers verified (`curl -I`)
- [ ] UAT sign-off recorded
