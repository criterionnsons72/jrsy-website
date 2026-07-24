# Stage 5 — Technical Architecture

**Project:** Tailor Master — Virtual Try-On & Custom-Measurement Clothing E-Commerce PWA
**Stage:** 5 of 14 (Technical Architecture)
**Status:** Awaiting approval
**Depends on:** Stage 1–4 (approved; Stage 4 color theme fixed)

> Delivered as an interactive architecture page (system diagram, ERD, API, jobs, adapters, security, deployment). See chat for the live link. A Prisma schema **sketch** is included at `docs/prisma-schema-sketch.prisma`.

---

## 1. Objective
Turn the approved product & design into a buildable technical plan: system shape, data model, APIs, background work, storage, security, deployment, and the adapter seams that keep vendors out of the core.

## 2. Deliverables
System diagram · modules · database design (+ Prisma sketch) · API design · background jobs · storage · security · deployment · integration adapters.

## 3. System shape
**Modular Monolith (NestJS)** — one deployable app, clean module boundaries, ready to split into microservices later. Clients (Customer PWA, Admin console, Workshop app — all Next.js) → Edge (CDN + WAF + rate limit + API gateway) → Application modules → Data & Infra (PostgreSQL, Redis, Object storage, Queue workers) → External providers **behind adapters only**.

## 4. Modules
identity · customer · body-profile · catalog · configurator · pricing · measurement · tryon · cart/checkout · order · production · documents · notifications · admin/analytics · security. Each owns its tables and exposes a service interface; cross-module access via services, never each other's tables.

## 5. Database (PostgreSQL + Prisma)
- Relational & typed for everything financial/measured; **JSONB** for config schemas, rules, and the frozen order snapshot.
- Key entities: User/Role/Permission, Customer, BodyProfile, Measurement (body|garment|final), Product/Variant/Fabric, ConfigSchema (versioned), PriceSnapshot, Cart/CartItem, **Order + immutable snapshot**, ProductionTask, Document, TryOnJob/BodyScanJob, ConsentRecord, DataDeletionRequest, AuditLog (append-only), Payment, ReturnRemake, Coupon, Notification.
- **Immutability:** the Order snapshot is denormalised & frozen at placement; later body-profile edits never change past orders.
- Sketch: `docs/prisma-schema-sketch.prisma` (placeholder — real migrations in Stage 6).

## 6. API design
REST under `/api/v1`, OpenAPI-documented, DTO/Zod-validated, audited. Highlights:
`POST /auth/login` · `GET /products[/:id]` · `GET /products/:id/config-schema` · `POST /pricing/quote` · `POST /body-profiles` + `/:id/measurements` · `POST /measurements/:id/validate` · `POST /tryon/jobs` · `GET /tryon/jobs/:id` · `DELETE /tryon/jobs/:id/assets` · `POST /cart/items` · `POST /checkout` · `PATCH /orders/:id/measurement/lock` (role-gated) · `PATCH /production/tasks/:id/stage` · `GET /orders/:id/documents/:type` · `POST /privacy/delete-request`.

## 7. Background jobs (BullMQ + Redis)
`tryon.process` (quality check → adapter → store → notify → cost) · `upload.scan` (malware + validation) · `documents.render` (Tech Pack/BOM/QC PDF) · `notifications.send` · `assets.delete` (secure delete + retention) · `analytics.rollup` (KPIs, AI cost/order). All with retries, backoff, dead-letter.

## 8. Integration adapters
Interfaces: `TryOnProvider` (createTryOnJob / getTryOnStatus / getTryOnResult / deleteTryOnAssets), `BodyScanProvider` (startBodyScan / getBodyMeasurements), `PaymentProvider`, `NotificationProvider`. Bound at runtime by env (`TRYON_PROVIDER=mock|pictofit|…`). **Mock ships first**; no vendor names in core. Every provider call logs cost + latency.

## 9. Security & privacy
Explicit consent before image processing · TLS + encryption at rest · signed short-lived URLs · RBAC on every route · append-only audit logs · retention + auto-delete · Delete-My-Data / Delete-Image · rate limiting + WAF · malware scan + file validation · Zod/DTO input validation, CSRF, XSS, SQLi-safe (Prisma) · secrets manager · backups + tested recovery. **Legal/consent copy is placeholder — requires qualified-lawyer review.**

## 10. Deployment
Docker images · CI/CD (lint/typecheck/unit → build/integration/e2e → image scan/sign → staging migrate/smoke → prod blue-green + rollback) · managed PostgreSQL (backups/PITR) · managed Redis · object storage + CDN · autoscaled worker pool · monitoring (metrics/logs/error tracking/alerts). Cloud choice (AWS/Azure/GCP) finalised in Stage 14.

---

## Completion Report — Stage 5

**Completed**
- System diagram, module responsibilities, database design + Prisma sketch, API surface, job queues, adapter interfaces, security checklist, deployment pipeline. Architecture page published; docs saved (`stage-5-technical-architecture.md`, `prisma-schema-sketch.prisma`).

**Pending**
- Your approval to proceed to Stage 6 (Project Setup).
- Confirm cloud provider preference (or defer to Stage 14).

**Risks**
- Monolith module discipline must hold (enforced via lint boundaries / service interfaces).
- Snapshot immutability must be guaranteed at the DB/service layer — carried as a build-time invariant.

**Decisions required**
1. Approve modular-monolith + Postgres/Prisma/Redis/S3 stack.
2. Approve the adapter-first approach (mock providers first).
3. Cloud provider now, or defer to Stage 14? (default: defer.)

**Exact next step**
On approval → **Stage 6 — Project Setup**: repository structure (monorepo), environment configuration, database foundation (Prisma init + first migration), authentication foundation, CI/CD, coding standards, README — with the Stage 4 tokens wired into the Tailwind theme.

---

Developed by Syed Rizwan Ahmed
