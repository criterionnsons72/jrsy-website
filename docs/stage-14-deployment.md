# Stage 14 — Deployment

**Project:** Tailor Master — Virtual Try-On & Custom-Measurement Clothing E-Commerce PWA
**Stage:** 14 of 14 (final)
**Status:** Awaiting approval
**Depends on:** Stage 1–13 (approved)

---

## 1. Objective

Ship-ready production configuration, environment checklist, migrations, monitoring, backup, rollback plan, and the admin + user guides.

## 2. Deliverables (this stage)

- Production **Dockerfiles** (api multi-stage; web Next.js standalone) + `.dockerignore`.
- `deploy/docker-compose.prod.yml` (self-host option; swap for managed services in cloud).
- **Environment checklist** (below).
- Migration & release steps.
- Monitoring, backup, **rollback plan**.
- **Admin guide** (`docs/admin-guide.md`) + **User guide** (`docs/user-guide.md`).

## 3. Build & run (production)

```bash
# Build images (context = repo root)
docker build -f apps/api/Dockerfile -t tailor-api .
docker build -f apps/web/Dockerfile -t tailor-web .

# Or the whole stack (self-host):
docker compose -f deploy/docker-compose.prod.yml up -d --build
```

API listens on 3001 (`/api/v1`, Swagger `/docs`), web on 3000. Put a CDN + TLS terminator (or platform ingress) in front.

## 4. Environment checklist (production)

Set via your platform's secrets manager — **never commit**:

- `DATABASE_URL` (managed Postgres, TLS)
- `REDIS_URL` (managed Redis)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — `openssl rand -base64 48`, rotated
- `CORS_ORIGIN` = public web URL
- `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- `NEXT_PUBLIC_API_URL` (web → api)
- `TRYON_PROVIDER` / `BODYSCAN_PROVIDER` (stay `mock` until a vendor is approved)
- `NODE_ENV=production`

## 5. Database migrations

Run as a **release step** (before new instances serve traffic), not at container start:

```bash
npm run db:migrate:deploy -w apps/api
```

Seed reference data (roles) once per environment; product/demo seed only in non-prod.

## 6. Monitoring & observability

- **Error tracking** (e.g. Sentry) wired to the API's global exception filter + web.
- **Metrics/logs**: request rate, latency, 5xx, queue depth, job success/failure, AI cost/order.
- **Uptime**: probe `GET /api/v1/health` (checks DB); alert on `db: down` or 5xx spikes.
- **Audit logs** retained for privileged actions.

## 7. Backup & recovery

- Managed Postgres **automated backups + PITR**.
- Logical backups via `scripts/backup.sh` (timestamped `pg_dump`, shipped to object storage with retention).
- **Restore drill**: periodically restore into a scratch DB and verify (documented in the script).

## 8. Rollback plan

- **App**: blue/green or rolling deploy; keep the previous image tag. Roll back = redeploy the last-good tag (no DB change needed for app-only issues).
- **Database**: migrations are additive-first. If a migration is bad, roll forward with a fix migration; use PITR only as a last resort for data corruption. Never destructively drop columns in the same release that stops using them.
- **Config/secret**: revert the env change; secrets are versioned in the manager.
- **Feature guard**: keep `TRYON_PROVIDER=mock` to disable any vendor instantly.

## 9. Pre-launch gate (must complete)

- [ ] Load + accessibility (axe/Lighthouse) + penetration test on staging.
- [ ] Real object-storage upload (presigned URLs) + malware scan wired.
- [ ] BullMQ workers deployed (try-on, documents, deletion, analytics rollups).
- [ ] **Qualified-lawyer review** of all legal/consent/privacy copy.
- [ ] Restore drill passed; monitoring alerts firing correctly.

---

## Completion Report — Stage 14

**Completed**

- Production Dockerfiles + `.dockerignore`, prod compose, env checklist, migration/release steps, monitoring/backup/rollback plan, admin + user guides. Pushed.

**Pending (pre-launch, infra + external)**

- Staging test suites, presigned uploads + malware scan, BullMQ workers, lawyer review, restore drill.

**Risks**

- Items above are environment/vendor/legal dependent — sequenced here honestly, not claimed done.

**Manual Actions Required**

- Provision managed Postgres/Redis/object storage + CDN/TLS on your chosen cloud.
- Set all secrets in the secrets manager (rotate the example JWT secrets).
- Add real PWA icons (`apps/web/public/icons/icon-192.png`, `icon-512.png`) and self-host the fonts.
- Connect error tracking + uptime monitoring.
- Have a qualified lawyer review legal/consent copy.

**Project status:** all 14 stages delivered. This completes the staged build.

---

Developed by Syed Rizwan Ahmed
