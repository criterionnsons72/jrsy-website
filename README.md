# Tailor Master

A mobile-first, RTL-ready Progressive Web App for **made-to-measure & customizable clothing**, with virtual try-on (style preview), custom measurements, dynamic pricing, and a workshop → manufacturing workflow.

> **Core principle:** *Style Preview*, *Fit Recommendation*, and *Made-to-Measure Validation* are three separate promises. AI try-on shows look only — never a guaranteed fit.

This repository is built in stages. See [`docs/`](./docs) for the full design record (Stages 1–5). Stage 6 (this) sets up the project foundation.

---

## Tech stack

| Layer | Choice |
|---|---|
| Web (customer / admin / workshop) | Next.js (App Router) · React · TypeScript · Tailwind CSS · PWA |
| API | NestJS (modular monolith) · REST · OpenAPI |
| Data | PostgreSQL · Prisma ORM |
| Cache / queues | Redis · BullMQ |
| Object storage | S3-compatible (MinIO in dev) |
| Tooling | npm workspaces · ESLint · Prettier · Docker · GitHub Actions |

## Monorepo layout

```
tailor-master/
├─ apps/
│  ├─ api/        NestJS modular monolith (REST API, Prisma, auth)
│  └─ web/        Next.js PWA (customer + admin + workshop)
├─ docs/          Design record (Stages 1–5) + tokens + schema sketch
├─ docker-compose.yml   Postgres + Redis + MinIO for local dev
└─ .github/workflows/   CI
```

## Prerequisites

- Node.js **20+**
- npm **10+**
- Docker (for Postgres/Redis/MinIO) — or your own instances

## Quick start

```bash
# 1. Install all workspace dependencies
npm install

# 2. Start local infra (Postgres, Redis, MinIO)
docker compose up -d

# 3. Configure environment
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 4. Set up the database (generate client + run first migration)
npm run db:generate -w apps/api
npm run db:migrate  -w apps/api

# 5. Run everything in dev
npm run dev            # web + api together
# or individually:
npm run dev -w apps/api   # http://localhost:3001  (Swagger at /docs)
npm run dev -w apps/web   # http://localhost:3000
```

## Scripts (root)

| Script | Does |
|---|---|
| `npm run dev` | Run web + api in parallel |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint all workspaces |
| `npm run typecheck` | Type-check all workspaces |
| `npm run test` | Run tests |
| `npm run format` | Prettier write |

## Health check

- API: `GET http://localhost:3001/api/v1/health` → `{ status: "ok" }`
- API docs (OpenAPI/Swagger): `http://localhost:3001/docs`

## Environment

All secrets go through `.env` files (never committed). See `.env.example` files for the full list. Secrets in production come from a secrets manager, not the repo.

## Status

- [x] Stages 1–5 — Discovery → Technical Architecture (see `docs/`)
- [x] Stage 6 — Project Setup: monorepo, env, DB foundation, auth foundation, CI/CD, standards
- [x] Stage 7 — Ecommerce Core: catalog, PDP, cart, order shell (see `docs/stage-7`)
- [x] Stage 8 — Customization Engine: configurator, rules engine, dynamic pricing (see `docs/stage-8`)
- [x] Stage 9 — Measurement & Sizing: body profiles, formula, validation, tailor review + lock (see `docs/stage-9`)
- [x] Stage 10 — Virtual Try-On Adapter: provider-agnostic, mock first, consent, secure delete (see `docs/stage-10`)
- [x] **Stage 11 — Order & Production**: state machine, workshop dashboard, documents, QC (see `docs/stage-11`)
- [ ] Stage 12 — Admin & Reporting
- [ ] … (see `docs/`)

---

Developed by Syed Rizwan Ahmed
